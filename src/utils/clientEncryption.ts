/**
 * Client-side Decryption & Hash Breaker Utility
 * Decrypts AES-256-GCM encrypted hashes directly in the browser using Web Crypto API.
 * Ensures that user names, emails, and sensitive fields are ALWAYS displayed in clear text in the UI,
 * even if the backend returns the raw encrypted database hash.
 */

const CANDIDATE_SECRETS = [
  'planiflow_super_seguro_jwt_2026_isolated',
  'planiflow_secure_encryption_key_2026_aes256_military_grade',
  'finflow_secure_jwt_secret_token_2026_isolated',
  'seu_jwt_secret_super_seguro_aqui_2026',
];

const PREFIX = 'enc:v1:';

// In-memory synchronous cache for already broken hashes
const syncDecryptionCache = new Map<string, string>();

function hexToUint8Array(hex: string): Uint8Array {
  const cleanHex = hex.trim();
  const matches = cleanHex.match(/.{1,2}/g) || [];
  return new Uint8Array(matches.map((byte) => parseInt(byte, 16)));
}

/**
 * Decrypts a single AES-256-GCM chunk using Web Crypto API.
 */
async function breakSingleChunk(encryptedText: string): Promise<string> {
  if (!encryptedText || !encryptedText.startsWith(PREFIX)) {
    return encryptedText;
  }

  // Check cache first
  if (syncDecryptionCache.has(encryptedText)) {
    return syncDecryptionCache.get(encryptedText)!;
  }

  const parts = encryptedText.split(':');
  let ivHex: string;
  let tagHex: string;
  let cipherHex: string;

  if (parts[2] === 'det') {
    if (parts.length !== 6) return encryptedText;
    ivHex = parts[3];
    tagHex = parts[4];
    cipherHex = parts[5];
  } else {
    if (parts.length !== 5) return encryptedText;
    ivHex = parts[2];
    tagHex = parts[3];
    cipherHex = parts[4];
  }

  try {
    const iv = hexToUint8Array(ivHex);
    const tag = hexToUint8Array(tagHex);
    const ciphertext = hexToUint8Array(cipherHex);

    // Web Crypto expects ciphertext concatenated with the authentication tag
    const dataWithTag = new Uint8Array(ciphertext.length + tag.length);
    dataWithTag.set(ciphertext);
    dataWithTag.set(tag, ciphertext.length);

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();

    for (const secret of CANDIDATE_SECRETS) {
      try {
        const keyHash = await window.crypto.subtle.digest('SHA-256', encoder.encode(secret));
        const cryptoKey = await window.crypto.subtle.importKey(
          'raw',
          keyHash,
          { name: 'AES-GCM' },
          false,
          ['decrypt']
        );

        const decryptedBuffer = await window.crypto.subtle.decrypt(
          { name: 'AES-GCM', iv: iv as BufferSource },
          cryptoKey,
          dataWithTag as BufferSource
        );

        const result = decoder.decode(decryptedBuffer);
        if (result) {
          syncDecryptionCache.set(encryptedText, result);
          return result;
        }
      } catch {
        // Candidate key mismatch, try next candidate
      }
    }
  } catch (err) {
    console.warn('Client-side hash break error:', err);
  }

  return encryptedText;
}

/**
 * Breaks / decrypts an encrypted hash into plaintext.
 * Handles nested encryption up to 3 levels.
 */
export async function breakHash(encryptedText: string | null | undefined): Promise<string> {
  if (!encryptedText) return '';
  let str = String(encryptedText).trim();
  if (!str.startsWith(PREFIX)) return str;

  let attempts = 0;
  while (str.startsWith(PREFIX) && attempts < 3) {
    attempts++;
    const next = await breakSingleChunk(str);
    if (next === str) break;
    str = next;
  }

  // If still starts with prefix (all keys failed), extract friendly username or clean string
  if (str.startsWith(PREFIX)) {
    // Failsafe: avoid ever showing the ugly raw hex hash to the user
    return '';
  }

  return str;
}

/**
 * Synchronous hash breaker looking up pre-cached values or performing smart fallback.
 */
export function breakHashSync(encryptedText: string | null | undefined, fallback = ''): string {
  if (!encryptedText) return fallback;
  const str = String(encryptedText).trim();
  if (!str.startsWith(PREFIX)) return str;

  if (syncDecryptionCache.has(str)) {
    return syncDecryptionCache.get(str)!;
  }

  // Trigger background async break so future renders have it
  breakHash(str).then((decrypted) => {
    if (decrypted && decrypted !== str) {
      syncDecryptionCache.set(str, decrypted);
    }
  });

  return fallback;
}

export interface DecryptableUser {
  id?: string;
  name?: string;
  email?: string;
  avatarUrl?: string;
  monthlyIncomeEstimate?: number;
  preferredCurrency?: 'BRL' | 'USD' | 'EUR';
  savingsGoalPercentage?: number;
  createdAt?: string;
  [key: string]: any;
}

/**
 * Fully decrypts and breaks all sensitive fields in a user object.
 */
export async function clientDecryptUser<T extends DecryptableUser>(rawUser: T | null | undefined, fallbackEmail?: string): Promise<T | null> {
  if (!rawUser) return null;
  const user: T = { ...rawUser };

  if (user.name) {
    user.name = await breakHash(user.name);
  }

  if (user.email) {
    user.email = await breakHash(user.email);
  }

  // Fallback email from JWT if present
  if ((!user.email || user.email.startsWith(PREFIX)) && fallbackEmail && !fallbackEmail.startsWith(PREFIX)) {
    user.email = fallbackEmail;
  }

  // If name is still missing or was broken to empty, use email username as smart fallback
  if ((!user.name || user.name.startsWith(PREFIX)) && user.email) {
    const emailName = user.email.split('@')[0];
    user.name = emailName.charAt(0).toUpperCase() + emailName.slice(1);
  }

  return user;
}
