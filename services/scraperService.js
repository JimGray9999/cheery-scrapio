/**
 * Scraper Service
 *
 * This service handles all the web scraping logic. By separating this into
 * a service, we can:
 * - Reuse scraping logic across different routes
 * - Test scraping independently
 * - Keep controllers thin and focused on HTTP logic
 *
 * LEARNING NOTE: Services contain business logic. They don't know about
 * HTTP requests/responses - they just do the work and return data.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const Article = require('../models/Article');
const logger = require('../utils/logger');
const config = require('../config/config');

/**
 * Scrape left-leaning articles from Democratic Underground
 * @returns {Promise<Object>} Object with newCount and duplicateCount
 */
async function scrapeLeftArticles() {
  logger.info('Starting left article scraping...');

  const response = await axios.get(config.scraping.leftUrl);
  const $ = cheerio.load(response.data);

  const linkStart = 'https://www.democraticunderground.com';
  const articles = [];

  // Collect all article data
  $('td.title').each(function(i, element) {
    const title = $(element).children().text();
    const link = linkStart + $(element).children().attr('href');
    const time = $(element).next().next().next().text();

    if (title && link) {
      articles.push({
        title: title,
        link: link,
        time: time,
        left: true,
        right: false,
        source: 'Democratic Underground'
      });
    }
  });

  // Save articles with duplicate detection
  let newCount = 0;
  let duplicateCount = 0;

  for (const articleData of articles) {
    const existing = await Article.findOne({ link: articleData.link });
    if (!existing) {
      const newArticle = new Article(articleData);
      await newArticle.save();
      newCount++;
    } else {
      duplicateCount++;
    }
  }

  logger.info(`Left scraping complete: ${newCount} new, ${duplicateCount} duplicates`);

  return { newCount, duplicateCount, total: articles.length };
}

/**
 * Scrape right-leaning articles from Free Republic
 * @returns {Promise<Object>} Object with newCount and duplicateCount
 */
async function scrapeRightArticles() {
  logger.info('Starting right article scraping...');

  const response = await axios.get(config.scraping.rightUrl);
  const $ = cheerio.load(response.data);

  const linkStart = 'http://www.freerepublic.com/';
  const articles = [];

  // Collect all article data
  $('li.article').each(function(i, element) {
    const link = linkStart + $(element).find('h3').children().attr('href');
    const title = $(element).find('h3').children().text();
    const time = $(element).find('.date').text();

    if (title && link) {
      articles.push({
        link: link,
        title: title,
        time: time,
        left: false,
        right: true,
        source: 'Free Republic'
      });
    }
  });

  // Save articles with duplicate detection
  let newCount = 0;
  let duplicateCount = 0;

  for (const articleData of articles) {
    const existing = await Article.findOne({ link: articleData.link });
    if (!existing) {
      const newArticle = new Article(articleData);
      await newArticle.save();
      newCount++;
    } else {
      duplicateCount++;
    }
  }

  logger.info(`Right scraping complete: ${newCount} new, ${duplicateCount} duplicates`);

  return { newCount, duplicateCount, total: articles.length };
}

module.exports = {
  scrapeLeftArticles,
  scrapeRightArticles
};
