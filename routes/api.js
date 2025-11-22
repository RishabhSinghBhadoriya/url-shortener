const express = require('express');
const router = express.Router();

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
router.post('/links', (req, res) => {
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
    if (global.links.has(shortCode)) {
      return res.status(409).json({ 
        error: 'Code already exists. Please choose a different code.' 
      });
    }
  } else {
    // Generate random code
    do {
      shortCode = generateRandomCode();
    } while (global.links.has(shortCode));
  }

  // Create link object
  const linkData = {
    code: shortCode,
    url: url,
    clicks: 0,
    createdAt: new Date().toISOString(),
    lastClicked: null
  };

  global.links.set(shortCode, linkData);

  res.status(201).json({
    success: true,
    code: shortCode,
    shortUrl: `${process.env.BASE_URL}/${shortCode}`,
    url: url
  });
});

// GET /api/links - List all links
router.get('/links', (req, res) => {
  const allLinks = Array.from(global.links.values());
  res.json({ links: allLinks });
});

// GET /api/links/:code - Get stats for a specific link
router.get('/links/:code', (req, res) => {
  const { code } = req.params;
  const link = global.links.get(code);

  if (!link) {
    return res.status(404).json({ error: 'Link not found' });
  }

  res.json(link);
});

// DELETE /api/links/:code - Delete a link
router.delete('/links/:code', (req, res) => {
  const { code } = req.params;

  if (!global.links.has(code)) {
    return res.status(404).json({ error: 'Link not found' });
  }

  global.links.delete(code);
  res.json({ success: true, message: 'Link deleted successfully' });
});

module.exports = router;