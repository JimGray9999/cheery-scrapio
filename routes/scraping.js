const express = require('express');
const rateLimit = require('express-rate-limit');
const router = express.Router();
const scraperController = require('../controllers/scraperController');
const { requireScrapeToken } = require('../middleware/requireScrapeToken');

const scrapeLimit = rateLimit({
  windowMs: 60 * 1000,
  max: process.env.NODE_ENV === 'production' ? 1 : 10,
  message: 'Too many scrape requests — please wait a minute.',
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
});

// Token check runs first so unauthenticated callers cannot burn the rate limit budget.
router.post('/scrape', requireScrapeToken, scrapeLimit, scraperController.scrapeAll);

module.exports = router;
