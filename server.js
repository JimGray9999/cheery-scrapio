const config = require('./config/config');
const logger = require('./utils/logger');

const mongoose = require('mongoose');
const createApp = require('./app');

const app = createApp();

process.on('unhandledRejection', reason => logger.error('Unhandled Rejection:', reason));
process.on('uncaughtException', err => logger.error('Uncaught Exception:', err));

mongoose.connect(config.mongodb.uri, { serverSelectionTimeoutMS: 5000 });
const db = mongoose.connection;
db.on('error', error => logger.error('Mongoose error:', error));
db.once('open', () => logger.info('Mongoose connection successful'));

app.listen(config.port, () => {
  logger.info(`Server listening on port ${config.port}`);
  logger.info(`http://localhost:${config.port}`);
});
