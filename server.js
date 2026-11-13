const config = require('./config/config');
const logger = require('./utils/logger');

const express = require('express');
const { engine } = require('express-handlebars');
const mongoose = require('mongoose');
const helmet = require('helmet');

const articleRoutes = require('./routes/articles');
const scrapingRoutes = require('./routes/scraping');

const app = express();

// Global error handlers to avoid process exit on unexpected errors
process.on('unhandledRejection', reason => logger.error('Unhandled Rejection:', reason));
process.on('uncaughtException', err => logger.error('Uncaught Exception:', err));

// Templating engine
app.engine('handlebars', engine({ defaultLayout: 'main' }));
app.set('view engine', 'handlebars');

// Middleware
app.use(helmet());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Database
mongoose.connect(config.mongodb.uri, { serverSelectionTimeoutMS: 5000 });
const db = mongoose.connection;
db.on('error', error => logger.error('Mongoose error:', error));
db.once('open', () => logger.info('Mongoose connection successful'));

// Routes
app.get('/', (req, res) => res.render('index'));
app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
app.use('/', articleRoutes);
app.use('/', scrapingRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).render('index', { notFound: true });
});

// Global error handler — catches anything Express passes via next(err)
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(config.port, () => {
  logger.info(`Server listening on port ${config.port}`);
  logger.info(`http://localhost:${config.port}`);
});
