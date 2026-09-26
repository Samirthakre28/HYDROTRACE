import { Request, Response } from 'express';
import { isDatabaseConnected } from '../config/db.js';

export const getHealthStatus = (req: Request, res: Response) => {
  const dbConnected = isDatabaseConnected();
  
  res.status(200).json({
    status: 'ok',
    service: 'HydroTrace',
    timestamp: new Date().toISOString(),
    database: dbConnected ? 'connected' : 'disconnected',
  });
};
