const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const { auth, adminOnly, managerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const result = await pool.query('SELECT * FROM users WHERE username = $1 AND is_active = true', [username.toLowerCase()]);
    if (result.rows.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign(
      { id: user.id, username: user.username, name: user.display_name, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ token, user: { id: user.id, username: user.username, name: user.display_name, role: user.role, email: user.email } });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get current user
router.get('/me', auth, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, display_name, role, email, whatsapp, telegram FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// List all users (admin + manager)
router.get('/users', auth, managerOrAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, username, display_name, role, email, whatsapp, telegram, shift_start, shift_end, is_active, created_at FROM users ORDER BY role, display_name');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new user (admin only)
router.post('/users', auth, adminOnly, async (req, res) => {
  try {
    const { username, password, displayName, role, email, whatsapp, telegram, shift_start, shift_end } = req.body;
    if (!username || !password || !displayName || !role) {
      return res.status(400).json({ error: 'Username, password, display name, and role are required' });
    }

    if (!['counselor', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be counselor, manager, or admin' });
    }

    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, display_name, role, email, whatsapp, telegram, shift_start, shift_end) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id, username, display_name, role, email, whatsapp, telegram, shift_start, shift_end, is_active, created_at',
      [username.toLowerCase(), hash, displayName, role, email || null, whatsapp || null, telegram || null, shift_start || '09:00', shift_end || '18:00']
    );

    res.json(result.rows[0]);
  } catch (e) {
    console.error('Create user error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update user (admin only)
router.patch('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    const { displayName, role, email, whatsapp, telegram, is_active, shift_start, shift_end } = req.body;
    const updates = [];
    const params = [];
    let i = 1;

    if (displayName !== undefined) { updates.push(`display_name = $${i++}`); params.push(displayName); }
    if (role !== undefined) {
      if (!['counselor', 'manager', 'admin'].includes(role)) return res.status(400).json({ error: 'Invalid role' });
      updates.push(`role = $${i++}`); params.push(role);
    }
    if (email !== undefined) { updates.push(`email = $${i++}`); params.push(email || null); }
    if (whatsapp !== undefined) { updates.push(`whatsapp = $${i++}`); params.push(whatsapp || null); }
    if (telegram !== undefined) { updates.push(`telegram = $${i++}`); params.push(telegram || null); }
    if (is_active !== undefined) { updates.push(`is_active = $${i++}`); params.push(is_active); }
    if (shift_start !== undefined) { updates.push(`shift_start = $${i++}`); params.push(shift_start); }
    if (shift_end !== undefined) { updates.push(`shift_end = $${i++}`); params.push(shift_end); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    params.push(req.params.id);
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${i} RETURNING id, username, display_name, role, email, whatsapp, telegram, is_active, created_at`,
      params
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (e) {
    console.error('Update user error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Reset user password (admin only)
router.post('/users/:id/reset-password', auth, adminOnly, async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

    const hash = await bcrypt.hash(newPassword, 10);
    const result = await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2 RETURNING id, username', [hash, req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'Password reset successfully' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete user (admin only — soft delete)
router.delete('/users/:id', auth, adminOnly, async (req, res) => {
  try {
    // Prevent deleting yourself
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pool.query(
      'UPDATE users SET is_active = false WHERE id = $1 RETURNING id, username, display_name',
      [req.params.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: `User ${result.rows[0].display_name} deactivated`, user: result.rows[0] });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Reactivate user (admin only)
router.post('/users/:id/reactivate', auth, adminOnly, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE users SET is_active = true WHERE id = $1 RETURNING id, username, display_name',
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json({ message: `User ${result.rows[0].display_name} reactivated`, user: result.rows[0] });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Change own password
router.post('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const result = await pool.query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
    const valid = await bcrypt.compare(currentPassword, result.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Current password is incorrect' });

    const hash = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user.id]);
    res.json({ message: 'Password changed' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ============================================================
// COUNSELOR SCHEDULING
// ============================================================

// Get all schedules (admin/manager)
router.get('/schedules', auth, managerOrAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT cs.*, u.display_name, u.username, u.role
      FROM counselor_schedules cs
      JOIN users u ON cs.user_id = u.id
      WHERE u.is_active = true
      ORDER BY u.display_name, cs.day_of_week, cs.slot_start
    `);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Get schedules for a specific user
router.get('/schedules/user/:userId', auth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM counselor_schedules WHERE user_id = $1 ORDER BY day_of_week, slot_start',
      [req.params.userId]
    );
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Set/update schedule for a counselor (admin/manager)
router.post('/schedules', auth, managerOrAdmin, async (req, res) => {
  try {
    const { user_id, day_of_week, slot_start, slot_end } = req.body;
    if (user_id === undefined || day_of_week === undefined || !slot_start || !slot_end) {
      return res.status(400).json({ error: 'user_id, day_of_week, slot_start, and slot_end are required' });
    }

    const result = await pool.query(`
      INSERT INTO counselor_schedules (user_id, day_of_week, slot_start, slot_end, created_by)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (user_id, day_of_week, slot_start)
      DO UPDATE SET slot_end = $4, is_active = true, updated_at = NOW()
      RETURNING *
    `, [user_id, day_of_week, slot_start, slot_end, req.user.name]);

    // Also update the user's default shift times
    await pool.query('UPDATE users SET shift_start = $1, shift_end = $2 WHERE id = $3', [slot_start, slot_end, user_id]);

    res.json(result.rows[0]);
  } catch (e) {
    console.error('Schedule error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Bulk set weekly schedule for a counselor
router.post('/schedules/bulk', auth, managerOrAdmin, async (req, res) => {
  try {
    const { user_id, schedules } = req.body;
    // schedules: [{ day_of_week, slot_start, slot_end }, ...] or null entries to clear
    if (!user_id) return res.status(400).json({ error: 'user_id required' });

    // Remove all existing schedules for this user
    await pool.query('DELETE FROM counselor_schedules WHERE user_id = $1', [user_id]);

    // Insert new ones
    const inserted = [];
    if (schedules && schedules.length > 0) {
      for (const s of schedules) {
        if (s.slot_start && s.slot_end) {
          const r = await pool.query(
            'INSERT INTO counselor_schedules (user_id, day_of_week, slot_start, slot_end, created_by) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [user_id, s.day_of_week, s.slot_start, s.slot_end, req.user.name]
          );
          inserted.push(r.rows[0]);
        }
      }
    }

    // Update user's default shift (use first schedule entry or NULL)
    if (inserted.length > 0) {
      await pool.query('UPDATE users SET shift_start = $1, shift_end = $2 WHERE id = $3',
        [inserted[0].slot_start, inserted[0].slot_end, user_id]);
    } else {
      await pool.query('UPDATE users SET shift_start = NULL, shift_end = NULL WHERE id = $1', [user_id]);
    }

    res.json({ schedules: inserted, cleared: schedules ? false : true });
  } catch (e) {
    console.error('Bulk schedule error:', e);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a specific schedule slot
router.delete('/schedules/:id', auth, managerOrAdmin, async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM counselor_schedules WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Schedule not found' });
    res.json({ message: 'Schedule deleted' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Schedule overrides (specific date off/custom shift)
router.get('/schedule-overrides', auth, managerOrAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT so.*, u.display_name 
      FROM schedule_overrides so
      JOIN users u ON so.user_id = u.id
      WHERE so.override_date >= CURRENT_DATE
      ORDER BY so.override_date
    `);
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/schedule-overrides', auth, managerOrAdmin, async (req, res) => {
  try {
    const { user_id, override_date, is_off, slot_start, slot_end, reason } = req.body;
    if (!user_id || !override_date) return res.status(400).json({ error: 'user_id and override_date required' });

    const result = await pool.query(`
      INSERT INTO schedule_overrides (user_id, override_date, is_off, slot_start, slot_end, reason, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (user_id, override_date)
      DO UPDATE SET is_off = $3, slot_start = $4, slot_end = $5, reason = $6
      RETURNING *
    `, [user_id, override_date, is_off !== false, slot_start || null, slot_end || null, reason || null, req.user.name]);

    res.json(result.rows[0]);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

router.delete('/schedule-overrides/:id', auth, managerOrAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM schedule_overrides WHERE id = $1', [req.params.id]);
    res.json({ message: 'Override removed' });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
