import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "telestorage-secret-32-char-key-!!"; // Fallback to default
const IV_LENGTH = 16; // AES block size

export function encrypt(text: string): string {
  // Ensure encryption key is 32 bytes for aes-256-cbc
  const key = Buffer.concat([Buffer.from(ENCRYPTION_KEY)], 32);
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  
  let encrypted = cipher.update(text, "utf8");
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  
  return iv.toString("hex") + ":" + encrypted.toString("hex");
}

export function decrypt(text: string): string {
  const key = Buffer.concat([Buffer.from(ENCRYPTION_KEY)], 32);
  const parts = text.split(":");
  if (parts.length !== 2) {
    throw new Error("Invalid encrypted format");
  }
  
  const iv = Buffer.from(parts.shift()!, "hex");
  const encryptedText = Buffer.from(parts.join(":"), "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  
  return decrypted.toString("utf8");
}
