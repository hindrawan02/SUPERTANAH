import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Surat, DisposisiPrioritas } from '../../types';
import { X, Send, ShieldCheck, FileText, CheckSquare, Square, AlertCircle } from 'lucide-react';
import { formatDateIndo } from '../../utils/helpers';

interface DisposisiKabidModalProps {
  surat: Surat | null;
  onClose: () => void;
  onOpenPdf: (surat: Surat) => void;
}

export const DisposisiKabidModal: React.FC<DisposisiKabidModalProps> = ({
  surat,
  onClose,
  onOpenPdf,
}) => {
  const { pokjas, users, disposisiKabid } = useApp();

  const [selectedPokjas, setSelectedPokjas] = useState<string[]>([]);
  const [narasi, setNarasi] = useState(
    'Untuk ditindaklanjuti dan dikoordinasikan dengan tim teknis sesuai tugas dan fungsi.'
  );
  const [prioritas, setPrioritas] = useState<DisposisiPrioritas>('Tinggi');
  const [batasWaktu, setBatasWaktu] = useState(
    new Date(Date.now() + 86400000 * 4).toISOString().split('T')[0]
  );

  if (!surat) return null;

  const togglePokja = (id: string) => {
    if (selectedPokjas.includes(id)) {
      setSelectedPokjas(selectedPokjas.filter((p) => p !== id));
    } else {
      setSelectedPokjas([...selectedPokjas, id]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPokjas.length === 0) {
      alert('Pilih minimal satu Pokja penerima disposisi!');
      return;
    }

    disposisiKabid(surat.id, selectedPokjas, narasi, prioritas, batasWaktu);
    alert(
      `Disposisi berhasil dikirim ke ${selectedPokjas.length} Ketua Pokja! Notifikasi WhatsApp otomatis telah diterbitkan.`
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
              <h2 className="font-bold text-base sm:text-lg">Disposisi Kepala Bidang Pertanahan</h2>
              <p className="text-xs text-blue-200">
                Penerusan disposisi kepada Ketua Pokja terkait
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

            {/* Kadis Note */}
            <div className="mt-2 bg-amber-50/80 border border-amber-200 rounded-lg p-2.5">
              <span className="font-semibold text-amber-900 block text-[11px]">
                Disposisi Kepala Dinas:
              </span>
              <span className="italic text-slate-800 font-serif text-[12px]">
                &ldquo;{surat.narasiDisposisiKadis}&rdquo;
              </span>
            </div>
          </div>

          {/* Recipient Selection: 3 Pokja */}
          <div className="space-y-2.5">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Pilih Pokja Tujuan (Dapat memilih lebih dari satu): <span className="text-rose-500">*</span>
            </label>

            <div className="space-y-2">
              {pokjas.map((pokja) => {
                const isSelected = selectedPokjas.includes(pokja.id);
                const ketua = users.find((u) => u.id === pokja.ketuaId);

                return (
                  <div
                    key={pokja.id}
                    onClick={() => togglePokja(pokja.id)}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start gap-3 ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-100 shadow-xs'
                        : 'bg-white border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    <div className="mt-0.5 text-blue-900">
                      {isSelected ? (
                        <CheckSquare className="w-5 h-5 text-blue-900" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="text-xs flex-1">
                      <div className="font-bold text-slate-900">{pokja.nama}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">{pokja.deskripsi}</div>
                      {ketua && (
                        <div className="text-[11px] text-blue-800 font-medium mt-1">
                          Ketua: <strong>{ketua.nama}</strong> ({ketua.nomorWhatsapp})
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Priority & Deadline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Tingkat Prioritas
              </label>
              <select
                value={prioritas}
                onChange={(e) => setPrioritas(e.target.value as DisposisiPrioritas)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden bg-white"
              >
                <option value="Normal">Normal (Standar SOP)</option>
                <option value="Tinggi">Tinggi (Perlu Penanganan Cepat)</option>
                <option value="Mendesak">Mendesak (Segera H-1 / H-2)</option>
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

          {/* Instruksi / Catatan */}
          <div className="text-xs space-y-1">
            <label className="block font-semibold text-slate-700">
              Instruksi / Narasi Disposisi Kepala Bidang <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={3}
              value={narasi}
              onChange={(e) => setNarasi(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-serif text-[13px]"
              placeholder="Tuliskan arahan dan tugas yang harus dilakukan oleh Ketua Pokja..."
            />
          </div>

          {/* WhatsApp gateway info */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-[11px] text-emerald-900 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
            <span>
              Sistem akan otomatis mengirimkan notifikasi resmi WhatsApp kepada setiap Ketua Pokja terpilih.
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
              Kirim Disposisi ke Pokja
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
