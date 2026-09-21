import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Surat, DisposisiPrioritas } from '../../types';
import {
  X,
  Send,
  Users,
  CheckSquare,
  Square,
  FileText,
  Clock,
  ShieldCheck,
  AlertCircle,
} from 'lucide-react';

interface DisposisiPokjaModalProps {
  surat: Surat | null;
  onClose: () => void;
  onOpenPdf: (surat: Surat) => void;
}

export const DisposisiPokjaModal: React.FC<DisposisiPokjaModalProps> = ({
  surat,
  onClose,
  onOpenPdf,
}) => {
  const { currentUser, pokjas, getStafByPokja, disposisiKetuaPokja, disposisiList } = useApp();

  const currentPokja = pokjas.find((p) => p.id === currentUser.pokjaId);

  // Available staff: STRICTLY filtered to current Ketua Pokja's Pokja and only active
  const availableStaf = currentUser.pokjaId
    ? getStafByPokja(currentUser.pokjaId, true)
    : [];

  const [selectedStafIds, setSelectedStafIds] = useState<string[]>([]);
  const [narasi, setNarasi] = useState(
    'Siapkan bahan telaah dan koordinasikan dengan pihak terkait sesuai instruksi Kepala Bidang.'
  );
  const [prioritas, setPrioritas] = useState<DisposisiPrioritas>('Tinggi');
  const [batasWaktu, setBatasWaktu] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );

  if (!surat || !currentPokja) return null;

  // Find incoming Kabid disposition for this letter and this Pokja
  const kabidDisp = disposisiList.find(
    (d) => d.suratId === surat.id && d.pokjaId === currentPokja.id && d.level === 'kabid_ke_pokja'
  );

  const toggleStaf = (id: string) => {
    if (selectedStafIds.includes(id)) {
      setSelectedStafIds(selectedStafIds.filter((s) => s !== id));
    } else {
      setSelectedStafIds([...selectedStafIds, id]);
    }
  };

  const selectAllStaf = () => {
    if (selectedStafIds.length === availableStaf.length) {
      setSelectedStafIds([]);
    } else {
      setSelectedStafIds(availableStaf.map((s) => s.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedStafIds.length === 0) {
      alert('Pilih minimal satu staf penerima disposisi dalam Pokja Anda!');
      return;
    }

    disposisiKetuaPokja(surat.id, selectedStafIds, narasi, prioritas, batasWaktu);
    alert(
      `Disposisi berhasil dikirim ke ${selectedStafIds.length} staf! Notifikasi WhatsApp otomatis telah diterbitkan.`
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 to-indigo-950 text-white px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center text-amber-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">
                Disposisi Ketua Pokja ke Staf
              </h2>
              <p className="text-xs text-blue-200">
                {currentPokja.nama}
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

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Summary Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-mono text-slate-500">{surat.nomorAgenda}</span>
              <button
                type="button"
                onClick={() => onOpenPdf(surat)}
                className="text-blue-900 hover:text-blue-700 font-bold inline-flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5" /> Buka Dokumen PDF
              </button>
            </div>
            <div className="font-bold text-slate-900 text-sm">{surat.perihal}</div>
            <div className="text-slate-600">
              Nomor: {surat.nomorSurat} • Asal: {surat.asalSurat}
            </div>

            {/* Kabid Note if present */}
            {kabidDisp && (
              <div className="mt-2 bg-indigo-50 border border-indigo-200 rounded-lg p-2.5">
                <span className="font-semibold text-indigo-900 block text-[11px]">
                  Instruksi Kepala Bidang Pertanahan:
                </span>
                <span className="italic text-slate-800 font-serif text-[12px]">
                  &ldquo;{kabidDisp.narasi}&rdquo;
                </span>
              </div>
            )}
          </div>

          {/* Section Staf Selection: STRICT RULES AA & AB */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                Pilih Staf Pelaksana ({currentPokja.nama}): <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={selectAllStaf}
                className="text-xs text-blue-900 hover:underline font-semibold"
              >
                {selectedStafIds.length === availableStaf.length
                  ? 'Batal Pilih Semua'
                  : 'Pilih Semua Staf'}
              </button>
            </div>

            <div className="space-y-2">
              {availableStaf.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-400 bg-slate-50 rounded-xl">
                  Tidak ada staf aktif di bawah Pokja ini.
                </div>
              ) : (
                availableStaf.map((staf) => {
                  const isSelected = selectedStafIds.includes(staf.id);

                  return (
                    <div
                      key={staf.id}
                      onClick={() => toggleStaf(staf.id)}
                      className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-blue-50/90 border-blue-500 ring-2 ring-blue-100 shadow-xs'
                          : 'bg-white border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="text-blue-900">
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-blue-900" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div className="text-xs">
                          <div className="font-bold text-slate-900">{staf.nama}</div>
                          <div className="text-[11px] text-slate-500">
                            NIP. {staf.nip} • {staf.jabatan}
                          </div>
                        </div>
                      </div>

                      <div className="text-right text-[11px] text-slate-400 font-mono">
                        WA: {staf.nomorWhatsapp}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            <p className="text-[11px] text-slate-500 italic">
              * Berdasarkan aturan sistem persuratan, Ketua Pokja hanya dapat memilih staf dalam Pokja-nya.
            </p>
          </div>

          {/* Priority & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Prioritas Penanganan
              </label>
              <select
                value={prioritas}
                onChange={(e) => setPrioritas(e.target.value as DisposisiPrioritas)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden bg-white"
              >
                <option value="Normal">Normal</option>
                <option value="Tinggi">Tinggi</option>
                <option value="Mendesak">Mendesak</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Batas Waktu Tindak Lanjut (SLA)
              </label>
              <input
                type="date"
                value={batasWaktu}
                onChange={(e) => setBatasWaktu(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Instruksi kepada Staf */}
          <div className="text-xs space-y-1">
            <label className="block font-semibold text-slate-700">
              Instruksi kepada Staf <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={narasi}
              onChange={(e) => setNarasi(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-serif text-[13px]"
              placeholder="Tuliskan tugas terperinci yang wajib dilaksanakan oleh staf..."
            />
          </div>

          {/* WhatsApp gateway info */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-[11px] text-emerald-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Setiap staf yang dipilih akan mendapatkan record disposisi mandiri, notifikasi aplikasi, dan tautan WhatsApp resmi.
            </span>
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4 text-amber-400" />
              Kirim Disposisi ke Staf
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
