/**
 * Crypto utility functions for secure data storage
 */

const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/**
 * Derives an encryption key from a password
 * @param {string} password - Password to derive key from
 * @param {Uint8Array} salt - Salt for key derivation
 * @returns {Promise<CryptoKey>} Derived key
 */
async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await window.crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    { name: "PBKDF2" },
    false,
    ["deriveBits", "deriveKey"]
  );

  return window.crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt,
      iterations: 100000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

/**
 * Encrypts data with a password
 * @param {string} data - Data to encrypt
 * @param {string} password - Password to encrypt with
 * @returns {Promise<string>} Encrypted data as base64 string
 */
async function encrypt(data, password) {
  const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = window.crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);
  
  const enc = new TextEncoder();
  const encrypted = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    enc.encode(data)
  );

  // Combine salt + iv + encrypted data
  const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + encrypted.byteLength);
  combined.set(salt, 0);
  combined.set(iv, SALT_LENGTH);
  combined.set(new Uint8Array(encrypted), SALT_LENGTH + IV_LENGTH);
  
  return btoa(String.fromCharCode(...combined));
}

/**
 * Decrypts data with a password
 * @param {string} encryptedData - Base64 encrypted data
 * @param {string} password - Password to decrypt with
 * @returns {Promise<string>} Decrypted data
 */
async function decrypt(encryptedData, password) {
  const combined = new Uint8Array(
    atob(encryptedData).split('').map(char => char.charCodeAt(0))
  );
  
  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const data = combined.slice(SALT_LENGTH + IV_LENGTH);
  
  const key = await deriveKey(password, salt);
  
  const decrypted = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    data
  );
  
  return new TextDecoder().decode(decrypted);
}

export { encrypt, decrypt };
