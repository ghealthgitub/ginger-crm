const express = require('express');
const pool = require('../db');
const { auth, managerOrAdmin } = require('../middleware/auth');
const { sendNewLeadNotification } = require('../utils/email');

const router = express.Router();

// Blocked countries for auto-categorization
const BLOCKED_COUNTRIES = ['india', 'bangladesh', 'pakistan'];

function categorizeFromNationality(nationality) {
  if (!nationality) return 'patient';
  if (BLOCKED_COUNTRIES.includes(nationality.toLowerCase())) return 'spam';
  return 'patient';
}

function categorizeFromServiceType(serviceType) {
  if (!serviceType) return 'patient';
  const s = serviceType.toLowerCase();
  if (s.includes('partner') || s.includes('listing') || s.includes('job') || s.includes('collaborate') || s.includes('business')) return 'other';
  return 'patient';
}

// ============================================================
// PUBLIC: Get current on-duty counselor (for chat widget)
// ============================================================
router.get('/on-duty', async (req, res) => {
  try {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const ist = new Date(now.getTime() + istOffset);
    const currentDay = ist.getUTCDay();
    const currentTime = `${String(ist.getUTCHours()).padStart(2,'0')}:${String(ist.getUTCMinutes()).padStart(2,'0')}`;

    // Check overrides
    const overrideRes = await pool.query(
      `SELECT user_id FROM schedule_overrides WHERE override_date = CURRENT_DATE AND is_off = true`
    );
    const offUserIds = overrideRes.rows.map(r => r.user_id);

    // Find on-duty from schedules table
    const schedRes = await pool.query(`
      SELECT cs.user_id, cs.slot_start, cs.slot_end, u.display_name, u.role, u.whatsapp, u.telegram, u.email
      FROM counselor_schedules cs
      JOIN users u ON cs.user_id = u.id
      WHERE cs.day_of_week = $1 AND cs.is_active = true AND u.is_active = true
      ${offUserIds.length > 0 ? `AND cs.user_id NOT IN (${offUserIds.join(',')})` : ''}
    `, [currentDay]);

    let onDuty = [];
    for (const s of schedRes.rows) {
      const start = s.slot_start?.substring(0, 5);
      const end = s.slot_end?.substring(0, 5);
      if (!start || !end) continue;
      let isOnShift = false;
      if (start < end) {
        isOnShift = currentTime >= start && currentTime < end;
      } else {
        isOnShift = currentTime >= start || currentTime < end;
      }
      if (isOnShift) {
        onDuty.push({
          name: s.display_name,
          role: s.role,
          whatsapp: s.whatsapp,
          telegram: s.telegram,
          email: s.email,
          shift: `${start} - ${end}`
        });
      }
    }

    // Fallback: check users table shift fields
    if (onDuty.length === 0) {
      const fallbackRes = await pool.query(
        `SELECT display_name, role, whatsapp, telegram, email, shift_start, shift_end FROM users WHERE is_active = true AND shift_start IS NOT NULL AND shift_end IS NOT NULL`
      );
      for (const c of fallbackRes.rows) {
        const start = c.shift_start?.substring(0, 5);
        const end = c.shift_end?.substring(0, 5);
        if (!start || !end) continue;
        let isOn = start < end ? (currentTime >= start && currentTime < end) : (currentTime >= start || currentTime < end);
        if (isOn) {
          onDuty.push({ name: c.display_name, role: c.role, whatsapp: c.whatsapp, telegram: c.telegram, email: c.email, shift: `${start} - ${end}` });
        }
      }
    }

    res.json({
      currentTime: currentTime + ' IST',
      day: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][currentDay],
      onDuty,
      hasStaff: onDuty.length > 0
    });
  } catch (e) {
    console.error('On-duty error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// PUBLIC: Webhook endpoint for chat widget
// ============================================================
router.post('/webhook', async (req, res) => {
  try {
    const d = req.body;
    const leadId = d.leadId || `P${Date.now()}`;

    // Auto-categorize
    let category = categorizeFromNationality(d.nationality);
    if (category === 'patient') category = categorizeFromServiceType(d.serviceType);
    // Allow explicit override
    if (d.leadCategory) category = d.leadCategory;

    // Check existing
    let existing = null;
    if (d.email && d.phone) {
      const check = await pool.query(
        'SELECT lead_id, assigned_counselor FROM leads WHERE email = $1 AND phone = $2 AND created_at > NOW() - INTERVAL \'1 hour\' ORDER BY created_at DESC LIMIT 1',
        [d.email, d.phone]
      );
      if (check.rows.length > 0) existing = check.rows[0];
    }

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
          lead_category = $19,
          updated_at = NOW()
        WHERE lead_id = $20
      `, [
        d.serviceType || '', d.patientRelation || '', d.relationshipType || '',
        d.patientPrefix || '', d.patientFirstName || '', d.patientLastName || '',
        d.patientAge || '', d.treatmentSought || '', d.urgencyLevel || '',
        d.message || '', d.clinicalNotes || '', d.contactPreference,
        d.isDoctor || false, d.doctorSpecialty || '', d.doctorHospital || '',
        d.doctorCity || '', d.doctorCountry || '', d.primaryDiagnosis || '',
        category, existing.lead_id
      ]);

      if (d.urgencyLevel) {
        let priority = 'medium';
        if (d.urgencyLevel === 'Emergency' || d.urgencyLevel === 'Urgent') priority = 'high';
        else if (d.urgencyLevel === 'Routine') priority = 'low';
        await pool.query('UPDATE leads SET priority = $1 WHERE lead_id = $2', [priority, existing.lead_id]);
      }

      await pool.query('INSERT INTO activity_log (lead_id, user_name, action, details) VALUES ($1, $2, $3, $4)',
        [existing.lead_id, 'System', 'lead_updated', `Contact preference: ${d.contactPreference}, Treatment: ${d.treatmentSought || 'N/A'}`]);

      return res.json({ success: true, leadId: existing.lead_id, counselor: existing.assigned_counselor, updated: true });
    }

    // New lead — assign to on-duty staff via schedules (only for patient leads)
    let counselor = d.assignedCounselor;
    if (!counselor && category === 'patient') {
      const now = new Date();
      // Calculate IST
      const istOffset = 5.5 * 60 * 60 * 1000;
      const ist = new Date(now.getTime() + istOffset);
      const currentDay = ist.getUTCDay(); // 0=Sun, 6=Sat
      const currentTime = `${String(ist.getUTCHours()).padStart(2,'0')}:${String(ist.getUTCMinutes()).padStart(2,'0')}`;

      // Check for schedule overrides first (day offs)
      const overrideRes = await pool.query(
        `SELECT user_id FROM schedule_overrides WHERE override_date = CURRENT_DATE AND is_off = true`
      );
      const offUserIds = overrideRes.rows.map(r => r.user_id);

      // Find staff with active schedules for current day/time
      const schedRes = await pool.query(`
        SELECT cs.user_id, cs.slot_start, cs.slot_end, u.display_name
        FROM counselor_schedules cs
        JOIN users u ON cs.user_id = u.id
        WHERE cs.day_of_week = $1 AND cs.is_active = true AND u.is_active = true
        ${offUserIds.length > 0 ? `AND cs.user_id NOT IN (${offUserIds.join(',')})` : ''}
      `, [currentDay]);

      let onShift = [];
      for (const s of schedRes.rows) {
        const start = s.slot_start?.substring(0, 5);
        const end = s.slot_end?.substring(0, 5);
        if (!start || !end) continue;
        if (start < end) {
          if (currentTime >= start && currentTime < end) onShift.push(s.display_name);
        } else {
          // Overnight shift
          if (currentTime >= start || currentTime < end) onShift.push(s.display_name);
        }
      }

      // Also check users with shift_start/shift_end set directly (fallback)
      if (onShift.length === 0) {
        const fallbackRes = await pool.query(
          `SELECT display_name, shift_start, shift_end FROM users WHERE is_active = true AND shift_start IS NOT NULL AND shift_end IS NOT NULL`
        );
        for (const c of fallbackRes.rows) {
          const start = c.shift_start?.substring(0, 5);
          const end = c.shift_end?.substring(0, 5);
          if (!start || !end) continue;
          if (start < end) {
            if (currentTime >= start && currentTime < end) onShift.push(c.display_name);
          } else {
            if (currentTime >= start || currentTime < end) onShift.push(c.display_name);
          }
        }
      }

      if (onShift.length > 0) {
        // Round-robin among on-shift staff
        const countRes = await pool.query(`
          SELECT assigned_counselor, COUNT(*) as cnt 
          FROM leads WHERE created_at > NOW() - INTERVAL '24 hours' AND assigned_counselor = ANY($1)
          GROUP BY assigned_counselor
        `, [onShift]);
        const counts = {};
        onShift.forEach(c => counts[c] = 0);
        countRes.rows.forEach(r => { if (counts[r.assigned_counselor] !== undefined) counts[r.assigned_counselor] = parseInt(r.cnt); });
        counselor = Object.entries(counts).sort((a, b) => a[1] - b[1])[0][0];
      } else {
        // No one on shift — round-robin among all active users with schedules
        const allStaff = await pool.query(
          `SELECT DISTINCT u.display_name FROM users u WHERE u.is_active = true AND (u.shift_start IS NOT NULL OR EXISTS (SELECT 1 FROM counselor_schedules cs WHERE cs.user_id = u.id AND cs.is_active = true))`
        );
        const names = allStaff.rows.map(r => r.display_name);
        if (names.length > 0) {
          const countRes = await pool.query(`
            SELECT assigned_counselor, COUNT(*) as cnt 
            FROM leads WHERE created_at > NOW() - INTERVAL '30 days' 
            GROUP BY assigned_counselor
          `);
          const counts = {};
          names.forEach(c => counts[c] = 0);
          countRes.rows.forEach(r => { if (counts[r.assigned_counselor] !== undefined) counts[r.assigned_counselor] = parseInt(r.cnt); });
          counselor = Object.entries(counts).sort((a, b) => a[1] - b[1])[0]?.[0] || 'Admin';
        } else {
          counselor = 'Admin';
        }
      }
    } else if (!counselor) {
      counselor = 'Admin';
    }

    let priority = 'medium';
    if (d.urgencyLevel === 'Emergency') priority = 'high';
    else if (d.urgencyLevel === 'Urgent') priority = 'high';
    else if (d.urgencyLevel === 'Routine') priority = 'low';

    const result = await pool.query(`
      INSERT INTO leads (
        lead_id, lead_category, prefix, first_name, last_name, email, isd, phone, nationality,
        service_type, patient_relation, relationship_type,
        patient_prefix, patient_first_name, patient_last_name, patient_age, patient_nationality,
        is_doctor, doctor_specialty, doctor_hospital, doctor_city, doctor_country,
        primary_diagnosis, treatment_sought, urgency_level, message, clinical_notes,
        contact_preference, assigned_counselor, page_url, page_title, referrer,
        status, priority
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17,
        $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, 'new', $33
      ) RETURNING *
    `, [
      leadId, category, d.prefix, d.firstName, d.lastName, d.email, d.isd, d.phone, d.nationality,
      d.serviceType, d.patientRelation, d.relationshipType,
      d.patientPrefix, d.patientFirstName, d.patientLastName, d.patientAge, d.patientNationality,
      d.isDoctor || false, d.doctorSpecialty, d.doctorHospital, d.doctorCity, d.doctorCountry,
      d.primaryDiagnosis, d.treatmentSought, d.urgencyLevel, d.message, d.clinicalNotes,
      d.contactPreference, counselor, d.pageUrl, d.pageTitle, d.referrer, priority
    ]);

    const lead = result.rows[0];

    // ============================================================
    // AUTO-CREATE / LINK CONTACT
    // ============================================================
    try {
      let contactId = null;

      // Try to find existing contact by email+phone, then email, then phone
      if (d.email && d.phone) {
        const existing = await pool.query(
          'SELECT contact_id FROM contacts WHERE email = $1 AND phone = $2 LIMIT 1',
          [d.email, d.phone]
        );
        if (existing.rows.length > 0) contactId = existing.rows[0].contact_id;
      }
      if (!contactId && d.email) {
        const existing = await pool.query(
          'SELECT contact_id FROM contacts WHERE email = $1 LIMIT 1',
          [d.email]
        );
        if (existing.rows.length > 0) contactId = existing.rows[0].contact_id;
      }
      if (!contactId && d.phone) {
        const existing = await pool.query(
          'SELECT contact_id FROM contacts WHERE phone = $1 LIMIT 1',
          [d.phone]
        );
        if (existing.rows.length > 0) contactId = existing.rows[0].contact_id;
      }

      // Create new contact if not found
      if (!contactId) {
        contactId = `C${Date.now()}${Math.random().toString(36).substring(2,6)}`;
        await pool.query(`
          INSERT INTO contacts (
            contact_id, prefix, first_name, last_name, email, isd, phone,
            nationality, contact_type, relationship_type, contact_preference,
            page_url, page_title, referrer, assigned_counselor
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'patient',$9,$10,$11,$12,$13,$14)
          ON CONFLICT DO NOTHING
        `, [
          contactId, d.prefix, d.firstName, d.lastName, d.email,
          d.isd, d.phone, d.nationality, d.relationshipType,
          d.contactPreference, d.pageUrl, d.pageTitle, d.referrer, counselor
        ]);
      }

      // Link lead to contact
      if (contactId) {
        await pool.query('UPDATE leads SET contact_id = $1 WHERE lead_id = $2', [contactId, leadId]);
      }
    } catch (contactErr) {
      console.error('Contact auto-link error (non-fatal):', contactErr);
      // Non-fatal — lead is already saved
    }

    // Record initial status in timeline
    await pool.query('INSERT INTO status_timeline (lead_id, status, changed_by, note) VALUES ($1, $2, $3, $4)',
      [leadId, 'new', 'System', `Lead captured from ${d.nationality || 'unknown'} via ${d.contactPreference || 'website'}`]);

    if (d.contactPreference !== 'pending') {
      const counselorRes = await pool.query('SELECT email FROM users WHERE display_name = $1', [counselor]);
      const counselorEmail = counselorRes.rows[0]?.email;
      sendNewLeadNotification(lead, counselorEmail).catch(() => {});
    }

    await pool.query('INSERT INTO activity_log (lead_id, user_name, action, details) VALUES ($1, $2, $3, $4)',
      [leadId, 'System', 'lead_created', `New ${category} lead from ${d.nationality || 'unknown'}${d.contactPreference === 'pending' ? ' (early capture)' : ' via ' + d.contactPreference}`]);

    res.json({ success: true, leadId, counselor, category });
  } catch (e) {
    console.error('Webhook error:', e);
    res.status(500).json({ error: 'Failed to save lead' });
  }
});

// ============================================================
// STATIC ROUTES
// ============================================================

router.get('/stats/dashboard', auth, async (req, res) => {
  try {
    let counselorFilter = '';
    let params = [];
    if (req.user.role === 'counselor') {
      counselorFilter = "WHERE assigned_counselor = $1 AND COALESCE(lead_category, 'patient') = 'patient'";
      params = [req.user.name];
    } else {
      counselorFilter = "WHERE COALESCE(lead_category, 'patient') = 'patient'";
    }

    const [statusRes, counselorRes, contactRes, todayRes, urgentRes, followUpRes, weeklyRes, categoryRes] = await Promise.all([
      pool.query(`SELECT status, COUNT(*) as count FROM leads ${counselorFilter} GROUP BY status`, params),
      pool.query(`SELECT assigned_counselor, COUNT(*) as count FROM leads WHERE COALESCE(lead_category, 'patient') = 'patient' GROUP BY assigned_counselor`),
      pool.query(`SELECT contact_preference, COUNT(*) as count FROM leads ${counselorFilter} GROUP BY contact_preference`, params),
      pool.query(`SELECT COUNT(*) FROM leads ${counselorFilter} AND created_at >= CURRENT_DATE`, params),
      pool.query(`SELECT COUNT(*) FROM leads ${counselorFilter} AND urgency_level IN ('Urgent', 'Emergency') AND status NOT IN ('converted', 'lost')`, params),
      pool.query(`SELECT COUNT(*) FROM leads ${counselorFilter} AND follow_up_date <= CURRENT_DATE AND status NOT IN ('converted', 'lost')`, params),
      pool.query(`
        SELECT DATE(created_at) as day, COUNT(*) as count 
        FROM leads ${counselorFilter} AND created_at >= CURRENT_DATE - INTERVAL '30 days'
        GROUP BY DATE(created_at) ORDER BY day
      `, params),
      pool.query(`SELECT COALESCE(lead_category, 'patient') as lead_category, COUNT(*) as count FROM leads GROUP BY COALESCE(lead_category, 'patient')`),
    ]);

    const byStatus = {};
    statusRes.rows.forEach(r => byStatus[r.status] = parseInt(r.count));
    const byCounselor = {};
    counselorRes.rows.forEach(r => byCounselor[r.assigned_counselor] = parseInt(r.count));
    const byContact = {};
    contactRes.rows.forEach(r => byContact[r.contact_preference] = parseInt(r.count));
    const byCategory = {};
    categoryRes.rows.forEach(r => byCategory[r.lead_category] = parseInt(r.count));
    const total = Object.values(byStatus).reduce((a, b) => a + b, 0);

    res.json({
      total,
      today: parseInt(todayRes.rows[0].count),
      urgent: parseInt(urgentRes.rows[0].count),
      followUpDue: parseInt(followUpRes.rows[0].count),
      byStatus, byCounselor, byContact, byCategory,
      weekly: weeklyRes.rows,
      conversionRate: total > 0 ? Math.round(((byStatus.converted || 0) / total) * 100) : 0
    });
  } catch (e) {
    console.error('Stats error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/stats/performance', auth, managerOrAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        assigned_counselor,
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'converted') as converted,
        COUNT(*) FILTER (WHERE status NOT IN ('converted', 'lost')) as active,
        COUNT(*) FILTER (WHERE status = 'lost') as lost,
        ROUND(AVG(EXTRACT(EPOCH FROM (updated_at - created_at)) / 3600) FILTER (WHERE status != 'new'), 1) as avg_response_hours,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE - INTERVAL '7 days') as this_week,
        COUNT(*) FILTER (WHERE follow_up_date IS NOT NULL AND follow_up_date <= CURRENT_DATE AND status NOT IN ('converted', 'lost')) as overdue_followups
      FROM leads 
      WHERE created_at >= CURRENT_DATE - INTERVAL '30 days' AND COALESCE(lead_category, 'patient') = 'patient'
      GROUP BY assigned_counselor 
      ORDER BY total DESC
    `);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/export/csv', auth, async (req, res) => {
  try {
    let where = "WHERE COALESCE(lead_category, 'patient') = 'patient'";
    let params = [];
    if (req.user.role === 'counselor') {
      where += ' AND assigned_counselor = $1';
      params = [req.user.name];
    }
    const result = await pool.query(`SELECT * FROM leads ${where} ORDER BY created_at DESC`, params);
    
    const headers = [
      'Lead ID', 'Category', 'Date', 'Name', 'Email', 'Phone', 'Country', 'Service', 'Treatment',
      'Urgency', 'Patient', 'Status', 'Priority', 'Counselor', 'Contact Via',
      'Message', 'Medical History', 'Referred Hospitals', 'Follow-Up Date', 'Source'
    ];

    const rows = result.rows.map(r => [
      r.lead_id, r.lead_category,
      new Date(r.created_at).toISOString().split('T')[0],
      `${r.prefix || ''} ${r.first_name} ${r.last_name}`.trim(),
      r.email,
      `${r.isd || ''} ${r.phone || ''}`.trim(),
      r.nationality, r.service_type, r.treatment_sought || '', r.urgency_level || '',
      r.patient_relation === 'self' ? 'Self' : `${r.patient_first_name || ''} ${r.patient_last_name || ''}`.trim(),
      r.status, r.priority, r.assigned_counselor, r.contact_preference,
      (r.message || '').replace(/"/g, '""').substring(0, 200),
      (r.medical_history || '').replace(/"/g, '""').substring(0, 200),
      r.referred_hospitals || '',
      r.follow_up_date || '', r.referrer || ''
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
      AND COALESCE(lead_category, 'patient') = 'patient'
      ${counselorFilter}
      ORDER BY follow_up_date ASC
    `, params);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// Get leads by category
// ============================================================
router.get('/', auth, async (req, res) => {
  try {
    const { status, stage, counselor, urgency, search, sort, order, limit, offset, category } = req.query;
    let where = [];
    let params = [];
    let i = 1;

    // Category filter (default: patient for counselors)
    if (category && category !== 'all') {
      where.push(`COALESCE(lead_category, 'patient') = $${i++}`);
      params.push(category);
    }

    if (req.user.role === 'counselor') {
      where.push(`assigned_counselor = $${i++}`);
      params.push(req.user.name);
    } else if (counselor && counselor !== 'all') {
      where.push(`assigned_counselor = $${i++}`);
      params.push(counselor);
    }

    if (status && status !== 'all') { where.push(`status = $${i++}`); params.push(status); }
    if (stage && stage !== 'all') { where.push(`COALESCE(stage, 'new') = $${i++}`); params.push(stage); }
    if (urgency && urgency !== 'all') { where.push(`urgency_level = $${i++}`); params.push(urgency); }
    if (search) {
      where.push(`(
        first_name ILIKE $${i} OR last_name ILIKE $${i} OR email ILIKE $${i} 
        OR phone ILIKE $${i} OR nationality ILIKE $${i} OR treatment_sought ILIKE $${i}
        OR message ILIKE $${i} OR lead_id ILIKE $${i}
      )`);
      params.push(`%${search}%`);
      i++;
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    const sortField = ['created_at', 'first_name', 'last_name', 'email', 'updated_at', 'nationality', 'status', 'priority', 'stage'].includes(sort) ? sort : 'created_at';
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
// DYNAMIC ROUTES
// ============================================================

router.get('/:leadId', auth, async (req, res) => {
  try {
    const leadRes = await pool.query('SELECT * FROM leads WHERE lead_id = $1', [req.params.leadId]);
    if (leadRes.rows.length === 0) return res.status(404).json({ error: 'Lead not found' });

    const [notesRes, activityRes, timelineRes, attachmentsRes, followUpsRes] = await Promise.all([
      pool.query('SELECT * FROM notes WHERE lead_id = $1 ORDER BY created_at DESC', [req.params.leadId]),
      pool.query('SELECT * FROM activity_log WHERE lead_id = $1 ORDER BY created_at DESC LIMIT 50', [req.params.leadId]),
      pool.query('SELECT * FROM status_timeline WHERE lead_id = $1 ORDER BY created_at ASC', [req.params.leadId]),
      pool.query('SELECT * FROM attachments WHERE lead_id = $1 ORDER BY created_at DESC', [req.params.leadId]),
      pool.query('SELECT * FROM follow_ups WHERE lead_id = $1 ORDER BY scheduled_date ASC', [req.params.leadId]),
    ]);

    res.json({
      ...leadRes.rows[0],
      notes: notesRes.rows,
      activity: activityRes.rows,
      timeline: timelineRes.rows,
      attachments: attachmentsRes.rows,
      follow_ups: followUpsRes.rows,
    });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Enhanced PATCH - allows editing ALL fields
router.patch('/:leadId', auth, async (req, res) => {
  try {
    const allowed = [
      'status', 'priority', 'assigned_counselor', 'follow_up_date', 'follow_up_note', 'urgency_level',
      'lead_category', 'prefix', 'first_name', 'last_name', 'email', 'isd', 'phone', 'nationality',
      'service_type', 'patient_relation', 'relationship_type',
      'patient_prefix', 'patient_first_name', 'patient_last_name', 'patient_age', 'patient_nationality',
      'patient_email', 'patient_phone', 'patient_isd',
      'is_doctor', 'doctor_specialty', 'doctor_hospital', 'doctor_city', 'doctor_country',
      'primary_diagnosis', 'treatment_sought', 'message', 'clinical_notes', 'contact_preference',
      'medical_history', 'referred_hospitals', 'recommended_doctors',
      'billing_amount', 'billing_currency', 'billing_status',
      'estimated_arrival', 'estimated_departure', 'accommodation_notes',
      'review_rating', 'review_text',
      // Phase 1 new fields
      'patient_name', 'patient_gender', 'services_given', 'opportunity_size', 'stage',
      'recommended_hospitals_text', 'recommended_doctors_text',
      'passport_number', 'visa_number', 'hospital_reg_number',
      'date_first_consultation', 'admitting_doctor', 'date_admission', 'date_discharge', 'final_bill',
      'latest_status',
      'page_url', 'page_title', 'referrer',
    ];
    const updates = [];
    const params = [];
    let i = 1;
    let statusChanged = false;
    let newStatus = null;

    for (const [key, value] of Object.entries(req.body)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = $${i++}`);
        params.push(value === '' ? null : value);
        if (key === 'status') { statusChanged = true; newStatus = value; }
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

    // Record status change in timeline
    if (statusChanged && newStatus) {
      await pool.query('INSERT INTO status_timeline (lead_id, status, changed_by, note) VALUES ($1, $2, $3, $4)',
        [req.params.leadId, newStatus, req.user.name, req.body.status_note || null]);
    }

    const changes = Object.entries(req.body).filter(([k]) => allowed.includes(k)).map(([k, v]) => `${k}: ${v}`).join(', ');
    await pool.query('INSERT INTO activity_log (lead_id, user_name, action, details) VALUES ($1, $2, $3, $4)',
      [req.params.leadId, req.user.name, 'lead_updated', changes.substring(0, 500)]);

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

// Follow-ups CRUD
router.post('/:leadId/follow-ups', auth, async (req, res) => {
  try {
    const { scheduled_date, note, method } = req.body;
    if (!scheduled_date) return res.status(400).json({ error: 'Scheduled date required' });

    const result = await pool.query(
      'INSERT INTO follow_ups (lead_id, scheduled_date, note, method, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [req.params.leadId, scheduled_date, note, method || 'whatsapp', req.user.name]
    );

    await pool.query('INSERT INTO activity_log (lead_id, user_name, action, details) VALUES ($1, $2, $3, $4)',
      [req.params.leadId, req.user.name, 'follow_up_scheduled', `${method || 'whatsapp'}: ${note || ''}`]);

    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.patch('/:leadId/follow-ups/:fuId', auth, async (req, res) => {
  try {
    const { status, outcome } = req.body;
    const updates = [];
    const params = [];
    let i = 1;

    if (status) { updates.push(`status = $${i++}`); params.push(status); }
    if (outcome) { updates.push(`outcome = $${i++}`); params.push(outcome); }
    if (status === 'completed') { updates.push(`completed_at = NOW()`); }

    params.push(req.params.fuId);
    const result = await pool.query(
      `UPDATE follow_ups SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
      params
    );

    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Attachments (metadata only - actual file upload handled by frontend to cloud storage)
router.post('/:leadId/attachments', auth, async (req, res) => {
  try {
    const { category, file_name, file_url, file_size } = req.body;
    if (!category || !file_name || !file_url) return res.status(400).json({ error: 'Category, file_name, and file_url required' });

    const result = await pool.query(
      'INSERT INTO attachments (lead_id, category, file_name, file_url, file_size, uploaded_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [req.params.leadId, category, file_name, file_url, file_size || 0, req.user.name]
    );

    await pool.query('INSERT INTO activity_log (lead_id, user_name, action, details) VALUES ($1, $2, $3, $4)',
      [req.params.leadId, req.user.name, 'attachment_added', `${category}: ${file_name}`]);

    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/:leadId/attachments/:attId', auth, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM attachments WHERE id = $1 AND lead_id = $2 RETURNING *', [req.params.attId, req.params.leadId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Attachment not found' });
    res.json({ message: 'Deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
