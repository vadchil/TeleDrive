import assert from "node:assert/strict";
import test from "node:test";

try {
  process.loadEnvFile();
} catch {}

import {
  createResetToken,
  hashResetToken,
  isValidResetToken,
  normalizeEmail,
  validatePassword,
  sanitizeFileName,
} from "./password";
import { encrypt, decrypt } from "./encryption";

test("reset token memakai 256-bit raw token dan SHA-256 hash", () => {
  const { token, tokenHash } = createResetToken();

  assert.equal(token.length, 43);
  assert.equal(isValidResetToken(token), true);
  assert.equal(tokenHash.length, 64);
  assert.equal(tokenHash, hashResetToken(token));
  assert.notEqual(tokenHash, token);
});

test("validasi password menolak input lemah dan bcrypt overflow", () => {
  assert.equal(validatePassword("short1"), "Password minimal 12 karakter.");
  assert.equal(validatePassword("abcdefghijkl"), "Password harus mengandung huruf dan angka.");
  assert.equal(validatePassword(`${"a".repeat(72)}1`), "Password maksimal 72 byte.");
  assert.equal(validatePassword("password-kuat-123"), null);
});

test("email dinormalisasi", () => {
  assert.equal(normalizeEmail("  User@Example.COM "), "user@example.com");
  assert.equal(normalizeEmail(null), "");
});

test("nama file disanitasi", () => {
  assert.equal(sanitizeFileName("file/path/test.txt"), "file_path_test.txt");
  assert.equal(sanitizeFileName("..\\..\\etc\\passwd"), "etc_passwd");
  assert.equal(sanitizeFileName("  test..txt  "), "test..txt");
  assert.equal(sanitizeFileName(""), "unnamed_file");
  assert.equal(sanitizeFileName(".../test.txt"), "test.txt");
});

test("enkripsi dan dekripsi mendukung format baru (GCM) dan format lama (CBC)", () => {
  const plain = "rahasia-telegram-session-string-12345";

  // 1. GCM (Format Baru - 3 bagian)
  const encryptedGcm = encrypt(plain);
  assert.equal(encryptedGcm.split(":").length, 3);
  assert.equal(decrypt(encryptedGcm), plain);

  // 2. CBC (Format Lama - 2 bagian)
  // Meniru format enkripsi lama aes-256-cbc
  const crypto = require("crypto");
  const key = Buffer.concat([Buffer.from(process.env.ENCRYPTION_KEY!)], 32);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
  let oldEncrypted = cipher.update(plain, "utf8", "hex");
  oldEncrypted += cipher.final("hex");
  const legacyFormat = iv.toString("hex") + ":" + oldEncrypted;

  assert.equal(legacyFormat.split(":").length, 2);
  assert.equal(decrypt(legacyFormat), plain);

  // 3. Format Tidak Valid
  assert.throws(() => decrypt("hanya-satu-bagian"), /Invalid encrypted format/);
  assert.throws(() => decrypt("bagian1:bagian2:bagian3:bagian4"), /Invalid encrypted format/);
});


