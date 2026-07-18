"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import bcrypt from "bcrypt";
import { prisma } from "@/lib/db";
import { signToken, getAuthUser } from "@/lib/auth";
import { sendPasswordResetEmail } from "@/lib/mailtrap";
import {
  createResetToken,
  hashResetToken,
  isValidResetToken,
  normalizeEmail,
  RESET_TOKEN_TTL_MS,
  validatePassword,
  sanitizeFileName,
} from "@/lib/password";
import { encrypt, decrypt } from "@/lib/encryption";
import {
  sendTelegramOtp,
  verifyTelegramOtp,
  verifyTelegram2fa,
  createStorageChannel,
  deleteFileFromTelegram,
} from "@/lib/telegram";
import { rateLimit } from "@/lib/rate-limit";

// --- AUTH ACTIONS ---

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

export async function registerAction(_prevState: unknown, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const ratelimit = await rateLimit("register", 5, 60_000 * 15); // 5 registers per 15 mins
  if (!ratelimit.success) {
    return { error: "Terlalu banyak percobaan pendaftaran. Silakan coba lagi nanti." };
  }

  if (!name || !email || !password || !confirmPassword) {
    return { error: "Semua field harus diisi." };
  }

  if (password !== confirmPassword) {
    return { error: "Password konfirmasi tidak cocok." };
  }

  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };

  try {
    const existing = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
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

    const token = signToken({ userId: user.id, role: user.role, sessionVersion: user.sessionVersion });
    const cookieStore = await cookies();
    cookieStore.set("telestorage_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return { success: true };
  } catch (err) {
    console.error("Register error:", err);
    return { error: "Terjadi kesalahan saat pendaftaran." };
  }
}

export async function loginAction(_prevState: unknown, formData: FormData) {
  const email = normalizeEmail(formData.get("email"));
  const password = String(formData.get("password") ?? "");
  const rememberMe = formData.get("rememberMe") === "on";

  const ratelimit = await rateLimit("login", 10, 60_000 * 5); // 10 logins per 5 mins
  if (!ratelimit.success) {
    return { error: "Terlalu banyak percobaan masuk. Silakan coba lagi nanti." };
  }

  if (!email || !password) {
    return { error: "Email dan Password wajib diisi." };
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
    });
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

    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24;
    const token = signToken(
      { userId: user.id, role: user.role, sessionVersion: user.sessionVersion },
      maxAge,
    );
    const cookieStore = await cookies();
    cookieStore.set("telestorage_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
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
  cookieStore.delete("tele_login_state");
  revalidatePath("/");
}

const RESET_REQUEST_MESSAGE =
  "Jika email tersebut terdaftar, kami telah mengirim tautan reset password.";

export type PasswordActionState = {
  error?: string;
  success?: boolean;
  message?: string;
};

export async function requestPasswordResetAction(
  _prevState: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  const ratelimit = await rateLimit("forgot-password", 3, 60_000 * 15); // 3 requests per 15 mins
  if (!ratelimit.success) {
    return { success: true, message: RESET_REQUEST_MESSAGE };
  }

  const email = normalizeEmail(formData.get("email"));
  if (!/^\S+@\S+\.\S+$/.test(email) || email.length > 254) {
    return { success: true, message: RESET_REQUEST_MESSAGE };
  }

  try {
    const user = await prisma.user.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true, email: true, status: true },
    });
    if (!user || user.status !== "ACTIVE") {
      return { success: true, message: RESET_REQUEST_MESSAGE };
    }

    const cooldownStartedAt = new Date(Date.now() - 60_000);
    const { token, tokenHash } = createResetToken();
    const tokenStored = await prisma.$transaction(async (tx) => {
      const existingToken = await tx.passwordResetToken.findUnique({
        where: { userId: user.id },
        select: { createdAt: true },
      });
      if (existingToken && existingToken.createdAt > cooldownStartedAt) return false;

      await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
      await tx.passwordResetToken.create({
        data: {
          tokenHash,
          userId: user.id,
          expiresAt: new Date(Date.now() + RESET_TOKEN_TTL_MS),
        },
      });
      return true;
    });
    if (!tokenStored) return { success: true, message: RESET_REQUEST_MESSAGE };

    const appUrlValue = process.env.APP_URL?.trim();
    if (!appUrlValue) throw new Error("APP_URL wajib diisi.");
    const appUrl = new URL(appUrlValue);
    appUrl.pathname = "/reset-password";
    appUrl.search = new URLSearchParams({ token }).toString();

    try {
      await sendPasswordResetEmail(user.email, appUrl.toString());
    } catch (error) {
      // ponytail: synchronous delivery only; add a durable queue when email volume requires retries.
      console.error("Password reset email failed:", error);
    }
  } catch (error) {
    console.error("Password reset request failed:", error);
  }

  return { success: true, message: RESET_REQUEST_MESSAGE };
}

export async function resetPasswordAction(
  _prevState: PasswordActionState,
  formData: FormData,
): Promise<PasswordActionState> {
  const token = String(formData.get("token") ?? "");
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const ratelimit = await rateLimit("reset-password", 5, 60_000 * 15); // 5 attempts per 15 mins
  if (!ratelimit.success) {
    return { error: "Terlalu banyak percobaan reset password. Silakan coba lagi nanti." };
  }

  if (!isValidResetToken(token)) {
    return { error: "Tautan reset password tidak valid atau sudah kedaluwarsa." };
  }
  if (password !== confirmPassword) {
    return { error: "Password konfirmasi tidak cocok." };
  }
  const passwordError = validatePassword(password);
  if (passwordError) return { error: passwordError };

  const passwordHash = await bcrypt.hash(password, 10);
  const tokenHash = hashResetToken(token);

  try {
    await prisma.$transaction(async (tx) => {
      const reset = await tx.passwordResetToken.findUnique({
        where: { tokenHash },
        select: { userId: true },
      });
      if (!reset) throw new Error("INVALID_RESET_TOKEN");

      const claimed = await tx.passwordResetToken.deleteMany({
        where: { tokenHash, expiresAt: { gt: new Date() } },
      });
      if (claimed.count !== 1) throw new Error("INVALID_RESET_TOKEN");

      await tx.user.update({
        where: { id: reset.userId },
        data: {
          password: passwordHash,
          sessionVersion: { increment: 1 },
        },
      });
      await tx.passwordResetToken.deleteMany({ where: { userId: reset.userId } });
    });
  } catch (error) {
    if (
      (error instanceof Error && error.message === "INVALID_RESET_TOKEN") ||
      (typeof error === "object" && error !== null && "code" in error && error.code === "P2025")
    ) {
      return { error: "Tautan reset password tidak valid atau sudah kedaluwarsa." };
    }
    console.error("Password reset failed:", error);
    return { error: "Password belum dapat diubah. Silakan coba lagi." };
  }

  const cookieStore = await cookies();
  cookieStore.delete("telestorage_session");
  return { success: true, message: "Password berhasil diubah. Silakan masuk kembali." };
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

  const ratelimit = await rateLimit("telegram-otp", 3, 60_000 * 10); // 3 requests per 10 mins
  if (!ratelimit.success) {
    return { error: "Terlalu banyak permintaan OTP. Silakan coba lagi nanti." };
  }

  try {
    const { phoneCodeHash, tempSessionString } = await sendTelegramOtp(phoneNumber);

    const state: CookieState & { userId: string } = {
      userId: user.id,
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
  } catch (err: unknown) {
    console.error("sendTelegramOtpAction error:", err);
    const cookieStore = await cookies();
    cookieStore.delete("tele_login_state");
    return { error: errorMessage(err, "Gagal mengirimkan kode OTP.") };
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
    const state = JSON.parse(decrypt(encryptedState)) as CookieState & { userId?: string };
    if (state.userId && state.userId !== user.id) {
      cookieStore.delete("tele_login_state");
      return { error: "Sesi otentikasi tidak valid." };
    }
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
  } catch (err: unknown) {
    console.error("verifyTelegramOtpAction error:", err);
    cookieStore.delete("tele_login_state");
    return { error: errorMessage(err, "Gagal memverifikasi OTP.") };
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
    const state = JSON.parse(decrypt(encryptedState)) as CookieState & { userId?: string };
    if (state.userId && state.userId !== user.id) {
      cookieStore.delete("tele_login_state");
      return { error: "Sesi otentikasi tidak valid." };
    }
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
  } catch (err: unknown) {
    console.error("verifyTelegram2faAction error:", err);
    cookieStore.delete("tele_login_state");
    return { error: errorMessage(err, "Password 2FA salah.") };
  }
}

export async function disconnectTelegramAction() {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  try {
    await prisma.telegramSession.delete({
      where: { userId: user.id },
    });
    const cookieStore = await cookies();
    cookieStore.delete("tele_login_state");
    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    console.error("disconnectTelegramAction error:", err);
    return { error: errorMessage(err, "Gagal memutuskan integrasi Telegram.") };
  }
}

// --- FILE ACTIONS ---

export async function renameFileAction(fileId: string, newFileName: string) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  if (!newFileName || newFileName.trim() === "") {
    return { error: "Nama file tidak boleh kosong." };
  }

  const cleanFileName = sanitizeFileName(newFileName);

  try {
    // Ensure ownership
    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file || file.userId !== user.id) {
      return { error: "File tidak ditemukan atau Anda tidak memiliki akses." };
    }

    await prisma.file.update({
      where: { id: fileId },
      data: { fileName: cleanFileName },
    });

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err: unknown) {
    console.error("renameFileAction error:", err);
    return { error: errorMessage(err, "Gagal mengubah nama file.") };
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
  } catch (err: unknown) {
    console.error("deleteFileAction error:", err);
    return { error: errorMessage(err, "Gagal menghapus file.") };
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
  } catch (err: unknown) {
    console.error("toggleUserStatusAction error:", err);
    return { error: errorMessage(err, "Gagal mengubah status user.") };
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
  } catch (err: unknown) {
    console.error("deleteUserAction error:", err);
    return { error: errorMessage(err, "Gagal menghapus user.") };
  }
}
