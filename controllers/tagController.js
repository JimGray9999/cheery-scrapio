const Article = require('../models/Article');
const logger = require('../utils/logger');

async function getAllTags(req, res) {
  try {
    const tags = await Article.distinct('tags');
    res.json({ tags: tags.filter(Boolean).sort() });
  } catch (error) {
    logger.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Error fetching tags' });
  }
}

async function updateArticleTags(req, res) {
  try {
    const { tags } = req.body;
    if (!Array.isArray(tags)) {
      return res.status(400).json({ error: 'tags must be an array' });
    }

    const cleaned = [
      ...new Set(
        tags.map(t => String(t).trim().toLowerCase()).filter(t => t.length > 0 && t.length <= 50)
      ),
    ].slice(0, 20);

    const article = await Article.findByIdAndUpdate(
      req.params.id,
      { $set: { tags: cleaned } },
      { new: true }
    ).lean();

    if (!article) return res.status(404).json({ error: 'Article not found' });

    res.json({ tags: article.tags });
  } catch (error) {
    logger.error('Error updating tags:', error);
    res.status(500).json({ error: 'Error updating tags' });
  }
}

module.exports = { getAllTags, updateArticleTags };
