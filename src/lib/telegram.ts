import { TelegramClient, Api } from "teleproto";
import { StringSession } from "teleproto/sessions";
import { computeCheck } from "teleproto/Password";

try {
  process.loadEnvFile();
} catch {}

const apiId = parseInt(process.env.TELEGRAM_API_ID || "0", 10);
const apiHash = process.env.TELEGRAM_API_HASH || "";

if (!apiId || !apiHash) {
  console.warn("WARNING: TELEGRAM_API_ID or TELEGRAM_API_HASH is not set in .env");
}

// Instantiate Telegram Client
export function getTelegramClient(sessionString = ""): TelegramClient {
  const session = new StringSession(sessionString);
  return new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });
}

// 1. Send OTP
export async function sendTelegramOtp(phoneNumber: string): Promise<{ phoneCodeHash: string; tempSessionString: string }> {
  const client = getTelegramClient("");
  await client.connect();
  const result = await client.sendCode({ apiId, apiHash }, phoneNumber);
  const tempSessionString = (client.session as any).save() as string;
  return {
    phoneCodeHash: result.phoneCodeHash,
    tempSessionString,
  };
}

// 2. Verify OTP
export async function verifyTelegramOtp(
  phoneNumber: string,
  phoneCodeHash: string,
  tempSessionString: string,
  phoneCode: string
): Promise<{ sessionString: string; requires2fa: boolean }> {
  const client = getTelegramClient(tempSessionString);
  await client.connect();
  try {
    await client.invoke(
      new Api.auth.SignIn({
        phoneNumber,
        phoneCodeHash,
        phoneCode,
      })
    );
    const sessionString = (client.session as any).save() as string;
    return { sessionString, requires2fa: false };
  } catch (err: any) {
    if (err.errorMessage === "SESSION_PASSWORD_NEEDED") {
      return { sessionString: tempSessionString, requires2fa: true };
    }
    throw err;
  }
}

// 3. Verify 2FA
export async function verifyTelegram2fa(
  tempSessionString: string,
  password: string
): Promise<{ sessionString: string }> {
  const client = getTelegramClient(tempSessionString);
  await client.connect();
  const passwordSrpResult = await client.invoke(new Api.account.GetPassword());
  const passwordSrpCheck = await computeCheck(passwordSrpResult, password);
  await client.invoke(
    new Api.auth.CheckPassword({
      password: passwordSrpCheck,
    })
  );
  const sessionString = (client.session as any).save() as string;
  return { sessionString };
}

// 4. Create Private Storage Channel (fallback to saved messages "me")
export async function createStorageChannel(sessionString: string): Promise<string> {
  const client = getTelegramClient(sessionString);
  await client.connect();
  try {
    const result = await client.invoke(
      new Api.channels.CreateChannel({
        title: "TeleStorage Files",
        about: "Penyimpanan file terenkripsi dari akun TeleStorage Anda.",
        broadcast: true,
      })
    );
    if (result && "chats" in result && result.chats && result.chats.length > 0) {
      const chat = result.chats[0];
      const rawId = chat.id.toString();
      return rawId.startsWith("-100") ? rawId : (rawId.startsWith("-") ? `-100${rawId.slice(1)}` : `-100${rawId}`);
    }
    return "me";
  } catch (err) {
    console.error("Failed to create channel, falling back to me (Saved Messages):", err);
    return "me";
  }
}

// Helper to resolve entity/peer
async function getTelegramPeer(client: TelegramClient, channelId: string | null) {
  if (!channelId || channelId === "me") {
    return "me";
  }
  try {
    let peerId = channelId;
    if (/^\d+$/.test(peerId)) {
      peerId = `-100${peerId}`;
    } else if (peerId.startsWith("-") && !peerId.startsWith("-100")) {
      peerId = `-100${peerId.slice(1)}`;
    }
    return await client.getEntity(peerId);
  } catch (err) {
    console.error("Failed to get channel entity, falling back to me:", err);
    return "me";
  }
}

// 5. Upload file
export async function uploadFileToTelegram(
  sessionString: string,
  channelId: string | null,
  fileBuffer: Buffer,
  fileName: string
): Promise<number> {
  const client = getTelegramClient(sessionString);
  await client.connect();
  const peer = await getTelegramPeer(client, channelId);

  // Attach a name property to Buffer so teleproto knows the filename
  const fileObj = Buffer.from(fileBuffer);
  Object.defineProperty(fileObj, "name", {
    value: fileName,
    writable: false,
  });

  const message = await client.sendFile(peer, {
    file: fileObj,
    forceDocument: true,
  });

  return message.id;
}

// 6. Download file
export async function downloadFileFromTelegram(
  sessionString: string,
  channelId: string | null,
  msgId: number
): Promise<{ fileBuffer: Buffer; fileName: string; mimeType: string }> {
  const client = getTelegramClient(sessionString);
  await client.connect();
  const peer = await getTelegramPeer(client, channelId);

  const messages = await client.getMessages(peer, { ids: [msgId] });
  if (!messages || messages.length === 0) {
    throw new Error("Message not found in Telegram");
  }

  const msg = messages[0];
  if (!msg.media) {
    throw new Error("Message contains no media");
  }

  const result = await client.downloadMedia(msg, {});
  if (!result || !(result instanceof Buffer)) {
    throw new Error("Failed to download media as Buffer");
  }

  let fileName = "file";
  let mimeType = "application/octet-stream";

  const media = msg.media as any;
  if (media.document) {
    mimeType = media.document.mimeType || mimeType;
    if (media.document.attributes) {
      for (const attr of media.document.attributes) {
        if (attr.className === "DocumentAttributeFilename" || attr.fileName) {
          fileName = attr.fileName || fileName;
          break;
        }
      }
    }
  }

  return {
    fileBuffer: result,
    fileName,
    mimeType,
  };
}

// 7. Delete file
export async function deleteFileFromTelegram(
  sessionString: string,
  channelId: string | null,
  msgId: number
): Promise<boolean> {
  const client = getTelegramClient(sessionString);
  await client.connect();
  const peer = await getTelegramPeer(client, channelId);
  try {
    await client.deleteMessages(peer, [msgId], { revoke: true });
    return true;
  } catch (err) {
    console.error("Failed to delete message in Telegram:", err);
    return false;
  }
}
