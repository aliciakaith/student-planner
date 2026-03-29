// AES-256-GCM encryption for Canvas personal API tokens
// Tokens are encrypted before storage and decrypted server-side only in API routes

const ALGORITHM = "AES-GCM"
const KEY_LENGTH = 256
const IV_LENGTH = 12 // 96-bit IV for GCM

function getKeyMaterial(): Uint8Array {
  const key = process.env.CANVAS_TOKEN_ENCRYPTION_KEY
  if (!key) throw new Error("CANVAS_TOKEN_ENCRYPTION_KEY is not set")
  return Buffer.from(key, "base64")
}

async function importKey(raw: Uint8Array): Promise<CryptoKey> {
  return crypto.subtle.importKey("raw", raw, { name: ALGORITHM, length: KEY_LENGTH }, false, [
    "encrypt",
    "decrypt",
  ])
}

export async function encryptCanvasToken(token: string): Promise<string> {
  const keyMaterial = getKeyMaterial()
  const key = await importKey(keyMaterial)
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  const encoded = new TextEncoder().encode(token)

  const ciphertext = await crypto.subtle.encrypt({ name: ALGORITHM, iv }, key, encoded)

  // Store as base64(iv):base64(ciphertext)
  const ivB64 = Buffer.from(iv).toString("base64")
  const ctB64 = Buffer.from(ciphertext).toString("base64")
  return `${ivB64}:${ctB64}`
}

export async function decryptCanvasToken(encrypted: string): Promise<string> {
  const [ivB64, ctB64] = encrypted.split(":")
  if (!ivB64 || !ctB64) throw new Error("Invalid encrypted token format")

  const keyMaterial = getKeyMaterial()
  const key = await importKey(keyMaterial)
  const iv = Buffer.from(ivB64, "base64")
  const ciphertext = Buffer.from(ctB64, "base64")

  const plaintext = await crypto.subtle.decrypt({ name: ALGORITHM, iv }, key, ciphertext)
  return new TextDecoder().decode(plaintext)
}
