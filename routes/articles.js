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
const articleController = require('../controllers/articleController');

// Article viewing routes
router.get('/all', articleController.getAllArticles);
router.get('/left', articleController.getLeftArticles);
router.get('/right', articleController.getRightArticles);
router.get('/articles/:id', articleController.getArticleById);

// TODO FOR YOU: Add the note creation and deletion routes here
// Hint: These should go to a noteController (which you'll create)
// router.post('/articles/:id', noteController.createNote);
// router.delete('/articles/:id/note', noteController.deleteNote);

module.exports = router;
