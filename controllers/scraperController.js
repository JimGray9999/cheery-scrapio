/**
 * Scraper Controller
 *
 * Thin HTTP layer that delegates all scraping work to scraperService.
 * Controllers should not contain scraping logic - that lives in the service.
 */

const scraperService = require('../services/scraperService');
const logger = require('../utils/logger');

/**
 * Trigger left-leaning article scrape
 * @route GET /scrape/left
 */
async function scrapeLeft(req, res) {
  try {
    const result = await scraperService.scrapeLeftArticles();
    logger.info(`Left scrape done: ${result.newCount} new, ${result.duplicateCount} duplicates`);
    res.redirect('/scrape/right');
  } catch (error) {
    logger.error('Error scraping left articles:', error);
    res.status(500).send('Error scraping left links');
  }
}

/**
 * Trigger right-leaning article scrape
 * @route GET /scrape/right
 */
async function scrapeRight(req, res) {
  try {
    const result = await scraperService.scrapeRightArticles();
    logger.info(`Right scrape done: ${result.newCount} new, ${result.duplicateCount} duplicates`);
    res.redirect('/all');
  } catch (error) {
    logger.error('Error scraping right articles:', error);
    res.status(500).send('Error scraping right links');
  }
}

/**
 * Trigger center (BBC) article scrape
 * @route GET /scrape/news/center
 */
async function scrapeCenter(req, res) {
  try {
    const result = await scraperService.scrapeCenterArticles();
    logger.info(`Center scrape done: ${result.newCount} new, ${result.duplicateCount} duplicates`);
    res.redirect('/all');
  } catch (error) {
    logger.error('Error scraping center articles:', error);
    res.status(500).send('Error scraping center links');
  }
}

module.exports = { scrapeLeft, scrapeRight, scrapeCenter };
