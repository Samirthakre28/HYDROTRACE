import { Request, Response } from 'express';
import { TronProvider } from '../services/blockchain/TronProvider.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const tronProvider = new TronProvider();

export const getTronAddressTransfers = asyncHandler(
  async (req: Request, res: Response) => {
    const { address } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;
    const fingerprint = req.query.fingerprint as string | undefined;

    const result = await tronProvider.getTransactions(address, {
      limit,
      fingerprint,
    });

    res.status(200).json(result);
  }
);

export const getTronAddressUsdtTransfers = asyncHandler(
  async (req: Request, res: Response) => {
    const { address } = req.params;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 25;
    const fingerprint = req.query.fingerprint as string | undefined;

    const result = await tronProvider.getUsdtTransfers(address, {
      limit,
      fingerprint,
    });

    res.status(200).json(result);
  }
);
