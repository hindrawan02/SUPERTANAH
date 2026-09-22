import { Pokja, User, Surat, SuratKeluar, Disposisi, TindakLanjut, Notifikasi, LogAktivitas, MasukanStaf } from '../types';

export const GOOGLE_DRIVE_FOLDER_ID = '1uegJ1vk35RAEOWuRVexeZyIlQzhlQ0H4';
export const GOOGLE_DRIVE_FOLDER_URL = 'https://drive.google.com/drive/folders/1uegJ1vk35RAEOWuRVexeZyIlQzhlQ0H4?usp=sharing';

export const INITIAL_POKJA: Pokja[] = [
  {
    id: 'pokja-1',
    nama: 'Pokja Fasilitasi Pengadaan Tanah',
    kode: 'POKJA-FPT',
    deskripsi: 'Fasilitasi teknis dan koordinasi administrasi pelaksanaan pengadaan tanah bagi pembangunan untuk kepentingan umum.',
    ketuaId: 'user-ketua-1',
  },
  {
    id: 'pokja-2',
    nama: 'Pokja Fasilitasi Permasalahan Pertanahan',
    kode: 'POKJA-FPP',
    deskripsi: 'Fasilitasi penanganan pengaduan, mediasi sengketa, konflik, dan penatausahaan permasalahan pertanahan.',
    ketuaId: 'user-ketua-2',
  },
  {
    id: 'pokja-3',
    nama: 'Pokja Pembinaan dan Pengendalian Pertanahan',
    kode: 'POKJA-PPP',
    deskripsi: 'Pembinaan regulasi pertanahan, monitoring, evaluasi kepatuhan tata ruang dan pengendalian pemanfaatan tanah.',
    ketuaId: 'user-ketua-3',
  },
];

export const INITIAL_USERS: User[] = [
  // Super Admin
  {
    id: 'user-superadmin',
    nama: 'Administrator Disperakim',
    nip: '197008141991031005',
    jabatan: 'Super Administrator TI Disperakim',
    role: 'super_admin',
    nomorWhatsapp: '081223344550',
    email: 'admin.disperakim@jatengprov.go.id',
    password: 'disperakim123',
    status: 'active',
  },
  // Kepala Dinas
  {
    id: 'user-kadis',
    nama: 'Boedyo Dharmawan, S.T., MT.',
    nip: '196910121998031003',
    jabatan: 'Kepala Dinas Perumahan Rakyat dan Kawasan Permukiman Prov. Jateng',
    role: 'kadis',
    nomorWhatsapp: '082226434729',
    email: 'boedyo.dharmawan@jatengprov.go.id',
    password: '196910121998031003',
    status: 'active',
  },
  // Admin Bidang Pertanahan
  {
    id: 'user-admin',
    nama: 'Siti Rahayu, S.Kom',
    nip: '19871112 201101 2 003',
    jabatan: 'Pengadministrasi Persuratan Bidang Pertanahan',
    role: 'admin_pertanahan',
    nomorWhatsapp: '081223344551',
    email: 'siti.rahayu@jatengprov.go.id',
    password: '198711122011012003',
    status: 'active',
  },
  // Kepala Bidang Pertanahan
  {
    id: 'user-kabid',
    nama: 'Drs. Eko Prasetyo, M.Si',
    nip: '19730510 199803 1 005',
    jabatan: 'Kepala Bidang Pertanahan Disperakim Prov. Jateng',
    role: 'kabid',
    nomorWhatsapp: '081223344552',
    email: 'eko.prasetyo@jatengprov.go.id',
    password: '197305101998031005',
    status: 'active',
  },

  // --- KETUA POKJA 1 ---
  {
    id: 'user-ketua-1',
    nama: 'Ir. Bambang Sugiarto, MT',
    nip: '19760814 200212 1 004',
    jabatan: 'Ketua Pokja Fasilitasi Pengadaan Tanah',
    role: 'ketua_pokja',
    pokjaId: 'pokja-1',
    nomorWhatsapp: '081390112233',
    email: 'bambang.sugiarto@jatengprov.go.id',
    password: '197608142002121004',
    status: 'active',
  },
  // --- STAF POKJA 1 ---
  {
    id: 'staf-1',
    nama: 'Hindrawan Budiarto, S.Tr.IP',
    nip: '19950412 201801 1 002',
    jabatan: 'Pengelola Pengadaan Tanah',
    role: 'staf_pokja',
    pokjaId: 'pokja-1',
    nomorWhatsapp: '081234567891',
    email: 'hindrawan02@gmail.com',
    password: '199504122018011002',
    status: 'active',
  },
  {
    id: 'staf-2',
    nama: 'Dimas Kreshna Wibawarto, ST',
    nip: '19920725 201902 1 004',
    jabatan: 'Penelaah Teknis Pengadaan Tanah',
    role: 'staf_pokja',
    pokjaId: 'pokja-1',
    nomorWhatsapp: '081234567892',
    email: 'dimas.kreshna@jatengprov.go.id',
    password: '199207252019021004',
    status: 'active',
  },
  {
    id: 'staf-3',
    nama: 'Marsudi, SH',
    nip: '197008141991031005',
    jabatan: 'Penyusun Bahan Fasilitasi Pertanahan & Super Administrator',
    role: 'super_admin',
    pokjaId: 'pokja-1',
    nomorWhatsapp: '081234567893',
    email: 'marsudi.sh@jatengprov.go.id',
    password: '197008141991031005',
    status: 'active',
  },

  // --- KETUA POKJA 2 ---
  {
    id: 'user-ketua-2',
    nama: 'Dra. Endang Lestari, M.Si',
    nip: '19780419 200312 2 006',
    jabatan: 'Ketua Pokja Fasilitasi Permasalahan Pertanahan',
    role: 'ketua_pokja',
    pokjaId: 'pokja-2',
    nomorWhatsapp: '081390223344',
    email: 'endang.lestari@jatengprov.go.id',
    password: '197804192003122006',
    status: 'active',
  },
  // --- STAF POKJA 2 ---
  {
    id: 'staf-4',
    nama: 'Vito Arya Prabowo',
    nip: '19960210 202012 1 003',
    jabatan: 'Penelaah Sengketa Pertanahan',
    role: 'staf_pokja',
    pokjaId: 'pokja-2',
    nomorWhatsapp: '081234567894',
    email: 'vito.arya@jatengprov.go.id',
    password: '199602102020121003',
    status: 'active',
  },
  {
    id: 'staf-5',
    nama: 'Harnowo',
    nip: '19850918 201001 1 012',
    jabatan: 'Pranata Mediasi Pertanahan',
    role: 'staf_pokja',
    pokjaId: 'pokja-2',
    nomorWhatsapp: '081234567895',
    email: 'harnowo@jatengprov.go.id',
    password: '198509182010011012',
    status: 'active',
  },

  // --- KETUA POKJA 3 ---
  {
    id: 'user-ketua-3',
    nama: 'Sugeng Riyadi, S.Sos, MM',
    nip: '19750311 200112 1 005',
    jabatan: 'Ketua Pokja Pembinaan dan Pengendalian Pertanahan',
    role: 'ketua_pokja',
    pokjaId: 'pokja-3',
    nomorWhatsapp: '081390334455',
    email: 'sugeng.riyadi@jatengprov.go.id',
    password: '197503112001121005',
    status: 'active',
  },
  // --- STAF POKJA 3 ---
  {
    id: 'staf-6',
    nama: 'Nasrillah, SE',
    nip: '19890622 201502 1 005',
    jabatan: 'Analis Pembinaan Pertanahan',
    role: 'staf_pokja',
    pokjaId: 'pokja-3',
    nomorWhatsapp: '081234567896',
    email: 'nasrillah@jatengprov.go.id',
    password: '198906222015021005',
    status: 'active',
  },
  {
    id: 'staf-7',
    nama: 'Ryas Morosari, SH',
    nip: '19941108 201903 2 006',
    jabatan: 'Pengawas Pengendalian Pertanahan',
    role: 'staf_pokja',
    pokjaId: 'pokja-3',
    nomorWhatsapp: '081234567897',
    email: 'ryas.morosari@jatengprov.go.id',
    password: '199411082019032006',
    status: 'active',
  },
  {
    id: 'staf-8',
    nama: 'R. Agung Wahyu Wijoyo',
    nip: '19910114 201601 1 008',
    jabatan: 'Pengelola Evaluasi Pertanahan',
    role: 'staf_pokja',
    pokjaId: 'pokja-3',
    nomorWhatsapp: '081234567898',
    email: 'agung.wijoyo@jatengprov.go.id',
    password: '199101142016011008',
    status: 'active',
  },
];

export const INITIAL_SURAT: Surat[] = [];

export const INITIAL_DISPOSISI: Disposisi[] = [];

export const INITIAL_TINDAK_LANJUT: TindakLanjut[] = [];

export const INITIAL_LOGS: LogAktivitas[] = [
  {
    id: 'log-init-1',
    suratId: undefined,
    userId: 'user-superadmin',
    namaUser: 'Administrator Disperakim',
    jabatanUser: 'Super Administrator TI Disperakim',
    aktivitas: 'Sistem Diaktifkan',
    keterangan: 'Sistem Persuratan dan Disposisi Digital Bidang Pertanahan aktif siap digunakan.',
    userNama: 'Administrator Disperakim',
    userRole: 'super_admin',
    aksi: 'Sistem Diaktifkan',
    deskripsi: 'Sistem Persuratan dan Disposisi Digital Bidang Pertanahan aktif siap digunakan.',
    createdAt: new Date().toISOString().replace('T', ' ').substring(0, 16),
  },
];

export const INITIAL_NOTIFIKASI: Notifikasi[] = [];

export const INITIAL_MASUKAN_STAF: MasukanStaf[] = [];

export const INITIAL_SURAT_KELUAR: SuratKeluar[] = [
  {
    id: 'sk-1',
    nomorSurat: '0001/Bid III/I/2026',
    nomorUrut: 1,
    tahun: 2026,
    perihal: 'Permohonan Data Pengadaan Tanah untuk Pembangunan Flyover Ganefo',
    tujuanSurat: 'Kepala Kantor Pertanahan Kabupaten Demak',
    tanggalSurat: '2026-01-15',
    keterangan: 'Koordinasi permohonan data inventarisasi bidang tanah untuk penetapan lokasi.',
    fileName: 'Surat_Keluar_0001_Bid_III_I_2026.pdf',
    fileSize: '1.4 MB',
    googleDriveUrl: GOOGLE_DRIVE_FOLDER_URL,
    createdBy: 'Marsudi, SH',
    createdById: 'staf-3',
    createdByNip: '197008141991031005',
    createdByJabatan: 'Penyusun Bahan Fasilitasi Pertanahan & Super Administrator',
    createdAt: '2026-01-15 08:30',
    updatedAt: '2026-01-15 08:30',
  },
  {
    id: 'sk-2',
    nomorSurat: '0002/Bid III/II/2026',
    nomorUrut: 2,
    tahun: 2026,
    perihal: 'Undangan Rapat Koordinasi Fasilitasi Sertifikasi Tanah Milik Pemprov Jateng',
    tujuanSurat: 'Kepala Kanwil BPN Provinsi Jawa Tengah',
    tanggalSurat: '2026-02-10',
    keterangan: 'Undangan rakor percepatan sertifikasi aset tanah dinas perkim.',
    fileName: 'Surat_Keluar_0002_Bid_III_II_2026.pdf',
    fileSize: '1.1 MB',
    googleDriveUrl: GOOGLE_DRIVE_FOLDER_URL,
    createdBy: 'Hindrawan Budiarto, S.Tr.IP',
    createdById: 'staf-1',
    createdByNip: '19950412 201801 1 002',
    createdByJabatan: 'Pengelola Pengadaan Tanah',
    createdAt: '2026-02-10 09:15',
    updatedAt: '2026-02-10 09:15',
  },
  {
    id: 'sk-3',
    nomorSurat: '0003/Bid III/III/2026',
    nomorUrut: 3,
    tahun: 2026,
    perihal: 'Laporan Hasil Inventarisasi Tanah Aset Kawasan Permukiman Kumuh',
    tujuanSurat: 'Sekretaris Daerah Provinsi Jawa Tengah',
    tanggalSurat: '2026-03-05',
    keterangan: 'Penyampaian laporan triwulan inventarisasi penguasaan tanah kawasan permukiman.',
    fileName: 'Surat_Keluar_0003_Bid_III_III_2026.pdf',
    fileSize: '2.0 MB',
    googleDriveUrl: GOOGLE_DRIVE_FOLDER_URL,
    createdBy: 'Suryo Pranoto, SH',
    createdById: 'staf-7',
    createdByNip: '19901115 201402 1 004',
    createdByJabatan: 'Penyusun Rencana Tata Ruang dan Pertanahan',
    createdAt: '2026-03-05 14:00',
    updatedAt: '2026-03-05 14:00',
  },
];

