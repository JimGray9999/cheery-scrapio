/**
 * Scraping Routes
 *
 * Routes for triggering article scraping from various sources.
 *
 * LEARNING NOTE: This demonstrates how to create a controller that
 * calls a service and handles the response.
 */

const express = require('express');
const router = express.Router();
const scraperController = require('../controllers/scraperController');

router.get('/scrape/left', scraperController.scrapeLeft);
router.get('/scrape/right', scraperController.scrapeRight);
router.get('/scrape/news/center', scraperController.scrapeCenter);

module.exports = router;
