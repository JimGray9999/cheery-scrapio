# Your Refactoring Tasks! 🚀

I've set up the foundation and examples for you. Now it's your turn to complete the refactoring following the patterns I've shown.

## What I've Done For You ✅

I created:
1. **Directory structure**: `config/`, `controllers/`, `routes/`, `services/`, `utils/`
2. **Config module**: `config/config.js` - Centralizes environment variables
3. **Logger utility**: `utils/logger.js` - Structured logging with Winston
4. **Example service**: `services/scraperService.js` - Shows how to extract business logic
5. **Example controller**: `controllers/articleController.js` - Shows HTTP handling pattern
6. **Example routes**: `routes/articles.js` and `routes/scraping.js` - Shows route organization

## Your Tasks 📝

### Task 1: Create the Note Controller ⭐ EASIEST

**File to create**: `controllers/noteController.js`

**What to do**: Look at `controllers/articleController.js` as an example. Create a note controller with these functions:

```javascript
// Function to create a note for an article
async function createNote(req, res) {
  // 1. Extract data from req.body (header, text)
  // 2. Extract article ID from req.params.id
  // 3. Validate that header and text exist
  // 4. Create new Note and save it
  // 5. Update the Article with the note reference
  // 6. Send JSON response
  // 7. Handle errors
}

// Function to delete a note
async function deleteNote(req, res) {
  // 1. Extract article ID from req.params.id
  // 2. Find the article
  // 3. If article has a note, delete it
  // 4. Remove note reference from article
  // 5. Send JSON response
  // 6. Handle errors
}

module.exports = {
  createNote,
  deleteNote
};
```

**Hints**:
- Import `Note` model from `../models/Note`
- Import `Article` model from `../models/Article`
- Import `logger` from `../utils/logger`
- Look at server.js lines 228-286 for the logic you need to move
- Use `logger.error()` instead of `console.error()`

---

### Task 2: Update Article Routes ⭐ EASY

**File to edit**: `routes/articles.js`

**What to do**: Add the note routes using your new controller

```javascript
const noteController = require('../controllers/noteController');

// Add these lines:
router.post('/articles/:id', noteController.createNote);
router.delete('/articles/:id/note', noteController.deleteNote);
```

---

### Task 3: Create Scraper Controller ⭐⭐ MEDIUM

**File to create**: `controllers/scraperController.js`

**Why**: Currently, routes/scraping.js has the logic inline. Let's move it to a controller for consistency.

**What to do**: Create functions for left, right, and center scraping that call the services.

```javascript
const scraperService = require('../services/scraperService');
const logger = require('../utils/logger');

async function scrapeLeft(req, res) {
  try {
    const result = await scraperService.scrapeLeftArticles();
    logger.info(`Left scraping: ${result.newCount} new articles`);
    res.redirect('/scrape/right');
  } catch (error) {
    logger.error('Error scraping left:', error);
    res.status(500).send('Error scraping left links');
  }
}

// Create scrapeRight() following the same pattern

// Create scrapeCenter() - this one will need the BBC service function first (see Task 4)

module.exports = {
  scrapeLeft,
  scrapeRight,
  scrapeCenter
};
```

Then update `routes/scraping.js` to use your controller:

```javascript
const scraperController = require('../controllers/scraperController');

router.get('/scrape/left', scraperController.scrapeLeft);
router.get('/scrape/right', scraperController.scrapeRight);
router.get('/scrape/news/center', scraperController.scrapeCenter);
```

---

### Task 4: Add BBC Scraping to Service ⭐⭐⭐ HARDER

**File to edit**: `services/scraperService.js`

**What to do**: Create a `scrapeCenterArticles()` function for BBC news.

**Challenge**: BBC's HTML structure will be different. You'll need to:
1. Use axios to fetch the BBC URL from config
2. Use cheerio to parse the HTML
3. Inspect the BBC website to find the right selectors
4. Extract article title, link, time (or date)
5. Save with `left: false, right: false, source: 'BBC'`

**Hints**:
- Visit http://www.bbc.com/news/world/us_and_canada in your browser
- Right-click > Inspect to see the HTML structure
- Look for repeated elements (probably article tags or divs)
- Follow the same pattern as `scrapeLeftArticles()` and `scrapeRightArticles()`

---

### Task 5: Add Input Validation ⭐⭐⭐ HARDER

**File to create**: `routes/notes.js` (optional - for better organization)

**What to do**: Use express-validator to validate note input before it reaches the controller.

```javascript
const { body, validationResult } = require('express-validator');

// Validation middleware
const validateNote = [
  body('header')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 100 }).withMessage('Title must be 3-100 characters'),
  body('text')
    .trim()
    .notEmpty().withMessage('Comment is required')
    .isLength({ min: 10, max: 1000 }).withMessage('Comment must be 10-1000 characters'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// Use in route:
router.post('/articles/:id', validateNote, noteController.createNote);
```

---

### Task 6: Update server.js ⭐⭐⭐ MOST IMPORTANT

**File to edit**: `server.js`

**What to do**: Replace the old routes with your new modular routes.

**Steps**:

1. **Add new imports at the top** (after the model imports):
```javascript
const config = require('./config/config');
const logger = require('./utils/logger');
const articleRoutes = require('./routes/articles');
const scrapingRoutes = require('./routes/scraping');
```

2. **Update the database connection** (around line 41):
```javascript
mongoose.connect(config.mongodb.uri);
```

3. **Replace console.log with logger** throughout:
```javascript
// OLD: console.log("Mongoose Error: ", error);
// NEW: logger.error("Mongoose Error:", error);

// OLD: console.log("Mongoose connection successful.");
// NEW: logger.info("Mongoose connection successful.");
```

4. **Remove old route definitions** (lines 59-286) and replace with:
```javascript
// ROUTES //

// Home route
app.get("/", function(req, res) {
  res.render("index");
});

// Use modular routes
app.use('/', articleRoutes);
app.use('/', scrapingRoutes);

// END ROUTES //
```

5. **Update the server start message**:
```javascript
app.listen(config.port, function() {
  logger.info(`Server listening on port: ${config.port}`);
  logger.info(`Go to http://localhost:${config.port}`);
});
```

---

### Task 7: Test Everything! ⭐⭐ IMPORTANT

**What to do**: Make sure your refactored code works!

1. Start the server: `npm start`
2. Test each route:
   - Visit http://localhost:5000/
   - Click "SCRAPE!" - should scrape articles
   - Click "Left" - should filter left articles
   - Click "Right" - should filter right articles
   - Try adding a comment to an article
3. Check the logs - you should see colorful Winston logs instead of console.log

---

## Learning Resources 📚

### Architecture Pattern You're Learning

This is the **MVC (Model-View-Controller)** pattern with **Services**:

```
Request → Routes → Controllers → Services → Models → Database
                      ↓
Response ← Views ← Controllers ←─────────┘
```

- **Models**: Database schemas (Article, Note) - Already done ✅
- **Views**: Handlebars templates - Already done ✅
- **Controllers**: Handle HTTP requests/responses
- **Services**: Business logic (scraping, data processing)
- **Routes**: Map URLs to controllers
- **Utils**: Helper functions (logger)
- **Config**: Configuration management

### Why This Is Better

**Before** (all in server.js):
- 296 lines of mixed concerns
- Hard to test
- Hard to find code
- Hard to reuse logic

**After** (modular):
- Small, focused files
- Easy to test each piece
- Clear organization
- Reusable services
- Professional structure

---

## Need Help? 🆘

**Stuck on something?** Here's what to do:

1. Look at the example files I created for patterns
2. Check server.js for the logic you need to move
3. Use logger.info/error instead of console.log
4. Test frequently - don't wait until everything is done
5. Ask me questions! I'm here to help

**Common Issues**:
- "Module not found": Check your require() paths (use `../` to go up a directory)
- "Cannot read property": Make sure you're exporting functions correctly
- "500 error": Check the logs - Winston will show you the error

---

## Order I Recommend 📋

Do the tasks in this order:

1. Task 1 (Note Controller) - Easiest, good practice
2. Task 2 (Update Routes) - Quick win
3. Task 6 (Update server.js) - Get things wired up
4. Task 7 (Test) - Make sure Tasks 1-3 work
5. Task 3 (Scraper Controller) - More practice
6. Task 4 (BBC Scraping) - Fun challenge!
7. Task 5 (Validation) - Polish

---

## Commit Strategy 💾

After each working task:
```bash
git add .
git commit -m "Refactor: Add note controller"
```

Don't commit broken code! Test first.

---

Good luck! You've got this! 💪

When you're done (or stuck), let me know and we'll review your work together.
