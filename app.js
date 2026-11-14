const express = require('express');
const { engine } = require('express-handlebars');
const helmet = require('helmet');
const logger = require('./utils/logger');

const articleRoutes = require('./routes/articles');
const scrapingRoutes = require('./routes/scraping');

function createApp() {
  const app = express();

  app.engine('handlebars', engine({ defaultLayout: 'main' }));
  app.set('view engine', 'handlebars');

  app.use(helmet());
  app.use(express.static('public'));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.get('/', (req, res) => res.render('index'));
  app.get('/health', (req, res) => res.status(200).json({ status: 'ok' }));
  app.use('/', articleRoutes);
  app.use('/', scrapingRoutes);

  app.use((req, res) => {
    res.status(404).render('index', { notFound: true });
  });

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    logger.error('Unhandled error:', err);
    res.status(500).json({ error: 'Internal server error' });
  });

  return app;
}

module.exports = createApp;
