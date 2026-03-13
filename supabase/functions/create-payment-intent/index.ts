// Supabase Edge Function: create-payment-intent
// Creates Stripe PaymentIntent for SympleTax portal

// Stripe in Supabase Edge Functions: use deno target (and no-check for compatibility)
import Stripe from 'https://esm.sh/stripe@11.2.0?target=deno&no-check'

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

    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' })
    const { amount, plan, email, name } = await req.json()

    const paymentIntent = await stripe.paymentIntents.create({
      amount: (amount || 129) * 100,
      currency: 'usd',
      automatic_payment_methods: { enabled: true },
      metadata: { plan: plan || 'full', email: email || '', name: name || '' },
    })

    return new Response(
      JSON.stringify({ clientSecret: paymentIntent.client_secret }),
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
