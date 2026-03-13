const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * POST /api/payments/create-intent
 * Creates a Stripe PaymentIntent and returns the client secret to the frontend
 */
router.post('/create-intent', async (req, res) => {
  try {
    const { amount, plan, email, name } = req.body;

    if (!amount || !plan) {
      return res.status(400).json({ error: 'Missing required fields: amount, plan' });
    }

    const validAmounts = [59, 99];
    if (!validAmounts.includes(Number(amount))) {
      return res.status(400).json({ error: 'Invalid payment amount' });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // cents
      currency: 'usd',
      receipt_email: email || undefined,
      description: `SympleTax Case Activation — ${plan === 'monthly' ? '$79/mo x 2' : '$99 one-time'}`,
      metadata: { plan, name: name || '' }
    });

    res.json({ clientSecret: paymentIntent.client_secret });

  } catch (error) {
    console.error('Stripe PaymentIntent error:', error);
    res.status(500).json({
      error: 'Payment initialization failed',
      message: error.message
    });
  }
});

module.exports = router;
