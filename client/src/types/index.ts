export * from '../../../shared/types/index';

export interface InvestigationItem {
  id: string;
  caseReference: string;
  title: string;
  targetWallet: string;
  blockchain: 'BITCOIN' | 'ETHEREUM' | 'TRON' | 'POLYGON';
  status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED';
  leadInvestigator: string;
  createdAt: string;
  updatedAt: string;
  hopDepth: number;
}
