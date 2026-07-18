import crypto from "crypto";

if (!process.env.ENCRYPTION_KEY) {
  try {
    process.loadEnvFile();
  } catch {}
}

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
  if (parts.length === 3) {
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = Buffer.from(parts[1], "hex");
    const authTag = Buffer.from(parts[2], "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", derivedKey, iv);

    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encryptedText, undefined, "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } else if (parts.length === 2) {
    const key = Buffer.concat([Buffer.from(ENCRYPTION_KEY!)], 32);
    const iv = Buffer.from(parts[0], "hex");
    const encryptedText = Buffer.from(parts[1], "hex");
    const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);

    return decrypted.toString("utf8");
  } else {
    throw new Error("Invalid encrypted format");
  }
}
