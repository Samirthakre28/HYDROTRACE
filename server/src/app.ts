import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import routes from './routes/index.js';
import { config } from './config/env.js';
import { ApiError } from './utils/apiError.js';
import { logger } from './utils/logger.js';

const app = express();

// Security and utility middleware
app.use(helmet());
app.use(cors({
  origin: config.clientOrigin,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (config.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// API Routes
app.use('/api', routes);

// 404 Handler
app.use((req: Request, res: Response, next: NextFunction) => {
  next(new ApiError(404, `Cannot find ${req.originalUrl} on this server`));
});

// Global Error Handling Middleware
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  logger.error(`[${req.method} ${req.url}] ${statusCode} - ${message}`);

  res.status(statusCode).json({
    status: 'error',
    statusCode,
    message,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
});

export default app;
