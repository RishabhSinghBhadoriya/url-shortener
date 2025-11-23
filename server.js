require('dotenv').config();
const express = require('express');
const path = require('path');
const db = require('./database/db');
const apiRoutes = require('./routes/api');
const pageRoutes = require('./routes/pages');

const app = express();
const PORT = process.env.PORT || 3000;
const startTime = Date.now();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Health check endpoint
app.get('/healthz', async (req, res) => {
  const uptime = Math.floor((Date.now() - startTime) / 1000);
  
  // Check database connection
  let dbStatus = 'disconnected';
  try {
    await db.query('SELECT 1');
    dbStatus = 'connected';
  } catch (error) {
    dbStatus = 'error';
  }

  res.status(200).json({
    ok: true,
    version: '1.0',
    uptime: uptime,
    timestamp: new Date().toISOString(),
    database: dbStatus,
    environment: process.env.NODE_ENV
  });
});

// Routes
app.use('/api', apiRoutes);
app.use('/', pageRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('404', { 
    title: 'Page Not Found',
    baseUrl: process.env.BASE_URL 
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});

// Initialize database and start server
async function startServer() {
  try {
    await db.initDatabase();
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Base URL: ${process.env.BASE_URL}`);
      console.log('Database connected successfully');
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();