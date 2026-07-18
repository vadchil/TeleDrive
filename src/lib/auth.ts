import jwt, { type SignOptions } from "jsonwebtoken";
import { cookies } from "next/headers";
import { prisma } from "./db";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET wajib diisi.");
  return secret;
}

export interface SessionPayload {
  userId: string;
  role: string;
  sessionVersion?: number;
}

export function signToken(payload: SessionPayload, expiresIn: SignOptions["expiresIn"] = "7d"): string {
  return jwt.sign(payload, getJwtSecret(), { algorithm: "HS256", expiresIn });
}

export function verifyToken(token: string): SessionPayload | null {
  try {
    const payload = jwt.verify(token, getJwtSecret(), { algorithms: ["HS256"] });
    if (
      typeof payload === "string" ||
      typeof payload.userId !== "string" ||
      typeof payload.role !== "string" ||
      (payload.sessionVersion !== undefined && typeof payload.sessionVersion !== "number")
    ) {
      return null;
    }
    return {
      userId: payload.userId,
      role: payload.role,
      sessionVersion: payload.sessionVersion,
    };
  } catch {
    return null;
  }
}

export async function getAuthUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("telestorage_session")?.value;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: { telegramSession: true },
    });
    if (!user || user.status !== "ACTIVE" || user.sessionVersion !== (payload.sessionVersion ?? 0)) {
      return null;
    }
    return user;
  } catch (err) {
    console.error("Error fetching auth user:", err);
    return null;
  }
}
