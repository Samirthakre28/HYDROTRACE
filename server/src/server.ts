import app from './app.js';
import { config } from './config/env.js';
import { connectDatabase } from './config/db.js';
import { logger } from './utils/logger.js';

const startServer = async () => {
  // Connect to MongoDB (non-blocking if DB is temporarily unreachable)
  await connectDatabase();

  const server = app.listen(config.port, () => {
    logger.info(`HydroTrace Server running in [${config.nodeEnv}] mode on port ${config.port}`);
    logger.info(`Health Check Endpoint available at http://localhost:${config.port}/api/health`);
  });

  const handleShutdown = (signal: string) => {
    logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  process.on('SIGINT', () => handleShutdown('SIGINT'));
};

startServer();
