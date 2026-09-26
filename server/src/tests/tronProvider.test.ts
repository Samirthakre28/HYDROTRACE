import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { TronProvider, TRON_USDT_CONTRACT_MAINNET } from '../services/blockchain/TronProvider.js';
import { isValidTronAddress } from '../utils/tronAddress.js';

describe('TRON Provider & Address Validation Tests', () => {
  const provider = new TronProvider();

  describe('1. TRON Address Validation', () => {
    it('should validate legitimate TRON mainnet addresses', () => {
      // USDT TRC-20 contract address on TRON
      assert.equal(provider.validateAddress('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'), true);
      // TRON Genesis address
      assert.equal(isValidTronAddress('T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb'), true);
    });

    it('should reject invalid or malformed TRON addresses', () => {
      assert.equal(provider.validateAddress('0x742d35Cc6634C0532925a3b844Bc454e4438f44e'), false);
      assert.equal(provider.validateAddress('invalid_address_string'), false);
      assert.equal(provider.validateAddress('T123Short'), false);
      assert.equal(provider.validateAddress('TLyBzJ459v2T6EaP9D27m37E6tQvP8e1fA'), false); // invalid checksum
      assert.equal(provider.validateAddress(''), false);
    });
  });

  describe('2. Transaction Normalization & Direction Logic', () => {
    it('should correctly normalize incoming & outgoing transfers', async () => {
      const mockApiItem = {
        transaction_id: '0xmocktxhash1234567890abcdef',
        block_timestamp: 1700000000000,
        from: 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb',
        to: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        type: 'Transfer',
        value: '50000000', // 50 USDT (6 decimals)
        token_info: {
          symbol: 'USDT',
          address: TRON_USDT_CONTRACT_MAINNET,
          decimals: 6,
          name: 'Tether USD',
        },
      };

      const targetAddress = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb';
      // @ts-ignore
      const normalized = provider['normalizeTrc20Transfer'](
        mockApiItem,
        targetAddress,
        '/v1/accounts/.../trc20'
      );

      assert.equal(normalized.chain, 'TRON');
      assert.equal(normalized.txHash, '0xmocktxhash1234567890abcdef');
      assert.equal(normalized.from, 'T9yD14Nj9j7xAB4dbGeiX9h8unkKHxuWwb');
      assert.equal(normalized.to, 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
      assert.equal(normalized.asset, 'USDT');
      assert.equal(normalized.amount, '50');
      assert.equal(normalized.direction, 'OUT');
      assert.equal(normalized.status, 'CONFIRMED');
      assert.equal(normalized.source.provider, 'TronGrid API');
    });

    it('should classify incoming transfer when target matches recipient', () => {
      const mockApiItem = {
        transaction_id: '0xmocktxhash987654321',
        block_timestamp: 1700000000000,
        from: 'TSenderAddress1234567890ABCDEF',
        to: 'TRecipientAddress987654321ABCDEF',
        value: '100000000', // 100 USDT
        token_info: { symbol: 'USDT', decimals: 6 },
      };

      // @ts-ignore
      const normalized = provider['normalizeTrc20Transfer'](
        mockApiItem,
        'TRecipientAddress987654321ABCDEF',
        '/test'
      );
      assert.equal(normalized.direction, 'IN');
      assert.equal(normalized.amount, '100');
    });
  });

  describe('3. Error Handling & Provider Failures', () => {
    it('should throw HTTP 400 ApiError for invalid address requests', async () => {
      await assert.rejects(
        async () => {
          await provider.getTransactions('INVALID_TRON_ADDR');
        },
        (err: any) => {
          return err.statusCode === 400 && err.message.includes('Invalid TRON address');
        }
      );
    });

    it('should handle API endpoint error codes gracefully', async () => {
      const mockCustomProvider = new TronProvider('https://httpbin.org/status/500');
      await assert.rejects(
        async () => {
          await mockCustomProvider.getTransactions('TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t');
        },
        (err: any) => {
          return err.statusCode >= 500;
        }
      );
    });
  });
});
