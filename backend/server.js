require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const leadsRouter = require('./routes/leads');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:5500',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:5500',
    'https://sympletax.com',
    'https://www.sympletax.com'
  ],
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.path} - ${res.statusCode} (${duration}ms)`);
  });
  next();
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API routes
app.use('/api/leads', leadsRouter);

// Serve static files from root directory (for the HTML portal)
app.use(express.static(path.join(__dirname, '..')));

// Catch-all for SPA
app.get('*', (req, res) => {
  // If it's an API route that doesn't exist, return 404
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API endpoint not found' });
  }
  // Otherwise serve the main HTML file
  res.sendFile(path.join(__dirname, '..', 'SympleTax_Portal_v6 (1).html'));
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🚀 SympleTax Backend Server Running                     ║
║                                                           ║
║   Local:    http://localhost:${PORT}                        ║
║   API:      http://localhost:${PORT}/api/leads              ║
║   Health:   http://localhost:${PORT}/api/health             ║
║                                                           ║
║   Supabase: ${process.env.SUPABASE_URL?.substring(0, 40)}...   ║
║   Email:    ${process.env.NOTIFICATION_EMAIL || 'Not configured'}                          ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;