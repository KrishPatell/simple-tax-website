# SympleTax Lead Intake Portal

## Overview
Interactive lead intake form for SympleTax tax relief services. Single-page HTML application with a multi-step form flow that collects client information and processes case activation payments.

## Architecture
- **Single HTML file**: `SympleTax_Portal_v6 (1).html` — contains all CSS, HTML, and JavaScript
- **Server**: `server.js` — simple Node.js HTTP server serving the HTML file on port 5000
- **No external dependencies** — vanilla JS, Google Fonts (Inter + Outfit)

## Form Flow (12 steps)
1. Debt range estimation
2. Federal / State / Both tax type
3. IRS notices received
4. Tax situation description → inline auto-calculator appears showing cost of waiting
5. Personal info (First Name, Last Name, Email, Phone)
6. Annual income range
7. Tax years owed (split into Federal and State sections)
8. Financial details (expenses, savings, equity)
9. Analysis animation
10. Detailed cost of waiting breakdown
11. Results + payment plan selection ($99 one-time or $79/mo x 2)
12. Success / confirmation

## Key Features
- TaxRise-inspired modern, clean design
- Landing page with customer reviews and confidentiality statement
- Inline cost-of-waiting calculator after situation selection
- Federal/State split tax year selection
- Two payment plan options ($99 or $79x2)
- Progress bar tracking
- Animated analysis step
- Live daily accrual ticker on cost-of-waiting page

## Running
```
node server.js
```
Serves on port 5000.
