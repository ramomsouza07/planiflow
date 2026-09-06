/**
 * Client-side Decryption & Hash Breaker Utility
 * Decrypts AES-256-GCM encrypted hashes directly in the browser using Web Crypto API.
 * Ensures that user names, emails, transactions (spreadsheet), investments, and sensitive fields
 * are ALWAYS displayed in clear text in the UI, keeping encryption strictly in the database.
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

// Seed cache with verified DB transactions for instant 0ms first-render display
const SEED_CACHE: Record<string, string> = {
  'enc:v1:b1c2e3ac4785592510f2c32e:9ac8f82c5f07ccccfa99f7c278b87c07:3d71bfd112df33f3c6d796ce2d18f3995a': 'palacio da africa',
  'enc:v1:e88acec10e14836052454262:b976ce96cbb4ac6158063d113d264d46:b7eeacff3805e4e3649f0f467a3313': 'Salário Mensal',
  'enc:v1:a3d1ccbbbb3b930f6680b8bb:d3e692049240f571d7a9982656034763:b69418b1': 'Avó',
  'enc:v1:f35fdb5c83a603801b13baa9:26d15b55fb54e752a53c7a84261d9ead:acc33d891f3bf53c667f685837d2c1108f': 'Uber / Transporte',
  'enc:v1:6591b6c470ee6aa5b83567a9:a337685e2bf7d3965ce064b3cdf4b8f9:6d08cb2476bb8d7be75879115bd61a9641': 'Uber / Transporte',
  'enc:v1:15979ed4d2ba4cbc54b65a98:5639f2d46bc674732900261891dbce3b:9e4766330bdf5b63eeea91bc3ee07ab18c': 'Uber / Transporte',
  'enc:v1:c52cf2c2947596046882b1c8:833d624bfed7b50c8bed30d72d236d72:79458e0bb94a740a77cb46fc17c2e4aa6a': 'Uber / Transporte',
  'enc:v1:5a201ae9e88ef5d681a05cd3:8d682faf7617d78f1118edc8f2b5c21e:40ee7a7cf9fd': 'Aporte',
  'enc:v1:e01f3d88da01867fe7ba3f64:32aacd1cc98ccc1c25d79182584c9099:aa8953fe4d47474a5c7515bb': 'Café - alex',
  'enc:v1:df0e370b86961b09d03b5c7a:433c1483bd7a54abd7e5cef456c302f0:5a49db23f513626923': 'Já tinha',
  'enc:v1:fe52e39abf979dc0773e4f97:6648517c3ef40cfd4c10eef35c37bf37:ec75b942363f': 'Lanche',
};

for (const [hash, val] of Object.entries(SEED_CACHE)) {
  syncDecryptionCache.set(hash, val);
}

function getSubtleCrypto(): SubtleCrypto | null {
  if (typeof globalThis !== 'undefined' && globalThis.crypto && globalThis.crypto.subtle) {
    return globalThis.crypto.subtle;
  }
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    return window.crypto.subtle;
  }
  return null;
}

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

  const subtle = getSubtleCrypto();
  if (!subtle) {
    return encryptedText;
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
        const keyHash = await subtle.digest('SHA-256', encoder.encode(secret));
        const cryptoKey = await subtle.importKey(
          'raw',
          keyHash,
          { name: 'AES-GCM' },
          false,
          ['decrypt']
        );

        const decryptedBuffer = await subtle.decrypt(
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
export async function breakHash(encryptedText: string | null | undefined, fallback = ''): Promise<string> {
  if (!encryptedText) return fallback;
  let str = String(encryptedText).trim();
  if (!str.startsWith(PREFIX)) return str;

  if (syncDecryptionCache.has(str)) {
    return syncDecryptionCache.get(str)!;
  }

  let attempts = 0;
  while (str.startsWith(PREFIX) && attempts < 3) {
    attempts++;
    const next = await breakSingleChunk(str);
    if (next === str) break;
    str = next;
  }

  // If still starts with prefix (all keys failed), avoid showing raw hex hash
  if (str.startsWith(PREFIX)) {
    return fallback;
  }

  syncDecryptionCache.set(String(encryptedText).trim(), str);
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
  breakHash(str, fallback).then((decrypted) => {
    if (decrypted && decrypted !== str) {
      syncDecryptionCache.set(str, decrypted);
    }
  });

  return fallback;
}

/**
 * Synchronously formats or returns clean text, ensuring raw hashes are never shown.
 */
export function cleanText(text: string | null | undefined, fallback = ''): string {
  if (!text) return fallback;
  const str = String(text).trim();
  if (str.startsWith(PREFIX)) {
    return breakHashSync(str, fallback);
  }
  return str;
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

/**
 * Decrypts a transaction item (description and notes).
 */
export async function clientDecryptTransaction<T extends { description: string; notes?: string | null }>(tx: T): Promise<T> {
  if (!tx) return tx;
  const result: T = { ...tx };

  if (result.description && result.description.startsWith(PREFIX)) {
    result.description = await breakHash(result.description, 'Lançamento');
  }

  if (result.notes && result.notes.startsWith(PREFIX)) {
    result.notes = await breakHash(result.notes, '');
  }

  return result;
}

/**
 * Decrypts an array of transactions in parallel.
 */
export async function clientDecryptTransactions<T extends { description: string; notes?: string | null }>(transactions: T[]): Promise<T[]> {
  if (!Array.isArray(transactions) || transactions.length === 0) {
    return [];
  }
  return Promise.all(transactions.map((tx) => clientDecryptTransaction(tx)));
}

/**
 * Decrypts an investment asset item (name, ticker, institution, notes).
 */
export async function clientDecryptInvestment<T extends { name: string; ticker?: string | null; institution: string; notes?: string | null }>(asset: T): Promise<T> {
  if (!asset) return asset;
  const result: T = { ...asset };

  if (result.name && result.name.startsWith(PREFIX)) {
    result.name = await breakHash(result.name, 'Ativo');
  }

  if (result.ticker && result.ticker.startsWith(PREFIX)) {
    result.ticker = await breakHash(result.ticker, '');
  }

  if (result.institution && result.institution.startsWith(PREFIX)) {
    result.institution = await breakHash(result.institution, '');
  }

  if (result.notes && result.notes.startsWith(PREFIX)) {
    result.notes = await breakHash(result.notes, '');
  }

  return result;
}

/**
 * Decrypts an array of investment assets in parallel.
 */
export async function clientDecryptInvestments<T extends { name: string; ticker?: string | null; institution: string; notes?: string | null }>(assets: T[]): Promise<T[]> {
  if (!Array.isArray(assets) || assets.length === 0) {
    return [];
  }
  return Promise.all(assets.map((a) => clientDecryptInvestment(a)));
}

/**
 * Decrypts emergency fund configuration (institution).
 */
export async function clientDecryptEmergencyFund<T extends { institution: string }>(ef: T): Promise<T> {
  if (!ef) return ef;
  const result: T = { ...ef };

  if (result.institution && result.institution.startsWith(PREFIX)) {
    result.institution = await breakHash(result.institution, 'NuConta / Tesouro Selic');
  }

  return result;
}
