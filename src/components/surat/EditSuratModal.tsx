import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Surat, SuratKategori, SuratStatus } from '../../types';
import {
  X,
  Edit3,
  Upload,
  Camera,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  FileText,
  Folder,
  Save,
  AlertCircle,
} from 'lucide-react';
import { DocumentScannerModal } from '../common/DocumentScannerModal';
import { GOOGLE_DRIVE_FOLDER_URL } from '../../data/initialData';

interface EditSuratModalProps {
  isOpen: boolean;
  onClose: () => void;
  surat: Surat | null;
}

export const EditSuratModal: React.FC<EditSuratModalProps> = ({
  isOpen,
  onClose,
  surat,
}) => {
  const { editSurat, pokjas } = useApp();

  const [nomorAgenda, setNomorAgenda] = useState('');
  const [nomorSurat, setNomorSurat] = useState('');
  const [asalSurat, setAsalSurat] = useState('');
  const [perihal, setPerihal] = useState('');
  const [tanggalSurat, setTanggalSurat] = useState('');
  const [tanggalDisposisiMasuk, setTanggalDisposisiMasuk] = useState('');
  const [kategori, setKategori] = useState<SuratKategori>('Surat');
  const [status, setStatus] = useState<SuratStatus>('Surat Baru');
  const [narasiDisposisiKadis, setNarasiDisposisiKadis] = useState('');
  const [googleDriveUrl, setGoogleDriveUrl] = useState(GOOGLE_DRIVE_FOLDER_URL);

  // File replacement state
  const [fileName, setFileName] = useState('');
  const [fileSize, setFileSize] = useState('');
  const [filePdfData, setFilePdfData] = useState<string | undefined>(undefined);
  const [isFileUpdated, setIsFileUpdated] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Agenda Fields (if Undangan)
  const [namaAcara, setNamaAcara] = useState('');
  const [tanggalAcara, setTanggalAcara] = useState('');
  const [waktuAcara, setWaktuAcara] = useState('');
  const [tempatAcara, setTempatAcara] = useState('');
  const [keteranganAcara, setKeteranganAcara] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Populate data when surat changes
  useEffect(() => {
    if (surat) {
      setNomorAgenda(surat.nomorAgenda || '');
      setNomorSurat(surat.nomorSurat || '');
      setAsalSurat(surat.asalSurat || '');
      setPerihal(surat.perihal || '');
      setTanggalSurat(surat.tanggalSurat || '');
      setTanggalDisposisiMasuk(surat.tanggalDisposisiMasuk || '');
      setKategori(surat.kategori || 'Surat');
      setStatus(surat.status || 'Surat Baru');
      setNarasiDisposisiKadis(surat.narasiDisposisiKadis || '');
      setGoogleDriveUrl(surat.googleDriveUrl || GOOGLE_DRIVE_FOLDER_URL);
      setFileName(surat.fileName || '');
      setFileSize(surat.fileSize || '');
      setFilePdfData(surat.filePdf);
      setIsFileUpdated(false);

      if (surat.agenda) {
        setNamaAcara(surat.agenda.namaAcara || '');
        setTanggalAcara(surat.agenda.tanggalAcara || '');
        setWaktuAcara(surat.agenda.waktuAcara || '');
        setTempatAcara(surat.agenda.tempatAcara || '');
        setKeteranganAcara(surat.agenda.keterangan || '');
      } else {
        setNamaAcara('');
        setTanggalAcara('');
        setWaktuAcara('09:00 WIB');
        setTempatAcara('Ruang Rapat Bidang Pertanahan');
        setKeteranganAcara('');
      }
      setFeedback(null);
    }
  }, [surat]);

  if (!isOpen || !surat) return null;

  const handlePdfFile = (file: File) => {
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    const isImg = file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!isPdf && !isImg) {
      alert('Mohon pilih file format PDF (.pdf) atau gambar naskah pindaian (.jpg, .png, .webp)!');
      return;
    }
    setFileName(file.name);
    const sizeInMb = (file.size / (1024 * 1024)).toFixed(1);
    setFileSize(`${sizeInMb} MB`);

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setFilePdfData(result);
      setIsFileUpdated(true);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handlePdfFile(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomorSurat.trim() || !asalSurat.trim() || !perihal.trim()) {
      setFeedback({ type: 'error', message: 'Nomor surat, asal pengirim, dan perihal wajib diisi.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const updatedFields: Partial<Surat> = {
        nomorAgenda: nomorAgenda.trim(),
        nomorSurat: nomorSurat.trim(),
        asalSurat: asalSurat.trim(),
        perihal: perihal.trim(),
        tanggalSurat,
        tanggalDisposisiMasuk,
        kategori,
        status,
        narasiDisposisiKadis: narasiDisposisiKadis.trim(),
        googleDriveUrl: googleDriveUrl.trim() || GOOGLE_DRIVE_FOLDER_URL,
      };

      if (isFileUpdated && filePdfData) {
        updatedFields.fileName = fileName;
        updatedFields.fileSize = fileSize;
        updatedFields.filePdf = filePdfData;
      }

      if (kategori === 'Undangan' && (namaAcara.trim() || tanggalAcara)) {
        updatedFields.agenda = {
          id: surat.agenda?.id || `agenda-${surat.id}`,
          suratId: surat.id,
          namaAcara: namaAcara.trim() || perihal.trim(),
          tanggalAcara: tanggalAcara || tanggalSurat,
          waktuAcara: waktuAcara.trim() || '09:00 WIB',
          tempatAcara: tempatAcara.trim() || 'Ruang Rapat Bidang Pertanahan',
          keterangan: keteranganAcara.trim(),
        };
      } else if (kategori !== 'Undangan') {
        updatedFields.agenda = undefined;
      }

      await editSurat(surat.id, updatedFields);
      setFeedback({ type: 'success', message: 'Data surat berhasil diperbarui dan disinkronkan secara live ke seluruh pengguna!' });
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Error updating surat:', err);
      setFeedback({ type: 'error', message: `Gagal memperbarui surat: ${err?.message || 'Terjadi kesalahan sistem'}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl my-6 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/30">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Edit Data Surat Masuk
              </h2>
              <p className="text-[11px] text-blue-200">
                Pembaruan data langsung tersinkronisasi secara live ke semua pengguna
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Feedback Alert */}
        {feedback && (
          <div
            className={`px-5 py-3 text-xs flex items-center gap-2 ${
              feedback.type === 'success'
                ? 'bg-emerald-50 border-b border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-b border-rose-200 text-rose-800'
            }`}
          >
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Row 1: Nomor Agenda & Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Nomor Agenda <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nomorAgenda}
                onChange={(e) => setNomorAgenda(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                placeholder="Contoh: 001/AGD/2026"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Status Alur Persuratan <span className="text-rose-500">*</span>
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as SuratStatus)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-medium"
              >
                <option value="Surat Baru">Surat Baru</option>
                <option value="Menunggu Disposisi Kabid">Menunggu Disposisi Kabid</option>
                <option value="Sudah Didisposisikan Kabid">Sudah Didisposisikan Kabid</option>
                <option value="Menunggu Disposisi Ketua Pokja">Menunggu Disposisi Ketua Pokja</option>
                <option value="Sudah Didisposisikan ke Staf">Sudah Didisposisikan ke Staf</option>
                <option value="Belum Ditindaklanjuti">Belum Ditindaklanjuti</option>
                <option value="Sedang Dikerjakan">Sedang Dikerjakan</option>
                <option value="Hadir">Hadir</option>
                <option value="Tidak Hadir">Tidak Hadir</option>
                <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                <option value="Selesai">Selesai</option>
                <option value="Diarsipkan">Diarsipkan</option>
              </select>
            </div>
          </div>

          {/* Row 2: Nomor Surat & Kategori */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="sm:col-span-2">
              <label className="block text-slate-700 font-semibold mb-1">
                Nomor Surat Asli <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={nomorSurat}
                onChange={(e) => setNomorSurat(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                placeholder="Contoh: 005/123/DISP/2026"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Kategori Sifat Surat <span className="text-rose-500">*</span>
              </label>
              <select
                value={kategori}
                onChange={(e) => setKategori(e.target.value as SuratKategori)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-medium"
              >
                <option value="Surat">Surat Dinas Biasa</option>
                <option value="Undangan">Undangan Rapat / Acara</option>
                <option value="Tembusan">Tembusan</option>
              </select>
            </div>
          </div>

          {/* Row 3: Asal Instansi Pengirim */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Asal Instansi / Pengirim Surat <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={asalSurat}
              onChange={(e) => setAsalSurat(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              placeholder="Contoh: BPN Kantor Pertanahan Kab. Semarang"
            />
          </div>

          {/* Row 4: Perihal */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Perihal Surat <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              value={perihal}
              onChange={(e) => setPerihal(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              placeholder="Ringkasan perihal naskah surat masuk..."
            />
          </div>

          {/* Row 5: Tanggal Surat & Tanggal Disposisi Masuk */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Tanggal yang Tertera pada Naskah Surat
              </label>
              <input
                type="date"
                required
                value={tanggalSurat}
                onChange={(e) => setTanggalSurat(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Tanggal Diterima / Disposisi Masuk
              </label>
              <input
                type="date"
                required
                value={tanggalDisposisiMasuk}
                onChange={(e) => setTanggalDisposisiMasuk(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Row 6: Narasi Disposisi Kepala Dinas */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Narasi / Instruksi Disposisi Kepala Dinas (Kadis)
            </label>
            <textarea
              rows={2}
              value={narasiDisposisiKadis}
              onChange={(e) => setNarasiDisposisiKadis(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden italic"
              placeholder="Instruksi awal dari Kepala Dinas..."
            />
          </div>

          {/* Section: Khusus Undangan (Kondisional) */}
          {kategori === 'Undangan' && (
            <div className="p-3.5 bg-purple-50/70 border border-purple-200 rounded-xl space-y-3">
              <div className="flex items-center gap-1.5 font-bold text-purple-950">
                <Calendar className="w-4 h-4 text-purple-700" />
                <span>Detail Agenda Undangan & Rapat</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-medium mb-1">Nama Acara / Rapat</label>
                  <input
                    type="text"
                    value={namaAcara}
                    onChange={(e) => setNamaAcara(e.target.value)}
                    placeholder="Contoh: Rapat Koordinasi Pengadaan Tanah"
                    className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Tanggal Acara</label>
                  <input
                    type="date"
                    value={tanggalAcara}
                    onChange={(e) => setTanggalAcara(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg focus:outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-slate-600 font-medium mb-1">Waktu Acara</label>
                  <input
                    type="text"
                    value={waktuAcara}
                    onChange={(e) => setWaktuAcara(e.target.value)}
                    placeholder="09:00 WIB"
                    className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg focus:outline-hidden"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-slate-600 font-medium mb-1">Tempat Acara</label>
                  <input
                    type="text"
                    value={tempatAcara}
                    onChange={(e) => setTempatAcara(e.target.value)}
                    placeholder="Ruang Rapat Bidang Pertanahan..."
                    className="w-full px-3 py-2 bg-white border border-purple-200 rounded-lg focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section: Berkas Dokumen Surat Masuk (PDF / Gambar) */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-blue-900" />
                Berkas Dokumen Asli
              </span>
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-cyan-800 bg-cyan-50 hover:bg-cyan-100 border border-cyan-200 rounded-lg transition-colors cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Pindai Dokumen (Scanner)</span>
              </button>
            </div>

            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={handleDrop}
              className={`p-3 border-2 border-dashed rounded-lg text-center transition-colors ${
                isDragOver ? 'border-blue-600 bg-blue-50/50' : 'border-slate-300 bg-white'
              }`}
            >
              <div className="flex flex-col sm:flex-row items-center justify-center gap-2 text-slate-500">
                <Upload className="w-4 h-4 text-slate-400" />
                <span className="text-[11px]">
                  {fileName ? (
                    <strong className="text-slate-800">{fileName} ({fileSize})</strong>
                  ) : (
                    'Tarik file PDF baru ke sini atau klik tombol telusuri'
                  )}
                </span>
                <label className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded font-semibold cursor-pointer border border-slate-300 text-[11px]">
                  <span>Pilih File</span>
                  <input
                    type="file"
                    accept=".pdf,image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handlePdfFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                </label>
              </div>
              {isFileUpdated && (
                <div className="text-[10px] text-emerald-700 font-semibold mt-1">
                  ✓ Berkas baru siap disimpan menggantikan naskah lama
                </div>
              )}
            </div>
          </div>

          {/* Section: URL Google Drive */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1 flex items-center gap-1">
              <Folder className="w-3.5 h-3.5 text-emerald-600" />
              Tautan Folder Google Drive Resmi
            </label>
            <input
              type="url"
              value={googleDriveUrl}
              onChange={(e) => setGoogleDriveUrl(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg text-[11px] font-mono focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition-colors cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 bg-blue-900 hover:bg-blue-800 disabled:bg-blue-400 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-4 h-4 text-amber-300" />
              <span>{isSubmitting ? 'Menyimpan...' : 'Simpan & Sinkronkan Live'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Standalone Document Scanner Modal */}
      {isScannerOpen && (
        <DocumentScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanComplete={(result) => {
            setFileName(result.fileName);
            setFileSize(result.fileSize);
            setFilePdfData(result.filePdf);
            setIsFileUpdated(true);
            setIsScannerOpen(false);
          }}
        />
      )}
    </div>
  );
};
