"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Cloud, Loader2, Mail } from "lucide-react";
import { requestPasswordResetAction, type PasswordActionState } from "../actions";

export default function ForgotPasswordPage() {
  const [state, formAction, pending] = useActionState<PasswordActionState, FormData>(
    requestPasswordResetAction,
    {},
  );

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
          <h1 className="text-2xl font-bold tracking-tight">Lupa Password</h1>
          <p className="text-zinc-500 text-sm mt-2">Masukkan email akun untuk menerima tautan reset</p>
        </div>

        {state?.message && (
          <div
            role="status"
            aria-live="polite"
            className="mb-6 p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm font-medium"
          >
            {state.message}
          </div>
        )}

        <form action={formAction} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider" htmlFor="email">
              Email
            </label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                <Mail className="w-4 h-4" />
              </span>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                maxLength={254}
                placeholder="nama@email.com"
                required
                className="w-full pl-10 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/80 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-55 disabled:cursor-not-allowed"
          >
            {pending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Mengirim...
              </>
            ) : (
              <>
                Kirim Tautan Reset <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="text-center mt-8 text-sm">
          <Link href="/login" className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-400 font-medium transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali ke login
          </Link>
        </div>
      </div>
    </div>
  );
}
