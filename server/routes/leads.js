const express = require('express');
const pool = require('../db');
const { auth } = require('../middleware/auth');
const { sendNewLeadNotification } = require('../utils/email');

const router = express.Router();

// ============================================================
// PUBLIC: Webhook endpoint for chat widget (no auth required)
// ============================================================
router.post('/webhook', async (req, res) => {
  try {
    const d = req.body;
    const leadId = d.leadId || `P${Date.now()}`;

    // Check if this lead already exists (early capture → later update with contact preference)
    let existing = null;
    if (d.email && d.phone) {
      const check = await pool.query(
        'SELECT lead_id, assigned_counselor FROM leads WHERE email = $1 AND phone = $2 AND created_at > NOW() - INTERVAL \'1 hour\' ORDER BY created_at DESC LIMIT 1',
        [d.email, d.phone]
      );
      if (check.rows.length > 0) existing = check.rows[0];
    }

    // If lead exists and this is an update (user picked WhatsApp/Telegram/Email)
    if (existing && d.contactPreference && d.contactPreference !== 'pending') {
      await pool.query(`
        UPDATE leads SET 
          service_type = COALESCE(NULLIF($1, ''), service_type),
          patient_relation = COALESCE(NULLIF($2, ''), patient_relation),
          relationship_type = COALESCE(NULLIF($3, ''), relationship_type),
          patient_prefix = COALESCE(NULLIF($4, ''), patient_prefix),
          patient_first_name = COALESCE(NULLIF($5, ''), patient_first_name),
          patient_last_name = COALESCE(NULLIF($6, ''), patient_last_name),
          patient_age = COALESCE(NULLIF($7, ''), patient_age),
          treatment_sought = COALESCE(NULLIF($8, ''), treatment_sought),
          urgency_level = COALESCE(NULLIF($9, ''), urgency_level),
          message = COALESCE(NULLIF($10, ''), message),
          clinical_notes = COALESCE(NULLIF($11, ''), clinical_notes),
          contact_preference = $12,
          is_doctor = $13,
          doctor_specialty = COALESCE(NULLIF($14, ''), doctor_specialty),
          doctor_hospital = COALESCE(NULLIF($15, ''), doctor_hospital),
          doctor_city = COALESCE(NULLIF($16, ''), doctor_city),
          doctor_country = COALESCE(NULLIF($17, ''), doctor_country),
          primary_diagnosis = COALESCE(NULLIF($18, ''), primary_diagnosis),
          updated_at = NOW()
        WHERE lead_id = $19
      `, [
        d.serviceType || '', d.patientRelation || '', d.relationshipType || '',
        d.patientPrefix || '', d.patientFirstName || '', d.patientLastName || '',
        d.patientAge || '', d.treatmentSought || '', d.urgencyLevel || '',
        d.message || '', d.clinicalNotes || '', d.contactPreference,
        d.isDoctor || false, d.doctorSpecialty || '', d.doctorHospital || '',
        d.doctorCity || '', d.doctorCountry || '', d.primaryDiagnosis || '',
        existing.lead_id
      ]);

      // Update priority if urgency provided
      if (d.urgencyLevel) {
        let priority = 'medium';
        if (d.urgencyLevel === 'Emergency' || d.urgencyLevel === 'Urgent') priority = 'high';
        else if (d.urgencyLevel === 'Routine') priority = 'low';
        await pool.query('UPDATE leads SET priority = $1 WHERE lead_id = $2', [priority, existing.lead_id]);
      }

      await pool.query('INSERT INTO activity_log (lead_id, user_name, action, details) VALUES ($1, $2, $3, $4)',
        [existing.lead_id, 'System', 'lead_updated', `Contact preference: ${d.contactPreference}, Treatment: ${d.treatmentSought || 'N/A'}`]);

      console.log(`Lead updated: ${existing.lead_id} → ${d.contactPreference}`);
      return res.json({ success: true, leadId: existing.lead_id, counselor: existing.assigned_counselor, updated: true });
    }

    // New lead — assign counselor via round-robin
    let counselor = d.assignedCounselor;
    if (!counselor) {
      const countRes = await pool.query(`
        SELECT assigned_counselor, COUNT(*) as cnt 
        FROM leads WHERE created_at > NOW() - INTERVAL '30 days' 
        GROUP BY assigned_counselor
      `);
      const counts = {};
      ['Dolma', 'Riyashree', 'Anushka'].forEach(c => counts[c] = 0);
      countRes.rows.forEach(r => { if (counts[r.assigned_counselor] !== undefined) counts[r.assigned_counselor] = parseInt(r.cnt); });
      counselor = Object.entries(counts).sort((a, b) => a[1] - b[1])[0][0];
    }

    let priority = 'medium';
    if (d.urgencyLevel === 'Emergency') priority = 'high';
    else if (d.urgencyLevel === 'Urgent') priority = 'high';
    else if (d.urgencyLevel === 'Routine') priority = 'low';

    const result = await pool.query(`
      INSERT INTO leads (
        lead_id, prefix, first_name, last_name, email, isd, phone, nationality,
        service_type, patient_relation, relationship_type,
        patient_prefix, patient_first_name, patient_last_name, patient_age, patient_nationality,
        is_doctor, doctor_specialty, doctor_hospital, doctor_city, doctor_country,
        primary_diagnosis, treatment_sought, urgency_level, message, clinical_notes,
        contact_preference, assigned_counselor, page_url, page_title, referrer,
        status, priority
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, 'new', $32
      ) RETURNING *
    `, [
      leadId, d.prefix, d.firstName, d.lastName, d.email, d.isd, d.phone, d.nationality,
      d.serviceType, d.patientRelation, d.relationshipType,
      d.patientPrefix, d.patientFirstName, d.patientLastName, d.patientAge, d.patientNationality,
      d.isDoctor || false, d.doctorSpecialty, d.doctorHospital, d.doctorCity, d.doctorCountry,
      d.primaryDiagnosis, d.treatmentSought, d.urgencyLevel, d.message, d.clinicalNotes,
      d.contactPreference, counselor, d.pageUrl, d.pageTitle, d.referrer, priority
    ]);

    const lead = result.rows[0];

    // Only send email notification for non-pending leads (or first capture)
    if (d.contactPreference !== 'pending') {
      const counselorRes = await pool.query('SELECT email FROM users WHERE display_name = $1', [counselor]);
      const counselorEmail = counselorRes.rows[0]?.email;
      sendNewLeadNotification(lead, counselorEmail).catch(() => {});
    }

    await pool.query('INSERT INTO activity_log (lead_id, user_name, action, details) VALUES ($1, $2, $3, $4)',
      [leadId, 'System', 'lead_created', `New lead from ${d.nationality || 'unknown'}${d.contactPreference === 'pending' ? ' (early capture)' : ' via ' + d.contactPreference}`]);

    res.json({ success: true, leadId, counselor });
  } catch (e) {
    console.error('Webhook error:', e);
    res.status(500).json({ error: 'Failed to save lead' });
  }
});

// ============================================================
// STATIC ROUTES — must come BEFORE /:leadId
// ============================================================

router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    let counselorFilter = '';
    let params = [];
    if (req.user.role === 'counselor') {
      counselorFilter = 'WHERE assigned_counselor = $1';
      params = [req.user.name];
    }

    const [statusRes, counselorRes, contactRes, todayRes, urgentRes, followUpRes, weeklyRes] = await Promise.all([
      pool.query(`SELECT status, COUNT(*) as count FROM leads ${counselorFilter} GROUP BY status`, params),
      pool.query(`SELECT assigned_counselor, COUNT(*) as count FROM leads GROUP BY assigned_counselor`),
      pool.query(`SELECT contact_preference, COUNT(*) as count FROM leads ${counselorFilter} GROUP BY contact_preference`, params),
      pool.query(`SELECT COUNT(*) FROM leads ${counselorFilter ? counselorFilter + ' AND' : 'WHERE'} created_at >= CURRENT_DATE`, params),
      pool.query(`SELECT COUNT(*) FROM leads ${counselorFilter ? counselorFilter + ' AND' : 'WHERE'} urgency_level IN ('Urgent', 'Emergency') AND status NOT IN ('converted', 'lost')`, params),
      pool.query(`SELECT COUNT(*) FROM leads ${counselorFilter ? counselorFilter + ' AND' : 'WHERE'} follow_up_date <= CURRENT_DATE AND status NOT IN ('converted', 'lost')`, params),
      pool.query(`
        SELECT DATE(created_at) as day, COUNT(*) as count 
        FROM leads ${counselorFilter ? counselorFilter + ' AND' : 'WHERE'} created_at >= CURRENT_DATE - INTERVAL '7 days'
        GROUP BY DATE(created_at) ORDER BY day
      `, params),
    ]);

    const byStatus = {};
    statusRes.rows.forEach(r => byStatus[r.status] = parseInt(r.count));
    const byCounselor = {};
    counselorRes.rows.forEach(r => byCounselor[r.assigned_counselor] = parseInt(r.count));
    const byContact = {};
    contactRes.rows.forEach(r => byContact[r.contact_preference] = parseInt(r.count));
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

    res.json({
      total,
      today: parseInt(todayRes.rows[0].count),
      urgent: parseInt(urgentRes.rows[0].count),
      followUpDue: parseInt(followUpRes.rows[0].count),
      byStatus, byCounselor, byContact,
      weekly: weeklyRes.rows,
      conversionRate: total > 0 ? Math.round(((byStatus.converted || 0) / total) * 100) : 0
    });
  } catch (e) {
    console.error('Stats error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/stats/performance', auth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        assigned_counselor,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'converted') as converted,
        COUNT(*) FILTER (WHERE status = 'new') as pending_new,
        COUNT(*) FILTER (WHERE status IN ('contacted', 'qualified', 'in_treatment', 'follow_up')) as active,
        COUNT(*) FILTER (WHERE status = 'lost') as lost,
        ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600)::numeric, 1) as avg_response_hours
      FROM leads
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY assigned_counselor
    `);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/export/csv', auth, async (req, res) => {
  try {
    let where = '';
    let params = [];
    if (req.user.role === 'counselor') {
      where = 'WHERE assigned_counselor = $1';
      params = [req.user.name];
    }

    const result = await pool.query(`SELECT * FROM leads ${where} ORDER BY created_at DESC`, params);
    
    const headers = [
      'Lead ID', 'Date', 'Name', 'Email', 'Phone', 'Country', 'Service', 'Treatment',
      'Urgency', 'Patient', 'Status', 'Priority', 'Counselor', 'Contact Via',
      'Message', 'Follow-Up Date', 'Source'
    ];

    const rows = result.rows.map(r => [
      r.lead_id,
      new Date(r.created_at).toISOString().split('T')[0],
      `${r.prefix || ''} ${r.first_name} ${r.last_name}`.trim(),
      r.email,
      `${r.isd || ''} ${r.phone || ''}`.trim(),
      r.nationality,
      r.service_type,
      r.treatment_sought || '',
      r.urgency_level || '',
      r.patient_relation === 'self' ? 'Self' : `${r.patient_first_name || ''} ${r.patient_last_name || ''}`.trim(),
      r.status,
      r.priority,
      r.assigned_counselor,
      r.contact_preference,
      (r.message || '').replace(/"/g, '""').substring(0, 200),
      r.follow_up_date || '',
      r.referrer || ''
    ]);

    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="ginger-leads-${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  } catch (e) {
    res.status(500).json({ error: 'Export failed' });
  }
});

router.get('/follow-ups/due', auth, async (req, res) => {
  try {
    let counselorFilter = '';
    let params = [];
    if (req.user.role === 'counselor') {
      counselorFilter = 'AND assigned_counselor = $1';
      params = [req.user.name];
    }
    const result = await pool.query(`
      SELECT * FROM leads 
      WHERE follow_up_date <= CURRENT_DATE 
      AND status NOT IN ('converted', 'lost')
      ${counselorFilter}
      ORDER BY follow_up_date ASC
    `, params);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get all leads (with filtering)
router.get('/', auth, async (req, res) => {
  try {
    const { status, counselor, urgency, search, sort, order, limit, offset } = req.query;
    let where = [];
    let params = [];
    let i = 1;

    if (req.user.role === 'counselor') {
      where.push(`assigned_counselor = $${i++}`);
      params.push(req.user.name);
    } else if (counselor && counselor !== 'all') {
      where.push(`assigned_counselor = $${i++}`);
      params.push(counselor);
    }

    if (status && status !== 'all') { where.push(`status = $${i++}`); params.push(status); }
    if (urgency && urgency !== 'all') { where.push(`urgency_level = $${i++}`); params.push(urgency); }
    if (search) {
      where.push(`(
        first_name ILIKE $${i} OR last_name ILIKE $${i} OR email ILIKE $${i} 
        OR phone ILIKE $${i} OR nationality ILIKE $${i} OR treatment_sought ILIKE $${i}
        OR message ILIKE $${i}
      )`);
      params.push(`%${search}%`);
      i++;
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    const sortField = sort || 'created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    const lim = Math.min(parseInt(limit) || 100, 500);
    const off = parseInt(offset) || 0;

    const countRes = await pool.query(`SELECT COUNT(*) FROM leads ${whereClause}`, params);
    const dataRes = await pool.query(
      `SELECT * FROM leads ${whereClause} ORDER BY ${sortField} ${sortOrder} LIMIT ${lim} OFFSET ${off}`,
      params
    );

    res.json({ total: parseInt(countRes.rows[0].count), leads: dataRes.rows });
  } catch (e) {
    console.error('Get leads error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// DYNAMIC ROUTES — must be LAST (/:leadId matches anything)
// ============================================================

router.get('/:leadId', auth, async (req, res) => {
  try {
    const leadRes = await pool.query('SELECT * FROM leads WHERE lead_id = $1', [req.params.leadId]);
    if (leadRes.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });

    const notesRes = await pool.query('SELECT * FROM notes WHERE lead_id = $1 ORDER BY created_at DESC', [req.params.leadId]);
    const activityRes = await pool.query('SELECT * FROM activity_log WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 50', [req.params.leadId]);

    res.json({ ...leadRes.rows[0], notes: notesRes.rows, activity: activityRes.rows });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:leadId', auth, async (req, res) => {
  try {
    const allowed = ['status', 'priority', 'assigned_counselor', 'follow_up_date', 'follow_up_note', 'urgency_level'];
    const updates = [];
    const params = [];
    let i = 1;

    for (const [key, value] of Object.entries(req.body)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = $${i++}`);
        params.push(value);
      }
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

    updates.push(`updated_at = NOW()`);
    params.push(req.params.leadId);

    const result = await pool.query(
      `UPDATE leads SET ${updates.join(', ')} WHERE lead_id = $${i} RETURNING *`,
      params
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });

    const changes = Object.entries(req.body).filter(([k]) => allowed.includes(k)).map(([k, v]) => `${k}: ${v}`).join(', ');
    await pool.query('INSERT INTO activity_log (lead_id, user_name, action, details) VALUES ($1, $2, $3, $4)',
      [req.params.leadId, req.user.name, 'lead_updated', changes]);

    res.json(result.rows[0]);
  } catch (e) {
    console.error('Update lead error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/:leadId/notes', auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Note text required' });

    const result = await pool.query(
      'INSERT INTO notes (lead_id, author, text) VALUES ($1, $2, $3) RETURNING *',
      [req.params.leadId, req.user.name, text.trim()]
    );

    await pool.query('UPDATE leads SET updated_at = NOW() WHERE lead_id = $1', [req.params.leadId]);
    await pool.query('INSERT INTO activity_log (lead_id, user_name, action, details) VALUES ($1, $2, $3, $4)',
      [req.params.leadId, req.user.name, 'note_added', text.trim().substring(0, 100)]);

    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
