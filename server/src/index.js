const mongoose = require('mongoose');
const app = require('./app');
const config = require('./config/config');
const logger = require('./config/logger');

console.log(`Mongoose Connection String: ${config.mongoose.url}`);

mongoose.connect(config.mongoose.url, config.mongoose.options).then(() => {
  logger.info('Connected to MongoDB');
});

server = app.listen(config.port, () => {
  logger.info(`Listening to port ${config.port}`);
  console.log();
});

const io = require('socket.io')(server);

io.on('connection', (socket) => {
  console.log('User connected');
  socket.on('disconnect', () => {
    console.log('User disconnected');
  });

  socket.on('arrived at player selection', (gameID) => {
    socket.join(gameID);
  });

  socket.on('hello', () => {
    console.log('received hello');
    socket.emit('hello', 'Hey there');
  });

  socket.on('player selected', (data) => {
    io.to(data.gameID).emit('player update', data);
    console.log("Player Selected event");
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
