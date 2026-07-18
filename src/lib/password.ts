import { createHash, randomBytes } from "node:crypto";

export const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;
export const RESET_TOKEN_PATTERN = /^[A-Za-z0-9_-]{43}$/;

export function normalizeEmail(value: FormDataEntryValue | null): string {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

export function validatePassword(password: string): string | null {
  if (password.length < 12) return "Password minimal 12 karakter.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
    return "Password harus mengandung huruf dan angka.";
  }
  if (Buffer.byteLength(password, "utf8") > 72) {
    return "Password maksimal 72 byte.";
  }
  return null;
}

export function createResetToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString("base64url");
  return { token, tokenHash: hashResetToken(token) };
}

export function hashResetToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function isValidResetToken(token: string): boolean {
  return RESET_TOKEN_PATTERN.test(token);
}

export function sanitizeFileName(name: string): string {
  // Remove non-printable and control characters
  let clean = name.replace(/[\x00-\x1F\x7F]/g, "");
  // Replace slashes/backslashes with underscores
  clean = clean.replace(/[/\\]/g, "_");
  // Trim spaces
  clean = clean.trim();
  // Strip leading and trailing dots and underscores repeatedly until clean
  while (/^[_.]+|[_.]+$/g.test(clean)) {
    clean = clean.replace(/^[_.]+|[_.]+$/g, "");
  }
  // Limit length to 255 chars
  return clean ? clean.slice(0, 255) : "unnamed_file";
}
