import { encrypt, decrypt } from "../lib/encryption";
import { getTelegramClient } from "../lib/telegram";

process.loadEnvFile();

async function runTest() {
  console.log("=== TELESTORAGE TESTING SCRIPT ===");
  
  // 1. Test Encryption/Decryption
  console.log("\n1. Testing AES-256-CBC Session Encryption...");
  const dummySession = "1A2B3C4D5E6F7G8H9I0J_this_is_a_telegram_session_string_sample";
  const encrypted = encrypt(dummySession);
  const decrypted = decrypt(encrypted);

  console.log("Original session:", dummySession);
  console.log("Encrypted string:", encrypted);
  console.log("Decrypted string:", decrypted);

  if (decrypted === dummySession) {
    console.log("✅ Encryption & Decryption test PASSED!");
  } else {
    console.error("❌ Encryption & Decryption test FAILED!");
  }

  // 2. Test Client Initialization
  console.log("\n2. Testing teleproto TelegramClient instantiation...");
  try {
    const client = getTelegramClient("");
    console.log("Client created successfully.");
    console.log("Is connected (should be false since we haven't called connect):", client.connected);
    console.log("✅ teleproto Client initialization test PASSED!");
  } catch (err) {
    console.error("❌ teleproto Client initialization test FAILED!", err);
  }
}

runTest().catch(console.error);
