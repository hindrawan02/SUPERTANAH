import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { DashboardView } from './components/dashboard/DashboardView';
import { SuratListView } from './components/surat/SuratListView';
import { InputSuratModal } from './components/surat/InputSuratModal';
import { SuratDetailModal } from './components/surat/SuratDetailModal';
import { DisposisiKabidModal } from './components/surat/DisposisiKabidModal';
import { DisposisiPokjaModal } from './components/surat/DisposisiPokjaModal';
import { TindakLanjutModal } from './components/surat/TindakLanjutModal';
import { InputDisposisiModal } from './components/surat/InputDisposisiModal';
import { MasukanStafView } from './components/masukan/MasukanStafView';
import { AgendaView } from './components/agenda/AgendaView';
import { MonitoringPokjaView } from './components/monitoring/MonitoringPokjaView';
import { ArsipView } from './components/arsip/ArsipView';
import { LaporanView } from './components/laporan/LaporanView';
import { UserManagementView } from './components/users/UserManagementView';
import { AuditTrailView } from './components/log/AuditTrailView';
import { PdfViewerModal } from './components/common/PdfViewerModal';
import { QrCodeModal } from './components/common/QrCodeModal';
import { WhatsAppModal } from './components/common/WhatsAppModal';
import { OrgStructureModal } from './components/layout/OrgStructureModal';
import { DocumentScannerModal } from './components/common/DocumentScannerModal';
import { CetakLembarDisposisiModal } from './components/surat/CetakLembarDisposisiModal';
import { GoogleDriveView } from './components/drive/GoogleDriveView';
import { SuratKeluarListView } from './components/surat_keluar/SuratKeluarListView';
import { LoginView } from './components/auth/LoginView';
import { MobileBottomNav } from './components/layout/MobileBottomNav';
import { safeGetItem, safeSetItem, safeRemoveItem } from './utils/storage';
import { Surat, User } from './types';

const MainApp: React.FC = () => {
  const { currentUser, setCurrentUser, suratList, disposisiList } = useApp();

  // Authentication gate state with crash-proof storage access
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    try {
      return safeGetItem('disperakim_is_logged_in') === 'true';
    } catch {
      return false;
    }
  });

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    setIsLoggedIn(true);
    safeSetItem('disperakim_is_logged_in', 'true');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    safeRemoveItem('disperakim_is_logged_in');
  };

  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [isOpenMobileSidebar, setIsOpenMobileSidebar] = useState(false);

  // Modals state
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [isInputDisposisiModalOpen, setIsInputDisposisiModalOpen] = useState(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState(false);
  const [preScannedDoc, setPreScannedDoc] = useState<{ fileName: string; fileSize: string; filePdf: string } | null>(null);
  const [isOrgModalOpen, setIsOrgModalOpen] = useState(false);
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState(false);

  // Selected Surat for specific modal actions
  const [detailSurat, setDetailSurat] = useState<Surat | null>(null);
  const [pdfSurat, setPdfSurat] = useState<Surat | null>(null);
  const [qrSurat, setQrSurat] = useState<Surat | null>(null);
  const [disposisiSurat, setDisposisiSurat] = useState<Surat | null>(null);
  const [lembarDisposisiSurat, setLembarDisposisiSurat] = useState<Surat | null>(null);

  // If not logged in, display the official login screen first
  if (!isLoggedIn) {
    return <LoginView onLogin={handleLogin} />;
  }

  // Routing to appropriate modal based on current user role
  const handleOpenDisposisiModal = (surat: Surat) => {
    setDisposisiSurat(surat);
  };

  const handleSelectSuratForDetail = (surat: Surat) => {
    setDetailSurat(surat);
  };

  const handleOpenPdf = (surat: Surat) => {
    setPdfSurat(surat);
  };

  const handleOpenQr = (surat: Surat) => {
    setQrSurat(surat);
  };

  const handleOpenLembarDisposisi = (surat: Surat) => {
    setLembarDisposisiSurat(surat);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Top Brand Header */}
      <Header
        onToggleSidebar={() => setIsOpenMobileSidebar(!isOpenMobileSidebar)}
        onOpenOrgModal={() => setIsOrgModalOpen(true)}
        onOpenWhatsAppModal={() => setIsWhatsAppModalOpen(true)}
        onOpenInputDisposisiModal={() => setIsInputDisposisiModalOpen(true)}
        onOpenScanner={() => setIsScannerModalOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Body Layout - Full Screen Fluid Width */}
      <div className="flex-1 flex w-full">
        {/* Left Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => {
            if (tab === 'input_surat') {
              setIsInputModalOpen(true);
            } else {
              setActiveTab(tab);
            }
          }}
          isOpenMobile={isOpenMobileSidebar}
          onCloseMobile={() => setIsOpenMobileSidebar(false)}
        />

        {/* Center Content View Area with safe padding for mobile bottom nav */}
        <main className="flex-1 p-3 sm:p-6 lg:p-8 pb-24 lg:pb-8 min-w-0 overflow-x-hidden">
          {activeTab === 'dashboard' && (
            <DashboardView
              onNavigateToSurat={() => setActiveTab('surat')}
              onNavigateToAgenda={() => setActiveTab('agenda')}
              onNavigateToInput={() => setIsInputModalOpen(true)}
              onSelectSuratForDetail={handleSelectSuratForDetail}
              onOpenDisposisiModal={handleOpenDisposisiModal}
              onOpenLembarDisposisi={handleOpenLembarDisposisi}
            />
          )}

          {activeTab === 'surat' && (
            <SuratListView
              onSelectSuratForDetail={handleSelectSuratForDetail}
              onOpenPdf={handleOpenPdf}
              onOpenQr={handleOpenQr}
              onOpenDisposisiModal={handleOpenDisposisiModal}
              onOpenLembarDisposisi={handleOpenLembarDisposisi}
            />
          )}

          {activeTab === 'surat_keluar' && (
            <SuratKeluarListView />
          )}

          {activeTab === 'agenda' && (
            <AgendaView
              onSelectSuratForDetail={handleSelectSuratForDetail}
              onOpenPdf={handleOpenPdf}
              onOpenDisposisiModal={handleOpenDisposisiModal}
              onOpenLembarDisposisi={handleOpenLembarDisposisi}
            />
          )}

          {activeTab === 'monitoring_pokja' && (
            <MonitoringPokjaView
              onSelectSuratForDetail={handleSelectSuratForDetail}
            />
          )}

          {activeTab === 'masukan_staf' && (
            <MasukanStafView />
          )}

          {activeTab === 'arsip' && (
            <ArsipView
              onSelectSuratForDetail={handleSelectSuratForDetail}
              onOpenPdf={handleOpenPdf}
            />
          )}

          {activeTab === 'google_drive' && <GoogleDriveView />}

          {activeTab === 'laporan' && <LaporanView />}

          {activeTab === 'users' && <UserManagementView />}

          {activeTab === 'log' && <AuditTrailView />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar (Persistent access on mobile screens) */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'input_surat') {
            setIsInputModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        onToggleSidebar={() => setIsOpenMobileSidebar(!isOpenMobileSidebar)}
        isSidebarOpen={isOpenMobileSidebar}
      />

      {/* Global Modals */}
      {/* Input Disposisi Lembar Kerja */}
      {isInputDisposisiModalOpen && (
        <InputDisposisiModal
          isOpen={isInputDisposisiModalOpen}
          onClose={() => setIsInputDisposisiModalOpen(false)}
          defaultSurat={disposisiSurat || (suratList.length > 0 ? suratList[0] : null)}
        />
      )}

      {/* 1. Input Surat Masuk */}
      <InputSuratModal
        isOpen={isInputModalOpen}
        onClose={() => {
          setIsInputModalOpen(false);
          setPreScannedDoc(null);
        }}
        initialScannedDoc={preScannedDoc}
      />

      {/* 2. Detail Surat & 9-Step Timeline */}
      <SuratDetailModal
        surat={detailSurat}
        onClose={() => setDetailSurat(null)}
        onOpenPdf={handleOpenPdf}
        onOpenQr={handleOpenQr}
        onOpenDisposisi={handleOpenDisposisiModal}
        onOpenLembarDisposisi={handleOpenLembarDisposisi}
      />

      {/* 3. Disposisi Kabid ke Pokja */}
      {disposisiSurat && currentUser.role === 'kabid' && (
        <DisposisiKabidModal
          surat={disposisiSurat}
          onClose={() => setDisposisiSurat(null)}
          onOpenPdf={handleOpenPdf}
        />
      )}

      {/* 4. Disposisi Ketua Pokja ke Staf */}
      {disposisiSurat && currentUser.role === 'ketua_pokja' && (
        <DisposisiPokjaModal
          surat={disposisiSurat}
          onClose={() => setDisposisiSurat(null)}
          onOpenPdf={handleOpenPdf}
        />
      )}

      {/* 5. Tindak Lanjut Staf (Arsip / Kerjakan / Hadir) */}
      {disposisiSurat &&
        (currentUser.role === 'staf_pokja' ||
          ((currentUser.id === 'staf-3' || currentUser.nama.includes('Marsudi')) &&
            disposisiList.some(
              (d) => d.suratId === disposisiSurat.id && d.kepadaUserId === currentUser.id
            ))) && (
          <TindakLanjutModal
            surat={disposisiSurat}
            onClose={() => setDisposisiSurat(null)}
            onOpenPdf={handleOpenPdf}
            onOpenLembarDisposisi={handleOpenLembarDisposisi}
          />
        )}

      {/* Disposisi modal fallback for Admin / Super Admin */}
      {disposisiSurat &&
        (currentUser.role === 'admin_pertanahan' ||
          (currentUser.role === 'super_admin' &&
            !(
              (currentUser.id === 'staf-3' || currentUser.nama.includes('Marsudi')) &&
              disposisiList.some(
                (d) => d.suratId === disposisiSurat.id && d.kepadaUserId === currentUser.id
              )
            ))) && (
          <DisposisiKabidModal
            surat={disposisiSurat}
            onClose={() => setDisposisiSurat(null)}
            onOpenPdf={handleOpenPdf}
          />
        )}

      {/* 6. Realistic Government PDF Viewer */}
      <PdfViewerModal
        surat={pdfSurat}
        onClose={() => setPdfSurat(null)}
      />

      {/* 7. QR Code Verification Modal */}
      <QrCodeModal
        surat={qrSurat}
        onClose={() => setQrSurat(null)}
      />

      {/* 8. WhatsApp Gateway Simulator Modal */}
      <WhatsAppModal
        isOpen={isWhatsAppModalOpen}
        onClose={() => setIsWhatsAppModalOpen(false)}
      />

      {/* 9. Interactive Organization Chart Modal */}
      {isOrgModalOpen && (
        <OrgStructureModal
          onClose={() => setIsOrgModalOpen(false)}
        />
      )}

      {/* 10. Standalone Document Scanner Modal */}
      {isScannerModalOpen && (
        <DocumentScannerModal
          isOpen={isScannerModalOpen}
          onClose={() => setIsScannerModalOpen(false)}
          onScanComplete={(result) => {
            setPreScannedDoc(result);
            setIsScannerModalOpen(false);
            setIsInputModalOpen(true);
          }}
        />
      )}

      {/* 11. Cetak Lembar Disposisi & Surat Sekaligus (Template Resmi Disperakim Jawa Tengah) */}
      {lembarDisposisiSurat && (
        <CetakLembarDisposisiModal
          surat={lembarDisposisiSurat}
          onClose={() => setLembarDisposisiSurat(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainApp />
    </AppProvider>
  );
}
