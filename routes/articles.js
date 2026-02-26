/**
 * Article Routes
 *
 * This file defines all routes related to articles.
 * Routes connect URLs to controller functions.
 *
 * LEARNING NOTE: By separating routes into different files, we can:
 * - Keep our code organized
 * - Make server.js much smaller and cleaner
 * - Group related functionality together
 *
 * Pattern:
 * 1. Import express Router
 * 2. Import controllers
 * 3. Define routes and connect them to controllers
 * 4. Export the router
 */

const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const articleController = require('../controllers/articleController');
const noteController = require('../controllers/noteController');

// Validation middleware for note creation
const validateNote = [
  body('header')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be between 3 and 100 characters'),
  body('text')
    .trim()
    .notEmpty().withMessage('Comment is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Comment must be between 10 and 1000 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Article viewing routes
router.get('/all', articleController.getAllArticles);
router.get('/left', articleController.getLeftArticles);
router.get('/right', articleController.getRightArticles);

// Article + note routes
router.get('/articles/:id', articleController.getArticleById);
router.post('/articles/:id', validateNote, noteController.createNote);
router.delete('/articles/:id/note', noteController.deleteNote);

module.exports = router;
