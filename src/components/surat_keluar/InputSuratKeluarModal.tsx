import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  Send,
  Upload,
  Camera,
  Calendar,
  FileText,
  CheckCircle2,
  Folder,
  ExternalLink,
  Eye,
  Hash,
  User,
} from 'lucide-react';
import { DocumentScannerModal } from '../common/DocumentScannerModal';
import { GOOGLE_DRIVE_FOLDER_URL } from '../../data/initialData';
import { SuratKeluar } from '../../types';

interface InputSuratKeluarModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newSuratKeluar: SuratKeluar) => void;
}

export const InputSuratKeluarModal: React.FC<InputSuratKeluarModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { currentUser, addSuratKeluar, getNextNomorSuratKeluar } = useApp();

  const [tanggalSurat, setTanggalSurat] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [tujuanSurat, setTujuanSurat] = useState('');
  const [perihal, setPerihal] = useState('');
  const [keterangan, setKeterangan] = useState('');

  // File upload / scan state
  const [fileName, setFileName] = useState('surat_keluar_bidang_3.pdf');
  const [fileSize, setFileSize] = useState('1.1 MB');
  const [filePdfData, setFilePdfData] = useState<string | undefined>(undefined);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Google Drive custom url or default
  const [googleDriveUrl, setGoogleDriveUrl] = useState(GOOGLE_DRIVE_FOLDER_URL);

  // Calculate year and next number preview
  const selectedYear = useMemo(() => {
    if (!tanggalSurat) return new Date().getFullYear();
    const parsedYear = parseInt(tanggalSurat.split('-')[0], 10);
    return isNaN(parsedYear) ? new Date().getFullYear() : parsedYear;
  }, [tanggalSurat]);

  const previewNomorData = useMemo(() => {
    return getNextNomorSuratKeluar(tanggalSurat || selectedYear);
  }, [getNextNomorSuratKeluar, tanggalSurat, selectedYear]);

  if (!isOpen) return null;

  const handlePdfFile = (file: File) => {
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    const isImg = file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name);

    if (!isPdf && !isImg) {
      alert('Mohon pilih file PDF atau file gambar hasil scan dokumen (.pdf, .jpg, .png)!');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      alert('Ukuran file maksimal 20 MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      setFileName(file.name);
      setFileSize(sizeStr);
      setFilePdfData(dataUrl);
      setScanSuccess(true);
    };
    reader.readAsDataURL(file);
  };

  const handleScanComplete = (result: { fileName: string; fileSize: string; filePdf: string }) => {
    setFileName(result.fileName);
    setFileSize(result.fileSize);
    setFilePdfData(result.filePdf);
    setScanSuccess(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!tujuanSurat.trim() || !perihal.trim() || !tanggalSurat) {
      alert('Mohon lengkapi Tujuan Surat, Perihal Surat, dan Tanggal Surat!');
      return;
    }

    const created = addSuratKeluar({
      tanggalSurat,
      tujuanSurat: tujuanSurat.trim(),
      perihal: perihal.trim(),
      keterangan: keterangan.trim(),
      fileName,
      fileSize,
      filePdf: filePdfData,
      googleDriveUrl: googleDriveUrl.trim() || GOOGLE_DRIVE_FOLDER_URL,
    });

    alert(
      `Nomor Surat Keluar Berhasil Diterbitkan!\n\nNomor: ${created.nomorSurat}\nTujuan: ${created.tujuanSurat}\nDokumen otomatis tersimpan ke Google Drive.`
    );

    if (onSuccess) {
      onSuccess(created);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-blue-950 text-white px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900 flex items-center justify-center text-amber-400">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">
                Penomoran Surat Keluar Bidang Pertanahan
              </h2>
              <p className="text-xs text-blue-200">
                Format Resmi: (Nomor urut 4 digit)/Bid III/(Bulan Romawi)/(Tahun)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Top Live Number Callout */}
          <div className="bg-gradient-to-r from-blue-950 to-blue-900 rounded-xl p-4 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
            <div className="space-y-0.5">
              <span className="text-[11px] uppercase tracking-wider text-amber-300 font-semibold flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5" /> Pratinjau Nomor Surat Keluar Otomatis
              </span>
              <div className="text-xl sm:text-2xl font-mono font-black tracking-wider text-white">
                {previewNomorData.nomorSurat}
              </div>
              <div className="text-[11px] text-blue-200">
                Nomor Urut #{previewNomorData.nomorUrut} • Bulan Romawi: {previewNomorData.bulanRomawi || '-'} • Tahun Anggaran {selectedYear}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3.5 py-2 rounded-lg text-right text-xs shrink-0">
              <div className="text-[10px] text-blue-200 uppercase font-bold">Pemohon / Pengambil</div>
              <div className="font-semibold text-amber-300 truncate max-w-[200px]">
                {currentUser?.nama || 'Pegawai Disperakim'}
              </div>
              <div className="text-[10px] text-slate-300 font-mono">
                {currentUser?.nip ? `NIP. ${currentUser.nip}` : currentUser?.role}
              </div>
            </div>
          </div>

          {/* Section 1: Detail Surat Keluar */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-800" /> Informasi & Tujuan Surat Keluar
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Surat Keluar <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="date"
                    required
                    value={tanggalSurat}
                    onChange={(e) => setTanggalSurat(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Nomor surat otomatis menyesuaikan tahun tanggal surat ini.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Surat yang Diterbitkan
                </label>
                <input
                  type="text"
                  disabled
                  value={previewNomorData.nomorSurat}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-lg font-mono font-bold text-blue-950 cursor-not-allowed"
                />
                <p className="text-[10px] text-slate-500 mt-1">
                  Otomatis terisi berurutan dan reset per tahun berjalan.
                </p>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Tujuan Surat / Instansi Penerima <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kepala Kantor Pertanahan Kabupaten Grobogan"
                  value={tujuanSurat}
                  onChange={(e) => setTujuanSurat(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Perihal Surat Keluar <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Contoh: Permohonan Data Penetapan Lokasi Pengadaan Tanah Pembangunan Sarana Umum"
                  value={perihal}
                  onChange={(e) => setPerihal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan Tambahan (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Disampaikan melalui kurir dan email resmi"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Upload / Pindai Dokumen Surat Keluar */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-800" /> Unggah Dokumen Surat (PDF atau Pindai Kamera)
              </span>
              <span className="text-[10px] text-blue-700 bg-blue-100 font-bold px-2 py-0.5 rounded">
                Standar: PDF / Image
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              {/* Scan option */}
              <div className="border border-blue-200 rounded-xl p-4 bg-gradient-to-br from-blue-50/70 to-slate-50 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-blue-950 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-900" />
                    Pilihan A: PINDAI SURAT KELUAR (KAMERA)
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1.5 leading-relaxed">
                    Pindai surat fisik yang telah ditandatangani melalui kamera laptop/HP. Filter teks tajam dan otomatis terkonversi menjadi format PDF.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="mt-3.5 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <Camera className="w-4 h-4 text-amber-400" />
                  {scanSuccess ? 'Scan Ulang / Ubah Berkas' : 'Buka Pindai Dokumen Kamera'}
                </button>
              </div>

              {/* Upload PDF with Drag & Drop */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragOver(true);
                }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setIsDragOver(false);
                  if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                    handlePdfFile(e.dataTransfer.files[0]);
                  }
                }}
                className={`border-2 border-dashed rounded-xl p-4 flex flex-col justify-between transition-colors ${
                  isDragOver
                    ? 'border-blue-700 bg-blue-100/50'
                    : 'border-slate-300 bg-slate-50'
                }`}
              >
                <div>
                  <div className="font-bold text-slate-800 flex items-center gap-2">
                    <Upload className="w-4 h-4 text-blue-900" />
                    Pilihan B: UPLOAD DARI KOMPUTER / HP
                  </div>
                  <p className="text-slate-500 text-[11px] mt-1.5 leading-relaxed">
                    Tarik dan lepaskan file PDF naskah surat keluar (.pdf, .jpg, .png) dari perangkat Anda.
                  </p>
                </div>
                <label className="mt-3.5 px-3.5 py-2.5 bg-white border border-slate-300 hover:border-blue-900 hover:bg-blue-50/50 text-slate-800 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors text-center shadow-2xs">
                  <FileText className="w-4 h-4 text-blue-900" />
                  <span>Pilih Dokumen dari Perangkat</span>
                  <input
                    type="file"
                    accept=".pdf,application/pdf,image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handlePdfFile(e.target.files[0]);
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* Selected File Status & Live Thumbnail Badge */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                {filePdfData && filePdfData.startsWith('data:image') ? (
                  <div className="relative group w-12 h-12 shrink-0 rounded border border-blue-300 overflow-hidden bg-white">
                    <img
                      src={filePdfData}
                      alt="Thumbnail Scan"
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center text-blue-900 shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                )}
                <div className="min-w-0">
                  <div className="font-bold text-blue-950 truncate flex items-center gap-1.5">
                    {fileName}
                    {scanSuccess && (
                      <span className="bg-emerald-100 text-emerald-800 text-[10px] px-1.5 py-0.2 rounded font-medium">
                        Siap Diunggah
                      </span>
                    )}
                  </div>
                  <div className="text-slate-500 text-[11px]">{fileSize} • Format Naskah Surat Resmi</div>
                </div>
              </div>

              {filePdfData && (
                <a
                  href={filePdfData}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-900 border border-blue-200 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5 text-blue-700" />
                  <span>Lihat Dokumen</span>
                </a>
              )}
            </div>

            {/* Google Drive Integration Info */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-amber-500" />
                  Penyimpanan Otomatis ke Google Drive Disperakim
                </span>
                <a
                  href={GOOGLE_DRIVE_FOLDER_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-blue-900 border border-slate-200 rounded-lg text-[11px] font-semibold transition-colors"
                >
                  <ExternalLink className="w-3 h-3" />
                  <span>Buka Folder Drive</span>
                </a>
              </div>
              <p className="text-[11px] text-slate-500">
                Setiap dokumen surat keluar yang Anda unggah/scan otomatis disimpan dan terintegrasi dengan folder Google Drive resmi Bidang Pertanahan:
              </p>
              <input
                type="url"
                value={googleDriveUrl}
                onChange={(e) => setGoogleDriveUrl(e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono text-[11px] text-slate-700 bg-white focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
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
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Terbitkan Nomor Surat Keluar</span>
            </button>
          </div>
        </form>
      </div>

      {/* Document Scanner Modal */}
      <DocumentScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanComplete={handleScanComplete}
      />
    </div>
  );
};
