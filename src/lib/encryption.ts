import crypto from "crypto";

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  throw new Error("ENCRYPTION_KEY environment variable is not set.");
}

const derivedKey = crypto.scryptSync(ENCRYPTION_KEY, "glorydrive-salt-2026", 32);
const IV_LENGTH = 12; // Standard for AES-GCM

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv("aes-256-gcm", derivedKey, iv);

  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");

  return iv.toString("hex") + ":" + encrypted + ":" + authTag;
}

export function decrypt(text: string): string {
  const parts = text.split(":");
  if (parts.length !== 3) {
    throw new Error("Invalid encrypted format");
  }

  const iv = Buffer.from(parts[0], "hex");
  const encryptedText = Buffer.from(parts[1], "hex");
  const authTag = Buffer.from(parts[2], "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", derivedKey, iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, undefined, "utf8");
  decrypted += decipher.final("utf8");

  return decrypted;
}
