import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Masuk - TeleStorage",
  description: "Masuk ke akun TeleStorage Anda.",
  robots: {
    index: false,
    follow: true,
  },
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
