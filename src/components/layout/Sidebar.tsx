import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Inbox,
  Send,
  FilePlus,
  Calendar,
  Archive,
  BarChart3,
  Users,
  Activity,
  ShieldCheck,
  ClipboardList,
  MessageSquareText,
  PanelLeftClose,
  PanelLeft,
  HardDrive,
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'surat'
  | 'input_surat'
  | 'surat_keluar'
  | 'masukan_staf'
  | 'agenda'
  | 'arsip'
  | 'google_drive'
  | 'laporan'
  | 'monitoring_pokja'
  | 'users'
  | 'log';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
}) => {
  const {
    currentUser,
    suratList,
    suratKeluarList,
    disposisiList,
    pokjas,
    masukanStafList,
    isSidebarCollapsed,
    toggleSidebarCollapsed,
  } = useApp();

  // Calculate badge counts
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

  // Masukan staf pending badge
  const pendingMasukanCount = masukanStafList.filter((m) => m.status === 'Menunggu Tanggapan').length;

  // Agenda upcoming count
  const upcomingAgendaCount = suratList.filter((s) => s.agenda).length;

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: number; roles?: string[] }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'surat',
      label: 'Surat Masuk & Disposisi',
      icon: <Inbox className="w-4 h-4 shrink-0" />,
      badge: pendingCount,
    },
    {
      id: 'surat_keluar',
      label: 'Penomoran Surat Keluar',
      icon: <Send className="w-4 h-4 shrink-0" />,
      badge: suratKeluarList.length > 0 ? suratKeluarList.length : undefined,
    },
    {
      id: 'input_surat',
      label: 'Input Surat Masuk',
      icon: <FilePlus className="w-4 h-4 shrink-0" />,
      roles: ['super_admin', 'admin_pertanahan'],
    },
    {
      id: 'masukan_staf',
      label: 'Masukan & Telaahan Staf',
      icon: <MessageSquareText className="w-4 h-4 shrink-0" />,
      badge: pendingMasukanCount,
    },
    {
      id: 'monitoring_pokja',
      label: currentUser.role === 'ketua_pokja' ? 'Monitoring Staf Pokja' : 'Monitoring Pokja & Staf',
      icon: <ClipboardList className="w-4 h-4 shrink-0" />,
      roles: ['super_admin', 'admin_pertanahan', 'kabid', 'ketua_pokja'],
    },
    {
      id: 'agenda',
      label: 'Agenda Undangan',
      icon: <Calendar className="w-4 h-4 shrink-0" />,
      badge: upcomingAgendaCount,
    },
    {
      id: 'arsip',
      label: 'Arsip Digital',
      icon: <Archive className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'google_drive',
      label: 'Google Drive Cloud',
      icon: <HardDrive className="w-4 h-4 shrink-0 text-amber-400" />,
    },
    {
      id: 'laporan',
      label: 'Laporan Persuratan',
      icon: <BarChart3 className="w-4 h-4 shrink-0" />,
    },
    {
      id: 'users',
      label: 'Manajemen Staf & Pokja',
      icon: <Users className="w-4 h-4 shrink-0" />,
      roles: ['super_admin', 'admin_pertanahan'],
    },
    {
      id: 'log',
      label: 'Audit Trail / Log',
      icon: <Activity className="w-4 h-4 shrink-0" />,
    },
  ];

  const filteredItems = navItems.filter((item) => {
    if (!item.roles) return true;
    return item.roles.includes(currentUser.role);
  });

  const currentPokja = pokjas.find((p) => p.id === currentUser.pokjaId);

  return (
    <>
      {/* Mobile overlay */}
      {isOpenMobile && (
        <div
          onClick={onCloseMobile}
          className="fixed inset-0 z-40 bg-slate-950/70 lg:hidden backdrop-blur-xs transition-opacity"
          aria-hidden="true"
        />
      )}

      {/* Sidebar container with smooth collapse transition */}
      <aside
        className={`fixed lg:sticky top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col transition-all duration-300 ease-in-out shrink-0 shadow-2xl lg:shadow-none ${
          isOpenMobile ? 'translate-x-0 w-72 max-w-[85vw]' : '-translate-x-full lg:translate-x-0'
        } ${
          isSidebarCollapsed ? 'lg:w-16' : 'lg:w-64'
        } h-full lg:h-[calc(100vh-64px)]`}
      >
        {/* Mobile Header Inside Drawer */}
        <div className="lg:hidden p-4 border-b border-blue-900 flex items-center justify-between bg-blue-950 text-white shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-xs">
              JT
            </div>
            <div>
              <div className="font-bold text-xs leading-tight">SIPERDITAN</div>
              <div className="text-[10px] text-blue-300">Bidang Pertanahan</div>
            </div>
          </div>
          <button
            type="button"
            onClick={onCloseMobile}
            className="text-white hover:bg-blue-900 text-xs px-3 py-1.5 rounded-lg bg-blue-900/80 border border-blue-800 transition-colors flex items-center gap-1 cursor-pointer min-h-[36px]"
          >
            <span>Tutup</span>
            <span className="font-bold">✕</span>
          </button>
        </div>

        {/* User Profile Info Card in Sidebar */}
        <div className="p-3 border-b border-slate-100 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-900 text-white flex items-center justify-center font-bold text-sm shadow-xs shrink-0">
              {currentUser.nama.charAt(0)}
            </div>
            {!isSidebarCollapsed && (
              <div className="min-w-0 flex-1 animate-in fade-in duration-150">
                <div className="font-bold text-xs text-slate-900 truncate">
                  {currentUser.nama}
                </div>
                <div className="text-[11px] text-slate-500 truncate leading-tight">
                  {currentUser.jabatan}
                </div>
              </div>
            )}
          </div>
          {!isSidebarCollapsed && currentPokja && (
            <div className="mt-2 text-[10px] font-semibold text-blue-800 bg-blue-100/70 px-2 py-0.5 rounded flex items-center gap-1 truncate animate-in fade-in">
              <ShieldCheck className="w-3 h-3 text-blue-700 shrink-0" />
              <span className="truncate">{currentPokja.nama}</span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto pb-20 lg:pb-2">
          {filteredItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  onSelectTab(item.id);
                  onCloseMobile();
                }}
                title={isSidebarCollapsed ? item.label : undefined}
                className={`w-full flex items-center ${
                  isSidebarCollapsed ? 'justify-center px-2 py-2.5' : 'justify-between px-3 py-2.5'
                } rounded-xl text-xs font-medium transition-all group ${
                  isActive
                    ? 'bg-blue-900 text-white shadow-xs font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className={isActive ? 'text-amber-300' : 'text-slate-400 group-hover:text-blue-900'}>
                    {item.icon}
                  </span>
                  {!isSidebarCollapsed && (
                    <span className="truncate">{item.label}</span>
                  )}
                </div>
                {!isSidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span
                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                      isActive
                        ? 'bg-amber-400 text-blue-950'
                        : 'bg-blue-100 text-blue-800'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
                {isSidebarCollapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Desktop Collapse / Expand Toggle Button at Bottom */}
        <div className="p-2 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          {!isSidebarCollapsed && (
            <div className="text-[10px] text-slate-400 font-mono px-2 truncate">
              v2.4 Disperakim
            </div>
          )}
          <button
            type="button"
            onClick={toggleSidebarCollapsed}
            title={isSidebarCollapsed ? 'Perluas Sidebar (Unhide)' : 'Sembunyikan Sidebar (Hide)'}
            className={`p-2 rounded-lg text-slate-500 hover:text-blue-900 hover:bg-slate-200 transition-colors ${
              isSidebarCollapsed ? 'w-full flex justify-center' : ''
            }`}
          >
            {isSidebarCollapsed ? (
              <PanelLeft className="w-4 h-4 text-blue-900" />
            ) : (
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                <PanelLeftClose className="w-4 h-4 text-slate-500" />
                <span>Hide Sidebar</span>
              </div>
            )}
          </button>
        </div>
      </aside>
    </>
  );
};
