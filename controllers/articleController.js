const Article = require('../models/Article');
const logger = require('../utils/logger');

const PAGE_SIZE = 20;

function buildQuery(filter) {
  if (filter === 'left') return { left: true };
  if (filter === 'right') return { right: true };
  if (filter === 'center') return { left: false, right: false };
  return null;
}

function takePage(articles) {
  const hasMore = articles.length > PAGE_SIZE;
  const page = hasMore ? articles.slice(0, PAGE_SIZE) : articles;
  return { articles: page, cursor: hasMore ? page[page.length - 1]._id.toString() : null };
}

/**
 * @route GET /all
 */
async function getAllArticles(req, res) {
  try {
    const chain = q =>
      Article.find(q)
        .populate('note')
        .sort({ _id: -1 })
        .limit(PAGE_SIZE + 1);

    const [left, center, right] = await Promise.all([
      chain({ left: true }),
      chain({ left: false, right: false }),
      chain({ right: true }),
    ]);

    const { articles: leftArticles, cursor: leftCursor } = takePage(left);
    const { articles: centerArticles, cursor: centerCursor } = takePage(center);
    const { articles: rightArticles, cursor: rightCursor } = takePage(right);

    res.render('index', {
      leftArticles,
      centerArticles,
      rightArticles,
      leftCursor,
      centerCursor,
      rightCursor,
    });
  } catch (error) {
    logger.error('Error fetching all articles:', error);
    res.status(500).send('Error loading articles');
  }
}

/**
 * @route GET /left
 */
async function getLeftArticles(req, res) {
  try {
    const left = await Article.find({ left: true })
      .populate('note')
      .sort({ _id: -1 })
      .limit(PAGE_SIZE + 1);
    const { articles: leftArticles, cursor: leftCursor } = takePage(left);
    res.render('index', {
      leftArticles,
      centerArticles: [],
      rightArticles: [],
      leftCursor,
      centerCursor: null,
      rightCursor: null,
    });
  } catch (error) {
    logger.error('Error fetching left articles:', error);
    res.status(500).send('Error loading articles');
  }
}

/**
 * @route GET /right
 */
async function getRightArticles(req, res) {
  try {
    const right = await Article.find({ right: true })
      .populate('note')
      .sort({ _id: -1 })
      .limit(PAGE_SIZE + 1);
    const { articles: rightArticles, cursor: rightCursor } = takePage(right);
    res.render('index', {
      leftArticles: [],
      centerArticles: [],
      rightArticles,
      leftCursor: null,
      centerCursor: null,
      rightCursor,
    });
  } catch (error) {
    logger.error('Error fetching right articles:', error);
    res.status(500).send('Error loading articles');
  }
}

/**
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

/**
 * @route GET /api/articles?filter=left|center|right&before=<_id>
 */
async function getArticlesPage(req, res) {
  try {
    const { filter, before } = req.query;
    const query = buildQuery(filter);
    if (!query) {
      return res.status(400).json({ error: 'filter must be left, center, or right' });
    }
    if (before) {
      query._id = { $lt: before };
    }

    const articles = await Article.find(query)
      .populate('note')
      .sort({ _id: -1 })
      .limit(PAGE_SIZE + 1);

    const { articles: page, cursor: nextCursor } = takePage(articles);
    res.json({ articles: page, nextCursor });
  } catch (error) {
    logger.error('Error fetching article page:', error);
    res.status(500).json({ error: 'Error fetching articles' });
  }
}

module.exports = {
  getAllArticles,
  getLeftArticles,
  getRightArticles,
  getArticleById,
  getArticlesPage,
};
