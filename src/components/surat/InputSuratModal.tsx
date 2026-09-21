import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import {
  X,
  FilePlus,
  Upload,
  Camera,
  Calendar,
  Clock,
  MapPin,
  CheckCircle2,
  FileText,
  FileCheck,
  Send,
  Eye,
} from 'lucide-react';
import { SuratKategori } from '../../types';
import { DocumentScannerModal } from '../common/DocumentScannerModal';
import { GOOGLE_DRIVE_FOLDER_URL } from '../../data/initialData';
import { ExternalLink, Folder } from 'lucide-react';

interface InputSuratModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialScannedDoc?: { fileName: string; fileSize: string; filePdf: string } | null;
  initialMode?: 'surat_masuk' | 'disposisi_kadis';
}

export const InputSuratModal: React.FC<InputSuratModalProps> = ({
  isOpen,
  onClose,
  initialScannedDoc,
  initialMode = 'surat_masuk',
}) => {
  const { addSurat, pokjas, disposisiKabid } = useApp();

  // Mode: 'surat_masuk' (tanpa disposisi kadis) vs 'disposisi_kadis' (lengkap narasi disposisi kadis)
  const [inputMode, setInputMode] = useState<'surat_masuk' | 'disposisi_kadis'>(initialMode);

  const [nomorSurat, setNomorSurat] = useState('');
  const [asalSurat, setAsalSurat] = useState('');
  const [perihal, setPerihal] = useState('');
  const [tanggalSurat, setTanggalSurat] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [tanggalDisposisiMasuk, setTanggalDisposisiMasuk] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [kategori, setKategori] = useState<SuratKategori>('Surat');
  const [narasiDisposisiKadis, setNarasiDisposisiKadis] = useState(
    'Untuk ditindaklanjuti dan dikoordinasikan dengan Pokja terkait sesuai tugas dan fungsi.'
  );

  // File upload / scan state
  const [fileName, setFileName] = useState('surat_masuk.pdf');
  const [fileSize, setFileSize] = useState('1.2 MB');
  const [filePdfData, setFilePdfData] = useState<string | undefined>(undefined);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [scanSuccess, setScanSuccess] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);

  // Effect to populate initial scanned document if passed from header scanner
  React.useEffect(() => {
    if (initialScannedDoc) {
      setFileName(initialScannedDoc.fileName);
      setFileSize(initialScannedDoc.fileSize);
      setFilePdfData(initialScannedDoc.filePdf);
      setScanSuccess(true);
    }
  }, [initialScannedDoc]);

  // Option: Sekaligus Input Disposisi Kabid
  const [withDisposisi, setWithDisposisi] = useState(false);
  const [targetPokjaIds, setTargetPokjaIds] = useState<string[]>(['pokja-1']);
  const [disposisiNarasi, setDisposisiNarasi] = useState(
    'Mohon diteliti kelengkapan berkas dan dikoordinasikan dengan Pokja terkait.'
  );

  // Khusus Undangan
  const [namaAcara, setNamaAcara] = useState('');
  const [tanggalAcara, setTanggalAcara] = useState(
    new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]
  );
  const [waktuAcara, setWaktuAcara] = useState('09:00 WIB');
  const [tempatAcara, setTempatAcara] = useState('Ruang Rapat Bidang Pertanahan');
  const [keteranganAcara, setKeteranganAcara] = useState('');

  // Integrasi Google Drive (Req 4)
  const [googleDriveUrl, setGoogleDriveUrl] = useState(GOOGLE_DRIVE_FOLDER_URL);

  if (!isOpen) return null;

  const handlePdfFile = (file: File) => {
    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    const isImg = file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name);
    if (!isPdf && !isImg) {
      alert('Mohon pilih file format PDF (.pdf) atau gambar naskah pindaian (.jpg, .png, .webp)!');
      return;
    }
    setFileName(file.name);
    setFileSize(`${(file.size / (1024 * 1024)).toFixed(2)} MB`);
    const reader = new FileReader();
    reader.onload = (e) => {
      setFilePdfData(e.target?.result as string);
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

  const togglePokja = (pokjaId: string) => {
    setTargetPokjaIds((prev) =>
      prev.includes(pokjaId)
        ? prev.filter((id) => id !== pokjaId)
        : [...prev, pokjaId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nomorSurat.trim() || !perihal.trim() || !asalSurat.trim()) {
      alert('Mohon lengkapi data nomor surat, perihal, dan asal surat!');
      return;
    }

    if (inputMode === 'disposisi_kadis' && !narasiDisposisiKadis.trim()) {
      alert('Mohon isi narasi disposisi dari Kepala Dinas!');
      return;
    }

    let agendaData = undefined;
    if (kategori === 'Undangan') {
      agendaData = {
        namaAcara: namaAcara || perihal,
        tanggalAcara,
        waktuAcara,
        tempatAcara,
        keterangan: keteranganAcara,
      };
    }

    const narasiKadisToSave = inputMode === 'disposisi_kadis' ? narasiDisposisiKadis.trim() : '';

    const createdSurat = addSurat(
      {
        nomorSurat,
        asalSurat,
        perihal,
        tanggalSurat,
        kategori,
        tanggalDisposisiMasuk,
        narasiDisposisiKadis: narasiKadisToSave,
        fileName,
        fileSize,
        filePdf: filePdfData,
        googleDriveUrl: googleDriveUrl.trim() || GOOGLE_DRIVE_FOLDER_URL,
      },
      agendaData
    );

    // If sekaligus disposisi
    if (inputMode === 'disposisi_kadis' && withDisposisi && targetPokjaIds.length > 0) {
      disposisiKabid(createdSurat.id, targetPokjaIds, disposisiNarasi, 'Normal');
    }

    if (inputMode === 'surat_masuk') {
      alert('Surat masuk berhasil dicatat ke sistem! Dokumen tersimpan ke Google Drive.');
    } else {
      alert('Surat masuk dan disposisi Kepala Dinas berhasil disimpan! Dokumen tersimpan ke Google Drive.');
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
              <FilePlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">
                {inputMode === 'surat_masuk' ? 'Input Surat Masuk' : 'Input Disposisi Kepala Dinas'}
              </h2>
              <p className="text-xs text-blue-200">
                Administrasi Persuratan Bidang Pertanahan Disperakim Prov. Jawa Tengah
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

        {/* Tab Switcher: Input Surat Masuk vs Input Disposisi Kadis (Req 2) */}
        <div className="bg-slate-100 p-2 border-b border-slate-200 flex flex-col sm:flex-row gap-1.5">
          <button
            type="button"
            onClick={() => setInputMode('surat_masuk')}
            className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              inputMode === 'surat_masuk'
                ? 'bg-white text-blue-950 shadow-sm border border-slate-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <FileText className={`w-4 h-4 ${inputMode === 'surat_masuk' ? 'text-blue-800' : 'text-slate-400'}`} />
            <div className="text-left sm:text-center">
              <div className="leading-tight">1. Input Surat Masuk</div>
              <div className="text-[10px] font-normal text-slate-500">Tanpa narasi disposisi Kadis</div>
            </div>
          </button>
          <button
            type="button"
            onClick={() => setInputMode('disposisi_kadis')}
            className={`flex-1 py-2.5 px-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              inputMode === 'disposisi_kadis'
                ? 'bg-white text-blue-950 shadow-sm border border-slate-300'
                : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            <CheckCircle2 className={`w-4 h-4 ${inputMode === 'disposisi_kadis' ? 'text-emerald-700' : 'text-slate-400'}`} />
            <div className="text-left sm:text-center">
              <div className="leading-tight">2. Input Disposisi Kadis</div>
              <div className="text-[10px] font-normal text-emerald-700">Lengkap lembar disposisi Kadis</div>
            </div>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Section 1: Data Identitas Surat */}
          <div className="space-y-4">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-800" /> Identitas Surat Masuk
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor Surat <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 005/1829/DISPERAKIM/IX/2026"
                  value={nomorSurat}
                  onChange={(e) => setNomorSurat(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Asal Instansi Pengirim <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Kanwil BPN Provinsi Jawa Tengah"
                  value={asalSurat}
                  onChange={(e) => setAsalSurat(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Perihal / Hal Surat <span className="text-rose-500">*</span>
                </label>
                <textarea
                  required
                  rows={2}
                  placeholder="Contoh: Undangan Rapat Koordinasi Fasilitasi Pengadaan Tanah Proyek Strategis Nasional"
                  value={perihal}
                  onChange={(e) => setPerihal(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Tanggal Surat Asli
                </label>
                <input
                  type="date"
                  value={tanggalSurat}
                  onChange={(e) => setTanggalSurat(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Kategori Surat
                </label>
                <select
                  value={kategori}
                  onChange={(e) => setKategori(e.target.value as SuratKategori)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden bg-white"
                >
                  <option value="Surat">1. Surat Biasa / Dinas</option>
                  <option value="Undangan">2. Undangan (Otomatis Buat Agenda)</option>
                  <option value="Tembusan">3. Tembusan / Laporan</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Upload Dokumen PDF / Scan Surat */}
          <div className="space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-800" /> Upload Dokumen PDF atau Scan Fisik Surat
              </span>
              <span className="text-[10px] text-blue-700 bg-blue-100 font-bold px-2 py-0.5 rounded">
                Standar Format: PDF
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
              {/* Scan option */}
              <div className="border border-blue-200 rounded-xl p-4 bg-gradient-to-br from-blue-50/70 to-slate-50 flex flex-col justify-between">
                <div>
                  <div className="font-bold text-blue-950 flex items-center gap-2">
                    <Camera className="w-4 h-4 text-blue-900" />
                    Pilihan A: SCAN DOKUMEN MENJADI PDF
                  </div>
                  <p className="text-slate-600 text-[11px] mt-1.5 leading-relaxed">
                    Pindai surat fisik melalui kamera laptop/tablet atau scanner eksternal. Dilengkapi filter kontras teks tajam & otomatis dikonversi ke file PDF.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="mt-3.5 px-4 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-xs"
                >
                  <Camera className="w-4 h-4 text-amber-400" />
                  {scanSuccess ? 'Scan Ulang / Ubah Hasil' : 'Buka Scanner Kamera ke PDF'}
                </button>
              </div>

              {/* Upload PDF or Scanned Images option with Drag & Drop */}
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
                    Pilihan B: UPLOAD DARI PERANGKAT (PDF / Foto Scan)
                  </div>
                  <p className="text-slate-500 text-[11px] mt-1.5 leading-relaxed">
                    Tarik dan lepaskan file PDF atau foto hasil scan (.pdf, .jpg, .png) dari komputer/HP Anda. Maksimal 15 MB.
                  </p>
                </div>
                <label className="mt-3.5 px-3.5 py-2.5 bg-white border border-slate-300 hover:border-blue-900 hover:bg-blue-50/50 text-slate-800 rounded-xl font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors text-center shadow-2xs">
                  <FileText className="w-4 h-4 text-blue-900" />
                  <span>Pilih Berkas Dokumen dari Perangkat</span>
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
                  <img
                    src={filePdfData}
                    alt="Thumbnail Pindaian"
                    className="w-9 h-11 object-cover rounded border border-blue-300 shadow-2xs shrink-0"
                  />
                ) : (
                  <FileCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                )}
                <div className="min-w-0">
                  <span className="text-blue-950 font-medium truncate block">
                    Dokumen Naskah: <strong>{fileName}</strong> ({fileSize})
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {filePdfData?.startsWith('data:image')
                      ? 'Naskah pindaian asli siap ditinjau dengan tampilan kertas otentik'
                      : 'Naskah dokumen terverifikasi siap diproses'}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {filePdfData && (
                  <span className="text-[10px] text-blue-900 font-bold bg-blue-100 px-2 py-0.5 rounded flex items-center gap-1">
                    <Eye className="w-3 h-3" /> Naskah Asli Tersemat
                  </span>
                )}
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  Format Valid
                </span>
              </div>
            </div>

            {/* Google Drive Integration Section (Req 4) */}
            <div className="bg-gradient-to-r from-slate-50 to-blue-50/40 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Folder className="w-4 h-4 text-amber-500" />
                  Integrasi Google Drive Resmi Disperakim
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
                Berkas surat terintegrasi dengan Google Drive Disperakim Prov. Jateng. Anda dapat menaruh tautan dokumen spesifik di bawah ini:
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

          {/* Mode Info Pill for Surat Masuk */}
          {inputMode === 'surat_masuk' && (
            <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-3.5 flex items-start sm:items-center gap-2.5 text-xs text-blue-950 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5 sm:mt-0" />
              <p className="leading-relaxed">
                <strong>Mode Input Surat Masuk aktif:</strong> Surat akan didaftarkan sebagai surat masuk baru tanpa narasi disposisi Kepala Dinas. Dokumen dan agenda (bila undangan) langsung terdaftar dan tersimpan otomatis ke Google Drive.
              </p>
            </div>
          )}

          {/* Section 2B: Opsi Sekaligus Buat Disposisi Kabid ke Pokja (Hanya tampil pada Mode Disposisi Kadis) */}
          {inputMode === 'disposisi_kadis' && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={withDisposisi}
                    onChange={(e) => setWithDisposisi(e.target.checked)}
                    className="rounded text-blue-900 focus:ring-0 w-4 h-4"
                  />
                  <span className="font-bold text-xs text-blue-950">
                    Sekaligus Terbitkan Disposisi Kabid ke Ketua Pokja
                  </span>
                </label>
                <span className="text-[10px] text-slate-500">
                  (Mempercepat alur jika Kadis & Kabid telah memberikan arahan tertulis)
                </span>
              </div>

              {withDisposisi && (
                <div className="pt-2 border-t border-slate-200 space-y-3 text-xs animate-in fade-in">
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1.5">
                      Pilih Pokja Tujuan:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {pokjas.map((pokja) => {
                        const isSelected = targetPokjaIds.includes(pokja.id);
                        return (
                          <label
                            key={pokja.id}
                            className={`p-2.5 rounded-lg border cursor-pointer text-left transition-colors flex items-center gap-2 ${
                              isSelected
                                ? 'bg-blue-900 text-white border-blue-900 font-bold'
                                : 'bg-white text-slate-700 border-slate-200'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => togglePokja(pokja.id)}
                              className="rounded text-blue-900"
                            />
                            <span className="text-[11px] truncate">{pokja.nama}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Instruksi / Catatan Disposisi Kabid
                    </label>
                    <input
                      type="text"
                      value={disposisiNarasi}
                      onChange={(e) => setDisposisiNarasi(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section 3: Narasi Disposisi Kepala Dinas (Hanya tampil pada Mode Disposisi Kadis) */}
          {inputMode === 'disposisi_kadis' && (
            <div className="space-y-3 animate-in fade-in">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-900 border-b border-slate-200 pb-1.5 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" /> Narasi Disposisi Kepala Dinas
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Tanggal Disposisi Masuk
                  </label>
                  <input
                    type="date"
                    value={tanggalDisposisiMasuk}
                    onChange={(e) => setTanggalDisposisiMasuk(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-slate-700 mb-1">
                    Narasi Disposisi dari Kepala Dinas <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    required={inputMode === 'disposisi_kadis'}
                    rows={2}
                    placeholder="Contoh: Untuk ditindaklanjuti sesuai tugas dan fungsi."
                    value={narasiDisposisiKadis}
                    onChange={(e) => setNarasiDisposisiKadis(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-serif italic"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Khusus Kategori "UNDANGAN" (Otomatis Buat Agenda) */}
          {kategori === 'Undangan' && (
            <div className="space-y-3 bg-purple-50/70 border border-purple-200 rounded-xl p-4.5 animate-in fade-in">
              <div className="text-xs font-bold uppercase tracking-wider text-purple-900 border-b border-purple-200 pb-1.5 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-purple-800" /> Form Tambahan: Agenda Acara Undangan
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-purple-950 mb-1">
                    Nama Acara / Kegiatan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Rapat Koordinasi Fasilitasi Pengadaan Tanah"
                    value={namaAcara}
                    onChange={(e) => setNamaAcara(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-purple-950 mb-1">
                    Tanggal Acara
                  </label>
                  <input
                    type="date"
                    value={tanggalAcara}
                    onChange={(e) => setTanggalAcara(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-800 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-purple-950 mb-1">
                    Waktu Acara
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 09:00 WIB s.d. Selesai"
                    value={waktuAcara}
                    onChange={(e) => setWaktuAcara(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-800 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-purple-950 mb-1">
                    Tempat / Lokasi Acara
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Ruang Rapat Kantor BPN Kanwil Prov. Jateng"
                    value={tempatAcara}
                    onChange={(e) => setTempatAcara(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-800 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block font-semibold text-purple-950 mb-1">
                    Keterangan Tambahan Acara
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Pakaian Batik lengan panjang, membawa berkas rekapitulasi."
                    value={keteranganAcara}
                    onChange={(e) => setKeteranganAcara(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-800 focus:outline-hidden"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Footer Buttons */}
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
              <FilePlus className="w-4 h-4 text-amber-400" />
              {inputMode === 'surat_masuk'
                ? 'Simpan Surat Masuk Baru'
                : 'Simpan Surat Masuk & Disposisi Kadis'}
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
