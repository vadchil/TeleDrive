import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lupa Password - TeleStorage",
  description: "Minta tautan untuk mengatur ulang password akun TeleStorage Anda.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function ForgotPasswordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
