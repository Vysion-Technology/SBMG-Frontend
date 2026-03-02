// src/utils/crypto.js

/**
 * Encrypts a plaintext string using RSA-OAEP with a PEM public key.
 * Returns a Base64 encoded string of the encrypted data.
 */
export async function rsaEncrypt(pemKey, plaintext) {
  try {
    // 1. Strip the PEM header, footer, and newlines to get the raw base64 string
    const pemContents = pemKey
      .replace(/-----BEGIN PUBLIC KEY-----/, '')
      .replace(/-----END PUBLIC KEY-----/, '')
      .replace(/\s+/g, '');

    // 2. Convert base64 string to an ArrayBuffer
    const binaryDerString = window.atob(pemContents);
    const binaryDer = new Uint8Array(binaryDerString.length);
    for (let i = 0; i < binaryDerString.length; i++) {
      binaryDer[i] = binaryDerString.charCodeAt(i);
    }

    // 3. Import the ArrayBuffer into a Web Crypto API CryptoKey object
    const publicKey = await window.crypto.subtle.importKey(
      "spki",
      binaryDer.buffer,
      { name: "RSA-OAEP", hash: "SHA-256" },
      true, // extractable
      ["encrypt"]
    );

    // 4. Encode the plaintext string into a Uint8Array
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(plaintext);

    // 5. Encrypt the data
    const encryptedBuffer = await window.crypto.subtle.encrypt(
      { name: "RSA-OAEP" },
      publicKey,
      encodedData
    );

    // 6. Convert the encrypted ArrayBuffer back to a Base64 string to send in JSON
    const encryptedArray = new Uint8Array(encryptedBuffer);
    return window.btoa(String.fromCharCode(...encryptedArray));
  } catch (error) {
    console.error("Encryption failed:", error);
    throw new Error("Failed to encrypt credentials securely.");
  }
}