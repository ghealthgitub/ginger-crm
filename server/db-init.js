const pool = require('./db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

async function initDB() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Users table
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        role VARCHAR(20) NOT NULL DEFAULT 'counselor',
        email VARCHAR(255),
        whatsapp VARCHAR(20),
        telegram VARCHAR(50),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Leads table
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        lead_id VARCHAR(50) UNIQUE NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        prefix VARCHAR(10),
        first_name VARCHAR(100) NOT NULL,
        last_name VARCHAR(100) NOT NULL,
        email VARCHAR(255),
        isd VARCHAR(10),
        phone VARCHAR(20),
        nationality VARCHAR(100),
        service_type VARCHAR(50),
        patient_relation VARCHAR(50),
        relationship_type VARCHAR(50),
        patient_prefix VARCHAR(10),
        patient_first_name VARCHAR(100),
        patient_last_name VARCHAR(100),
        patient_age VARCHAR(10),
        patient_nationality VARCHAR(100),
        is_doctor BOOLEAN DEFAULT false,
        doctor_specialty VARCHAR(100),
        doctor_hospital VARCHAR(200),
        doctor_city VARCHAR(100),
        doctor_country VARCHAR(100),
        primary_diagnosis TEXT,
        treatment_sought VARCHAR(200),
        urgency_level VARCHAR(50),
        message TEXT,
        clinical_notes TEXT,
        contact_preference VARCHAR(20),
        assigned_counselor VARCHAR(100),
        page_url TEXT,
        page_title VARCHAR(500),
        referrer TEXT,
        status VARCHAR(30) DEFAULT 'new',
        priority VARCHAR(10) DEFAULT 'medium',
        follow_up_date DATE,
        follow_up_note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Notes table
    await client.query(`
      CREATE TABLE IF NOT EXISTS notes (
        id SERIAL PRIMARY KEY,
        lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
        author VARCHAR(100) NOT NULL,
        text TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Activity log
    await client.query(`
      CREATE TABLE IF NOT EXISTS activity_log (
        id SERIAL PRIMARY KEY,
        lead_id VARCHAR(50) REFERENCES leads(lead_id) ON DELETE CASCADE,
        user_name VARCHAR(100) NOT NULL,
        action VARCHAR(50) NOT NULL,
        details TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leads_counselor ON leads(assigned_counselor)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(follow_up_date) WHERE follow_up_date IS NOT NULL`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notes_lead ON notes(lead_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_activity_lead ON activity_log(lead_id)`);

    // Insert default users if they don't exist
    const defaultUsers = [
      { username: 'admin', password: 'GingerAdmin2026!', name: 'Admin', role: 'admin', email: 'admin@ghealth121.com' },
      { username: 'dolma', password: 'Dolma2026!', name: 'Dolma', role: 'counselor', email: 'dolma@ghealth121.com', whatsapp: '917669773377', telegram: 'ghealth121' },
      { username: 'riyashree', password: 'Riyashree2026!', name: 'Riyashree', role: 'counselor', email: 'riyashree@ghealth121.com', whatsapp: '919876543210', telegram: 'riyashree_gh' },
      { username: 'anushka', password: 'Anushka2026!', name: 'Anushka', role: 'counselor', email: 'anushka@ghealth121.com', whatsapp: '919032558654', telegram: 'anushkanasrin' },
    ];

    for (const u of defaultUsers) {
      const exists = await client.query('SELECT id FROM users WHERE username = $1', [u.username]);
      if (exists.rows.length === 0) {
        const hash = await bcrypt.hash(u.password, 10);
        await client.query(
          'INSERT INTO users (username, password_hash, display_name, role, email, whatsapp, telegram) VALUES ($1, $2, $3, $4, $5, $6, $7)',
          [u.username, hash, u.name, u.role, u.email, u.whatsapp || null, u.telegram || null]
        );
        console.log(`  Created user: ${u.username} (${u.role})`);
      }
    }

    await client.query('COMMIT');
    console.log('Database initialized successfully!');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('Database init failed:', e);
    throw e;
  } finally {
    client.release();
  }
}

if (require.main === module) {
  initDB().then(() => process.exit(0)).catch(() => process.exit(1));
}

module.exports = initDB;
