import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Surat, SuratStatus, SuratKategori } from '../../types';
import {
  Search,
  Filter,
  FileText,
  Send,
  CheckCircle2,
  Calendar,
  Archive,
  QrCode,
  Clock,
  Eye,
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
  Printer,
  Trash2,
  ExternalLink,
  Folder,
  Edit3,
  AlertTriangle,
} from 'lucide-react';
import { formatDateIndo, getStatusBadgeColor, calculateSlaStatus } from '../../utils/helpers';
import { GOOGLE_DRIVE_FOLDER_URL } from '../../data/initialData';
import { EditSuratModal } from './EditSuratModal';

interface SuratListViewProps {
  onSelectSuratForDetail: (surat: Surat) => void;
  onOpenPdf: (surat: Surat) => void;
  onOpenQr: (surat: Surat) => void;
  onOpenDisposisiModal: (surat: Surat) => void;
  onOpenLembarDisposisi?: (surat: Surat) => void;
  onOpenEditSurat?: (surat: Surat) => void;
}

export const SuratListView: React.FC<SuratListViewProps> = ({
  onSelectSuratForDetail,
  onOpenPdf,
  onOpenQr,
  onOpenDisposisiModal,
  onOpenLembarDisposisi,
  onOpenEditSurat,
}) => {
  const {
    currentUser,
    getSuratVisibleForUser,
    pokjas,
    users,
    disposisiList,
    arsipkanSurat,
    deleteSurat,
    clearAllSuratAndDisposisi,
  } = useApp();

  const allVisibleSurat = getSuratVisibleForUser(currentUser);

  // Delete confirmation state (Req 3: Super Admin only)
  const [suratToDelete, setSuratToDelete] = useState<Surat | null>(null);

  // Edit Surat state
  const [suratToEdit, setSuratToEdit] = useState<Surat | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Clear all data state
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const handleStartEdit = (surat: Surat) => {
    if (onOpenEditSurat) {
      onOpenEditSurat(surat);
    } else {
      setSuratToEdit(surat);
      setIsEditModalOpen(true);
    }
  };

  const handleExecuteClear = async () => {
    setIsClearing(true);
    try {
      await clearAllSuratAndDisposisi();
      setShowClearConfirm(false);
    } finally {
      setIsClearing(false);
    }
  };

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('Semua');
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua');
  const [selectedPokja, setSelectedPokja] = useState<string>('Semua');
  const [selectedPrioritas, setSelectedPrioritas] = useState<string>('Semua');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Filtered letters computation
  const filteredSurat = useMemo(() => {
    return allVisibleSurat.filter((surat) => {
      // 1. Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchNomor = surat.nomorSurat.toLowerCase().includes(q);
        const matchPerihal = surat.perihal.toLowerCase().includes(q);
        const matchAsal = surat.asalSurat.toLowerCase().includes(q);
        const matchAgenda = surat.agenda?.namaAcara?.toLowerCase().includes(q) || false;

        // Search in assigned staff or pokja
        const matchingDisps = disposisiList.filter((d) => d.suratId === surat.id);
        const matchStaff = matchingDisps.some((d) =>
          d.kepadaUserNama?.toLowerCase().includes(q)
        );

        if (!matchNomor && !matchPerihal && !matchAsal && !matchAgenda && !matchStaff) {
          return false;
        }
      }

      // 2. Status
      if (selectedStatus !== 'Semua' && surat.status !== selectedStatus) {
        return false;
      }

      // 3. Kategori
      if (selectedKategori !== 'Semua' && surat.kategori !== selectedKategori) {
        return false;
      }

      // 4. Pokja
      if (selectedPokja !== 'Semua' && !surat.assignedPokjaIds.includes(selectedPokja)) {
        return false;
      }

      // 5. Date Range
      if (startDate && surat.tanggalSurat < startDate) {
        return false;
      }
      if (endDate && surat.tanggalSurat > endDate) {
        return false;
      }

      // 6. Prioritas (from disposisi)
      if (selectedPrioritas !== 'Semua') {
        const hasPriority = disposisiList.some(
          (d) => d.suratId === surat.id && d.prioritas === selectedPrioritas
        );
        if (!hasPriority) return false;
      }

      return true;
    });
  }, [
    allVisibleSurat,
    searchQuery,
    selectedStatus,
    selectedKategori,
    selectedPokja,
    selectedPrioritas,
    startDate,
    endDate,
    disposisiList,
  ]);

  const resetFilters = () => {
    setSearchQuery('');
    setSelectedStatus('Semua');
    setSelectedKategori('Semua');
    setSelectedPokja('Semua');
    setSelectedPrioritas('Semua');
    setStartDate('');
    setEndDate('');
  };

  const handleQuickArchive = (surat: Surat) => {
    if (confirm(`Arsipkan surat "${surat.perihal}"?`)) {
      arsipkanSurat(surat.id, 'Diarsipkan langsung dari daftar surat');
      alert('Surat berhasil diarsipkan.');
    }
  };

  return (
    <div className="space-y-5 pb-12">
      {/* Page Title & Context */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            Daftar Surat Masuk & Disposisi
          </h2>
          <p className="text-xs text-slate-500">
            Bidang Pertanahan • Menampilkan {filteredSurat.length} dari {allVisibleSurat.length} surat yang dapat Anda akses
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          {(currentUser.role === 'super_admin' || currentUser.role === 'admin_pertanahan') && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition-colors cursor-pointer"
              title="Kosongkan seluruh data surat masuk & disposisi"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-600" />
              <span>Kosongkan Data</span>
            </button>
          )}

          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition-colors ${
              showAdvancedFilters
                ? 'bg-blue-900 text-white border-blue-900'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Filter Lanjutan</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${showAdvancedFilters ? 'rotate-180' : ''}`}
            />
          </button>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs space-y-3">
        {/* Main Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari berdasarkan nomor surat, perihal, pengirim, nama acara undangan, nama staf pelaksana..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-900 focus:bg-white focus:outline-hidden"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-xs text-slate-400 hover:text-slate-600"
            >
              Hapus
            </button>
          )}
        </div>

        {/* Quick Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
          <span className="text-slate-400 text-[11px] font-medium mr-1">Kategori:</span>
          {['Semua', 'Surat', 'Undangan', 'Tembusan'].map((kat) => (
            <button
              key={kat}
              onClick={() => setSelectedKategori(kat)}
              className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${
                selectedKategori === kat
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {kat}
            </button>
          ))}

          <span className="text-slate-400 text-[11px] font-medium ml-2 mr-1">Status:</span>
          {['Semua', 'Surat Baru', 'Menunggu Disposisi Kabid', 'Menunggu Disposisi Ketua Pokja', 'Sedang Dikerjakan', 'Selesai', 'Diarsipkan'].map((st) => (
            <button
              key={st}
              onClick={() => setSelectedStatus(st)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                selectedStatus === st
                  ? 'bg-slate-800 text-white font-bold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {st}
            </button>
          ))}
        </div>

        {/* Advanced Filters Drawer */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs animate-in fade-in">
            {/* Pokja Filter */}
            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Filter Berdasarkan Pokja
              </label>
              <select
                value={selectedPokja}
                onChange={(e) => setSelectedPokja(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              >
                <option value="Semua">Semua 3 Pokja</option>
                {pokjas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Prioritas Filter */}
            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Prioritas Disposisi
              </label>
              <select
                value={selectedPrioritas}
                onChange={(e) => setSelectedPrioritas(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              >
                <option value="Semua">Semua Prioritas</option>
                <option value="Normal">Normal</option>
                <option value="Tinggi">Tinggi</option>
                <option value="Mendesak">Mendesak</option>
              </select>
            </div>

            {/* Tanggal Dari */}
            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Dari Tanggal Surat
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              />
            </div>

            {/* Tanggal Sampai */}
            <div>
              <label className="block text-slate-500 font-semibold mb-1">
                Sampai Tanggal Surat
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
                <button
                  onClick={resetFilters}
                  className="p-2 text-slate-400 hover:text-slate-700 rounded-lg border border-slate-200 hover:bg-slate-100 shrink-0"
                  title="Reset Filter"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* DESKTOP TABLE VIEW */}
      <div className="hidden lg:block bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4 w-24">No. Agenda</th>
              <th className="py-3.5 px-4">Surat & Perihal</th>
              <th className="py-3.5 px-4">Asal Instansi</th>
              <th className="py-3.5 px-4">Tanggal</th>
              <th className="py-3.5 px-4">Pokja / Staf</th>
              <th className="py-3.5 px-4 text-center">Status</th>
              <th className="py-3.5 px-4 text-right">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredSurat.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-400 text-xs">
                  Tidak ditemukan surat yang sesuai dengan kriteria pencarian.
                </td>
              </tr>
            ) : (
              filteredSurat.map((surat) => {
                // Determine relevant disposition for SLA
                const latestDisp = disposisiList
                  .filter((d) => d.suratId === surat.id)
                  .pop();
                const sla = calculateSlaStatus(latestDisp?.batasWaktu);

                // Assigned pokja labels
                const assignedPokjas = pokjas.filter((p) =>
                  surat.assignedPokjaIds.includes(p.id)
                );

                return (
                  <tr key={surat.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-bold text-slate-700">
                      {surat.nomorAgenda}
                    </td>

                    <td className="py-3.5 px-4 max-w-sm">
                      <div
                        onClick={() => onSelectSuratForDetail(surat)}
                        className="font-bold text-slate-900 hover:text-blue-900 cursor-pointer line-clamp-2 leading-snug"
                      >
                        {surat.perihal}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-0.5 flex items-center gap-2">
                        <span>No: <strong>{surat.nomorSurat}</strong></span>
                        {surat.kategori === 'Undangan' && (
                          <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-800">
                            Undangan
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-medium text-slate-700">
                      {surat.asalSurat}
                    </td>

                    <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap">
                      <div>{formatDateIndo(surat.tanggalSurat)}</div>
                      {latestDisp?.batasWaktu && (
                        <div className={`text-[10px] mt-0.5 font-semibold ${sla.textColor}`}>
                          SLA: {formatDateIndo(latestDisp.batasWaktu)}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {assignedPokjas.length === 0 ? (
                        <span className="text-[11px] text-slate-400 italic">Belum ditentukan</span>
                      ) : (
                        <div className="space-y-0.5">
                          {assignedPokjas.map((p) => (
                            <div
                              key={p.id}
                              className="text-[10px] font-medium text-blue-900 bg-blue-50 px-2 py-0.5 rounded truncate max-w-[160px]"
                            >
                              {(p.nama || '').replace('Pokja ', '')}
                            </div>
                          ))}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center whitespace-nowrap">
                      <span
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${getStatusBadgeColor(
                          surat.status
                        )}`}
                      >
                        {surat.status}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1">
                        {/* Cetak Lembar Disposisi Resmi (Req 6) */}
                        {onOpenLembarDisposisi && (
                          <button
                            onClick={() => onOpenLembarDisposisi(surat)}
                            className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors"
                            title="Cetak Lembar Disposisi Resmi & PDF Surat"
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                        )}
                        {/* Google Drive Link (Req 4) */}
                        <a
                          href={surat.googleDriveUrl || GOOGLE_DRIVE_FOLDER_URL}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
                          title="Buka Berkas di Google Drive Resmi"
                        >
                          <Folder className="w-4 h-4" />
                        </a>
                        <button
                          onClick={() => onOpenPdf(surat)}
                          className="p-1.5 text-slate-400 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Lihat PDF Dokumen"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onOpenQr(surat)}
                          className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
                          title="QR Code Verifikasi"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => onSelectSuratForDetail(surat)}
                          className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
                        >
                          Detail
                        </button>
                        {/* Edit Surat oleh Super Admin & Admin Pertanahan */}
                        {(currentUser.role === 'super_admin' || currentUser.role === 'admin_pertanahan') && (
                          <button
                            onClick={() => handleStartEdit(surat)}
                            className="p-1.5 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            title="Edit Data Surat (Live Update)"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => onOpenDisposisiModal(surat)}
                          className="px-2.5 py-1 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
                        >
                          {currentUser.role === 'staf_pokja' ? 'Tindak Lanjuti' : 'Disposisikan'}
                        </button>
                        {/* Hapus Surat oleh Super Admin (Req 3) */}
                        {currentUser.role === 'super_admin' && (
                          <button
                            onClick={() => setSuratToDelete(surat)}
                            className="p-1.5 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors"
                            title="Hapus Surat Masuk (Super Admin)"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* MOBILE / TABLET CARD VIEW */}
      <div className="lg:hidden space-y-3">
        {filteredSurat.length === 0 ? (
          <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400">
            Tidak ada surat yang sesuai kriteria pencarian.
          </div>
        ) : (
          filteredSurat.map((surat) => {
            const latestDisp = disposisiList.filter((d) => d.suratId === surat.id).pop();
            const sla = calculateSlaStatus(latestDisp?.batasWaktu);

            return (
              <div
                key={surat.id}
                className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3 text-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-bold">
                    {surat.nomorAgenda}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${getStatusBadgeColor(
                      surat.status
                    )}`}
                  >
                    {surat.status}
                  </span>
                </div>

                <div
                  onClick={() => onSelectSuratForDetail(surat)}
                  className="font-bold text-sm text-slate-900 leading-snug cursor-pointer"
                >
                  {surat.perihal}
                </div>

                <div className="space-y-1 text-slate-600 text-[11px] bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                  <div>No: <strong>{surat.nomorSurat}</strong></div>
                  <div>Asal: <strong>{surat.asalSurat}</strong></div>
                  <div>Tanggal: {formatDateIndo(surat.tanggalSurat)}</div>
                  {latestDisp?.batasWaktu && (
                    <div className={`font-semibold ${sla.textColor}`}>
                      Batas Waktu: {formatDateIndo(latestDisp.batasWaktu)} ({sla.label})
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <div className="flex items-center gap-1">
                    {onOpenLembarDisposisi && (
                      <button
                        onClick={() => onOpenLembarDisposisi(surat)}
                        className="p-1.5 text-amber-700 hover:bg-amber-50 rounded-lg"
                        title="Cetak Lembar Disposisi"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    )}
                    <a
                      href={surat.googleDriveUrl || GOOGLE_DRIVE_FOLDER_URL}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 text-emerald-700 hover:bg-emerald-50 rounded-lg"
                      title="Google Drive"
                    >
                      <Folder className="w-4 h-4" />
                    </a>
                    <button
                      onClick={() => onOpenPdf(surat)}
                      className="p-1.5 text-blue-900 hover:bg-blue-50 rounded-lg"
                      title="Lihat PDF"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onOpenQr(surat)}
                      className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
                      title="QR Code"
                    >
                      <QrCode className="w-4 h-4" />
                    </button>
                    {(currentUser.role === 'super_admin' || currentUser.role === 'admin_pertanahan') && (
                      <button
                        onClick={() => handleStartEdit(surat)}
                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"
                        title="Edit Data Surat"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                    )}
                    {currentUser.role === 'super_admin' && (
                      <button
                        onClick={() => setSuratToDelete(surat)}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                        title="Hapus Surat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onSelectSuratForDetail(surat)}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-100 text-slate-800 rounded-lg"
                    >
                      Detail
                    </button>
                    <button
                      onClick={() => onOpenDisposisiModal(surat)}
                      className="px-3.5 py-1.5 text-xs font-bold bg-blue-900 text-white rounded-lg"
                    >
                      {currentUser.role === 'staf_pokja' ? 'Tindak Lanjut' : 'Disposisi'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* CONFIRMATION MODAL: HAPUS SURAT OLEH SUPER ADMIN (Req 3) */}
      {suratToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Konfirmasi Hapus Surat Masuk
                </h3>
                <p className="text-xs text-rose-600 font-semibold">
                  Aksi Khusus Super Administrator
                </p>
              </div>
            </div>

            <div className="bg-rose-50/70 border border-rose-100 rounded-xl p-3.5 text-xs text-slate-700 space-y-2">
              <p>
                Apakah Anda yakin ingin menghapus surat ini secara permanen dari sistem persuratan?
              </p>
              <div className="p-2.5 bg-white rounded-lg border border-rose-200 space-y-1 font-mono text-[11px]">
                <div><span className="text-slate-400">Agenda:</span> {suratToDelete.nomorAgenda}</div>
                <div><span className="text-slate-400">Nomor:</span> {suratToDelete.nomorSurat}</div>
                <div className="font-sans font-bold text-slate-900 line-clamp-2">
                  {suratToDelete.perihal}
                </div>
                <div><span className="text-slate-400 font-sans">Pengirim:</span> {suratToDelete.asalSurat}</div>
              </div>
              <p className="text-[11px] text-rose-700 font-medium">
                Peringatan: Seluruh disposisi, riwayat pengerjaan tindak lanjut, dan notifikasi terkait surat ini akan ikut terhapus secara permanen.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSuratToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteSurat(suratToDelete.id);
                  setSuratToDelete(null);
                  alert('Surat berhasil dihapus permanen oleh Super Admin!');
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Ya, Hapus Surat Permanen</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: KOSONGKAN SELURUH DATA SURAT & DISPOSISI */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-rose-300 space-y-4">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900">
                  Kosongkan Data Surat & Disposisi
                </h3>
                <p className="text-xs text-rose-600 font-semibold">
                  Aksi Administrator Bidang Pertanahan
                </p>
              </div>
            </div>

            <div className="bg-rose-50 border border-rose-100 rounded-xl p-3.5 text-xs text-slate-700 space-y-2">
              <p className="font-medium text-rose-900">
                Apakah Anda yakin ingin mengosongkan seluruh data surat masuk dan lembar disposisi?
              </p>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Tindakan ini akan menghapus seluruh rekaman surat masuk, alur disposisi antar pejabat, riwayat pengerjaan staf, serta masukan staf secara permanen baik di perangkat ini maupun di Cloud Firestore real-time.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                disabled={isClearing}
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isClearing}
                onClick={handleExecuteClear}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isClearing ? 'Mengosongkan...' : 'Ya, Kosongkan Semua Data'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT SURAT MASUK (Live Update) */}
      <EditSuratModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSuratToEdit(null);
        }}
        surat={suratToEdit}
      />
    </div>
  );
};
