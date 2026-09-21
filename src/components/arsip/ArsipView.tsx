import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Surat } from '../../types';
import {
  Archive,
  Folder,
  FileText,
  Search,
  Download,
  Calendar,
  Filter,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { formatDateIndo } from '../../utils/helpers';

interface ArsipViewProps {
  onSelectSuratForDetail: (surat: Surat) => void;
  onOpenPdf: (surat: Surat) => void;
}

export const ArsipView: React.FC<ArsipViewProps> = ({
  onSelectSuratForDetail,
  onOpenPdf,
}) => {
  const { suratList, pokjas } = useApp();

  const [selectedYear, setSelectedYear] = useState<string>('2026');
  const [selectedKategori, setSelectedKategori] = useState<string>('Semua');
  const [selectedPokja, setSelectedPokja] = useState<string>('Semua');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Letters archived or completed
  const archivedSurat = useMemo(() => {
    return suratList.filter((surat) => {
      // Must match year
      if (selectedYear && !surat.tanggalSurat.startsWith(selectedYear)) {
        return false;
      }
      // Kategori
      if (selectedKategori !== 'Semua' && surat.kategori !== selectedKategori) {
        return false;
      }
      // Pokja
      if (selectedPokja !== 'Semua' && !surat.assignedPokjaIds.includes(selectedPokja)) {
        return false;
      }
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          surat.nomorSurat.toLowerCase().includes(q) ||
          surat.perihal.toLowerCase().includes(q) ||
          surat.asalSurat.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [suratList, selectedYear, selectedKategori, selectedPokja, searchQuery]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Archive className="w-5 h-5 text-slate-700" />
            Arsip Persuratan Digital Bidang Pertanahan
          </h2>
          <p className="text-xs text-slate-500">
            Penyimpanan terstruktur berkas surat masuk, disposisi, dan dokumen lampiran digital
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500">Pilih Tahun:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="px-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800"
          >
            <option value="2026">Tahun 2026</option>
            <option value="2025">Tahun 2025</option>
            <option value="2024">Tahun 2024</option>
          </select>
        </div>
      </div>

      {/* Directory Filter Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div
          onClick={() => setSelectedKategori('Semua')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedKategori === 'Semua'
              ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <Folder className="w-5 h-5 mb-2 text-amber-400" />
          <div className="font-bold text-xs">Semua Kategori</div>
          <div className="text-[10px] mt-0.5 opacity-80">
            {suratList.filter((s) => s.tanggalSurat.startsWith(selectedYear)).length} Dokumen
          </div>
        </div>

        <div
          onClick={() => setSelectedKategori('Surat')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedKategori === 'Surat'
              ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <Folder className="w-5 h-5 mb-2 text-blue-400" />
          <div className="font-bold text-xs">Surat Biasa / Dinas</div>
          <div className="text-[10px] mt-0.5 opacity-80">
            {suratList.filter((s) => s.kategori === 'Surat' && s.tanggalSurat.startsWith(selectedYear)).length} Dokumen
          </div>
        </div>

        <div
          onClick={() => setSelectedKategori('Undangan')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedKategori === 'Undangan'
              ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <Folder className="w-5 h-5 mb-2 text-purple-400" />
          <div className="font-bold text-xs">Surat Undangan</div>
          <div className="text-[10px] mt-0.5 opacity-80">
            {suratList.filter((s) => s.kategori === 'Undangan' && s.tanggalSurat.startsWith(selectedYear)).length} Dokumen
          </div>
        </div>

        <div
          onClick={() => setSelectedKategori('Tembusan')}
          className={`p-4 rounded-xl border cursor-pointer transition-all ${
            selectedKategori === 'Tembusan'
              ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
              : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
          }`}
        >
          <Folder className="w-5 h-5 mb-2 text-emerald-400" />
          <div className="font-bold text-xs">Tembusan / Laporan</div>
          <div className="text-[10px] mt-0.5 opacity-80">
            {suratList.filter((s) => s.kategori === 'Tembusan' && s.tanggalSurat.startsWith(selectedYear)).length} Dokumen
          </div>
        </div>
      </div>

      {/* Filter by Pokja & Search */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari arsip berdasarkan nomor surat, perihal, atau instansi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-slate-500 font-semibold shrink-0">Filter Pokja:</span>
          <select
            value={selectedPokja}
            onChange={(e) => setSelectedPokja(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs"
          >
            <option value="Semua">Semua 3 Pokja</option>
            {pokjas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nama}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Archived Document Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900">
            Daftar Berkas Digital Tersimpan ({archivedSurat.length})
          </h3>
          <span className="text-[11px] text-slate-400">
            Format: PDF Terenkripsi & Disposisi Sah
          </span>
        </div>

        <div className="divide-y divide-slate-100">
          {archivedSurat.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-400">
              Tidak ada arsip dokumen yang sesuai dengan filter.
            </div>
          ) : (
            archivedSurat.map((surat) => (
              <div
                key={surat.id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-700">
                    <FileText className="w-5 h-5 text-blue-900" />
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] bg-slate-100 px-1.5 py-0.5 rounded font-bold">
                        {surat.nomorAgenda}
                      </span>
                      <span className="text-[10px] font-semibold text-slate-500">
                        {surat.kategori}
                      </span>
                      <span className="text-[10px] text-slate-400">
                        {formatDateIndo(surat.tanggalSurat)}
                      </span>
                    </div>

                    <h4
                      onClick={() => onSelectSuratForDetail(surat)}
                      className="font-bold text-slate-900 hover:text-blue-900 cursor-pointer line-clamp-1"
                    >
                      {surat.perihal}
                    </h4>

                    <div className="text-[11px] text-slate-500 flex flex-wrap items-center gap-y-1 gap-x-3">
                      <span>No: <strong>{surat.nomorSurat}</strong></span>
                      <span>Asal: <strong>{surat.asalSurat}</strong></span>
                      <span className="font-mono text-blue-900">{surat.fileName} ({surat.fileSize})</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <button
                    onClick={() => onOpenPdf(surat)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-blue-900" />
                    <span>Lihat PDF</span>
                  </button>
                  <button
                    onClick={() => onSelectSuratForDetail(surat)}
                    className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold transition-colors"
                  >
                    Riwayat Disposisi
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
