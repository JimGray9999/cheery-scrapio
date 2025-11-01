/**
 * Article Controller
 *
 * Controllers handle HTTP request/response logic. They:
 * - Extract data from requests (params, body, query)
 * - Call services to do the work
 * - Format and send responses
 * - Handle errors
 *
 * LEARNING NOTE: Keep controllers thin! They should mostly just
 * coordinate between the HTTP layer and your services.
 *
 * Pattern:
 * 1. Extract request data
 * 2. Validate input (basic validation here, detailed in routes)
 * 3. Call service
 * 4. Send response
 * 5. Handle errors
 */

const Article = require('../models/Article');
const logger = require('../utils/logger');

/**
 * Get all articles
 * @route GET /all
 */
async function getAllArticles(req, res) {
  try {
    const articles = await Article.find({}).sort({ _id: -1 });
    res.render('index', { article: articles });
  } catch (error) {
    logger.error('Error fetching all articles:', error);
    res.status(500).send('Error loading articles');
  }
}

/**
 * Get only left-leaning articles
 * @route GET /left
 */
async function getLeftArticles(req, res) {
  try {
    const articles = await Article.find({ left: true }).sort({ _id: -1 });
    res.render('index', { article: articles });
  } catch (error) {
    logger.error('Error fetching left articles:', error);
    res.status(500).send('Error loading articles');
  }
}

/**
 * Get only right-leaning articles
 * @route GET /right
 */
async function getRightArticles(req, res) {
  try {
    const articles = await Article.find({ right: true }).sort({ _id: -1 });
    res.render('index', { article: articles });
  } catch (error) {
    logger.error('Error fetching right articles:', error);
    res.status(500).send('Error loading articles');
  }
}

/**
 * Get a single article by ID with its note
 * @route GET /articles/:id
 */
async function getArticleById(req, res) {
  try {
    const article = await Article.findById(req.params.id).populate('note');

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(article);
  } catch (error) {
    logger.error('Error fetching article:', error);
    res.status(500).json({ error: 'Error fetching article' });
  }
}

module.exports = {
  getAllArticles,
  getLeftArticles,
  getRightArticles,
  getArticleById
};
