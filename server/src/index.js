const mongoose = require('mongoose');
const https = require('https');
const fs = require('fs');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');

let server;
console.log(`Mongoose Connection String: ${config.mongoose.url}`);

mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
  server =
    config.env === 'production'
      ? https.createServer(
          {
            pfx: fs.readFileSync('/home/player6-ssl-keyvault-player6backendcertificate.pfx'),
            passphrase: '',
          },
          app
        )
      : https.createServer({}, app);
  server.listen(config.port, () => {
    logger.info(`Listening at port ${config.port}`);
  });
});

const exitHandler = () => {
  if (server) {
    server.close(() => {
      logger.info('Server closed');
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
};

const unexpectedErrorHandler = (error) => {
  logger.error(error);
  exitHandler();
};

process.on('uncaughtException', unexpectedErrorHandler);
process.on('unhandledRejection', unexpectedErrorHandler);

process.on('SIGTERM', () => {
  logger.info('SIGTERM received');
  if (server) {
    server.close();
  }
});
