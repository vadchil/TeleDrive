import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import AdminClient from "./AdminClient";

export const metadata = {
  title: "Admin Dashboard - TeleStorage",
  description: "Manajemen pengguna dan statistik platform TeleStorage.",
};

export default async function AdminPage() {
  const admin = await getAuthUser();
  if (!admin || admin.role !== "ADMIN") {
    redirect("/dashboard");
  }

  // Fetch all users with files and sessions
  const users = await prisma.user.findMany({
    include: {
      files: true,
      telegramSession: true,
    },
    orderBy: { createdAt: "desc" },
  });

  const serializedUsers = users.map((u) => {
    const totalFiles = u.files.length;
    const totalSize = u.files.reduce((acc, curr) => acc + Number(curr.fileSize), 0);
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      status: u.status,
      telegramConnected: !!u.telegramSession,
      totalFiles,
      totalSize,
      createdAt: u.createdAt.toISOString(),
    };
  });

  return <AdminClient users={serializedUsers} currentAdminId={admin.id} />;
}
