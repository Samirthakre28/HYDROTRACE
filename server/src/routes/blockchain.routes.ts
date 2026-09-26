import { Router } from 'express';
import {
  getTronAddressTransfers,
  getTronAddressUsdtTransfers,
} from '../controllers/blockchain.controller.js';

const router = Router();

// GET /api/blockchain/tron/address/:address
router.get('/tron/address/:address', getTronAddressTransfers);

// GET /api/blockchain/tron/address/:address/usdt
router.get('/tron/address/:address/usdt', getTronAddressUsdtTransfers);

export default router;
