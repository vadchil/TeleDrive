"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Lock } from "lucide-react";
import { resetPasswordAction, type PasswordActionState } from "../actions";

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, formAction, pending] = useActionState<PasswordActionState, FormData>(
    resetPasswordAction,
    {},
  );

  if (state?.success) {
    return (
      <div role="status" aria-live="polite" className="text-center">
        <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-4" />
        <p className="text-green-400 font-medium">{state.message}</p>
        <Link
          href="/login"
          className="mt-6 inline-flex items-center gap-2 text-blue-500 hover:text-blue-400 font-medium transition-colors"
        >
          Masuk Sekarang <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <>
      {state?.error && (
        <div
          role="alert"
          className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-medium"
        >
          {state.error}
        </div>
      )}

      <form action={formAction} className="flex flex-col gap-5">
        <input type="hidden" name="token" value={token} />

        <div className="flex flex-col gap-1.5">
          <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider" htmlFor="password">
            Password Baru
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
              <Lock className="w-4 h-4" />
            </span>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              minLength={12}
              required
              className="w-full pl-10 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/80 transition-colors"
            />
          </div>
          <p className="text-xs text-zinc-600">Minimal 12 karakter, mengandung huruf dan angka.</p>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider" htmlFor="confirmPassword">
            Konfirmasi Password
          </label>
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
              <Lock className="w-4 h-4" />
            </span>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={12}
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
              <Loader2 className="w-4 h-4 animate-spin" /> Menyimpan...
            </>
          ) : (
            <>
              Simpan Password <ArrowRight className="w-4 h-4" />
            </>
          )}
        </button>
      </form>

      <div className="text-center mt-8 text-sm">
        <Link href="/login" className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-400 font-medium transition-colors">
          <ArrowLeft className="w-4 h-4" /> Kembali ke login
        </Link>
      </div>
    </>
  );
}
