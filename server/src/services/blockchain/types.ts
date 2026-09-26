import type { NormalizedTransaction, AddressTransfersResponse } from '../../../../shared/types/index.js';

export interface TransferQueryOptions {
  limit?: number;
  fingerprint?: string;
  onlyUsdt?: boolean;
  minAmount?: string;
  startDate?: string;
  endDate?: string;
}

export interface IBlockchainProvider {
  readonly chainName: string;
  validateAddress(address: string): boolean;
  getTransactions(address: string, options?: TransferQueryOptions): Promise<AddressTransfersResponse>;
  getUsdtTransfers(address: string, options?: TransferQueryOptions): Promise<AddressTransfersResponse>;
}
