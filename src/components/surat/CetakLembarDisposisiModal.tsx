import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Surat } from '../../types';
import {
  X,
  Printer,
  FileText,
  CheckCircle2,
  Image as ImageIcon,
  ExternalLink,
  ShieldCheck,
  Upload,
  Loader2,
  AlertCircle,
  FileUp,
} from 'lucide-react';
import { formatDateIndo } from '../../utils/helpers';
import { getBlob } from '../../utils/storage';
import { printElementDirectly, openPrintableWindow } from '../../utils/printService';
import { renderPdfToPageImages } from '../../utils/pdfRenderer';

interface CetakLembarDisposisiModalProps {
  surat: Surat | null;
  onClose: () => void;
}

export const CetakLembarDisposisiModal: React.FC<CetakLembarDisposisiModalProps> = ({
  surat,
  onClose,
}) => {
  const { disposisiList, pokjas, users, currentUser, updateSuratPdf } = useApp();

  const [includeSuratPdf, setIncludeSuratPdf] = useState<boolean>(true);
  const [lampiranMode, setLampiranMode] = useState<'scan' | 'official'>('scan');
  const [blobData, setBlobData] = useState<string | null>(null);
  const [printStatus, setPrintStatus] = useState<string | null>(null);

  // PDF Page rendering state
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [isRenderingPdf, setIsRenderingPdf] = useState<boolean>(false);
  const [renderError, setRenderError] = useState<string | null>(null);

  // Load and resolve blobData when surat changes
  useEffect(() => {
    if (!surat?.filePdf) {
      setBlobData(null);
      setPdfPages([]);
      return;
    }

    if (surat.filePdf.startsWith('idb:')) {
      const key = surat.filePdf.replace('idb:', '');
      getBlob(key).then((data) => {
        if (data) {
          setBlobData(data);
        } else {
          setBlobData(null);
        }
      });
    } else {
      setBlobData(surat.filePdf);
    }
  }, [surat]);

  // Process blobData into high-res page images whenever blobData changes
  useEffect(() => {
    let isCancelled = false;

    async function processDocument() {
      if (!blobData) {
        setPdfPages([]);
        setIsRenderingPdf(false);
        return;
      }

      // If it is a direct image scan (JPEG / PNG / WEBP)
      if (blobData.startsWith('data:image')) {
        setPdfPages([blobData]);
        setLampiranMode('scan');
        setIsRenderingPdf(false);
        setRenderError(null);
        return;
      }

      // If it is a PDF (Base64 data URL, blob: or .pdf url)
      const isPdf =
        blobData.startsWith('data:application/pdf') ||
        blobData.startsWith('blob:') ||
        blobData.includes('.pdf');

      if (isPdf) {
        setIsRenderingPdf(true);
        setRenderError(null);
        try {
          const pages = await renderPdfToPageImages(blobData, 2.0);
          if (!isCancelled) {
            if (pages && pages.length > 0) {
              setPdfPages(pages);
              setLampiranMode('scan');
            } else {
              // Could be an unresolvable dummy path (404)
              setPdfPages([]);
            }
          }
        } catch (err: any) {
          console.error('Failed to render PDF pages:', err);
          if (!isCancelled) {
            setRenderError('Gagal memproses berkas PDF. Format mungkin tidak didukung.');
            setPdfPages([]);
          }
        } finally {
          if (!isCancelled) {
            setIsRenderingPdf(false);
          }
        }
      } else {
        setPdfPages([]);
        setIsRenderingPdf(false);
      }
    }

    processDocument();

    return () => {
      isCancelled = true;
    };
  }, [blobData]);

  if (!surat) return null;

  // Filter relevant dispositions
  const kabidDisposisi = disposisiList.find(
    (d) => d.suratId === surat.id && d.level === 'kabid_ke_pokja'
  );
  const pokjaDisposisiList = disposisiList.filter(
    (d) => d.suratId === surat.id && d.level === 'pokja_ke_staf'
  );
  const pokjaDisposisi = pokjaDisposisiList[0];

  // Assigned Pokjas
  const assignedPokjas = pokjas.filter((p) => surat.assignedPokjaIds?.includes(p.id));

  // Staff names
  const stafNames = pokjaDisposisiList.map((d) => d.kepadaNama);
  const stafString =
    stafNames.length > 0 ? stafNames.join(', ') : 'Staf Terkait Pokja';

  // Handle direct printing to connected printer device
  const handlePrintToDevice = () => {
    setPrintStatus('Mengirim ke printer fisik...');
    const success = printElementDirectly('dokumen-disposisi-cetak-wrapper', {
      documentTitle: `Lembar Disposisi & Surat - ${surat.nomorAgenda} - ${surat.nomorSurat}`,
      onAfterPrint: () => {
        setPrintStatus('Dokumen terkirim ke printer!');
        setTimeout(() => setPrintStatus(null), 3000);
      },
    });

    if (!success) {
      setPrintStatus(null);
    }
  };

  const handleOpenPrintWindow = () => {
    openPrintableWindow(
      'dokumen-disposisi-cetak-wrapper',
      `Cetak Naskah Dinas - ${surat.nomorAgenda}`
    );
  };

  // Upload/Replace PDF file handler for Super Administrator
  const handleUploadNewPdf = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.name.toLowerCase().endsWith('.pdf') || file.type === 'application/pdf';
    const isImg = file.type.startsWith('image/') || /\.(jpe?g|png|webp)$/i.test(file.name);

    if (!isPdf && !isImg) {
      alert('Mohon pilih file format PDF (.pdf) atau gambar pindaian (.jpg, .png)!');
      return;
    }

    const fileSizeStr = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target?.result as string;
      setBlobData(dataUrl);
      updateSuratPdf(surat.id, dataUrl, file.name, fileSizeStr);
      setPrintStatus(`Naskah asli (${file.name}) berhasil dimuat!`);
      setTimeout(() => setPrintStatus(null), 4000);
    };
    reader.readAsDataURL(file);
  };

  const hasUploadedPages = pdfPages.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-5 overflow-y-auto animate-in fade-in">
      <div className="bg-slate-100 rounded-2xl max-w-5xl w-full max-h-[96vh] shadow-2xl border border-slate-300 flex flex-col overflow-hidden">
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-5 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-md no-print border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Printer className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-100">Cetak Dokumen ke Perangkat Printer</h3>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Perangkat Cetak Tersambung
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Agenda: <strong className="text-slate-200">{surat.nomorAgenda}</strong> • {surat.nomorSurat}
              </p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
            {/* Options Toggle: Include Lampiran */}
            <div className="flex items-center gap-2 bg-slate-800/90 px-3 py-1.5 rounded-xl text-xs border border-slate-700">
              <label className="flex items-center gap-1.5 cursor-pointer text-slate-200 hover:text-white">
                <input
                  type="checkbox"
                  checked={includeSuratPdf}
                  onChange={(e) => setIncludeSuratPdf(e.target.checked)}
                  className="rounded text-blue-600 focus:ring-0"
                />
                <span className="font-medium">
                  Sertakan Naskah Asli yang Diunggah ({hasUploadedPages ? `${pdfPages.length} Halaman` : '1 Halaman'})
                </span>
              </label>
            </div>

            {/* Mode Switcher */}
            {hasUploadedPages && includeSuratPdf && (
              <div className="flex items-center bg-slate-800 p-0.5 rounded-xl text-xs border border-slate-700">
                <button
                  type="button"
                  onClick={() => setLampiranMode('scan')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-colors flex items-center gap-1 ${
                    lampiranMode === 'scan'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tampilkan naskah asli persis sesuai dokumen PDF yang diunggah"
                >
                  <FileText className="w-3 h-3 text-amber-400" />
                  <span>Naskah Asli PDF Unggahan</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLampiranMode('official')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-colors ${
                    lampiranMode === 'official'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Tampilkan format transkrip digital kedinasan"
                >
                  Transkrip Digital
                </button>
              </div>
            )}

            {/* Upload / Ganti Berkas PDF Asli (Khusus Super Admin & Staf) */}
            <label
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition-colors"
              title="Unggah atau ganti berkas PDF asli naskah dinas untuk surat ini"
            >
              <FileUp className="w-3.5 h-3.5 text-blue-400" />
              <span>{hasUploadedPages ? 'Ganti PDF Asli' : 'Unggah PDF Asli'}</span>
              <input
                type="file"
                accept=".pdf,application/pdf,image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleUploadNewPdf}
              />
            </label>

            {/* Primary Print Button to Connected Printer */}
            <button
              type="button"
              onClick={handlePrintToDevice}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer hover:shadow-emerald-600/20 active:scale-95"
              title="Kirim dokumen langsung ke perangkat cetak fisik (printer USB/WiFi/Network/Bluetooth)"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak ke Printer</span>
            </button>

            {/* Standalone Window Button */}
            <button
              type="button"
              onClick={handleOpenPrintWindow}
              className="p-2 text-slate-300 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer hidden md:inline-flex"
              title="Buka Lembar Cetak di Tab Baru"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-rose-500/20 hover:text-rose-300 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Print Status & Notification Feedback Bar */}
        {printStatus && (
          <div className="bg-emerald-50 border-b border-emerald-200 px-5 py-2 text-xs text-emerald-800 font-semibold flex items-center justify-between no-print animate-in fade-in">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              {printStatus}
            </span>
            <span className="text-[11px] text-emerald-700">
              Dialog perangkat cetak dibuka pada sistem operasi Anda.
            </span>
          </div>
        )}

        {/* Document Preview Canvas */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 flex flex-col items-center bg-slate-300/80 print:bg-white print:p-0 print:overflow-visible">
          <div id="dokumen-disposisi-cetak-wrapper" className="printable-document w-full flex flex-col items-center">
            {/* ================= PAGE 1: LEMBAR DISPOSISI ================= */}
            <div
              id="lembar-disposisi-print"
              className="bg-white w-full max-w-[780px] p-8 sm:p-10 shadow-lg border border-slate-300 text-black font-sans text-[13px] print:shadow-none print:border-none print:p-6 print:m-0 print:w-full"
              style={{ minHeight: '1020px' }}
            >
              {/* Header / Kop Disposisi */}
              <div className="text-center font-bold mb-4 leading-tight">
                <div className="text-[15px] tracking-wide uppercase">
                  DINAS PERUMAHAN RAKYAT DAN KAWASAN PERMUKIMAN
                </div>
                <div className="text-[14px] uppercase tracking-wide">
                  PROVINSI JAWA TENGAH
                </div>
                <div className="text-[16px] font-black tracking-widest uppercase border-b-2 border-t-2 border-black py-1.5 my-2.5">
                  LEMBAR DISPOSISI
                </div>
              </div>

              {/* Tabel Atas Lembar Disposisi */}
              <table className="w-full border-collapse border border-black mb-4 text-xs">
                <tbody>
                  <tr className="border-b border-black">
                    <td className="w-1/2 p-2 border-r border-black align-top">
                      <div className="font-semibold text-slate-700">Surat Dari :</div>
                      <div className="font-bold text-[13px] mt-1">{surat.asalSurat}</div>
                    </td>
                    <td className="w-1/2 p-2 align-top">
                      <div className="flex justify-between">
                        <span><strong className="text-slate-700">Diterima Tgl :</strong> {formatDateIndo(surat.tanggalDisposisiMasuk)}</span>
                        <span><strong className="text-slate-700">No. Agenda :</strong> <span className="font-bold font-mono text-sm">{surat.nomorAgenda}</span></span>
                      </div>
                      <div className="mt-2">
                        <strong className="text-slate-700">Sifat :</strong>{' '}
                        <span className="font-bold uppercase px-1.5 py-0.5 border border-black text-[11px] ml-1">
                          {kabidDisposisi?.prioritas || 'Segera / Penting'}
                        </span>
                      </div>
                    </td>
                  </tr>
                  <tr className="border-b border-black">
                    <td className="p-2 border-r border-black">
                      <span className="font-semibold text-slate-700">Tgl Surat :</span>{' '}
                      <span className="font-bold">{formatDateIndo(surat.tanggalSurat)}</span>
                    </td>
                    <td className="p-2">
                      <span className="font-semibold text-slate-700">Nomor Surat :</span>{' '}
                      <span className="font-bold">{surat.nomorSurat}</span>
                    </td>
                  </tr>
                  <tr>
                    <td colSpan={2} className="p-2 bg-slate-50/50">
                      <div className="font-semibold text-slate-700">Perihal :</div>
                      <div className="font-bold text-[13px] mt-0.5 leading-snug">{surat.perihal}</div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {/* Disposisi Kepala Dinas */}
              <div className="border border-black p-3 mb-4 rounded-xs bg-slate-50/30">
                <div className="font-bold text-xs uppercase tracking-wider mb-1 flex items-center justify-between border-b border-black/30 pb-1">
                  <span>DISPOSISI KEPALA DINAS (KADIS):</span>
                  <span className="text-[10px] font-normal italic text-slate-600">Terintegrasi dari Naskah Asli</span>
                </div>
                <div className="italic text-[13px] p-2 bg-white border border-slate-300 rounded-xs font-serif leading-relaxed">
                  &ldquo;{surat.narasiDisposisiKadis}&rdquo;
                </div>
              </div>

              {/* Diteruskan Kepada & Arahan Kepala Bidang Pertanahan */}
              <div className="border border-black p-3 mb-4">
                <div className="font-bold text-xs uppercase tracking-wider border-b border-black pb-1 mb-2">
                  DISPOSISI KEPALA BIDANG PERTANAHAN:
                </div>

                <div className="grid grid-cols-2 gap-4 text-xs mb-3">
                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Diteruskan Kepada:</span>
                    <ul className="space-y-1">
                      {pokjas.map((pokja) => {
                        const isAssigned = surat.assignedPokjaIds?.includes(pokja.id);
                        return (
                          <li key={pokja.id} className="flex items-center gap-1.5">
                            <span className={`w-3.5 h-3.5 border border-black flex items-center justify-center text-[10px] font-bold ${isAssigned ? 'bg-black text-white' : ''}`}>
                              {isAssigned ? '✓' : ''}
                            </span>
                            <span className={isAssigned ? 'font-bold' : 'text-slate-600'}>{pokja.nama}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <div>
                    <span className="font-semibold text-slate-700 block mb-1">Petunjuk / Arahan Kabid:</span>
                    <div className="p-2 border border-black bg-white min-h-[70px] text-xs font-serif italic">
                      {kabidDisposisi?.narasi || 'Mohon dipelajari, koordinasikan dengan instansi terkait, dan tindak lanjuti sesuai ketentuan.'}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs pt-2 border-t border-dashed border-black">
                  <span><strong>Batas Waktu:</strong> {kabidDisposisi?.batasWaktu ? formatDateIndo(kabidDisposisi.batasWaktu) : 'Segera'}</span>
                  <span><strong>Tanda Tangan Kabid:</strong> ________________________</span>
                </div>
              </div>

              {/* Disposisi Ketua Pokja ke Staf */}
              <div className="border border-black p-3 mb-4">
                <div className="font-bold text-xs uppercase tracking-wider border-b border-black pb-1 mb-2">
                  DISPOSISI KETUA POKJA KEPADA STAF:
                </div>

                <div className="text-xs space-y-2">
                  <div>
                    <span className="font-semibold text-slate-700">Staf Pelaksana:</span>{' '}
                    <span className="font-bold underline">{stafString}</span>
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700">Instruksi Teknis Ketua Pokja:</span>
                    <div className="p-2 border border-black bg-white min-h-[50px] text-xs font-serif italic mt-1">
                      {pokjaDisposisi?.narasi || 'Laksanakan telaah teknis, siapkan bahan fasilitasi/koordinasi, dan laporkan hasilnya.'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer Lembar Disposisi */}
              <div className="flex justify-between items-center text-[10px] text-slate-500 pt-2 border-t border-black">
                <div>
                  Dicetak melalui SIPERDITAN • {new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}
                </div>
                <div className="font-bold uppercase">
                  DISPERAKIM PROV. JAWA TENGAH
                </div>
              </div>
            </div>

            {/* ================= PAGE 2+: NASKAH SURAT MASUK SESUAI UNGGAHAN ================= */}
            {includeSuratPdf && (
              <>
                {isRenderingPdf ? (
                  /* Loading State during PDF page conversion */
                  <div
                    className="bg-white w-full max-w-[780px] p-12 shadow-lg border border-slate-300 text-slate-900 mt-8 flex flex-col items-center justify-center print:hidden"
                    style={{ minHeight: '500px' }}
                  >
                    <Loader2 className="w-10 h-10 text-blue-900 animate-spin mb-3" />
                    <h4 className="font-bold text-slate-800 text-sm">
                      Memuat & Merender Halaman Naskah Asli PDF Sesuai Berkas Unggahan...
                    </h4>
                    <p className="text-xs text-slate-500 mt-1">
                      Mengkonversi halaman PDF menjadi tampilan visual dokumen otentik resolusi tinggi.
                    </p>
                  </div>
                ) : hasUploadedPages && lampiranMode === 'scan' ? (
                  /* MULTI-PAGE ORIGINAL UPLOADED PDF / SCANNED DOCUMENT */
                  pdfPages.map((pageImg, pageIdx) => (
                    <div
                      key={pageIdx}
                      id={`lampiran-surat-pdf-page-${pageIdx + 1}`}
                      className="bg-white w-full max-w-[780px] p-6 sm:p-8 shadow-lg border border-slate-300 text-slate-900 mt-8 print:mt-0 print:shadow-none print:border-none print:p-0 print:m-0 print:w-full print-page-break break-before-page flex flex-col items-center"
                      style={{ minHeight: '1020px' }}
                    >
                      {/* Top Bar on Screen */}
                      <div className="w-full text-center font-sans text-[11px] text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 flex items-center justify-between no-print">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          <span className="font-bold text-slate-800">
                            Naskah Asli Sesuai Dokumen Unggahan {surat.fileName ? `• ${surat.fileName}` : ''}
                          </span>
                        </div>
                        <span className="font-mono text-[10px] text-blue-900 bg-blue-50 px-2 py-0.5 rounded font-bold">
                          Halaman {pageIdx + 1} dari {pdfPages.length}
                        </span>
                      </div>

                      {/* The exact authentic scanned/uploaded page image */}
                      <div className="w-full flex justify-center items-center flex-1 my-auto p-1">
                        <img
                          src={pageImg}
                          alt={`Naskah Dokumen Asli Halaman ${pageIdx + 1}`}
                          className="w-full h-auto max-h-[960px] object-contain rounded-xs border border-slate-200 shadow-xs print:border-none print:shadow-none print:w-full print:max-h-none"
                        />
                      </div>

                      {/* Footer */}
                      <div className="w-full text-center font-sans text-[10px] text-slate-500 mt-4 pt-2 border-t border-slate-200 flex items-center justify-between print:text-[9px]">
                        <span>Naskah Asli Terlampir • Terintegrasi SIPERDITAN DISPERAKIM PROV. JATENG</span>
                        <span className="font-mono">Lembar {pageIdx + 1} / {pdfPages.length}</span>
                      </div>
                    </div>
                  ))
                ) : (
                  /* FALLBACK: AUTHENTIC ARCHIVAL LETTER REPRESENTATION WITH SUPER ADMIN UPLOAD PROMPT */
                  <div
                    id="lampiran-surat-print"
                    className="bg-[#fdfcf9] w-full max-w-[780px] p-8 sm:p-12 shadow-lg border border-slate-300 text-slate-900 font-serif leading-relaxed text-[13px] mt-8 print:mt-0 print:shadow-none print:border-none print:p-6 print:m-0 print:w-full print-page-break break-before-page relative"
                    style={{ minHeight: '1020px' }}
                  >
                    {/* Notice for Super Administrator to attach real PDF if missing */}
                    <div className="no-print bg-amber-50 border border-amber-300 rounded-xl p-3.5 mb-6 text-xs text-amber-950 font-sans flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                      <div className="flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold block">
                            Naskah Asli Berkas PDF Belum Diunggah untuk Surat Ini
                          </span>
                          <span className="text-[11px] text-amber-800">
                            Sebagai Super Administrator, Anda dapat mengunggah berkas PDF asli naskah dinas sekarang agar tampilan pratinjau dan hasil cetak 100% sama dengan berkas aslinya.
                          </span>
                        </div>
                      </div>
                      <label className="shrink-0 px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg font-bold text-xs flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs">
                        <Upload className="w-4 h-4 text-amber-400" />
                        <span>Unggah Berkas PDF Asli</span>
                        <input
                          type="file"
                          accept=".pdf,application/pdf,image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={handleUploadNewPdf}
                        />
                      </label>
                    </div>

                    {/* Notice page 2 */}
                    <div className="text-center font-sans text-[11px] text-slate-500 uppercase tracking-wider mb-4 border-b border-slate-200 pb-2 flex items-center justify-between">
                      <span className="font-bold text-slate-800">Lampiran Naskah Surat Masuk Kedinasan</span>
                      <span className="font-mono text-[10px]">Hal. 2 / 2</span>
                    </div>

                    {/* Kop Surat Resmi */}
                    <div className="text-center border-b-[3px] border-double border-black pb-4 mb-6 relative font-sans">
                      <div className="text-[13px] font-bold tracking-wider uppercase text-slate-800">
                        Pemerintah Provinsi Jawa Tengah
                      </div>
                      <div className="text-[16px] font-black uppercase text-slate-900 tracking-wide mt-0.5">
                        Dinas Perumahan Rakyat dan Kawasan Permukiman
                      </div>
                      <div className="text-[11px] text-slate-600 mt-1">
                        Jalan Madukoro Blok AA - BB Kompleks PRPP, Tawangsari, Semarang Barat, Kota Semarang 50144
                      </div>
                      <div className="text-[11px] text-slate-600">
                        Telepon (024) 7608202, 7608203 • Faksimile (024) 7608204 • Website: disperakim.jatengprov.go.id
                      </div>
                    </div>

                    {/* Meta data surat */}
                    <div className="flex justify-between items-start mb-6 text-xs font-sans">
                      <div className="space-y-1">
                        <div>
                          <span className="font-semibold w-20 inline-block">Nomor</span>: {surat.nomorSurat}
                        </div>
                        <div>
                          <span className="font-semibold w-20 inline-block">Sifat</span>: Penting / Segera
                        </div>
                        <div>
                          <span className="font-semibold w-20 inline-block">Lampiran</span>: 1 (satu) Berkas
                        </div>
                        <div>
                          <span className="font-semibold w-20 inline-block">Perihal</span>: <strong className="font-bold underline">{surat.perihal}</strong>
                        </div>
                      </div>
                      <div className="text-right space-y-1">
                        <div>Semarang, {formatDateIndo(surat.tanggalSurat)}</div>
                        <div className="mt-2 text-slate-700">
                          Kepada Yth.<br />
                          Kepala Bidang Pertanahan<br />
                          di Tempat
                        </div>
                      </div>
                    </div>

                    {/* Isi Surat */}
                    <div className="space-y-3.5 my-6 text-justify text-slate-800">
                      <p>
                        Dengan hormat disampaikan, sehubungan dengan pelaksanaan tugas dan fungsi fasilitasi pertanahan di wilayah Provinsi Jawa Tengah, bersama ini kami sampaikan dokumen persuratan dengan nomor <strong>{surat.nomorSurat}</strong> perihal <em>&ldquo;{surat.perihal}&rdquo;</em> yang diterima dari <strong>{surat.asalSurat}</strong>.
                      </p>

                      {surat.agenda && (
                        <div className="my-4 p-4 bg-slate-50 border border-slate-300 rounded-sm font-sans text-xs space-y-1.5">
                          <div className="font-bold text-blue-900 border-b border-slate-200 pb-1 uppercase tracking-wider">
                            Jadwal Pelaksanaan Agenda Undangan
                          </div>
                          <div><span className="w-28 inline-block font-semibold">Nama Acara:</span> {surat.agenda.namaAcara}</div>
                          <div><span className="w-28 inline-block font-semibold">Hari / Tanggal:</span> {formatDateIndo(surat.agenda.tanggalAcara)}</div>
                          <div><span className="w-28 inline-block font-semibold">Waktu:</span> {surat.agenda.waktuAcara}</div>
                          <div><span className="w-28 inline-block font-semibold">Tempat:</span> {surat.agenda.tempatAcara}</div>
                          {surat.agenda.keterangan && (
                            <div><span className="w-28 inline-block font-semibold">Keterangan:</span> {surat.agenda.keterangan}</div>
                          )}
                        </div>
                      )}

                      <p>
                        Mengingat pentingnya substansi persuratan ini, diharapkan Saudara bersama jajaran Kelompok Kerja (Pokja) terkait dapat segera menelaah, mengkoordinasikan, serta mengambil langkah-langkah tindak lanjut yang diperlukan.
                      </p>
                      <p>
                        Demikian surat ini disampaikan untuk dipedomani dan dilaksanakan dengan penuh rasa tanggung jawab.
                      </p>
                    </div>

                    {/* Tanda Tangan & Cap Stempel */}
                    <div className="flex justify-between items-end mt-12 font-sans text-xs">
                      <div className="border border-slate-300 bg-slate-50/80 p-2 rounded text-[10px] space-y-0.5 text-slate-600">
                        <div className="font-mono font-bold text-slate-800">SIPERDITAN JATENG</div>
                        <div className="font-mono">AGD: {surat.nomorAgenda}</div>
                        <div>Registrasi: {formatDateIndo(surat.tanggalDisposisiMasuk)}</div>
                      </div>

                      <div className="text-center w-64 relative">
                        <div className="font-medium text-slate-700">a.n. Kepala Dinas,</div>
                        <div className="text-[11px] text-slate-600 mb-12">Sekretaris Dinas</div>

                        {/* Red Government Stamp */}
                        <div className="absolute top-6 left-4 pointer-events-none opacity-80 rotate-[-6deg]">
                          <div className="w-24 h-24 rounded-full border-2 border-dashed border-rose-700 p-1 flex items-center justify-center">
                            <div className="w-full h-full rounded-full border border-rose-700 flex flex-col items-center justify-center text-center p-1 text-[7px] font-bold text-rose-800 uppercase tracking-tighter leading-tight">
                              <span>PEMERINTAH PROVINSI</span>
                              <span className="text-[6px] font-black text-rose-900">JAWA TENGAH</span>
                              <span>DISPERAKIM</span>
                            </div>
                          </div>
                        </div>

                        <div className="font-bold text-slate-900 underline relative z-10">
                          Drs. WAHYU HIDAYAT, M.Si
                        </div>
                        <div className="text-[11px] text-slate-600">NIP. 19710314 199603 1 003</div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Footer info */}
        <div className="bg-slate-900 border-t border-slate-800 px-5 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-400 font-sans gap-2 no-print">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Koneksi Printer Siap: Mendukung semua printer fisik (Epson, Canon, HP, Brother, Fuji Xerox).</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            TATA NASKAH DINAS & LEMBAR DISPOSISI RESMI PEMERINTAH PROVINSI JAWA TENGAH
          </span>
        </div>
      </div>
    </div>
  );
};
