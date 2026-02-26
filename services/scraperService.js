/**
 * Scraper Service
 *
 * All web scraping business logic lives here. No HTTP req/res knowledge -
 * just fetches pages, parses HTML, persists to the database, and returns
 * a summary result object to the caller.
 */

const axios = require('axios');
const cheerio = require('cheerio');
const Article = require('../models/Article');
const logger = require('../utils/logger');
const config = require('../config/config');

// Shared HTTP client with timeout and browser-like user-agent to avoid blocks
const httpClient = axios.create({
  timeout: 10000,
  headers: {
    'User-Agent': 'Mozilla/5.0 (compatible; cheery-scrapio/1.0; +https://github.com/JimGray9999/cheery-scrapio)'
  },
  maxRedirects: 5
});

/**
 * Persist an array of article objects using upsert (insert new, skip duplicates).
 * Uses bulkWrite for efficiency - one DB round-trip instead of one per article.
 * @param {Array} articles
 * @returns {Promise<Object>} { newCount, duplicateCount }
 */
async function upsertArticles(articles) {
  if (articles.length === 0) return { newCount: 0, duplicateCount: 0 };

  const ops = articles.map(a => ({
    updateOne: {
      filter: { link: a.link },
      update: { $setOnInsert: a },
      upsert: true
    }
  }));

  const result = await Article.bulkWrite(ops, { ordered: false });
  const newCount = result.upsertedCount || 0;
  const duplicateCount = articles.length - newCount;

  return { newCount, duplicateCount };
}

/**
 * Scrape left-leaning articles from Democratic Underground
 * @returns {Promise<Object>} { newCount, duplicateCount, total }
 */
async function scrapeLeftArticles() {
  logger.info('Starting left article scraping...');

  const response = await httpClient.get(config.scraping.leftUrl);
  const $ = cheerio.load(response.data);

  const linkStart = 'https://www.democraticunderground.com';
  const articles = [];

  // Try specific selector first, fall back progressively
  let anchors = $("a[href*='?com=view_post'][href*='forum=1014']");

  if (anchors.length === 0) {
    anchors = $('td.subject a, td.title a');
  }

  if (anchors.length === 0) {
    anchors = $('a').filter(function(i, el) {
      const href = $(el).attr('href') || '';
      return href.includes('?com=view_post') || href.includes('?com=discuss') || href.includes('?com=thread');
    });
  }

  logger.info(`DU: found ${anchors.length} candidate links`);

  anchors.each(function(i, element) {
    const href = $(element).attr('href');
    const title = $(element).text().trim();

    if (!href || !title || title.toLowerCase().includes('view all')) return;

    const link = href.startsWith('http') ? href : linkStart + href;
    const row = $(element).closest('tr');
    const time = row.find('td.time').text().trim() || row.find('td:nth-child(4)').text().trim() || '';

    articles.push({ title, link, time, left: true, right: false, source: 'Democratic Underground' });
  });

  const counts = await upsertArticles(articles);
  logger.info(`Left scraping complete: ${counts.newCount} new, ${counts.duplicateCount} duplicates`);

  return { ...counts, total: articles.length };
}

/**
 * Scrape right-leaning articles from Free Republic
 * @returns {Promise<Object>} { newCount, duplicateCount, total }
 */
async function scrapeRightArticles() {
  logger.info('Starting right article scraping...');

  const response = await httpClient.get(config.scraping.rightUrl);
  const $ = cheerio.load(response.data);

  const linkStart = 'http://www.freerepublic.com/';
  const articles = [];

  $('li.article').each(function(i, element) {
    const href = $(element).find('h3').children().attr('href');
    const title = $(element).find('h3').children().text().trim();
    const time = $(element).find('.date').text().trim();

    if (!title || !href) return;

    articles.push({ link: linkStart + href, title, time, left: false, right: true, source: 'Free Republic' });
  });

  const counts = await upsertArticles(articles);
  logger.info(`Right scraping complete: ${counts.newCount} new, ${counts.duplicateCount} duplicates`);

  return { ...counts, total: articles.length };
}

/**
 * Scrape center articles from BBC News
 * @returns {Promise<Object>} { newCount, duplicateCount, total }
 */
async function scrapeCenterArticles() {
  logger.info('Starting center (BBC) article scraping...');

  const response = await httpClient.get(config.scraping.centerUrl);
  const $ = cheerio.load(response.data);

  const linkStart = 'https://www.bbc.com';
  const articles = [];
  const seen = new Set();

  $('a[data-testid="internal-link"]').each(function(i, element) {
    const href = $(element).attr('href');
    const title = $(element).find('h2, h3, [data-testid="card-headline"]').text().trim()
      || $(element).text().trim();

    if (!href || !title || title.length < 10) return;

    const link = href.startsWith('http') ? href : linkStart + href;
    if (seen.has(link)) return;
    seen.add(link);

    articles.push({ title, link, time: '', left: false, right: false, source: 'BBC' });
  });

  logger.info(`BBC: found ${articles.length} candidate articles`);

  const counts = await upsertArticles(articles);
  logger.info(`Center scraping complete: ${counts.newCount} new, ${counts.duplicateCount} duplicates`);

  return { ...counts, total: articles.length };
}

module.exports = { scrapeLeftArticles, scrapeRightArticles, scrapeCenterArticles };
