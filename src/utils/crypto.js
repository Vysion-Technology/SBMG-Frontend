// src/utils/crypto.js
import forge from 'node-forge';

/**
 * Encrypts a plaintext string using RSA-OAEP with a PEM public key.
 * Uses node-forge to bypass browser Secure Context (HTTPS) restrictions.
 * Returns a Base64 encoded string of the encrypted data.
 */
export async function rsaEncrypt(pemKey, plaintext) {
  try {
    // 1. Parse the PEM public key into a forge public key object
    const publicKey = forge.pki.publicKeyFromPem(pemKey);

    // 2. Encrypt using RSA-OAEP with SHA-256
    // The configuration matches standard Web Crypto API and Node.js defaults
    const encrypted = publicKey.encrypt(plaintext, 'RSA-OAEP', {
      md: forge.md.sha256.create(),
      mgf1: {
        md: forge.md.sha256.create()
      }
    });

    // 3. Convert the raw encrypted binary string to Base64
    return forge.util.encode64(encrypted);
    
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt credentials securely.");
  }
}