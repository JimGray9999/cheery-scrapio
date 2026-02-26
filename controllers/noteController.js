/**
 * Note Controller
 *
 * Handles HTTP request/response logic for article comments (notes).
 * Business logic is kept here since notes are simple CRUD operations
 * that don't warrant a separate service layer.
 */

const Note = require('../models/Note');
const Article = require('../models/Article');
const logger = require('../utils/logger');

/**
 * Create a note for a specific article
 * @route POST /articles/:id
 */
async function createNote(req, res) {
  try {
    const { header, text } = req.body;
    const articleId = req.params.id;

    // Create and save the note
    const savedNote = await Note.create({ header, text });

    // Attach note reference to the article
    const article = await Article.findByIdAndUpdate(
      articleId,
      { note: savedNote._id },
      { new: true }
    ).populate('note');

    if (!article) {
      await Note.findByIdAndDelete(savedNote._id); // clean up orphaned note
      return res.status(404).json({ error: 'Article not found' });
    }

    logger.info(`Note created for article ${articleId}`);
    res.json({ success: true, article });
  } catch (error) {
    logger.error('Error saving note:', error);
    res.status(500).json({ error: 'Error saving note' });
  }
}

/**
 * Delete a note from a specific article
 * @route DELETE /articles/:id/note
 */
async function deleteNote(req, res) {
  try {
    const article = await Article.findById(req.params.id);

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (article.note) {
      await Note.findByIdAndDelete(article.note);
      article.note = null;
      await article.save();
      logger.info(`Note deleted from article ${req.params.id}`);
    }

    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    logger.error('Error deleting note:', error);
    res.status(500).json({ error: 'Error deleting note' });
  }
}

module.exports = { createNote, deleteNote };
