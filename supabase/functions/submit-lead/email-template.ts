// HTML email template for SympleTax lead confirmation
// Sent to both user and client with all form data

export interface LeadEmailData {
  case_number: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  debt_type: string;
  tax_type: string;
  active_collections: string;
  irs_notice: string;
  tax_situation: string;
  federal_years: number[];
  state_years: number[];
  income: string;
  monthly_income: number;
  additional_income: number;
  on_irs_plan: string;
  irs_plan_monthly: number | null;
  filing_status: string;
  owns_real_estate: string;
  home_value: number;
  home_mortgage: number;
  bank_balance: number;
  investments: number;
  state: string;
  county: string;
  household_size: string;
  vehicles_owned: string;
  exp_housing: number;
  exp_food: number;
  exp_clothing: number;
  exp_personal_care: number;
  exp_household: number;
  exp_other: number;
  exp_car_payment: number;
  exp_gas: number;
  exp_insurance_maintenance: number;
  exp_utilities: number;
  exp_medical: number;
  exp_health_insurance: number;
  exp_childcare: number;
  exp_other_tax: number;
  exp_other_obligations: number;
  car_value: number;
  car_loan: number;
  equity: number;
  payment_plan: string;
  pre_estimated_debt: number;
  pre_estimated_settlement: number;
  pre_estimated_savings: number;
  created_at: string;
}

const fmt = (n: number) => '$' + Math.round(n).toLocaleString();
const fmtNum = (n: number | null | undefined) => (n != null && n > 0 ? fmt(n) : '—');
const fmtArr = (arr: number[] | undefined) => (arr && arr.length ? arr.join(', ') : '—');
const fmtStr = (s: string | undefined) => (s && s.trim() ? s : '—');

export function buildLeadEmailHtml(data: LeadEmailData, recipientType: 'user' | 'client'): string {
  const greeting = recipientType === 'user'
    ? `Hi ${data.first_name},`
    : 'New lead submitted from SympleTax Portal';
  const intro = recipientType === 'user'
    ? 'Thank you for completing your case activation. Here is a copy of the information you provided:'
    : 'A new client has completed the SympleTax portal. Details below:';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>SympleTax Case Confirmation</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#f7f9fc;color:#0F1F45;">
  <div style="max-width:600px;margin:0 auto;padding:32px 24px;">
    <div style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(15,31,69,.08);">
      <div style="background:linear-gradient(135deg,#00B4B0 0%,#009B98 100%);padding:32px 28px;text-align:center;">
        <h1 style="margin:0;font-size:24px;font-weight:700;color:#fff;letter-spacing:-0.5px;">SympleTax</h1>
        <p style="margin:8px 0 0;font-size:14px;color:rgba(255,255,255,.9);">Case Activation Confirmation</p>
      </div>
      <div style="padding:28px;">
        <p style="margin:0 0 24px;font-size:16px;line-height:1.6;color:#3D4A61;">${greeting}</p>
        <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3D4A61;">${intro}</p>
        
        <div style="background:#0F1F45;color:#fff;padding:16px 20px;border-radius:8px;margin-bottom:24px;">
          <div style="font-size:11px;text-transform:uppercase;letter-spacing:1.5px;opacity:.8;margin-bottom:4px;">Case Number</div>
          <div style="font-size:22px;font-weight:700;letter-spacing:1px;">${data.case_number}</div>
          <div style="font-size:13px;opacity:.9;margin-top:4px;">${data.created_at}</div>
        </div>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr><td colspan="2" style="padding:12px 0 8px;border-bottom:2px solid #00B4B0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0F1F45;">Contact Information</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;width:140px;">Name</td><td style="padding:10px 0;font-size:14px;font-weight:500;">${fmtStr(data.first_name)} ${fmtStr(data.last_name)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Email</td><td style="padding:10px 0;font-size:14px;">${fmtStr(data.email)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Phone</td><td style="padding:10px 0;font-size:14px;">${fmtStr(data.phone)}</td></tr>
        </table>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr><td colspan="2" style="padding:12px 0 8px;border-bottom:2px solid #00B4B0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0F1F45;">Tax & Debt Summary</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;width:140px;">Estimated Debt</td><td style="padding:10px 0;font-size:14px;font-weight:600;color:#0F1F45;">${fmt(data.pre_estimated_debt)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Estimated Settlement</td><td style="padding:10px 0;font-size:14px;font-weight:600;color:#16A34A;">${fmt(data.pre_estimated_settlement)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Estimated Savings</td><td style="padding:10px 0;font-size:14px;font-weight:600;color:#16A34A;">${fmt(data.pre_estimated_savings)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Debt Type</td><td style="padding:10px 0;font-size:14px;">${fmtStr(data.debt_type)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Tax Type</td><td style="padding:10px 0;font-size:14px;">${fmtStr(data.tax_type)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Tax Situation</td><td style="padding:10px 0;font-size:14px;">${fmtStr(data.tax_situation)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">IRS Notice</td><td style="padding:10px 0;font-size:14px;">${fmtStr(data.irs_notice)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Active Collections</td><td style="padding:10px 0;font-size:14px;">${fmtStr(data.active_collections)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Federal Years</td><td style="padding:10px 0;font-size:14px;">${fmtArr(data.federal_years)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">State Years</td><td style="padding:10px 0;font-size:14px;">${fmtArr(data.state_years)}</td></tr>
        </table>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr><td colspan="2" style="padding:12px 0 8px;border-bottom:2px solid #00B4B0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0F1F45;">Financial Information</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;width:140px;">Income Range</td><td style="padding:10px 0;font-size:14px;">${fmtStr(data.income)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Monthly Income</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.monthly_income)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Additional Income</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.additional_income)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">On IRS Plan</td><td style="padding:10px 0;font-size:14px;">${fmtStr(data.on_irs_plan)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">IRS Plan Monthly</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.irs_plan_monthly)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Filing Status</td><td style="padding:10px 0;font-size:14px;">${fmtStr(data.filing_status)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Bank Balance</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.bank_balance)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Investments</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.investments)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Health Insurance</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.exp_health_insurance)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Childcare</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.exp_childcare)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Other Tax</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.exp_other_tax)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Other Obligations</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.exp_other_obligations)}</td></tr>
        </table>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr><td colspan="2" style="padding:12px 0 8px;border-bottom:2px solid #00B4B0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0F1F45;">Detailed Expenses</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;width:140px;">Housing</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.exp_housing)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Food</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.exp_food)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Clothing</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.exp_clothing)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Personal Care</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.exp_personal_care)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Household</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.exp_household)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Other Expenses</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.exp_other)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Car Payment</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.exp_car_payment)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Gas</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.exp_gas)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Insurance & Maintenance</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.exp_insurance_maintenance)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Utilities</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.exp_utilities)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Medical</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.exp_medical)}</td></tr>
        </table>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr><td colspan="2" style="padding:12px 0 8px;border-bottom:2px solid #00B4B0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0F1F45;">Assets & Liabilities</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;width:140px;">Car Value</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.car_value)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Car Loan</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.car_loan)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Equity</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.equity)}</td></tr>
        </table>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr><td colspan="2" style="padding:12px 0 8px;border-bottom:2px solid #00B4B0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0F1F45;">Real Estate</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;width:140px;">Owns Real Estate</td><td style="padding:10px 0;font-size:14px;">${fmtStr(data.owns_real_estate)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Home Value</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.home_value)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Home Mortgage</td><td style="padding:10px 0;font-size:14px;">${fmtNum(data.home_mortgage)}</td></tr>
        </table>

        <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
          <tr><td colspan="2" style="padding:12px 0 8px;border-bottom:2px solid #00B4B0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0F1F45;">Location & Household</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;width:140px;">State</td><td style="padding:10px 0;font-size:14px;">${fmtStr(data.state)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">County</td><td style="padding:10px 0;font-size:14px;">${fmtStr(data.county)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Household Size</td><td style="padding:10px 0;font-size:14px;">${fmtStr(data.household_size)}</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;">Vehicles</td><td style="padding:10px 0;font-size:14px;">${fmtStr(data.vehicles_owned)}</td></tr>
        </table>

        <table style="width:100%;border-collapse:collapse;">
          <tr><td colspan="2" style="padding:12px 0 8px;border-bottom:2px solid #00B4B0;font-size:13px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#0F1F45;">Payment</td></tr>
          <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;width:140px;">Plan</td><td style="padding:10px 0;font-size:14px;font-weight:600;">${data.payment_plan === 'monthly' ? '2 Payments ($79/mo × 2)' : 'Pay in Full ($99)'}</td></tr>
        </table>

        ${recipientType === 'user' ? `
        <p style="margin:28px 0 0;font-size:14px;line-height:1.6;color:#8895AE;">Your case is now active. Our team will reach out within 24 hours to discuss your personalized resolution plan.</p>
        <p style="margin:12px 0 0;font-size:14px;line-height:1.6;color:#8895AE;">Questions? Reply to this email or call us.</p>
        ` : ''}
      </div>
      <div style="background:#f7f9fc;padding:20px 28px;text-align:center;border-top:1px solid #E8EDF5;">
        <p style="margin:0;font-size:12px;color:#8895AE;">SympleTax — Resolve Your Tax Debt 100% Online</p>
      </div>
    </div>
  </div>
</body>
</html>
`.trim();
}
