const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const scraperController = require('../controllers/scraperController');

const scrapeLimit = rateLimit({
  windowMs: 60 * 1000,
  max: 1,
  message: 'Too many scrape requests — please wait a minute.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

function requireScrapeToken(req, res, next) {
  const secret = process.env.SCRAPE_SECRET;
  if (!secret) return next();
  if (req.get('x-scrape-token') === secret) return next();
  return res.status(403).json({ error: 'Forbidden' });
}

// Primary entry point: POST runs the full left→right→center chain
router.post('/scrape', scrapeLimit, requireScrapeToken, scraperController.scrapeAll);

// Internal GET redirect chain (kept for backward-compat; not exposed in UI)
router.get('/scrape/left', scraperController.scrapeLeft);
router.get('/scrape/right', scraperController.scrapeRight);
router.get('/scrape/news/center', scraperController.scrapeCenter);

module.exports = router;
