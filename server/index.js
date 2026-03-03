const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const initDB = require('./db-init');
const authRoutes = require('./routes/auth');
const leadsRoutes = require('./routes/leads');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true
}));
app.use(express.json({ limit: '5mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/leads', leadsRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', time: new Date().toISOString() }));

// Serve React frontend in production
const clientBuild = path.join(__dirname, '..', 'client', 'build');
app.use(express.static(clientBuild));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(clientBuild, 'index.html'));
  }
});

// Start server
async function start() {
  try {
    await initDB();
    app.listen(PORT, () => {
      console.log(`\n🌿 Ginger Healthcare CRM running on port ${PORT}`);
      console.log(`   API: http://localhost:${PORT}/api/health`);
      console.log(`   App: http://localhost:${PORT}\n`);
    });
  } catch (e) {
    console.error('Failed to start server:', e);
    process.exit(1);
  }
}

start();
