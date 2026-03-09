# 🌿 Ginger Healthcare CRM — Enhanced

A professional, full-stack lead management CRM for Ginger Healthcare's medical tourism business. Captures leads from the chat widget at ginger.healthcare, auto-categorizes them, and provides counselors with a complete patient management workflow.

**Domain:** crm.ginger.healthcare

## Architecture

```
Chat Widget (ginger.healthcare) → API (Render) → PostgreSQL → CRM Dashboard (Render)
```

## What's New in the Enhanced Version

### 🏥 Three-Tab Lead Categorization
Incoming enquiries are **auto-sorted** into three categories:
1. **Patient Enquiries** — Medical tourism leads (primary focus)
2. **Other Queries** — Partnerships, hospital listings, job enquiries, collaborations
3. **Non-Targeted** — Blocked countries (India, Bangladesh, Pakistan) and irrelevant queries

Auto-categorization happens at webhook ingestion based on nationality and service type. Counselors can manually re-categorize any lead.

### 👥 Shift-Based Counselor Assignment
- Each counselor has a **shift window** (e.g., Dolma 09:00–15:00, Riyashree 15:00–21:00, Anushka 21:00–03:00)
- New patient leads are **auto-assigned** to the on-shift counselor via round-robin
- Counselors only see their own leads; managers/admins see all
- Shift times configurable in Settings

### 📝 Complete Editable Lead Record
Every field is **inline-editable** by clicking the ✏️ icon:
- **Enquirer Details**: Name, email, phone, ISD, nationality, contact preference, patient relation
- **Patient Details** (if someone else enquired): Relationship, patient name, age, nationality, separate contact info
- **Inquiry**: Service type, treatment, urgency, message, clinical notes
- **Doctor Referral**: Specialty, hospital, city, country, diagnosis (when a doctor referred)
- **Travel & Billing**: Estimated arrival/departure, accommodation, billing amount/currency/status

### 🏥 Medical Management Tab
- **Medical History** — Rich text field for patient's full history
- **Referred Hospitals** — Multi-select from top Indian hospitals (Medanta, Apollo, Fortis, etc.)
- **Recommended Doctors** — Multi-select from specialist directory
- **Patient Review** — Rating (1-5) and review text capture

### ⏰ Follow-Up System
- Schedule multiple follow-ups per lead with **date/time**, **method** (WhatsApp/Phone/Email/Telegram), and **notes**
- Mark follow-ups as completed with outcome recording
- **Overdue indicators** shown prominently in the dashboard and follow-up list
- Dashboard shows count of follow-ups due today

### 📎 Document Attachments
Organized by category:
- Treatment Plans, Passport Copies, Visa Invitations, Flight Tickets
- Medical Reports, Billing/Invoices, Insurance Documents, Prescriptions
- Stores metadata with cloud storage URLs (Google Drive, S3, etc.)

### 📊 Status Timeline
- Every status change is recorded with timestamp, who changed it, and optional note
- Visual timeline view shows the lead's journey from New → Converted
- Full activity log for audit trail

### 📈 Manager Analytics
- **Summary KPIs**: Total leads, converted, lost, avg conversion rate (30 days)
- **Counselor Comparison Table**: Total, converted, active, lost, conv%, overdue follow-ups, avg response time, this week's leads
- **30-Day Lead Volume Chart**: Bar chart showing daily lead intake
- Category breakdown showing volume in Patient / Other / Non-Targeted

### 🎨 Professional UI
- **Sidebar navigation** with collapsible layout
- **Category inbox tabs** in sidebar for quick switching
- **Tabbed detail view**: Overview, Medical, Follow-ups, Documents, Timeline, Notes
- Clean, branded design with Ginger Healthcare colors (navy + orange)
- Responsive and fast

## Features Retained from v1

- **Lead Pipeline**: New → Contacted → Qualified → In Treatment → Converted / Lost / Follow-Up
- **Role-Based Access**: Admin/Manager/Counselor hierarchy
- **WhatsApp Quick-Reply**: One-click WhatsApp link from lead detail
- **CSV Export**: Download all patient leads as spreadsheet
- **Auto-Assignment**: Round-robin within shift windows
- **Email Notifications**: Auto-notify counselors on new leads
- **Activity Log**: Full audit trail of all changes
- **User Management**: Admin can create/edit/deactivate users and reset passwords

## Deployment on Render

### Option A: Blueprint
1. Push to GitHub
2. Render Dashboard → **New → Blueprint** → Select repo
3. Render reads `render.yaml` and creates everything

### Option B: Manual
1. Create PostgreSQL database on Render
2. Create Web Service → connect GitHub repo
3. Environment variables:
   - `DATABASE_URL` = PostgreSQL connection string
   - `JWT_SECRET` = random string
   - `NODE_ENV` = production
   - `CLIENT_URL` = your Render app URL
4. Build: `npm run build` | Start: `npm start`

### Email (Optional)
- `SMTP_HOST` = smtp.gmail.com
- `SMTP_PORT` = 587
- `SMTP_USER` = your Gmail
- `SMTP_PASS` = Gmail App Password
- `NOTIFICATION_EMAIL` = admin@ghealth121.com

## Default Logins

| Username    | Password         | Role      | Shift (IST)  |
|-------------|------------------|-----------|---------------|
| admin       | GingerAdmin2026! | Admin     | —             |
| dolma       | Dolma2026!       | Counselor | 09:00 – 15:00 |
| riyashree   | Riyashree2026!   | Counselor | 15:00 – 21:00 |
| anushka     | Anushka2026!     | Counselor | 21:00 – 03:00 |

**⚠️ Change passwords after first login!**

## Connecting the Chat Widget

```javascript
function saveToSheet(d) {
  fetch('https://YOUR-CRM-URL.onrender.com/api/leads/webhook', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(d)
  }).then(r => r.json())
    .then(result => {
      console.log('CRM Response:', result);
      // result.category will be 'patient', 'other', or 'spam'
      if (result.counselor) {
        currentCounselor = { name: result.counselor };
      }
    }).catch(err => console.error('CRM save failed:', err));
}
```

## API Endpoints

### Public
- `POST /api/leads/webhook` — Receive lead (auto-categorizes)

### Protected
- `GET /api/leads?category=patient` — List leads by category
- `GET /api/leads/:id` — Full lead detail (notes, timeline, attachments, follow-ups)
- `PATCH /api/leads/:id` — Update ANY field (all fields editable)
- `POST /api/leads/:id/notes` — Add note
- `POST /api/leads/:id/follow-ups` — Schedule follow-up
- `PATCH /api/leads/:id/follow-ups/:fuId` — Complete/update follow-up
- `POST /api/leads/:id/attachments` — Add attachment metadata
- `DELETE /api/leads/:id/attachments/:attId` — Remove attachment
- `GET /api/leads/stats/dashboard` — Dashboard stats
- `GET /api/leads/stats/performance` — Counselor performance (admin/manager)
- `GET /api/leads/export/csv` — CSV export
- `GET /api/leads/follow-ups/due` — Today's due follow-ups

### Auth
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/change-password`
- `GET /api/auth/users` — List users (admin/manager)
- `POST /api/auth/users` — Create user (admin)
- `PATCH /api/auth/users/:id` — Update user + shift (admin)
