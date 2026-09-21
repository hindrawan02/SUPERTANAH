export type UserRole = 'super_admin' | 'admin_pertanahan' | 'kadis' | 'kabid' | 'ketua_pokja' | 'staf_pokja';

export type SuratKategori = 'Undangan' | 'Surat' | 'Tembusan';

export type SuratStatus =
  | 'Surat Baru'
  | 'Menunggu Disposisi Kabid'
  | 'Sudah Didisposisikan Kabid'
  | 'Menunggu Disposisi Ketua Pokja'
  | 'Sudah Didisposisikan ke Staf'
  | 'Belum Ditindaklanjuti'
  | 'Sedang Dikerjakan'
  | 'Hadir'
  | 'Tidak Hadir'
  | 'Menunggu Verifikasi'
  | 'Selesai'
  | 'Diarsipkan';

export type DisposisiPrioritas = 'Normal' | 'Tinggi' | 'Mendesak';

export type TindakLanjutJenis = 'Arsipkan' | 'Kerjakan' | 'Hadir' | 'Tidak Hadir';

export type ProgresStatus = 'Belum Mulai' | 'Sedang Dikerjakan' | 'Menunggu Verifikasi' | 'Selesai';

export interface Pokja {
  id: string;
  nama: string;
  kode: string;
  deskripsi: string;
  ketuaId: string;
}

export interface User {
  id: string;
  nama: string;
  nip: string;
  jabatan: string;
  role: UserRole;
  pokjaId?: string; // Only for ketua_pokja and staf_pokja
  nomorWhatsapp: string;
  email: string;
  password?: string; // Sandi masuk sistem yang dikelola oleh super admin
  status: 'active' | 'inactive';
  avatarUrl?: string;
}

export interface Agenda {
  id: string;
  suratId: string;
  namaAcara: string;
  tanggalAcara: string; // YYYY-MM-DD
  waktuAcara: string; // HH:mm
  tempatAcara: string;
  keterangan: string;
}

export interface KehadiranRecord {
  userId: string;
  namaUser: string;
  status: 'Hadir' | 'Tidak Hadir';
  alasan?: string;
  timestamp: string;
}

export interface Lampiran {
  id: string;
  namaFile: string;
  tipe: string;
  ukuran: string;
  fileUrl: string;
  uploadedBy: string;
  uploadedAt: string;
}

export interface Disposisi {
  id: string;
  suratId: string;
  dariUserId: string;
  dariNama: string;
  dariJabatan: string;
  dariUserNama?: string;
  kepadaUserId: string;
  kepadaNama: string;
  kepadaJabatan: string;
  kepadaUserNama?: string;
  pokjaId: string;
  narasi: string;
  prioritas: DisposisiPrioritas;
  batasWaktu?: string; // YYYY-MM-DD
  status: 'Terkirim' | 'Dibaca' | 'Ditindaklanjuti' | 'Selesai';
  tanggalDisposisi: string;
  tanggalDiterima?: string;
  level: 'kabid_ke_pokja' | 'pokja_ke_staf';
}

export interface TindakLanjut {
  id: string;
  suratId: string;
  disposisiId: string;
  userId: string;
  namaUser: string;
  userNama?: string;
  jenisTindakLanjut: TindakLanjutJenis;
  catatan: string;
  progresStatus?: ProgresStatus;
  progresPersen?: number;
  lampiran?: Lampiran[];
  namaLampiran?: string;
  tanggalTindakLanjut: string;
  createdAt?: string;
  tanggalSelesai?: string;
  kehadiran?: 'Hadir' | 'Tidak Hadir';
  alasanTidakHadir?: string;
}

export interface Surat {
  id: string;
  nomorAgenda: string;
  nomorSurat: string;
  asalSurat: string;
  perihal: string;
  tanggalSurat: string;
  kategori: SuratKategori;
  tanggalDisposisiMasuk: string;
  narasiDisposisiKadis: string;
  filePdf: string;
  fileName: string;
  fileSize: string;
  googleDriveUrl?: string;
  status: SuratStatus;
  agenda?: Agenda;
  kehadiranList?: KehadiranRecord[];
  assignedPokjaIds: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt?: string;
  catatanArsip?: string;
}

export interface SuratKeluar {
  id: string;
  nomorSurat: string; // Format: 0001/Bid III/2026
  nomorUrut: number; // Urutan 1, 2, ...
  tahun: number; // 2026
  perihal: string;
  tujuanSurat: string;
  tanggalSurat: string; // YYYY-MM-DD
  keterangan?: string;
  filePdf?: string; // Data URL / IDB key
  fileName?: string;
  fileSize?: string;
  googleDriveUrl?: string;
  createdBy: string;
  createdById: string;
  createdByNip?: string;
  createdByJabatan?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notifikasi {
  id: string;
  userId: string;
  suratId: string;
  judul: string;
  pesan: string;
  jenis: 'surat_baru' | 'disposisi_baru' | 'tugas_baru' | 'sla_peringatan' | 'undangan' | 'selesai';
  statusBaca: boolean;
  createdAt: string;
}

export interface LogAktivitas {
  id: string;
  suratId?: string;
  userId: string;
  namaUser: string;
  jabatanUser: string;
  aktivitas: string;
  keterangan: string;
  createdAt: string;
  userNama?: string;
  userRole?: string;
  aksi?: string;
  deskripsi?: string;
}

export interface WhatsAppNotification {
  id: string;
  penerimaNomor: string;
  penerimaNama: string;
  pesan: string;
  suratId: string;
  linkToken: string;
  waktuKirim: string;
  status: 'Terkirim' | 'Pending';
}

export interface MasukanStaf {
  id: string;
  suratId: string;
  disposisiId?: string;
  stafId: string;
  stafNama: string;
  stafNip: string;
  stafJabatan: string;
  pokjaId: string;
  pokjaNama: string;
  nomorSurat: string;
  perihalSurat: string;
  judulMasukan: string;
  isiMasukan: string;
  saranRekomendasi: string;
  lampiranNama?: string;
  lampiranDataUrl?: string;
  tanggalMasukan: string;
  status: 'Menunggu Tanggapan' | 'Disetujui Ketua Pokja' | 'Diteruskan ke Kabid' | 'Selesai';
  tanggapanPimpinan?: string;
  tanggapanOleh?: string;
  tanggalTanggapan?: string;
}
