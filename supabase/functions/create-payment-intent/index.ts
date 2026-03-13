// Supabase Edge Function: create-payment-intent
// Creates Stripe PaymentIntent via REST API (Stripe Node SDK fails in Deno Edge Runtime)

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeSecretKey) {
      return new Response(
        JSON.stringify({ error: 'STRIPE_SECRET_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { amount, plan, email, name } = await req.json()
    const amountCents = ((amount || 99) * 100) | 0

    const body = new URLSearchParams({
      amount: String(amountCents),
      currency: 'usd',
      'automatic_payment_methods[enabled]': 'true',
      'metadata[plan]': plan || 'full',
      'metadata[email]': email || '',
      'metadata[name]': name || '',
    })

    const res = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${stripeSecretKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    })

    const data = await res.json()
    if (data.error) {
      console.error('Stripe API error:', data.error)
      return new Response(
        JSON.stringify({ error: data.error.message || 'Payment failed' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ clientSecret: data.client_secret }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    console.error('create-payment-intent error:', err)
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
