"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signToken, getAuthUser } from "@/lib/auth";
import { encrypt, decrypt } from "@/lib/encryption";
import {
  sendTelegramOtp,
  verifyTelegramOtp,
  verifyTelegram2fa,
  createStorageChannel,
  deleteFileFromTelegram,
} from "@/lib/telegram";

// --- AUTH ACTIONS ---

export async function registerAction(prevState: any, formData: FormData) {
  const name = formData.get("name") as string;
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!name || !email || !password || !confirmPassword) {
    return { error: "Semua field harus diisi." };
  }

  if (password !== confirmPassword) {
    return { error: "Password konfirmasi tidak cocok." };
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return { error: "Email sudah terdaftar." };
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: "USER", // Default role
        status: "ACTIVE",
      },
    });

    const token = signToken({ userId: user.id, role: user.role });
    const cookieStore = await cookies();
    cookieStore.set("telestorage_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return { success: true };
  } catch (err) {
    console.error("Register error:", err);
    return { error: "Terjadi kesalahan saat pendaftaran." };
  }
}

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const rememberMe = formData.get("rememberMe") === "on";

  if (!email || !password) {
    return { error: "Email dan Password wajib diisi." };
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { error: "Email atau Password salah." };
    }

    if (user.status === "BANNED") {
      return { error: "Akun Anda telah dinonaktifkan oleh administrator." };
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return { error: "Email atau Password salah." };
    }

    const token = signToken({ userId: user.id, role: user.role });
    const cookieStore = await cookies();
    cookieStore.set("telestorage_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24, // 30 days or 1 day
      path: "/",
    });

    return { success: true };
  } catch (err) {
    console.error("Login error:", err);
    return { error: "Terjadi kesalahan saat masuk." };
  }
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("telestorage_session");
  revalidatePath("/");
}

// --- TELEGRAM FLOW ACTIONS ---

interface CookieState {
  phoneNumber: string;
  phoneCodeHash: string;
  tempSessionString: string;
  requires2fa?: boolean;
}

export async function sendTelegramOtpAction(phoneNumber: string) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  try {
    const { phoneCodeHash, tempSessionString } = await sendTelegramOtp(phoneNumber);

    const state: CookieState = {
      phoneNumber,
      phoneCodeHash,
      tempSessionString,
    };

    const encryptedState = encrypt(JSON.stringify(state));
    const cookieStore = await cookies();
    cookieStore.set("tele_login_state", encryptedState, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 15, // 15 mins
      path: "/",
    });

    return { success: true };
  } catch (err: any) {
    console.error("sendTelegramOtpAction error:", err);
    return { error: err.message || "Gagal mengirimkan kode OTP." };
  }
}

export async function verifyTelegramOtpAction(code: string) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const cookieStore = await cookies();
  const encryptedState = cookieStore.get("tele_login_state")?.value;
  if (!encryptedState) {
    return { error: "Sesi otentikasi Telegram kedaluwarsa. Silakan kirim OTP kembali." };
  }

  try {
    const state = JSON.parse(decrypt(encryptedState)) as CookieState;
    const { phoneNumber, phoneCodeHash, tempSessionString } = state;

    const { sessionString, requires2fa } = await verifyTelegramOtp(
      phoneNumber,
      phoneCodeHash,
      tempSessionString,
      code
    );

    if (requires2fa) {
      // Overwrite cookie state to flag 2FA
      const newState: CookieState = { ...state, requires2fa: true, tempSessionString: sessionString };
      cookieStore.set("tele_login_state", encrypt(JSON.stringify(newState)), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        maxAge: 60 * 15,
        path: "/",
      });
      return { success: true, requires2fa: true };
    }

    // Success! Save session
    cookieStore.delete("tele_login_state");

    const encryptedSession = encrypt(sessionString);
    const channelId = await createStorageChannel(sessionString);

    await prisma.telegramSession.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        phoneNumber,
        sessionString: encryptedSession,
        channelId,
      },
      update: {
        phoneNumber,
        sessionString: encryptedSession,
        channelId,
      },
    });

    revalidatePath("/dashboard");
    return { success: true, requires2fa: false };
  } catch (err: any) {
    console.error("verifyTelegramOtpAction error:", err);
    return { error: err.message || "Gagal memverifikasi OTP." };
  }
}

export async function verifyTelegram2faAction(password: string) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const cookieStore = await cookies();
  const encryptedState = cookieStore.get("tele_login_state")?.value;
  if (!encryptedState) {
    return { error: "Sesi otentikasi Telegram kedaluwarsa." };
  }

  try {
    const state = JSON.parse(decrypt(encryptedState)) as CookieState;
    const { phoneNumber, tempSessionString } = state;

    const { sessionString } = await verifyTelegram2fa(tempSessionString, password);

    cookieStore.delete("tele_login_state");

    const encryptedSession = encrypt(sessionString);
    const channelId = await createStorageChannel(sessionString);

    await prisma.telegramSession.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        phoneNumber,
        sessionString: encryptedSession,
        channelId,
      },
      update: {
        phoneNumber,
        sessionString: encryptedSession,
        channelId,
      },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("verifyTelegram2faAction error:", err);
    return { error: err.message || "Password 2FA salah." };
  }
}

export async function disconnectTelegramAction() {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  try {
    await prisma.telegramSession.delete({
      where: { userId: user.id },
    });
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("disconnectTelegramAction error:", err);
    return { error: err.message || "Gagal memutuskan integrasi Telegram." };
  }
}

// --- FILE ACTIONS ---

export async function renameFileAction(fileId: string, newFileName: string) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  if (!newFileName || newFileName.trim() === "") {
    return { error: "Nama file tidak boleh kosong." };
  }

  try {
    // Ensure ownership
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.userId !== user.id) {
      return { error: "File tidak ditemukan atau Anda tidak memiliki akses." };
    }

    await prisma.file.update({
      where: { id: fileId },
      data: { fileName: newFileName },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("renameFileAction error:", err);
    return { error: err.message || "Gagal mengubah nama file." };
  }
}

export async function deleteFileAction(fileId: string) {
  const user = await getAuthUser();
  if (!user || !user.telegramSession) return { error: "Unauthorized or Telegram not connected" };

  try {
    // Find file and check owner
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.userId !== user.id) {
      return { error: "File tidak ditemukan." };
    }

    const decryptedSession = decrypt(user.telegramSession.sessionString);

    // Delete in telegram
    await deleteFileFromTelegram(
      decryptedSession,
      user.telegramSession.channelId,
      file.telegramMsgId
    );

    // Delete in DB
    await prisma.file.delete({ where: { id: fileId } });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: any) {
    console.error("deleteFileAction error:", err);
    return { error: err.message || "Gagal menghapus file." };
  }
}

// --- ADMIN ACTIONS ---

export async function toggleUserStatusAction(userId: string) {
  const admin = await getAuthUser();
  if (!admin || admin.role !== "ADMIN") return { error: "Unauthorized admin access." };

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return { error: "User tidak ditemukan." };
    if (targetUser.id === admin.id) return { error: "Anda tidak dapat menonaktifkan akun sendiri." };

    const newStatus = targetUser.status === "ACTIVE" ? "BANNED" : "ACTIVE";

    await prisma.user.update({
      where: { id: userId },
      data: { status: newStatus },
    });

    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("toggleUserStatusAction error:", err);
    return { error: err.message || "Gagal mengubah status user." };
  }
}

export async function deleteUserAction(userId: string) {
  const admin = await getAuthUser();
  if (!admin || admin.role !== "ADMIN") return { error: "Unauthorized admin access." };

  try {
    const targetUser = await prisma.user.findUnique({ where: { id: userId } });
    if (!targetUser) return { error: "User tidak ditemukan." };
    if (targetUser.id === admin.id) return { error: "Anda tidak dapat menghapus akun sendiri." };

    await prisma.user.delete({ where: { id: userId } });

    revalidatePath("/admin");
    return { success: true };
  } catch (err: any) {
    console.error("deleteUserAction error:", err);
    return { error: err.message || "Gagal menghapus user." };
  }
}
