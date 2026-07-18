import Link from "next/link";
import { getAuthUser } from "@/lib/auth";
import { Cloud, Shield, Zap, HardDrive, ArrowRight, Check } from "lucide-react";

export const metadata = {
  title: "TeleStorage - Cloud Storage Berbasis Telegram",
  description: "Platform Cloud Storage SaaS berkecepatan tinggi dengan kapasitas tak terbatas menggunakan infrastruktur Telegram Cloud.",
  alternates: {
    canonical: "/",
  },
};

export default async function LandingPage() {
  const user = await getAuthUser();

  return (
    <div className="flex-grow flex flex-col w-full relative selection:bg-blue-600 selection:text-white">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] left-[-20%] w-[80%] h-[60%] rounded-full bg-blue-900/10 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-20%] w-[80%] h-[60%] rounded-full bg-violet-900/10 blur-[150px]" />
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-zinc-950/60 border-b border-zinc-800/50 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between max-w-7xl mx-auto w-full transition-all duration-300">
        <Link href="/" className="flex items-center gap-1.5 sm:gap-2 group">
          <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-1.5 sm:p-2 rounded-xl text-white shadow-lg shadow-blue-500/20 group-hover:scale-105 transition-transform duration-200">
            <Cloud className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-white via-zinc-200 to-zinc-400 bg-clip-text text-transparent">
            TeleStorage
          </span>
        </Link>
        <nav className="flex items-center gap-3 sm:gap-4">
          {user ? (
            <Link
              href="/dashboard"
              className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-semibold bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-all duration-200 flex items-center gap-1.5 sm:gap-2"
            >
              Dashboard <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-zinc-400" />
            </Link>
          ) : (
            <>
              <Link href="/login" className="text-xs sm:text-sm font-semibold text-zinc-400 hover:text-zinc-200 transition-colors duration-200">
                Masuk
              </Link>
              <Link
                href="/register"
                className="px-3 sm:px-5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-md shadow-blue-600/10 hover:shadow-blue-500/20 hover:scale-[1.02] transition-all duration-200"
              >
                <span className="hidden sm:inline">Mulai Sekarang</span>
                <span className="sm:hidden">Daftar</span>
              </Link>
            </>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <main className="flex-grow">
        <section className="max-w-6xl mx-auto px-6 pt-24 pb-20 text-center relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs font-semibold text-blue-400 mb-8 animate-pulse">
            <Zap className="w-3.5 h-3.5" /> Generasi Baru Cloud Storage SaaS
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-extrabold tracking-tight leading-[1.1] mb-6 max-w-4xl mx-auto bg-gradient-to-b from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent">
            Penyimpanan Awan Unlimited Berbasis Ekosistem Telegram
          </h1>
          <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
            Rasakan kecepatan tinggi, keamanan maksimal, dan kapasitas tak terbatas dengan mengintegrasikan Telegram Cloud langsung ke platform storage modern layaknya Google Drive.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href={user ? "/dashboard" : "/register"}
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-500/20 hover:scale-[1.02] transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              Mulai Sekarang Gratis
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
            <a
              href="#pricing"
              className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-semibold bg-zinc-900 hover:bg-zinc-800/80 border border-zinc-800 hover:border-zinc-700 transition-all duration-200"
            >
              Lihat Paket Harga
            </a>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="max-w-6xl mx-auto px-6 py-20 border-t border-zinc-900">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Keunggulan Utama TeleStorage
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Infrastruktur terdistribusi global Telegram memberikan performa tangguh secara instan untuk kebutuhan file storage Anda.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800/60 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 flex flex-col gap-4">
              <div className="bg-blue-600/10 p-3 rounded-xl w-fit text-blue-400 border border-blue-500/20">
                <Shield className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl">Penyimpanan Aman</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Setiap file disimpan di server terenkripsi Telegram. Kredensial akun Telegram Anda dienkripsi lokal dengan kunci AES-256 bits di sisi database.
              </p>
            </div>
            {/* Card 2 */}
            <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800/60 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 flex flex-col gap-4">
              <div className="bg-indigo-600/10 p-3 rounded-xl w-fit text-indigo-400 border border-indigo-500/20">
                <HardDrive className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl">Berbasis Telegram</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Manfaatkan kapasitas penyimpanan masif gratis bawaan Telegram. File diupload secara instan ke channel private terintegrasi.
              </p>
            </div>
            {/* Card 3 */}
            <div className="p-8 rounded-2xl bg-zinc-900/50 border border-zinc-800/60 backdrop-blur-sm hover:border-blue-500/30 transition-all duration-300 flex flex-col gap-4">
              <div className="bg-violet-600/10 p-3 rounded-xl w-fit text-violet-400 border border-violet-500/20">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-xl">Tanpa Batasan Format</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">
                Upload video, audio, gambar, dokumen, maupun file terkompresi tanpa sensor dan pembatasan tipe mime. Maksimal 2GB/file (atau 4GB untuk akun Premium).
              </p>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="max-w-6xl mx-auto px-6 py-20 border-t border-zinc-900">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">
              Paket Harga Langganan
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Mulai secara gratis dan tingkatkan ke fitur Pro untuk kebutuhan penyimpanan yang lebih intensif.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <div className="p-8 rounded-3xl bg-zinc-900/40 border border-zinc-800 flex flex-col justify-between hover:border-zinc-700 transition-all duration-200">
              <div>
                <span className="text-zinc-400 text-sm font-bold uppercase tracking-wider">Free</span>
                <h3 className="text-4xl font-extrabold mt-2 mb-4">Rp0 <span className="text-sm font-normal text-zinc-500">/ selamanya</span></h3>
                <p className="text-zinc-400 text-sm mb-6">
                  Cocok untuk pengguna personal yang ingin mencoba cloud storage berbasis Telegram.
                </p>
                <div className="w-full h-[1px] bg-zinc-800 mb-6" />
                <ul className="flex flex-col gap-3 text-sm text-zinc-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-500" /> Integrasi 1 Akun Telegram
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-500" /> Limit Upload Maksimal 2GB / file
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-500" /> Akses File Manager Lengkap
                  </li>
                  <li className="flex items-center gap-2 text-zinc-500">
                    × Kategori & Tag Kustom
                  </li>
                </ul>
              </div>
              <Link
                href={user ? "/dashboard" : "/register"}
                className="w-full mt-8 py-3 rounded-xl font-bold bg-zinc-800 hover:bg-zinc-700 transition-all duration-200 text-center block text-sm"
              >
                Mulai Gratis
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="p-8 rounded-3xl bg-gradient-to-b from-blue-950/20 to-zinc-900/40 border-2 border-blue-500 relative flex flex-col justify-between shadow-2xl shadow-blue-500/5 hover:border-blue-400 transition-all duration-200">
              <div className="absolute top-4 right-4 bg-blue-500 text-white font-bold text-xs px-2.5 py-1 rounded-full uppercase tracking-widest shadow-md shadow-blue-500/20">
                Populer
              </div>
              <div>
                <span className="text-blue-400 text-sm font-bold uppercase tracking-wider">Pro</span>
                <h3 className="text-4xl font-extrabold mt-2 mb-4">Rp49.000 <span className="text-sm font-normal text-zinc-500">/ bulan</span></h3>
                <p className="text-zinc-400 text-sm mb-6">
                  Untuk profesional yang membutuhkan penyimpanan besar, sharing link publik cepat, dan performa tinggi.
                </p>
                <div className="w-full h-[1px] bg-zinc-800/80 mb-6" />
                <ul className="flex flex-col gap-3 text-sm text-zinc-300">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400" /> Semua Fitur Paket Free
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400" /> Upload hingga 4GB / file (Premium)
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400" /> Tanpa Iklan & Prioritas Bandwidth
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400" /> Kustom Kategori & Tagging
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-blue-400" /> Support Dukungan API Publik
                  </li>
                </ul>
              </div>
              <Link
                href={user ? "/dashboard" : "/register"}
                className="w-full mt-8 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/20 text-center block text-sm"
              >
                Langganan Sekarang
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-zinc-950 border-t border-zinc-900 py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <div className="bg-zinc-900 p-1.5 rounded-lg border border-zinc-800">
              <Cloud className="w-4 h-4 text-blue-500" />
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-200">TeleStorage SaaS</span>
          </div>
          <p className="text-zinc-500 text-xs">
            © {new Date().getFullYear()} TeleStorage. Hak cipta dilindungi. Telegram adalah merek dagang terdaftar Telegram FZ-LLC.
          </p>
          <div className="flex gap-4 text-xs text-zinc-500">
            <span className="cursor-default">Syarat & Ketentuan</span>
            <span className="cursor-default">Kebijakan Privasi</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
