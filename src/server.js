import app from './app.js';
import logger from './logger.js';
import { PORT } from './config.js';

const server = app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Fragments service listening');
});

server.on('error', (err) => {
  logger.error({ err }, 'HTTP server error');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled promise rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});