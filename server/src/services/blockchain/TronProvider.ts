import { BaseBlockchainProvider } from './BlockchainProvider.js';
import { TransferQueryOptions } from './types.js';
import type { NormalizedTransaction, AddressTransfersResponse } from '../../../../shared/types/index.js';
import { isValidTronAddress } from '../../utils/tronAddress.js';
import { ApiError } from '../../utils/apiError.js';
import { config } from '../../config/env.js';
import { logger } from '../../utils/logger.js';

export const TRON_USDT_CONTRACT_MAINNET = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';

export class TronProvider extends BaseBlockchainProvider {
  readonly chainName = 'TRON';
  private baseUrl: string;
  private apiKey: string;

  constructor(baseUrl = config.tronApiBaseUrl, apiKey = config.tronApiKey) {
    super();
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  /**
   * Validates a TRON address using checksum & prefix rules
   */
  validateAddress(address: string): boolean {
    return isValidTronAddress(address);
  }

  /**
   * Helper to make HTTP requests to TRON API
   */
  private async fetchFromApi(endpoint: string, params: Record<string, string | number | undefined> = {}) {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.append(key, String(value));
      }
    });

    const headers: Record<string, string> = {
      'Accept': 'application/json',
    };

    if (this.apiKey) {
      headers['TRON-PRO-API-KEY'] = this.apiKey;
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.status === 429) {
        throw new ApiError(
          429,
          'TRON API rate limit exceeded. Please configure TRON_API_KEY or retry after a cooldown period.'
        );
      }

      if (response.status === 401 || response.status === 403) {
        throw new ApiError(
          response.status,
          'TRON API authentication failed. Please check TRON_API_KEY configuration.'
        );
      }

      if (!response.ok) {
        throw new ApiError(
          502,
          `TRON API returned HTTP error ${response.status}: ${response.statusText}`
        );
      }

      const json = await response.json();
      return { json, endpoint: url.pathname + url.search };
    } catch (error: any) {
      if (error instanceof ApiError) throw error;
      if (error.name === 'AbortError') {
        throw new ApiError(504, 'TRON API request timed out after 10 seconds.');
      }
      logger.error(`TRON API network failure: ${error.message}`);
      throw new ApiError(502, `Failed to reach TRON blockchain API: ${error.message}`);
    }
  }

  /**
   * Retrieves TRC-20 transfers for a given TRON address
   */
  async getTransactions(
    address: string,
    options: TransferQueryOptions = {}
  ): Promise<AddressTransfersResponse> {
    if (!this.validateAddress(address)) {
      throw new ApiError(
        400,
        `Invalid TRON address format: "${address}". TRON mainnet addresses must start with 'T', be 34 characters long, and pass Base58Check validation.`
      );
    }

    const limit = Math.min(Math.max(options.limit || 25, 1), 100);
    const endpoint = `/v1/accounts/${encodeURIComponent(address)}/transactions/trc20`;

    const queryParams: Record<string, string | number | undefined> = {
      limit,
      fingerprint: options.fingerprint,
      only_confirmed: 'true',
    };

    if (options.onlyUsdt) {
      queryParams['contract_address'] = TRON_USDT_CONTRACT_MAINNET;
    }

    const { json, endpoint: fullEndpoint } = await this.fetchFromApi(endpoint, queryParams);

    if (!json || typeof json !== 'object') {
      throw new ApiError(502, 'Invalid response received from TRON API provider.');
    }

    const rawData = Array.isArray((json as any).data) ? (json as any).data : [];
    const fingerprint = (json as any).meta?.fingerprint || undefined;

    const transfers: NormalizedTransaction[] = rawData.map((item: any) =>
      this.normalizeTrc20Transfer(item, address, fullEndpoint)
    );

    return {
      success: true,
      chain: this.chainName,
      address,
      transfers,
      pagination: {
        limit,
        fingerprint,
        hasMore: Boolean(fingerprint && transfers.length > 0),
      },
      source: {
        provider: 'TronGrid API',
        retrievedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Specific helper to fetch USDT TRC-20 transfers
   */
  async getUsdtTransfers(
    address: string,
    options: TransferQueryOptions = {}
  ): Promise<AddressTransfersResponse> {
    return this.getTransactions(address, { ...options, onlyUsdt: true });
  }

  /**
   * Normalizes a TRC-20 transfer event into standard internal format
   */
  private normalizeTrc20Transfer(
    item: any,
    targetAddress: string,
    endpoint: string
  ): NormalizedTransaction {
    const txHash = item.transaction_id || item.hash || 'UNKNOWN_HASH';
    const timestamp = item.block_timestamp
      ? new Date(Number(item.block_timestamp)).toISOString()
      : new Date().toISOString();

    const from = item.from || 'UNKNOWN_SENDER';
    const to = item.to || 'UNKNOWN_RECIPIENT';

    let direction: 'IN' | 'OUT' | 'SELF' = 'IN';
    const cleanTarget = targetAddress.trim().toLowerCase();
    const cleanFrom = from.trim().toLowerCase();
    const cleanTo = to.trim().toLowerCase();

    if (cleanFrom === cleanTarget && cleanTo === cleanTarget) {
      direction = 'SELF';
    } else if (cleanFrom === cleanTarget) {
      direction = 'OUT';
    } else {
      direction = 'IN';
    }

    const tokenSymbol = item.token_info?.symbol || 'TRC20';
    const decimals = Number(item.token_info?.decimals ?? 6);
    const rawValue = item.value || '0';

    let amount = rawValue;
    try {
      if (decimals > 0 && !isNaN(Number(rawValue))) {
        const num = Number(rawValue) / Math.pow(10, decimals);
        amount = num.toLocaleString('en-US', {
          maximumFractionDigits: decimals,
          useGrouping: false,
        });
      }
    } catch {
      amount = rawValue;
    }

    return {
      chain: this.chainName,
      txHash,
      timestamp,
      from,
      to,
      asset: tokenSymbol,
      tokenContract: item.token_info?.address || undefined,
      amount,
      direction,
      status: 'CONFIRMED',
      source: {
        provider: 'TronGrid API',
        endpoint,
        raw: {
          transaction_id: item.transaction_id,
          block_timestamp: item.block_timestamp,
          type: item.type,
          token_info: item.token_info,
          value: item.value,
        },
      },
    };
  }
}
