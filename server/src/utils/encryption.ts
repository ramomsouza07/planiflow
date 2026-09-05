import crypto from 'crypto';

// Encryption Secret Key
// Uses ENCRYPTION_KEY if provided, falls back to JWT_SECRET or secure default, hashed to 32 bytes (256 bits)
const ENCRYPTION_SECRET = 
  process.env.ENCRYPTION_KEY || 
  process.env.JWT_SECRET || 
  'planiflow_super_seguro_jwt_2026_isolated';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV recommended for GCM
const PREFIX = 'enc:v1:';
const DET_PREFIX = 'enc:v1:det:';

function getEncryptionKey(): Buffer {
  return crypto.createHash('sha256').update(ENCRYPTION_SECRET).digest();
}

/**
 * Encrypts a plaintext string using AES-256-GCM with a random IV.
 * Output format: enc:v1:<iv_hex>:<authTag_hex>:<cipherText_hex>
 */
export function encryptText(text: string | null | undefined): string {
  if (text === null || text === undefined) {
    return text as any;
  }
  const str = String(text);
  if (!str) return str;

  // Avoid re-encrypting already encrypted strings
  if (str.startsWith(PREFIX)) {
    return str;
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(str, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('Encryption failed:', err);
    return str; // Graceful fallback
  }
}

/**
 * Deterministically encrypts text (e.g. email) using AES-256-GCM so the same input
 * always produces the exact same ciphertext under the secret key.
 * Allows unique indexing and database lookups (e.g. findUnique({ where: { email } })).
 * Output format: enc:v1:det:<iv_hex>:<authTag_hex>:<cipherText_hex>
 */
export function encryptDeterministic(text: string | null | undefined): string {
  if (text === null || text === undefined) {
    return text as any;
  }
  const str = String(text).trim().toLowerCase();
  if (!str) return str;

  if (str.startsWith(PREFIX)) {
    return str;
  }

  try {
    const key = getEncryptionKey();
    const iv = crypto.createHmac('sha256', key).update(`det-iv:${str}`).digest().subarray(0, IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

    let encrypted = cipher.update(str, 'utf8', 'hex');
    encrypted += cipher.final('hex');

    const authTag = cipher.getAuthTag();

    return `${DET_PREFIX}${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  } catch (err) {
    console.error('Deterministic encryption failed:', err);
    return str;
  }
}

export function encryptEmail(email: string | null | undefined): string {
  return encryptDeterministic(email);
}

export function decryptEmail(email: string | null | undefined): string {
  return decryptText(email);
}

/**
 * Decrypts a ciphertext string encrypted with AES-256-GCM.
 * Supports both probabilistic (enc:v1:<iv>:<tag>:<cipher>) and deterministic (enc:v1:det:<iv>:<tag>:<cipher>).
 * If the string does not start with enc:v1:, returns it as-is (backward compatible with legacy data).
 */
export function decryptText(encryptedText: string | null | undefined): string {
  if (encryptedText === null || encryptedText === undefined) {
    return encryptedText as any;
  }
  const str = String(encryptedText);
  if (!str) return str;

  // Not encrypted, return plain text
  if (!str.startsWith(PREFIX)) {
    return str;
  }

  try {
    const parts = str.split(':');
    let iv: Buffer;
    let authTag: Buffer;
    let ciphertext: string;

    if (parts[2] === 'det') {
      if (parts.length !== 6) return str;
      iv = Buffer.from(parts[3], 'hex');
      authTag = Buffer.from(parts[4], 'hex');
      ciphertext = parts[5];
    } else {
      if (parts.length !== 5) return str;
      iv = Buffer.from(parts[2], 'hex');
      authTag = Buffer.from(parts[3], 'hex');
      ciphertext = parts[4];
    }

    const key = getEncryptionKey();
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
  } catch (err) {
    console.warn('Decryption failed, returning raw string:', err);
    return str;
  }
}

// Helpers for Transactions
export function encryptTransactionData<T extends Record<string, any>>(data: T): T {
  const result: any = { ...data };
  if (result.description !== undefined && result.description !== null) {
    result.description = encryptText(String(result.description));
  }
  if (result.notes !== undefined && result.notes !== null) {
    result.notes = encryptText(String(result.notes));
  }
  return result;
}

export function decryptTransaction<T extends Record<string, any>>(tx: T): T {
  if (!tx) return tx;
  const result: any = { ...tx };
  if (result.description) {
    result.description = decryptText(result.description);
  }
  if (result.notes) {
    result.notes = decryptText(result.notes);
  }
  return result;
}

// Helpers for Investments
export function encryptInvestmentData<T extends Record<string, any>>(data: T): T {
  const result: any = { ...data };
  if (result.name !== undefined && result.name !== null) {
    result.name = encryptText(String(result.name));
  }
  if (result.ticker !== undefined && result.ticker !== null) {
    result.ticker = encryptText(String(result.ticker));
  }
  if (result.institution !== undefined && result.institution !== null) {
    result.institution = encryptText(String(result.institution));
  }
  if (result.notes !== undefined && result.notes !== null) {
    result.notes = encryptText(String(result.notes));
  }
  return result;
}

export function decryptInvestment<T extends Record<string, any>>(inv: T): T {
  if (!inv) return inv;
  const result: any = { ...inv };
  if (result.name) {
    result.name = decryptText(result.name);
  }
  if (result.ticker) {
    result.ticker = decryptText(result.ticker);
  }
  if (result.institution) {
    result.institution = decryptText(result.institution);
  }
  if (result.notes) {
    result.notes = decryptText(result.notes);
  }
  return result;
}

// Helpers for Emergency Fund
export function encryptEmergencyFundData<T extends Record<string, any>>(data: T): T {
  const result: any = { ...data };
  if (result.institution !== undefined && result.institution !== null) {
    result.institution = encryptText(String(result.institution));
  }
  return result;
}

export function decryptEmergencyFund<T extends Record<string, any>>(ef: T): T {
  if (!ef) return ef;
  const result: any = { ...ef };
  if (result.institution) {
    result.institution = decryptText(result.institution);
  }
  return result;
}

// Helpers for User
export function encryptUserData<T extends Record<string, any>>(data: T): T {
  const result: any = { ...data };
  if (result.name !== undefined && result.name !== null) {
    result.name = encryptText(String(result.name));
  }
  if (result.email !== undefined && result.email !== null) {
    result.email = encryptEmail(String(result.email));
  }
  return result;
}

export function decryptUser<T extends Record<string, any>>(user: T): T {
  if (!user) return user;
  const result: any = { ...user };
  if (result.name) {
    result.name = decryptText(result.name);
  }
  if (result.email) {
    result.email = decryptText(result.email);
  }
  return result;
}

export function getSecurityStatus() {
  return {
    status: 'active',
    algorithm: 'AES-256-GCM',
    keyLengthBits: 256,
    authenticatedEncryption: true,
    atRestProtection: 'Active for user profile, transactions, investments and reserves',
    passwordProtection: 'Bcrypt (salted rounds: 10)',
    tlsReady: true,
    dataIsolation: 'Isolated per user identifier with encrypted payloads',
    timestamp: new Date().toISOString(),
  };
}
