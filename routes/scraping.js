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

router.post('/scrape', scrapeLimit, scraperController.scrapeAll);

module.exports = router;
