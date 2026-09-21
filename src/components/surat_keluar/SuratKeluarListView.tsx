import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SuratKeluar } from '../../types';
import {
  Send,
  Plus,
  Search,
  Calendar,
  FileText,
  Printer,
  Eye,
  ExternalLink,
  Trash2,
  Filter,
  CheckCircle2,
  Folder,
  Hash,
  User,
  Building,
} from 'lucide-react';
import { formatDateIndo, getRomanMonth } from '../../utils/helpers';
import { GOOGLE_DRIVE_FOLDER_URL } from '../../data/initialData';
import { InputSuratKeluarModal } from './InputSuratKeluarModal';
import { CetakResiSuratKeluarModal } from './CetakResiSuratKeluarModal';
import { PdfViewerModal } from '../common/PdfViewerModal';

export const SuratKeluarListView: React.FC = () => {
  const { currentUser, suratKeluarList, deleteSuratKeluar } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTahun, setSelectedTahun] = useState<string>('all');
  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [selectedResiSurat, setSelectedResiSurat] = useState<SuratKeluar | null>(null);
  const [selectedPdfSurat, setSelectedPdfSurat] = useState<SuratKeluar | null>(null);

  // Available years from suratKeluarList
  const availableYears = useMemo(() => {
    const years = new Set<number>();
    years.add(new Date().getFullYear());
    suratKeluarList.forEach((s) => years.add(s.tahun));
    return Array.from(years).sort((a, b) => b - a);
  }, [suratKeluarList]);

  // Filtered surat keluar
  const filteredList = useMemo(() => {
    return suratKeluarList.filter((item) => {
      const matchSearch =
        item.nomorSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.tujuanSurat.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.perihal.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.createdBy.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.createdByNip && item.createdByNip.includes(searchTerm));

      const matchTahun =
        selectedTahun === 'all' || item.tahun.toString() === selectedTahun;

      return matchSearch && matchTahun;
    });
  }, [suratKeluarList, searchTerm, selectedTahun]);

  // Statistics
  const currentYear = new Date().getFullYear();
  const suratKeluarTahunIni = suratKeluarList.filter((s) => s.tahun === currentYear);
  const lastNumberTahunIni = suratKeluarTahunIni.length > 0
    ? suratKeluarTahunIni[0].nomorSurat
    : `0000/Bid III/${getRomanMonth()}/${currentYear}`;
  const totalWithDocs = suratKeluarList.filter((s) => !!s.filePdf).length;

  const handleDelete = (surat: SuratKeluar) => {
    const isSuperAdmin = currentUser?.nip?.replace(/\s+/g, '') === '197008141991031005' || currentUser?.role === 'super_admin';
    const isCreator = currentUser?.id === surat.createdById;

    if (!isSuperAdmin && !isCreator) {
      alert('Hanya Super Administrator (Marsudi) atau pegawai pemohon yang berhak menghapus nomor surat keluar!');
      return;
    }

    if (
      window.confirm(
        `Apakah Anda yakin ingin menghapus nomor surat keluar "${surat.nomorSurat}"?\nTindakan ini tidak dapat dibatalkan.`
      )
    ) {
      deleteSuratKeluar(surat.id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-white rounded-2xl p-6 shadow-xs border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-blue-900 text-amber-400 flex items-center justify-center shadow-xs">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-blue-950">
                Buku Agenda Penomoran Surat Keluar
              </h1>
              <p className="text-xs text-slate-500">
                Bidang Pertanahan (Bidang III) • Format Resmi: <span className="font-mono font-semibold text-blue-900">(Nomor urut 4 digit)/Bid III/(Bulan Romawi)/(Tahun)</span>
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={GOOGLE_DRIVE_FOLDER_URL}
            target="_blank"
            rel="noreferrer"
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl flex items-center gap-2 transition-colors border border-slate-300 shadow-2xs"
            title="Buka Folder Penyimpanan Google Drive Resmi Disperakim"
          >
            <Folder className="w-4 h-4 text-amber-500" />
            <span>Folder Google Drive</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <button
            onClick={() => setIsInputModalOpen(true)}
            className="px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 text-amber-400" />
            <span>Ambil Nomor Surat Keluar</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Surat Keluar Tahun {currentYear}</span>
            <Calendar className="w-4 h-4 text-blue-900" />
          </div>
          <div className="text-2xl font-bold text-blue-950">
            {suratKeluarTahunIni.length}
          </div>
          <p className="text-[11px] text-slate-500">
            Terdaftar pada tahun anggaran berjalan
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Nomor Terakhir Digunakan</span>
            <Hash className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-sm font-mono font-black text-emerald-700 truncate">
            {lastNumberTahunIni}
          </div>
          <p className="text-[11px] text-slate-500">
            Otomatis berlanjut ke nomor urut berikutnya
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Berkas Naskah Terunggah</span>
            <FileText className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-bold text-indigo-950">
            {totalWithDocs}
          </div>
          <p className="text-[11px] text-slate-500">
            Tersimpan & sinkron ke Google Drive
          </p>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs space-y-1">
          <div className="text-xs font-semibold text-slate-500 flex items-center justify-between">
            <span>Hak Akses Penomoran</span>
            <CheckCircle2 className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-sm font-bold text-slate-800">
            Seluruh Pegawai
          </div>
          <p className="text-[11px] text-slate-500">
            Dapat diakses oleh Kabid, Pokja, dan Staf
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari nomor, perihal, tujuan, atau pemohon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 border border-slate-300 rounded-xl text-xs focus:ring-2 focus:ring-blue-900 focus:outline-hidden bg-slate-50/50"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-4 h-4 text-slate-400" />
          <span className="text-xs font-semibold text-slate-600">Tahun:</span>
          <select
            value={selectedTahun}
            onChange={(e) => setSelectedTahun(e.target.value)}
            className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 bg-white focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
          >
            <option value="all">Semua Tahun</option>
            {availableYears.map((yr) => (
              <option key={yr} value={yr.toString()}>
                Tahun {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Surat Keluar Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
              <Send className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-700 text-sm">Belum Ada Nomor Surat Keluar</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              Klik tombol &ldquo;Ambil Nomor Surat Keluar&rdquo; di atas untuk mendaftarkan nomor surat keluar baru bidang pertanahan.
            </p>
            <button
              onClick={() => setIsInputModalOpen(true)}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Ambil Nomor Surat Sekarang</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/90 text-slate-700 border-b border-slate-200 font-bold">
                  <th className="py-3 px-4 w-16 text-center">No. Urut</th>
                  <th className="py-3 px-4">Nomor Surat Keluar</th>
                  <th className="py-3 px-4">Tanggal Surat</th>
                  <th className="py-3 px-4">Tujuan / Instansi Penerima</th>
                  <th className="py-3 px-4 min-w-[240px]">Perihal</th>
                  <th className="py-3 px-4">Diambil Oleh</th>
                  <th className="py-3 px-4 text-center">Naskah Dokumen</th>
                  <th className="py-3 px-4 text-center w-28">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredList.map((item) => {
                  const isSuperAdmin = currentUser?.nip?.replace(/\s+/g, '') === '197008141991031005' || currentUser?.role === 'super_admin';
                  const isCreator = currentUser?.id === item.createdById;

                  return (
                    <tr key={item.id} className="hover:bg-blue-50/30 transition-colors">
                      {/* Nomor Urut */}
                      <td className="py-3.5 px-4 text-center">
                        <span className="font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-[11px]">
                          #{item.nomorUrut}
                        </span>
                      </td>

                      {/* Nomor Surat */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-black text-blue-950 text-xs">
                          {item.nomorSurat}
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans">
                          Tahun {item.tahun}
                        </div>
                      </td>

                      {/* Tanggal Surat */}
                      <td className="py-3.5 px-4 font-mono text-slate-700 whitespace-nowrap">
                        {formatDateIndo(item.tanggalSurat)}
                      </td>

                      {/* Tujuan Surat */}
                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-blue-800 shrink-0" />
                          <span>{item.tujuanSurat}</span>
                        </div>
                      </td>

                      {/* Perihal */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-800 font-medium leading-snug">
                          {item.perihal}
                        </div>
                        {item.keterangan && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5">
                            Catatan: {item.keterangan}
                          </div>
                        )}
                      </td>

                      {/* Diambil Oleh */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          <span>{item.createdBy}</span>
                        </div>
                        {item.createdByNip && (
                          <div className="text-[10px] font-mono text-slate-500">
                            NIP. {item.createdByNip}
                          </div>
                        )}
                        {item.createdByJabatan && (
                          <div className="text-[10px] text-slate-500">
                            {item.createdByJabatan}
                          </div>
                        )}
                      </td>

                      {/* Dokumen Lampiran */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        {item.filePdf ? (
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => setSelectedPdfSurat(item)}
                              className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 rounded-lg text-[11px] font-bold flex items-center gap-1 transition-colors"
                              title="Lihat Naskah Asli / Cetak ke Printer"
                            >
                              <Eye className="w-3 h-3 text-blue-800" />
                              <span>Lihat PDF</span>
                            </button>

                            <a
                              href={item.googleDriveUrl || GOOGLE_DRIVE_FOLDER_URL}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg border border-slate-200 transition-colors"
                              title="Buka Folder Google Drive"
                            >
                              <Folder className="w-3.5 h-3.5 text-amber-500" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-[10px] text-slate-400 italic">
                            Tanpa lampiran
                          </span>
                        )}
                      </td>

                      {/* Aksi */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setSelectedResiSurat(item)}
                            className="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Cetak Bukti Resi Penomoran Resmi"
                          >
                            <Printer className="w-4 h-4 text-blue-900" />
                          </button>

                          {(isSuperAdmin || isCreator) && (
                            <button
                              onClick={() => handleDelete(item)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Hapus Nomor Surat Keluar"
                            >
                              <Trash2 className="w-4 h-4 text-rose-500" />
                            </button>
                          )}
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

      {/* Input Surat Keluar Modal */}
      <InputSuratKeluarModal
        isOpen={isInputModalOpen}
        onClose={() => setIsInputModalOpen(false)}
        onSuccess={(newSuratKeluar) => {
          // Open the receipt modal automatically after numbering!
          setSelectedResiSurat(newSuratKeluar);
        }}
      />

      {/* Cetak Resi Modal */}
      <CetakResiSuratKeluarModal
        suratKeluar={selectedResiSurat}
        onClose={() => setSelectedResiSurat(null)}
      />

      {/* PDF / Document Viewer Modal */}
      <PdfViewerModal
        surat={selectedPdfSurat}
        onClose={() => setSelectedPdfSurat(null)}
      />
    </div>
  );
};
