import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Surat, TindakLanjutJenis, ProgresStatus } from '../../types';
import {
  X,
  Archive,
  CheckCircle2,
  CalendarCheck,
  Upload,
  Clock,
  AlertCircle,
  FileText,
  MapPin,
  Printer,
} from 'lucide-react';
import { formatDateIndo } from '../../utils/helpers';

interface TindakLanjutModalProps {
  surat: Surat | null;
  onClose: () => void;
  onOpenPdf: (surat: Surat) => void;
  onOpenLembarDisposisi?: (surat: Surat) => void;
}

export const TindakLanjutModal: React.FC<TindakLanjutModalProps> = ({
  surat,
  onClose,
  onOpenPdf,
  onOpenLembarDisposisi,
}) => {
  const { currentUser, disposisiList, tindakLanjutStaf } = useApp();

  const [jenisTindakLanjut, setJenisTindakLanjut] = useState<TindakLanjutJenis>(
    surat?.kategori === 'Undangan' ? 'Hadir' : 'Kerjakan'
  );

  // Kerjakan fields
  const [catatan, setCatatan] = useState('');
  const [progresStatus, setProgresStatus] = useState<ProgresStatus>('Sedang Dikerjakan');
  const [progresPersen, setProgresPersen] = useState<number>(50);
  const [namaLampiran, setNamaLampiran] = useState('hasil_telaah_pertanahan.pdf');
  const [tanggalSelesai, setTanggalSelesai] = useState('');

  // Hadir fields (khusus undangan)
  const [kehadiran, setKehadiran] = useState<'Hadir' | 'Tidak Hadir'>('Hadir');
  const [alasanTidakHadir, setAlasanTidakHadir] = useState('');

  if (!surat) return null;

  // Find relevant disposition for this user
  const userDisp = disposisiList.find(
    (d) => d.suratId === surat.id && d.kepadaUserId === currentUser.id
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!userDisp) {
      alert('Tidak ditemukan data disposisi untuk akun Anda pada surat ini!');
      return;
    }

    if (jenisTindakLanjut === 'Arsipkan' && !catatan.trim()) {
      alert('Mohon isi catatan atau alasan pengarsipan!');
      return;
    }

    if (jenisTindakLanjut === 'Hadir' && kehadiran === 'Tidak Hadir' && !alasanTidakHadir.trim()) {
      alert('Mohon sebutkan alasan tidak dapat hadir!');
      return;
    }

    tindakLanjutStaf(surat.id, userDisp.id, jenisTindakLanjut, {
      catatan: catatan || (jenisTindakLanjut === 'Hadir' ? `Konfirmasi: ${kehadiran}` : 'Tindak lanjut staf'),
      progresStatus: jenisTindakLanjut === 'Kerjakan' ? progresStatus : undefined,
      progresPersen: jenisTindakLanjut === 'Kerjakan' ? progresPersen : undefined,
      namaLampiran: jenisTindakLanjut === 'Kerjakan' ? namaLampiran : undefined,
      kehadiran: jenisTindakLanjut === 'Hadir' ? kehadiran : undefined,
      alasanTidakHadir: jenisTindakLanjut === 'Hadir' ? alasanTidakHadir : undefined,
      tanggalSelesai: progresStatus === 'Selesai' ? new Date().toISOString().split('T')[0] : tanggalSelesai,
    });

    alert('Tindak lanjut berhasil disimpan dan alur status telah diperbarui!');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 to-indigo-950 text-white px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center text-amber-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">Form Tindak Lanjut Staf</h2>
              <p className="text-xs text-blue-200">
                Oleh: {currentUser.nama} ({currentUser.jabatan})
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
          {/* Summary Letter Card */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <span className="font-mono text-slate-500 font-bold">{surat.nomorAgenda}</span>
              <div className="flex items-center gap-2">
                {onOpenLembarDisposisi && (
                  <button
                    type="button"
                    onClick={() => onOpenLembarDisposisi(surat)}
                    className="text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 px-2.5 py-1 rounded-lg font-bold inline-flex items-center gap-1 text-[11px] transition-colors"
                    title="Cetak Surat sekaligus Lembar Disposisi Resmi"
                  >
                    <Printer className="w-3.5 h-3.5 text-amber-700" />
                    <span>Cetak Surat & Lembar Disposisi</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onOpenPdf(surat)}
                  className="text-blue-900 hover:text-blue-700 font-bold inline-flex items-center gap-1 text-[11px]"
                >
                  <FileText className="w-3.5 h-3.5" /> Buka Dokumen PDF
                </button>
              </div>
            </div>
            <div className="font-bold text-slate-900 text-sm">{surat.perihal}</div>
            <div className="text-slate-600">
              Nomor: {surat.nomorSurat} • Asal: {surat.asalSurat}
            </div>

            {userDisp?.narasi && (
              <div className="mt-2 bg-blue-50/70 border border-blue-200 rounded-lg p-2.5">
                <span className="font-semibold text-blue-950 block text-[11px]">
                  Instruksi dari Ketua Pokja:
                </span>
                <span className="italic text-slate-800 font-serif text-[12px]">
                  &ldquo;{userDisp.narasi}&rdquo;
                </span>
              </div>
            )}
          </div>

          {/* 3 Main Action Choice Buttons (Section L) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
              Pilih Jenis Tindak Lanjut:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Choice 1: Arsipkan */}
              <button
                type="button"
                onClick={() => setJenisTindakLanjut('Arsipkan')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  jenisTindakLanjut === 'Arsipkan'
                    ? 'bg-slate-800 text-white border-slate-800 ring-2 ring-slate-400 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Archive className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs">1. Arsipkan Surat</div>
                  <div className={`text-[10px] mt-0.5 ${jenisTindakLanjut === 'Arsipkan' ? 'text-slate-300' : 'text-slate-500'}`}>
                    Surat hanya perlu disimpan sebagai arsip.
                  </div>
                </div>
              </button>

              {/* Choice 2: Kerjakan */}
              <button
                type="button"
                onClick={() => setJenisTindakLanjut('Kerjakan')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  jenisTindakLanjut === 'Kerjakan'
                    ? 'bg-blue-900 text-white border-blue-900 ring-2 ring-blue-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <Clock className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs">2. Kerjakan Surat</div>
                  <div className={`text-[10px] mt-0.5 ${jenisTindakLanjut === 'Kerjakan' ? 'text-blue-200' : 'text-slate-500'}`}>
                    Membutuhkan tindak lanjut teknis / telaah.
                  </div>
                </div>
              </button>

              {/* Choice 3: Hadir (Khusus Undangan) */}
              <button
                type="button"
                onClick={() => setJenisTindakLanjut('Hadir')}
                className={`p-3 rounded-xl border text-left transition-all flex items-start gap-2.5 ${
                  jenisTindakLanjut === 'Hadir'
                    ? 'bg-purple-900 text-white border-purple-900 ring-2 ring-purple-300 shadow-xs'
                    : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                }`}
              >
                <CalendarCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-xs">3. Konfirmasi Hadir</div>
                  <div className={`text-[10px] mt-0.5 ${jenisTindakLanjut === 'Hadir' ? 'text-purple-200' : 'text-slate-500'}`}>
                    Untuk persuratan agenda / undangan.
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Form Content: Pilihan 1 - ARSIPKAN */}
          {jenisTindakLanjut === 'Arsipkan' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 animate-in fade-in text-xs">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <Archive className="w-4 h-4 text-slate-700" />
                Konfirmasi Penyimpanan ke Arsip Digital
              </div>
              <p className="text-slate-500 text-[11px]">
                Surat ini akan diberi status <strong>&ldquo;Diarsipkan&rdquo;</strong> dan masuk ke daftar arsip digital Bidang Pertanahan tanpa penugasan lanjutan.
              </p>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan Pengarsipan <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Contoh: Dokumen disimpan sebagai referensi database pengadaan tanah seksi Demak..."
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-700 focus:outline-hidden"
                />
              </div>
            </div>
          )}

          {/* Form Content: Pilihan 2 - KERJAKAN */}
          {jenisTindakLanjut === 'Kerjakan' && (
            <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 space-y-4 animate-in fade-in text-xs">
              <div className="font-bold text-blue-950 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-800" />
                Detail Pengerjaan & Progres Tindak Lanjut
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Status Tahapan Pengerjaan
                  </label>
                  <select
                    value={progresStatus}
                    onChange={(e) => setProgresStatus(e.target.value as ProgresStatus)}
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  >
                    <option value="Belum Mulai">Belum Mulai</option>
                    <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
                    <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                    <option value="Selesai">Selesai (Tuntas)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Estimasi Progres: {progresPersen}%
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={progresPersen}
                    onChange={(e) => setProgresPersen(Number(e.target.value))}
                    className="w-full accent-blue-900 mt-2"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Catatan Uraian Pekerjaan / Hasil Telaah
                  </label>
                  <textarea
                    rows={3}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Jelaskan tindakan yang telah atau sedang diambil, koordinasi yang dilakukan, dsb..."
                    className="w-full px-3 py-2 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Unggah Berkas / Dokumen Hasil Kerja (Lampiran)
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={namaLampiran}
                      onChange={(e) => setNamaLampiran(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                      placeholder="nama_dokumen_lampiran.pdf"
                    />
                    <label className="px-3 py-2 bg-blue-900 text-white rounded-lg cursor-pointer hover:bg-blue-800 font-medium shrink-0 flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Pilih File</span>
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            setNamaLampiran(e.target.files[0].name);
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Form Content: Pilihan 3 - HADIR (Undangan) */}
          {jenisTindakLanjut === 'Hadir' && (
            <div className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-4 animate-in fade-in text-xs">
              <div className="font-bold text-purple-950 flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-purple-800" />
                Konfirmasi Kehadiran Acara / Rapat Undangan
              </div>

              {surat.agenda ? (
                <div className="p-3 bg-white border border-purple-200 rounded-lg space-y-1 text-slate-700">
                  <div className="font-bold text-purple-900">{surat.agenda.namaAcara}</div>
                  <div>📅 Tanggal: {formatDateIndo(surat.agenda.tanggalAcara)} ({surat.agenda.waktuAcara})</div>
                  <div>📍 Tempat: {surat.agenda.tempatAcara}</div>
                </div>
              ) : (
                <div className="p-2.5 bg-white border border-purple-200 rounded-lg text-slate-500">
                  Surat ini tergolong agenda dinas / pertemuan resmi.
                </div>
              )}

              {/* Attendance toggle buttons */}
              <div>
                <label className="block font-semibold text-slate-700 mb-2">
                  Pernyataan Kehadiran Anda:
                </label>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setKehadiran('Hadir')}
                    className={`flex-1 py-2.5 rounded-xl font-bold border transition-colors ${
                      kehadiran === 'Hadir'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    ✓ Hadir Mengikuti Acara
                  </button>
                  <button
                    type="button"
                    onClick={() => setKehadiran('Tidak Hadir')}
                    className={`flex-1 py-2.5 rounded-xl font-bold border transition-colors ${
                      kehadiran === 'Tidak Hadir'
                        ? 'bg-rose-600 text-white border-rose-700 shadow-xs'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    ✕ Tidak Dapat Hadir
                  </button>
                </div>
              </div>

              {kehadiran === 'Tidak Hadir' ? (
                <div>
                  <label className="block font-semibold text-rose-800 mb-1">
                    Alasan Tidak Hadir <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required
                    rows={2}
                    value={alasanTidakHadir}
                    onChange={(e) => setAlasanTidakHadir(e.target.value)}
                    placeholder="Contoh: Bersamaan dengan agenda sidang mediasi sengketa di Pengadilan Negeri..."
                    className="w-full px-3 py-2 bg-white border border-rose-300 rounded-lg focus:ring-2 focus:ring-rose-800 focus:outline-hidden"
                  />
                </div>
              ) : (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Catatan Kesiapan / Bahan Rapat
                  </label>
                  <textarea
                    rows={2}
                    value={catatan}
                    onChange={(e) => setCatatan(e.target.value)}
                    placeholder="Contoh: Menyiapkan bahan materi paparan peta bidang jalan tol..."
                    className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-800 focus:outline-hidden"
                  />
                </div>
              )}
            </div>
          )}

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
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Simpan Tindak Lanjut
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
