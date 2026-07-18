import assert from "node:assert/strict";
import test from "node:test";
import {
  createResetToken,
  hashResetToken,
  isValidResetToken,
  normalizeEmail,
  validatePassword,
  sanitizeFileName,
} from "./password";

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

