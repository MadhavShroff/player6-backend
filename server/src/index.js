const mongoose = require('mongoose');
const https = require('https');
const fs = require('fs');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');

console.log(`Mongoose Connection String: ${config.mongoose.url}`);

mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
});

server = app.listen(config.port, () => {
  logger.info(`Listening to port ${config.port}`);
  console.log()
});

var io = require('socket.io')(server);

io.on('connection', (socket) => {
  console.log('a user connected');
});

io.on('hello', (socket) => {
  console.log("Hey there");
})

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
