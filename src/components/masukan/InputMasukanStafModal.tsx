import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Surat } from '../../types';
import {
  X,
  Send,
  FileText,
  Paperclip,
  CheckCircle2,
  HelpCircle,
  Upload,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface InputMasukanStafModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultSurat?: Surat | null;
}

const TEMPLATE_SARAN = [
  'Disarankan berkoordinasi langsung dengan Kanwil BPN Provinsi Jawa Tengah.',
  'Perlu dilakukan pengukuran ulang dan verifikasi batas tanah di lokasi bersama pemohon.',
  'Dokumen kepemilikan yuridis telah memenuhi syarat untuk diproses penetapan lokasi.',
  'Diperlukan rapat sinkronisasi dengan Bappeda dan Dinas PUPR terkait kesesuaian tata ruang.',
  'Rekomendasi penerbitan nota pertimbangan teknis persetujuan fasilitasi pengadaan tanah.',
];

export const InputMasukanStafModal: React.FC<InputMasukanStafModalProps> = ({
  isOpen,
  onClose,
  defaultSurat,
}) => {
  const { suratList, currentUser, pokjas, addMasukanStaf } = useApp();

  const [selectedSuratId, setSelectedSuratId] = useState<string>(
    defaultSurat?.id || (suratList.length > 0 ? suratList[0].id : '')
  );
  const [judulMasukan, setJudulMasukan] = useState('');
  const [isiMasukan, setIsMasukan] = useState('');
  const [saranRekomendasi, setSaranRekomendasi] = useState('');
  const [lampiranNama, setLampiranNama] = useState('');
  const [lampiranDataUrl, setLampiranDataUrl] = useState<string | undefined>(undefined);

  if (!isOpen) return null;

  const currentSurat = suratList.find((s) => s.id === selectedSuratId) || defaultSurat || suratList[0];
  const userPokja = pokjas.find((p) => p.id === currentUser.pokjaId);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLampiranNama(file.name);
      const reader = new FileReader();
      reader.onload = (event) => {
        setLampiranDataUrl(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedSuratId) {
      alert('Pilih surat yang berkaitan dengan masukan Anda!');
      return;
    }
    if (!judulMasukan.trim() || !isiMasukan.trim() || !saranRekomendasi.trim()) {
      alert('Mohon lengkapi judul, isi uraian analisis, dan saran rekomendasi!');
      return;
    }

    addMasukanStaf({
      suratId: selectedSuratId,
      judulMasukan,
      isiMasukan,
      saranRekomendasi,
      lampiranNama: lampiranNama || undefined,
      lampiranDataUrl,
    });

    alert('Masukan / Telaahan Staf berhasil dikirim ke Ketua Pokja!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-emerald-950 text-white px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center text-amber-300 font-bold shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">Form Masukan & Telaahan Teknis Staf</h2>
              <p className="text-xs text-emerald-200">
                Oleh: {currentUser.nama} • {userPokja?.nama || currentUser.jabatan}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-300 hover:text-white p-1 rounded-lg hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
          {/* Section 1: Referensi Surat Masuk */}
          <div className="space-y-2">
            <label className="block font-bold text-slate-800 uppercase tracking-wider text-[11px]">
              1. Pilih Surat Acuan / Tugas Terkait <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedSuratId}
              onChange={(e) => setSelectedSuratId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-800 focus:bg-white focus:outline-hidden"
            >
              {suratList.map((s) => (
                <option key={s.id} value={s.id}>
                  [{s.nomorAgenda}] {s.nomorSurat} - {s.perihal.substring(0, 70)}...
                </option>
              ))}
            </select>

            {currentSurat && (
              <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3 text-slate-700 space-y-1">
                <div className="font-bold text-emerald-950 flex items-center justify-between">
                  <span>Nomor Agenda: {currentSurat.nomorAgenda}</span>
                  <span className="text-[10px] bg-emerald-200/70 text-emerald-900 px-2 py-0.5 rounded">
                    {currentSurat.kategori}
                  </span>
                </div>
                <div className="font-semibold text-slate-900">{currentSurat.perihal}</div>
                <div className="text-[11px] text-slate-500">
                  Asal Surat: <strong>{currentSurat.asalSurat}</strong> • Tanggal: {currentSurat.tanggalSurat}
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Judul Masukan */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-800">
              Judul Pokok Pikiran / Telaahan Teknis <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Hasil Klarifikasi Lapangan Terkait Batas Tanah Sengketa di Kab. Kendal"
              value={judulMasukan}
              onChange={(e) => setJudulMasukan(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-800 focus:outline-hidden font-medium"
            />
          </div>

          {/* Section 3: Uraian Fakta & Analisis Lapangan */}
          <div className="space-y-1">
            <label className="block font-semibold text-slate-800">
              Uraian Fakta Lapangan & Analisis Yuridis / Teknis <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={4}
              placeholder="Tuliskan uraian hasil peninjauan, fakta-fakta yang ditemukan, regulasi yang berlaku, serta analisis risiko atau kendala yang dihadapi..."
              value={isiMasukan}
              onChange={(e) => setIsMasukan(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-800 focus:outline-hidden leading-relaxed font-serif"
            />
          </div>

          {/* Section 4: Saran & Rekomendasi Teknis */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="block font-semibold text-slate-800">
                Saran & Rekomendasi Teknis kepada Pimpinan <span className="text-rose-500">*</span>
              </label>
              <span className="text-[10px] text-emerald-800 font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Template Rekomendasi
              </span>
            </div>

            {/* Fast suggestion chips */}
            <div className="flex flex-wrap gap-1.5">
              {TEMPLATE_SARAN.map((saran, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSaranRekomendasi(saran)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-emerald-100 text-slate-700 hover:text-emerald-950 rounded-lg text-[10px] transition-colors text-left"
                >
                  • {saran}
                </button>
              ))}
            </div>

            <textarea
              required
              rows={3}
              placeholder="Tuliskan saran konkret langkah tindak lanjut yang perlu diambil oleh Kepala Bidang atau Ketua Pokja..."
              value={saranRekomendasi}
              onChange={(e) => setSaranRekomendasi(e.target.value)}
              className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-800 focus:outline-hidden leading-relaxed font-serif"
            />
          </div>

          {/* Section 5: Lampiran Dokumen / Foto Pendukung */}
          <div className="space-y-2 border border-slate-200 rounded-xl p-4 bg-slate-50">
            <label className="block font-semibold text-slate-800 flex items-center gap-2">
              <Paperclip className="w-4 h-4 text-emerald-800" />
              Lampiran Data Pendukung / Foto / Dokumen Kajian (Opsional)
            </label>
            <div className="flex items-center gap-3">
              <label className="px-4 py-2 bg-white border border-slate-300 hover:bg-emerald-50 text-slate-700 rounded-lg font-semibold flex items-center gap-2 cursor-pointer transition-colors">
                <Upload className="w-4 h-4 text-emerald-800" />
                <span>Pilih Berkas Lampiran</span>
                <input
                  type="file"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              {lampiranNama ? (
                <span className="text-emerald-800 font-bold bg-emerald-100 px-3 py-1 rounded-lg truncate max-w-xs">
                  {lampiranNama}
                </span>
              ) : (
                <span className="text-slate-400 text-[11px]">
                  Belum ada file dipilih (PDF, Word, Excel, atau Foto JPG)
                </span>
              )}
            </div>
          </div>

          {/* Footer actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 font-bold text-white bg-emerald-800 hover:bg-emerald-700 rounded-xl shadow-md transition-colors flex items-center gap-2"
            >
              <Send className="w-4 h-4 text-amber-300" />
              Kirim Telaahan ke Ketua Pokja
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
