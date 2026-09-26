import crypto from 'crypto';

const ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
const ALPHABET_MAP: Record<string, number> = {};
for (let i = 0; i < ALPHABET.length; i++) {
  ALPHABET_MAP[ALPHABET.charAt(i)] = i;
}

/**
 * Decodes a Base58 string to Buffer
 */
export function decodeBase58(string: string): Buffer {
  if (string.length === 0) return Buffer.alloc(0);

  const bytes = [0];
  for (let i = 0; i < string.length; i++) {
    const c = string.charAt(i);
    const value = ALPHABET_MAP[c];
    if (value === undefined) {
      throw new Error(`Non-base58 character '${c}' found at index ${i}`);
    }

    let carry = value;
    for (let j = 0; j < bytes.length; j++) {
      carry += bytes[j] * 58;
      bytes[j] = carry & 0xff;
      carry >>= 8;
    }

    while (carry > 0) {
      bytes.push(carry & 0xff);
      carry >>= 8;
    }
  }

  // Count leading '1's (represented as 0x00 in Base58)
  let leadingZeros = 0;
  for (let i = 0; i < string.length && string.charAt(i) === '1'; i++) {
    leadingZeros++;
  }

  const result = Buffer.alloc(leadingZeros + bytes.length);
  for (let i = 0; i < bytes.length; i++) {
    result[result.length - 1 - i] = bytes[i];
  }
  return result;
}

/**
 * Encodes Buffer to Base58 string
 */
export function encodeBase58(buffer: Buffer): string {
  if (buffer.length === 0) return '';

  const digits = [0];
  for (let i = 0; i < buffer.length; i++) {
    let carry = buffer[i];
    for (let j = 0; j < digits.length; j++) {
      carry += digits[j] * 256;
      digits[j] = carry % 58;
      carry = Math.floor(carry / 58);
    }

    while (carry > 0) {
      digits.push(carry % 58);
      carry = Math.floor(carry / 58);
    }
  }

  let string = '';
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    string += '1';
  }

  for (let i = digits.length - 1; i >= 0; i--) {
    string += ALPHABET.charAt(digits[i]);
  }

  return string;
}

/**
 * Converts a hex address starting with 41... to TRON Base58 address starting with T...
 */
export function tronHexToBase58(hexAddress: string): string {
  if (!hexAddress) return '';
  let hex = hexAddress.trim();
  if (hex.startsWith('0x') || hex.startsWith('0X')) {
    hex = '41' + hex.substring(2);
  }
  if (!hex.startsWith('41')) {
    hex = '41' + hex;
  }
  if (hex.length !== 42) {
    return hexAddress;
  }

  try {
    const rawBytes = Buffer.from(hex, 'hex');
    const hash1 = crypto.createHash('sha256').update(rawBytes).digest();
    const hash2 = crypto.createHash('sha256').update(hash1).digest();
    const checksum = hash2.subarray(0, 4);

    const fullBuffer = Buffer.concat([rawBytes, checksum]);
    return encodeBase58(fullBuffer);
  } catch {
    return hexAddress;
  }
}

/**
 * Validates whether a given string is a valid TRON Base58 address
 * (Base58, 34 characters, starts with 'T', prefix 0x41, valid double-SHA256 checksum)
 */
export function isValidTronAddress(address: string): boolean {
  if (!address || typeof address !== 'string') return false;
  const trimmed = address.trim();

  // Basic regex check for TRON address format (Base58, 34 chars starting with T)
  if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(trimmed)) {
    return false;
  }

  try {
    const decoded = decodeBase58(trimmed);
    if (decoded.length !== 25) return false;

    const mainBytes = decoded.subarray(0, 21);
    const checksum = decoded.subarray(21, 25);

    // Prefix must be 0x41 for mainnet TRON address
    if (mainBytes[0] !== 0x41) return false;

    const hash1 = crypto.createHash('sha256').update(mainBytes).digest();
    const hash2 = crypto.createHash('sha256').update(hash1).digest();

    return (
      checksum[0] === hash2[0] &&
      checksum[1] === hash2[1] &&
      checksum[2] === hash2[2] &&
      checksum[3] === hash2[3]
    );
  } catch {
    return false;
  }
}
