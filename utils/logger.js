/**
 * Logger Utility
 *
 * Structured logging using Winston. This provides better logging than console.log
 * with features like:
 * - Different log levels (error, warn, info, debug)
 * - Timestamps on all logs
 * - File output for production
 * - Colored output for development
 *
 * LEARNING NOTE: Instead of console.log(), use:
 *   logger.info('message')   - General information
 *   logger.error('message')  - Errors
 *   logger.warn('message')   - Warnings
 *   logger.debug('message')  - Debug information
 */

const winston = require('winston');
const config = require('../config/config');

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    return `${timestamp} [${level.toUpperCase()}]: ${message}${stack ? '\n' + stack : ''}`;
  })
);

// Create the logger
const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports: [
    // Console output (always enabled)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      )
    })
  ]
});

// In production, also log to file
if (config.env === 'production') {
  logger.add(new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error'
  }));
  logger.add(new winston.transports.File({
    filename: config.logging.file
  }));
}

module.exports = logger;
