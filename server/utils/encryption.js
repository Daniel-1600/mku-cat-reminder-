import crypto from "crypto";

// Encryption configuration
const ALGORITHM = "aes-256-cbc";
const IV_LENGTH = 16;

// Get or generate a valid 32-byte encryption key
function getEncryptionKey() {
  const envKey = process.env.ENCRYPTION_KEY;

  if (!envKey) {
    // Generate a random key if none provided (not recommended for production)
    console.warn(
      "WARNING: No ENCRYPTION_KEY set. Using random key (data won't persist across restarts)"
    );
    return crypto.randomBytes(32);
  }

  // If key is already 32 bytes (64 hex chars), use it directly
  if (envKey.length === 64) {
    return Buffer.from(envKey, "hex");
  }

  // If key is 32 characters, use as-is
  if (envKey.length === 32) {
    return Buffer.from(envKey, "utf8");
  }

  // Otherwise, hash the key to get exactly 32 bytes
  return crypto.createHash("sha256").update(envKey).digest();
}

const ENCRYPTION_KEY = getEncryptionKey();

/**
 * Encrypt text using AES-256-CBC
 */
export function encrypt(text) {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);

  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

/**
 * Decrypt text using AES-256-CBC
 */
export function decrypt(text) {
  const textParts = text.split(":");
  const iv = Buffer.from(textParts.shift(), "hex");
  const encryptedText = Buffer.from(textParts.join(":"), "hex");

  const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);

  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString();
}
