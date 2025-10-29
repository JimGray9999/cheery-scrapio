/**
 * Configuration Module
 *
 * Centralizes all environment variables and configuration settings.
 * This makes it easier to manage and validate configuration in one place.
 *
 * LEARNING NOTE: Instead of using process.env everywhere in your code,
 * import this module and use the exported config object. This makes your
 * code more testable and maintainable.
 */

require('dotenv').config();

const config = {
  // Server Configuration
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,

  // Database Configuration
  mongodb: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost/cheery-scrapio'
  },

  // Session Configuration
  session: {
    secret: process.env.SESSION_SECRET || 'your-secret-key-here'
  },

  // Scraping URLs
  scraping: {
    leftUrl: process.env.SCRAPE_URL_LEFT || 'https://www.democraticunderground.com/?com=forum&id=1014',
    rightUrl: process.env.SCRAPE_URL_RIGHT || 'http://www.freerepublic.com/tag/breaking-news/index?tab=articles',
    centerUrl: process.env.SCRAPE_URL_CENTER || 'http://www.bbc.com/news/world/us_and_canada'
  },

  // Logging Configuration
  logging: {
    level: process.env.LOG_LEVEL || 'info',
    file: process.env.LOG_FILE || 'logs/app.log'
  }
};

// Validate critical configuration
if (!config.mongodb.uri) {
  throw new Error('MONGODB_URI is required');
}

module.exports = config;
