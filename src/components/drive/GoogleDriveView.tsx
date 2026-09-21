import React, { useState, useEffect, useCallback, useId } from 'react';
import { useApp } from '../../context/AppContext';
import {
  subscribeAuth,
  googleSignIn,
  googleSignOut,
  getGoogleUser,
  isGoogleConnected,
} from '../../services/googleAuthService';
import {
  listDriveFiles,
  getDriveQuota,
  createDriveFolder,
  uploadFileToDrive,
  backupSuratToDrive,
  deleteDriveFile,
  DriveFile,
  DriveQuota,
} from '../../services/googleDriveService';
import {
  HardDrive,
  FolderPlus,
  UploadCloud,
  RefreshCw,
  Search,
  FileText,
  Folder,
  Image as ImageIcon,
  ExternalLink,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  FileUp,
  Cloud,
  ChevronRight,
  ShieldCheck,
  LogOut,
  FolderOpen,
} from 'lucide-react';

export const GoogleDriveView: React.FC = () => {
  const { suratList, addLog } = useApp();

  const [connected, setConnected] = useState<boolean>(isGoogleConnected());
  const [googleUser, setGoogleUser] = useState(getGoogleUser());
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [authError, setAuthError] = useState<string>('');

  // Files state
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [quota, setQuota] = useState<DriveQuota | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'folders' | 'pdf' | 'images' | 'docs'>('all');
  const [currentFolder, setCurrentFolder] = useState<{ id: string; name: string }>({
    id: 'root',
    name: 'Drive Saya',
  });
  const [folderHistory, setFolderHistory] = useState<Array<{ id: string; name: string }>>([
    { id: 'root', name: 'Drive Saya' },
  ]);

  // Modals state
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [isCreatingFolder, setIsCreatingFolder] = useState(false);

  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // Destructive Delete Confirmation Modal (MANDATORY per skill)
  const [fileToDelete, setFileToDelete] = useState<DriveFile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Backup state
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [backupSuccessMsg, setBackupSuccessMsg] = useState<string>('');

  // Accessibility IDs for form inputs
  const driveSearchInputId = useId();
  const newFolderNameInputId = useId();
  const fileUploadInputId = useId();

  // Subscribe to auth changes
  useEffect(() => {
    const unsubscribe = subscribeAuth((user, token) => {
      setConnected(Boolean(user && token));
      setGoogleUser(user);
    });
    return () => unsubscribe();
  }, []);

  // Fetch files and quota
  const loadDriveData = useCallback(async () => {
    if (!connected) return;
    setIsLoading(true);
    try {
      const [filesRes, quotaRes] = await Promise.all([
        listDriveFiles({
          folderId: currentFolder.id,
          searchQuery,
          mimeTypeFilter: filterType === 'all' ? undefined : filterType,
        }),
        getDriveQuota().catch(() => null),
      ]);
      setFiles(filesRes.files);
      if (quotaRes) setQuota(quotaRes);
    } catch (err: any) {
      console.error('Error loading Google Drive data:', err);
      // If token expired or invalid, reset connection
      if (err?.message?.includes('401') || err?.message?.includes('token')) {
        setConnected(false);
      }
    } finally {
      setIsLoading(false);
    }
  }, [connected, currentFolder.id, searchQuery, filterType]);

  useEffect(() => {
    if (connected) {
      loadDriveData();
    }
  }, [connected, loadDriveData]);

  // Handle Google Login
  const handleGoogleLogin = async () => {
    setIsAuthenticating(true);
    setAuthError('');
    try {
      const result = await googleSignIn();
      if (result) {
        setConnected(true);
        setGoogleUser(result.user);
        addLog(
          undefined,
          'Integrasi Google Drive',
          `Akun Google (${result.user.email}) berhasil dihubungkan ke SIPERDITAN`
        );
      }
      // If result is null, the user closed or cancelled the popup window without error
    } catch (err: any) {
      const msg = err?.message || '';
      const code = err?.code || '';
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        msg.includes('popup-closed-by-user') ||
        msg.includes('cancelled-popup-request')
      ) {
        // User closed or cancelled popup - ignore cleanly
        return;
      }
      setAuthError(msg || 'Gagal menghubungkan ke Google Drive. Silakan coba lagi.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Google Logout
  const handleGoogleLogout = async () => {
    try {
      await googleSignOut();
      setConnected(false);
      setGoogleUser(null);
      setFiles([]);
      setQuota(null);
      addLog(undefined, 'Integrasi Google Drive', 'Akun Google Drive berhasil diputuskan');
    } catch (err: any) {
      console.error('Logout error:', err);
    }
  };

  // Navigate into a folder
  const handleOpenFolder = (folder: DriveFile) => {
    setCurrentFolder({ id: folder.id, name: folder.name });
    setFolderHistory((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  // Navigate via breadcrumbs
  const handleBreadcrumbClick = (index: number) => {
    const target = folderHistory[index];
    setCurrentFolder(target);
    setFolderHistory((prev) => prev.slice(0, index + 1));
  };

  // Create Folder
  const handleCreateFolder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;
    setIsCreatingFolder(true);
    try {
      await createDriveFolder(newFolderName.trim(), currentFolder.id);
      setNewFolderName('');
      setIsCreateFolderModalOpen(false);
      addLog(undefined, 'Google Drive', `Membuat folder "${newFolderName}" di Google Drive`);
      await loadDriveData();
    } catch (err: any) {
      alert(err.message || 'Gagal membuat folder');
    } finally {
      setIsCreatingFolder(false);
    }
  };

  // Upload File
  const handleUploadFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;
    setIsUploading(true);
    try {
      await uploadFileToDrive(uploadFile, uploadFile.name, uploadFile.type, currentFolder.id);
      setUploadFile(null);
      setIsUploadModalOpen(false);
      addLog(undefined, 'Google Drive', `Mengunggah berkas "${uploadFile.name}" ke Google Drive`);
      await loadDriveData();
    } catch (err: any) {
      alert(err.message || 'Gagal mengunggah berkas');
    } finally {
      setIsUploading(false);
    }
  };

  // Backup / Sync All Active Letters
  const handleBackupAllSurat = async () => {
    if (suratList.length === 0) {
      alert('Tidak ada surat yang tersedia untuk disinkronkan.');
      return;
    }

    setIsBackingUp(true);
    setBackupSuccessMsg('');
    try {
      // Find or create 'SIPERDITAN - Arsip Surat & Disposisi' folder
      let targetFolderId = currentFolder.id;
      if (currentFolder.id === 'root') {
        const existingFolder = files.find(
          (f) =>
            f.mimeType === 'application/vnd.google-apps.folder' &&
            f.name.includes('SIPERDITAN - Arsip')
        );
        if (existingFolder) {
          targetFolderId = existingFolder.id;
        } else {
          const newFolder = await createDriveFolder(
            'SIPERDITAN - Arsip Surat & Disposisi',
            'root'
          );
          targetFolderId = newFolder.id;
        }
      }

      // Backup top letters
      let successCount = 0;
      for (const surat of suratList) {
        await backupSuratToDrive(surat, targetFolderId);
        successCount++;
      }

      setBackupSuccessMsg(`Berhasil mencadangkan ${successCount} dossier surat ke Google Drive!`);
      addLog(undefined, 'Google Drive', `Sinkronisasi massal ${successCount} surat ke folder arsip Google Drive`);
      await loadDriveData();
    } catch (err: any) {
      alert(err.message || 'Gagal mencadangkan surat ke Google Drive');
    } finally {
      setIsBackingUp(false);
    }
  };

  // Confirm and Execute Destructive File Deletion
  const handleConfirmDelete = async () => {
    if (!fileToDelete) return;
    setIsDeleting(true);
    try {
      await deleteDriveFile(fileToDelete.id);
      addLog(undefined, 'Google Drive', `Menghapus berkas "${fileToDelete.name}" dari Google Drive`);
      setFileToDelete(null);
      await loadDriveData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus berkas dari Google Drive');
    } finally {
      setIsDeleting(false);
    }
  };

  const formatFileSize = (bytesStr?: string) => {
    if (!bytesStr) return '-';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return '-';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
  };

  const formatQuota = (bytesStr?: string) => {
    if (!bytesStr) return '0 GB';
    const bytes = parseInt(bytesStr, 10);
    if (isNaN(bytes)) return '0 GB';
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  const getQuotaPercent = () => {
    if (!quota?.limit || !quota?.usage) return 0;
    const limit = parseInt(quota.limit, 10);
    const usage = parseInt(quota.usage, 10);
    if (!limit || isNaN(limit) || isNaN(usage)) return 0;
    return Math.min(100, Math.round((usage / limit) * 100));
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Integration Header */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-6 bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-white/10 border border-white/20 p-2.5 flex items-center justify-center shadow-inner">
              <HardDrive className="w-7 h-7 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-amber-300 bg-amber-400/10 px-2 py-0.5 rounded-sm">
                  Google Workspace Cloud
                </span>
                <span className="text-xs text-blue-200">• Bidang Pertanahan</span>
              </div>
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white mt-0.5">
                Integrasi Penyimpanan Google Drive
              </h1>
              <p className="text-xs text-slate-300">
                Sinkronisasi berkas surat masuk, lembar disposisi, dan dokumen digital kedinasan di awan Google Drive
              </p>
            </div>
          </div>

          {connected && googleUser && (
            <div className="flex items-center gap-3 bg-white/10 border border-white/15 px-4 py-2 rounded-xl">
              {googleUser.photoURL ? (
                <img
                  src={googleUser.photoURL}
                  alt={googleUser.displayName || 'Google User'}
                  className="w-8 h-8 rounded-full border border-white/40"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                  {googleUser.email?.[0]?.toUpperCase() || 'G'}
                </div>
              )}
              <div className="text-left">
                <div className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>{googleUser.displayName || 'Pengguna Google'}</span>
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <div className="text-[11px] text-blue-200 font-mono truncate max-w-[180px]">
                  {googleUser.email}
                </div>
              </div>
              <button
                onClick={handleGoogleLogout}
                className="ml-2 p-1.5 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition-colors cursor-pointer"
                title="Putuskan Sambungan"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Quota Progress Bar (when connected) */}
        {connected && quota && (
          <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-600">
            <div className="flex items-center gap-3">
              <Cloud className="w-4 h-4 text-blue-600" />
              <span>
                Penggunaan Ruang Drive:{' '}
                <strong>
                  {formatQuota(quota.usage)} dari {formatQuota(quota.limit)}
                </strong>{' '}
                ({getQuotaPercent()}% terpakai)
              </span>
            </div>
            <div className="w-full sm:w-48 bg-slate-200 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  getQuotaPercent() > 85 ? 'bg-rose-500' : 'bg-blue-600'
                }`}
                style={{ width: `${getQuotaPercent()}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* When NOT CONNECTED: Official Sign In with Google Card */}
      {!connected ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center shadow-xs max-w-2xl mx-auto space-y-6">
          <div className="w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center mx-auto text-blue-700 shadow-inner">
            <HardDrive className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <h2 className="text-xl font-black text-slate-900">
              Sambungkan Google Drive ke SIPERDITAN
            </h2>
            <p className="text-xs text-slate-600 max-w-lg mx-auto leading-relaxed">
              Aktifkan pencadangan otomatis dokumen surat, disposisi pimpinan, dan naskah dinas langsung ke Google Drive resmi Disperakim Provinsi Jawa Tengah dengan aman.
            </p>
          </div>

          {authError && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs max-w-md mx-auto text-left flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{authError}</div>
            </div>
          )}

          {/* Official Google Sign-In Button compliant with GSI Brand guidelines */}
          <div className="flex justify-center pt-2">
            <button
              onClick={handleGoogleLogin}
              disabled={isAuthenticating}
              className="inline-flex items-center gap-3 px-6 py-3 bg-white hover:bg-slate-50 border border-slate-300 hover:border-slate-400 rounded-xl text-slate-700 font-semibold text-xs shadow-xs hover:shadow-md transition-all active:scale-[0.99] cursor-pointer disabled:opacity-60"
            >
              <svg className="w-5 h-5" viewBox="0 0 48 48">
                <path
                  fill="#EA4335"
                  d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                />
                <path
                  fill="#4285F4"
                  d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                />
                <path
                  fill="#FBBC05"
                  d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                />
                <path
                  fill="#34A853"
                  d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                />
              </svg>
              <span>{isAuthenticating ? 'Menghubungkan...' : 'Sign in with Google'}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-6 border-t border-slate-100 text-left">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Arsip Aman di Awan</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Cadangan otomatis dokumen surat dan lampiran langsung ke akun Google Drive Anda.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Akses Fleksibel</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Buka dan tinjau berkas disposisi kapan saja melalui smartphone, tablet, atau PC.
              </p>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
              <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Kendali Penuh</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Data disimpan dalam hak akses akun Anda dengan konfirmasi eksplisit sebelum modifikasi.
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* CONNECTED: Google Drive Explorer & Operations */
        <div className="space-y-4">
          {backupSuccessMsg && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-center justify-between animate-in fade-in">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{backupSuccessMsg}</span>
              </div>
              <button
                onClick={() => setBackupSuccessMsg('')}
                className="text-emerald-600 hover:text-emerald-800 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Action & Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <label htmlFor={driveSearchInputId} className="sr-only">Cari berkas di Google Drive</label>
                <input
                  id={driveSearchInputId}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Cari berkas di Google Drive..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center bg-slate-100 p-1 rounded-xl text-xs font-semibold text-slate-600">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    filterType === 'all' ? 'bg-white text-blue-950 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setFilterType('folders')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    filterType === 'folders' ? 'bg-white text-blue-950 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Folder
                </button>
                <button
                  onClick={() => setFilterType('pdf')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    filterType === 'pdf' ? 'bg-white text-blue-950 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  PDF
                </button>
                <button
                  onClick={() => setFilterType('images')}
                  className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                    filterType === 'images' ? 'bg-white text-blue-950 shadow-xs' : 'hover:text-slate-900'
                  }`}
                >
                  Gambar / Scan
                </button>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={loadDriveData}
                disabled={isLoading}
                className="p-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-600 text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                title="Muat ulang daftar berkas"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span className="hidden sm:inline">Segarkan</span>
              </button>

              <button
                onClick={() => setIsCreateFolderModalOpen(true)}
                className="px-3 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FolderPlus className="w-4 h-4 text-amber-500" />
                <span>Folder Baru</span>
              </button>

              <button
                onClick={() => setIsUploadModalOpen(true)}
                className="px-3 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              >
                <UploadCloud className="w-4 h-4 text-amber-300" />
                <span>Unggah Berkas</span>
              </button>

              <button
                onClick={handleBackupAllSurat}
                disabled={isBackingUp}
                className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                title="Cadangkan semua surat masuk & disposisi ke folder Google Drive"
              >
                <FileUp className={`w-4 h-4 ${isBackingUp ? 'animate-bounce' : ''}`} />
                <span>{isBackingUp ? 'Menyelaraskan...' : 'Sinkronkan Surat'}</span>
              </button>
            </div>
          </div>

          {/* Breadcrumb Navigation */}
          <div className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 flex items-center gap-1.5 text-xs text-slate-600 overflow-x-auto">
            <span className="font-semibold text-slate-400">Lokasi:</span>
            {folderHistory.map((f, idx) => (
              <React.Fragment key={f.id}>
                {idx > 0 && <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                <button
                  onClick={() => handleBreadcrumbClick(idx)}
                  className={`hover:text-blue-900 hover:underline flex items-center gap-1 cursor-pointer truncate max-w-[200px] ${
                    idx === folderHistory.length - 1 ? 'font-bold text-blue-950' : 'text-slate-600'
                  }`}
                >
                  {idx === 0 ? <HardDrive className="w-3.5 h-3.5 text-blue-600" /> : <Folder className="w-3.5 h-3.5 text-amber-500" />}
                  <span>{f.name}</span>
                </button>
              </React.Fragment>
            ))}
          </div>

          {/* Files List / Grid */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            {isLoading ? (
              <div className="p-12 text-center text-slate-400 space-y-2">
                <RefreshCw className="w-8 h-8 animate-spin mx-auto text-blue-600" />
                <p className="text-xs font-medium">Memuat berkas dari Google Drive...</p>
              </div>
            ) : files.length === 0 ? (
              <div className="p-12 text-center text-slate-400 space-y-3">
                <FolderOpen className="w-12 h-12 mx-auto text-slate-300" />
                <div className="space-y-1">
                  <div className="font-bold text-slate-700 text-sm">Folder ini kosong</div>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Belum ada berkas atau dokumen pada lokasi ini. Anda dapat mengunggah berkas baru atau menyelaraskan dossier persuratan.
                  </p>
                </div>
                <div className="flex justify-center gap-2 pt-2">
                  <button
                    onClick={() => setIsUploadModalOpen(true)}
                    className="px-3.5 py-2 bg-blue-900 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4 text-amber-300" />
                    <span>Unggah Berkas</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Nama Berkas / Dokumen</th>
                      <th className="py-3 px-4">Tipe</th>
                      <th className="py-3 px-4">Ukuran</th>
                      <th className="py-3 px-4">Terakhir Diubah</th>
                      <th className="py-3 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {files.map((file) => {
                      const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
                      const isPdf = file.mimeType === 'application/pdf';
                      const isImg = file.mimeType.startsWith('image/');
                      const isHtml = file.mimeType.includes('html');

                      return (
                        <tr key={file.id} className="hover:bg-blue-50/40 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-2.5">
                              {isFolder ? (
                                <Folder className="w-5 h-5 text-amber-500 shrink-0" />
                              ) : isPdf ? (
                                <FileText className="w-5 h-5 text-rose-500 shrink-0" />
                              ) : isImg ? (
                                <ImageIcon className="w-5 h-5 text-emerald-500 shrink-0" />
                              ) : isHtml ? (
                                <FileText className="w-5 h-5 text-blue-600 shrink-0" />
                              ) : (
                                <FileText className="w-5 h-5 text-slate-400 shrink-0" />
                              )}
                              <div>
                                {isFolder ? (
                                  <button
                                    onClick={() => handleOpenFolder(file)}
                                    className="font-bold text-blue-900 hover:underline text-left cursor-pointer flex items-center gap-1.5"
                                  >
                                    <span>{file.name}</span>
                                    <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                                  </button>
                                ) : (
                                  <span className="font-semibold text-slate-800">{file.name}</span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-500">
                            {isFolder
                              ? 'Folder'
                              : isPdf
                              ? 'PDF Dokumen'
                              : isImg
                              ? 'Gambar / Scan'
                              : isHtml
                              ? 'Dossier SIPERDITAN'
                              : 'Berkas'}
                          </td>

                          <td className="py-3 px-4 font-mono text-slate-600">
                            {formatFileSize(file.size)}
                          </td>

                          <td className="py-3 px-4 text-slate-500">
                            {file.modifiedTime
                              ? new Date(file.modifiedTime).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })
                              : '-'}
                          </td>

                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {file.webViewLink && (
                                <a
                                  href={file.webViewLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1.5 hover:bg-slate-100 rounded-lg text-blue-700 hover:text-blue-900 transition-colors"
                                  title="Buka di Google Drive"
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              )}

                              {/* Destructive Delete trigger */}
                              <button
                                onClick={() => setFileToDelete(file)}
                                className="p-1.5 hover:bg-rose-50 rounded-lg text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Hapus Berkas dari Drive"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Create Folder Modal */}
      {isCreateFolderModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-sm text-slate-900">Buat Folder Google Drive</h3>
              </div>
              <button
                onClick={() => setIsCreateFolderModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} className="space-y-4">
              <div>
                <label htmlFor={newFolderNameInputId} className="block text-xs font-bold text-slate-700 mb-1">
                  Nama Folder Baru <span className="text-rose-500">*</span>
                </label>
                <input
                  id={newFolderNameInputId}
                  type="text"
                  required
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Contoh: Arsip Surat Masuk 2026"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateFolderModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isCreatingFolder || !newFolderName.trim()}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>{isCreatingFolder ? 'Membuat...' : 'Buat Folder'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Upload File Modal */}
      {isUploadModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <UploadCloud className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-900">Unggah Berkas ke Google Drive</h3>
              </div>
              <button
                onClick={() => setIsUploadModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadFile} className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-2xl p-6 text-center transition-colors">
                <input
                  id={fileUploadInputId}
                  type="file"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setUploadFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                />
                <label
                  htmlFor={fileUploadInputId}
                  className="cursor-pointer space-y-2 flex flex-col items-center"
                >
                  <UploadCloud className="w-8 h-8 text-slate-400" />
                  <div className="text-xs font-bold text-slate-700">
                    {uploadFile ? uploadFile.name : 'Klik untuk memilih berkas atau geser ke sini'}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Mendukung PDF, Dokumen Word, Excel, Gambar scan, atau Arsip zip
                  </p>
                </label>
              </div>

              {uploadFile && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-center justify-between">
                  <div className="truncate font-semibold">{uploadFile.name}</div>
                  <div className="font-mono text-[11px] text-blue-700 shrink-0 ml-2">
                    {formatFileSize(String(uploadFile.size))}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsUploadModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUploading || !uploadFile}
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <span>{isUploading ? 'Mengunggah...' : 'Unggah Sekarang'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: MANDATORY User Confirmation for Destructive File Deletion */}
      {fileToDelete && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-slate-900">Konfirmasi Hapus Berkas</h3>
                <p className="text-[11px] text-slate-500">Tindakan ini permanen di Google Drive</p>
              </div>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 space-y-1">
              <div className="font-bold text-slate-900 truncate">{fileToDelete.name}</div>
              <div className="text-slate-500 font-mono text-[11px]">
                Ukuran: {formatFileSize(fileToDelete.size)}
              </div>
              <p className="text-rose-600 text-[11px] pt-1">
                Apakah Anda yakin ingin menghapus berkas ini dari Google Drive? Tindakan ini tidak dapat dibatalkan.
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setFileToDelete(null)}
                disabled={isDeleting}
                className="px-4 py-2 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-50 cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{isDeleting ? 'Menghapus...' : 'Hapus Permanen'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
