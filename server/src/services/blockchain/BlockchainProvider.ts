import type { AddressTransfersResponse } from '../../../../shared/types/index.js';
import { IBlockchainProvider, TransferQueryOptions } from './types.js';

export abstract class BaseBlockchainProvider implements IBlockchainProvider {
  abstract readonly chainName: string;

  abstract validateAddress(address: string): boolean;

  abstract getTransactions(
    address: string,
    options?: TransferQueryOptions
  ): Promise<AddressTransfersResponse>;

  abstract getUsdtTransfers(
    address: string,
    options?: TransferQueryOptions
  ): Promise<AddressTransfersResponse>;
}
