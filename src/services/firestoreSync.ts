import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  query,
  limit,
  Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './firebase';
import {
  Surat,
  SuratKeluar,
  Disposisi,
  TindakLanjut,
  MasukanStaf,
  User,
  Pokja,
  LogAktivitas,
  Notifikasi,
} from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

/**
 * Remove undefined values (which Firestore rejects) and strip heavy blobs
 * to ensure documents stay well below the 1MB Firestore limit.
 */
function sanitizeDoc<T extends Record<string, any>>(obj: T): Record<string, any> {
  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;

    // If it's a huge base64 data URL > 300KB, truncate or store reference
    if (typeof value === 'string' && value.startsWith('data:') && value.length > 300000) {
      clean[key] = `idb:${obj.id || 'blob'}_truncated`;
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      clean[key] = sanitizeDoc(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}

// ----------------- REAL-TIME SUBSCRIPTIONS -----------------

export function subscribeToCollection<T>(
  collectionName: string,
  onUpdate: (data: T[]) => void
): Unsubscribe {
  const colRef = collection(db, collectionName);

  return onSnapshot(
    colRef,
    (snapshot) => {
      const items: T[] = [];
      snapshot.forEach((docSnap) => {
        items.push({ id: docSnap.id, ...docSnap.data() } as T);
      });
      onUpdate(items);
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, collectionName);
      } catch (e) {
        console.warn(`[Firestore Real-time] Listener '${collectionName}' warning:`, e);
      }
    }
  );
}

// ----------------- WRITE OPERATIONS -----------------

export async function saveSuratToFirestore(surat: Surat): Promise<void> {
  const path = `surat/${surat.id}`;
  try {
    const payload = sanitizeDoc(surat);
    await setDoc(doc(db, 'surat', surat.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSuratFromFirestore(id: string): Promise<void> {
  const path = `surat/${id}`;
  try {
    await deleteDoc(doc(db, 'surat', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveSuratKeluarToFirestore(suratKeluar: SuratKeluar): Promise<void> {
  const path = `surat_keluar/${suratKeluar.id}`;
  try {
    const payload = sanitizeDoc(suratKeluar);
    await setDoc(doc(db, 'surat_keluar', suratKeluar.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deleteSuratKeluarFromFirestore(id: string): Promise<void> {
  const path = `surat_keluar/${id}`;
  try {
    await deleteDoc(doc(db, 'surat_keluar', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveDisposisiToFirestore(disposisi: Disposisi): Promise<void> {
  const path = `disposisi/${disposisi.id}`;
  try {
    const payload = sanitizeDoc(disposisi);
    await setDoc(doc(db, 'disposisi', disposisi.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveTindakLanjutToFirestore(tl: TindakLanjut): Promise<void> {
  const path = `tindak_lanjut/${tl.id}`;
  try {
    const payload = sanitizeDoc(tl);
    await setDoc(doc(db, 'tindak_lanjut', tl.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveMasukanStafToFirestore(ms: MasukanStaf): Promise<void> {
  const path = `masukan_staf/${ms.id}`;
  try {
    const payload = sanitizeDoc(ms);
    await setDoc(doc(db, 'masukan_staf', ms.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveUserToFirestore(user: User): Promise<void> {
  const path = `users/${user.id}`;
  try {
    const payload = sanitizeDoc(user);
    await setDoc(doc(db, 'users', user.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function savePokjaToFirestore(pokja: Pokja): Promise<void> {
  const path = `pokjas/${pokja.id}`;
  try {
    const payload = sanitizeDoc(pokja);
    await setDoc(doc(db, 'pokjas', pokja.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function deletePokjaFromFirestore(id: string): Promise<void> {
  const path = `pokjas/${id}`;
  try {
    await deleteDoc(doc(db, 'pokjas', id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

export async function saveLogToFirestore(logItem: LogAktivitas): Promise<void> {
  const path = `logs/${logItem.id}`;
  try {
    const payload = sanitizeDoc(logItem);
    await setDoc(doc(db, 'logs', logItem.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function saveNotifikasiToFirestore(notif: Notifikasi): Promise<void> {
  const path = `notifikasi/${notif.id}`;
  try {
    const payload = sanitizeDoc(notif);
    await setDoc(doc(db, 'notifikasi', notif.id), payload, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Bootstrap and seed initial demo data to Firestore if the database is currently empty.
 * This guarantees that when published, new users immediately see up-to-date data.
 */
export async function seedFirestoreIfEmpty(seedData: {
  pokjas?: Pokja[];
  users: User[];
  surat: Surat[];
  suratKeluar: SuratKeluar[];
  disposisi: Disposisi[];
  tindakLanjut: TindakLanjut[];
  masukanStaf: MasukanStaf[];
  logs: LogAktivitas[];
  notifikasi: Notifikasi[];
}): Promise<boolean> {
  try {
    // Check if 'surat' has documents
    const q = query(collection(db, 'surat'), limit(1));
    const snap = await getDocs(q);
    if (!snap.empty) {
      console.log('ℹ️ Firestore sudah berisi data aktif.');
      return false;
    }

    console.log('🚀 Menginisialisasi basis data Firestore cloud pertama kali...');

    // Seed pokjas
    if (seedData.pokjas && seedData.pokjas.length > 0) {
      for (const p of seedData.pokjas) {
        await setDoc(doc(db, 'pokjas', p.id), sanitizeDoc(p), { merge: true });
      }
    }

    // Seed users
    for (const u of seedData.users) {
      await setDoc(doc(db, 'users', u.id), sanitizeDoc(u), { merge: true });
    }

    // Seed surat
    for (const s of seedData.surat) {
      await setDoc(doc(db, 'surat', s.id), sanitizeDoc(s), { merge: true });
    }

    // Seed surat keluar
    for (const sk of seedData.suratKeluar) {
      await setDoc(doc(db, 'surat_keluar', sk.id), sanitizeDoc(sk), { merge: true });
    }

    // Seed disposisi
    for (const d of seedData.disposisi) {
      await setDoc(doc(db, 'disposisi', d.id), sanitizeDoc(d), { merge: true });
    }

    // Seed tindak lanjut
    for (const tl of seedData.tindakLanjut) {
      await setDoc(doc(db, 'tindak_lanjut', tl.id), sanitizeDoc(tl), { merge: true });
    }

    // Seed masukan staf
    for (const ms of seedData.masukanStaf) {
      await setDoc(doc(db, 'masukan_staf', ms.id), sanitizeDoc(ms), { merge: true });
    }

    // Seed logs
    for (const l of seedData.logs) {
      await setDoc(doc(db, 'logs', l.id), sanitizeDoc(l), { merge: true });
    }

    // Seed notifikasi
    for (const n of seedData.notifikasi) {
      await setDoc(doc(db, 'notifikasi', n.id), sanitizeDoc(n), { merge: true });
    }

    console.log('✅ Inisialisasi awal Firestore Cloud selesai secara real-time!');
    return true;
  } catch (err) {
    console.warn('[Firestore] Gagal seeding awal, melanjutkan dengan data lokal/cache:', err);
    return false;
  }
}

/**
 * Ensure pokjas collection is populated in Firestore even if other collections were already seeded.
 */
export async function ensurePokjasSeeded(initialPokjas: Pokja[]): Promise<void> {
  try {
    const snap = await getDocs(query(collection(db, 'pokjas'), limit(1)));
    if (snap.empty) {
      console.log('⚡ Menginisialisasi data Pokja ke Firestore Cloud...');
      for (const p of initialPokjas) {
        await setDoc(doc(db, 'pokjas', p.id), sanitizeDoc(p), { merge: true });
      }
    }
  } catch (e) {
    console.warn('[Firestore] ensurePokjasSeeded warning:', e);
  }
}

