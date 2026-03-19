const express = require('express');
const fs = require('fs');
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
    res.header('Access-Control-Allow-Methods', 'POST, OPTIONS');
    return res.sendStatus(200);
  }
  next();
});

// Get Stripe publishable key
app.get('/config', (req, res) => {
  res.json({
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || 'pk_test_51TAHlXH225E6WTMYL8oyROJRdYGsrlWNlfqXJqLI5oT4KRs6Yfy3OrBjMQ6S2U06kvrWeGB85qJb4v4YFWWwQ2cm00Ucwo5qN2'
  });
});

// Create payment intent
app.post('/create-payment-intent', async (req, res) => {
  try {
    const { amount } = req.body;

    console.log('Creating payment intent for amount:', amount);

    // Amount in cents (Stripe expects smallest currency unit)
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount * 100, // Convert dollars to cents
      currency: 'usd',
      payment_method_types: ['card', 'us_bank_account'],
      metadata: {
        integration_check: 'accept_a_payment',
      },
    });

    console.log('Payment intent created:', paymentIntent.id);

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (e) {
    console.error('Stripe error:', e.message);
    res.status(400).send({
      error: {
        message: e.message,
      },
    });
  }
});

// Lead submission endpoint
app.post('/leads', async (req, res) => {
  try {
    const leadData = req.body;
    console.log('Lead submitted:', leadData);

    // Generate a case number
    const caseNumber = 'ST-' + new Date().getFullYear() + '-' + String(Math.floor(Math.random() * 9000) + 1000);

    // In production, you'd save to database here
    // For now, just return success
    res.json({
      success: true,
      lead: {
        id: 'lead_' + Date.now(),
        case_number: caseNumber,
        ...leadData
      }
    });
  } catch (e) {
    console.error('Lead error:', e.message);
    res.status(400).json({ error: e.message });
  }
});

// Record payment
app.post('/leads/:id/payment', async (req, res) => {
  try {
    console.log('Payment recorded for lead:', req.params.id);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

// Favicon routes - Chrome requests favicon.ico first, caches aggressively
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

// Serve the HTML file for root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'SympleTax_Portal_v6 (1).html'));
});

// Free Consultation page (formerly Get Started)
app.get('/free-consultation', (req, res) => {
  res.sendFile(path.join(__dirname, 'free-consultation.html'));
});

// Legacy redirect — /get-started → /free-consultation
app.get('/get-started', (req, res) => {
  res.redirect(301, '/free-consultation');
});

// Serve static files
app.use(express.static(__dirname));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SympleTax server running on http://localhost:${PORT}`);
  console.log('API endpoints available:');
  console.log('  GET  /config');
  console.log('  POST /create-payment-intent');
  console.log('  POST /leads');
});
