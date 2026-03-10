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
        shift_start TIME DEFAULT NULL,
        shift_end TIME DEFAULT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS shift_start TIME DEFAULT NULL`);
    await client.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS shift_end TIME DEFAULT NULL`);

    // Leads table
    await client.query(`
      CREATE TABLE IF NOT EXISTS leads (
        id SERIAL PRIMARY KEY,
        lead_id VARCHAR(50) UNIQUE NOT NULL,
        timestamp TIMESTAMPTZ DEFAULT NOW(),
        lead_category VARCHAR(30) DEFAULT 'patient',
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
        medical_history TEXT,
        referred_hospitals TEXT DEFAULT '[]',
        recommended_doctors TEXT DEFAULT '[]',
        billing_amount DECIMAL(12,2),
        billing_currency VARCHAR(10) DEFAULT 'USD',
        billing_status VARCHAR(30),
        estimated_arrival DATE,
        estimated_departure DATE,
        accommodation_notes TEXT,
        patient_email VARCHAR(255),
        patient_phone VARCHAR(30),
        patient_isd VARCHAR(10),
        review_rating INTEGER,
        review_text TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Add new columns to existing leads table
    const newCols = [
      "lead_category VARCHAR(30) DEFAULT 'patient'",
      "medical_history TEXT",
      "referred_hospitals TEXT DEFAULT '[]'",
      "recommended_doctors TEXT DEFAULT '[]'",
      "billing_amount DECIMAL(12,2)",
      "billing_currency VARCHAR(10) DEFAULT 'USD'",
      "billing_status VARCHAR(30)",
      "estimated_arrival DATE",
      "estimated_departure DATE",
      "accommodation_notes TEXT",
      "patient_email VARCHAR(255)",
      "patient_phone VARCHAR(30)",
      "patient_isd VARCHAR(10)",
      "review_rating INTEGER",
      "review_text TEXT",
      // Phase 1 — March 2026: new fields
      "patient_name VARCHAR(200)",
      "patient_gender VARCHAR(20)",
      "services_given TEXT DEFAULT '[]'",
      "opportunity_size VARCHAR(20)",
      "stage VARCHAR(30)",
      "recommended_hospitals_text TEXT",
      "recommended_doctors_text TEXT",
      "passport_number VARCHAR(50)",
      "visa_number VARCHAR(50)",
      "hospital_reg_number VARCHAR(50)",
      "date_first_consultation DATE",
      "admitting_doctor VARCHAR(200)",
      "date_admission DATE",
      "date_discharge DATE",
      "final_bill DECIMAL(12,2)",
    ];
    for (const col of newCols) {
      await client.query(`ALTER TABLE leads ADD COLUMN IF NOT EXISTS ${col}`);
    }

    // Migrate existing NULL lead_category to 'patient'
    await client.query(`UPDATE leads SET lead_category = 'patient' WHERE lead_category IS NULL`);

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

    // Status timeline
    await client.query(`
      CREATE TABLE IF NOT EXISTS status_timeline (
        id SERIAL PRIMARY KEY,
        lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
        status VARCHAR(30) NOT NULL,
        changed_by VARCHAR(100) NOT NULL,
        note TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Attachments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS attachments (
        id SERIAL PRIMARY KEY,
        lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
        category VARCHAR(50) NOT NULL,
        file_name VARCHAR(255) NOT NULL,
        file_url TEXT NOT NULL,
        file_size INTEGER,
        uploaded_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Follow-up schedule table
    await client.query(`
      CREATE TABLE IF NOT EXISTS follow_ups (
        id SERIAL PRIMARY KEY,
        lead_id VARCHAR(50) NOT NULL REFERENCES leads(lead_id) ON DELETE CASCADE,
        scheduled_date TIMESTAMPTZ NOT NULL,
        note TEXT,
        method VARCHAR(30) DEFAULT 'whatsapp',
        status VARCHAR(20) DEFAULT 'pending',
        completed_at TIMESTAMPTZ,
        outcome TEXT,
        created_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      )
    `);

    // Blocked countries
    await client.query(`
      CREATE TABLE IF NOT EXISTS blocked_countries (
        id SERIAL PRIMARY KEY,
        country_name VARCHAR(100) UNIQUE NOT NULL
      )
    `);

    const blockedCountries = ['India', 'Bangladesh', 'Pakistan'];
    for (const country of blockedCountries) {
      await client.query(
        `INSERT INTO blocked_countries (country_name) VALUES ($1) ON CONFLICT (country_name) DO NOTHING`,
        [country]
      );
    }

    // ============================================================
    // Counselor Schedules table - flexible slot scheduling
    // ============================================================
    await client.query(`
      CREATE TABLE IF NOT EXISTS counselor_schedules (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
        slot_start TIME NOT NULL,
        slot_end TIME NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, day_of_week, slot_start)
      )
    `);

    // Schedule overrides (for specific dates — holidays, sick days, special shifts)
    await client.query(`
      CREATE TABLE IF NOT EXISTS schedule_overrides (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        override_date DATE NOT NULL,
        is_off BOOLEAN DEFAULT true,
        slot_start TIME,
        slot_end TIME,
        reason VARCHAR(255),
        created_by VARCHAR(100) NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(user_id, override_date)
      )
    `);

    // Indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leads_counselor ON leads(assigned_counselor)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leads_created ON leads(created_at DESC)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leads_follow_up ON leads(follow_up_date) WHERE follow_up_date IS NOT NULL`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_leads_category ON leads(lead_category)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_notes_lead ON notes(lead_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_activity_lead ON activity_log(lead_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_status_timeline_lead ON status_timeline(lead_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_attachments_lead ON attachments(lead_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_follow_ups_lead ON follow_ups(lead_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_follow_ups_date ON follow_ups(scheduled_date) WHERE status = 'pending'`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_schedules_user ON counselor_schedules(user_id)`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_overrides_user_date ON schedule_overrides(user_id, override_date)`);

    // Insert default users
    const defaultUsers = [
      { username: 'admin', password: 'GingerAdmin2026!', name: 'Admin', role: 'admin', email: 'admin@ghealth121.com' },
      { username: 'dolma', password: 'Dolma2026!', name: 'Dolma', role: 'counselor', email: 'dolma@ghealth121.com', whatsapp: '917669773377', telegram: 'ghealth121', shift_start: '09:00', shift_end: '15:00' },
      { username: 'riyashree', password: 'Riyashree2026!', name: 'Riyashree', role: 'counselor', email: 'riyashree@ghealth121.com', whatsapp: '919876543210', telegram: 'riyashree_gh', shift_start: '15:00', shift_end: '21:00' },
      { username: 'anushka', password: 'Anushka2026!', name: 'Anushka', role: 'counselor', email: 'anushka@ghealth121.com', whatsapp: '919032558654', telegram: 'anushkanasrin', shift_start: '21:00', shift_end: '03:00' },
    ];

    for (const u of defaultUsers) {
      const exists = await client.query('SELECT id FROM users WHERE username = $1', [u.username]);
      if (exists.rows.length === 0) {
        const hash = await bcrypt.hash(u.password, 10);
        await client.query(
          'INSERT INTO users (username, password_hash, display_name, role, email, whatsapp, telegram, shift_start, shift_end) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
          [u.username, hash, u.name, u.role, u.email, u.whatsapp || null, u.telegram || null, u.shift_start || null, u.shift_end || null]
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
