import mongoose from 'mongoose';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

let isConnected = false;

export const connectDatabase = async (): Promise<boolean> => {
  if (isConnected) {
    return true;
  }

  try {
    mongoose.set('strictQuery', true);
    
    // Set connection timeout options
    const conn = await mongoose.connect(config.mongoDbUri, {
      serverSelectionTimeoutMS: 5000,
    });

    isConnected = true;
    logger.info(`MongoDB Connected: ${conn.connection.host}`);

    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err.message}`);
      isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB connection disconnected');
      isConnected = false;
    });

    return true;
  } catch (error: any) {
    logger.warn(`MongoDB Connection Warning: ${error.message}. Backend will run with database features disabled/mock fallback until DB is available.`);
    isConnected = false;
    return false;
  }
};

export const isDatabaseConnected = (): boolean => {
  return mongoose.connection.readyState === 1;
};
