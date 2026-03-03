# 🌿 Ginger Healthcare CRM

A full-stack lead management system for Ginger Healthcare. Captures leads directly from the chat widget, tracks them through a pipeline, and provides admin oversight of counselor performance.

## Architecture

```
Chat Widget (ghealth121.com) → API (Render) → PostgreSQL → CRM Dashboard (Render)
```

No Google Sheets needed — leads go directly to the database.

## Features

- **Lead Pipeline**: New → Contacted → Qualified → In Treatment → Converted / Lost / Follow-Up
- **Role-Based Access**: Admin sees all leads; counselors see only their assigned leads
- **Follow-Up Reminders**: Set dates and notes; overdue follow-ups shown on dashboard
- **Email Notifications**: Auto-notify counselors when new leads arrive
- **WhatsApp Quick-Reply**: One-click WhatsApp link from CRM to contact leads
- **CSV Export**: Download all leads as spreadsheet
- **Counselor Performance**: Admin dashboard with conversion rates and response times
- **Auto-Assignment**: Round-robin counselor assignment on new leads
- **Activity Log**: Full audit trail of all status changes and notes

## Deployment on Render

### Option A: One-Click (Blueprint)
1. Push this repo to GitHub
2. Go to [Render Dashboard](https://dashboard.render.com)
3. Click **"New" → "Blueprint"**
4. Select this repo — Render reads `render.yaml` and creates everything

### Option B: Manual Setup
1. **Create PostgreSQL database** on Render (free tier)
2. **Create Web Service** → connect to your GitHub repo
3. Set these environment variables:
   - `DATABASE_URL` = your Render PostgreSQL connection string
   - `JWT_SECRET` = any random string (e.g., generate at randomkeygen.com)
   - `NODE_ENV` = production
   - `CLIENT_URL` = your Render app URL
4. Build command: `npm run build`
5. Start command: `npm start`

### Email Notifications (Optional)
Add these env vars for email alerts:
- `SMTP_HOST` = smtp.gmail.com
- `SMTP_PORT` = 587
- `SMTP_USER` = your Gmail address
- `SMTP_PASS` = Gmail App Password ([create here](https://myaccount.google.com/apppasswords))
- `NOTIFICATION_EMAIL` = admin@ghealth121.com

## Default Login Credentials

| Username    | Password         | Role      |
|-------------|------------------|-----------|
| admin       | GingerAdmin2026! | Admin     |
| dolma       | Dolma2026!       | Counselor |
| riyashree   | Riyashree2026!   | Counselor |
| anushka     | Anushka2026!     | Counselor |

**⚠️ Change these passwords immediately after first login!**

## Connecting the Chat Widget

Update your chat widget to POST leads to the CRM instead of Google Sheets.

Replace the `saveToSheet()` function in your widget with:

```javascript
function saveToSheet(d) {
  // Send to CRM API
  fetch('https://YOUR-CRM-URL.onrender.com/api/leads/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(d)
  }).then(r => r.json())
    .then(result => {
      console.log('CRM Response:', result);
      if (result.counselor) {
        currentCounselor = { name: result.counselor };
      }
    }).catch(err => console.error('CRM save failed:', err));
}
```

## Local Development

```bash
# 1. Clone and install
git clone <your-repo>
cd ginger-crm
npm install
cd client && npm install && cd ..

# 2. Set up environment
cp .env.example .env
# Edit .env with your PostgreSQL connection string

# 3. Initialize database
npm run db:init

# 4. Start server (serves both API + React frontend)
npm run dev
# Open http://localhost:3001
```

## API Endpoints

### Public
- `POST /api/leads/webhook` — Receive lead from chat widget

### Protected (requires JWT token)
- `GET /api/leads` — List leads (with filters)
- `GET /api/leads/:id` — Get lead details + notes
- `PATCH /api/leads/:id` — Update lead status/counselor/priority
- `POST /api/leads/:id/notes` — Add note
- `GET /api/leads/stats/dashboard` — Dashboard statistics
- `GET /api/leads/stats/performance` — Counselor performance (admin)
- `GET /api/leads/export/csv` — Export as CSV
- `GET /api/leads/follow-ups/due` — Follow-ups due today

### Auth
- `POST /api/auth/login` — Login
- `GET /api/auth/me` — Current user
- `POST /api/auth/change-password` — Change password
