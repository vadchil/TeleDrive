import Link from "next/link";
import { Cloud } from "lucide-react";
import { ResetPasswordForm } from "./reset-password-form";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const query = await searchParams;
  const token = typeof query.token === "string" ? query.token : "";

  return (
    <div className="flex-grow flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-blue-600/5 blur-[120px] -z-10 pointer-events-none" />

      <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl relative">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-4 group justify-center">
            <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-2 rounded-xl text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
              <Cloud className="w-5 h-5" />
            </div>
            <span className="font-extrabold text-xl bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              TeleStorage
            </span>
          </Link>
          <h1 className="text-2xl font-bold tracking-tight">Atur Ulang Password</h1>
          <p className="text-zinc-500 text-sm mt-2">Buat password baru untuk akun Anda</p>
        </div>

        {token ? (
          <ResetPasswordForm token={token} />
        ) : (
          <div role="alert" className="text-center">
            <p className="text-red-400 font-medium">Tautan reset password tidak valid.</p>
            <Link href="/forgot-password" className="mt-6 inline-block text-blue-500 hover:text-blue-400 font-medium">
              Minta tautan baru
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
