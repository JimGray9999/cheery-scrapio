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

// Shared HTTP client that looks like a real browser to avoid bot-detection blocks
const httpClient = axios.create({
  timeout: 15000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    'Upgrade-Insecure-Requests': '1',
  },
  maxRedirects: 5,
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
      upsert: true,
    },
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
    anchors = $('td.subject a, td.title a, .subject a, .title a');
  }

  if (anchors.length === 0) {
    anchors = $('a').filter(function (i, el) {
      const href = $(el).attr('href') || '';
      return (
        href.includes('?com=view_post') ||
        href.includes('?com=discuss') ||
        href.includes('?com=thread') ||
        href.includes('/discuss/')
      );
    });
  }

  if (anchors.length === 0) {
    // Last resort: any link that looks like a forum post
    anchors = $('a').filter(function (i, el) {
      const title = $(el).text().trim();
      const href = $(el).attr('href') || '';
      return title.length > 15 && href.includes('democraticunderground.com');
    });
  }

  logger.info(`DU: found ${anchors.length} candidate links`);

  anchors.each(function (i, element) {
    const href = $(element).attr('href');
    const title = $(element).text().trim();

    if (!href || !title || title.toLowerCase().includes('view all')) return;

    const link = href.startsWith('http') ? href : linkStart + href;
    const row = $(element).closest('tr');
    const time =
      row.find('td.time').text().trim() || row.find('td:nth-child(4)').text().trim() || '';

    articles.push({
      title,
      link,
      time,
      left: true,
      right: false,
      source: 'Democratic Underground',
    });
  });

  const counts = await upsertArticles(articles);
  logger.info(
    `Left scraping complete: ${counts.newCount} new, ${counts.duplicateCount} duplicates`
  );

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

  // Try structured list items first
  $('li.article, li.news-item, .article-list li').each(function (i, element) {
    const anchor = $(element).find('h3 a, h2 a, a.title, a').first();
    const href = anchor.attr('href');
    const title = anchor.text().trim();
    const time = $(element).find('.date, .time, time').text().trim();

    if (!title || !href) return;

    const link = href.startsWith('http') ? href : linkStart + href;
    articles.push({ link, title, time, left: false, right: true, source: 'Free Republic' });
  });

  // Fallback: any anchor that looks like a FR article link
  if (articles.length === 0) {
    $('a')
      .filter(function (i, el) {
        const href = $(el).attr('href') || '';
        const title = $(el).text().trim();
        return (
          title.length > 20 &&
          (href.includes('/focus/') || href.includes('/news/')) &&
          !href.includes('javascript')
        );
      })
      .each(function (i, el) {
        const href = $(el).attr('href');
        const title = $(el).text().trim();
        const link = href.startsWith('http') ? href : linkStart + href;
        articles.push({ link, title, time: '', left: false, right: true, source: 'Free Republic' });
      });
  }

  const counts = await upsertArticles(articles);
  logger.info(
    `Right scraping complete: ${counts.newCount} new, ${counts.duplicateCount} duplicates`
  );

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

  const bbcSelectors = [
    'a[data-testid="internal-link"]',
    'a[data-testid="card-headline"]',
    '.gs-c-promo-heading a',
    '.nw-c-promo-summary a',
    'a[href*="/news/articles/"]',
    'a[href*="/news/world"]',
    'a[href*="/news/uk"]',
    'a[href*="/news/us-canada"]',
  ];

  for (const selector of bbcSelectors) {
    $(selector).each(function (i, element) {
      const href = $(element).attr('href');
      const title =
        $(element)
          .find('h2, h3, [data-testid="card-headline"], .gs-c-promo-heading')
          .text()
          .trim() || $(element).text().trim();

      if (!href || !title || title.length < 10) return;
      if (href.includes('#') && !href.includes('/news/')) return;

      const link = href.startsWith('http') ? href : linkStart + href;
      if (seen.has(link)) return;
      seen.add(link);

      articles.push({ title, link, time: '', left: false, right: false, source: 'BBC' });
    });
    if (articles.length > 5) break; // stop once a selector yields results
  }

  logger.info(`BBC: found ${articles.length} candidate articles`);

  const counts = await upsertArticles(articles);
  logger.info(
    `Center scraping complete: ${counts.newCount} new, ${counts.duplicateCount} duplicates`
  );

  return { ...counts, total: articles.length };
}

module.exports = { scrapeLeftArticles, scrapeRightArticles, scrapeCenterArticles };
