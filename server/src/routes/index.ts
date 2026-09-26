import { Router } from 'express';
import healthRoutes from './health.routes.js';
import blockchainRoutes from './blockchain.routes.js';
import investigationRoutes from './investigation.routes.js';

const router = Router();

// Mount system routes
router.use('/', healthRoutes);
router.use('/blockchain', blockchainRoutes);
router.use('/investigations', investigationRoutes);

export default router;
