import "server-only";

function requiredEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`${name} wajib diisi.`);
  return value;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const response = await fetch("https://send.api.mailtrap.io/api/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${requiredEnv("MAILTRAP_API_TOKEN")}`,
      "Content-Type": "application/json",
      "User-Agent": "TeleStorage/0.1",
    },
    body: JSON.stringify({
      from: {
        email: requiredEnv("MAILTRAP_FROM_EMAIL"),
        name: process.env.MAILTRAP_FROM_NAME?.trim() || "TeleStorage",
      },
      to: [{ email: to }],
      subject: "Reset password TeleStorage",
      text: `Gunakan tautan ini untuk mengatur ulang password Anda dalam 30 menit: ${resetUrl}\n\nJika Anda tidak meminta reset password, abaikan email ini.`,
      html: `<p>Kami menerima permintaan reset password TeleStorage.</p><p><a href="${escapeHtml(resetUrl)}">Atur ulang password</a></p><p>Tautan berlaku selama 30 menit. Jika Anda tidak meminta reset password, abaikan email ini.</p>`,
      category: "password_reset",
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) throw new Error(`Mailtrap gagal dengan status ${response.status}.`);
}
