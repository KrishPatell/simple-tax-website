# SympleTax Backend

Backend server for SympleTax Portal - handles lead submissions, payments, and email notifications.

## Quick Start

### 1. Set up Supabase Database

1. Go to [Supabase SQL Editor](https://supabase.com/dashboard/project/pmjtjmoekakaguovyndq/sql)
2. Copy the contents of `supabase-schema.sql`
3. Paste and click **Run**

This creates:
- `leads` table with all necessary fields
- `payments` table for payment tracking
- Proper indexes and RLS policies

### 2. Configure Email Notifications

Edit `.env` and set your email credentials:

```env
# For Gmail (use App Password, not your regular password)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password-here
NOTIFICATION_EMAIL=ari@sympletax.com
```

**To get a Gmail App Password:**
1. Go to [Google Account Settings](https://myaccount.google.com/)
2. Security → 2-Step Verification → App passwords
3. Generate a new app password for "Mail"
4. Use that password as `SMTP_PASS`

### 3. Install & Run

```bash
cd backend
npm install
npm start
```

Server runs at: `http://localhost:3001`

## API Endpoints

### POST /api/leads
Create a new lead

```json
{
  "first_name": "John",
  "last_name": "Smith",
  "email": "john@example.com",
  "phone": "(555) 123-4567",
  "debt_range": "s25to50",
  "debt_type": "federal",
  "irs_notice": "none",
  "tax_situation": "back_taxes",
  "federal_years": ["2023", "2022"],
  "state_years": [],
  "income": "s50to75",
  "expenses": "s3to5",
  "assets": "under25",
  "equity": "s50to150",
  "payment_plan": "full"
}
```

### POST /api/leads/:id/payment
Record a payment

```json
{
  "amount": 129,
  "plan": "full"
}
```

### GET /api/leads
List all leads

### GET /api/leads/:id
Get a single lead

### GET /api/health
Health check endpoint

## Email Notifications

When a lead is submitted or payment is received, emails are sent to `ari@sympletax.com` with:
- Client contact info
- Debt details
- Case number
- Estimated settlement

## Production Deployment

### Option 1: Railway / Render / Fly.io

1. Push to GitHub
2. Connect to Railway/Render
3. Set environment variables
4. Deploy

### Option 2: Vercel Serverless

Convert to serverless functions (see Vercel docs)

### Option 3: Traditional Server

Use PM2 for process management:

```bash
npm install -g pm2
pm2 start server.js --name sympletax-api
```

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `SUPABASE_URL` | Supabase project URL | ✅ |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key | ✅ |
| `SMTP_HOST` | Email SMTP host | For emails |
| `SMTP_PORT` | Email SMTP port | For emails |
| `SMTP_USER` | Email username | For emails |
| `SMTP_PASS` | Email password/app password | For emails |
| `NOTIFICATION_EMAIL` | Where to send notifications | For emails |
| `PORT` | Server port (default: 3001) | ❌ |
| `NODE_ENV` | Environment | ❌ |