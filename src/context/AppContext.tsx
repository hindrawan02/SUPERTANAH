import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  Pokja,
  Surat,
  SuratKeluar,
  Disposisi,
  TindakLanjut,
  Notifikasi,
  LogAktivitas,
  WhatsAppNotification,
  DisposisiPrioritas,
  TindakLanjutJenis,
  ProgresStatus,
  Agenda,
  MasukanStaf,
} from '../types';
import {
  INITIAL_USERS,
  INITIAL_POKJA,
  INITIAL_SURAT,
  INITIAL_SURAT_KELUAR,
  INITIAL_DISPOSISI,
  INITIAL_TINDAK_LANJUT,
  INITIAL_LOGS,
  INITIAL_NOTIFIKASI,
  INITIAL_MASUKAN_STAF,
  GOOGLE_DRIVE_FOLDER_URL,
} from '../data/initialData';
import {
  safeGetItem,
  safeSetItem,
  prepareSuratListForStorage,
  hydrateSuratListBlobs,
  prepareSuratKeluarListForStorage,
  hydrateSuratKeluarListBlobs,
  prepareTindakLanjutForStorage,
  prepareMasukanStafForStorage,
  cleanupStorageQuota,
} from '../utils/storage';
import { uploadDataUrlOrBlobToDrive } from '../services/googleDriveService';
import { getRomanMonth } from '../utils/helpers';
import {
  saveSuratToFirestore,
  deleteSuratFromFirestore,
  saveSuratKeluarToFirestore,
  deleteSuratKeluarFromFirestore,
  saveDisposisiToFirestore,
  deleteDisposisiFromFirestore,
  clearSuratAndDisposisiFromFirestore,
  saveTindakLanjutToFirestore,
  saveMasukanStafToFirestore,
  saveUserToFirestore,
  savePokjaToFirestore,
  ensurePokjasSeeded,
  saveLogToFirestore,
  saveNotifikasiToFirestore,
  subscribeToCollection,
  seedFirestoreIfEmpty,
} from '../services/firestoreSync';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  pokjas: Pokja[];
  suratList: Surat[];
  suratKeluarList: SuratKeluar[];
  disposisiList: Disposisi[];
  tindakLanjutList: TindakLanjut[];
  logs: LogAktivitas[];
  notifikasi: Notifikasi[];
  masukanStafList: MasukanStaf[];
  whatsAppQueue: WhatsAppNotification[];
  lastWhatsAppSent: WhatsAppNotification | null;
  setLastWhatsAppSent: (wa: WhatsAppNotification | null) => void;
  // Cloud sync state
  isCloudSyncActive: boolean;
  lastSyncTime: string | null;
  // Sidebar state
  isSidebarCollapsed: boolean;
  setIsSidebarCollapsed: React.Dispatch<React.SetStateAction<boolean>>;
  toggleSidebarCollapsed: () => void;
  // Actions
  addSurat: (
    data: {
      nomorSurat: string;
      asalSurat: string;
      perihal: string;
      tanggalSurat: string;
      kategori: 'Undangan' | 'Surat' | 'Tembusan';
      tanggalDisposisiMasuk: string;
      narasiDisposisiKadis: string;
      fileName: string;
      fileSize: string;
      filePdf?: string;
      googleDriveUrl?: string;
    },
    agendaData?: {
      namaAcara: string;
      tanggalAcara: string;
      waktuAcara: string;
      tempatAcara: string;
      keterangan: string;
    }
  ) => Surat;
  // Surat Keluar Actions
  addSuratKeluar: (data: {
    perihal: string;
    tujuanSurat: string;
    tanggalSurat: string;
    keterangan?: string;
    fileName?: string;
    fileSize?: string;
    filePdf?: string;
    googleDriveUrl?: string;
  }) => SuratKeluar;
  deleteSuratKeluar: (id: string) => void;
  getNextNomorSuratKeluar: (tanggalSuratOrYear?: string | number) => {
    nomorSurat: string;
    nomorUrut: number;
    tahun: number;
    bulanRomawi?: string;
  };
  disposisiKabid: (
    suratId: string,
    targetPokjaIds: string[],
    narasi: string,
    prioritas?: DisposisiPrioritas,
    batasWaktu?: string
  ) => boolean | void;
  disposisiKetuaPokja: (
    suratId: string,
    targetStafIds: string[],
    narasi: string,
    prioritas: DisposisiPrioritas,
    batasWaktu?: string
  ) => boolean | void;
  inputDisposisi: (data: {
    suratId: string;
    level: 'kabid_ke_pokja' | 'pokja_ke_staf';
    targetPokjaIds?: string[];
    targetStafIds?: string[];
    narasi: string;
    prioritas: DisposisiPrioritas;
    batasWaktu?: string;
  }) => boolean | void;
  tindakLanjutStaf: (
    suratId: string,
    disposisiId: string,
    jenis: TindakLanjutJenis,
    data: {
      catatan: string;
      progresStatus?: ProgresStatus;
      progresPersen?: number;
      namaLampiran?: string;
      kehadiran?: 'Hadir' | 'Tidak Hadir';
      alasanTidakHadir?: string;
      tanggalSelesai?: string;
    }
  ) => void;
  // Masukan Staf
  addMasukanStaf: (data: {
    suratId: string;
    disposisiId?: string;
    judulMasukan: string;
    isiMasukan: string;
    saranRekomendasi: string;
    lampiranNama?: string;
    lampiranDataUrl?: string;
  }) => MasukanStaf;
  tanggapiMasukanStaf: (
    id: string,
    tanggapan: string,
    status: 'Disetujui Ketua Pokja' | 'Diteruskan ke Kabid' | 'Selesai'
  ) => void;
  arsipkanSurat: (suratId: string, catatanArsip: string) => void;
  deleteSurat: (suratId: string) => void;
  editSurat: (suratId: string, updatedData: Partial<Surat>) => Promise<Surat | null>;
  editDisposisi: (disposisiId: string, updatedData: Partial<Disposisi>) => Promise<Disposisi | null>;
  deleteDisposisi: (disposisiId: string) => Promise<boolean>;
  clearAllSuratAndDisposisi: () => Promise<void>;
  updateSuratPdf: (suratId: string, filePdf: string, fileName: string, fileSize: string) => void;
  // User Management
  addUser: (user: Omit<User, 'id'>) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  toggleUserStatus: (id: string) => void;
  assignPokja: (userId: string, pokjaId: string) => void;
  updateStafPokja: (userId: string, pokjaId: string, catatanMutasi?: string) => void;
  changeKetuaPokja: (pokjaId: string, newKetuaUserId: string) => void;
  updatePokja: (pokjaId: string, data: Partial<Pokja>) => void;
  // Notifications
  markNotificationAsRead: (id: string) => void;
  markAllNotificationsAsRead: () => void;
  // Helper getters
  getStafByPokja: (pokjaId: string, onlyActive?: boolean) => User[];
  getKetuaByPokja: (pokjaId: string) => User | undefined;
  getPokjaById: (id: string) => Pokja | undefined;
  getUserById: (id: string) => User | undefined;
  getDisposisiForUser: (userId: string) => Disposisi[];
  getSuratVisibleForUser: (user: User) => Surat[];
  resetAllData: () => void;
  addLog: (suratId: string | undefined, aktivitas: string, keterangan: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USERS: 'disperakim_users_v1',
  POKJAS: 'disperakim_pokjas_v1',
  SURAT: 'disperakim_surat_v1',
  SURAT_KELUAR: 'disperakim_surat_keluar_v1',
  DISPOSISI: 'disperakim_disposisi_v1',
  TINDAK_LANJUT: 'disperakim_tindak_lanjut_v1',
  LOGS: 'disperakim_logs_v1',
  NOTIFIKASI: 'disperakim_notifikasi_v1',
  MASUKAN_STAF: 'disperakim_masukan_staf_v1',
  CURRENT_USER_ID: 'disperakim_current_user_id_v1',
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load from local storage or initial with automatic migration
  const [users, setUsers] = useState<User[]>(() => {
    const saved = safeGetItem(STORAGE_KEYS.USERS);
    if (!saved) return INITIAL_USERS;
    try {
      const parsed: User[] = JSON.parse(saved);
      // Migrate Kadis, Super Admin, and Marsudi
      let hasSuperadmin = false;
      const updated: User[] = parsed.map((u): User => {
        if (u.id === 'staf-3' || u.nama.includes('Marsudi')) {
          hasSuperadmin = true;
          return {
            ...u,
            nama: 'Marsudi, SH',
            nip: '197008141991031005',
            jabatan: 'Penyusun Bahan Fasilitasi Pertanahan & Super Administrator',
            role: 'super_admin',
            pokjaId: 'pokja-1',
            email: 'marsudi.sh@jatengprov.go.id',
            password: '197008141991031005',
            status: 'active',
          };
        }
        if (u.id === 'user-kadis' || u.role === 'kadis') {
          return {
            ...u,
            nama: 'Boedyo Dharmawan, S.T., MT.',
            nip: '196910121998031003',
            nomorWhatsapp: '082226434729',
            email: 'boedyo.dharmawan@jatengprov.go.id',
            password: u.password || u.nip.replace(/\s+/g, ''),
          };
        }
        if (u.id === 'user-superadmin' || u.role === 'super_admin') {
          hasSuperadmin = true;
          return {
            ...u,
            nip: '197008141991031005',
            password: 'disperakim123',
          };
        }
        return {
          ...u,
          password: u.password || u.nip.replace(/\s+/g, ''),
        };
      });
      if (!hasSuperadmin) {
        updated.unshift(INITIAL_USERS[0]);
      }
      return updated;
    } catch {
      return INITIAL_USERS;
    }
  });

  const [pokjas, setPokjas] = useState<Pokja[]>(() => {
    const saved = safeGetItem(STORAGE_KEYS.POKJAS);
    return saved ? JSON.parse(saved) : INITIAL_POKJA;
  });

  const isLegacyDummySurat = (id: string) => ['surat-1', 'surat-2', 'surat-3', 'surat-4', 'surat-5'].includes(id);
  const isLegacyDummyDisp = (id: string) =>
    ['disp-1', 'disp-2', 'disp-3', 'disp-4', 'disp-5', 'disp-6', 'disp-staf-1', 'disp-staf-2', 'disp-staf-3'].includes(id);

  const [suratList, setSuratList] = useState<Surat[]>(() => {
    const saved = safeGetItem(STORAGE_KEYS.SURAT);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((s) => s && !isLegacyDummySurat(s.id))
            .map((s) => ({
              ...s,
              assignedPokjaIds: Array.isArray(s.assignedPokjaIds) ? s.assignedPokjaIds : [],
            }));
        }
      } catch (e) {
        console.error('Failed to parse saved surat list:', e);
      }
    }
    return INITIAL_SURAT;
  });

  const [suratKeluarList, setSuratKeluarList] = useState<SuratKeluar[]>(() => {
    const saved = safeGetItem(STORAGE_KEYS.SURAT_KELUAR);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        console.error('Failed to parse saved surat keluar list:', e);
      }
    }
    return INITIAL_SURAT_KELUAR;
  });

  const [disposisiList, setDisposisiList] = useState<Disposisi[]>(() => {
    const saved = safeGetItem(STORAGE_KEYS.DISPOSISI);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed
            .filter((d) => d && !isLegacyDummyDisp(d.id))
            .map((d) => ({
              ...d,
              dariNama: d.dariNama || d.dariUserNama || '',
              kepadaNama: d.kepadaNama || d.kepadaUserNama || '',
              dariUserNama: d.dariUserNama || d.dariNama || '',
              kepadaUserNama: d.kepadaUserNama || d.kepadaNama || '',
            }));
        }
      } catch (e) {
        console.error('Failed to parse saved disposisi list:', e);
      }
    }
    return INITIAL_DISPOSISI;
  });

  const [tindakLanjutList, setTindakLanjutList] = useState<TindakLanjut[]>(() => {
    const saved = safeGetItem(STORAGE_KEYS.TINDAK_LANJUT);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((t) => t && t.id !== 'tl-1');
        }
      } catch (e) {}
    }
    return INITIAL_TINDAK_LANJUT;
  });

  const [logs, setLogs] = useState<LogAktivitas[]>(() => {
    const saved = safeGetItem(STORAGE_KEYS.LOGS);
    return saved ? JSON.parse(saved) : INITIAL_LOGS;
  });

  const [notifikasi, setNotifikasi] = useState<Notifikasi[]>(() => {
    const saved = safeGetItem(STORAGE_KEYS.NOTIFIKASI);
    return saved ? JSON.parse(saved) : INITIAL_NOTIFIKASI;
  });

  const [masukanStafList, setMasukanStafList] = useState<MasukanStaf[]>(() => {
    const saved = safeGetItem(STORAGE_KEYS.MASUKAN_STAF);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          return parsed.filter((m) => m && !['masukan-1', 'masukan-2'].includes(m.id));
        }
      } catch (e) {}
    }
    return INITIAL_MASUKAN_STAF;
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const saved = safeGetItem('disperakim_sidebar_collapsed_v1');
    return saved === 'true';
  });

  const toggleSidebarCollapsed = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      safeSetItem('disperakim_sidebar_collapsed_v1', String(next));
      return next;
    });
  };

  const [whatsAppQueue, setWhatsAppQueue] = useState<WhatsAppNotification[]>([]);
  const [lastWhatsAppSent, setLastWhatsAppSent] = useState<WhatsAppNotification | null>(null);

  // Cloud Real-Time Sync Status
  const [isCloudSyncActive, setIsCloudSyncActive] = useState<boolean>(true);
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);

  // Active User: defaults to Hindrawan (or previous stored user)
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const savedId = safeGetItem(STORAGE_KEYS.CURRENT_USER_ID);
    if (savedId) {
      const found = users.find((u) => u.id === savedId);
      if (found) return found;
    }
    // Default to Hindrawan Budiarto, S.Tr.IP (staf-1)
    return users.find((u) => u.id === 'staf-1') || users[0];
  });

  // REAL-TIME CLOUD FIRESTORE SYNCHRONIZATION
  // Memastikan sistem selalu update data terbaru secara real-time pada saat di-publish
  // dan dapat diakses oleh user-user secara up to date lintas perangkat dan peramban
  useEffect(() => {
    let isMounted = true;

    // 1. Inisialisasi awal jika database Firestore masih kosong
    seedFirestoreIfEmpty({
      pokjas: INITIAL_POKJA,
      users: INITIAL_USERS,
      surat: INITIAL_SURAT,
      suratKeluar: INITIAL_SURAT_KELUAR,
      disposisi: INITIAL_DISPOSISI,
      tindakLanjut: INITIAL_TINDAK_LANJUT,
      masukanStaf: INITIAL_MASUKAN_STAF,
      logs: INITIAL_LOGS,
      notifikasi: INITIAL_NOTIFIKASI,
    })
      .then(() => {
        if (isMounted) {
          setIsCloudSyncActive(true);
          setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
        }
      })
      .catch((err) => {
        console.warn('Inisialisasi Firestore warning:', err);
      });

    // Pastikan koleksi Pokja terinisialisasi di Cloud Firestore
    ensurePokjasSeeded(INITIAL_POKJA).catch(() => {});

    // 2. Listener Real-Time Firestore (onSnapshot)
    const unsubPokjas = subscribeToCollection<Pokja>('pokjas', (items) => {
      if (!isMounted || !items) return;
      if (items.length > 0) {
        setIsCloudSyncActive(true);
        setPokjas(items);
      }
    });

    const unsubSurat = subscribeToCollection<Surat>('surat', (items) => {
      if (!isMounted || !items) return;
      setIsCloudSyncActive(true);
      setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
      const validItems = items.filter((s) => s && !isLegacyDummySurat(s.id));
      setSuratList((prev) => {
        return validItems.map((item) => {
          const old = prev.find((p) => p.id === item.id);
          if (old?.filePdf && (!item.filePdf || item.filePdf.startsWith('idb:'))) {
            return { ...item, filePdf: old.filePdf };
          }
          return item;
        }).sort((a, b) => b.id.localeCompare(a.id));
      });
    });

    const unsubSuratKeluar = subscribeToCollection<SuratKeluar>('surat_keluar', (items) => {
      if (!isMounted || !items) return;
      setIsCloudSyncActive(true);
      setLastSyncTime(new Date().toLocaleTimeString('id-ID'));
      setSuratKeluarList(items.sort((a, b) => (b.nomorUrut || 0) - (a.nomorUrut || 0)));
    });

    const unsubDisposisi = subscribeToCollection<Disposisi>('disposisi', (items) => {
      if (!isMounted || !items) return;
      setIsCloudSyncActive(true);
      const validItems = items.filter((d) => d && !isLegacyDummyDisp(d.id));
      setDisposisiList(validItems.sort((a, b) => b.id.localeCompare(a.id)));
    });

    const unsubTindakLanjut = subscribeToCollection<TindakLanjut>('tindak_lanjut', (items) => {
      if (!isMounted || !items) return;
      setIsCloudSyncActive(true);
      setTindakLanjutList(items.filter((t) => t && t.id !== 'tl-1'));
    });

    const unsubMasukanStaf = subscribeToCollection<MasukanStaf>('masukan_staf', (items) => {
      if (!isMounted || !items) return;
      setIsCloudSyncActive(true);
      setMasukanStafList(items.filter((m) => m && !['masukan-1', 'masukan-2'].includes(m.id)));
    });

    const unsubUsers = subscribeToCollection<User>('users', (items) => {
      if (!isMounted || !items) return;
      if (items.length > 0) {
        setIsCloudSyncActive(true);
        setUsers(items);
      }
    });

    const unsubLogs = subscribeToCollection<LogAktivitas>('logs', (items) => {
      if (!isMounted || !items || items.length === 0) return;
      setIsCloudSyncActive(true);
      setLogs(items);
    });

    const unsubNotif = subscribeToCollection<Notifikasi>('notifikasi', (items) => {
      if (!isMounted || !items || items.length === 0) return;
      setIsCloudSyncActive(true);
      setNotifikasi(items);
    });

    return () => {
      isMounted = false;
      unsubPokjas();
      unsubSurat();
      unsubSuratKeluar();
      unsubDisposisi();
      unsubTindakLanjut();
      unsubMasukanStaf();
      unsubUsers();
      unsubLogs();
      unsubNotif();
    };
  }, []);

  // Sync state to local storage with quota protection & IndexedDB offloading
  useEffect(() => {
    safeSetItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.POKJAS, JSON.stringify(pokjas));
  }, [pokjas]);

  useEffect(() => {
    const prepared = prepareSuratListForStorage(suratList);
    safeSetItem(STORAGE_KEYS.SURAT, JSON.stringify(prepared));
  }, [suratList]);

  useEffect(() => {
    const prepared = prepareSuratKeluarListForStorage(suratKeluarList);
    safeSetItem(STORAGE_KEYS.SURAT_KELUAR, JSON.stringify(prepared));
  }, [suratKeluarList]);

  // Asynchronously hydrate blobs for scanned files / PDFs from IndexedDB
  useEffect(() => {
    let isMounted = true;
    hydrateSuratListBlobs(suratList).then((hydrated) => {
      if (!isMounted) return;
      const hasDiff = hydrated.some((h, i) => h.filePdf !== suratList[i]?.filePdf);
      if (hasDiff) {
        setSuratList(hydrated);
      }
    });
    hydrateSuratKeluarListBlobs(suratKeluarList).then((hydrated) => {
      if (!isMounted) return;
      const hasDiff = hydrated.some((h, i) => h.filePdf !== suratKeluarList[i]?.filePdf);
      if (hasDiff) {
        setSuratKeluarList(hydrated);
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.DISPOSISI, JSON.stringify(disposisiList));
  }, [disposisiList]);

  useEffect(() => {
    const prepared = prepareTindakLanjutForStorage(tindakLanjutList);
    safeSetItem(STORAGE_KEYS.TINDAK_LANJUT, JSON.stringify(prepared));
  }, [tindakLanjutList]);

  useEffect(() => {
    // Cap logs to 50 items to keep storage lightweight
    safeSetItem(STORAGE_KEYS.LOGS, JSON.stringify(logs.slice(0, 50)));
  }, [logs]);

  useEffect(() => {
    // Cap notifications to 50 items
    safeSetItem(STORAGE_KEYS.NOTIFIKASI, JSON.stringify(notifikasi.slice(0, 50)));
  }, [notifikasi]);

  useEffect(() => {
    const prepared = prepareMasukanStafForStorage(masukanStafList);
    safeSetItem(STORAGE_KEYS.MASUKAN_STAF, JSON.stringify(prepared));
  }, [masukanStafList]);

  useEffect(() => {
    safeSetItem(STORAGE_KEYS.CURRENT_USER_ID, currentUser.id);
  }, [currentUser]);

  // Helper log generator
  const addLog = (suratId: string | undefined, aktivitas: string, keterangan: string) => {
    const newLog: LogAktivitas = {
      id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      suratId,
      userId: currentUser.id,
      namaUser: currentUser.nama,
      jabatanUser: currentUser.jabatan,
      aktivitas,
      keterangan,
      userNama: currentUser.nama,
      userRole: currentUser.role,
      aksi: aktivitas,
      deskripsi: keterangan,
      createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
    };
    setLogs((prev) => [newLog, ...prev]);
    saveLogToFirestore(newLog).catch(() => {});
  };

  // Helper WhatsApp sender simulator
  const sendWhatsAppNotification = (
    penerimaUser: User,
    pesan: string,
    suratId: string
  ) => {
    const token = Math.random().toString(36).substring(2, 12);
    const waItem: WhatsAppNotification = {
      id: `wa-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      penerimaNomor: penerimaUser.nomorWhatsapp || '081234567890',
      penerimaNama: penerimaUser.nama,
      pesan,
      suratId,
      linkToken: token,
      waktuKirim: new Date().toISOString().replace('T', ' ').substring(0, 16),
      status: 'Terkirim',
    };
    setWhatsAppQueue((prev) => [waItem, ...prev]);
    setLastWhatsAppSent(waItem);
  };

  // Getters
  const getUserById = (id: string) => users.find((u) => u.id === id);
  const getPokjaById = (id: string) => pokjas.find((p) => p.id === id);

  const getStafByPokja = (pokjaId: string, onlyActive: boolean = true) => {
    return users.filter(
      (u) =>
        (u.role === 'staf_pokja' || u.id === 'staf-3' || (u.pokjaId === pokjaId && u.nama.includes('Marsudi'))) &&
        u.pokjaId === pokjaId &&
        (!onlyActive || u.status === 'active')
    );
  };

  const getKetuaByPokja = (pokjaId: string) => {
    const pokja = pokjas.find((p) => p.id === pokjaId);
    if (!pokja) return undefined;
    return users.find((u) => u.id === pokja.ketuaId && u.status === 'active');
  };

  const getDisposisiForUser = (userId: string) => {
    return disposisiList.filter((d) => d.kepadaUserId === userId);
  };

  // Visibility filtering rule:
  // - Super Admin & Admin: All surat
  // - Kabid: All surat that reached Kabid (or all)
  // - Ketua Pokja: Only surat assigned to their Pokja
  // - Staf: Only surat they have a Disposisi or TindakLanjut for
  const getSuratVisibleForUser = (user: User): Surat[] => {
    if (!user) return suratList;
    if (user.role === 'super_admin' || user.role === 'admin_pertanahan' || user.role === 'kadis' || user.role === 'kabid') {
      return suratList;
    }
    if (user.role === 'ketua_pokja' && user.pokjaId) {
      return suratList.filter(
        (s) =>
          (Array.isArray(s.assignedPokjaIds) && s.assignedPokjaIds.includes(user.pokjaId!)) ||
          disposisiList.some(
            (d) => d.suratId === s.id && (d.kepadaUserId === user.id || d.pokjaId === user.pokjaId)
          )
      );
    }
    if (user.role === 'staf_pokja') {
      return suratList.filter((s) =>
        disposisiList.some((d) => d.suratId === s.id && d.kepadaUserId === user.id)
      );
    }
    return suratList;
  };

  // ACTION: Input Surat Masuk
  const addSurat = (
    data: {
      nomorSurat: string;
      asalSurat: string;
      perihal: string;
      tanggalSurat: string;
      kategori: 'Undangan' | 'Surat' | 'Tembusan';
      tanggalDisposisiMasuk: string;
      narasiDisposisiKadis: string;
      fileName: string;
      fileSize: string;
      filePdf?: string;
      googleDriveUrl?: string;
    },
    agendaData?: {
      namaAcara: string;
      tanggalAcara: string;
      waktuAcara: string;
      tempatAcara: string;
      keterangan: string;
    }
  ): Surat => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const count = suratList.length + 1;
    const yearMonth = new Date().toISOString().slice(0, 7).replace('-', '/');
    const nomorAgenda = `AGD/${yearMonth}/${String(count).padStart(3, '0')}`;
    const id = `surat-${Date.now()}`;

    let agenda: Agenda | undefined;
    if (data.kategori === 'Undangan' && agendaData) {
      agenda = {
        id: `agenda-${Date.now()}`,
        suratId: id,
        namaAcara: agendaData.namaAcara,
        tanggalAcara: agendaData.tanggalAcara,
        waktuAcara: agendaData.waktuAcara,
        tempatAcara: agendaData.tempatAcara,
        keterangan: agendaData.keterangan,
      };
    }

    const newSurat: Surat = {
      id,
      nomorAgenda,
      nomorSurat: data.nomorSurat,
      asalSurat: data.asalSurat,
      perihal: data.perihal,
      tanggalSurat: data.tanggalSurat,
      kategori: data.kategori,
      tanggalDisposisiMasuk: data.tanggalDisposisiMasuk,
      narasiDisposisiKadis: data.narasiDisposisiKadis,
      filePdf: data.filePdf || '#',
      fileName: data.fileName || 'dokumen_surat.pdf',
      fileSize: data.fileSize || '1.2 MB',
      googleDriveUrl: data.googleDriveUrl || GOOGLE_DRIVE_FOLDER_URL,
      status: data.narasiDisposisiKadis && data.narasiDisposisiKadis.trim() ? 'Menunggu Disposisi Kabid' : 'Surat Baru',
      agenda,
      assignedPokjaIds: [],
      createdBy: currentUser.nama,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    // Auto-save uploaded document to Google Drive folder (Req 3)
    if (data.filePdf && data.filePdf !== '#' && !data.filePdf.startsWith('http')) {
      uploadDataUrlOrBlobToDrive(data.filePdf, newSurat.fileName).catch(() => {});
    }

    setSuratList((prev) => [newSurat, ...prev]);
    saveSuratToFirestore(newSurat).catch(() => {});

    // Add log
    addLog(
      id,
      'Input Surat Masuk',
      `Surat nomor ${data.nomorSurat} perihal "${data.perihal}" diinput oleh ${currentUser.nama}.${data.narasiDisposisiKadis ? ` Disposisi Kadis: "${data.narasiDisposisiKadis}"` : ' (Input Surat Masuk tanpa Disposisi Kadis)'}`
    );

    // Notify Kabid if disposition is ready, or notify admin if fresh
    const kabid = users.find((u) => u.role === 'kabid');
    if (kabid) {
      const notif: Notifikasi = {
        id: `notif-${Date.now()}`,
        userId: kabid.id,
        suratId: id,
        judul: data.narasiDisposisiKadis ? 'Surat Masuk Baru Menunggu Disposisi' : 'Surat Masuk Baru Tercatat',
        pesan: `Surat dari ${data.asalSurat} (${data.nomorSurat}) perihal: "${data.perihal}" siap ditindaklanjuti.`,
        jenis: 'surat_baru',
        statusBaca: false,
        createdAt: timestamp,
      };
      setNotifikasi((prev) => [notif, ...prev]);
      saveNotifikasiToFirestore(notif).catch(() => {});
    }

    return newSurat;
  };

  // ACTION: Penomoran Surat Keluar Bidang Pertanahan
  // Format nomor otomatis: (Nomor urut 4 digit)/Bid III/(Bulan dalam bentuk Romawi)/(Tahun)
  const getNextNomorSuratKeluar = (tanggalSuratOrYear?: string | number) => {
    let validYear = new Date().getFullYear();
    let validDateStr: string | undefined = undefined;

    if (typeof tanggalSuratOrYear === 'number' && !isNaN(tanggalSuratOrYear)) {
      validYear = tanggalSuratOrYear;
    } else if (typeof tanggalSuratOrYear === 'string') {
      validDateStr = tanggalSuratOrYear;
      const parsedYear = new Date(tanggalSuratOrYear).getFullYear();
      if (!isNaN(parsedYear)) {
        validYear = parsedYear;
      }
    }

    const romanMonth = getRomanMonth(validDateStr || new Date());

    // Filter existing surat keluar for that specific year
    const listForYear = suratKeluarList.filter((sk) => {
      if (sk.tahun === validYear) return true;
      if (sk.tanggalSurat && sk.tanggalSurat.startsWith(String(validYear))) return true;
      if (sk.nomorSurat && sk.nomorSurat.endsWith(`/${validYear}`)) return true;
      return false;
    });

    let maxUrut = 0;
    listForYear.forEach((sk) => {
      if (sk.nomorUrut && sk.nomorUrut > maxUrut) {
        maxUrut = sk.nomorUrut;
      } else if (sk.nomorSurat) {
        const match = sk.nomorSurat.match(/^(\d+)\/Bid III/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxUrut) {
            maxUrut = num;
          }
        }
      }
    });

    const nextUrut = maxUrut + 1;
    const formattedUrut = String(nextUrut).padStart(4, '0');
    // Format: (Nomor urut 4 digit)/Bid III/(Bulan dalam bentuk Romawi)/(Tahun)
    const nomorSurat = `${formattedUrut}/Bid III/${romanMonth}/${validYear}`;

    return {
      nomorSurat,
      nomorUrut: nextUrut,
      tahun: validYear,
      bulanRomawi: romanMonth,
    };
  };

  const addSuratKeluar = (data: {
    perihal: string;
    tujuanSurat: string;
    tanggalSurat: string;
    keterangan?: string;
    fileName?: string;
    fileSize?: string;
    filePdf?: string;
    googleDriveUrl?: string;
  }): SuratKeluar => {
    const numbering = getNextNomorSuratKeluar(data.tanggalSurat);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newSuratKeluar: SuratKeluar = {
      id: `sk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      nomorSurat: numbering.nomorSurat,
      nomorUrut: numbering.nomorUrut,
      tahun: numbering.tahun,
      perihal: data.perihal.trim(),
      tujuanSurat: data.tujuanSurat.trim(),
      tanggalSurat: data.tanggalSurat,
      keterangan: data.keterangan?.trim() || '',
      filePdf: data.filePdf,
      fileName: data.fileName || `Surat_Keluar_${numbering.nomorSurat.replace(/[/\\?%*:|"<>]/g, '_')}.pdf`,
      fileSize: data.fileSize || '1.0 MB',
      googleDriveUrl: data.googleDriveUrl || GOOGLE_DRIVE_FOLDER_URL,
      createdBy: currentUser.nama,
      createdById: currentUser.id,
      createdByNip: currentUser.nip,
      createdByJabatan: currentUser.jabatan,
      createdAt: nowStr,
      updatedAt: nowStr,
    };

    // Auto-save uploaded document to Google Drive folder (Req 3)
    if (data.filePdf && !data.filePdf.startsWith('http')) {
      uploadDataUrlOrBlobToDrive(data.filePdf, newSuratKeluar.fileName || 'Surat_Keluar.pdf').catch(() => {});
    }

    setSuratKeluarList((prev) => [newSuratKeluar, ...prev]);
    saveSuratKeluarToFirestore(newSuratKeluar).catch(() => {});

    addLog(
      undefined,
      'Penomoran Surat Keluar',
      `Nomor surat keluar ${newSuratKeluar.nomorSurat} diterbitkan oleh ${currentUser.nama} untuk tujuan ${newSuratKeluar.tujuanSurat} perihal "${newSuratKeluar.perihal}"`
    );

    return newSuratKeluar;
  };

  const deleteSuratKeluar = (id: string) => {
    const target = suratKeluarList.find((sk) => sk.id === id);
    setSuratKeluarList((prev) => prev.filter((sk) => sk.id !== id));
    deleteSuratKeluarFromFirestore(id).catch(() => {});
    addLog(
      undefined,
      'Hapus Nomor Surat Keluar',
      `Nomor surat keluar ${target?.nomorSurat || id} dihapus oleh ${currentUser.nama}.`
    );
  };

  // ACTION: Disposisi Kepala Bidang Pertanahan
  // ACTION: Disposisi Kabid ke Pokja (Dapat juga dilakukan oleh Kadis / Admin / Super Admin)
  const disposisiKabid = (
    suratId: string,
    targetPokjaIds: string[],
    narasi: string,
    prioritas: DisposisiPrioritas = 'Normal',
    batasWaktu?: string
  ): boolean => {
    try {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const targetSurat = suratList.find((s) => s.id === suratId);
      if (!targetSurat) {
        console.error('Surat tidak ditemukan untuk disposisi:', suratId);
        return false;
      }

      const newDisposisiList: Disposisi[] = [];

      targetPokjaIds.forEach((pokjaId) => {
        const pokja = pokjas.find((p) => p.id === pokjaId);
        let ketua = pokja ? users.find((u) => u.id === pokja.ketuaId) : undefined;
        if (!ketua && pokja) {
          ketua = users.find((u) => u.role === 'ketua_pokja' && u.pokjaId === pokjaId);
        }
        if (!ketua) {
          ketua = {
            id: `ketua-${pokjaId}`,
            nip: '-',
            nama: pokja ? `Ketua ${pokja.nama}` : 'Ketua Pokja',
            email: 'ketua@disperakim.jatengprov.go.id',
            jabatan: pokja ? `Ketua ${pokja.nama}` : 'Ketua Pokja',
            role: 'ketua_pokja',
            pokjaId,
            status: 'active',
            nomorWhatsapp: '081234567890',
          };
        }

        const dispId = `disp-${Date.now()}-${pokjaId}-${Math.random().toString(36).substring(2, 6)}`;
        const disp: Disposisi = {
          id: dispId,
          suratId,
          dariUserId: currentUser.id,
          dariNama: currentUser.nama,
          dariJabatan: currentUser.jabatan,
          dariUserNama: currentUser.nama,
          kepadaUserId: ketua.id,
          kepadaNama: ketua.nama,
          kepadaJabatan: ketua.jabatan,
          kepadaUserNama: ketua.nama,
          pokjaId,
          narasi,
          prioritas,
          batasWaktu: batasWaktu || '',
          status: 'Terkirim',
          tanggalDisposisi: timestamp,
          level: 'kabid_ke_pokja',
        };
        newDisposisiList.push(disp);

        // In-app Notification for each Ketua Pokja
        try {
          const notif: Notifikasi = {
            id: `notif-${Date.now()}-${ketua.id}`,
            userId: ketua.id,
            suratId,
            judul: 'Disposisi Baru dari Kepala Bidang',
            pesan: `Perihal: "${targetSurat.perihal}". Instruksi: "${narasi}"`,
            jenis: 'disposisi_baru',
            statusBaca: false,
            createdAt: timestamp,
          };
          setNotifikasi((prev) => [notif, ...(Array.isArray(prev) ? prev : [])]);
        } catch (e) {
          console.warn('Gagal mencatat notifikasi:', e);
        }

        // WhatsApp Notification to Ketua Pokja
        try {
          const waMsg = `Yth. Bapak/Ibu ${ketua.nama} (${ketua.jabatan}),\n\nTerdapat surat/disposisi baru dari Kepala Bidang Pertanahan yang perlu ditindaklanjuti.\n\nNomor Surat: ${targetSurat.nomorSurat}\nTanggal Surat: ${targetSurat.tanggalSurat}\nPerihal: ${targetSurat.perihal}\n\nInstruksi:\n"${narasi}"\n\nBatas Waktu: ${batasWaktu || 'Sesuai SOP'}\n\nSilakan membuka sistem persuratan untuk menindaklanjuti dan mendisposisikan kepada staf.\n\nBuka Sistem: https://disperakim.jatengprov.go.id/disposisi?id=${suratId}&token=tok_${Date.now().toString(36)}`;
          sendWhatsAppNotification(ketua, waMsg, suratId);
        } catch (e) {
          console.warn('Gagal mengirim notifikasi WhatsApp:', e);
        }
      });

      // Update Disposisi list
      setDisposisiList((prev) => [...newDisposisiList, ...(Array.isArray(prev) ? prev : [])]);
      newDisposisiList.forEach((disp) => {
        saveDisposisiToFirestore(disp).catch(() => {});
      });

      // Update Surat state safely
      const existingAssigned = Array.isArray(targetSurat.assignedPokjaIds) ? targetSurat.assignedPokjaIds : [];
      const updatedAssignedPokjas = Array.from(
        new Set([...existingAssigned, ...targetPokjaIds])
      );
      const updatedSuratObj: Surat = {
        ...targetSurat,
        assignedPokjaIds: updatedAssignedPokjas,
        status: 'Menunggu Disposisi Ketua Pokja',
        updatedAt: timestamp,
      };
      setSuratList((prev) =>
        prev.map((s) => (s.id === suratId ? updatedSuratObj : s))
      );
      saveSuratToFirestore(updatedSuratObj).catch(() => {});

      try {
        const pokjaNames = targetPokjaIds
          .map((id) => pokjas.find((p) => p.id === id)?.nama)
          .filter(Boolean)
          .join(', ');

        addLog(
          suratId,
          'Disposisi Kepala Bidang',
          `Mendisposisikan surat ke [${pokjaNames}]. Prioritas: ${prioritas}. Instruksi: "${narasi}"`
        );
      } catch (e) {
        console.warn('Gagal mencatat log disposisi:', e);
      }
      return true;
    } catch (err) {
      console.error('Error in disposisiKabid:', err);
      return false;
    }
  };

  // ACTION: Disposisi Ketua Pokja ke Staf (Dapat juga dilakukan oleh Kabid / Admin / Super Admin / Kadis)
  const disposisiKetuaPokja = (
    suratId: string,
    targetStafIds: string[],
    narasi: string,
    prioritas: DisposisiPrioritas,
    batasWaktu?: string
  ): boolean => {
    try {
      const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
      const targetSurat = suratList.find((s) => s.id === suratId);
      if (!targetSurat) {
        console.error('Surat tidak ditemukan untuk disposisi staf:', suratId);
        return false;
      }

      // VALIDATION: Ensure all target staf belong to current user's Pokja (if ketua_pokja) or any active staff (if admin/kabid/kadis)
      let validStafList = users.filter((u) => {
        if (!targetStafIds.includes(u.id)) return false;
        if (currentUser.role === 'ketua_pokja' && currentUser.pokjaId) {
          return u.pokjaId === currentUser.pokjaId && u.status === 'active';
        }
        return u.status === 'active';
      });

      if (validStafList.length === 0) {
        validStafList = users.filter((u) => targetStafIds.includes(u.id));
      }

      if (validStafList.length === 0) {
        alert('Pilih staf pelaksana tugas disposisi!');
        return false;
      }

      const newDisposisiList: Disposisi[] = [];

      validStafList.forEach((staf) => {
        const dispId = `disp-staf-${Date.now()}-${staf.id}-${Math.random().toString(36).substring(2, 6)}`;
        const disp: Disposisi = {
          id: dispId,
          suratId,
          dariUserId: currentUser.id,
          dariNama: currentUser.nama,
          dariJabatan: currentUser.jabatan,
          dariUserNama: currentUser.nama,
          kepadaUserId: staf.id,
          kepadaNama: staf.nama,
          kepadaJabatan: staf.jabatan,
          kepadaUserNama: staf.nama,
          pokjaId: staf.pokjaId || currentUser.pokjaId || '',
          narasi,
          prioritas,
          batasWaktu: batasWaktu || '',
          status: 'Terkirim',
          tanggalDisposisi: timestamp,
          level: 'pokja_ke_staf',
        };
        newDisposisiList.push(disp);

        // In-app notification for each staf
        try {
          const notif: Notifikasi = {
            id: `notif-staf-${Date.now()}-${staf.id}`,
            userId: staf.id,
            suratId,
            judul: 'Tugas Disposisi Baru',
            pesan: `Disposisi dari ${currentUser.nama}: "${narasi}". Perihal: ${targetSurat.perihal}`,
            jenis: 'tugas_baru',
            statusBaca: false,
            createdAt: timestamp,
          };
          setNotifikasi((prev) => [notif, ...(Array.isArray(prev) ? prev : [])]);
        } catch (e) {
          console.warn('Gagal membuat notifikasi staf:', e);
        }

        // WhatsApp Notification to Staf
        try {
          const waMsg = `Yth. ${staf.nama},\n\nAnda menerima disposisi surat dari ${currentUser.jabatan}.\n\nNomor Surat: ${targetSurat.nomorSurat}\nPerihal: ${targetSurat.perihal}\n\nInstruksi:\n"${narasi}"\n\nBatas Waktu: ${batasWaktu || 'Segera'}\nPrioritas: ${prioritas}\n\nSilakan masuk ke Sistem Persuratan Bidang Pertanahan untuk menindaklanjuti disposisi:\nhttps://disperakim.jatengprov.go.id/staf/disposisi?id=${dispId}&token=tok_${Date.now().toString(36)}`;
          sendWhatsAppNotification(staf, waMsg, suratId);
        } catch (e) {
          console.warn('Gagal mengirim WhatsApp ke staf:', e);
        }
      });

      setDisposisiList((prev) => [...newDisposisiList, ...(Array.isArray(prev) ? prev : [])]);
      newDisposisiList.forEach((disp) => {
        saveDisposisiToFirestore(disp).catch(() => {});
      });

      // Update status surat to 'Sudah Didisposisikan ke Staf' and ensure assignedPokjaIds contains staf's pokja
      const existingAssigned = Array.isArray(targetSurat.assignedPokjaIds) ? targetSurat.assignedPokjaIds : [];
      const stafPokjaIds = validStafList.map((s) => s.pokjaId).filter(Boolean) as string[];
      const updatedAssigned = Array.from(new Set([...existingAssigned, ...stafPokjaIds]));

      const updatedSuratObj: Surat = {
        ...targetSurat,
        assignedPokjaIds: updatedAssigned,
        status: 'Sudah Didisposisikan ke Staf',
        updatedAt: timestamp,
      };

      setSuratList((prev) =>
        prev.map((s) => (s.id === suratId ? updatedSuratObj : s))
      );
      saveSuratToFirestore(updatedSuratObj).catch(() => {});

      try {
        const stafNames = validStafList.map((s) => s.nama).join(', ');
        addLog(
          suratId,
          'Disposisi ke Staf Pelaksana',
          `Mendisposisikan surat ke [${stafNames}]. Prioritas: ${prioritas}. Batas Waktu: ${batasWaktu || '-'}. Narasi: "${narasi}"`
        );
      } catch (e) {
        console.warn('Gagal mencatat log disposisi staf:', e);
      }
      return true;
    } catch (err) {
      console.error('Error in disposisiKetuaPokja:', err);
      return false;
    }
  };

  // ACTION: Tindak Lanjut Staf (Arsipkan, Kerjakan, Hadir/Tidak Hadir)
  const tindakLanjutStaf = (
    suratId: string,
    disposisiId: string,
    jenis: TindakLanjutJenis,
    data: {
      catatan: string;
      progresStatus?: ProgresStatus;
      progresPersen?: number;
      namaLampiran?: string;
      kehadiran?: 'Hadir' | 'Tidak Hadir';
      alasanTidakHadir?: string;
      tanggalSelesai?: string;
    }
  ) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const targetSurat = suratList.find((s) => s.id === suratId);
    if (!targetSurat) return;

    const lampiranList = data.namaLampiran
      ? [
          {
            id: `lamp-${Date.now()}`,
            namaFile: data.namaLampiran,
            tipe: 'application/pdf',
            ukuran: '850 KB',
            fileUrl: '#',
            uploadedBy: currentUser.nama,
            uploadedAt: timestamp,
          },
        ]
      : [];

    const newTL: TindakLanjut = {
      id: `tl-${Date.now()}`,
      suratId,
      disposisiId,
      userId: currentUser.id,
      namaUser: currentUser.nama,
      jenisTindakLanjut: jenis,
      catatan: data.catatan,
      progresStatus: data.progresStatus,
      progresPersen: data.progresPersen,
      lampiran: lampiranList,
      tanggalTindakLanjut: timestamp,
      tanggalSelesai: data.tanggalSelesai,
      kehadiran: data.kehadiran,
      alasanTidakHadir: data.alasanTidakHadir,
    };

    setTindakLanjutList((prev) => [newTL, ...prev]);
    saveTindakLanjutToFirestore(newTL).catch(() => {});

    // Update Disposisi status
    setDisposisiList((prev) =>
      prev.map((d) => {
        if (d.id === disposisiId) {
          const updatedDisp: Disposisi = {
            ...d,
            status: data.progresStatus === 'Selesai' || jenis === 'Arsipkan' ? 'Selesai' : 'Ditindaklanjuti',
          };
          saveDisposisiToFirestore(updatedDisp).catch(() => {});
          return updatedDisp;
        }
        return d;
      })
    );

    // Update Surat Status
    let nextSuratStatus = targetSurat.status;
    if (jenis === 'Arsipkan') {
      nextSuratStatus = 'Diarsipkan';
    } else if (jenis === 'Kerjakan') {
      if (data.progresStatus === 'Selesai') {
        nextSuratStatus = 'Selesai';
      } else if (data.progresStatus === 'Menunggu Verifikasi') {
        nextSuratStatus = 'Menunggu Verifikasi';
      } else {
        nextSuratStatus = 'Sedang Dikerjakan';
      }
    } else if (jenis === 'Hadir') {
      nextSuratStatus = 'Hadir';
    } else if (jenis === 'Tidak Hadir') {
      nextSuratStatus = 'Tidak Hadir';
    }

    // If attendance confirmed, update KehadiranList
    let updatedKehadiran = targetSurat.kehadiranList || [];
    if (jenis === 'Hadir' || jenis === 'Tidak Hadir') {
      updatedKehadiran = [
        ...updatedKehadiran.filter((k) => k.userId !== currentUser.id),
        {
          userId: currentUser.id,
          namaUser: currentUser.nama,
          status: jenis === 'Hadir' ? 'Hadir' : 'Tidak Hadir',
          alasan: data.alasanTidakHadir,
          timestamp,
        },
      ];
    }

    const updatedSuratObj: Surat = {
      ...targetSurat,
      status: nextSuratStatus,
      kehadiranList: updatedKehadiran,
      archivedAt: jenis === 'Arsipkan' ? timestamp : targetSurat.archivedAt,
      catatanArsip: jenis === 'Arsipkan' ? data.catatan : targetSurat.catatanArsip,
      updatedAt: timestamp,
    };

    setSuratList((prev) =>
      prev.map((s) => (s.id === suratId ? updatedSuratObj : s))
    );
    saveSuratToFirestore(updatedSuratObj).catch(() => {});

    addLog(
      suratId,
      `Tindak Lanjut: ${jenis}`,
      `${currentUser.nama} menindaklanjuti surat dengan opsi "${jenis}". Catatan: "${data.catatan}". Status: ${nextSuratStatus}`
    );
  };

  // ACTION: Arsipkan Surat langsung
  const arsipkanSurat = (suratId: string, catatanArsip: string) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const targetSurat = suratList.find((s) => s.id === suratId);
    if (targetSurat) {
      const updatedSuratObj: Surat = {
        ...targetSurat,
        status: 'Diarsipkan',
        archivedAt: timestamp,
        catatanArsip,
        updatedAt: timestamp,
      };
      setSuratList((prev) =>
        prev.map((s) => (s.id === suratId ? updatedSuratObj : s))
      );
      saveSuratToFirestore(updatedSuratObj).catch(() => {});
    }

    addLog(
      suratId,
      'Arsipkan Surat',
      `Surat berhasil diarsipkan oleh ${currentUser.nama}. Catatan: "${catatanArsip}"`
    );
  };

  // ACTION: Hapus Surat Permanen (Super Admin Only)
  const deleteSurat = (suratId: string) => {
    const target = suratList.find((s) => s.id === suratId);
    if (!target) return;

    setSuratList((prev) => prev.filter((s) => s.id !== suratId));
    setDisposisiList((prev) => prev.filter((d) => d.suratId !== suratId));
    setTindakLanjutList((prev) => prev.filter((t) => t.suratId !== suratId));
    setMasukanStafList((prev) => prev.filter((m) => m.suratId !== suratId));
    setNotifikasi((prev) => prev.filter((n) => n.suratId !== suratId));

    deleteSuratFromFirestore(suratId).catch(() => {});

    addLog(
      undefined,
      'Hapus Surat Masuk',
      `Surat No. ${target.nomorSurat} (Agenda: ${target.nomorAgenda}, Perihal: ${target.perihal}) berhasil dihapus permanen oleh ${currentUser.nama}.`
    );
  };

  // ACTION: Edit Data Surat Masuk (Super Admin & Admin Pertanahan)
  const editSurat = async (suratId: string, updatedData: Partial<Surat>): Promise<Surat | null> => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const target = suratList.find((s) => s.id === suratId);
    if (!target) return null;

    const updatedSuratObj: Surat = {
      ...target,
      ...updatedData,
      updatedAt: timestamp,
    };

    // Update local state immediately
    setSuratList((prev) =>
      prev.map((s) => (s.id === suratId ? updatedSuratObj : s))
    );

    // Save to Firestore for live sync to all other users
    try {
      await saveSuratToFirestore(updatedSuratObj);
    } catch (e) {
      console.warn('Gagal menyimpan pembaruan surat ke Firestore:', e);
    }

    addLog(
      suratId,
      'Edit Data Surat Masuk',
      `Surat No. ${updatedSuratObj.nomorSurat} (${updatedSuratObj.nomorAgenda}) berhasil diedit oleh ${currentUser.nama}.`
    );

    return updatedSuratObj;
  };

  // ACTION: Edit Lembar Disposisi (Admin & Pimpinan)
  const editDisposisi = async (disposisiId: string, updatedData: Partial<Disposisi>): Promise<Disposisi | null> => {
    const target = disposisiList.find((d) => d.id === disposisiId);
    if (!target) return null;

    const updatedDispObj: Disposisi = {
      ...target,
      ...updatedData,
    };

    // Update local state immediately
    setDisposisiList((prev) =>
      prev.map((d) => (d.id === disposisiId ? updatedDispObj : d))
    );

    // Save to Firestore for live sync
    try {
      await saveDisposisiToFirestore(updatedDispObj);
    } catch (e) {
      console.warn('Gagal menyimpan pembaruan disposisi ke Firestore:', e);
    }

    addLog(
      updatedDispObj.suratId,
      'Edit Lembar Disposisi',
      `Disposisi untuk ${updatedDispObj.kepadaNama || updatedDispObj.kepadaUserNama} diedit oleh ${currentUser.nama}. Instruksi: "${updatedDispObj.narasi}"`
    );

    return updatedDispObj;
  };

  // ACTION: Hapus Lembar Disposisi (Admin & Pimpinan)
  const deleteDisposisi = async (disposisiId: string): Promise<boolean> => {
    const target = disposisiList.find((d) => d.id === disposisiId);
    if (!target) return false;

    setDisposisiList((prev) => prev.filter((d) => d.id !== disposisiId));
    try {
      await deleteDisposisiFromFirestore(disposisiId);
    } catch (e) {
      console.warn('Gagal menghapus disposisi dari Firestore:', e);
    }

    addLog(
      target.suratId,
      'Hapus Lembar Disposisi',
      `Disposisi untuk ${target.kepadaNama || target.kepadaUserNama} dihapus oleh ${currentUser.nama}.`
    );

    return true;
  };

  // ACTION: Kosongkan Seluruh Data Surat Masuk & Disposisi
  const clearAllSuratAndDisposisi = async (): Promise<void> => {
    setSuratList([]);
    setDisposisiList([]);
    setTindakLanjutList([]);
    setMasukanStafList([]);
    safeSetItem(STORAGE_KEYS.SURAT, JSON.stringify([]));
    safeSetItem(STORAGE_KEYS.DISPOSISI, JSON.stringify([]));
    safeSetItem(STORAGE_KEYS.TINDAK_LANJUT, JSON.stringify([]));
    safeSetItem(STORAGE_KEYS.MASUKAN_STAF, JSON.stringify([]));

    try {
      await clearSuratAndDisposisiFromFirestore();
    } catch (e) {
      console.warn('Gagal mengosongkan Firestore surat & disposisi:', e);
    }

    addLog(
      undefined,
      'Kosongkan Surat Masuk & Disposisi',
      `Seluruh data surat masuk dan lembar disposisi telah dikosongkan oleh ${currentUser.nama}.`
    );
  };

  // ACTION: Update / Ganti Berkas PDF Dokumen Asli Surat (Super Admin & Admin)
  const updateSuratPdf = (suratId: string, filePdf: string, fileName: string, fileSize: string) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const target = suratList.find((s) => s.id === suratId);
    if (target) {
      const updatedSuratObj: Surat = {
        ...target,
        filePdf,
        fileName,
        fileSize,
        updatedAt: timestamp,
      };
      setSuratList((prev) =>
        prev.map((s) => (s.id === suratId ? updatedSuratObj : s))
      );
      saveSuratToFirestore(updatedSuratObj).catch(() => {});
    }
    addLog(
      suratId,
      'Pembaruan Naskah Dokumen',
      `Naskah dokumen PDF asli ("${fileName}") berhasil diperbarui oleh ${currentUser.nama}`
    );
  };

  // ACTION: User Management
  const addUser = (userData: Omit<User, 'id'>) => {
    const newId = `user-${Date.now()}`;
    const newUser: User = {
      ...userData,
      id: newId,
    };
    setUsers((prev) => [...prev, newUser]);
    saveUserToFirestore(newUser).catch(() => {});
    addLog(
      undefined,
      'Tambah Pengguna Baru',
      `Admin menambahkan pengguna ${newUser.nama} (Jabatan: ${newUser.jabatan}, Role: ${newUser.role})`
    );
  };

  const updateUser = (id: string, data: Partial<User>) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === id) {
          const updatedUserObj = { ...u, ...data };
          saveUserToFirestore(updatedUserObj).catch(() => {});
          return updatedUserObj;
        }
        return u;
      })
    );
    // If updating current user
    if (currentUser.id === id) {
      setCurrentUser((prev) => ({ ...prev, ...data }));
    }
    // If updating a ketua pokja or pokja assignment
    if (data.role === 'ketua_pokja' && data.pokjaId) {
      setPokjas((prev) =>
        prev.map((p) => {
          if (p.id === data.pokjaId) {
            const updated = { ...p, ketuaId: id };
            savePokjaToFirestore(updated).catch(() => {});
            return updated;
          }
          return p;
        })
      );
    }
    const target = users.find((u) => u.id === id);
    const updatedName = data.nama || target?.nama || id;
    addLog(
      undefined,
      'Update Profil & Pejabat',
      `Profil pejabat/staf ${updatedName} (No. WA: ${data.nomorWhatsapp || target?.nomorWhatsapp || '-'}) diperbarui oleh ${currentUser.nama}.`
    );
  };

  const toggleUserStatus = (id: string) => {
    const target = users.find((u) => u.id === id);
    if (!target) return;
    const nextStatus = target.status === 'active' ? 'inactive' : 'active';
    updateUser(id, { status: nextStatus });
    addLog(
      undefined,
      'Ubah Status Pengguna',
      `Status pengguna ${target.nama} diubah menjadi ${nextStatus.toUpperCase()}.`
    );
  };

  const assignPokja = (userId: string, pokjaId: string) => {
    const target = users.find((u) => u.id === userId);
    const pokja = pokjas.find((p) => p.id === pokjaId);
    if (!target || !pokja) return;

    updateUser(userId, { pokjaId });
    addLog(
      undefined,
      'Mutasi Pokja Staf',
      `Staf ${target.nama} dipindahkan ke ${pokja.nama}.`
    );
  };

  const updateStafPokja = (userId: string, pokjaId: string, catatanMutasi?: string) => {
    const target = users.find((u) => u.id === userId);
    const pokja = pokjas.find((p) => p.id === pokjaId);
    if (!target || !pokja) return;

    updateUser(userId, { pokjaId });
    addLog(
      undefined,
      'Mutasi Pokja Staf',
      `Staf ${target.nama} dipindahkan ke ${pokja.nama}.${catatanMutasi ? ` Catatan: ${catatanMutasi}` : ''}`
    );
  };

  // ACTION: Generic / Unified Input Disposisi
  const inputDisposisi = (data: {
    suratId: string;
    level: 'kabid_ke_pokja' | 'pokja_ke_staf';
    targetPokjaIds?: string[];
    targetStafIds?: string[];
    narasi: string;
    prioritas: DisposisiPrioritas;
    batasWaktu?: string;
  }): boolean => {
    try {
      if (data.level === 'kabid_ke_pokja') {
        const res = disposisiKabid(
          data.suratId,
          data.targetPokjaIds || [],
          data.narasi,
          data.prioritas,
          data.batasWaktu
        );
        return res !== false;
      } else {
        const res = disposisiKetuaPokja(
          data.suratId,
          data.targetStafIds || [],
          data.narasi,
          data.prioritas,
          data.batasWaktu
        );
        return res !== false;
      }
    } catch (err) {
      console.error('Error in inputDisposisi:', err);
      return false;
    }
  };

  // ACTION: Masukan Staf
  const addMasukanStaf = (data: {
    suratId: string;
    disposisiId?: string;
    judulMasukan: string;
    isiMasukan: string;
    saranRekomendasi: string;
    lampiranNama?: string;
    lampiranDataUrl?: string;
  }): MasukanStaf => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    const targetSurat = suratList.find((s) => s.id === data.suratId);
    const userPokja = pokjas.find((p) => p.id === currentUser.pokjaId);

    const newMasukan: MasukanStaf = {
      id: `masukan-${Date.now()}`,
      suratId: data.suratId,
      disposisiId: data.disposisiId,
      stafId: currentUser.id,
      stafNama: currentUser.nama,
      stafNip: currentUser.nip,
      stafJabatan: currentUser.jabatan,
      pokjaId: currentUser.pokjaId || '',
      pokjaNama: userPokja?.nama || 'Bidang Pertanahan',
      nomorSurat: targetSurat?.nomorSurat || '-',
      perihalSurat: targetSurat?.perihal || '-',
      judulMasukan: data.judulMasukan,
      isiMasukan: data.isiMasukan,
      saranRekomendasi: data.saranRekomendasi,
      lampiranNama: data.lampiranNama,
      lampiranDataUrl: data.lampiranDataUrl,
      tanggalMasukan: timestamp,
      status: 'Menunggu Tanggapan',
    };

    setMasukanStafList((prev) => [newMasukan, ...prev]);
    saveMasukanStafToFirestore(newMasukan).catch(() => {});

    // Add log
    addLog(
      data.suratId,
      'Masukan Staf Baru',
      `${currentUser.nama} menyampaikan masukan/telaahan: "${data.judulMasukan}" pada surat ${targetSurat?.nomorSurat}`
    );

    // Notify Ketua Pokja
    if (userPokja?.ketuaId) {
      const notifKetua: Notifikasi = {
        id: `notif-masukan-${Date.now()}`,
        userId: userPokja.ketuaId,
        suratId: data.suratId,
        judul: 'Masukan / Telaahan Staf Baru',
        pesan: `${currentUser.nama} menyampaikan telaahan staf perihal "${data.judulMasukan}".`,
        jenis: 'tugas_baru',
        statusBaca: false,
        createdAt: timestamp,
      };
      setNotifikasi((prev) => [notifKetua, ...prev]);
      saveNotifikasiToFirestore(notifKetua).catch(() => {});
    }

    return newMasukan;
  };

  const tanggapiMasukanStaf = (
    id: string,
    tanggapan: string,
    status: 'Disetujui Ketua Pokja' | 'Diteruskan ke Kabid' | 'Selesai'
  ) => {
    const timestamp = new Date().toISOString().replace('T', ' ').substring(0, 16);
    let updatedMasukanObj: MasukanStaf | undefined;

    setMasukanStafList((prev) =>
      prev.map((m) => {
        if (m.id === id) {
          updatedMasukanObj = {
            ...m,
            status,
            tanggapanPimpinan: tanggapan,
            tanggapanOleh: `${currentUser.nama} (${currentUser.jabatan})`,
            tanggalTanggapan: timestamp,
          };
          saveMasukanStafToFirestore(updatedMasukanObj).catch(() => {});
          return updatedMasukanObj;
        }
        return m;
      })
    );

    const targetMasukan = masukanStafList.find((m) => m.id === id);
    if (targetMasukan) {
      const notif: Notifikasi = {
        id: `notif-resp-${Date.now()}`,
        userId: targetMasukan.stafId,
        suratId: targetMasukan.suratId,
        judul: 'Tanggapan Pimpinan atas Masukan Staf',
        pesan: `Pimpinan menanggapi masukan "${targetMasukan.judulMasukan}": "${tanggapan}" (${status}).`,
        jenis: 'sla_peringatan',
        statusBaca: false,
        createdAt: timestamp,
      };
      setNotifikasi((prev) => [notif, ...prev]);
      saveNotifikasiToFirestore(notif).catch(() => {});

      addLog(
        targetMasukan.suratId,
        'Tanggapan Masukan Staf',
        `${currentUser.nama} menanggapi telaahan staf "${targetMasukan.judulMasukan}". Status: ${status}`
      );
    }
  };

  const changeKetuaPokja = (pokjaId: string, newKetuaUserId: string) => {
    const pokja = pokjas.find((p) => p.id === pokjaId);
    const newKetua = users.find((u) => u.id === newKetuaUserId);
    if (!pokja || !newKetua) return;

    const updatedPokja: Pokja = { ...pokja, ketuaId: newKetuaUserId };
    // Update Pokja ketuaId
    setPokjas((prev) =>
      prev.map((p) => (p.id === pokjaId ? updatedPokja : p))
    );
    savePokjaToFirestore(updatedPokja).catch(() => {});

    // Make sure new ketua has role 'ketua_pokja' and pokjaId
    updateUser(newKetuaUserId, { role: 'ketua_pokja', pokjaId });

    addLog(
      undefined,
      'Ganti Ketua Pokja',
      `Ketua ${pokja.nama} diubah menjadi ${newKetua.nama} oleh ${currentUser.nama}.`
    );
  };

  const updatePokja = (pokjaId: string, data: Partial<Pokja>) => {
    let updatedPokjaObj: Pokja | undefined;
    setPokjas((prev) =>
      prev.map((p) => {
        if (p.id === pokjaId) {
          updatedPokjaObj = { ...p, ...data };
          savePokjaToFirestore(updatedPokjaObj).catch(() => {});
          return updatedPokjaObj;
        }
        return p;
      })
    );

    // Jika ketuaId diubah, perbarui role user terpilih menjadi ketua_pokja
    if (data.ketuaId) {
      updateUser(data.ketuaId, { role: 'ketua_pokja', pokjaId });
    }

    const currentPokja = pokjas.find((p) => p.id === pokjaId);
    const pokjaName = data.nama || currentPokja?.nama || pokjaId;
    addLog(
      undefined,
      'Pembaruan Data Pokja',
      `Data Kelompok Kerja ${pokjaName} diperbarui oleh ${currentUser.nama}.`
    );
  };

  // Notification actions
  const markNotificationAsRead = (id: string) => {
    setNotifikasi((prev) =>
      prev.map((n) => (n.id === id ? { ...n, statusBaca: true } : n))
    );
  };

  const markAllNotificationsAsRead = () => {
    setNotifikasi((prev) =>
      prev.map((n) => (n.userId === currentUser.id ? { ...n, statusBaca: true } : n))
    );
  };

  const resetAllData = () => {
    try {
      localStorage.clear();
      cleanupStorageQuota();
    } catch (e) {
      console.warn('Failed to clear storage:', e);
    }
    setUsers(INITIAL_USERS);
    setPokjas(INITIAL_POKJA);
    setSuratList(INITIAL_SURAT);
    setDisposisiList(INITIAL_DISPOSISI);
    setTindakLanjutList(INITIAL_TINDAK_LANJUT);
    setLogs(INITIAL_LOGS);
    setNotifikasi(INITIAL_NOTIFIKASI);
    setMasukanStafList(INITIAL_MASUKAN_STAF);
    setCurrentUser(INITIAL_USERS.find((u) => u.id === 'staf-1') || INITIAL_USERS[0]);
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        pokjas,
        suratList,
        suratKeluarList,
        disposisiList,
        tindakLanjutList,
        logs,
        notifikasi,
        masukanStafList,
        whatsAppQueue,
        lastWhatsAppSent,
        setLastWhatsAppSent,
        isCloudSyncActive,
        lastSyncTime,
        isSidebarCollapsed,
        setIsSidebarCollapsed,
        toggleSidebarCollapsed,
        addSurat,
        addSuratKeluar,
        deleteSuratKeluar,
        getNextNomorSuratKeluar,
        disposisiKabid,
        disposisiKetuaPokja,
        inputDisposisi,
        tindakLanjutStaf,
        addMasukanStaf,
        tanggapiMasukanStaf,
        arsipkanSurat,
        deleteSurat,
        editSurat,
        editDisposisi,
        deleteDisposisi,
        clearAllSuratAndDisposisi,
        updateSuratPdf,
        addUser,
        updateUser,
        toggleUserStatus,
        assignPokja,
        updateStafPokja,
        changeKetuaPokja,
        updatePokja,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        getStafByPokja,
        getKetuaByPokja,
        getPokjaById,
        getUserById,
        getDisposisiForUser,
        getSuratVisibleForUser,
        resetAllData,
        addLog,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
