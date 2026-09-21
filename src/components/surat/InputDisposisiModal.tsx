import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Surat, DisposisiPrioritas, User } from '../../types';
import {
  X,
  Send,
  FileText,
  Clock,
  AlertCircle,
  Users,
  CheckCircle2,
  Calendar,
  Sparkles,
  Building2,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

interface InputDisposisiModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSurat?: Surat | null;
}

const TEMPLATE_INSTRUKSI = [
  'Tindak lanjuti segera sesuai regulasi dan tupoksi Pokja.',
  'Pelajari berkas dan siapkan bahan telaahan staf / rekomendasi teknis.',
  'Koordinasikan dengan Kanwil BPN Jateng dan Pemkab/Pemkot setempat.',
  'Fasilitasi peninjauan langsung dan identifikasi batas di lapangan.',
  'Hadiri rapat koordinasi dan laporkan risalah hasil pembahasan.',
  'Teliti kelengkapan dokumen yuridis dan berkas permohonan.',
  'Arsipkan dokumen dan catat dalam buku kendali persuratan.',
];

export const InputDisposisiModal: React.FC<InputDisposisiModalProps> = ({
  isOpen,
  onClose,
  defaultSurat,
}) => {
  const {
    suratList,
    pokjas,
    users,
    currentUser,
    inputDisposisi,
    getStafByPokja,
  } = useApp();

  const [selectedSuratId, setSelectedSuratId] = useState<string>(
    defaultSurat?.id || (suratList.length > 0 ? suratList[0].id : '')
  );

  // Level Disposisi: default based on user role
  const isKabid = currentUser.role === 'kabid' || currentUser.role === 'admin_pertanahan' || currentUser.role === 'super_admin';
  const isKetuaPokja = currentUser.role === 'ketua_pokja';

  const [disposisiLevel, setDisposisiLevel] = useState<'kabid_ke_pokja' | 'pokja_ke_staf'>(
    isKetuaPokja ? 'pokja_ke_staf' : 'kabid_ke_pokja'
  );

  // Target selection
  const [selectedPokjaIds, setSelectedPokjaIds] = useState<string[]>(
    currentUser.pokjaId ? [currentUser.pokjaId] : ['pokja-1']
  );
  const [selectedStafIds, setSelectedStafIds] = useState<string[]>([]);

  // Form fields
  const [narasi, setNarasi] = useState(
    'Mohon diteliti kelengkapan berkas, dikoordinasikan dengan Pokja terkait, dan ditindaklanjuti sesuai SOP.'
  );
  const [prioritas, setPrioritas] = useState<DisposisiPrioritas>('Normal');
  const [batasWaktu, setBatasWaktu] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [sifatDisposisi, setSifatDisposisi] = useState('Penting');
  const [catatanKhusus, setCatatanKhusus] = useState('');

  // Available staff if level is pokja_ke_staf
  const [filterPokjaForStaf, setFilterPokjaForStaf] = useState<string>(
    currentUser.pokjaId || 'pokja-1'
  );

  // Synchronize surat if defaultSurat changes or modal opens
  useEffect(() => {
    if (defaultSurat?.id) {
      setSelectedSuratId(defaultSurat.id);
    }
  }, [defaultSurat]);

  if (!isOpen) return null;

  const currentSurat = suratList.find((s) => s.id === selectedSuratId) || defaultSurat || suratList[0];

  const activePokjaId = isKetuaPokja ? currentUser.pokjaId || 'pokja-1' : filterPokjaForStaf;
  const availableStaf = getStafByPokja(activePokjaId, true);

  const togglePokja = (pokjaId: string) => {
    setSelectedPokjaIds((prev) =>
      prev.includes(pokjaId)
        ? prev.filter((id) => id !== pokjaId)
        : [...prev, pokjaId]
    );
  };

  const toggleStaf = (stafId: string) => {
    setSelectedStafIds((prev) =>
      prev.includes(stafId)
        ? prev.filter((id) => id !== stafId)
        : [...prev, stafId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSuratId) {
      alert('Pilih surat masuk yang akan didisposisikan!');
      return;
    }

    if (!narasi.trim()) {
      alert('Tuliskan narasi instruksi disposisi!');
      return;
    }

    try {
      if (disposisiLevel === 'kabid_ke_pokja') {
        if (selectedPokjaIds.length === 0) {
          alert('Pilih minimal 1 Pokja tujuan disposisi!');
          return;
        }
        const success = inputDisposisi({
          suratId: selectedSuratId,
          level: 'kabid_ke_pokja',
          targetPokjaIds: selectedPokjaIds,
          narasi: catatanKhusus ? `${narasi}\n(Catatan: ${catatanKhusus})` : narasi,
          prioritas,
          batasWaktu,
        });
        if (success !== false) {
          alert('Disposisi berhasil diterbitkan ke Ketua Pokja! Notifikasi dan WhatsApp otomatis terkirim.');
          onClose();
        } else {
          alert('Terjadi kendala saat menyimpan disposisi. Silakan periksa kembali data target.');
        }
      } else {
        if (selectedStafIds.length === 0) {
          alert('Pilih minimal 1 Staf pelaksana tugas disposisi!');
          return;
        }
        const success = inputDisposisi({
          suratId: selectedSuratId,
          level: 'pokja_ke_staf',
          targetStafIds: selectedStafIds,
          narasi: catatanKhusus ? `${narasi}\n(Catatan: ${catatanKhusus})` : narasi,
          prioritas,
          batasWaktu,
        });
        if (success !== false) {
          alert('Disposisi berhasil diteruskan ke Staf Pelaksana! Tugas telah masuk ke dashboard staf.');
          onClose();
        } else {
          alert('Terjadi kendala saat menyimpan disposisi staf.');
        }
      }
    } catch (err) {
      console.error('Submit disposisi error:', err);
      alert('Terjadi kesalahan saat menyimpan disposisi.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-blue-950 text-white px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-blue-950 flex items-center justify-center font-bold shadow-xs">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">Input Lembar Disposisi Elektronik</h2>
              <p className="text-xs text-blue-200">
                Bidang Pertanahan • DISPERAKIM Provinsi Jawa Tengah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Section 1: Pilih Surat */}
          <div className="space-y-3">
            <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-900" />
              1. Pilih Surat Masuk yang Didisposisikan
            </label>

            <select
              value={selectedSuratId}
              onChange={(e) => setSelectedSuratId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-blue-900 focus:bg-white focus:outline-hidden"
            >
              {suratList.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.nomorAgenda}] {s.nomorSurat} - {s.perihal.substring(0, 65)}... ({s.asalSurat})
                </option>
              ))}
            </select>

            {currentSurat && (
              <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 space-y-1 text-slate-700">
                <div className="flex items-center justify-between font-bold text-blue-950">
                  <span>Nomor Agenda: {currentSurat.nomorAgenda}</span>
                  <span className="bg-blue-200/60 text-blue-900 px-2 py-0.5 rounded text-[10px]">
                    {currentSurat.kategori}
                  </span>
                </div>
                <div className="font-semibold text-slate-900">{currentSurat.perihal}</div>
                <div className="text-[11px] text-slate-500">
                  Pengirim: <strong>{currentSurat.asalSurat}</strong> • Tanggal: {currentSurat.tanggalSurat}
                </div>
                {currentSurat.narasiDisposisiKadis && (
                  <div className="mt-2 pt-2 border-t border-blue-200/60 text-[11px] italic text-slate-600 font-serif">
                    Disposisi Kadis: "{currentSurat.narasiDisposisiKadis}"
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Tingkatan Disposisi & Tujuan */}
          <div className="space-y-3">
            <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <Users className="w-4 h-4 text-blue-900" />
              2. Tingkatan & Penerima Disposisi
            </label>

            {/* Level selection */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDisposisiLevel('kabid_ke_pokja')}
                className={`p-3 rounded-xl border text-left flex flex-col transition-all ${
                  disposisiLevel === 'kabid_ke_pokja'
                    ? 'border-blue-900 bg-blue-50/80 text-blue-950 ring-2 ring-blue-900/30'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="font-bold text-xs">Level 1: Disposisi Kabid ke Ketua Pokja</span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  Diteruskan ke 1, 2, atau 3 Ketua Pokja Bidang Pertanahan
                </span>
              </button>

              <button
                type="button"
                onClick={() => setDisposisiLevel('pokja_ke_staf')}
                className={`p-3 rounded-xl border text-left flex flex-col transition-all ${
                  disposisiLevel === 'pokja_ke_staf'
                    ? 'border-blue-900 bg-blue-50/80 text-blue-950 ring-2 ring-blue-900/30'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <span className="font-bold text-xs">Level 2: Disposisi Ketua Pokja ke Staf</span>
                <span className="text-[10px] text-slate-500 mt-0.5">
                  Ditugaskan langsung kepada staf teknis pelaksana tugas
                </span>
              </button>
            </div>

            {/* Target selection if level 1: Pokja */}
            {disposisiLevel === 'kabid_ke_pokja' ? (
              <div className="space-y-2 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <span className="font-semibold text-slate-700 block text-[11px]">
                  Pilih Pokja Tujuan Disposisi:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  {pokjas.map((pokja) => {
                    const isSelected = selectedPokjaIds.includes(pokja.id);
                    const ketua = users.find((u) => u.id === pokja.ketuaId);
                    return (
                      <label
                        key={pokja.id}
                        className={`flex flex-col p-2.5 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => togglePokja(pokja.id)}
                            className="rounded text-blue-900 focus:ring-0"
                          />
                          <span className="font-bold text-[11px] leading-tight truncate">
                            {pokja.kode}
                          </span>
                        </div>
                        <span className={`text-[10px] mt-1 line-clamp-2 ${isSelected ? 'text-blue-100' : 'text-slate-500'}`}>
                          {pokja.nama}
                        </span>
                        <span className={`text-[9px] mt-1 pt-1 border-t ${isSelected ? 'border-blue-800 text-amber-300' : 'border-slate-100 text-slate-400'}`}>
                          Ketua: {ketua?.nama?.split(',')[0]}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* Target selection if level 2: Staf */
              <div className="space-y-3 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                {!isKetuaPokja && (
                  <div className="space-y-1.5 pb-2 border-b border-slate-200">
                    <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                      Pilih Lingkup Pokja:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {pokjas.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setFilterPokjaForStaf(p.id)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                            activePokjaId === p.id
                              ? 'bg-blue-900 text-white font-bold shadow-xs'
                              : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {p.kode}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="font-semibold text-slate-700 text-[11px]">
                    Pilih Staf Pelaksana ({pokjas.find((p) => p.id === activePokjaId)?.nama}):
                  </span>
                  <span className="text-[10px] text-blue-900 font-bold bg-blue-100 px-2 py-0.5 rounded">
                    {availableStaf.length} Staf Tersedia
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {availableStaf.map((staf) => {
                    const isSelected = selectedStafIds.includes(staf.id);
                    return (
                      <label
                        key={staf.id}
                        className={`flex items-center justify-between p-2.5 rounded-lg border cursor-pointer transition-all ${
                          isSelected
                            ? 'bg-blue-900 text-white border-blue-900 shadow-xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleStaf(staf.id)}
                            className="rounded text-blue-900 focus:ring-0"
                          />
                          <div className="min-w-0">
                            <div className="font-bold text-[11px] truncate">{staf.nama}</div>
                            <div className={`text-[10px] truncate ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>
                              {staf.jabatan}
                            </div>
                          </div>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-mono ${isSelected ? 'bg-blue-800 text-amber-300' : 'bg-slate-100 text-slate-600'}`}>
                          Aktif
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Section 3: Parameter Disposisi (Sifat, Prioritas, SLA) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Sifat Disposisi</label>
              <select
                value={sifatDisposisi}
                onChange={(e) => setSifatDisposisi(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              >
                <option value="Biasa">Biasa</option>
                <option value="Penting">Penting</option>
                <option value="Rahasia">Rahasia</option>
                <option value="Sangat Segera">Sangat Segera</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Derajat Prioritas SLA</label>
              <select
                value={prioritas}
                onChange={(e) => setPrioritas(e.target.value as DisposisiPrioritas)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-bold"
              >
                <option value="Normal">🟢 Normal (3 Hari Kerja)</option>
                <option value="Tinggi">🟡 Tinggi (2 Hari Kerja)</option>
                <option value="Mendesak">🔴 Mendesak (1 Hari / 24 Jam)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Target Batas Waktu SLA</label>
              <input
                type="date"
                required
                value={batasWaktu}
                onChange={(e) => setBatasWaktu(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-medium"
              />
            </div>
          </div>

          {/* Section 4: Template Instruksi Cepat */}
          <div className="space-y-1.5">
            <span className="font-semibold text-slate-700 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              Template Instruksi Cepat (Klik untuk memilih):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_INSTRUKSI.map((tmpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setNarasi(tmpl)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-100 text-slate-700 hover:text-blue-900 rounded-lg text-[10px] transition-colors text-left"
                >
                  • {tmpl}
                </button>
              ))}
            </div>
          </div>

          {/* Section 5: Narasi Instruksi */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">
              Instruksi / Catatan Disposisi <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={narasi}
              onChange={(e) => setNarasi(e.target.value)}
              placeholder="Tuliskan arahan tindak lanjut spesifik..."
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-serif"
            />
          </div>

          {/* Section 6: Catatan Tambahan Khusus */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-700">
              Catatan Tambahan Khusus (Opsional)
            </label>
            <input
              type="text"
              value={catatanKhusus}
              onChange={(e) => setCatatanKhusus(e.target.value)}
              placeholder="Contoh: Lampirkan bukti koordinasi dengan BPN saat laporan."
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
            />
          </div>

          {/* SLA & WhatsApp notice */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5 text-amber-900">
            <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-[11px] leading-relaxed">
              Sistem akan mencatat lembar disposisi ini ke dalam <strong>Audit Trail Resmi</strong>, memperbarui status surat, dan mengirimkan pesan notifikasi WhatsApp otomatis ke nomor pejabat / staf terkait.
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4 text-amber-400" />
              Terbitkan & Kirim Disposisi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
