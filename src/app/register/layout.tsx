import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Daftar - TeleStorage",
  description: "Buat akun baru TeleStorage.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function RegisterLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
