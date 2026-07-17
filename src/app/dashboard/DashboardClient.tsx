"use client";

import React, { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  logoutAction,
  sendTelegramOtpAction,
  verifyTelegramOtpAction,
  verifyTelegram2faAction,
  disconnectTelegramAction,
  renameFileAction,
  deleteFileAction,
} from "../actions";
import {
  Cloud,
  LogOut,
  Folder,
  FileText,
  Video,
  Image as ImageIcon,
  Music,
  Trash2,
  Download,
  Edit,
  Grid,
  List,
  Search,
  Upload,
  User as UserIcon,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Hash,
  Send,
  Lock,
  Phone,
  Settings,
} from "lucide-react";

interface FileItem {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  telegramMsgId: number;
  createdAt: string;
}

interface DashboardClientProps {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  telegramSession: {
    phoneNumber: string;
    channelId: string;
  } | null;
  initialFiles: FileItem[];
}

export default function DashboardClient({ user, telegramSession, initialFiles }: DashboardClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // File Manager State
  const [files, setFiles] = useState<FileItem[]>(initialFiles);
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [editingFile, setEditingFile] = useState<{ id: string; name: string } | null>(null);
  const [deleteConfirmFile, setDeleteConfirmFile] = useState<FileItem | null>(null);

  // Upload State
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Telegram Setup Wizard State
  const [wizardStep, setWizardStep] = useState<1 | 2 | 3>(1);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [password2fa, setPassword2fa] = useState("");
  const [wizardError, setWizardError] = useState<string | null>(null);
  const [wizardLoading, setWizardLoading] = useState(false);

  // Logout Handler
  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      router.push("/");
    });
  };

  // Format File Size helper
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  // Get File Icon helper
  const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith("image/")) return <ImageIcon className="w-8 h-8 text-emerald-400" />;
    if (mimeType.startsWith("video/")) return <Video className="w-8 h-8 text-blue-400" />;
    if (mimeType.startsWith("audio/")) return <Music className="w-8 h-8 text-amber-400" />;
    if (mimeType.startsWith("text/") || mimeType === "application/pdf") return <FileText className="w-8 h-8 text-zinc-400" />;
    return <Folder className="w-8 h-8 text-violet-400" />;
  };

  // --- WIZARD HANDLERS ---

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setWizardError(null);
    setWizardLoading(true);
    const trimmedPhone = phoneNumber.trim();

    if (!trimmedPhone.startsWith("+") || trimmedPhone.length < 10) {
      setWizardError("Masukkan nomor telepon valid dalam format internasional (contoh: +628123456789)");
      setWizardLoading(false);
      return;
    }

    const res = await sendTelegramOtpAction(trimmedPhone);
    setWizardLoading(false);

    if (res.error) {
      setWizardError(res.error);
    } else {
      setWizardStep(2);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setWizardError(null);
    setWizardLoading(true);

    if (!otpCode || otpCode.trim().length < 4) {
      setWizardError("Masukkan kode verifikasi valid.");
      setWizardLoading(false);
      return;
    }

    const res = await verifyTelegramOtpAction(otpCode.trim());
    setWizardLoading(false);

    if (res.error) {
      setWizardError(res.error);
    } else if (res.requires2fa) {
      setWizardStep(3);
    } else if (res.success) {
      router.refresh();
    }
  };

  const handleVerify2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setWizardError(null);
    setWizardLoading(true);

    if (!password2fa) {
      setWizardError("Password 2FA harus diisi.");
      setWizardLoading(false);
      return;
    }

    const res = await verifyTelegram2faAction(password2fa);
    setWizardLoading(false);

    if (res.error) {
      setWizardError(res.error);
    } else {
      router.refresh();
    }
  };

  // --- FILE MANAGER HANDLERS ---

  const handleUploadFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/files/upload", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Gagal mengupload file.");
      }

      // Add to local files list
      setFiles((prev) => [result.file, ...prev]);
    } catch (err: any) {
      console.error(err);
      setUploadError(err.message || "Gagal mengupload file.");
    } finally {
      setIsUploading(false);
      // Clear file input
      e.target.value = "";
    }
  };

  const handleRename = async () => {
    if (!editingFile) return;
    const res = await renameFileAction(editingFile.id, editingFile.name);
    if (res.error) {
      alert(res.error);
    } else {
      setFiles((prev) =>
        prev.map((f) => (f.id === editingFile.id ? { ...f, fileName: editingFile.name } : f))
      );
      setEditingFile(null);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirmFile) return;
    const targetId = deleteConfirmFile.id;
    setDeleteConfirmFile(null);

    // Filter out locally first for quick feedback
    setFiles((prev) => prev.filter((f) => f.id !== targetId));

    const res = await deleteFileAction(targetId);
    if (res.error) {
      alert(res.error);
      // Re-fetch files in dashboard to restore if error
      router.refresh();
    }
  };

  const handleDisconnect = async () => {
    if (confirm("Apakah Anda yakin ingin memutuskan integrasi Telegram? Semua file yang terupload tetap ada di Telegram tetapi metadata platform akan terhapus.")) {
      const res = await disconnectTelegramAction();
      if (res.error) {
        alert(res.error);
      } else {
        router.refresh();
      }
    }
  };

  const filteredFiles = files.filter((f) =>
    f.fileName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalUsedStorage = files.reduce((acc, curr) => acc + curr.fileSize, 0);

  return (
    <div className="flex-grow flex flex-col w-full relative">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] rounded-full bg-blue-900/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[40%] rounded-full bg-violet-900/5 blur-[120px]" />
      </div>

      {/* Nav Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="bg-gradient-to-tr from-blue-500 to-indigo-600 p-1.5 rounded-lg text-white shadow-md">
            <Cloud className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
          <span className="font-extrabold tracking-tight text-base sm:text-lg hidden xs:inline">TeleStorage</span>
        </div>

        <div className="flex items-center gap-3 sm:gap-4">
          {user.role === "ADMIN" && (
            <Link
              href="/admin"
              className="text-xs font-semibold px-2.5 sm:px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg hover:bg-blue-500/20 transition-all duration-200"
            >
              Admin Area
            </Link>
          )}
          <div className="flex items-center gap-1.5 sm:gap-2 text-zinc-400 text-sm">
            <UserIcon className="w-4 h-4 text-zinc-500" />
            <span className="max-w-[100px] truncate hidden sm:inline">{user.name}</span>
          </div>
          <button
            onClick={handleLogout}
            disabled={isPending}
            className="p-1.5 sm:p-2 rounded-lg border border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-colors duration-200 disabled:opacity-50"
            title="Keluar"
          >
            {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogOut className="w-4 h-4" />}
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        {/* If Telegram not connected: Show Setup Wizard */}
        {!telegramSession ? (
          <div className="max-w-xl w-full mx-auto mt-10">
            <div className="bg-zinc-900/40 border border-zinc-800/80 backdrop-blur-md rounded-2xl p-8 shadow-2xl">
              <div className="text-center mb-8">
                <div className="w-12 h-12 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto text-blue-400 mb-4">
                  <Hash className="w-6 h-6 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold tracking-tight">Hubungkan Akun Telegram</h2>
                <p className="text-zinc-500 text-sm mt-2">
                  TeleStorage memerlukan integrasi akun Telegram Anda untuk menyimpan file sebagai database awan.
                </p>
              </div>

              {/* Wizard Progress Line */}
              <div className="flex items-center justify-center gap-2 mb-8">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep >= 1 ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-500"}`}>1</div>
                <div className={`h-[2px] w-8 ${wizardStep >= 2 ? "bg-blue-600" : "bg-zinc-800"}`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep >= 2 ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-500"}`}>2</div>
                <div className={`h-[2px] w-8 ${wizardStep === 3 ? "bg-blue-600" : "bg-zinc-800"}`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${wizardStep === 3 ? "bg-blue-600 text-white" : "bg-zinc-800 text-zinc-500"}`}>3</div>
              </div>

              {/* Wizard Errors */}
              {wizardError && (
                <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <span>{wizardError}</span>
                </div>
              )}

              {/* Step 1: Input Phone */}
              {wizardStep === 1 && (
                <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                      Nomor Telepon Telegram
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                        <Phone className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="+628123456789"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/80 transition-colors"
                      />
                    </div>
                    <span className="text-[11px] text-zinc-500">
                      Gunakan format kode negara (internasional), contoh: +62 untuk Indonesia.
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={wizardLoading}
                    className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-500/10 hover:shadow-blue-500/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {wizardLoading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> Menghubungkan...
                      </>
                    ) : (
                      <>
                        Kirim OTP Telegram <Send className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* Step 2: Input OTP */}
              {wizardStep === 2 && (
                <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                      Kode OTP Telegram
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type="text"
                        placeholder="Masukkan kode OTP"
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/80 transition-colors"
                      />
                    </div>
                    <span className="text-[11px] text-zinc-500">
                      Telegram mengirimkan OTP ke aplikasi Telegram Anda atau via SMS.
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setWizardStep(1)}
                      className="w-1/3 py-3 rounded-xl font-semibold bg-zinc-950 border border-zinc-800 hover:border-zinc-700 transition-all text-center text-sm"
                    >
                      Kembali
                    </button>
                    <button
                      type="submit"
                      disabled={wizardLoading}
                      className="w-2/3 py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {wizardLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        "Verifikasi OTP"
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Step 3: Input 2FA */}
              {wizardStep === 3 && (
                <form onSubmit={handleVerify2fa} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-zinc-400 text-xs font-semibold uppercase tracking-wider">
                      Password 2FA Telegram
                    </label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-zinc-500">
                        <Lock className="w-4 h-4" />
                      </span>
                      <input
                        type="password"
                        placeholder="Password dua langkah Anda"
                        value={password2fa}
                        onChange={(e) => setPassword2fa(e.target.value)}
                        required
                        className="w-full pl-10 pr-4 py-3 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/80 transition-colors"
                      />
                    </div>
                    <span className="text-[11px] text-zinc-500">
                      Akun Anda dilindungi 2-step verification. Masukkan password tambahan Anda.
                    </span>
                  </div>
                  <button
                    type="submit"
                    disabled={wizardLoading}
                    className="w-full py-3 rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {wizardLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "Verifikasi Password 2FA"
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        ) : (
          /* File Manager Dashboard Area */
          <>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 flex flex-col gap-1">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Total File</span>
                <span className="text-3xl font-extrabold">{files.length}</span>
                <span className="text-xs text-zinc-500 mt-2">File tersimpan aman</span>
              </div>
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 flex flex-col gap-1">
                <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Kapasitas Terpakai</span>
                <span className="text-3xl font-extrabold">{formatBytes(totalUsedStorage)}</span>
                <span className="text-xs text-blue-500 mt-2 font-semibold">Kapasitas Telegram: Unlimited</span>
              </div>
              <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Koneksi Telegram</span>
                  <span className="text-sm font-semibold text-emerald-400 mt-1 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Connected
                  </span>
                  <span className="text-xs text-zinc-500 mt-1 max-w-[150px] truncate">
                    {telegramSession.phoneNumber}
                  </span>
                </div>
                <button
                  onClick={handleDisconnect}
                  className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/20 transition-all duration-200 text-xs font-bold"
                  title="Disconnect Telegram"
                >
                  Disconnect
                </button>
              </div>
            </div>

            {/* Upload status / error bar */}
            {uploadError && (
              <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center gap-2">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* File manager controls */}
            <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4 flex flex-col md:flex-row items-center justify-between gap-4">
              {/* Search */}
              <div className="relative w-full md:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Cari file..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/80 transition-colors"
                />
              </div>

              {/* Actions & Layout switcher */}
              <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
                <div className="flex bg-zinc-950 border border-zinc-800 rounded-xl p-0.5">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-zinc-800 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-blue-600/10 hover:shadow-blue-500/20 active:scale-[0.98] transition-all cursor-pointer">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Uploading...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" /> Upload File
                    </>
                  )}
                  <input
                    type="file"
                    className="hidden"
                    onChange={handleUploadFile}
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>

            {/* Files View */}
            {filteredFiles.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center bg-zinc-900/10 border border-zinc-900 border-dashed rounded-3xl">
                <Folder className="w-16 h-16 text-zinc-700 mb-4" />
                <h3 className="font-bold text-lg text-zinc-300">Tidak ada file</h3>
                <p className="text-zinc-500 text-sm mt-1 max-w-sm">
                  {searchQuery ? "Pencarian Anda tidak menemukan hasil apapun." : "Mulai upload file Anda ke penyimpanan aman Telegram Cloud."}
                </p>
              </div>
            ) : viewMode === "grid" ? (
              /* Grid View */
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {filteredFiles.map((file) => (
                  <div
                    key={file.id}
                    className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-5 hover:border-zinc-800 transition-all duration-200 group flex flex-col justify-between min-h-[160px]"
                  >
                    <div className="flex items-start gap-4">
                      {getFileIcon(file.mimeType)}
                      <div className="overflow-hidden w-full">
                        <h4 className="font-semibold text-sm truncate text-zinc-200 group-hover:text-white" title={file.fileName}>
                          {file.fileName}
                        </h4>
                        <span className="text-[11px] text-zinc-500 mt-0.5 block">{formatBytes(file.fileSize)}</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between border-t border-zinc-900/80 pt-4 mt-4 gap-2 opacity-90 group-hover:opacity-100 transition-opacity">
                      <span className="text-[10px] text-zinc-600">
                        {new Date(file.createdAt).toLocaleDateString("id-ID")}
                      </span>

                      <div className="flex gap-1.5">
                        <button
                          onClick={() => setEditingFile({ id: file.id, name: file.fileName })}
                          className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
                          title="Ubah Nama"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <a
                          href={`/api/files/download/${file.id}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
                          title="Unduh"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </a>
                        <button
                          onClick={() => setDeleteConfirmFile(file)}
                          className="p-1.5 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* List View */
              <div className="bg-zinc-900/10 border border-zinc-900 rounded-2xl overflow-hidden overflow-x-auto">
                <div className="min-w-[600px] md:min-w-full">
                  <table className="w-full text-left text-sm text-zinc-400 border-collapse">
                    <thead>
                      <tr className="border-b border-zinc-900 text-zinc-500 text-xs font-semibold bg-zinc-950/40">
                        <th className="p-4">Nama File</th>
                        <th className="p-4">Ukuran</th>
                        <th className="p-4">Tipe Mime</th>
                        <th className="p-4">Tanggal Upload</th>
                        <th className="p-4 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredFiles.map((file) => (
                        <tr key={file.id} className="border-b border-zinc-900 hover:bg-zinc-900/10 transition-colors group">
                          <td className="p-4 flex items-center gap-3 font-medium text-zinc-200 max-w-[300px] truncate">
                            {getFileIcon(file.mimeType)}
                            <span title={file.fileName}>{file.fileName}</span>
                          </td>
                          <td className="p-4 text-zinc-400">{formatBytes(file.fileSize)}</td>
                          <td className="p-4 text-zinc-500 text-xs truncate max-w-[150px]">{file.mimeType}</td>
                          <td className="p-4 text-zinc-500">
                            {new Date(file.createdAt).toLocaleDateString("id-ID")}
                          </td>
                          <td className="p-4 text-right">
                            <div className="inline-flex gap-2">
                              <button
                                onClick={() => setEditingFile({ id: file.id, name: file.fileName })}
                                className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
                                title="Ubah Nama"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <a
                                href={`/api/files/download/${file.id}`}
                                target="_blank"
                                rel="noreferrer"
                                className="p-1.5 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 rounded-lg transition-colors"
                                title="Unduh"
                              >
                                <Download className="w-4 h-4" />
                              </a>
                              <button
                                onClick={() => setDeleteConfirmFile(file)}
                                className="p-1.5 hover:bg-red-500/10 text-zinc-500 hover:text-red-400 rounded-lg transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* RENAME MODAL */}
      {editingFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-lg font-bold text-zinc-200">Ubah Nama File</h3>
            <div className="flex flex-col gap-1.5">
              <label className="text-zinc-500 text-xs font-semibold uppercase tracking-wider">Nama Baru</label>
              <input
                type="text"
                value={editingFile.name}
                onChange={(e) => setEditingFile({ ...editingFile, name: e.target.value })}
                className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/80 transition-colors text-zinc-200"
              />
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setEditingFile(null)}
                className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-all font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleRename}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-bold shadow-lg transition-all"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmFile && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl flex flex-col gap-4">
            <div className="flex gap-3 text-red-400">
              <ShieldAlert className="w-10 h-10 shrink-0" />
              <div>
                <h3 className="text-lg font-bold text-zinc-200">Hapus File?</h3>
                <p className="text-zinc-500 text-sm mt-1 leading-relaxed">
                  Apakah Anda yakin ingin menghapus <strong className="text-zinc-300">{deleteConfirmFile.fileName}</strong>? File ini akan terhapus selamanya dari metadata platform dan akun Telegram Anda.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button
                onClick={() => setDeleteConfirmFile(null)}
                className="px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-sm text-zinc-400 hover:border-zinc-700 hover:text-zinc-200 transition-all font-semibold"
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2 bg-red-600 hover:bg-red-500 text-white rounded-xl text-sm font-bold shadow-lg transition-all"
              >
                Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
