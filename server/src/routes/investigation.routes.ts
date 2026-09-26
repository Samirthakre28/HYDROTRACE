import { Router } from 'express';
import {
  traceInvestigationController,
  evaluateAttributionController,
  generateReportController,
} from '../controllers/investigation.controller.js';

const router = Router();

// POST /api/investigations/trace
router.post('/trace', traceInvestigationController);

// POST /api/investigations/attribution
router.post('/attribution', evaluateAttributionController);

// POST /api/investigations/report
router.post('/report', generateReportController);

export default router;

