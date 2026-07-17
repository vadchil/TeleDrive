import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Dashboard - TeleStorage",
  description: "Kelola file Anda yang tersimpan di Telegram Cloud.",
};

export default async function DashboardPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/login");
  }

  // Fetch user files
  const files = await prisma.file.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
  });

  // Convert BigInt to number or string for safe serialization
  const serializedFiles = files.map((file) => ({
    id: file.id,
    fileName: file.fileName,
    fileSize: Number(file.fileSize), // Safe to convert since files on TG are <= 4GB
    mimeType: file.mimeType,
    telegramMsgId: file.telegramMsgId,
    createdAt: file.createdAt.toISOString(),
  }));

  const telegramSession = user.telegramSession
    ? {
        phoneNumber: user.telegramSession.phoneNumber,
        channelId: user.telegramSession.channelId || "me",
      }
    : null;

  return (
    <DashboardClient
      user={{ id: user.id, name: user.name, email: user.email, role: user.role }}
      telegramSession={telegramSession}
      initialFiles={serializedFiles}
    />
  );
}
