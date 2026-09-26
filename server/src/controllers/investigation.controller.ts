import { Request, Response } from 'express';
import { GraphEngine } from '../services/graph/GraphEngine.js';
import { VaspCandidateEngine } from '../services/attribution/VaspCandidateEngine.js';
import { EvidenceBundleService } from '../services/report/EvidenceBundleService.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const graphEngine = new GraphEngine();
const vaspCandidateEngine = new VaspCandidateEngine();
const evidenceBundleService = new EvidenceBundleService();

export const traceInvestigationController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = await graphEngine.traceInvestigation(req.body);
    res.status(200).json(result);
  }
);

export const evaluateAttributionController = asyncHandler(
  async (req: Request, res: Response) => {
    const result = vaspCandidateEngine.evaluateGraphAttribution(req.body);
    res.status(200).json(result);
  }
);

export const generateReportController = asyncHandler(
  async (req: Request, res: Response) => {
    const { trace, attribution, caseReference } = req.body;
    if (!trace || !attribution) {
      res.status(400).json({
        success: false,
        message: 'Both trace and attribution data are required to generate an investigation report.',
      });
      return;
    }
    const result = evidenceBundleService.generateReport(trace, attribution, caseReference);
    res.status(200).json(result);
  }
);

