import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { uploadFileToTelegram } from "@/lib/telegram";
import { sanitizeFileName } from "@/lib/password";

export async function POST(req: NextRequest) {
  const user = await getAuthUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!user.telegramSession) {
    return NextResponse.json(
      { error: "Telegram tidak terhubung. Hubungkan Telegram terlebih dahulu." },
      { status: 400 }
    );
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "File tidak ditemukan dalam request." }, { status: 400 });
    }

    const fileName = sanitizeFileName(file.name);
    const fileSize = file.size;
    const mimeType = file.type || "application/octet-stream";

    // Read file bytes
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    // Decrypt Telegram session
    const decryptedSession = decrypt(user.telegramSession.sessionString);

    // Upload to Telegram
    const telegramMsgId = await uploadFileToTelegram(
      decryptedSession,
      user.telegramSession.channelId,
      fileBuffer,
      fileName
    );

    // Save to Database
    const dbFile = await prisma.file.create({
      data: {
        userId: user.id,
        fileName,
        fileSize: BigInt(fileSize), // Using BigInt in Prisma schema
        mimeType,
        telegramMsgId,
      },
    });

    const serializedFile = {
      id: dbFile.id,
      fileName: dbFile.fileName,
      fileSize: Number(dbFile.fileSize),
      mimeType: dbFile.mimeType,
      telegramMsgId: dbFile.telegramMsgId,
      createdAt: dbFile.createdAt.toISOString(),
    };

    return NextResponse.json({ success: true, file: serializedFile });
  } catch (err: unknown) {
    console.error("Upload route error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan saat mengupload file.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
