require('dotenv').config();
const nodemailer = require('nodemailer');

// Create transporter
let transporter = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }
  return transporter;
}

/**
 * Send email notification for new lead submission
 */
async function sendNewLeadEmail(lead) {
  const transporter = getTransporter();
  
  const subject = `🎯 New Lead: ${lead.first_name} ${lead.last_name} - $${lead.estimated_debt?.toLocaleString() || 'N/A'} Tax Debt`;
  
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f9fc; padding: 20px;">
      <div style="background: linear-gradient(135deg, #0F1F45, #1B2F60); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: #00B4B0; margin: 0; font-size: 24px;">🎯 New Lead Submitted</h1>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #8895AE; font-weight: 500;">Name</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #0F1F45; font-weight: 600;">${lead.first_name} ${lead.last_name}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #8895AE; font-weight: 500;">Email</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5;">
              <a href="mailto:${lead.email}" style="color: #00B4B0; text-decoration: none; font-weight: 600;">${lead.email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #8895AE; font-weight: 500;">Phone</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #0F1F45; font-weight: 600;">
              <a href="tel:${lead.phone}" style="color: #0F1F45; text-decoration: none;">${lead.phone}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #8895AE; font-weight: 500;">Estimated Debt</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #DC2626; font-weight: 700; font-size: 18px;">$${lead.estimated_debt?.toLocaleString() || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #8895AE; font-weight: 500;">Debt Type</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #0F1F45; font-weight: 600;">${formatDebtType(lead.debt_type)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #8895AE; font-weight: 500;">IRS Notice</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: ${lead.irs_notice === 'levy' || lead.irs_notice === 'garnishment' ? '#DC2626' : '#0F1F45'}; font-weight: 600;">${formatIrsNotice(lead.irs_notice)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #8895AE; font-weight: 500;">Tax Situation</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #0F1F45; font-weight: 600;">${formatTaxSituation(lead.tax_situation)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #8895AE; font-weight: 500;">Federal Years</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #0F1F45; font-weight: 600;">${lead.federal_years?.join(', ') || 'None'}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #8895AE; font-weight: 500;">State Years</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #0F1F45; font-weight: 600;">${lead.state_years?.join(', ') || 'None'}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #8895AE; font-weight: 500;">Income Range</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #0F1F45; font-weight: 600;">${formatIncome(lead.income)}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #8895AE; font-weight: 500;">Case Number</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #00B4B0; font-weight: 700; font-size: 18px;">${lead.case_number || 'Pending'}</td>
          </tr>
        </table>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="https://sympletax.com/admin/leads/${lead.id}" style="background: linear-gradient(135deg, #00B4B0, #009B98); color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block;">View Lead Details</a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #8895AE; font-size: 12px;">
        SympleTax Portal • ${new Date().toLocaleString()}
      </div>
    </div>
  `;

  const text = `
New Lead Submitted

Name: ${lead.first_name} ${lead.last_name}
Email: ${lead.email}
Phone: ${lead.phone}
Estimated Debt: $${lead.estimated_debt?.toLocaleString() || 'N/A'}
Debt Type: ${formatDebtType(lead.debt_type)}
IRS Notice: ${formatIrsNotice(lead.irs_notice)}
Tax Situation: ${formatTaxSituation(lead.tax_situation)}
Federal Years: ${lead.federal_years?.join(', ') || 'None'}
State Years: ${lead.state_years?.join(', ') || 'None'}
Income Range: ${formatIncome(lead.income)}
Case Number: ${lead.case_number || 'Pending'}

Submitted: ${new Date().toLocaleString()}
  `.trim();

  try {
    const info = await transporter.sendMail({
      from: `"SympleTax Portal" <${process.env.SMTP_USER}>`,
      to: ['ari@sympletax.com', 'hi@kpatel.xyz'],
      subject,
      text,
      html
    });
    console.log('New lead email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending new lead email:', error);
    // Don't throw - we don't want to fail the lead submission
    return { success: false, error: error.message };
  }
}

/**
 * Send email notification for payment received
 */
async function sendPaymentEmail(lead, payment) {
  const transporter = getTransporter();
  
  const subject = `💰 Payment Received: ${lead.first_name} ${lead.last_name} - $${payment.amount}`;
  
  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #f7f9fc; padding: 20px;">
      <div style="background: linear-gradient(135deg, #16A34A, #15803D); padding: 30px; border-radius: 16px 16px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">💰 Payment Received!</h1>
      </div>
      
      <div style="background: white; padding: 30px; border-radius: 0 0 16px 16px; box-shadow: 0 4px 20px rgba(0,0,0,0.08);">
        <div style="text-align: center; margin-bottom: 20px;">
          <div style="font-size: 48px; font-weight: 700; color: #16A34A;">$${payment.amount}</div>
          <div style="color: #8895AE; margin-top: 8px;">Case Activation Fee - ${payment.plan === 'monthly' ? '$89/mo x 2' : '$129 One-time'}</div>
        </div>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #8895AE; font-weight: 500;">Client</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #0F1F45; font-weight: 600;">${lead.first_name} ${lead.last_name}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #8895AE; font-weight: 500;">Email</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5;">
              <a href="mailto:${lead.email}" style="color: #00B4B0; text-decoration: none; font-weight: 600;">${lead.email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #8895AE; font-weight: 500;">Phone</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #0F1F45; font-weight: 600;">
              <a href="tel:${lead.phone}" style="color: #0F1F45; text-decoration: none;">${lead.phone}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #8895AE; font-weight: 500;">Case Number</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #00B4B0; font-weight: 700; font-size: 18px;">${lead.case_number}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #8895AE; font-weight: 500;">Payment Plan</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #0F1F45; font-weight: 600;">${payment.plan === 'monthly' ? '$89/month x 2' : '$129 One-time'}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #8895AE; font-weight: 500;">Estimated Debt</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #DC2626; font-weight: 700;">$${lead.estimated_debt?.toLocaleString() || 'N/A'}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #8895AE; font-weight: 500;">Estimated Settlement</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e8edf5; color: #16A34A; font-weight: 700;">$${lead.estimated_settlement?.toLocaleString() || 'N/A'}</td>
          </tr>
        </table>
        
        <div style="margin-top: 30px; text-align: center;">
          <a href="https://sympletax.com/admin/leads/${lead.id}" style="background: linear-gradient(135deg, #00B4B0, #009B98); color: white; padding: 14px 28px; border-radius: 12px; text-decoration: none; font-weight: 600; display: inline-block;">View Case Details</a>
        </div>
      </div>
      
      <div style="text-align: center; margin-top: 20px; color: #8895AE; font-size: 12px;">
        SympleTax Portal • ${new Date().toLocaleString()}
      </div>
    </div>
  `;

  const text = `
Payment Received!

Amount: $${payment.amount}
Plan: ${payment.plan === 'monthly' ? '$89/mo x 2' : '$129 One-time'}

Client: ${lead.first_name} ${lead.last_name}
Email: ${lead.email}
Phone: ${lead.phone}
Case Number: ${lead.case_number}
Estimated Debt: $${lead.estimated_debt?.toLocaleString() || 'N/A'}
Estimated Settlement: $${lead.estimated_settlement?.toLocaleString() || 'N/A'}

Received: ${new Date().toLocaleString()}
  `.trim();

  try {
    const info = await transporter.sendMail({
      from: `"SympleTax Portal" <${process.env.SMTP_USER}>`,
      to: ['ari@sympletax.com', 'hi@kpatel.xyz'],
      subject,
      text,
      html
    });
    console.log('Payment email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending payment email:', error);
    return { success: false, error: error.message };
  }
}

// Helper formatters
function formatDebtType(type) {
  const types = {
    'federal': 'Federal Taxes',
    'state': 'State Taxes',
    'both': 'Federal & State',
    'unsure': 'Not Sure'
  };
  return types[type] || type || 'N/A';
}

function formatIrsNotice(notice) {
  const notices = {
    'none': 'No Notice Yet',
    'cp14': 'Balance Due Notice (CP14/CP501)',
    'levy': '⚠️ Bank Levy (URGENT)',
    'garnishment': '⚠️ Wage Garnishment (URGENT)',
    'lien': 'Federal Tax Lien',
    'unsure': 'Not Sure'
  };
  return notices[notice] || notice || 'N/A';
}

function formatTaxSituation(situation) {
  const situations = {
    'back_taxes': 'Owes Back Taxes',
    'unfiled': "Hasn't Filed Taxes",
    'both': 'Both',
    'unsure': 'Not Sure'
  };
  return situations[situation] || situation || 'N/A';
}

function formatIncome(income) {
  const incomes = {
    'under30': 'Under $30,000',
    's30to50': '$30,000 - $50,000',
    's50to75': '$50,000 - $75,000',
    's75to100': '$75,000 - $100,000',
    's100to150': '$100,000 - $150,000',
    's150plus': '$150,000+'
  };
  return incomes[income] || income || 'N/A';
}

module.exports = {
  sendNewLeadEmail,
  sendPaymentEmail
};