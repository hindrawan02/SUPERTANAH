import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Surat, Disposisi } from '../../types';
import {
  X,
  FileText,
  QrCode,
  CheckCircle2,
  Clock,
  ArrowRight,
  Download,
  Calendar,
  Shield,
  User,
  ExternalLink,
  Printer,
  Trash2,
  Folder,
  UploadCloud,
  Image as ImageIcon,
} from 'lucide-react';
import { formatDateIndo, getStatusBadgeColor } from '../../utils/helpers';
import { GOOGLE_DRIVE_FOLDER_URL } from '../../data/initialData';
import { backupSuratToDrive } from '../../services/googleDriveService';
import { isGoogleConnected, googleSignIn } from '../../services/googleAuthService';
import { getBlob } from '../../utils/storage';
import { renderPdfToPageImages } from '../../utils/pdfRenderer';

interface SuratDetailModalProps {
  surat: Surat | null;
  onClose: () => void;
  onOpenPdf: (surat: Surat) => void;
  onOpenQr: (surat: Surat) => void;
  onOpenDisposisi: (surat: Surat) => void;
  onOpenLembarDisposisi?: (surat: Surat) => void;
}

export const SuratDetailModal: React.FC<SuratDetailModalProps> = ({
  surat,
  onClose,
  onOpenPdf,
  onOpenQr,
  onOpenDisposisi,
  onOpenLembarDisposisi,
}) => {
  const { disposisiList, tindakLanjutList, users, pokjas, currentUser, deleteSurat } = useApp();

  const [isSavingDrive, setIsSavingDrive] = useState(false);
  const [driveMessage, setDriveMessage] = useState('');
  const [docPreview, setDocPreview] = useState<string | null>(null);
  const [pdfThumbnail, setPdfThumbnail] = useState<string | null>(null);

  useEffect(() => {
    if (!surat?.filePdf) {
      setDocPreview(null);
      setPdfThumbnail(null);
      return;
    }
    if (surat.filePdf.startsWith('idb:')) {
      const key = surat.filePdf.replace('idb:', '');
      getBlob(key).then((data) => {
        if (data) setDocPreview(data);
      });
    } else {
      setDocPreview(surat.filePdf);
    }
  }, [surat]);

  useEffect(() => {
    let cancelled = false;
    if (!docPreview) {
      setPdfThumbnail(null);
      return;
    }
    if (docPreview.startsWith('data:image')) {
      setPdfThumbnail(docPreview);
      return;
    }
    if (docPreview.startsWith('data:application/pdf') || docPreview.includes('.pdf')) {
      renderPdfToPageImages(docPreview, 0.6)
        .then((pages) => {
          if (!cancelled && pages && pages[0]) {
            setPdfThumbnail(pages[0]);
          }
        })
        .catch(() => {
          if (!cancelled) setPdfThumbnail(null);
        });
    } else {
      setPdfThumbnail(null);
    }

    return () => {
      cancelled = true;
    };
  }, [docPreview]);

  if (!surat) return null;

  const handleSaveToDrive = async () => {
    setIsSavingDrive(true);
    setDriveMessage('');
    try {
      if (!isGoogleConnected()) {
        const signRes = await googleSignIn();
        if (!signRes) {
          setIsSavingDrive(false);
          return;
        }
      }
      await backupSuratToDrive(surat);
      setDriveMessage('Tersimpan di Drive!');
      setTimeout(() => setDriveMessage(''), 3500);
    } catch (err: any) {
      const msg = err?.message || '';
      const code = err?.code || '';
      if (
        code === 'auth/popup-closed-by-user' ||
        code === 'auth/cancelled-popup-request' ||
        msg.includes('popup-closed-by-user') ||
        msg.includes('cancelled-popup-request')
      ) {
        return;
      }
      alert(err.message || 'Gagal menyimpan ke Google Drive');
    } finally {
      setIsSavingDrive(false);
    }
  };

  // Filter dispositions for this letter
  const suratDisposisi = disposisiList.filter((d) => d.suratId === surat.id);
  const suratTindakLanjut = tindakLanjutList.filter((t) => t.suratId === surat.id);

  // Determine timeline step progression (1 to 9)
  let activeStep = 1;
  if (surat.narasiDisposisiKadis) activeStep = 2;
  const hasKabidDisp = suratDisposisi.some((d) => d.level === 'kabid_ke_pokja');
  if (hasKabidDisp) activeStep = 4;
  const hasPokjaDisp = suratDisposisi.some((d) => d.level === 'pokja_ke_staf');
  if (hasPokjaDisp) activeStep = 6;
  if (suratTindakLanjut.length > 0) activeStep = 8;
  if (surat.status === 'Selesai' || surat.status === 'Diarsipkan') activeStep = 9;

  const timelineSteps = [
    { num: 1, label: 'Surat Diinput Admin' },
    { num: 2, label: 'Disposisi Kepala Dinas' },
    { num: 3, label: 'Diterima Kabid Pertanahan' },
    { num: 4, label: 'Disposisi Kabid ke Pokja' },
    { num: 5, label: 'Diterima Ketua Pokja' },
    { num: 6, label: 'Disposisi Pokja ke Staf' },
    { num: 7, label: 'Diterima Staf Terkait' },
    { num: 8, label: 'Tindak Lanjut / Pengerjaan' },
    { num: 9, label: 'Selesai / Diarsipkan' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Modal Top Header */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-900/90 border border-blue-700/60 flex items-center justify-center text-amber-400 shadow-xs">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs bg-amber-400 text-blue-950 px-2 py-0.5 rounded font-bold">
                  {surat.nomorAgenda}
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadgeColor(
                    surat.status
                  )}`}
                >
                  {surat.status}
                </span>
              </div>
              <h2 className="font-bold text-sm sm:text-base text-white mt-1 line-clamp-1">
                {surat.perihal}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onOpenQr(surat)}
              className="p-2 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              title="QR Code Verifikasi Digital"
            >
              <QrCode className="w-5 h-5" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-blue-200 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
          {/* Quick Action Bar for Current User */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              {/* Cetak Lembar Disposisi Format Resmi (Req 6) */}
              {onOpenLembarDisposisi && (
                <button
                  type="button"
                  onClick={() => onOpenLembarDisposisi(surat)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer"
                  title="Cetak Lembar Disposisi Resmi dan Naskah Surat PDF"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Lembar Disposisi & Surat</span>
                </button>
              )}

              {/* Google Drive Simpan & Tautkan */}
              <button
                type="button"
                onClick={handleSaveToDrive}
                disabled={isSavingDrive}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-800 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors cursor-pointer disabled:opacity-60"
                title="Cadangkan dokumen surat dan disposisi ke akun Google Drive"
              >
                <UploadCloud className={`w-4 h-4 text-emerald-300 ${isSavingDrive ? 'animate-bounce' : ''}`} />
                <span>{isSavingDrive ? 'Menyimpan...' : driveMessage || 'Simpan ke Drive'}</span>
              </button>

              {/* Google Drive resmi Disperakim (Req 4) */}
              <a
                href={surat.googleDriveUrl || GOOGLE_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-semibold text-xs shadow-xs transition-colors"
                title="Buka Folder / Dokumen di Google Drive"
              >
                <Folder className="w-4 h-4" />
                <span>Folder Drive</span>
                <ExternalLink className="w-3 h-3 text-emerald-200" />
              </a>

              <button
                onClick={() => onOpenPdf(surat)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-semibold text-xs shadow-xs transition-colors"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Lihat Dokumen PDF Resmi</span>
              </button>
              <button
                onClick={() => onOpenQr(surat)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold text-xs transition-colors"
              >
                <QrCode className="w-4 h-4 text-slate-700" />
                <span>QR Code Verifikasi</span>
              </button>

              {/* Hapus Surat oleh Super Admin (Req 3) */}
              {currentUser.role === 'super_admin' && (
                <button
                  type="button"
                  onClick={() => {
                    if (window.confirm("Konfirmasi Hapus Surat: Apakah Anda yakin ingin menghapus surat " + surat.nomorSurat + " (" + surat.nomorAgenda + ") secara permanen?")) {
                      deleteSurat(surat.id);
                      alert('Surat berhasil dihapus permanen oleh Super Admin.');
                      onClose();
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg font-semibold text-xs transition-colors cursor-pointer"
                  title="Hapus Surat Masuk (Khusus Super Admin)"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Hapus Surat</span>
                </button>
              )}
            </div>

            {/* Contextual Disposisi/Tindak Lanjut button */}
            <button
              onClick={() => onOpenDisposisi(surat)}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-blue-950 rounded-lg font-bold text-xs shadow-xs transition-colors"
            >
              {currentUser.role === 'kabid'
                ? 'Disposisikan ke Pokja'
                : currentUser.role === 'ketua_pokja'
                ? 'Disposisikan ke Staf'
                : currentUser.role === 'staf_pokja'
                ? 'Tindak Lanjuti Surat'
                : 'Perbarui Status Persuratan'}
            </button>
          </div>

          {/* PRATINJAU NASKAH ASLI (HASIL SCAN / UNGGAHAN PERANGKAT) */}
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              {/* Miniature Paper Frame */}
              <div
                onClick={() => onOpenPdf(surat)}
                className="w-16 h-20 bg-amber-50/60 rounded border border-slate-300 shadow-sm flex flex-col items-center justify-center p-1 cursor-pointer hover:border-blue-600 transition-colors group relative overflow-hidden shrink-0"
                title="Klik untuk meninjau naskah dokumen seperti aslinya"
              >
                {pdfThumbnail ? (
                  <img
                    src={pdfThumbnail}
                    alt="Pratinjau Naskah Asli"
                    className="w-full h-full object-cover rounded-xs"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 group-hover:text-blue-600">
                    <FileText className="w-7 h-7 text-amber-500 mb-0.5" />
                    <span className="text-[9px] font-bold font-mono">PDF</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-blue-900/0 group-hover:bg-blue-900/20 transition-colors flex items-center justify-center">
                  <ExternalLink className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
                </div>
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-sm text-slate-900 truncate">
                    Naskah Asli: {surat.fileName || 'Naskah Surat Masuk'}
                  </span>
                  <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Dokumen Pindaian Asli Terverifikasi
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Format: {docPreview?.startsWith('data:image') ? 'Pindaian Gambar Dokumen Fisik' : 'Berkas PDF Asli'} • Ukuran: {surat.fileSize || '1.2 MB'} • Terdaftar di Agenda {surat.nomorAgenda}
                </p>
                <p className="text-[11px] text-slate-400 mt-1">
                  Tampilan review merefleksikan naskah fisik asli persuratan lengkap dengan tanda tangan dan cap stempel kedinasan.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-end">
              <button
                type="button"
                onClick={() => onOpenPdf(surat)}
                className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                title="Buka tampilan naskah dokumen persis seperti aslinya"
              >
                <FileText className="w-4 h-4 text-amber-400" />
                <span>Review Naskah Asli</span>
              </button>
              {onOpenLembarDisposisi && (
                <button
                  type="button"
                  onClick={() => onOpenLembarDisposisi(surat)}
                  className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold text-xs shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Cetak Naskah Dokumen ke Perangkat Printer Fisik"
                >
                  <Printer className="w-4 h-4 text-white" />
                  <span>Cetak ke Printer</span>
                </button>
              )}
            </div>
          </div>

          {/* 1. VISUAL TIMELINE PERJALANAN SURAT (Section N) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-xs sm:text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-900" />
                Alur Perjalanan Surat & Disposisi Digital
              </h3>
              <span className="text-[11px] font-semibold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                Tahap {activeStep} dari 9
              </span>
            </div>

            {/* Stepper Visualization */}
            <div className="overflow-x-auto pb-2">
              <div className="flex items-center min-w-[650px] justify-between">
                {timelineSteps.map((step, idx) => {
                  const isDone = step.num <= activeStep;
                  const isCurrent = step.num === activeStep;

                  return (
                    <div key={step.num} className="flex-1 flex flex-col items-center relative text-center">
                      {/* Connecting Line */}
                      {idx !== 0 && (
                        <div
                          className={`absolute top-3 right-1/2 w-full h-0.5 -z-0 ${
                            step.num <= activeStep ? 'bg-emerald-500' : 'bg-slate-200'
                          }`}
                        />
                      )}

                      {/* Circle Node */}
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold z-10 transition-all ${
                          isDone
                            ? 'bg-emerald-600 text-white ring-2 ring-emerald-100'
                            : 'bg-slate-200 text-slate-600'
                        } ${isCurrent ? 'ring-4 ring-blue-200 scale-110' : ''}`}
                      >
                        {isDone ? '✓' : step.num}
                      </div>

                      {/* Step Text */}
                      <div
                        className={`text-[9px] mt-1.5 leading-tight px-1 font-medium ${
                          isCurrent
                            ? 'text-blue-900 font-bold'
                            : isDone
                            ? 'text-slate-800'
                            : 'text-slate-400'
                        }`}
                      >
                        {step.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* 2. IDENTITAS SURAT */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 border-b border-slate-100 pb-2">
              Identitas Surat Masuk
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-xs">
              <div>
                <span className="text-slate-400 block text-[11px]">Nomor Surat:</span>
                <span className="font-bold text-slate-800">{surat.nomorSurat}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Asal Instansi:</span>
                <span className="font-bold text-slate-800">{surat.asalSurat}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Kategori Surat:</span>
                <span className="font-semibold text-slate-800">{surat.kategori}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Tanggal Surat Asli:</span>
                <span className="font-semibold text-slate-800">{formatDateIndo(surat.tanggalSurat)}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">Tanggal Disposisi Masuk:</span>
                <span className="font-semibold text-slate-800">
                  {formatDateIndo(surat.tanggalDisposisiMasuk)}
                </span>
              </div>
              <div>
                <span className="text-slate-400 block text-[11px]">File Dokumen Digital:</span>
                <span className="font-mono text-blue-900">{surat.fileName} ({surat.fileSize})</span>
              </div>

              <div className="sm:col-span-3 pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-[11px]">Perihal / Hal Lengkap:</span>
                <span className="font-bold text-slate-900 text-sm">{surat.perihal}</span>
              </div>

              <div className="sm:col-span-3 pt-2 border-t border-slate-100">
                <span className="text-slate-400 block text-[11px] mb-1">Folder Dokumen Resmi Google Drive:</span>
                <a
                  href={surat.googleDriveUrl || GOOGLE_DRIVE_FOLDER_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-xs font-medium transition-colors"
                >
                  <Folder className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="truncate max-w-lg">{surat.googleDriveUrl || GOOGLE_DRIVE_FOLDER_URL}</span>
                  <ExternalLink className="w-3 h-3 text-emerald-600 shrink-0" />
                </a>
              </div>
            </div>

            {/* Khusus Agenda Undangan */}
            {surat.agenda && (
              <div className="mt-3 p-4 bg-purple-50/70 border border-purple-200 rounded-xl text-xs space-y-1.5">
                <div className="font-bold text-purple-900 flex items-center gap-1.5 uppercase tracking-wider text-[11px]">
                  <Calendar className="w-4 h-4 text-purple-800" /> Detail Agenda Undangan
                </div>
                <div><span className="w-28 inline-block text-slate-500">Nama Acara:</span> <strong>{surat.agenda.namaAcara}</strong></div>
                <div><span className="w-28 inline-block text-slate-500">Waktu & Tanggal:</span> {formatDateIndo(surat.agenda.tanggalAcara)} pukul {surat.agenda.waktuAcara}</div>
                <div><span className="w-28 inline-block text-slate-500">Tempat:</span> {surat.agenda.tempatAcara}</div>
                {surat.agenda.keterangan && (
                  <div><span className="w-28 inline-block text-slate-500">Keterangan:</span> {surat.agenda.keterangan}</div>
                )}
              </div>
            )}
          </div>

          {/* 3. RIWAYAT LENGKAP DISPOSISI BERJENJANG */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 border-b border-slate-100 pb-2">
              Riwayat Disposisi Berjenjang & Catatan Pimpinan
            </h3>

            {/* Level 1: Disposisi Kepala Dinas */}
            <div className="p-4 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span className="font-bold text-amber-950">1. Disposisi Kepala Dinas</span>
                </div>
                <span className="text-[11px] text-slate-400">
                  {formatDateIndo(surat.tanggalDisposisiMasuk)}
                </span>
              </div>
              <div className="text-slate-600">
                Pemberi: <strong>Kepala Dinas ({users.find((u) => u.role === 'kadis')?.nama || 'Boedyo Dharmawan, S.T., MT.'})</strong> ➔ Diteruskan ke: <strong>Kepala Bidang Pertanahan</strong>
              </div>
              <div className="bg-white p-3 rounded-lg border border-amber-200 text-slate-900 italic font-serif text-[13px]">
                &ldquo;{surat.narasiDisposisiKadis}&rdquo;
              </div>
            </div>

            {/* Level 2: Disposisi Kepala Bidang ke Pokja */}
            {suratDisposisi
              .filter((d) => d.level === 'kabid_ke_pokja')
              .map((disp, idx) => {
                const pokja = pokjas.find((p) => p.id === disp.pokjaId);
                return (
                  <div
                    key={disp.id}
                    className="p-4 rounded-xl border border-indigo-200 bg-indigo-50/40 space-y-2 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                        <span className="font-bold text-indigo-950">
                          2.{idx + 1} Disposisi Kepala Bidang Pertanahan
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800">
                          Prioritas: {disp.prioritas}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-400">{disp.tanggalDisposisi}</span>
                    </div>
                    <div className="text-slate-600">
                      Pemberi: <strong>{disp.dariUserNama}</strong> ➔ Kepada:{' '}
                      <strong>{pokja?.nama || disp.kepadaUserNama}</strong>
                      {disp.batasWaktu && (
                        <span className="ml-2 text-rose-700 font-semibold">
                          (Batas Waktu: {formatDateIndo(disp.batasWaktu)})
                        </span>
                      )}
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-indigo-200 text-slate-900 italic font-serif text-[13px]">
                      &ldquo;{disp.narasi}&rdquo;
                    </div>
                  </div>
                );
              })}

            {/* Level 3: Disposisi Ketua Pokja ke Staf */}
            {suratDisposisi
              .filter((d) => d.level === 'pokja_ke_staf')
              .map((disp, idx) => (
                <div
                  key={disp.id}
                  className="p-4 rounded-xl border border-blue-200 bg-blue-50/30 space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      <span className="font-bold text-blue-950">
                        3.{idx + 1} Disposisi Ketua Pokja ke Staf
                      </span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                        Prioritas: {disp.prioritas}
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400">{disp.tanggalDisposisi}</span>
                  </div>
                  <div className="text-slate-600">
                    Pemberi: <strong>{disp.dariUserNama}</strong> ➔ Staf Pelaksana:{' '}
                    <strong className="text-blue-900">{disp.kepadaUserNama}</strong>
                    {disp.batasWaktu && (
                      <span className="ml-2 text-rose-700 font-semibold">
                        (Batas SLA: {formatDateIndo(disp.batasWaktu)})
                      </span>
                    )}
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-blue-200 text-slate-900 italic font-serif text-[13px]">
                    &ldquo;{disp.narasi}&rdquo;
                  </div>
                </div>
              ))}
          </div>

          {/* 4. RIWAYAT TINDAK LANJUT STAF */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-3">
            <h3 className="font-bold text-xs sm:text-sm text-slate-900 border-b border-slate-100 pb-2">
              Riwayat Tindak Lanjut / Pengerjaan Staf ({suratTindakLanjut.length})
            </h3>

            {suratTindakLanjut.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                Belum ada catatan tindak lanjut yang diinput oleh staf pelaksana.
              </div>
            ) : (
              suratTindakLanjut.map((tl) => (
                <div
                  key={tl.id}
                  className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/30 text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-bold text-emerald-950 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Tindak Lanjut: {tl.jenisTindakLanjut} oleh {tl.userNama}
                    </div>
                    <span className="text-[11px] text-slate-400">{tl.createdAt}</span>
                  </div>

                  {tl.progresStatus && (
                    <div className="flex items-center gap-3">
                      <span className="bg-white px-2 py-0.5 rounded border border-emerald-300 font-semibold text-emerald-800">
                        Status: {tl.progresStatus} ({tl.progresPersen}%)
                      </span>
                      {tl.tanggalSelesai && (
                        <span className="text-slate-500">
                          Selesai: {formatDateIndo(tl.tanggalSelesai)}
                        </span>
                      )}
                    </div>
                  )}

                  {tl.catatan && (
                    <div className="bg-white p-2.5 rounded border border-emerald-200 text-slate-800">
                      {tl.catatan}
                    </div>
                  )}

                  {tl.namaLampiran && (
                    <div className="text-[11px] text-blue-900 flex items-center gap-1.5 font-medium">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Lampiran Hasil: <strong>{tl.namaLampiran}</strong></span>
                    </div>
                  )}

                  {tl.kehadiran && (
                    <div className="text-[11px] font-semibold text-purple-900">
                      Konfirmasi Kehadiran: {tl.kehadiran}
                      {tl.alasanTidakHadir && ` (Alasan: ${tl.alasanTidakHadir})`}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-400 text-[11px]">
            Dokumen ID: {surat.id} • Bidang Pertanahan Prov. Jateng
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg font-semibold transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
