/**
 * Safe Space Central Unit - Server Entry Point
 * Restored file: handles port availability and graceful shutdown.
 */

require('dotenv').config();
const net = require('net');
const app = require('./app');
const { logger } = require('./utils/logger');

const PORT = parseInt(process.env.PORT, 10) || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';

function ensurePortAvailable(port) {
  return new Promise((resolve, reject) => {
    const tester = net
      .createServer()
      .once('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          reject(new Error(`Port ${port} is already in use.`));
        } else {
          reject(err);
        }
      })
      .once('listening', () => {
        tester.close(() => resolve());
      })
      .listen(port);
  });
}

ensurePortAvailable(PORT)
  .then(() => {
    const server = app
      .listen(PORT, () => {
        logger.info('Safe Space Central Unit is running');
        logger.info(`Environment: ${NODE_ENV}`);
        logger.info(`Server listening on port ${PORT}`);
      })
      .on('error', (err) => {
        if (err.code === 'EADDRINUSE') {
          logger.error(`Failed to bind port ${PORT}. It is in use.`);
          logger.error('Resolve by freeing the port or setting PORT in .env to a free port.');
        } else {
          logger.error(`Server error: ${err.message}`);
        }
        process.exit(1);
      });

    process.on('unhandledRejection', (err) => {
      logger.error('UNHANDLED REJECTION! Shutting down...');
      logger.error(err.name, err.message);
      server.close(() => {
        process.exit(1);
      });
    });

    process.on('SIGTERM', () => {
      logger.info('SIGTERM received. Shutting down gracefully...');
      server.close(() => {
        logger.info('Process terminated.');
      });
    });
  })
  .catch((err) => {
    logger.error(err.message);
    logger.error('Tip: Run `lsof -i :5000` to find the process and kill it, or change PORT in .env');
    process.exit(1);
  });
