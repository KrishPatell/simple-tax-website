const express = require('express');
const router = express.Router();
const { insert, select, update } = require('../lib/supabase');
const { sendNewLeadEmail, sendPaymentEmail } = require('../lib/email');

// Debt range midpoints for calculations
const DEBT_MID = {
  under5: 3000,
  s5to10: 7500,
  s10to25: 17500,
  s25to50: 37500,
  s50to100: 75000,
  s100plus: 125000
};

const INC_MID = {
  under30: 22500,
  s30to50: 40000,
  s50to75: 62500,
  s75to100: 87500,
  s100to150: 125000,
  s150plus: 175000
};

const EXP_MID = {
  under2: 1500,
  s2to3: 2500,
  s3to5: 4000,
  s5plus: 6000
};

const ASSET_MID = {
  none: 0,
  under25: 12500,
  s25to100: 62500,
  s100plus: 150000
};

const EQ_MID = {
  none: 0,
  under50: 25000,
  s50to150: 100000,
  s150plus: 200000
};

// Helper functions
function getDebt(range) { return DEBT_MID[range] || 25000; }
function getInc(range) { return INC_MID[range] || 55000; }
function getExp(range) { return EXP_MID[range] || 2500; }
function getAsset(range) { return ASSET_MID[range] || 0; }
function getEq(range) { return EQ_MID[range] || 0; }

function calculateRCP(income, expenses) {
  return Math.max((getInc(income) / 12 - getExp(expenses)) * 0.55, 0);
}

function calculateOIC(income, expenses, assets, equity) {
  const rcp = calculateRCP(income, expenses);
  return Math.max(rcp * 12 + (getAsset(assets) + getEq(equity)) * 0.8, 500);
}

function calculateSavings(debtRange, income, expenses, assets, equity) {
  const debt = getDebt(debtRange);
  const oic = calculateOIC(income, expenses, assets, equity);
  return Math.max(debt - oic, 0);
}

function generateCaseNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  return `ST-${year}-${random}`;
}

/**
 * POST /api/leads
 * Create a new lead submission
 */
router.post('/', async (req, res) => {
  try {
    const data = req.body;
    
    // Validate required fields
    if (!data.first_name || !data.last_name || !data.email || !data.phone) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['first_name', 'last_name', 'email', 'phone']
      });
    }

    // Generate case number
    const caseNumber = generateCaseNumber();
    
    // Calculate financial estimates
    const estimatedDebt = getDebt(data.debt_range);
    const estimatedSettlement = Math.round(calculateOIC(
      data.income, 
      data.expenses, 
      data.assets, 
      data.equity
    ));
    const estimatedSavings = Math.round(calculateSavings(
      data.debt_range,
      data.income,
      data.expenses,
      data.assets,
      data.equity
    ));

    // Prepare lead data
    const leadData = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email.toLowerCase(),
      phone: data.phone,
      debt_range: data.debt_range || null,
      debt_type: data.debt_type || null,
      irs_notice: data.irs_notice || null,
      tax_situation: data.tax_situation || null,
      federal_years: data.federal_years || [],
      state_years: data.state_years || [],
      income: data.income || null,
      expenses: data.expenses || null,
      assets: data.assets || null,
      equity: data.equity || null,
      estimated_debt: estimatedDebt,
      estimated_settlement: estimatedSettlement,
      estimated_savings: estimatedSavings,
      case_number: caseNumber,
      payment_plan: data.payment_plan || 'full',
      status: 'new',
      source: data.source || 'portal',
      ip_address: req.ip || req.connection.remoteAddress,
      user_agent: req.get('user-agent')
    };

    // Insert into Supabase
    const result = await insert('leads', leadData);
    
    if (!result || result.length === 0) {
      throw new Error('Failed to insert lead');
    }

    const lead = Array.isArray(result) ? result[0] : result;

    // Send email notification (async, don't wait)
    sendNewLeadEmail({
      ...lead,
      // Include formatted values for email
      estimated_debt: estimatedDebt,
      estimated_settlement: estimatedSettlement
    }).catch(err => {
      console.error('Failed to send lead email:', err);
    });

    console.log(`✅ New lead created: ${caseNumber} - ${lead.first_name} ${lead.last_name}`);

    res.status(201).json({
      success: true,
      lead: {
        id: lead.id,
        case_number: caseNumber,
        first_name: lead.first_name,
        last_name: lead.last_name,
        email: lead.email,
        phone: lead.phone,
        estimated_debt: estimatedDebt,
        estimated_settlement: estimatedSettlement,
        estimated_savings: estimatedSavings,
        status: lead.status,
        created_at: lead.created_at
      }
    });

  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({ 
      error: 'Failed to create lead',
      message: error.message 
    });
  }
});

/**
 * POST /api/leads/:id/payment
 * Record a payment for a lead
 */
router.post('/:id/payment', async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, plan, stripe_payment_id } = req.body;

    if (!amount || !plan) {
      return res.status(400).json({ 
        error: 'Missing required fields',
        required: ['amount', 'plan']
      });
    }

    // Get the lead
    const leads = await select('leads', { 
      query: { id: `eq.${id}` },
      select: '*'
    });

    if (!leads || leads.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    const lead = leads[0];

    // Update lead with payment info
    const updatedLead = await update('leads', id, {
      payment_status: 'paid',
      payment_plan: plan,
      payment_amount: amount,
      payment_date: new Date().toISOString(),
      status: 'active'
    });

    // Record payment
    await insert('payments', {
      lead_id: id,
      amount: amount,
      plan: plan,
      status: 'completed',
      stripe_payment_id: stripe_payment_id || null
    });

    // Send payment notification email
    sendPaymentEmail(
      { ...lead, estimated_settlement: lead.estimated_settlement },
      { amount, plan, stripe_payment_id }
    ).catch(err => {
      console.error('Failed to send payment email:', err);
    });

    console.log(`💰 Payment recorded: ${lead.case_number} - $${amount}`);

    res.json({
      success: true,
      lead: {
        id: lead.id,
        case_number: lead.case_number,
        payment_status: 'paid',
        payment_amount: amount,
        payment_plan: plan
      }
    });

  } catch (error) {
    console.error('Error recording payment:', error);
    res.status(500).json({ 
      error: 'Failed to record payment',
      message: error.message 
    });
  }
});

/**
 * GET /api/leads
 * List leads (with optional filters)
 */
router.get('/', async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    const options = {
      select: 'id, first_name, last_name, email, phone, case_number, status, estimated_debt, estimated_settlement, payment_status, created_at',
      query: {}
    };

    if (status) {
      options.query.status = `eq.${status}`;
    }

    const leads = await select('leads', options);

    res.json({
      success: true,
      leads: leads || [],
      count: leads?.length || 0
    });

  } catch (error) {
    console.error('Error fetching leads:', error);
    res.status(500).json({ 
      error: 'Failed to fetch leads',
      message: error.message 
    });
  }
});

/**
 * GET /api/leads/:id
 * Get a single lead
 */
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const leads = await select('leads', {
      query: { id: `eq.${id}` },
      select: '*'
    });

    if (!leads || leads.length === 0) {
      return res.status(404).json({ error: 'Lead not found' });
    }

    res.json({
      success: true,
      lead: leads[0]
    });

  } catch (error) {
    console.error('Error fetching lead:', error);
    res.status(500).json({ 
      error: 'Failed to fetch lead',
      message: error.message 
    });
  }
});

/**
 * PATCH /api/leads/:id
 * Update a lead
 */
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;

    // Remove fields that shouldn't be updated directly
    delete data.id;
    delete data.case_number;
    delete data.created_at;

    const result = await update('leads', id, data);

    res.json({
      success: true,
      lead: result[0]
    });

  } catch (error) {
    console.error('Error updating lead:', error);
    res.status(500).json({ 
      error: 'Failed to update lead',
      message: error.message 
    });
  }
});

module.exports = router;