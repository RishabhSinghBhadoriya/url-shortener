const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Validation functions
function isValidUrl(string) {
  try {
    const url = new URL(string);
    return url.protocol === 'http:' || url.protocol === 'https:';
  } catch (_) {
    return false;
  }
}

function isValidCode(code) {
  return /^[A-Za-z0-9]{6,8}$/.test(code);
}

function generateRandomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// POST /api/links - Create a new short link
router.post('/links', async (req, res) => {
  try {
    const { url, code } = req.body;

    // Validate URL
    if (!url || !isValidUrl(url)) {
      return res.status(400).json({ error: 'Invalid URL provided' });
    }
    // Generate or validate custom code
    let shortCode = code;
    if (shortCode) {
      if (!isValidCode(shortCode)) {
        return res.status(400).json({ 
          error: 'Custom code must be 6-8 alphanumeric characters' 
        });
      }
      // Check if code already exists
      const existing = await db.query(
        'SELECT id FROM links WHERE code = $1',
        [shortCode]
      );
      
      if (existing.rows.length > 0) {
        return res.status(409).json({ 
          error: 'Code already exists. Please choose a different code.' 
        });
      }
    } else {
      // Generate random code and ensure uniqueness
      let attempts = 0;
      do {
        shortCode = generateRandomCode();
        const existing = await db.query(
          'SELECT id FROM links WHERE code = $1',
          [shortCode]
        );
        if (existing.rows.length === 0) break;
        attempts++;
      } while (attempts < 10);
      
      if (attempts >= 10) {
        return res.status(500).json({ error: 'Failed to generate unique code' });
      }
    }
    // Insert link into database
    const result = await db.query(
      'INSERT INTO links (code, url) VALUES ($1, $2) RETURNING *',
      [shortCode, url]
    );

    const link = result.rows[0];
    res.status(201).json({
      success: true,
      code: link.code,
      shortUrl: `${process.env.BASE_URL}/${link.code}`,
      url: link.url
    });
  } catch (error) {
    console.error('Error creating link:', error);
    res.status(500).json({ error: 'Failed to create link' });
  }
});

// GET /api/links - List all links
router.get('/links', async (req, res) => {
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

    res.json({ links });
  } catch (error) {
    console.error('Error fetching links:', error);
    res.status(500).json({ error: 'Failed to fetch links' });
  }
});

// GET /api/links/:code - Get stats for a specific link
router.get('/links/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const result = await db.query(
      'SELECT * FROM links WHERE code = $1',
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }

    const link = result.rows[0];

    // Get recent clicks (last 100)
    const clicksResult = await db.query(
      `SELECT clicked_at, ip_address, user_agent, referrer 
       FROM click_logs 
       WHERE link_id = $1 
       ORDER BY clicked_at DESC 
       LIMIT 100`,
      [link.id]
    );

    // Get clicks per day (last 30 days)
    const dailyStatsResult = await db.query(
      `SELECT DATE(clicked_at) as date, COUNT(*) as clicks
       FROM click_logs
       WHERE link_id = $1 
       AND clicked_at >= NOW() - INTERVAL '30 days'
       GROUP BY DATE(clicked_at)
       ORDER BY date DESC`,
      [link.id]
    );

    res.json({
      code: link.code,
      url: link.url,
      clicks: link.clicks,
      createdAt: link.created_at,
      lastClicked: link.last_clicked_at,
      recentClicks: clicksResult.rows,
      dailyStats: dailyStatsResult.rows
    });
  } catch (error) {
    console.error('Error fetching link stats:', error);
    res.status(500).json({ error: 'Failed to fetch link stats' });
  }
});

// DELETE /api/links/:code - Delete a link
router.delete('/links/:code', async (req, res) => {
  try {
    const { code } = req.params;

    const result = await db.query(
      'DELETE FROM links WHERE code = $1 RETURNING *',
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Link not found' });
    }

    res.json({ success: true, message: 'Link deleted successfully' });
  } catch (error) {
    console.error('Error deleting link:', error);
    res.status(500).json({ error: 'Failed to delete link' });
  }
});

module.exports = router;