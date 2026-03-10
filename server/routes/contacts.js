const express = require('express');
const pool = require('../db');
const { auth, managerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Countries excluded from contacts view (non-targeted)
const BLOCKED_COUNTRIES = ['India', 'Bangladesh', 'Pakistan'];

// ============================================================
// LIST CONTACTS (with search, pagination, filters)
// ============================================================
router.get('/', auth, async (req, res) => {
  try {
    const { search, sort, order, limit, offset, contact_type, include_blocked } = req.query;
    let where = [];
    let params = [];
    let i = 1;

    // Exclude blocked countries by default
    if (include_blocked !== 'true') {
      where.push(`(c.nationality IS NULL OR LOWER(c.nationality) NOT IN (${BLOCKED_COUNTRIES.map(() => `$${i++}`).join(',')}))`);
      params.push(...BLOCKED_COUNTRIES.map(c => c.toLowerCase()));
    }

    if (contact_type && contact_type !== 'all') {
      where.push(`c.contact_type = $${i++}`);
      params.push(contact_type);
    }

    if (search) {
      where.push(`(
        c.first_name ILIKE $${i} OR c.last_name ILIKE $${i} OR c.email ILIKE $${i}
        OR c.phone ILIKE $${i} OR c.nationality ILIKE $${i} OR c.contact_id ILIKE $${i}
        OR c.notes ILIKE $${i}
      )`);
      params.push(`%${search}%`);
      i++;
    }

    const whereClause = where.length > 0 ? 'WHERE ' + where.join(' AND ') : '';
    const sortField = ['created_at', 'first_name', 'last_name', 'email', 'updated_at'].includes(sort) ? 'c.' + sort : 'c.created_at';
    const sortOrder = order === 'asc' ? 'ASC' : 'DESC';
    const lim = Math.min(parseInt(limit) || 100, 500);
    const off = parseInt(offset) || 0;

    const countRes = await pool.query(`SELECT COUNT(*) FROM contacts c ${whereClause}`, params);

    // Get contacts with lead counts
    const dataRes = await pool.query(`
      SELECT c.*, 
        COALESCE(lc.lead_count, 0) as lead_count,
        lc.latest_lead_date
      FROM contacts c
      LEFT JOIN (
        SELECT contact_id, COUNT(*) as lead_count, MAX(created_at) as latest_lead_date
        FROM leads
        WHERE contact_id IS NOT NULL
        GROUP BY contact_id
      ) lc ON c.contact_id = lc.contact_id
      ${whereClause}
      ORDER BY ${sortField} ${sortOrder}
      LIMIT ${lim} OFFSET ${off}
    `, params);

    res.json({ total: parseInt(countRes.rows[0].count), contacts: dataRes.rows });
  } catch (e) {
    console.error('Get contacts error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// CONTACTS STATS
// ============================================================
router.get('/stats', auth, async (req, res) => {
  try {
    const blockedFilter = `WHERE (nationality IS NULL OR LOWER(nationality) NOT IN ('india','bangladesh','pakistan'))`;
    const [totalRes, todayRes, typeRes] = await Promise.all([
      pool.query(`SELECT COUNT(*) FROM contacts ${blockedFilter}`),
      pool.query(`SELECT COUNT(*) FROM contacts ${blockedFilter} AND created_at >= CURRENT_DATE`),
      pool.query(`SELECT contact_type, COUNT(*) as count FROM contacts ${blockedFilter} GROUP BY contact_type`),
    ]);

    const byType = {};
    typeRes.rows.forEach(r => byType[r.contact_type] = parseInt(r.count));

    res.json({
      total: parseInt(totalRes.rows[0].count),
      today: parseInt(todayRes.rows[0].count),
      byType,
    });
  } catch (e) {
    console.error('Contact stats error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// CREATE CONTACT (manual entry)
// ============================================================
router.post('/', auth, async (req, res) => {
  try {
    const d = req.body;
    if (!d.first_name || !d.last_name) return res.status(400).json({ error: 'First name and last name are required' });

    const contactId = `C${Date.now()}${Math.random().toString(36).substring(2, 6)}`;

    const result = await pool.query(`
      INSERT INTO contacts (
        contact_id, prefix, first_name, last_name, email, isd, phone,
        nationality, contact_type, relationship_type, contact_preference,
        assigned_counselor, notes
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
      RETURNING *
    `, [
      contactId,
      d.prefix || null,
      d.first_name,
      d.last_name,
      d.email || null,
      d.isd || null,
      d.phone || null,
      d.nationality || null,
      d.contact_type || 'patient',
      d.relationship_type || null,
      d.contact_preference || null,
      d.assigned_counselor || req.user.name,
      d.notes || null,
    ]);

    res.json(result.rows[0]);
  } catch (e) {
    console.error('Create contact error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// GET SINGLE CONTACT + associated leads
// ============================================================
router.get('/:contactId', auth, async (req, res) => {
  try {
    const contactRes = await pool.query('SELECT * FROM contacts WHERE contact_id = $1', [req.params.contactId]);
    if (contactRes.rows.length === 0) return res.status(404).json({ error: 'Contact not found' });

    const leadsRes = await pool.query(
      'SELECT * FROM leads WHERE contact_id = $1 ORDER BY created_at DESC',
      [req.params.contactId]
    );

    res.json({
      ...contactRes.rows[0],
      leads: leadsRes.rows,
    });
  } catch (e) {
    console.error('Get contact error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// UPDATE CONTACT
// ============================================================
router.patch('/:contactId', auth, async (req, res) => {
  try {
    const allowed = [
      'prefix', 'first_name', 'last_name', 'email', 'isd', 'phone',
      'nationality', 'contact_type', 'relationship_type', 'contact_preference',
      'assigned_counselor', 'notes',
    ];
    const updates = [];
    const params = [];
    let i = 1;

    for (const [key, value] of Object.entries(req.body)) {
      if (allowed.includes(key)) {
        updates.push(`${key} = $${i++}`);
        params.push(value === '' ? null : value);
      }
    }

    if (updates.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

    updates.push('updated_at = NOW()');
    params.push(req.params.contactId);

    const result = await pool.query(
      `UPDATE contacts SET ${updates.join(', ')} WHERE contact_id = $${i} RETURNING *`,
      params
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Contact not found' });

    res.json(result.rows[0]);
  } catch (e) {
    console.error('Update contact error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// CREATE LEAD FROM CONTACT (pre-fills contact info)
// ============================================================
router.post('/:contactId/create-lead', auth, async (req, res) => {
  try {
    const contactRes = await pool.query('SELECT * FROM contacts WHERE contact_id = $1', [req.params.contactId]);
    if (contactRes.rows.length === 0) return res.status(404).json({ error: 'Contact not found' });

    const contact = contactRes.rows[0];
    const leadId = `P${Date.now()}`;

    // Merge body overrides with contact defaults
    const d = req.body;

    const result = await pool.query(`
      INSERT INTO leads (
        lead_id, contact_id, lead_category, prefix, first_name, last_name,
        email, isd, phone, nationality, relationship_type, contact_preference,
        assigned_counselor, service_type, treatment_sought, message,
        status, priority, page_url, page_title, referrer
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16,
        'new', $17, $18, $19, $20
      ) RETURNING *
    `, [
      leadId,
      contact.contact_id,
      d.lead_category || 'patient',
      d.prefix || contact.prefix,
      d.first_name || contact.first_name,
      d.last_name || contact.last_name,
      d.email || contact.email,
      d.isd || contact.isd,
      d.phone || contact.phone,
      d.nationality || contact.nationality,
      d.relationship_type || contact.relationship_type,
      d.contact_preference || contact.contact_preference,
      d.assigned_counselor || contact.assigned_counselor || req.user.name,
      d.service_type || null,
      d.treatment_sought || null,
      d.message || null,
      d.priority || 'medium',
      d.page_url || contact.page_url,
      d.page_title || contact.page_title,
      d.referrer || contact.referrer,
    ]);

    // Record in timeline & activity
    await pool.query(
      'INSERT INTO status_timeline (lead_id, status, changed_by, note) VALUES ($1, $2, $3, $4)',
      [leadId, 'new', req.user.name, `Lead created from contact ${contact.contact_id}`]
    );
    await pool.query(
      'INSERT INTO activity_log (lead_id, user_name, action, details) VALUES ($1, $2, $3, $4)',
      [leadId, req.user.name, 'lead_created', `Created from contact: ${contact.first_name} ${contact.last_name}`]
    );

    res.json({ success: true, lead: result.rows[0] });
  } catch (e) {
    console.error('Create lead from contact error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// DELETE CONTACT (admin/manager only)
// ============================================================
router.delete('/:contactId', auth, managerOrAdmin, async (req, res) => {
  try {
    // Unlink leads from this contact first (don't delete leads)
    await pool.query('UPDATE leads SET contact_id = NULL WHERE contact_id = $1', [req.params.contactId]);

    const result = await pool.query('DELETE FROM contacts WHERE contact_id = $1 RETURNING *', [req.params.contactId]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Contact not found' });

    res.json({ message: 'Contact deleted', contact_id: req.params.contactId });
  } catch (e) {
    console.error('Delete contact error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
