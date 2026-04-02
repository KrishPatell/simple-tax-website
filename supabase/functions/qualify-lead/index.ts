// Supabase Edge Function: qualify-lead
// Handles get-started form submissions → qualify_leads table + email notifications
// Sends admin notification AND user confirmation email

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { Resend } from 'https://esm.sh/resend@2.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl  = Deno.env.get('SUPABASE_URL')!
    const supabaseKey  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const notifyEmail  = Deno.env.get('CLIENT_EMAIL') || 'ari@sympletax.com'
    const fromRaw      = Deno.env.get('RESEND_FROM_DOMAIN') || 'sympletax.com'
    const fromEmail    = fromRaw.includes('@') ? fromRaw : `noreply@${fromRaw}`

    const supabase = createClient(supabaseUrl, supabaseKey)
    const body     = await req.json()

    const caseNumber = 'GS-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9000) + 1000)

    const dbRow = {
      case_number:   caseNumber,
      first_name:    body.first_name   || '',
      last_name:     body.last_name    || '',
      email:         body.email        || '',
      phone:         body.phone        || '',
      prompted:      Array.isArray(body.tax_relief_reason) ? body.tax_relief_reason : (Array.isArray(body.prompted) ? body.prompted : []),
      unfiled_years: body.unfiled_years || null,
      debt_amount:  body.tax_debt_amount || body.debt_amount  || null,
      tax_type:     body.tax_type     || null,
      issue_type:   body.issue_type   || null,
      bankruptcy:   body.bankruptcy   || null,
      terms_agreed: body.terms_agreed || false,
      status:       'new',
      source:       'free-consultation',
      utm_source:   body.utm_source   || null,
      utm_medium:   body.utm_medium   || null,
      utm_campaign: body.utm_campaign || null,
      utm_content:  body.utm_content  || null,
      utm_term:     body.utm_term     || null,
    }

    const { data: lead, error } = await supabase
      .from('qualify_leads')
      .insert(dbRow)
      .select('id')
      .single()

    if (error) {
      console.error('qualify_leads insert error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // ── Only send emails if Resend is configured ──
    if (resendApiKey) {
      const resend = new Resend(resendApiKey)

      const promptedLabels: Record<string, string> = {
        irs_notice:            'Received IRS notice',
        garnishment_lien_levy: 'Garnishment, lien or levy',
        unpaid_taxes:          'Unpaid taxes',
        other:                 'Other reason',
      }
      const debtLabels: Record<string, string> = {
        'under_5000':   '$5,000 & under',
        '5001_10000':   '$5,001 – $10,000',
        '10001_25000':  '$10,001 – $25,000',
        '25001_50000':  '$25,001 – $50,000',
        '50001_75000':  '$50,001 – $75,000',
        'over_75000':   '$75,001 & above',
      }

      const promptedHtml = (dbRow.prompted as string[])
        .map(p => `<li>${promptedLabels[p] || p}</li>`)
        .join('')

      // ═══════════════════════════════════════════
      // EMAIL 1 — Admin notification to Ari
      // ═══════════════════════════════════════════
      const notifyHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Inter,sans-serif;background:#F5F7FC;margin:0;padding:32px">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,31,69,.08)">
    <div style="background:#0F1F45;padding:28px 32px">
      <h1 style="color:#fff;font-size:20px;margin:0">New Get-Started Lead</h1>
      <p style="color:rgba(255,255,255,.6);font-size:13px;margin:6px 0 0">Case ${caseNumber} · SympleTax</p>
    </div>
    <div style="padding:32px">
      <table style="width:100%;border-collapse:collapse">
        <tr><td style="padding:10px 0;border-bottom:1px solid #E2E8F4;font-size:13px;color:#8895AE;width:140px">Name</td>
            <td style="padding:10px 0;border-bottom:1px solid #E2E8F4;font-size:14px;font-weight:600;color:#0F1F45">${dbRow.first_name} ${dbRow.last_name}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #E2E8F4;font-size:13px;color:#8895AE">Email</td>
            <td style="padding:10px 0;border-bottom:1px solid #E2E8F4;font-size:14px;color:#0F1F45"><a href="mailto:${dbRow.email}" style="color:#00B4B0">${dbRow.email}</a></td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #E2E8F4;font-size:13px;color:#8895AE">Phone</td>
            <td style="padding:10px 0;border-bottom:1px solid #E2E8F4;font-size:14px;color:#0F1F45">${dbRow.phone || '—'}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #E2E8F4;font-size:13px;color:#8895AE">Debt Range</td>
            <td style="padding:10px 0;border-bottom:1px solid #E2E8F4;font-size:14px;font-weight:700;color:#0F1F45">${debtLabels[dbRow.debt_amount as string] || dbRow.debt_amount || '—'}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #E2E8F4;font-size:13px;color:#8895AE">Tax Type</td>
            <td style="padding:10px 0;border-bottom:1px solid #E2E8F4;font-size:14px;color:#0F1F45">${dbRow.tax_type || '—'}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #E2E8F4;font-size:13px;color:#8895AE">Issue Type</td>
            <td style="padding:10px 0;border-bottom:1px solid #E2E8F4;font-size:14px;color:#0F1F45">${dbRow.issue_type || '—'}</td></tr>
        <tr><td style="padding:10px 0;border-bottom:1px solid #E2E8F4;font-size:13px;color:#8895AE">Unfiled Years</td>
            <td style="padding:10px 0;border-bottom:1px solid #E2E8F4;font-size:14px;color:#0F1F45">${dbRow.unfiled_years || '—'}</td></tr>
        <tr><td style="padding:10px 0;font-size:13px;color:#8895AE;vertical-align:top">Bankruptcy</td>
            <td style="padding:10px 0;font-size:14px;color:#0F1F45">${dbRow.bankruptcy || '—'}</td></tr>
      </table>
      ${promptedHtml ? `
      <div style="margin-top:20px;background:#F5F7FC;border-radius:10px;padding:16px">
        <p style="font-size:12px;font-weight:700;color:#8895AE;text-transform:uppercase;letter-spacing:.5px;margin:0 0 10px">What prompted them</p>
        <ul style="margin:0;padding-left:18px;font-size:14px;color:#3D4A61;line-height:1.8">${promptedHtml}</ul>
      </div>` : ''}
    </div>
    <div style="background:#F5F7FC;padding:16px 32px;font-size:12px;color:#8895AE;text-align:center">
      SympleTax · Get Started Form · ${new Date().toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' })}
    </div>
  </div>
</body>
</html>`

      // ═══════════════════════════════════════════
      // EMAIL 2 — User confirmation (sent to the person who filled out the form)
      // ═══════════════════════════════════════════
      const userConfirmHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family:Inter,sans-serif;background:#F5F7FC;margin:0;padding:32px">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(15,31,69,.08)">
    <div style="background:#0F1F45;padding:28px 32px;text-align:center">
      <p style="color:rgba(255,255,255,.6);font-size:13px;margin:0 0 4px">SympleTax · Get Started</p>
      <h1 style="color:#fff;font-size:22px;font-weight:800;margin:0">You're on your way!</h1>
    </div>
    <div style="padding:32px;text-align:center">
      <div style="width:64px;height:64px;border-radius:50%;background:linear-gradient(135deg,#00B4B0,#009B98);margin:0 auto 20px;display:flex;align-items:center;justify-content:center;text-align:center">
        <svg fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="3" style="width:32px;height:32px;display:block"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
      </div>
      <h2 style="font-family:Outfit,sans-serif;font-size:24px;font-weight:800;color:#0F1F45;margin:0 0 12px">Thanks, ${dbRow.first_name}!</h2>
      <p style="font-size:15px;color:#3D4A61;line-height:1.7;max-width:400px;margin:0 auto 28px">
        We've received your information and a tax relief specialist is reviewing your case. You'll get a detailed analysis showing which programs you qualify for — <strong>free, with no obligation.</strong>
      </p>

      <!-- Case number -->
      <div style="background:#F5F7FC;border-radius:10px;padding:14px 20px;margin-bottom:28px;display:inline-block">
        <p style="font-size:12px;color:#8895AE;margin:0 0 4px">Your case number</p>
        <p style="font-size:18px;font-weight:800;color:#0F1F45;margin:0;letter-spacing:1px">${caseNumber}</p>
      </div>

      <!-- What happens next -->
      <div style="background:#F5F7FC;border-radius:12px;padding:20px;margin-bottom:28px;text-align:left">
        <p style="font-size:12px;font-weight:700;color:#8895AE;text-transform:uppercase;letter-spacing:.5px;margin:0 0 14px">What happens next</p>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
          <div style="width:28px;height:28px;border-radius:50%;background:#00B4B0;color:#fff;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;letter-spacing:0">1</div>
          <div>
            <p style="font-size:13px;font-weight:700;color:#0F1F45;margin:0 0 2px">Case assigned to a specialist</p>
            <p style="font-size:12px;color:#8895AE;margin:0">Your dedicated rep is reviewing your info now</p>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
          <div style="width:28px;height:28px;border-radius:50%;background:#00B4B0;color:#fff;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;letter-spacing:0">2</div>
          <div>
            <p style="font-size:13px;font-weight:700;color:#0F1F45;margin:0 0 2px">Personalized relief analysis</p>
            <p style="font-size:12px;color:#8895AE;margin:0">We'll identify every program you qualify for</p>
          </div>
        </div>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:28px;height:28px;border-radius:50%;background:#00B4B0;color:#fff;font-size:14px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;letter-spacing:0">3</div>
          <div>
            <p style="font-size:13px;font-weight:700;color:#0F1F45;margin:0 0 2px">Free phone consultation</p>
            <p style="font-size:12px;color:#8895AE;margin:0">We'll call you to discuss your options</p>
          </div>
        </div>
      </div>

      <!-- Need help box -->
      <div style="background:#ECFDF5;border-radius:10px;padding:14px 18px;border:1px solid #A7F3D0;margin-bottom:8px">
        <p style="font-size:13px;color:#065F46;font-weight:500;margin:0;line-height:1.6">
          <strong>Have questions?</strong> Call us any time at <a href="tel:+19492883015" style="color:#00B4B0;font-weight:700;text-decoration:none">(949) 288-3015</a>
        </p>
      </div>
    </div>
    <div style="background:#F5F7FC;padding:16px 32px;text-align:center;border-top:1px solid #E2E8F4">
      <p style="font-size:12px;color:#8895AE;margin:0">
        SympleTax · Irvine, CA · <a href="tel:+19492883015" style="color:#00B4B0;text-decoration:none">(949) 288-3015</a>
      </p>
    </div>
  </div>
</body>
</html>`

      // Send admin notification
      try {
        await resend.emails.send({
          from: `SympleTax Leads <${fromEmail}>`,
          to:   notifyEmail,
          subject: `[Get Started] ${dbRow.first_name} ${dbRow.last_name} — ${debtLabels[dbRow.debt_amount as string] || dbRow.debt_amount || 'Unknown debt'} — ${caseNumber}`,
          html: notifyHtml,
        })
      } catch (e) {
        console.error('Admin email failed:', e)
      }

      // Send user confirmation
      try {
        await resend.emails.send({
          from: `SympleTax <${fromEmail}>`,
          to:   dbRow.email,
          subject: `Thanks, ${dbRow.first_name}! Case ${caseNumber} is being reviewed`,
          html: userConfirmHtml,
        })
      } catch (e) {
        console.error('User confirmation email failed:', e)
      }

    } else {
      console.warn('RESEND_API_KEY not set — emails skipped')
    }

    return new Response(
      JSON.stringify({ success: true, lead: { id: lead.id, case_number: caseNumber } }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('qualify-lead error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
