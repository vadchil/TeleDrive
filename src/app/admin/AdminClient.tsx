"use client";

import { useState } from "react";
import Link from "next/link";
import { toggleUserStatusAction, deleteUserAction } from "../actions";
import {
  Users,
  HardDrive,
  File,
  Search,
  UserX,
  UserCheck,
  Trash2,
  ArrowLeft,
  Cloud,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface SerializedUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  telegramConnected: boolean;
  totalFiles: number;
  totalSize: number;
  createdAt: string;
}

interface AdminClientProps {
  users: SerializedUser[];
  currentAdminId: string;
}

export default function AdminClient({ users, currentAdminId }: AdminClientProps) {
  const [usersList, setUsersList] = useState<SerializedUser[]>(users);
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingId, setLoadingId] = useState<string | null>(null);

  // Format File Size helper
  const formatBytes = (bytes: number, decimals = 2) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
  };

  const handleToggleStatus = async (userId: string) => {
    setLoadingId(userId);
    const res = await toggleUserStatusAction(userId);
    setLoadingId(null);

    if (res.error) {
      alert(res.error);
    } else {
      setUsersList((prev) =>
        prev.map((u) =>
          u.id === userId ? { ...u, status: u.status === "ACTIVE" ? "BANNED" : "ACTIVE" } : u
        )
      );
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (confirm("Apakah Anda yakin ingin menghapus user ini beserta seluruh file dan integrasi Telegram mereka dari platform? Tindakan ini tidak bisa dibatalkan.")) {
      setLoadingId(userId);
      const res = await deleteUserAction(userId);
      setLoadingId(null);

      if (res.error) {
        alert(res.error);
      } else {
        setUsersList((prev) => prev.filter((u) => u.id !== userId));
      }
    }
  };

  const filteredUsers = usersList.filter(
    (u) =>
      u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Calculate platform totals
  const totalUsers = usersList.length;
  const totalFiles = usersList.reduce((acc, curr) => acc + curr.totalFiles, 0);
  const totalSize = usersList.reduce((acc, curr) => acc + curr.totalSize, 0);

  return (
    <div className="flex-grow flex flex-col w-full relative">
      {/* Background gradients */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[40%] rounded-full bg-blue-900/5 blur-[120px]" />
      </div>

      {/* Header */}
      <header className="border-b border-zinc-900 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-40 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <Link
            href="/dashboard"
            className="p-1.5 sm:p-2 rounded-lg border border-zinc-900 hover:border-zinc-800 text-zinc-400 hover:text-zinc-200 transition-all"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <Cloud className="w-4 h-4 sm:w-5 sm:h-5 text-blue-500" />
            <span className="font-extrabold tracking-tight text-base sm:text-lg hidden xs:inline">Admin Dashboard</span>
          </div>
        </div>

        <span className="text-xs px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-400 font-bold rounded-full">
          <span className="hidden xs:inline">Mode Administrator</span>
          <span className="xs:hidden">Admin</span>
        </span>
      </header>

      {/* Main Area */}
      <main className="flex-grow max-w-7xl w-full mx-auto p-6 flex flex-col gap-6">
        {/* Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 flex items-center gap-4">
            <div className="p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl text-blue-400">
              <Users className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Total Pengguna</span>
              <span className="text-3xl font-extrabold">{totalUsers}</span>
            </div>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 flex items-center gap-4">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl text-indigo-400">
              <File className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Total File Terupload</span>
              <span className="text-3xl font-extrabold">{totalFiles}</span>
            </div>
          </div>
          <div className="bg-zinc-900/30 border border-zinc-900 rounded-2xl p-6 flex items-center gap-4">
            <div className="p-3 bg-violet-500/10 border border-violet-500/20 rounded-xl text-violet-400">
              <HardDrive className="w-6 h-6" />
            </div>
            <div className="flex flex-col">
              <span className="text-zinc-500 text-xs font-bold uppercase tracking-wider">Total Storage Platform</span>
              <span className="text-3xl font-extrabold">{formatBytes(totalSize)}</span>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-zinc-900/20 border border-zinc-900 rounded-2xl p-4 flex items-center justify-between">
          <div className="relative w-full max-w-xs">
            <label htmlFor="searchQuery" className="sr-only">Cari pengguna berdasarkan nama atau email</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
            <input
              id="searchQuery"
              type="text"
              placeholder="Cari pengguna berdasarkan nama/email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-zinc-950/80 border border-zinc-800 rounded-xl text-sm placeholder:text-zinc-600 focus:outline-none focus:border-blue-500/80 transition-colors"
            />
          </div>
        </div>

        {/* User Table */}
        <div className="bg-zinc-900/10 border border-zinc-900 rounded-2xl overflow-hidden overflow-x-auto">
          <div className="min-w-[800px] md:min-w-full">
            <table className="w-full text-left text-sm text-zinc-400 border-collapse">
              <thead>
                <tr className="border-b border-zinc-900 text-zinc-500 text-xs font-semibold bg-zinc-950/40">
                  <th className="p-4">Pengguna</th>
                  <th className="p-4">Registrasi</th>
                  <th className="p-4">Role</th>
                  <th className="p-4">Telegram</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">File / Size</th>
                  <th className="p-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-zinc-500">
                      Tidak ada pengguna ditemukan.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="border-b border-zinc-900 hover:bg-zinc-900/10 transition-colors">
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-200">{u.name}</span>
                          <span className="text-xs text-zinc-500">{u.email}</span>
                        </div>
                      </td>
                      <td className="p-4 text-zinc-500 text-xs">
                        {new Date(u.createdAt).toLocaleDateString("id-ID")}
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.role === "ADMIN" ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-zinc-800 text-zinc-400"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1 w-fit ${u.telegramConnected ? "bg-blue-500/10 border border-blue-500/20 text-blue-400" : "bg-zinc-800 text-zinc-500"}`}>
                          {u.telegramConnected ? (
                            <>
                              <CheckCircle2 className="w-3 h-3" /> Connected
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3" /> Not Link
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-4">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.status === "ACTIVE" ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400" : "bg-red-500/10 border border-red-500/20 text-red-400"}`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5 text-xs text-zinc-400">
                          <span>{u.totalFiles} file</span>
                          <span className="text-[10px] text-zinc-500">{formatBytes(u.totalSize)}</span>
                        </div>
                      </td>
                      <td className="p-4 text-right">
                        <div className="inline-flex gap-2">
                          {u.id !== currentAdminId && (
                            <>
                              <button
                                onClick={() => handleToggleStatus(u.id)}
                                disabled={loadingId === u.id}
                                className={`p-1.5 rounded-lg border transition-all text-xs font-semibold ${u.status === "ACTIVE" ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-400" : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400"}`}
                                title={u.status === "ACTIVE" ? "Ban User" : "Activate User"}
                              >
                                {u.status === "ACTIVE" ? <UserX className="w-3.5 h-3.5" /> : <UserCheck className="w-3.5 h-3.5" />}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u.id)}
                                disabled={loadingId === u.id}
                                className="p-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition-all"
                                title="Hapus Akun User"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
