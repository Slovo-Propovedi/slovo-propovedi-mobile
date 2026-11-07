/**
 * WebCrypto AES-GCM primitives for the web-only secure store.
 *
 * The key is generated as NON-extractable, so its raw bytes can never be read
 * back out of the browser — only encrypt/decrypt operations are possible.
 */

const IV_LENGTH_BYTES = 12
const AES_KEY_LENGTH_BITS = 256
const AES_ALGORITHM = 'AES-GCM'

export interface EncryptedEntry {
  cipher: ArrayBuffer
  iv: ArrayBuffer
}

export const isWebCryptoAvailable = () =>
  typeof crypto !== 'undefined' && typeof crypto.subtle !== 'undefined'

export const generateEncryptionKey = (): Promise<CryptoKey> =>
  crypto.subtle.generateKey({ length: AES_KEY_LENGTH_BITS, name: AES_ALGORITHM }, false, [
    'decrypt',
    'encrypt',
  ])

export const isCryptoKey = (value: unknown): value is CryptoKey => {
  if (typeof CryptoKey === 'undefined') return false

  return value instanceof CryptoKey
}

export const isEncryptedEntry = (value: unknown): value is EncryptedEntry => {
  if (!value || typeof value !== 'object') return false
  if (!('cipher' in value) || !('iv' in value)) return false

  return value.cipher instanceof ArrayBuffer && value.iv instanceof ArrayBuffer
}

export const encryptValue = async (value: string, key: CryptoKey): Promise<EncryptedEntry> => {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH_BYTES))
  const cipher = await crypto.subtle.encrypt(
    { iv, name: AES_ALGORITHM },
    key,
    new TextEncoder().encode(value),
  )

  return { cipher, iv: iv.buffer }
}

export const decryptValue = async (entry: EncryptedEntry, key: CryptoKey): Promise<string> => {
  const plain = await crypto.subtle.decrypt(
    { iv: entry.iv, name: AES_ALGORITHM },
    key,
    entry.cipher,
  )

  return new TextDecoder().decode(plain)
}
