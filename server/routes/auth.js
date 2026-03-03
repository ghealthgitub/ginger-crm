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
    const result = await pool.query('SELECT id, username, display_name, role, email, whatsapp, telegram, is_active, created_at FROM users ORDER BY role, display_name');
    res.json(result.rows);
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

// Create new user (admin only)
router.post('/users', auth, adminOnly, async (req, res) => {
  try {
    const { username, password, displayName, role, email, whatsapp, telegram } = req.body;
    if (!username || !password || !displayName || !role) {
      return res.status(400).json({ error: 'Username, password, display name, and role are required' });
    }

    if (!['counselor', 'manager', 'admin'].includes(role)) {
      return res.status(400).json({ error: 'Role must be counselor, manager, or admin' });
    }

    // Check if username exists
    const existing = await pool.query('SELECT id FROM users WHERE username = $1', [username.toLowerCase()]);
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      'INSERT INTO users (username, password_hash, display_name, role, email, whatsapp, telegram) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id, username, display_name, role, email, whatsapp, telegram, is_active, created_at',
      [username.toLowerCase(), hash, displayName, role, email || null, whatsapp || null, telegram || null]
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
    const { displayName, role, email, whatsapp, telegram, is_active } = req.body;
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

module.exports = router;
