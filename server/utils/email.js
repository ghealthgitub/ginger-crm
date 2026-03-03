const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (!transporter && process.env.SMTP_HOST) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
  }
  return transporter;
}

async function sendNewLeadNotification(lead, counselorEmail) {
  const t = getTransporter();
  if (!t) return;
  try {
    const to = [counselorEmail, process.env.NOTIFICATION_EMAIL].filter(Boolean).join(',');
    if (!to) return;
    await t.sendMail({
      from: `"Ginger CRM" <${process.env.SMTP_USER}>`,
      to,
      subject: `🆕 New Lead: ${lead.first_name} ${lead.last_name} — ${lead.nationality}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#00315a;color:white;padding:16px 20px;border-radius:8px 8px 0 0">
            <h2 style="margin:0;font-size:18px">🌿 New Lead Received</h2>
          </div>
          <div style="background:white;padding:20px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
            <table style="width:100%;font-size:14px;border-collapse:collapse">
              <tr><td style="padding:6px 0;color:#64748b;width:140px">Name</td><td style="padding:6px 0;font-weight:600">${lead.prefix || ''} ${lead.first_name} ${lead.last_name}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Email</td><td style="padding:6px 0">${lead.email || '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Phone</td><td style="padding:6px 0">${lead.isd || ''} ${lead.phone || '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Country</td><td style="padding:6px 0">${lead.nationality || '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Treatment</td><td style="padding:6px 0">${lead.treatment_sought || lead.service_type || '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Urgency</td><td style="padding:6px 0;font-weight:600;color:${lead.urgency_level === 'Emergency' ? '#ef4444' : lead.urgency_level === 'Urgent' ? '#f97316' : '#0f172a'}">${lead.urgency_level || '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Contact Via</td><td style="padding:6px 0">${lead.contact_preference || '—'}</td></tr>
              <tr><td style="padding:6px 0;color:#64748b">Assigned To</td><td style="padding:6px 0;font-weight:600">${lead.assigned_counselor || '—'}</td></tr>
            </table>
            ${lead.message ? `<div style="margin-top:12px;padding:10px;background:#f8fafc;border-radius:6px;font-size:13px"><strong>Message:</strong><br>${lead.message}</div>` : ''}
            <div style="margin-top:16px;text-align:center">
              <a href="${process.env.CLIENT_URL || '#'}" style="display:inline-block;padding:10px 24px;background:#ff6308;color:white;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">Open CRM</a>
            </div>
          </div>
        </div>
      `
    });
    console.log(`Email notification sent for lead: ${lead.first_name} ${lead.last_name}`);
  } catch (e) {
    console.error('Email notification failed:', e.message);
  }
}

async function sendFollowUpReminder(lead, counselorEmail) {
  const t = getTransporter();
  if (!t || !counselorEmail) return;
  try {
    await t.sendMail({
      from: `"Ginger CRM" <${process.env.SMTP_USER}>`,
      to: counselorEmail,
      subject: `⏰ Follow-up Due: ${lead.first_name} ${lead.last_name}`,
      html: `
        <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto">
          <div style="background:#f59e0b;color:white;padding:16px 20px;border-radius:8px 8px 0 0">
            <h2 style="margin:0;font-size:18px">⏰ Follow-Up Reminder</h2>
          </div>
          <div style="background:white;padding:20px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px">
            <p style="font-size:14px"><strong>${lead.prefix || ''} ${lead.first_name} ${lead.last_name}</strong> from <strong>${lead.nationality}</strong> has a follow-up due today.</p>
            ${lead.follow_up_note ? `<p style="font-size:13px;background:#fffbeb;padding:10px;border-radius:6px"><strong>Note:</strong> ${lead.follow_up_note}</p>` : ''}
            <div style="margin-top:16px;text-align:center">
              <a href="${process.env.CLIENT_URL || '#'}" style="display:inline-block;padding:10px 24px;background:#ff6308;color:white;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px">Open in CRM</a>
            </div>
          </div>
        </div>
      `
    });
  } catch (e) {
    console.error('Follow-up email failed:', e.message);
  }
}

module.exports = { sendNewLeadNotification, sendFollowUpReminder };
