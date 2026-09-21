import React from 'react';
import {
  LayoutDashboard,
  Inbox,
  Send,
  Calendar,
  Menu,
} from 'lucide-react';
import { NavTab } from './Sidebar';
import { useApp } from '../../context/AppContext';

interface MobileBottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onToggleSidebar,
  isSidebarOpen,
}) => {
  const { currentUser, suratList, suratKeluarList, disposisiList } = useApp();

  // Calculate pending surat badges
  let pendingCount = 0;
  if (currentUser.role === 'admin_pertanahan' || currentUser.role === 'super_admin') {
    pendingCount = suratList.filter((s) => s.status === 'Surat Baru' || s.status === 'Menunggu Disposisi Kabid').length;
  } else if (currentUser.role === 'kabid') {
    pendingCount = suratList.filter((s) => s.status === 'Menunggu Disposisi Kabid').length;
  } else if (currentUser.role === 'ketua_pokja') {
    pendingCount = disposisiList.filter(
      (d) => d.kepadaUserId === currentUser.id && d.status === 'Terkirim'
    ).length;
  } else if (currentUser.role === 'staf_pokja') {
    pendingCount = disposisiList.filter(
      (d) => d.kepadaUserId === currentUser.id && (d.status === 'Terkirim' || d.status === 'Dibaca')
    ).length;
  }

  const upcomingAgendaCount = suratList.filter((s) => s.agenda).length;

  return (
    <nav
      id="mobile-bottom-nav"
      aria-label="Navigasi Mobile"
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 shadow-[0_-4px_16px_rgba(0,0,0,0.06)] flex items-center justify-around safe-area-pb"
    >
      {/* 1. Dashboard */}
      <button
        type="button"
        onClick={() => onSelectTab('dashboard')}
        className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors min-h-[46px] cursor-pointer ${
          activeTab === 'dashboard' && !isSidebarOpen
            ? 'text-blue-900 font-bold'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <LayoutDashboard className={`w-5 h-5 ${activeTab === 'dashboard' && !isSidebarOpen ? 'text-blue-900' : 'text-slate-500'}`} />
        <span className="text-[10px] mt-0.5 leading-tight">Beranda</span>
      </button>

      {/* 2. Surat Masuk */}
      <button
        type="button"
        onClick={() => onSelectTab('surat')}
        className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors relative min-h-[46px] cursor-pointer ${
          activeTab === 'surat' && !isSidebarOpen
            ? 'text-blue-900 font-bold'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <div className="relative">
          <Inbox className={`w-5 h-5 ${activeTab === 'surat' && !isSidebarOpen ? 'text-blue-900' : 'text-slate-500'}`} />
          {pendingCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-rose-500 text-white text-[9px] font-bold px-1 min-w-[15px] h-[15px] rounded-full flex items-center justify-center">
              {pendingCount > 99 ? '99+' : pendingCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 leading-tight">Surat Masuk</span>
      </button>

      {/* 3. Surat Keluar */}
      <button
        type="button"
        onClick={() => onSelectTab('surat_keluar')}
        className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors relative min-h-[46px] cursor-pointer ${
          activeTab === 'surat_keluar' && !isSidebarOpen
            ? 'text-blue-900 font-bold'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <div className="relative">
          <Send className={`w-5 h-5 ${activeTab === 'surat_keluar' && !isSidebarOpen ? 'text-blue-900' : 'text-slate-500'}`} />
          {suratKeluarList.length > 0 && (
            <span className="absolute -top-1 -right-2 bg-blue-600 text-white text-[9px] font-bold px-1 min-w-[15px] h-[15px] rounded-full flex items-center justify-center">
              {suratKeluarList.length > 99 ? '99+' : suratKeluarList.length}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 leading-tight">Surat Keluar</span>
      </button>

      {/* 4. Agenda Undangan */}
      <button
        type="button"
        onClick={() => onSelectTab('agenda')}
        className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors relative min-h-[46px] cursor-pointer ${
          activeTab === 'agenda' && !isSidebarOpen
            ? 'text-blue-900 font-bold'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <div className="relative">
          <Calendar className={`w-5 h-5 ${activeTab === 'agenda' && !isSidebarOpen ? 'text-blue-900' : 'text-slate-500'}`} />
          {upcomingAgendaCount > 0 && (
            <span className="absolute -top-1 -right-2 bg-amber-500 text-slate-950 text-[9px] font-bold px-1 min-w-[15px] h-[15px] rounded-full flex items-center justify-center">
              {upcomingAgendaCount}
            </span>
          )}
        </div>
        <span className="text-[10px] mt-0.5 leading-tight">Agenda</span>
      </button>

      {/* 5. Menu Lengkap / Drawer Toggle */}
      <button
        type="button"
        onClick={onToggleSidebar}
        className={`flex-1 flex flex-col items-center justify-center py-1 px-1 rounded-lg transition-colors min-h-[46px] cursor-pointer ${
          isSidebarOpen
            ? 'text-amber-600 font-bold bg-amber-50'
            : 'text-slate-500 hover:text-slate-800'
        }`}
      >
        <Menu className={`w-5 h-5 ${isSidebarOpen ? 'text-amber-600' : 'text-slate-500'}`} />
        <span className="text-[10px] mt-0.5 leading-tight">Semua Menu</span>
      </button>
    </nav>
  );
};
