import { getAccessToken } from './googleAuthService';
import { Surat } from '../types';
import { getBlob } from '../utils/storage';

export const DEFAULT_DRIVE_FOLDER_ID = '1uegJ1vk35RAEOWuRVexeZyIlQzhlQ0H4';
export const DEFAULT_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1uegJ1vk35RAEOWuRVexeZyIlQzhlQ0H4?usp=sharing';

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime?: string;
  webViewLink?: string;
  webContentLink?: string;
  iconLink?: string;
  thumbnailLink?: string;
  parents?: string[];
  owners?: Array<{
    displayName: string;
    emailAddress: string;
    photoLink?: string;
  }>;
}

export interface DriveQuota {
  limit?: string; // in bytes
  usage?: string; // in bytes
  usageInDrive?: string;
  usageInDriveTrash?: string;
  user?: {
    displayName: string;
    emailAddress: string;
    photoLink?: string;
  };
}

const DRIVE_API_URL = 'https://www.googleapis.com/drive/v3';
const UPLOAD_API_URL = 'https://www.googleapis.com/upload/drive/v3';

// Fetch files from Google Drive
export const listDriveFiles = async (
  options?: {
    folderId?: string;
    searchQuery?: string;
    mimeTypeFilter?: string;
    pageSize?: number;
  }
): Promise<{ files: DriveFile[]; nextPageToken?: string }> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Token akses Google Drive tidak tersedia. Silakan masuk terlebih dahulu.');
  }

  const queryParts: string[] = ['trashed = false'];

  if (options?.folderId && options.folderId !== 'root') {
    queryParts.push(`'${options.folderId}' in parents`);
  }

  if (options?.searchQuery && options.searchQuery.trim()) {
    const sanitized = options.searchQuery.replace(/'/g, "\\'");
    queryParts.push(`name contains '${sanitized}'`);
  }

  if (options?.mimeTypeFilter) {
    if (options.mimeTypeFilter === 'folders') {
      queryParts.push("mimeType = 'application/vnd.google-apps.folder'");
    } else if (options.mimeTypeFilter === 'pdf') {
      queryParts.push("mimeType = 'application/pdf'");
    } else if (options.mimeTypeFilter === 'images') {
      queryParts.push("(mimeType contains 'image/')");
    } else if (options.mimeTypeFilter === 'docs') {
      queryParts.push(
        "(mimeType = 'application/pdf' or mimeType = 'application/vnd.google-apps.document' or mimeType contains 'word')"
      );
    }
  }

  const q = queryParts.join(' and ');
  const params = new URLSearchParams({
    q,
    pageSize: String(options?.pageSize || 40),
    fields: 'files(id, name, mimeType, size, modifiedTime, webViewLink, webContentLink, iconLink, thumbnailLink, parents, owners), nextPageToken',
    orderBy: 'folder, modifiedTime desc',
  });

  const response = await fetch(`${DRIVE_API_URL}/files?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gagal mengambil berkas Drive (${response.status})`);
  }

  const data = await response.json();
  return {
    files: data.files || [],
    nextPageToken: data.nextPageToken,
  };
};

// Get Storage Quota and User Info
export const getDriveQuota = async (): Promise<DriveQuota> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Token akses Google Drive tidak tersedia.');
  }

  const response = await fetch(`${DRIVE_API_URL}/about?fields=storageQuota,user`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error('Gagal mengambil kuota penyimpanan Google Drive');
  }

  const data = await response.json();
  return {
    limit: data.storageQuota?.limit,
    usage: data.storageQuota?.usage,
    usageInDrive: data.storageQuota?.usageInDrive,
    usageInDriveTrash: data.storageQuota?.usageInDriveTrash,
    user: data.user,
  };
};

// Create a new Folder in Drive
export const createDriveFolder = async (
  name: string,
  parentFolderId?: string
): Promise<DriveFile> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Token akses Google Drive tidak tersedia.');
  }

  const metadata: any = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };

  if (parentFolderId && parentFolderId !== 'root') {
    metadata.parents = [parentFolderId];
  }

  const response = await fetch(`${DRIVE_API_URL}/files?fields=id,name,mimeType,webViewLink`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal membuat folder di Google Drive');
  }

  return response.json();
};

// Upload a raw file (Blob or File) to Google Drive via multipart
export const uploadFileToDrive = async (
  fileData: Blob | File,
  fileName: string,
  mimeType: string,
  parentFolderId?: string
): Promise<DriveFile> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Token akses Google Drive tidak tersedia.');
  }

  const metadata: any = {
    name: fileName,
    mimeType: mimeType || 'application/octet-stream',
  };

  if (parentFolderId && parentFolderId !== 'root') {
    metadata.parents = [parentFolderId];
  }

  const boundary = '-------314159265358979323846';
  const delimiter = `\r\n--${boundary}\r\n`;
  const closeDelimiter = `\r\n--${boundary}--`;

  const reader = new FileReader();
  const fileArrayBuffer = await fileData.arrayBuffer();
  const fileBytes = new Uint8Array(fileArrayBuffer);

  // Construct multipart body
  const metadataPart = `${delimiter}Content-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`;
  const fileHeader = `${delimiter}Content-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n`;

  // Convert binary to base64
  let binary = '';
  const len = fileBytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(fileBytes[i]);
  }
  const base64Data = btoa(binary);

  const multipartRequestBody =
    metadataPart +
    `--${boundary}\r\nContent-Type: ${mimeType}\r\nContent-Transfer-Encoding: base64\r\n\r\n${base64Data}${closeDelimiter}`;

  const response = await fetch(
    `${UPLOAD_API_URL}/files?uploadType=multipart&fields=id,name,mimeType,size,modifiedTime,webViewLink`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    }
  );

  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal mengunggah berkas ke Google Drive');
  }

  return response.json();
};

// Automatically upload data URL, IDB key, or Blob document directly to default Google Drive folder
export const uploadDataUrlOrBlobToDrive = async (
  dataUrlOrBlob: string | Blob,
  fileName: string,
  folderId: string = DEFAULT_DRIVE_FOLDER_ID
): Promise<DriveFile | null> => {
  try {
    const token = await getAccessToken();
    if (!token) return null;

    let blob: Blob;
    let mimeType = 'application/pdf';

    if (typeof dataUrlOrBlob === 'string') {
      let resolvedStr = dataUrlOrBlob;
      if (resolvedStr.startsWith('idb:')) {
        const idbData = await getBlob(resolvedStr.replace('idb:', ''));
        if (!idbData) return null;
        resolvedStr = idbData;
      }
      if (resolvedStr.startsWith('data:')) {
        const matches = resolvedStr.match(/^data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,(.+)$/);
        if (matches) {
          mimeType = matches[1];
          const byteCharacters = atob(matches[2]);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          blob = new Blob([byteArray], { type: mimeType });
        } else {
          blob = new Blob([resolvedStr], { type: 'text/plain' });
        }
      } else {
        return null;
      }
    } else {
      blob = dataUrlOrBlob;
      mimeType = blob.type || 'application/octet-stream';
    }

    return await uploadFileToDrive(blob, fileName, mimeType, folderId);
  } catch (error) {
    console.warn('Auto-upload ke Google Drive dilewati / gagal:', error);
    return null;
  }
};

// Archive / backup an existing Surat to Google Drive as an official HTML / JSON dossier document
export const backupSuratToDrive = async (
  surat: Surat,
  parentFolderId?: string
): Promise<DriveFile> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Token akses Google Drive tidak tersedia.');
  }

  const documentContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>ARSIP SURAT SIPERDITAN - ${surat.nomorSurat}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; color: #1e293b; line-height: 1.6; }
    .header { text-align: center; border-bottom: 3px double #0f172a; padding-bottom: 15px; margin-bottom: 25px; }
    .title { font-size: 16px; font-weight: bold; text-transform: uppercase; margin: 0; }
    .sub { font-size: 13px; color: #475569; margin-top: 4px; }
    .badge { display: inline-block; padding: 4px 10px; background: #e0f2fe; color: #0369a1; border-radius: 6px; font-size: 12px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 13px; }
    th, td { border: 1px solid #cbd5e1; padding: 10px 14px; text-align: left; }
    th { background: #f8fafc; font-weight: bold; width: 220px; }
    .ringkasan { background: #f1f5f9; padding: 15px; border-radius: 8px; margin-top: 20px; }
    .footer { margin-top: 40px; font-size: 11px; color: #94a3b8; text-align: right; }
  </style>
</head>
<body>
  <div class="header">
    <div style="font-size: 12px; font-weight: bold; color: #b45309;">PEMERINTAH PROVINSI JAWA TENGAH</div>
    <div class="title">DINAS PERUMAHAN RAKYAT DAN KAWASAN PERMUKIMAN</div>
    <div class="sub">Bidang Pertanahan • SIPERDITAN Cloud Archive</div>
  </div>

  <div style="display: flex; justify-content: space-between; align-items: center;">
    <h2>Dossier Arsip Surat & Disposisi Digital</h2>
    <span class="badge">${surat.status}</span>
  </div>

  <table>
    <tr><th>Nomor Agenda</th><td><strong>${surat.nomorAgenda}</strong></td></tr>
    <tr><th>Nomor Surat</th><td><strong>${surat.nomorSurat}</strong></td></tr>
    <tr><th>Tanggal Surat</th><td>${surat.tanggalSurat}</td></tr>
    <tr><th>Tanggal Disposisi Masuk</th><td>${surat.tanggalDisposisiMasuk}</td></tr>
    <tr><th>Asal Surat / Pengirim</th><td>${surat.asalSurat}</td></tr>
    <tr><th>Perihal</th><td><strong>${surat.perihal}</strong></td></tr>
    <tr><th>Kategori Surat</th><td>${surat.kategori}</td></tr>
    <tr><th>Nama Berkas PDF</th><td>${surat.fileName || '-'}</td></tr>
  </table>

  ${
    surat.narasiDisposisiKadis
      ? `<div style="margin-top: 15px; padding: 12px; border-left: 4px solid #3b82f6; background: #eff6ff;">
          <strong>Arahan Kepala Dinas (Disposisi Awal):</strong>
          <p style="margin: 4px 0 0 0;">${surat.narasiDisposisiKadis}</p>
        </div>`
      : ''
  }

  <div class="footer">
    Diarsipkan secara otomatis ke Google Drive SIPERDITAN Disperakim Prov. Jateng pada ${new Date().toLocaleString('id-ID')}
  </div>
</body>
</html>`;

  const blob = new Blob([documentContent], { type: 'text/html' });
  const fileName = `[SIPERDITAN] Arsip ${surat.nomorSurat.replace(/[/\\?%*:|"<>]/g, '_')} - ${surat.perihal.slice(0, 30)}.html`;

  return uploadFileToDrive(blob, fileName, 'text/html', parentFolderId);
};

// Delete a file or folder from Google Drive
// NOTE: Destructive operation - caller MUST show explicit confirmation modal before executing
export const deleteDriveFile = async (fileId: string): Promise<void> => {
  const token = await getAccessToken();
  if (!token) {
    throw new Error('Token akses Google Drive tidak tersedia.');
  }

  const response = await fetch(`${DRIVE_API_URL}/files/${fileId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok && response.status !== 204) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || 'Gagal menghapus berkas dari Google Drive');
  }
};
