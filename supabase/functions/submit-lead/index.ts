// Supabase Edge Function: submit-lead
// Handles lead creation, payment recording, and email sending via Resend

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0'
import { Resend } from 'https://esm.sh/resend@2.0.0'
import { buildLeadEmailHtml, type LeadEmailData } from './email-template.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    const clientEmail = Deno.env.get('CLIENT_EMAIL') || 'leads@sympletax.com'

    if (!resendApiKey) {
      console.warn('RESEND_API_KEY not set — emails will be skipped')
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    const body = await req.json()
    const leadData = body.leadData || body
    const payment = body.payment
    const isPartial = leadData.status === 'partial'

    // Generate case number
    const caseNumber = 'ST-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9000) + 1000)
    const createdAt = new Date().toISOString()

    const dbRow = {
      case_number: caseNumber,
      first_name: leadData.first_name,
      last_name: leadData.last_name,
      email: leadData.email,
      phone: leadData.phone,
      debt_type: leadData.debt_type,
      tax_type: leadData.tax_type,
      active_collections: leadData.active_collections,
      irs_notice: leadData.irs_notice,
      tax_situation: leadData.tax_situation,
      federal_years: leadData.federal_years || [],
      state_years: leadData.state_years || [],
      income: leadData.income,
      monthly_income: leadData.monthly_income ?? 0,
      additional_income: leadData.additional_income ?? 0,
      on_irs_plan: leadData.on_irs_plan,
      irs_plan_monthly: leadData.irs_plan_monthly,
      filing_status: leadData.filing_status,
      bank_balance: leadData.bank_balance ?? 0,
      investments: leadData.investments ?? 0,
      owns_real_estate: leadData.owns_real_estate || null,
      home_value: leadData.home_value ?? 0,
      home_mortgage: leadData.home_mortgage ?? 0,
      state: leadData.state,
      county: leadData.county,
      household_size: leadData.household_size,
      vehicles_owned: leadData.vehicles_owned,
      exp_health_insurance: leadData.exp_health_insurance ?? 0,
      exp_childcare: leadData.exp_childcare ?? 0,
      exp_other_tax: leadData.exp_other_tax ?? 0,
      exp_other_obligations: leadData.exp_other_obligations ?? 0,
      payment_plan: leadData.payment_plan || 'full',
      pre_estimated_debt: leadData.pre_estimated_debt ?? 0,
      pre_estimated_settlement: leadData.pre_estimated_settlement ?? 0,
      pre_estimated_savings: leadData.pre_estimated_savings ?? 0,
      source: leadData.source || 'portal',
      status: leadData.status || 'full',
    }

    const { data: lead, error } = await supabase
      .from('leads')
      .insert(dbRow)
      .select('id')
      .single()

    if (error) {
      console.error('Lead insert error:', error)
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (payment && lead?.id) {
      await supabase.from('payments').insert({
        lead_id: lead.id,
        amount: payment.amount ?? 0,
        plan: payment.plan || 'full',
        stripe_payment_id: payment.stripe_payment_id || null,
      })
    }

    const emailData: LeadEmailData = {
      case_number: caseNumber,
      first_name: String(leadData.first_name || ''),
      last_name: String(leadData.last_name || ''),
      email: String(leadData.email || ''),
      phone: String(leadData.phone || ''),
      debt_type: String(leadData.debt_type || ''),
      tax_type: String(leadData.tax_type || ''),
      active_collections: String(leadData.active_collections || ''),
      irs_notice: String(leadData.irs_notice || ''),
      tax_situation: String(leadData.tax_situation || ''),
      federal_years: Array.isArray(leadData.federal_years) ? leadData.federal_years : [],
      state_years: Array.isArray(leadData.state_years) ? leadData.state_years : [],
      income: String(leadData.income || ''),
      on_irs_plan: String(leadData.on_irs_plan || ''),
      irs_plan_monthly: leadData.irs_plan_monthly ?? null,
      filing_status: String(leadData.filing_status || ''),
      bank_balance: Number(leadData.bank_balance) || 0,
      investments: Number(leadData.investments) || 0,
      state: String(leadData.state || ''),
      county: String(leadData.county || ''),
      household_size: String(leadData.household_size || ''),
      vehicles_owned: String(leadData.vehicles_owned || ''),
      exp_health_insurance: Number(leadData.exp_health_insurance) || 0,
      exp_childcare: Number(leadData.exp_childcare) || 0,
      exp_other_tax: Number(leadData.exp_other_tax) || 0,
      exp_other_obligations: Number(leadData.exp_other_obligations) || 0,
      payment_plan: String(leadData.payment_plan || 'full'),
      pre_estimated_debt: Number(leadData.pre_estimated_debt) || 0,
      pre_estimated_settlement: Number(leadData.pre_estimated_settlement) || 0,
      pre_estimated_savings: Number(leadData.pre_estimated_savings) || 0,
      created_at: new Date(createdAt).toLocaleString('en-US', {
        dateStyle: 'long',
        timeStyle: 'short',
      }),
    }

    let userEmailSent = false
    let clientEmailSent = false

    if (resendApiKey && leadData.email && !isPartial) {
      const resend = new Resend(resendApiKey)
      // RESEND_FROM_DOMAIN must be full email (e.g. noreply@sympletax.com) or domain (e.g. sympletax.com)
      const fromRaw = Deno.env.get('RESEND_FROM_DOMAIN') || 'onboarding@resend.dev'
      const fromEmail = fromRaw.includes('@') ? fromRaw : `noreply@${fromRaw}`

      try {
        const userResult = await resend.emails.send({
          from: `SympleTax <${fromEmail}>`,
          to: leadData.email as string,
          subject: `Your SympleTax Case Confirmation — ${caseNumber}`,
          html: buildLeadEmailHtml(emailData, 'user'),
        })
        userEmailSent = !userResult.error
        if (userResult.error) console.error('User email failed:', userResult.error)
      } catch (e) {
        console.error('User email failed:', e)
      }

      try {
        const clientResult = await resend.emails.send({
          from: `SympleTax Portal <${fromEmail}>`,
          to: clientEmail,
          subject: `New Lead: ${leadData.first_name} ${leadData.last_name} — ${caseNumber}`,
          html: buildLeadEmailHtml(emailData, 'client'),
        })
        clientEmailSent = !clientResult.error
        if (clientResult.error) console.error('Client email failed:', clientResult.error)
      } catch (e) {
        console.error('Client email failed:', e)
      }
    } else if (!isPartial && leadData.email) {
      console.warn('Emails skipped: RESEND_API_KEY missing')
    }

    return new Response(
      JSON.stringify({
        success: true,
        lead: {
          id: lead.id,
          case_number: caseNumber,
        },
        emails_sent: { user: userEmailSent, client: clientEmailSent },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('Submit lead error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
