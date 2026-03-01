export type EncryptedBlob = {
  cipherText: string;
  iv: string;
  salt: string;
};

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function toBase64(buffer: ArrayBuffer) {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function fromBase64(input: string) {
  return Uint8Array.from(atob(input), (c) => c.charCodeAt(0));
}

export async function deriveKey(masterPassword: string, salt?: Uint8Array) {
  const localSalt = salt ?? crypto.getRandomValues(new Uint8Array(16));
  const baseKey = await crypto.subtle.importKey('raw', encoder.encode(masterPassword), 'PBKDF2', false, [
    'deriveKey'
  ]);

  const key = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: localSalt,
      iterations: 150000,
      hash: 'SHA-256'
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );

  return { key, salt: localSalt };
}

export async function encryptText(plainText: string, masterPassword: string): Promise<EncryptedBlob> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const { key, salt } = await deriveKey(masterPassword);
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoder.encode(plainText));

  return {
    cipherText: toBase64(cipherBuffer),
    iv: toBase64(iv.buffer),
    salt: toBase64(salt.buffer)
  };
}

export async function decryptText(payload: EncryptedBlob, masterPassword: string) {
  const salt = fromBase64(payload.salt);
  const iv = fromBase64(payload.iv);
  const { key } = await deriveKey(masterPassword, salt);
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    fromBase64(payload.cipherText)
  );
  return decoder.decode(decrypted);
}

export async function encryptFile(file: File, masterPassword: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const { key, salt } = await deriveKey(masterPassword);
  const content = await file.arrayBuffer();
  const cipherBuffer = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, content);

  return {
    blob: new Blob([cipherBuffer], { type: 'application/octet-stream' }),
    iv: toBase64(iv.buffer),
    salt: toBase64(salt.buffer)
  };
}
