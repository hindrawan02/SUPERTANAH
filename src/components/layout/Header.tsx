import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import {
  Bell,
  MessageSquare,
  Network,
  UserCheck,
  ChevronDown,
  Menu,
  RotateCcw,
  Check,
  Shield,
  Clock,
  Maximize,
  Minimize,
  PanelLeftClose,
  PanelLeft,
  Send,
  LogOut,
  Camera,
} from 'lucide-react';
import { User } from '../../types';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenOrgModal: () => void;
  onOpenWhatsAppModal: () => void;
  onOpenInputDisposisiModal?: () => void;
  onOpenScanner?: () => void;
  onLogout?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onToggleSidebar,
  onOpenOrgModal,
  onOpenWhatsAppModal,
  onOpenInputDisposisiModal,
  onOpenScanner,
  onLogout,
}) => {
  const {
    currentUser,
    setCurrentUser,
    users,
    pokjas,
    notifikasi,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    lastWhatsAppSent,
    whatsAppQueue,
    resetAllData,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
    isCloudSyncActive,
    lastSyncTime,
  } = useApp();

  const [showUserDropdown, setShowUserDropdown] = useState(false);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    try {
      if (typeof document === 'undefined') return;
      if (!document.fullscreenElement && document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      } else if (document.exitFullscreen) {
        await document.exitFullscreen();
      }
    } catch (err) {
      console.warn('Fullscreen request failed:', err);
    }
  };

  // Filter notif for current user
  const userNotifs = notifikasi.filter((n) => n.userId === currentUser.id);
  const unreadCount = userNotifs.filter((n) => !n.statusBaca).length;

  const handleSelectUser = (user: User) => {
    setCurrentUser(user);
    setShowUserDropdown(false);
  };

  const getRoleBadge = (user: User) => {
    if (user.id === 'staf-3' || user.nama.includes('Marsudi')) {
      return (
        <span className="inline-flex items-center gap-1">
          <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">Super Admin</span>
          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Staf Pokja 1</span>
        </span>
      );
    }
    switch (user.role) {
      case 'super_admin':
        return <span className="bg-purple-100 text-purple-800 text-[10px] font-bold px-2 py-0.5 rounded">Super Admin</span>;
      case 'admin_pertanahan':
        return <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded">Admin Pertanahan</span>;
      case 'kabid':
        return <span className="bg-amber-100 text-amber-900 text-[10px] font-bold px-2 py-0.5 rounded">Kepala Bidang</span>;
      case 'ketua_pokja':
        return <span className="bg-indigo-100 text-indigo-800 text-[10px] font-bold px-2 py-0.5 rounded">Ketua Pokja</span>;
      case 'staf_pokja':
        return <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded">Staf Pokja</span>;
      default:
        return null;
    }
  };

  const currentPokja = pokjas.find((p) => p.id === currentUser.pokjaId);

  return (
    <header className="bg-blue-950 text-white border-b border-blue-900 sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            onClick={onToggleSidebar}
            className="lg:hidden p-2 rounded-lg text-blue-200 hover:text-white hover:bg-blue-900 transition-colors shrink-0"
            title="Buka Menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Jawa Tengah emblem look badge */}
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-md shrink-0 border border-amber-300/40">
              <span className="font-serif font-black text-white text-sm sm:text-base tracking-tighter">JT</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-xs sm:text-base leading-tight tracking-tight text-white truncate max-w-[150px] sm:max-w-none">
                  Sistem Persuratan & Disposisi
                </h1>
                <span className="hidden md:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded">
                  Bidang Pertanahan
                </span>
              </div>
              <p className="text-[11px] text-blue-200 truncate hidden sm:block">
                Dinas Perumahan Rakyat dan Kawasan Permukiman Provinsi Jawa Tengah
              </p>
            </div>
          </div>
        </div>

        {/* Right: Actions, Notifications, User Profile & Switcher */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Real-Time Cloud Sync Indicator */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-200 text-[11px] font-medium shadow-2xs"
            title={`Real-Time Cloud Synchronization Aktif (Firestore). ${lastSyncTime ? `Sinkronisasi terakhir: ${lastSyncTime}` : 'Data tersinkron otomatis lintas pengguna.'}`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
            </span>
            <span className="font-semibold text-white">Live Sync</span>
          </div>

          {/* Quick Input Disposisi Button */}
          {onOpenInputDisposisiModal && (
            <button
              type="button"
              onClick={onOpenInputDisposisiModal}
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-amber-300 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg border border-amber-400/40 transition-colors shadow-2xs"
              title="Input Lembar Disposisi Surat"
            >
              <Send className="w-3.5 h-3.5 text-amber-300" />
              <span>+ Input Disposisi</span>
            </button>
          )}

          {/* Quick Scanner Dokumen Button */}
          {onOpenScanner && (
            <button
              type="button"
              onClick={onOpenScanner}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-cyan-200 bg-cyan-500/20 hover:bg-cyan-500/30 rounded-lg border border-cyan-400/40 transition-colors shadow-2xs"
              title="Pindai Dokumen Fisik / Buka Scanner Kamera"
            >
              <Camera className="w-3.5 h-3.5 text-cyan-300" />
              <span>Scan Dokumen</span>
            </button>
          )}

          {/* Desktop Sidebar Hide/Unhide Toggle */}
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            className="hidden lg:inline-flex p-2 rounded-lg text-blue-200 hover:text-white hover:bg-blue-900 border border-blue-800/80 transition-colors"
            title={isSidebarCollapsed ? 'Tampilkan Sidebar Penuh (Unhide)' : 'Sembunyikan Sidebar (Hide)'}
          >
            {isSidebarCollapsed ? (
              <PanelLeft className="w-4 h-4 text-amber-400" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>

          {/* Fullscreen Toggle Button (Desktop & Tablets only) */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="hidden sm:inline-flex p-2 rounded-lg text-blue-200 hover:text-white hover:bg-blue-900 border border-blue-800/80 transition-colors"
            title={isFullscreen ? 'Keluar dari Layar Penuh (ESC)' : 'Mode Tampilan Layar Penuh (Fullscreen)'}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 text-amber-300" />
            ) : (
              <Maximize className="w-4 h-4" />
            )}
          </button>

          {/* Org Structure Button */}
          <button
            onClick={onOpenOrgModal}
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-100 bg-blue-900/80 hover:bg-blue-800 hover:text-white rounded-lg border border-blue-800/80 transition-colors"
            title="Lihat Struktur Organisasi & Alur"
          >
            <Network className="w-4 h-4 text-amber-400" />
            <span className="hidden md:inline">Bagan Organisasi</span>
          </button>

          {/* WhatsApp Queue Button */}
          <button
            onClick={onOpenWhatsAppModal}
            className="relative p-2 rounded-lg text-emerald-300 hover:text-white hover:bg-emerald-900/40 border border-emerald-700/50 transition-colors"
            title="Notifikasi WhatsApp Gateway"
          >
            <MessageSquare className="w-4 h-4" />
            {whatsAppQueue.length > 0 && (
              <span className="absolute -top-1 -right-1 bg-emerald-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center shadow-xs">
                {whatsAppQueue.length}
              </span>
            )}
          </button>

          {/* In-app Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setShowNotifDropdown(!showNotifDropdown)}
              className="relative p-2 rounded-lg text-blue-200 hover:text-white hover:bg-blue-900 transition-colors"
              title="Notifikasi Masuk"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown */}
            {showNotifDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-blue-900" />
                    <span className="font-semibold text-xs text-slate-800">
                      Notifikasi ({userNotifs.length})
                    </span>
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsAsRead}
                      className="text-[11px] text-blue-600 hover:underline font-medium"
                    >
                      Tandai semua dibaca
                    </button>
                  )}
                </div>

                <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                  {userNotifs.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-400">
                      Tidak ada notifikasi untuk akun ini
                    </div>
                  ) : (
                    userNotifs.map((notif) => (
                      <div
                        key={notif.id}
                        onClick={() => markNotificationAsRead(notif.id)}
                        className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer text-xs ${
                          !notif.statusBaca ? 'bg-blue-50/60 font-medium' : ''
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1 mb-1">
                          <span className="font-semibold text-blue-950 text-xs">{notif.judul}</span>
                          <span className="text-[10px] text-slate-400 shrink-0">{notif.createdAt}</span>
                        </div>
                        <p className="text-slate-600 leading-relaxed text-[11px]">{notif.pesan}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Switcher Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserDropdown(!showUserDropdown)}
              className="flex items-center gap-1.5 sm:gap-2 p-1 sm:px-2.5 sm:py-1.5 rounded-lg bg-blue-900/60 hover:bg-blue-900 border border-blue-800/80 transition-colors text-left cursor-pointer"
              title="Profil & Ganti Akun"
            >
              <div className="w-8 h-8 sm:w-7 sm:h-7 rounded-lg bg-amber-500 text-blue-950 font-bold flex items-center justify-center text-xs shadow-xs shrink-0">
                {currentUser.nama.charAt(0)}
              </div>
              <div className="hidden sm:block text-left">
                <div className="text-xs font-semibold leading-tight text-white truncate max-w-[150px]">
                  {currentUser.nama}
                </div>
                <div className="text-[10px] text-blue-200 truncate max-w-[150px]">
                  {currentUser.jabatan}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-blue-300 ml-0.5 hidden sm:inline-block" />
            </button>

            {/* Dropdown Menu */}
            {showUserDropdown && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 max-w-[calc(100vw-1.5rem)] bg-white text-slate-800 rounded-xl shadow-2xl border border-slate-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                {/* Active user header */}
                <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-4">
                  <div className="text-[11px] text-blue-200 uppercase tracking-wider font-semibold">
                    Akun yang Sedang Digunakan
                  </div>
                  <div className="font-bold text-sm mt-1">{currentUser.nama}</div>
                  <div className="text-xs text-blue-100">{currentUser.jabatan}</div>
                  {currentPokja && (
                    <div className="mt-1 text-[11px] bg-white/10 rounded px-2 py-0.5 inline-block text-amber-200">
                      {currentPokja.nama}
                    </div>
                  )}
                  <div className="text-[10px] text-blue-300 font-mono mt-1">
                    NIP: {currentUser.nip} • WA: {currentUser.nomorWhatsapp}
                  </div>
                </div>

                {/* Official Profile Details */}
                <div className="p-4 space-y-3 bg-white text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Status Akun:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      Aktif & Terverifikasi
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Peran / Hak Akses:</span>
                    <div>{getRoleBadge(currentUser)}</div>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Nomor WhatsApp:</span>
                    <span className="font-mono text-slate-800 font-semibold">{currentUser.nomorWhatsapp || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                    <span className="text-slate-500 font-medium">Unit Kerja:</span>
                    <span className="font-semibold text-slate-800 text-right">
                      {currentPokja ? currentPokja.nama : 'Bidang Pertanahan'}
                    </span>
                  </div>
                </div>

                {/* Logout Option */}
                {onLogout && (
                  <div className="p-3 bg-slate-50 border-t border-slate-200">
                    <button
                      onClick={() => {
                        setShowUserDropdown(false);
                        onLogout();
                      }}
                      className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-colors cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Keluar / Logout Akun</span>
                    </button>
                  </div>
                )}

                {/* Reset Data Option */}
                <div className="p-2 bg-slate-50 border-t border-slate-200 flex justify-between items-center text-xs">
                  <button
                    onClick={() => {
                      if (confirm('Reset ulang data ke master data awal Disperakim Jateng?')) {
                        resetAllData();
                        setShowUserDropdown(false);
                      }
                    }}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-rose-600 px-2 py-1"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Data Awal
                  </button>
                  <button
                    onClick={() => setShowUserDropdown(false)}
                    className="text-[11px] font-medium text-slate-600 hover:text-slate-900 px-3 py-1"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
