# TeleStorage (Glorydrive) ☁️

[![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)](https://nextjs.org/)
[![Prisma](https://img.shields.io/badge/Prisma-ORM-blue?logo=prisma)](https://prisma.io)
[![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-blue?logo=postgresql)](https://postgresql.org)
[![TailwindCSS](https://img.shields.io/badge/CSS-Tailwind-blue?logo=tailwind-css)](https://tailwindcss.com)
[![TypeScript](https://img.shields.io/badge/Language-TypeScript-blue?logo=typescript)](https://typescriptlang.org)
[![Security](https://img.shields.io/badge/Security-Hardened-brightgreen?logo=securely)](#security--cryptography)

TeleStorage (Glorydrive) adalah platform **Cloud Storage SaaS** berkecepatan tinggi yang memanfaatkan infrastruktur Telegram Cloud untuk menyediakan penyimpanan tak terbatas secara gratis. Platform ini dirancang dengan manajemen file lengkap, pembagian tautan aman, enkripsi kredensial lokal, dan panel administrasi.

---

## 🌟 Fitur Utama

- **Integrasi Telegram MTProto**: Konektivitas native ke server Telegram menggunakan pustaka `teleproto` (tidak menggunakan bot API biasa, memungkinkan transfer file yang lebih cepat).
- **Penyimpanan Tak Terbatas**: File diunggah langsung ke saluran pribadi (*private channel*) Telegram Anda.
- **Kapasitas Unggah Besar**: Mendukung berkas hingga 2GB (4GB untuk akun Telegram Premium).
- **Manajemen File**: Unggah, unduh, ubah nama, dan hapus berkas secara real-time dari antarmuka web.
- **Sistem Autentikasi Tangguh**: Registrasi, masuk akun, pemulihan password via Mailtrap, dan pelacakan versi sesi JWT (*session versioning*) untuk memaksa keluar semua perangkat.
- **Keamanan Telegram 2FA**: Mendukung verifikasi OTP Telegram dan kata sandi verifikasi 2 langkah (Two-Factor Authentication).
- **Panel Admin**: Kelola daftar pengguna, aktifkan/nonaktifkan akun, dan lihat statistik penyimpanan keseluruhan secara real-time.

---

## ⚙️ Spesifikasi Keamanan & Kriptografi

Platform ini telah dikeraskan secara berkala untuk memenuhi standar siap produksi:

1. **Enkripsi Kredensial (AES-256-GCM)**: Kredensial sesi Telegram disimpan secara terenkripsi di database menggunakan algoritma *Advanced Encryption Standard* mode *Galois/Counter Mode* (AES-GCM). Kunci enkripsi diturunkan menggunakan `scrypt` dengan salt statis dari `ENCRYPTION_KEY`.
2. **Pencegahan Session Pollution**: OTP Telegram diikat dengan ID akun pengguna yang aktif di browser. Sesi autentikasi sementara (`tele_login_state`) langsung dihapus otomatis jika terjadi kesalahan integrasi, proses logout, atau diskoneksi.
3. **Pembatasan Laju (Rate Limiting)**: Proteksi brute-force bawaan pada level Server Actions untuk registrasi, login, pengiriman OTP Telegram, dan pemulihan password.
4. **Sanitasi Nama File**: Semua file yang diunggah disanitasi secara ketat untuk mencegah serangan *path traversal*, eksekusi kode berbahaya, dan injeksi null-byte.
5. **HTTP Security Headers**: Penerapan *Content Security Policy* (CSP), *Strict-Transport-Security* (HSTS), *X-Frame-Options* (DENY), dan *X-Content-Type-Options* (nosniff) via konfigurasi web server Next.js.

---

## 🛠️ Persyaratan Sistem

- **Node.js** v20.x atau lebih tinggi
- **PostgreSQL** v14 atau lebih tinggi
- Akun Telegram (untuk mendapatkan API ID & API Hash)
- Akun Mailtrap (untuk pengiriman email reset password)

---

## 🚀 Panduan Instalasi

### 1. Kloning Repositori & Instal Dependensi

```bash
git clone https://github.com/username/glorydrive.git
cd glorydrive
npm install --legacy-peer-deps
```

*Catatan: Parameter `--legacy-peer-deps` digunakan untuk mengatasi perbedaan versi peer dependency React 19 di Next.js 16.*

### 2. Dapatkan API Credentials Telegram

1. Buka laman [https://my.telegram.org](https://my.telegram.org) dan masuk menggunakan nomor telepon Telegram Anda.
2. Buka bagian **API development tools**.
3. Buat aplikasi baru untuk mendapatkan `TELEGRAM_API_ID` dan `TELEGRAM_API_HASH`.

### 3. Konfigurasi Environment Variables

Salin file contoh konfigurasi:

```bash
cp .env.example .env
```

Isi berkas `.env` dengan kredensial Anda:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/glorydrive?schema=public"
JWT_SECRET="masukkan-kunci-rahasia-panjang-dan-acak-di-sini"
ENCRYPTION_KEY="masukkan-32-karakter-kunci-aes-di-sini"

TELEGRAM_API_ID="masukkan-api-id-anda"
TELEGRAM_API_HASH="masukkan-api-hash-anda"

APP_URL="http://localhost:3000"
MAILTRAP_API_TOKEN="masukkan-token-mailtrap-anda"
MAILTRAP_FROM_EMAIL="no-reply@domain-terverifikasi-anda.com"
MAILTRAP_FROM_NAME="TeleStorage"
```

### 4. Database Migrasi & Prisma Generator

Jalankan perintah berikut untuk mensinkronisasi skema database PostgreSQL Anda:

```bash
# Untuk instalasi database baru:
npx prisma migrate deploy
npx prisma generate

# Jika database Anda sudah memiliki data dari eksekusi `db push` sebelumnya, jalankan baseline terlebih dahulu:
npx prisma migrate resolve --applied 20260718000000_baseline
npx prisma migrate deploy
npx prisma generate
```

---

## 💻 Cara Menjalankan Aplikasi

### Mode Pengembangan (Development)

```bash
npm run dev
```

Buka [http://localhost:3000](http://localhost:3000) di browser Anda.

### Menjalankan Pengujian (Testing)

```bash
npm test
```

### Script Pengujian Telegram Client

Untuk menguji konektivitas pustaka `teleproto` secara langsung lewat CLI:

```bash
npx ts-node src/scripts/test-tg-client.ts
```

---

## 🐳 Panduan Produksi & Deployment

### 1. Build Produksi

```bash
npm run build
npm start
```

### 2. Deployment Vercel

Aplikasi ini dapat di-deploy langsung ke Vercel dengan integrasi repositori git. Cukup hubungkan repositori Anda ke dashboard Vercel, masukkan semua variabel lingkungan (`.env`) ke konfigurasi environment variables Vercel, lalu Vercel akan otomatis melakukan build dan deploy saat Anda melakukan push.
