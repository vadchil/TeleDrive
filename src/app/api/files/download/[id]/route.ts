import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/encryption";
import { downloadFileFromTelegram } from "@/lib/telegram";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getAuthUser();
  if (!user) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const { id: fileId } = await params;

  try {
    // Fetch file from database
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      return new NextResponse("File tidak ditemukan", { status: 404 });
    }

    // Ensure ownership or admin access
    if (file.userId !== user.id && user.role !== "ADMIN") {
      return new NextResponse("Forbidden", { status: 403 });
    }

    // Get Telegram session of the file owner (which is the user itself, or if admin is downloading, we must get the owner's session)
    const ownerSession = await prisma.telegramSession.findUnique({
      where: { userId: file.userId },
    });

    if (!ownerSession) {
      return new NextResponse("Telegram owner session tidak ditemukan", { status: 400 });
    }

    const decryptedSession = decrypt(ownerSession.sessionString);

    // Download from Telegram
    const { fileBuffer, fileName, mimeType } = await downloadFileFromTelegram(
      decryptedSession,
      ownerSession.channelId,
      file.telegramMsgId
    );

    // Set Response Headers for download
    const headers = new Headers();
    headers.set("Content-Type", mimeType);
    headers.set("Content-Disposition", `attachment; filename="${encodeURIComponent(fileName)}"`);
    headers.set("Content-Length", fileBuffer.length.toString());

    return new NextResponse(new Uint8Array(fileBuffer), {
      status: 200,
      headers,
    });
  } catch (err: unknown) {
    console.error("Download route error:", err);
    const message = err instanceof Error ? err.message : "Gagal mengunduh file";
    return new NextResponse(message, { status: 500 });
  }
}
