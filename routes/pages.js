const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Dashboard page
router.get('/', async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM links ORDER BY created_at DESC'
    );

    const links = result.rows.map(row => ({
      code: row.code,
      url: row.url,
      clicks: row.clicks,
      createdAt: row.created_at,
      lastClicked: row.last_clicked_at
    }));

    res.render('dashboard', { 
      title: 'Dashboard',
      links: links,
      baseUrl: process.env.BASE_URL
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.status(500).send('Error loading dashboard');
  }
});

// Stats page for a specific code
router.get('/code/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const result = await db.query(
      'SELECT * FROM links WHERE code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).render('404', { 
        title: 'Link Not Found',
        baseUrl: process.env.BASE_URL
      });
    }

    const link = result.rows[0];

    // Get recent clicks
    const clicksResult = await db.query(
      `SELECT clicked_at, ip_address, user_agent, referrer 
       FROM click_logs 
       WHERE link_id = $1 
       ORDER BY clicked_at DESC 
       LIMIT 100`,
      [link.id]
    );

    // Get daily stats (last 30 days)
    const dailyStatsResult = await db.query(
      `SELECT DATE(clicked_at) as date, COUNT(*) as clicks
       FROM click_logs
       WHERE link_id = $1 
       AND clicked_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(clicked_at)
       ORDER BY date DESC`,
      [link.id]
    );

    res.render('stats', { 
      title: `Stats - ${link.code}`,
      link: {
        code: link.code,
        url: link.url,
        clicks: link.clicks,
        createdAt: link.created_at,
        lastClicked: link.last_clicked_at
      },
      recentClicks: clicksResult.rows,
      dailyStats: dailyStatsResult.rows,
      baseUrl: process.env.BASE_URL
    });
  } catch (error) {
    console.error('Error loading stats page:', error);
    res.status(500).send('Error loading stats');
  }
});

// Redirect handler with efficient click tracking
router.get('/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const result = await db.query(
      'SELECT * FROM links WHERE code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).render('404', { 
        title: 'Link Not Found',
        baseUrl: process.env.BASE_URL
      });
    }

    const link = result.rows[0];

    // Update click count and last_clicked_at (fast update)
    db.query(
      `UPDATE links 
       SET clicks = clicks + 1, 
           last_clicked_at = CURRENT_TIMESTAMP 
       WHERE id = $1`,
      [link.id]
    ).catch(err => console.error('Error updating clicks:', err));

    // Log detailed click info asynchronously (doesn't block redirect)
    const ipAddress = req.headers['x-forwarded-for']?.split(',')[0] || req.ip;
    const userAgent = req.get('user-agent');
    const referrer = req.get('referer') || req.get('referrer');

    db.query(
      `INSERT INTO click_logs (link_id, ip_address, user_agent, referrer) 
       VALUES ($1, $2, $3, $4)`,
      [link.id, ipAddress, userAgent, referrer]
    ).catch(err => console.error('Error logging click:', err));

    // Perform 302 redirect immediately
    res.redirect(302, link.url);
  } catch (error) {
    console.error('Error during redirect:', error);
    res.status(500).send('Redirect error');
  }
});

module.exports = router;
