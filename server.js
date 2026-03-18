require('dotenv').config();
const express = require('express');
const path = require('path');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY || 'sk_test_51TAHlXH225E6WTMYH08zt5tpLjdhzSh8HgMiUme28eqBf9yfnwbfqbHYfgdg0OC3s7qB4A1flFjKGKjDGgXQEiA600s6DNEbMp');

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS headers for local development
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    res.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    return res.sendStatus(200);
  }
  next();
});

// ─── SUPABASE HELPER ───────────────────────────────────────────────────────────
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function supabaseInsert(table, data) {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase not configured — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env');
  }
  const url = `${SUPABASE_URL}/rest/v1/${table}?select=*`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation'
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Supabase error: ${res.status} — ${err}`);
  }
  const result = await res.json();
  return Array.isArray(result) ? result[0] : result;
}

function generateCaseNumber() {
  const year = new Date().getFullYear();
  const rand = String(Math.floor(Math.random() * 9000) + 1000);
  return `ST-${year}-${rand}`;
}

// ─── EMAIL HELPER (notify ari + kp on new qualify lead) ───────────────────────
async function sendQualifyLeadEmail(lead) {
  try {
    const { sendNewLeadEmail } = require('./backend/lib/email');
    await sendNewLeadEmail({
      ...lead,
      // Map qualify_leads fields to the email template format
      debt_range:     lead.debt_amount,
      debt_type:      lead.tax_type,
      irs_notice:     lead.prompted?.includes('garnishment') ? 'garnishment' : 'none',
      tax_situation:  lead.unfiled_years === 'yes' ? 'unfiled' : 'back_taxes',
      federal_years:  [],
      state_years:    [],
      income:         null,
      estimated_debt: null,
      estimated_settlement: null,
      source:         'get-started'
    });
  } catch (err) {
    console.error('Failed to send qualify lead email:', err.message);
    // Non-fatal — don't block the response
  }
}


// ─── GET STARTED — QUALIFY LEAD SUBMISSION ─────────────────────────────────────
// Saves to qualify_leads table in Supabase
app.post('/qualify-leads', async (req, res) => {
  try {
    const data = req.body;

    // Validate required contact fields
    if (!data.first_name || !data.last_name || !data.email || !data.phone) {
      return res.status(400).json({
        error: 'Missing required fields',
        required: ['first_name', 'last_name', 'email', 'phone']
      });
    }

    const caseNumber = generateCaseNumber();

    const leadData = {
      case_number:  caseNumber,
      first_name:   data.first_name.trim(),
      last_name:    data.last_name.trim(),
      email:        data.email.trim().toLowerCase(),
      phone:        data.phone.trim(),
      prompted:     data.prompted     || [],
      unfiled_years: data.unfiled_years || null,
      debt_amount:  data.debt_amount  || null,
      tax_type:     data.tax_type     || null,
      issue_type:   data.issue_type   || null,
      bankruptcy:   data.bankruptcy   || null,
      terms_agreed: data.terms_agreed || false,
      status:       'new',
      source:       'get-started',
      ip_address:   req.ip || req.connection?.remoteAddress || null,
      user_agent:   req.get('user-agent') || null
    };

    const lead = await supabaseInsert('qualify_leads', leadData);

    // Fire email notification async (non-blocking)
    sendQualifyLeadEmail({ ...lead, case_number: caseNumber });

    console.log(`✅ New qualify lead: ${caseNumber} — ${lead.first_name} ${lead.last_name} (${lead.email})`);

    res.status(201).json({
      success: true,
      lead: {
        id:          lead.id,
        case_number: caseNumber,
        first_name:  lead.first_name,
        last_name:   lead.last_name,
        email:       lead.email,
        status:      lead.status,
        created_at:  lead.created_at
      }
    });

  } catch (err) {
    console.error('Qualify lead error:', err.message);
    res.status(500).json({ error: 'Failed to submit. Please try again.', message: err.message });
  }
});


// ─── STRIPE ────────────────────────────────────────────────────────────────────
app.get('/config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_51TAHlXH225E6WTMYL8oyROJRdYGsrlWNlfqXJqLI5oT4KRs6Yfy3OrBjMQ6S2U06kvrWeGB85qJb4v4YFWWwQ2cm00Ucwo5qN2'
  });
});

app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100,
      currency: 'usd',
      payment_method_types: ['card', 'us_bank_account'],
      metadata: { integration_check: 'accept_a_payment' }
    });
    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (e) {
    console.error('Stripe error:', e.message);
    res.status(400).send({ error: { message: e.message } });
  }
});


// ─── HOMEPAGE LEADS (existing — unchanged) ─────────────────────────────────────
app.post('/leads', async (req, res) => {
  try {
    const leadData = req.body;
    console.log('Lead submitted:', leadData);
    const caseNumber = generateCaseNumber();
    res.json({
      success: true,
      lead: { id: 'lead_' + Date.now(), case_number: caseNumber, ...leadData }
    });
  } catch (e) {
    console.error('Lead error:', e.message);
    res.status(400).json({ error: e.message });
  }
});

app.post('/leads/:id/payment', async (req, res) => {
  try {
    console.log('Payment recorded for lead:', req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});


// ─── STATIC / ROUTES ───────────────────────────────────────────────────────────
const faviconPath = path.join(__dirname, 'favicon.png');
app.get('/favicon.ico', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.setHeader('Content-Type', 'image/png');
  res.sendFile(faviconPath);
});
app.get('/favicon.png', (req, res) => {
  res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.sendFile(faviconPath);
});

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'index.html')));
app.get('/get-started', (req, res) => res.sendFile(path.join(__dirname, 'get-started.html')));

app.use(express.static(__dirname));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SympleTax server running on http://localhost:${PORT}`);
  console.log('API endpoints:');
  console.log('  GET  /config');
  console.log('  POST /create-payment-intent');
  console.log('  POST /leads');
  console.log('  POST /qualify-leads  ← get-started form → Supabase qualify_leads');
});
