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

// Bypass — clears form state and sends user to home page
app.get('/reset', (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>Redirecting...</title></head><body>
  <script>
    localStorage.removeItem('sx_form');
    localStorage.removeItem('sx_utms');
    window.location.href = '/';
  </script></body></html>`);
});

// Bypass — go straight to thank-you page with missed-call state
app.get('/missed-call', (req, res) => {
  res.send(`<!DOCTYPE html><html><head><title>SympleTax</title>
  <style>
    body { margin: 0; font-family: 'Outfit', sans-serif; background: #F3F4F6; display: flex; align-items: center; justify-content: center; min-height: 100vh; }
    .ty-page { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 52px 24px; max-width: 620px; width: 100%; text-align: center; }
    .ty-success-ring { width: 76px; height: 76px; border-radius: 50%; background: linear-gradient(135deg, #ECFDF5, #D1FAE5); border: 3px solid #A7F3D0; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
    .ty-success-ring svg { width: 36px; height: 36px; color: #00B87C; }
    .ty-h { font-size: 38px; font-weight: 800; color: #0F1F45; letter-spacing: -0.8px; margin-bottom: 10px; }
    .ty-name { color: #00B87C; }
    .ty-sub { font-size: 16px; color: #374151; line-height: 1.6; margin-bottom: 24px; }
    .call-missed-icon { width: 64px; height: 64px; border-radius: 50%; background: #FEF3C7; border: 2px solid #FCD34D; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px; }
    .call-missed-icon svg { width: 32px; height: 32px; color: #D97706; }
    .call-missed-title { font-size: 22px; font-weight: 700; color: #0F1F45; margin-bottom: 10px; }
    .call-missed-sub { font-size: 15px; color: #6B7280; line-height: 1.6; margin-bottom: 24px; }
    .sched-card { background: #fff; border: 1px solid #E5E7EB; border-radius: 16px; padding: 24px; width: 100%; max-width: 420px; box-shadow: 0 4px 16px rgba(0,0,0,0.06); }
    .sched-header { display: flex; align-items: center; gap: 10px; margin-bottom: 16px; }
    .sched-icon { width: 36px; height: 36px; border-radius: 10px; background: #F0FDFA; display: flex; align-items: center; justify-content: center; }
    .sched-icon svg { width: 20px; height: 20px; color: #00B87C; }
    .sched-title { font-size: 15px; font-weight: 700; color: #0F1F45; }
    .sched-sub { font-size: 13px; color: #9CA3AF; }
    .time-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
    .time-btn { padding: 12px; border: 1.5px solid #E5E7EB; border-radius: 10px; background: #fff; cursor: pointer; font-size: 13px; font-weight: 600; color: #0F1F45; transition: all .15s; }
    .time-btn:hover { border-color: #00B87C; color: #00B87C; }
    .call-note { font-size: 11px; color: #9CA3AF; margin-top: 12px; text-align: center; }
    .call-note svg { width: 12px; height: 12px; vertical-align: middle; margin-right: 4px; }
  </style></head><body>
  <div class="ty-page">
    <div class="ty-success-ring">
      <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5"><path stroke-linecap="round" stroke-linejoin="round" d="m4.5 12.75 6 6 9-13.5"/></svg>
    </div>
    <h2 class="ty-h">We tried to call you,<br>but you didn't pick up.</h2>
    <p class="ty-sub">No worries — pick a time below and we'll call you when it's convenient for you.</p>
    <div class="sched-card">
      <div class="sched-header">
        <div class="sched-icon">
          <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 0 1 2.25-2.25h13.5A2.25 2.25 0 0 1 21 7.5v11.25m-18 0A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75m-18 0v-7.5A2.25 2.25 0 0 1 5.25 9h13.5A2.25 2.25 0 0 1 21 11.25v7.5"/></svg>
        </div>
        <div>
          <div class="sched-title">Schedule a Call</div>
          <div class="sched-sub">Pick a time that works for you</div>
        </div>
      </div>
      <div class="time-grid">
        <button class="time-btn">9:00 AM</button>
        <button class="time-btn">11:00 AM</button>
        <button class="time-btn">1:00 PM</button>
        <button class="time-btn">3:00 PM</button>
        <button class="time-btn">5:00 PM</button>
        <button class="time-btn">7:00 PM</button>
      </div>
      <div class="call-note">
        <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5Z"/></svg>
        Your information is secure &amp; encrypted
      </div>
    </div>
  </div>
</body></html>`);
});

// Explicitly serve /assets/* from project root (more reliable on Vercel serverless)
app.get('/assets/:file', (req, res) => {
  const filePath = path.join(process.cwd(), 'assets', req.params.file);
  res.sendFile(filePath, err => {
    if (err) res.status(404).send('Asset not found');
  });
});

// Serve static files LAST so explicit routes above always take priority
app.use(express.static(__dirname));

app.listen(PORT, '0.0.0.0', () => {
  console.log(`SympleTax server running on http://localhost:${PORT}`);
  console.log('API endpoints available:');
  console.log('  GET  /config');
  console.log('  POST /create-payment-intent');
  console.log('  POST /leads');
});
