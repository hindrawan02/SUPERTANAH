import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { MasukanStaf } from '../../types';
import {
  MessageSquareText,
  Plus,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Send,
  User,
  Building2,
  FileText,
  Paperclip,
  Check,
  Printer,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Eye,
  CornerDownRight,
  ArrowRight,
} from 'lucide-react';
import { formatDateIndo } from '../../utils/helpers';
import { InputMasukanStafModal } from './InputMasukanStafModal';

export const MasukanStafView: React.FC = () => {
  const { masukanStafList, pokjas, currentUser, tanggapiMasukanStaf } = useApp();

  const [isInputModalOpen, setIsInputModalOpen] = useState(false);
  const [selectedPokjaFilter, setSelectedPokjaFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Response dialog state
  const [respondingMasukan, setRespondingMasukan] = useState<MasukanStaf | null>(null);
  const [tanggapanText, setTanggapanText] = useState('');
  const [tanggapanStatus, setTanggapanStatus] = useState<
    'Disetujui Ketua Pokja' | 'Diteruskan ke Kabid' | 'Selesai'
  >('Disetujui Ketua Pokja');

  // Print view state for formal Telaahan Staf
  const [printMasukan, setPrintMasukan] = useState<MasukanStaf | null>(null);

  const isPimpinan =
    currentUser.role === 'ketua_pokja' ||
    currentUser.role === 'kabid' ||
    currentUser.role === 'admin_pertanahan' ||
    currentUser.role === 'super_admin';

  // Statistics
  const totalMasukan = masukanStafList.length;
  const pendingCount = masukanStafList.filter((m) => m.status === 'Menunggu Tanggapan').length;
  const approvedCount = masukanStafList.filter((m) => m.status === 'Disetujui Ketua Pokja').length;
  const forwardedCount = masukanStafList.filter((m) => m.status === 'Diteruskan ke Kabid' || m.status === 'Selesai').length;

  // Filter items
  const filteredList = masukanStafList.filter((m) => {
    if (selectedPokjaFilter !== 'ALL' && m.pokjaId !== selectedPokjaFilter) return false;
    if (selectedStatusFilter !== 'ALL' && m.status !== selectedStatusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchJudul = m.judulMasukan?.toLowerCase().includes(q) || false;
      const matchStaf = m.stafNama?.toLowerCase().includes(q) || false;
      const matchSurat = (m.nomorSurat?.toLowerCase().includes(q) || false) || (m.perihalSurat?.toLowerCase().includes(q) || false);
      return matchJudul || matchStaf || matchSurat;
    }
    return true;
  });

  const handleOpenResponse = (masukan: MasukanStaf) => {
    setRespondingMasukan(masukan);
    setTanggapanText(
      masukan.tanggapanPimpinan ||
        'Rekomendasi teknis disetujui. Segera siapkan nota pertimbangan dan koordinasikan dengan pihak terkait.'
    );
    setTanggapanStatus(masukan.status === 'Menunggu Tanggapan' ? 'Disetujui Ketua Pokja' : (masukan.status as any));
  };

  const handleSaveResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!respondingMasukan || !tanggapanText.trim()) return;

    tanggapiMasukanStaf(respondingMasukan.id, tanggapanText, tanggapanStatus);
    alert('Tanggapan pimpinan berhasil disimpan dan dinotifikasikan ke staf!');
    setRespondingMasukan(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Title & Action Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-900 text-amber-300 flex items-center justify-center font-bold shadow-xs">
            <MessageSquareText className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold text-slate-900">Masukan & Telaahan Staf</h1>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                Bidang Pertanahan
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Kanal resmi penyampaian telaahan staf, saran teknis, dan verifikasi lapangan kepada pimpinan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => setIsInputModalOpen(true)}
            className="px-4 py-2.5 bg-emerald-800 hover:bg-emerald-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-md transition-all"
          >
            <Plus className="w-4 h-4 text-amber-300" />
            <span>+ Input Telaahan Staf Baru</span>
          </button>
        </div>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 text-xs">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="text-slate-500 font-semibold">Total Telaahan Staf</div>
          <div className="text-2xl font-black text-slate-900">{totalMasukan}</div>
          <div className="text-[10px] text-slate-400">Tercatat dalam sistem persuratan</div>
        </div>

        <div className="bg-amber-50/70 p-4 rounded-xl border border-amber-200 shadow-2xs space-y-1">
          <div className="text-amber-800 font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            Menunggu Tanggapan
          </div>
          <div className="text-2xl font-black text-amber-900">{pendingCount}</div>
          <div className="text-[10px] text-amber-700">Perlu arahan Ketua Pokja / Kabid</div>
        </div>

        <div className="bg-emerald-50/70 p-4 rounded-xl border border-emerald-200 shadow-2xs space-y-1">
          <div className="text-emerald-800 font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Disetujui Ketua Pokja
          </div>
          <div className="text-2xl font-black text-emerald-900">{approvedCount}</div>
          <div className="text-[10px] text-emerald-700">Telaahan telah divalidasi</div>
        </div>

        <div className="bg-blue-50/70 p-4 rounded-xl border border-blue-200 shadow-2xs space-y-1">
          <div className="text-blue-800 font-semibold flex items-center gap-1.5">
            <Send className="w-3.5 h-3.5 text-blue-600" />
            Diteruskan / Selesai
          </div>
          <div className="text-2xl font-black text-blue-900">{forwardedCount}</div>
          <div className="text-[10px] text-blue-700">Masukan sampai ke Kepala Bidang</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari judul masukan, nama staf pengusul, nomor surat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:ring-2 focus:ring-emerald-800 focus:bg-white focus:outline-hidden"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 text-slate-600 font-medium">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Pokja:</span>
          </div>
          <select
            value={selectedPokjaFilter}
            onChange={(e) => setSelectedPokjaFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden"
          >
            <option value="ALL">Semua Pokja (1, 2, 3)</option>
            {pokjas.map((p) => (
              <option key={p.id} value={p.id}>
                {p.kode} - {p.nama}
              </option>
            ))}
          </select>

          <select
            value={selectedStatusFilter}
            onChange={(e) => setSelectedStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-semibold focus:outline-hidden"
          >
            <option value="ALL">Semua Status</option>
            <option value="Menunggu Tanggapan">Menunggu Tanggapan</option>
            <option value="Disetujui Ketua Pokja">Disetujui Ketua Pokja</option>
            <option value="Diteruskan ke Kabid">Diteruskan ke Kabid</option>
            <option value="Selesai">Selesai</option>
          </select>
        </div>
      </div>

      {/* Masukan List Cards */}
      <div className="space-y-3.5">
        {filteredList.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-500">
            <MessageSquareText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <div className="font-semibold text-sm text-slate-700">Belum Ada Masukan Staf Ditemukan</div>
            <p className="text-xs mt-1">Gunakan tombol di atas untuk mengajukan telaahan staf baru.</p>
          </div>
        ) : (
          filteredList.map((item) => {
            const isExpanded = expandedId === item.id;
            const isApproved = item.status === 'Disetujui Ketua Pokja' || item.status === 'Selesai';
            const isPending = item.status === 'Menunggu Tanggapan';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-slate-300 transition-all overflow-hidden"
              >
                {/* Header Card */}
                <div className="p-4 sm:p-5 flex flex-col md:flex-row md:items-start justify-between gap-3 bg-gradient-to-r from-slate-50 to-white">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono font-bold bg-blue-900 text-white px-2 py-0.5 rounded">
                        {item.pokjaNama}
                      </span>
                      <span className="text-[10px] font-mono text-slate-600 bg-slate-200/80 px-2 py-0.5 rounded">
                        Surat: {item.nomorSurat}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                          isPending
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>

                    <h3 className="font-bold text-sm sm:text-base text-slate-900 leading-snug">
                      {item.judulMasukan}
                    </h3>

                    <div className="text-[11px] text-slate-500 flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-700 flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-slate-400" />
                        {item.stafNama} (NIP: {item.stafNip})
                      </span>
                      <span>•</span>
                      <span>{item.stafJabatan}</span>
                      <span>•</span>
                      <span>Diajukan: {formatDateIndo(item.tanggalMasukan)}</span>
                    </div>
                  </div>

                  {/* Actions right */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setPrintMasukan(item)}
                      className="p-2 text-slate-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
                      title="Cetak Naskah Dinas Telaahan Staf"
                    >
                      <Printer className="w-4 h-4" />
                    </button>

                    {isPimpinan && (
                      <button
                        type="button"
                        onClick={() => handleOpenResponse(item)}
                        className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-2xs transition-colors"
                      >
                        <Check className="w-3.5 h-3.5 text-amber-300" />
                        <span>Beri Tanggapan</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : item.id)}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Always visible brief summary */}
                <div className="px-5 py-3 border-t border-slate-100 text-xs text-slate-700 bg-white">
                  <div className="font-semibold text-slate-900 mb-1 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                    Rekomendasi Staf:
                  </div>
                  <p className="line-clamp-2 italic font-serif text-slate-800">
                    &ldquo;{item.saranRekomendasi}&rdquo;
                  </p>
                </div>

                {/* Expanded Detailed Analysis */}
                {isExpanded && (
                  <div className="px-5 pb-5 pt-3 border-t border-slate-200 space-y-4 text-xs bg-slate-50/60 animate-in fade-in">
                    {/* Section Uraian Fakta */}
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                        Uraian Fakta Lapangan & Analisis Masalah:
                      </div>
                      <p className="bg-white p-3.5 rounded-xl border border-slate-200 text-slate-800 leading-relaxed font-serif whitespace-pre-line">
                        {item.isiMasukan}
                      </p>
                    </div>

                    {/* Section Saran & Rekomendasi Lengkap */}
                    <div className="space-y-1">
                      <div className="font-bold text-slate-900 uppercase tracking-wider text-[10px]">
                        Saran & Rekomendasi Langkah Konkret:
                      </div>
                      <p className="bg-white p-3.5 rounded-xl border border-slate-200 text-emerald-950 font-medium leading-relaxed font-serif whitespace-pre-line">
                        {item.saranRekomendasi}
                      </p>
                    </div>

                    {/* Lampiran */}
                    {item.lampiranNama && (
                      <div className="flex items-center gap-2 text-[11px] bg-white p-2.5 rounded-xl border border-slate-200">
                        <Paperclip className="w-4 h-4 text-blue-800" />
                        <span className="font-semibold text-slate-700">Lampiran Bukti:</span>
                        <span className="text-blue-900 font-bold">{item.lampiranNama}</span>
                      </div>
                    )}

                    {/* Section Tanggapan Pimpinan */}
                    {item.tanggapanPimpinan ? (
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                            Tanggapan & Arahan Pimpinan:
                          </span>
                          <span className="text-[10px] text-emerald-800 font-medium">
                            {formatDateIndo(item.tanggalTanggapan || item.tanggalMasukan)}
                          </span>
                        </div>
                        <p className="text-slate-800 italic font-serif leading-relaxed">
                          &ldquo;{item.tanggapanPimpinan}&rdquo;
                        </p>
                        <div className="text-[11px] text-emerald-900 font-semibold pt-1 border-t border-emerald-200/60">
                          Oleh: {item.tanggapanOleh || 'Ketua Pokja'}
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 flex items-center gap-2 text-[11px]">
                        <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                        <span>Menunggu verifikasi dan arahan persetujuan dari Ketua Pokja / Kepala Bidang.</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Modal Beri Tanggapan */}
      {respondingMasukan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="bg-blue-950 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm">Beri Tanggapan / Arahan Pimpinan</h3>
              <button
                onClick={() => setRespondingMasukan(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveResponse} className="p-6 space-y-4 text-xs">
              <div className="space-y-1 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="font-bold text-slate-800">{respondingMasukan.judulMasukan}</div>
                <div className="text-slate-500 text-[11px]">
                  Dari: <strong>{respondingMasukan.stafNama}</strong> ({respondingMasukan.pokjaNama})
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Keputusan Status Telaahan
                </label>
                <select
                  value={tanggapanStatus}
                  onChange={(e) => setTanggapanStatus(e.target.value as any)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-bold text-slate-800 focus:ring-2 focus:ring-blue-900"
                >
                  <option value="Disetujui Ketua Pokja">Disetujui Ketua Pokja</option>
                  <option value="Diteruskan ke Kabid">Diteruskan ke Kepala Bidang</option>
                  <option value="Selesai">Disetujui & Selesai</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Arahan Pimpinan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={4}
                  value={tanggapanText}
                  onChange={(e) => setTanggapanText(e.target.value)}
                  placeholder="Tuliskan arahan tindak lanjut..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 font-serif"
                />
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setRespondingMasukan(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-xl font-bold flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4 text-amber-300" />
                  Simpan & Kirim Arahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Format Cetak Resmi "TELAAHAN STAF" */}
      {printMasukan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] shadow-2xl flex flex-col overflow-hidden">
            {/* Top Toolbar */}
            <div className="bg-slate-800 text-white px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Printer className="w-4 h-4 text-amber-400" />
                <span className="font-bold text-xs">Format Resmi Naskah Dinas: TELAAHAN STAF</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold"
                >
                  Cetak Dokumen
                </button>
                <button
                  onClick={() => setPrintMasukan(null)}
                  className="text-slate-300 hover:text-white"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Document Body */}
            <div className="flex-1 overflow-y-auto p-8 sm:p-12 text-slate-900 font-serif leading-relaxed text-xs">
              {/* Kop Surat */}
              <div className="text-center border-b-2 border-black pb-3 mb-6">
                <div className="font-sans font-bold text-xs uppercase">Pemerintah Provinsi Jawa Tengah</div>
                <div className="font-sans font-black text-sm uppercase">Dinas Perumahan Rakyat dan Kawasan Permukiman</div>
                <div className="font-sans text-[10px] text-slate-600">
                  Bidang Pertanahan • Jl. Madukoro Blok AA-BB Kompleks PRPP Semarang
                </div>
              </div>

              {/* Judul Telaahan */}
              <div className="text-center font-bold text-sm uppercase underline mb-6">
                TELAAHAN STAF
              </div>

              {/* Metadata */}
              <div className="space-y-1 mb-6 font-sans text-xs">
                <div><span className="w-24 inline-block font-semibold">Kepada Yth.</span>: Kepala Bidang Pertanahan (melalui Ketua Pokja)</div>
                <div><span className="w-24 inline-block font-semibold">Dari</span>: {printMasukan.stafNama} ({printMasukan.stafJabatan})</div>
                <div><span className="w-24 inline-block font-semibold">Tanggal</span>: {formatDateIndo(printMasukan.tanggalMasukan)}</div>
                <div><span className="w-24 inline-block font-semibold">Nomor Surat</span>: {printMasukan.nomorSurat}</div>
                <div><span className="w-24 inline-block font-semibold">Perihal</span>: <strong>{printMasukan.judulMasukan}</strong></div>
              </div>

              <hr className="my-4 border-black" />

              {/* Bab I s.d. Bab V */}
              <div className="space-y-4 text-justify">
                <div>
                  <div className="font-bold font-sans">I. PERSOALAN</div>
                  <p className="mt-1">
                    Sehubungan dengan surat nomor {printMasukan.nomorSurat} perihal &ldquo;{printMasukan.perihalSurat}&rdquo;, diperlukan penelaahan teknis dan yuridis guna memastikan keselarasan pelaksanaan tugas fasilitasi pengadaan tanah di Provinsi Jawa Tengah.
                  </p>
                </div>

                <div>
                  <div className="font-bold font-sans">II. PRAANGGAPAN</div>
                  <p className="mt-1">
                    Semua ketentuan yang berlaku dalam Peraturan Perundang-undangan Bidang Pengadaan Tanah dan Tata Ruang telah dijadikan acuan penelaahan.
                  </p>
                </div>

                <div>
                  <div className="font-bold font-sans">III. FAKTA YANG MEMPENGARUHI & ANALISIS</div>
                  <p className="mt-1 whitespace-pre-line">
                    {printMasukan.isiMasukan}
                  </p>
                </div>

                <div>
                  <div className="font-bold font-sans">IV. KESIMPULAN DAN SARAN TINDAK LANJUT</div>
                  <p className="mt-1 font-semibold whitespace-pre-line">
                    {printMasukan.saranRekomendasi}
                  </p>
                </div>
              </div>

              {/* Signature */}
              <div className="mt-10 flex justify-between font-sans text-xs">
                <div>
                  Mengetahui:<br />
                  <strong>Ketua {printMasukan.pokjaNama}</strong>
                  <br /><br /><br />
                  <u>(Tanda Tangan & Cap)</u>
                </div>
                <div className="text-right">
                  Semarang, {formatDateIndo(printMasukan.tanggalMasukan)}<br />
                  <strong>Penelaah / Staf Pelaksana,</strong>
                  <br /><br /><br />
                  <u><strong>{printMasukan.stafNama}</strong></u><br />
                  NIP. {printMasukan.stafNip}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Input Modal */}
      <InputMasukanStafModal
        isOpen={isInputModalOpen}
        onClose={() => setIsInputModalOpen(false)}
      />
    </div>
  );
};
