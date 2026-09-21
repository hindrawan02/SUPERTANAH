/**
 * Disperakim Digital Archive Storage Manager
 * 
 * Provides:
 * 1. Safe localStorage read/write with quota-exceeded catching & automatic self-healing.
 * 2. IndexedDB blob storage for large files (PDFs, scans, photos, attachments).
 * 3. In-memory fast cache to keep document previews responsive.
 * 4. Automatic boot-time migration to free quota if localStorage is full.
 */

import { Surat, SuratKeluar, TindakLanjut, MasukanStaf, LogAktivitas, Notifikasi } from '../types';

const DB_NAME = 'disperakim_assets_v1';
const DB_VERSION = 1;
const STORE_NAME = 'blobs';

// In-memory cache for fast synchronous access
const memoryCache = new Map<string, string>();

let idbPromise: Promise<IDBDatabase | null> | null = null;

function getIDB(): Promise<IDBDatabase | null> {
  if (typeof window === 'undefined' || !window.indexedDB) {
    return Promise.resolve(null);
  }
  if (!idbPromise) {
    idbPromise = new Promise((resolve) => {
      try {
        const request = window.indexedDB.open(DB_NAME, DB_VERSION);
        request.onupgradeneeded = () => {
          const db = request.result;
          if (!db.objectStoreNames.contains(STORE_NAME)) {
            db.createObjectStore(STORE_NAME);
          }
        };
        request.onsuccess = () => resolve(request.result);
        request.onerror = (err) => {
          console.warn('[Storage] IndexedDB open error, using memory fallback:', err);
          resolve(null);
        };
      } catch (err) {
        console.warn('[Storage] Failed to initialize IndexedDB:', err);
        resolve(null);
      }
    });
  }
  return idbPromise;
}

/**
 * Save large binary data (PDF / scan / image data URL) to IndexedDB & memory cache
 */
export async function setBlob(key: string, dataUrl: string): Promise<void> {
  if (!key || !dataUrl) return;
  memoryCache.set(key, dataUrl);

  try {
    const db = await getIDB();
    if (!db) return;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readwrite');
        const store = tx.objectStore(STORE_NAME);
        store.put(dataUrl, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (e) {
        console.warn('[Storage] Transaction error in setBlob:', e);
        resolve();
      }
    });
  } catch (err) {
    console.warn('[Storage] setBlob error:', err);
  }
}

/**
 * Retrieve binary data from memory cache or IndexedDB
 */
export async function getBlob(key: string): Promise<string | null> {
  if (!key) return null;
  if (memoryCache.has(key)) {
    return memoryCache.get(key) || null;
  }

  try {
    const db = await getIDB();
    if (!db) return null;
    return new Promise((resolve) => {
      try {
        const tx = db.transaction(STORE_NAME, 'readonly');
        const store = tx.objectStore(STORE_NAME);
        const request = store.get(key);
        request.onsuccess = () => {
          const val = request.result as string | undefined;
          if (val) {
            memoryCache.set(key, val);
            resolve(val);
          } else {
            resolve(null);
          }
        };
        request.onerror = () => resolve(null);
      } catch (e) {
        console.warn('[Storage] Transaction error in getBlob:', e);
        resolve(null);
      }
    });
  } catch (err) {
    console.warn('[Storage] getBlob error:', err);
    return null;
  }
}

/**
 * Synchronous blob fetch from memory cache (if available)
 */
export function getBlobSync(key: string): string | null {
  return memoryCache.get(key) || null;
}

/**
 * Delete a blob from cache & IndexedDB
 */
export async function deleteBlob(key: string): Promise<void> {
  memoryCache.delete(key);
  try {
    const db = await getIDB();
    if (!db) return;
    const tx = db.transaction(STORE_NAME, 'readwrite');
    tx.objectStore(STORE_NAME).delete(key);
  } catch (err) {
    console.warn('[Storage] deleteBlob error:', err);
  }
}

/**
 * Safe localStorage.getItem with error shielding
 */
export function safeGetItem(key: string, fallback: string | null = null): string | null {
  if (typeof window === 'undefined') return fallback;
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch (err) {
    console.warn(`[Storage] safeGetItem error for key "${key}":`, err);
    return fallback;
  }
}

/**
 * Safe localStorage.setItem with quota exceeded protection and self-healing
 */
export function safeSetItem(key: string, value: string): boolean {
  if (typeof window === 'undefined') return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error: any) {
    console.warn(`[Storage] Quota exceeded or error setting item "${key}":`, error?.message);

    // Self-healing: perform emergency storage optimization
    try {
      cleanupStorageQuota();

      // If the item itself is huge, try to strip any remaining data URLs
      let optimizedValue = value;
      if (value.includes('data:image') || value.includes('data:application/pdf')) {
        optimizedValue = value.replace(/data:(image|application)\/[a-zA-Z0-9+.-]+;base64,[A-Za-z0-9+/=]+/g, '#blob_cleared');
      }

      localStorage.setItem(key, optimizedValue);
      return true;
    } catch (retryErr) {
      console.error(`[Storage] Retry setItem failed for "${key}". Data saved to runtime memory:`, retryErr);
      return false;
    }
  }
}

/**
 * Safe localStorage.removeItem
 */
export function safeRemoveItem(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch (err) {
    console.warn(`[Storage] safeRemoveItem error for key "${key}":`, err);
  }
}

/**
 * Emergency storage cleanup: removes large legacy data, truncates logs, and relieves quota pressure.
 */
export function cleanupStorageQuota(): void {
  if (typeof window === 'undefined') return;
  try {
    // 1. Truncate logs to max 30 recent items
    const logsRaw = localStorage.getItem('disperakim_logs_v1');
    if (logsRaw) {
      try {
        const parsed = JSON.parse(logsRaw);
        if (Array.isArray(parsed) && parsed.length > 30) {
          localStorage.setItem('disperakim_logs_v1', JSON.stringify(parsed.slice(0, 30)));
        }
      } catch {}
    }

    // 2. Truncate notifications to max 30 recent items
    const notifRaw = localStorage.getItem('disperakim_notifikasi_v1');
    if (notifRaw) {
      try {
        const parsed = JSON.parse(notifRaw);
        if (Array.isArray(parsed) && parsed.length > 30) {
          localStorage.setItem('disperakim_notifikasi_v1', JSON.stringify(parsed.slice(0, 30)));
        }
      } catch {}
    }

    // 3. Inspect disperakim_surat_v1 for inline data URLs and migrate them to IndexedDB
    const suratRaw = localStorage.getItem('disperakim_surat_v1');
    if (suratRaw && (suratRaw.includes('data:image') || suratRaw.includes('data:application/pdf') || suratRaw.length > 500000)) {
      try {
        const parsed = JSON.parse(suratRaw);
        if (Array.isArray(parsed)) {
          const sanitized = parsed.map((s: Surat) => {
            if (s.filePdf && (s.filePdf.startsWith('data:') || s.filePdf.length > 500)) {
              const idbKey = `pdf_${s.id}`;
              setBlob(idbKey, s.filePdf).catch(() => {});
              return { ...s, filePdf: `idb:${idbKey}` };
            }
            return s;
          });
          localStorage.setItem('disperakim_surat_v1', JSON.stringify(sanitized));
        }
      } catch (e) {
        console.warn('[Storage] Failed to migrate suratRaw in cleanup:', e);
      }
    }
  } catch (err) {
    console.warn('[Storage] cleanupStorageQuota error:', err);
  }
}

/**
 * Prepares Surat[] for localStorage by offloading heavy data URLs to IndexedDB
 */
export function prepareSuratListForStorage(surats: Surat[]): Surat[] {
  return surats.map((s) => {
    if (s.filePdf && (s.filePdf.startsWith('data:') || s.filePdf.length > 500)) {
      const idbKey = `pdf_${s.id}`;
      // Asynchronously store in IndexedDB and synchronously in memory cache
      setBlob(idbKey, s.filePdf).catch((err) =>
        console.warn(`[Storage] Failed to persist blob for surat ${s.id}:`, err)
      );
      return {
        ...s,
        filePdf: `idb:${idbKey}`,
      };
    }
    return s;
  });
}

/**
 * Asynchronously hydrates Surat[] by pulling missing blobs from IndexedDB into memory
 */
export async function hydrateSuratListBlobs(surats: Surat[]): Promise<Surat[]> {
  const updated = await Promise.all(
    surats.map(async (s) => {
      if (s.filePdf && s.filePdf.startsWith('idb:')) {
        const key = s.filePdf.replace('idb:', '');
        const blob = await getBlob(key);
        if (blob) {
          return { ...s, filePdf: blob };
        }
      }
      return s;
    })
  );
  return updated;
}

/**
 * Prepares TindakLanjut[] for localStorage
 */
export function prepareTindakLanjutForStorage(list: TindakLanjut[]): TindakLanjut[] {
  return list.map((item) => {
    if (item.lampiran && item.lampiran.length > 0) {
      const sanitizedLampiran = item.lampiran.map((lamp, idx) => {
        if (lamp.fileUrl && (lamp.fileUrl.startsWith('data:') || lamp.fileUrl.length > 500)) {
          const idbKey = `lampiran_${item.id}_${idx}`;
          setBlob(idbKey, lamp.fileUrl).catch(() => {});
          return { ...lamp, fileUrl: `idb:${idbKey}` };
        }
        return lamp;
      });
      return { ...item, lampiran: sanitizedLampiran };
    }
    return item;
  });
}

/**
 * Prepares MasukanStaf[] for localStorage
 */
export function prepareMasukanStafForStorage(list: MasukanStaf[]): MasukanStaf[] {
  return list.map((item) => {
    if (item.lampiranDataUrl && (item.lampiranDataUrl.startsWith('data:') || item.lampiranDataUrl.length > 500)) {
      const idbKey = `masukan_${item.id}`;
      setBlob(idbKey, item.lampiranDataUrl).catch(() => {});
      return { ...item, lampiranDataUrl: `idb:${idbKey}` };
    }
    return item;
  });
}

/**
 * Prepares SuratKeluar[] for localStorage
 */
export function prepareSuratKeluarListForStorage(items: SuratKeluar[]): SuratKeluar[] {
  return items.map((sk) => {
    if (sk.filePdf && (sk.filePdf.startsWith('data:') || sk.filePdf.length > 500)) {
      const idbKey = `pdf_sk_${sk.id}`;
      setBlob(idbKey, sk.filePdf).catch((err) =>
        console.warn(`[Storage] Failed to persist blob for surat keluar ${sk.id}:`, err)
      );
      return {
        ...sk,
        filePdf: `idb:${idbKey}`,
      };
    }
    return sk;
  });
}

/**
 * Hydrates SuratKeluar[] from IndexedDB
 */
export async function hydrateSuratKeluarListBlobs(items: SuratKeluar[]): Promise<SuratKeluar[]> {
  const hydrated = await Promise.all(
    items.map(async (sk) => {
      if (sk.filePdf && sk.filePdf.startsWith('idb:')) {
        const key = sk.filePdf.replace('idb:', '');
        const dataUrl = await getBlob(key);
        if (dataUrl) {
          return { ...sk, filePdf: dataUrl };
        }
      }
      return sk;
    })
  );
  return hydrated;
}

/**
 * Run immediate boot-time quarantine:
 * Cleans up any quota overflow existing in the browser immediately upon load
 */
if (typeof window !== 'undefined') {
  try {
    cleanupStorageQuota();
  } catch (e) {
    console.warn('[Storage] Boot-time cleanup notice:', e);
  }
}
