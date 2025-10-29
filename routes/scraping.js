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
const scraperService = require('../services/scraperService');
const logger = require('../utils/logger');

/**
 * Scrape left-leaning articles
 * @route GET /scrape/left
 */
router.get('/scrape/left', async (req, res) => {
  try {
    const result = await scraperService.scrapeLeftArticles();
    logger.info(`Left scraping successful: ${result.newCount} new articles`);
    res.redirect('/scrape/right');
  } catch (error) {
    logger.error('Error scraping left articles:', error);
    res.status(500).send('Error scraping left links');
  }
});

/**
 * Scrape right-leaning articles
 * @route GET /scrape/right
 */
router.get('/scrape/right', async (req, res) => {
  try {
    const result = await scraperService.scrapeRightArticles();
    logger.info(`Right scraping successful: ${result.newCount} new articles`);
    res.redirect('/all');
  } catch (error) {
    logger.error('Error scraping right articles:', error);
    res.status(500).send('Error scraping right links');
  }
});

// TODO FOR YOU: Implement the BBC scraping route
// Create a scrapeCenterArticles function in scraperService.js first
// Then add the route here following the same pattern
// router.get('/scrape/news/center', async (req, res) => { ... });

module.exports = router;
