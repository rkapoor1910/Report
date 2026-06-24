import crypto from 'crypto'

/**
 * VaultService
 * Encrypts and decrypts connector credentials using AES-256-GCM.
 * The encryption key comes from ENCRYPTION_KEY env var (32 chars).
 * Credentials are NEVER stored in plain text — only the encrypted blob
 * goes into the database column `encrypted_creds`.
 */

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12   // 96-bit IV recommended for GCM
const TAG_LENGTH = 16  // 128-bit auth tag

function getKey(): Buffer {
  const key = process.env.ENCRYPTION_KEY
  if (!key || key.length < 32) {
    throw new Error('ENCRYPTION_KEY must be at least 32 characters')
  }
  return Buffer.from(key.slice(0, 32), 'utf8')
}

/**
 * Encrypt a credentials object → base64 string safe for DB storage.
 * Format: base64(iv + authTag + ciphertext)
 */
export function encryptCredentials(credentials: Record<string, string>): string {
  const key = getKey()
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv) as crypto.CipherGCM

  const plaintext = JSON.stringify(credentials)
  const encrypted = Buffer.concat([
    cipher.update(plaintext, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()

  // Pack: iv (12) + authTag (16) + ciphertext
  const payload = Buffer.concat([iv, authTag, encrypted])
  return payload.toString('base64')
}

/**
 * Decrypt a stored base64 blob → original credentials object.
 */
export function decryptCredentials(encrypted: string): Record<string, string> {
  const key = getKey()
  const payload = Buffer.from(encrypted, 'base64')

  const iv      = payload.subarray(0, IV_LENGTH)
  const authTag = payload.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
  const ciphertext = payload.subarray(IV_LENGTH + TAG_LENGTH)

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv) as crypto.DecipherGCM
  decipher.setAuthTag(authTag)

  const decrypted = Buffer.concat([
    decipher.update(ciphertext),
    decipher.final(),
  ])
  return JSON.parse(decrypted.toString('utf8'))
}

/**
 * Mask a credential value for safe logging/display.
 * e.g. "sk-ant-abc123" → "sk-ant-****23"
 */
export function maskSecret(value: string): string {
  if (value.length <= 6) return '****'
  return value.slice(0, 4) + '****' + value.slice(-2)
}

/**
 * Mask all values in a credentials object for safe display.
 */
export function maskCredentials(
  credentials: Record<string, string>
): Record<string, string> {
  return Object.fromEntries(
    Object.entries(credentials).map(([k, v]) => [k, maskSecret(v)])
  )
}
