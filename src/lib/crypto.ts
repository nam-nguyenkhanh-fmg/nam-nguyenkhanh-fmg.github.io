const IV_BYTES = 12;

export async function deriveKeyFromPRF(
  prfOutput: ArrayBuffer,
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    prfOutput,
    'HKDF',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new Uint8Array(0),
      info: new TextEncoder().encode('fmg-vault-prf'),
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  );
}

export async function encryptData(
  key: CryptoKey,
  plaintext: string,
): Promise<{ iv: Uint8Array; ciphertext: ArrayBuffer }> {
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    new TextEncoder().encode(plaintext),
  );
  return { iv, ciphertext };
}

export async function decryptData(
  key: CryptoKey,
  iv: Uint8Array,
  ciphertext: ArrayBuffer,
): Promise<string> {
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: iv as BufferSource },
    key,
    ciphertext,
  );
  return new TextDecoder().decode(plaintext);
}
