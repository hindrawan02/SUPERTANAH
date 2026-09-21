import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User } from '../../types';
import {
  Shield,
  Building2,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  AlertCircle,
  Lock,
} from 'lucide-react';

interface LoginViewProps {
  onLogin: (user: User) => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLogin }) => {
  const { users } = useApp();

  const [nipInput, setNipInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleFormLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const cleanInputNip = nipInput.trim().replace(/\s+/g, '');
    const cleanInputPassword = passwordInput.trim();

    if (!cleanInputNip) {
      setErrorMsg('Silakan masukkan Nomor Induk Pegawai (NIP) Anda.');
      return;
    }

    if (!cleanInputPassword) {
      setErrorMsg('Silakan masukkan Kata Sandi sistem Anda.');
      return;
    }

    // Find user by NIP (clean spaces) or email
    const found = users.find(
      (u) =>
        u.nip.replace(/\s+/g, '') === cleanInputNip ||
        u.email.toLowerCase() === nipInput.trim().toLowerCase()
    );

    if (!found) {
      setErrorMsg(
        `Pegawai dengan NIP "${nipInput.trim()}" tidak terdaftar dalam sistem. Pastikan NIP yang dimasukkan benar atau hubungi Super Administrator.`
      );
      return;
    }

    if (found.status === 'inactive') {
      setErrorMsg('Akun pegawai ini berstatus Nonaktif. Silakan hubungi Super Administrator untuk mengaktifkan kembali.');
      return;
    }

    // Check password managed by Super Admin (or NIP if not configured)
    const validPassword = found.password || found.nip.replace(/\s+/g, '');
    const isValid = cleanInputPassword === validPassword;

    if (!isValid) {
      setErrorMsg(
        'Kata sandi yang Anda masukkan salah. Silakan periksa kembali atau hubungi Super Administrator untuk pengaturan ulang sandi.'
      );
      return;
    }

    onLogin(found);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex flex-col justify-center items-center p-4 sm:p-6 text-slate-100">
      {/* Decorative backdrop glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
      </div>

      <div className="relative max-w-lg w-full bg-white text-slate-800 rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Top Header with official insignia */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white p-6 sm:p-7 text-center relative border-b-4 border-amber-400">
          <div className="flex justify-center mb-3">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 p-2.5 flex items-center justify-center shadow-inner">
              <Building2 className="w-8 h-8 text-amber-400" />
            </div>
          </div>
          <div className="text-[11px] uppercase tracking-widest text-amber-300 font-bold">
            Pemerintah Provinsi Jawa Tengah
          </div>
          <h1 className="text-base sm:text-lg font-black uppercase tracking-wide mt-1 text-white">
            Dinas Perumahan Rakyat dan Kawasan Permukiman
          </h1>
          <p className="text-xs text-blue-200 font-medium mt-1">
            Sistem Informasi Persuratan & Disposisi Digital (SIPERDITAN) • Bidang Pertanahan
          </p>
          <div className="text-[10px] text-blue-300 mt-2 font-mono">
            Jalan Madukoro Blok AA-BB Kompleks PRPP Kota Semarang 50144
          </div>
        </div>

        {/* Login Form Container */}
        <div className="p-6 sm:p-7 space-y-5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <Lock className="w-4 h-4 text-blue-900" />
            <span className="font-bold text-sm text-blue-950">Masuk Akun Kedinasan</span>
          </div>

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>{errorMsg}</div>
            </div>
          )}

          <form onSubmit={handleFormLogin} className="space-y-4">
            <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
              <div className="font-bold flex items-center gap-1.5 mb-0.5">
                <KeyRound className="w-3.5 h-3.5 text-blue-700" />
                <span>Autentikasi Kedinasan Disperakim Jateng</span>
              </div>
              Akses sistem diamankan dengan NIP kedinasan dan Kata Sandi yang dikelola langsung oleh <strong>Super Administrator</strong>.
            </div>

            {/* NIP Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nomor Induk Pegawai (NIP) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="text"
                  required
                  value={nipInput}
                  onChange={(e) => setNipInput(e.target.value)}
                  placeholder="Contoh: 196910121998031003"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Dapat diketik tanpa spasi atau dengan spasi resmi BKN
              </p>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Kata Sandi (Password) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  placeholder="Masukkan kata sandi pegawai..."
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl border border-slate-300 text-xs font-mono focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  title={showPassword ? 'Sembunyikan sandi' : 'Tampilkan sandi'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] cursor-pointer"
            >
              <Shield className="w-4 h-4 text-amber-300" />
              <span>Masuk ke Halaman Sistem SIPERDITAN</span>
            </button>
          </form>

          {/* Quick 1-Tap Access for Mobile / Direct Testing */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                Akses Cepat (1-Klik Tanpa Ketik NIP)
              </span>
              <span className="text-[10px] text-blue-800 font-semibold bg-blue-50 px-2 py-0.5 rounded-full">
                Khusus Mobile & Peninjau
              </span>
            </div>

            {/* Instant Enter Button */}
            <button
              type="button"
              onClick={() => {
                const defaultUser = users.find((u) => u.id === 'staf-1') || users[0];
                if (defaultUser) onLogin(defaultUser);
              }}
              className="w-full mb-3 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.98] cursor-pointer"
            >
              <span>⚡ Masuk Langsung ke Dashboard (Preview Mobile)</span>
            </button>

            {/* Quick Role Selection Chips */}
            <div className="text-[11px] text-slate-500 mb-1.5 font-medium">Pilih Akun Pejabat / Staf:</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
              {users.slice(0, 8).map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => onLogin(u)}
                  className="flex items-center gap-2 p-2 rounded-lg border border-slate-200 hover:border-blue-700 hover:bg-blue-50/70 text-left transition-all group cursor-pointer bg-white"
                >
                  <div className="w-7 h-7 rounded-md bg-blue-900 text-white font-bold flex items-center justify-center text-[10px] shrink-0 group-hover:bg-amber-500 group-hover:text-blue-950 transition-colors">
                    {u.nama.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-bold text-slate-800 truncate group-hover:text-blue-900">
                      {u.nama}
                    </div>
                    <div className="text-[10px] text-slate-500 truncate">
                      {u.jabatan}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Footer Information */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-slate-400 gap-2">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Terintegrasi Disperakim Prov. Jateng</span>
            </div>
            <div>Hak Cipta © 2026 SIPERDITAN</div>
          </div>
        </div>
      </div>
    </div>
  );
};
