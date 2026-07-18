import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Atur Ulang Password - TeleStorage",
  description: "Atur ulang password akun TeleStorage Anda.",
  robots: {
    index: false,
    follow: false,
  },
};

export default function ResetPasswordLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
