const express = require('express');
const router = express.Router();

// Dashboard page
router.get('/', (req, res) => {
  const links = Array.from(global.links.values());
  res.render('dashboard', { 
    title: 'Dashboard',
    links: links,
    baseUrl: process.env.BASE_URL
  });
});

// Stats page for a specific code
router.get('/code/:code', (req, res) => {
  const { code } = req.params;
  const link = global.links.get(code);

  if (!link) {
    return res.status(404).render('404', { 
      title: 'Link Not Found',
      baseUrl: process.env.BASE_URL
    });
  }

  res.render('stats', { 
    title: `Stats - ${code}`,
    link: link,
    baseUrl: process.env.BASE_URL
  });
});

// Redirect handler - must be last to avoid conflicts
router.get('/:code', (req, res) => {
  const { code } = req.params;
  const link = global.links.get(code);

  if (!link) {
    return res.status(404).render('404', { 
      title: 'Link Not Found',
      baseUrl: process.env.BASE_URL
    });
  }

  // Update click stats
  link.clicks++;
  link.lastClicked = new Date().toISOString();
  global.links.set(code, link);

  // Perform 302 redirect
  res.redirect(302, link.url);
});

module.exports = router;