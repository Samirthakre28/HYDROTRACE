import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  mongoDbUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/vasp_attribution_db',
  clientOrigin: process.env.FRONTEND_URL || process.env.CLIENT_ORIGIN || 'https://hydrotrace-azure.vercel.app',
  tronApiBaseUrl: process.env.TRON_API_BASE_URL || 'https://api.trongrid.io',
  tronApiKey: process.env.TRON_API_KEY || '',
};
