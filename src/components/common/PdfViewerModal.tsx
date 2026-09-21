import React, { useState, useEffect } from 'react';
import { Surat, SuratKeluar } from '../../types';
import {
  X,
  Download,
  Printer,
  FileText,
  CheckCircle2,
  Image as ImageIcon,
  ZoomIn,
  ZoomOut,
  RotateCw,
  Maximize2,
  Minimize2,
  Sliders,
  ShieldCheck,
  Check,
} from 'lucide-react';
import { formatDateIndo } from '../../utils/helpers';
import { getBlob } from '../../utils/storage';
import { printElementDirectly } from '../../utils/printService';
import { renderPdfToPageImages } from '../../utils/pdfRenderer';

interface PdfViewerModalProps {
  surat: Surat | SuratKeluar | null;
  onClose: () => void;
}

export const PdfViewerModal: React.FC<PdfViewerModalProps> = ({ surat, onClose }) => {
  const [activeTab, setActiveTab] = useState<'asli' | 'transkrip'>('asli');
  const [blobData, setBlobData] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [filterMode, setFilterMode] = useState<'normal' | 'bw' | 'contrast'>('normal');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [printStatus, setPrintStatus] = useState<string | null>(null);
  const [pdfPages, setPdfPages] = useState<string[]>([]);
  const [isRenderingPdf, setIsRenderingPdf] = useState<boolean>(false);

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
          setActiveTab('asli');
        }
      });
    } else {
      setBlobData(surat.filePdf);
      setActiveTab('asli');
    }
  }, [surat]);

  // Convert PDF or image blobData to high-res page images
  useEffect(() => {
    let cancelled = false;
    if (!blobData) {
      setPdfPages([]);
      setIsRenderingPdf(false);
      return;
    }

    if (blobData.startsWith('data:image')) {
      setPdfPages([blobData]);
      setIsRenderingPdf(false);
      return;
    }

    const isPdf =
      blobData.startsWith('data:application/pdf') ||
      blobData.startsWith('blob:') ||
      blobData.includes('.pdf');

    if (isPdf) {
      setIsRenderingPdf(true);
      renderPdfToPageImages(blobData, 2.0)
        .then((pages) => {
          if (!cancelled) {
            setPdfPages(pages || []);
            setIsRenderingPdf(false);
          }
        })
        .catch(() => {
          if (!cancelled) {
            setPdfPages([]);
            setIsRenderingPdf(false);
          }
        });
    } else {
      setPdfPages([]);
      setIsRenderingPdf(false);
    }

    return () => {
      cancelled = true;
    };
  }, [blobData]);

  if (!surat) return null;

  const nomorAgendaVal = 'nomorAgenda' in surat ? surat.nomorAgenda : `SK-${surat.nomorUrut}`;
  const asalSuratVal = 'asalSurat' in surat ? surat.asalSurat : 'Bidang Pertanahan Disperakim';
  const tujuanSuratVal = 'tujuanSurat' in surat ? surat.tujuanSurat : 'Kepala Bidang Pertanahan';
  const tanggalDisposisiMasukVal = 'tanggalDisposisiMasuk' in surat ? surat.tanggalDisposisiMasuk : surat.tanggalSurat;
  const narasiDisposisiKadisVal = 'narasiDisposisiKadis' in surat ? surat.narasiDisposisiKadis : undefined;
  const agendaVal = 'agenda' in surat ? surat.agenda : undefined;

  const isScannedImage = blobData && blobData.startsWith('data:image');
  const isPdfDocument =
    blobData && (blobData.startsWith('data:application/pdf') || blobData.includes('.pdf') || blobData.startsWith('blob:'));

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 25, 250));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 25, 50));
  const handleZoomReset = () => setZoom(100);
  const handleRotate = () => setRotation((prev) => (prev + 90) % 360);

  const handlePrintToPrinter = () => {
    setPrintStatus('Mengirim ke perangkat cetak...');
    const targetElementId = activeTab === 'asli' ? 'printable-authentic-doc' : 'printable-transcript-doc';
    const success = printElementDirectly(targetElementId, {
      documentTitle: `Naskah Asli Persuratan - ${surat.nomorSurat}`,
      onAfterPrint: () => {
        setPrintStatus('Perintah cetak terkirim ke printer!');
        setTimeout(() => setPrintStatus(null), 3000);
      },
    });

    if (!success) {
      setPrintStatus(null);
    }
  };

  const handleDownload = () => {
    if (blobData && (blobData.startsWith('data:') || blobData.startsWith('blob:') || blobData.startsWith('http'))) {
      const a = document.createElement('a');
      a.href = blobData;
      const ext = isScannedImage ? 'jpg' : 'pdf';
      a.download = surat.fileName || `naskah_asli_${nomorAgendaVal.replace(/[^a-zA-Z0-9]/g, '_')}.${ext}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else {
      handlePrintToPrinter();
    }
  };

  // CSS filter styling for scanned image inspection
  const getFilterStyle = () => {
    switch (filterMode) {
      case 'bw':
        return 'grayscale(100%) contrast(165%) brightness(105%)';
      case 'contrast':
        return 'contrast(135%) brightness(100%) saturate(110%)';
      default:
        return 'none';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs p-2 sm:p-4 overflow-hidden animate-in fade-in duration-200">
      <div
        className={`bg-slate-900 rounded-2xl w-full flex flex-col shadow-2xl border border-slate-750 overflow-hidden transition-all ${
          isFullscreen ? 'h-full max-w-full rounded-none' : 'max-w-6xl h-[94vh]'
        }`}
      >
        {/* Top Header Bar */}
        <div className="bg-slate-900 text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 shadow-md">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm text-slate-100 truncate max-w-xs sm:max-w-md">
                  {surat.fileName || `Naskah Asli Surat ${surat.nomorSurat}`}
                </h3>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  <ShieldCheck className="w-3 h-3" /> Naskah Asli Terverifikasi
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate">
                No. Agenda: <strong className="text-slate-200">{nomorAgendaVal}</strong> • {surat.nomorSurat} • {surat.fileSize || 'Pindaian Asli'}
              </p>
            </div>
          </div>

          {/* Top Actions: Print to Connected Printer, Download, Close */}
          <div className="flex items-center gap-2">
            {printStatus && (
              <span className="text-[11px] text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-800/60 px-2.5 py-1 rounded-lg animate-pulse hidden md:inline">
                {printStatus}
              </span>
            )}

            <button
              type="button"
              onClick={handlePrintToPrinter}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl transition-all shadow-md cursor-pointer hover:shadow-emerald-600/20 active:scale-95"
              title="Cetak Naskah Asli ke Perangkat Printer Fisik (Epson, Canon, HP, dll.)"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak ke Printer</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl transition-colors border border-slate-700 cursor-pointer"
              title="Unduh Berkas Asli"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span className="hidden sm:inline">Unduh</span>
            </button>

            <button
              type="button"
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-800 transition-colors cursor-pointer hidden sm:inline-flex"
              title={isFullscreen ? 'Keluar Layar Penuh' : 'Mode Layar Penuh'}
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-rose-500/20 hover:text-rose-300 transition-colors cursor-pointer"
              title="Tutup Pratinjau"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Secondary Sub-Toolbar: Mode Tabs & Viewing Controls */}
        <div className="bg-slate-850 px-4 py-2 border-b border-slate-750 flex flex-wrap items-center justify-between gap-2.5 text-xs text-slate-300">
          {/* Tabs: Naskah Asli vs Transkrip */}
          <div className="flex items-center bg-slate-900/90 p-0.5 rounded-xl border border-slate-700">
            <button
              type="button"
              onClick={() => setActiveTab('asli')}
              className={`px-3 py-1.5 rounded-lg font-bold text-xs flex items-center gap-1.5 transition-all ${
                activeTab === 'asli'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
              <span>Naskah Asli (Pindaian / Unggahan)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('transkrip')}
              className={`px-3 py-1.5 rounded-lg font-semibold text-xs flex items-center gap-1.5 transition-all ${
                activeTab === 'transkrip'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-blue-300" />
              <span>Format Digital Kedinasan</span>
            </button>
          </div>

          {/* Interactive Inspection Controls (Zoom, Rotate, Filter) */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Zoom Controls */}
            <div className="flex items-center bg-slate-900 px-2 py-1 rounded-lg border border-slate-750 gap-1">
              <button
                type="button"
                onClick={handleZoomOut}
                disabled={zoom <= 50}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Perkecil (-)"
              >
                <ZoomOut className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={handleZoomReset}
                className="px-1.5 py-0.5 font-mono text-[11px] font-bold text-slate-200 hover:text-amber-400"
                title="Reset ke 100%"
              >
                {zoom}%
              </button>
              <button
                type="button"
                onClick={handleZoomIn}
                disabled={zoom >= 250}
                className="p-1 text-slate-400 hover:text-white disabled:opacity-30 cursor-pointer"
                title="Perbesar (+)"
              >
                <ZoomIn className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Rotate Button (Sangat penting jika naskah foto/scan miring/landscape) */}
            <button
              type="button"
              onClick={handleRotate}
              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-900 hover:bg-slate-750 text-slate-200 rounded-lg border border-slate-750 font-medium transition-colors cursor-pointer"
              title="Putar 90° Searah Jarum Jam"
            >
              <RotateCw className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">{rotation}°</span>
            </button>

            {/* Filter Scanner Mode (Tingkatkan ketajaman teks & hilangkan bayangan kuning dokumen fisik) */}
            <div className="hidden sm:flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-750 text-[11px]">
              <span className="px-2 text-slate-400 flex items-center gap-1">
                <Sliders className="w-3 h-3" /> Filter:
              </span>
              <button
                type="button"
                onClick={() => setFilterMode('normal')}
                className={`px-2 py-1 rounded font-medium ${
                  filterMode === 'normal' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Warna Asli
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('bw')}
                className={`px-2 py-1 rounded font-medium ${
                  filterMode === 'bw' ? 'bg-slate-700 text-amber-300' : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Mode Pemindaian Hitam-Putih: Menajamkan tinta dan membersihkan bayangan kertas"
              >
                Pindaian Tajam
              </button>
              <button
                type="button"
                onClick={() => setFilterMode('contrast')}
                className={`px-2 py-1 rounded font-medium ${
                  filterMode === 'contrast' ? 'bg-slate-700 text-blue-300' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Kontras Tinggi
              </button>
            </div>
          </div>
        </div>

        {/* Viewport Canvas: Realistic Paper Canvas Desk */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start bg-slate-900/60 select-none">
          {activeTab === 'asli' ? (
            /* ================= MODE 1: NASKAH ASLI (HASIL SCAN / UNGGAHAN DEVICE) ================= */
            <div
              id="printable-authentic-doc"
              className="transition-all duration-150 origin-top flex flex-col items-center max-w-full space-y-8"
              style={{
                transform: `scale(${zoom / 100})`,
                marginBottom: `${(zoom - 100) * 4}px`,
              }}
            >
              {isRenderingPdf ? (
                /* PDF Rendering Loading */
                <div className="bg-slate-800 text-white rounded-xl p-8 border border-slate-700 flex flex-col items-center justify-center min-w-[340px] shadow-2xl">
                  <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3" />
                  <span className="font-bold text-sm">Merender Naskah Asli PDF Sesuai Unggahan...</span>
                  <span className="text-xs text-slate-400 mt-1">Menyiapkan kanvas fisik naskah dinas</span>
                </div>
              ) : pdfPages.length > 0 ? (
                /* Authentic Multi-Page Scanned / Uploaded PDF Render */
                pdfPages.map((pageImg, pageIdx) => (
                  <div
                    key={pageIdx}
                    className="bg-white relative shadow-[0_20px_60px_rgba(0,0,0,0.35)] rounded-sm border border-slate-300 text-slate-900 max-w-[820px] w-full flex flex-col overflow-hidden transition-all duration-200"
                    style={{
                      transform: `rotate(${rotation}deg)`,
                    }}
                  >
                    {/* Top Authentic Verification Ribbon */}
                    <div className="bg-gradient-to-r from-slate-100 via-white to-slate-100 border-b border-slate-200 px-5 py-2.5 flex items-center justify-between text-xs font-sans text-slate-600 no-print">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-100" />
                        <span className="font-bold text-slate-800 uppercase tracking-wide text-[11px]">
                          Naskah Asli Sesuai Dokumen Unggahan {surat.fileName ? `(${surat.fileName})` : ''}
                        </span>
                      </div>
                      <div className="text-[10px] text-blue-900 font-bold bg-blue-50 px-2 py-0.5 rounded font-mono">
                        Halaman {pageIdx + 1} dari {pdfPages.length}
                      </div>
                    </div>

                    {/* Physical Document Image with optional filters */}
                    <div className="p-3 sm:p-6 bg-slate-50/40 flex items-center justify-center">
                      <img
                        src={pageImg}
                        alt={`Naskah Asli Halaman ${pageIdx + 1}`}
                        className="max-w-full h-auto object-contain rounded-xs shadow-xs transition-all"
                        style={{
                          filter: getFilterStyle(),
                          maxHeight: '1150px',
                        }}
                      />
                    </div>

                    {/* Footer Stamp of Authenticity */}
                    <div className="bg-slate-50 border-t border-slate-200 px-5 py-2.5 flex items-center justify-between text-[11px] font-sans text-slate-500">
                      <div className="flex items-center gap-2">
                        <Check className="w-3.5 h-3.5 text-emerald-600 font-bold" />
                        <span>Telah Diverifikasi Melalui Pemindaian / Dokumen Resmi SIPERDITAN</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-400">
                        Hal. {pageIdx + 1} / {pdfPages.length} • Ref: {nomorAgendaVal}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                /* Authentic Archival Government Letter Representation (For Seed/Initial Records) */
                <div
                  className="bg-[#fdfcf9] relative shadow-[0_25px_60px_rgba(0,0,0,0.38)] rounded-sm border border-slate-300 text-slate-900 max-w-[800px] w-full p-8 sm:p-14 font-serif leading-relaxed text-[13px] transition-all"
                  style={{
                    transform: `rotate(${rotation}deg)`,
                    minHeight: '1080px',
                  }}
                >
                  {/* Subtle Stamp of Central Java Watermark */}
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.035] select-none">
                    <div className="w-96 h-96 rounded-full border-8 border-slate-900 flex items-center justify-center font-sans font-black text-4xl text-center uppercase tracking-widest p-8 rotate-[-25deg]">
                      PEMERINTAH PROVINSI JAWA TENGAH
                    </div>
                  </div>

                  {/* Official Letterhead (Kop Surat Resmi Kedinasan) */}
                  <div className="text-center border-b-[3.5px] border-double border-slate-900 pb-4 mb-7 relative font-sans">
                    <div className="text-[14px] font-bold tracking-wider uppercase text-slate-900">
                      PEMERINTAH PROVINSI JAWA TENGAH
                    </div>
                    <div className="text-[17px] font-black uppercase text-slate-950 tracking-wide mt-0.5">
                      DINAS PERUMAHAN RAKYAT DAN KAWASAN PERMUKIMAN
                    </div>
                    <div className="text-[11px] text-slate-700 mt-1">
                      Jalan Madukoro Blok AA - BB Kompleks PRPP, Tawangsari, Semarang Barat, Kota Semarang 50144
                    </div>
                    <div className="text-[11px] text-slate-600">
                      Telepon (024) 7608202, 7608203 • Faksimile (024) 7608204 • Website: disperakim.jatengprov.go.id
                    </div>
                  </div>

                  {/* Metadata Header (Nomor, Sifat, Lampiran, Perihal) */}
                  <div className="flex justify-between items-start mb-6 text-xs font-sans">
                    <div className="space-y-1">
                      <div>
                        <span className="font-semibold w-20 inline-block text-slate-800">Nomor</span>: {surat.nomorSurat}
                      </div>
                      <div>
                        <span className="font-semibold w-20 inline-block text-slate-800">Sifat</span>: Penting / Segera
                      </div>
                      <div>
                        <span className="font-semibold w-20 inline-block text-slate-800">Lampiran</span>: 1 (satu) Berkas
                      </div>
                      <div>
                        <span className="font-semibold w-20 inline-block text-slate-800">Perihal</span>:{' '}
                        <strong className="font-bold underline text-slate-950">{surat.perihal}</strong>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div>Semarang, {formatDateIndo(surat.tanggalSurat)}</div>
                      <div className="mt-3 text-slate-800 leading-snug">
                        Kepada Yth.<br />
                        <strong>Kepala Bidang Pertanahan</strong><br />
                        Dinas Perumahan Rakyat dan Kawasan Permukiman<br />
                        di Semarang
                      </div>
                    </div>
                  </div>

                  {/* Letter Substance / Body */}
                  <div className="space-y-4 my-6 text-justify text-slate-800 leading-relaxed text-[13.5px]">
                    <p>
                      Dengan hormat disampaikan, sehubungan dengan pelaksanaan tugas kedinasan dan koordinasi penyelenggaraan urusan pertanahan di wilayah Provinsi Jawa Tengah, bersama ini disampaikan naskah persuratan dengan nomor registrasi agenda <strong>{nomorAgendaVal}</strong> perihal <em>&ldquo;{surat.perihal}&rdquo;</em> yang terdaftar secara resmi dari/kepada <strong>{asalSuratVal}</strong>.
                    </p>

                    {agendaVal && (
                      <div className="my-4 p-4 bg-amber-50/50 border border-amber-300/80 rounded font-sans text-xs space-y-1.5 shadow-2xs">
                        <div className="font-bold text-blue-950 border-b border-amber-200 pb-1 uppercase tracking-wider flex items-center justify-between">
                          <span>Informasi Jadwal Undangan / Rapat Koordinasi</span>
                          <span className="text-[10px] text-amber-800 font-mono">AGENDA RESMI</span>
                        </div>
                        <div><span className="w-28 inline-block font-semibold">Nama Acara:</span> {agendaVal.namaAcara}</div>
                        <div><span className="w-28 inline-block font-semibold">Hari / Tanggal:</span> {formatDateIndo(agendaVal.tanggalAcara)}</div>
                        <div><span className="w-28 inline-block font-semibold">Waktu:</span> {agendaVal.waktuAcara}</div>
                        <div><span className="w-28 inline-block font-semibold">Tempat:</span> {agendaVal.tempatAcara}</div>
                        {agendaVal.keterangan && (
                          <div><span className="w-28 inline-block font-semibold">Keterangan:</span> {agendaVal.keterangan}</div>
                        )}
                      </div>
                    )}

                    <p>
                      Mengingat urgensi dan substansi materi dalam naskah dinas ini, diharapkan Saudara bersama jajaran Kelompok Kerja (Pokja) terkait dapat segera menelaah, mengkoordinasikan, dan mengambil langkah tindak lanjut sesuai dengan ketentuan peraturan perundang-undangan.
                    </p>
                    <p>
                      Demikian surat ini disampaikan untuk dipedomani dan dilaksanakan dengan penuh rasa tanggung jawab.
                    </p>
                  </div>

                  {/* Signature and Official Ink Stamp */}
                  <div className="flex justify-between items-end mt-12 font-sans text-xs">
                    {/* Barcode & Registration Stamp on physical document */}
                    <div className="border border-slate-300 bg-slate-50/80 p-2.5 rounded text-[10px] space-y-1 text-slate-600">
                      <div className="font-mono font-bold text-slate-800 tracking-wider">SIPERDITAN DISPERAKIM</div>
                      <div className="font-mono">AGD: {nomorAgendaVal}</div>
                      <div>Diterima: {formatDateIndo(tanggalDisposisiMasukVal)}</div>
                    </div>

                    {/* Official Pejabat Signature block with Stamp Seal */}
                    <div className="text-center w-72 relative">
                      <div className="font-medium text-slate-800">a.n. Kepala Dinas,</div>
                      <div className="text-[11px] text-slate-600 mb-14">Sekretaris Dinas</div>

                      {/* Authentic Red/Purple Ink Government Stamp Seal */}
                      <div className="absolute top-8 left-6 pointer-events-none select-none opacity-85 rotate-[-8deg]">
                        <div className="w-28 h-28 rounded-full border-[2.5px] border-dashed border-rose-700/80 p-1 flex items-center justify-center">
                          <div className="w-full h-full rounded-full border border-rose-700/80 flex flex-col items-center justify-center text-center p-1 text-[8px] font-bold text-rose-800 uppercase tracking-tighter leading-tight">
                            <span>PEMERINTAH PROVINSI</span>
                            <span className="text-[7px] my-0.5 font-black text-rose-900">JAWA TENGAH</span>
                            <span>DISPERAKIM</span>
                          </div>
                        </div>
                      </div>

                      <div className="font-bold text-slate-950 underline relative z-10 text-[13px]">
                        Drs. WAHYU HIDAYAT, M.Si
                      </div>
                      <div className="text-[11px] text-slate-700">Pembina Utama Muda</div>
                      <div className="text-[11px] text-slate-600">NIP. 19710314 199603 1 003</div>
                    </div>
                  </div>

                  {/* Incoming Disposition Attachment Slip on Bottom of Letter */}
                  {narasiDisposisiKadisVal && (
                    <div className="mt-10 pt-5 border-t-2 border-dashed border-slate-300 font-sans">
                      <div className="bg-amber-50/80 border border-amber-300 p-3.5 rounded-sm">
                        <div className="flex items-center justify-between border-b border-amber-200 pb-1.5 mb-2">
                          <span className="font-bold text-xs uppercase text-amber-950 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Lembar Catatan Disposisi Kepala Dinas
                          </span>
                          <span className="text-[10px] font-mono text-slate-500">
                            Masuk: {formatDateIndo(tanggalDisposisiMasukVal)}
                          </span>
                        </div>
                        <div className="italic text-slate-900 font-serif text-[13px] bg-white p-2.5 rounded border border-amber-200">
                          &ldquo;{narasiDisposisiKadisVal}&rdquo;
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : (
            /* ================= MODE 2: TRANSKRIP DIGITAL KEDINASAN ================= */
            <div
              id="printable-transcript-doc"
              className="bg-white max-w-[780px] w-full shadow-2xl rounded-sm p-8 sm:p-12 text-slate-900 font-serif leading-relaxed text-[13px] border border-slate-300"
              style={{
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'top center',
              }}
            >
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

              {/* Nomor & Perihal */}
              <div className="flex justify-between items-start mb-6 text-xs font-sans">
                <div className="space-y-1">
                  <div><span className="font-semibold w-20 inline-block">Nomor</span>: {surat.nomorSurat}</div>
                  <div><span className="font-semibold w-20 inline-block">Sifat</span>: Penting / Segera</div>
                  <div><span className="font-semibold w-20 inline-block">Lampiran</span>: 1 (satu) Berkas</div>
                  <div><span className="font-semibold w-20 inline-block">Perihal</span>: <strong className="font-bold underline text-slate-900">{surat.perihal}</strong></div>
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
                  Dengan hormat disampaikan, sehubungan dengan pelaksanaan tugas dan fungsi fasilitasi pertanahan di wilayah Provinsi Jawa Tengah, bersama ini kami sampaikan dokumen persuratan dengan nomor <strong>{surat.nomorSurat}</strong> perihal <em>&ldquo;{surat.perihal}&rdquo;</em> yang diterima dari/kepada <strong>{asalSuratVal}</strong>.
                </p>

                {agendaVal && (
                  <div className="my-4 p-4 bg-slate-50 border border-slate-300 rounded-sm font-sans text-xs space-y-1.5">
                    <div className="font-bold text-blue-900 border-b border-slate-200 pb-1 uppercase tracking-wider">
                      Jadwal Pelaksanaan Agenda Undangan
                    </div>
                    <div><span className="w-28 inline-block font-semibold">Nama Acara:</span> {agendaVal.namaAcara}</div>
                    <div><span className="w-28 inline-block font-semibold">Hari / Tanggal:</span> {formatDateIndo(agendaVal.tanggalAcara)}</div>
                    <div><span className="w-28 inline-block font-semibold">Waktu:</span> {agendaVal.waktuAcara}</div>
                    <div><span className="w-28 inline-block font-semibold">Tempat:</span> {agendaVal.tempatAcara}</div>
                    {agendaVal.keterangan && (
                      <div><span className="w-28 inline-block font-semibold">Keterangan:</span> {agendaVal.keterangan}</div>
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

              {/* Tanda Tangan */}
              <div className="flex justify-end mt-8 font-sans text-xs">
                <div className="text-center w-64">
                  <div className="font-medium text-slate-700">a.n. Kepala Dinas,</div>
                  <div className="text-[11px] text-slate-600 mb-12">Sekretaris Dinas</div>
                  <div className="font-bold text-slate-900 underline">Drs. WAHYU HIDAYAT, M.Si</div>
                  <div className="text-[11px] text-slate-600">NIP. 19710314 199603 1 003</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Info & Device Printer Status Bar */}
        <div className="bg-slate-900 border-t border-slate-800 px-5 py-2.5 flex flex-wrap items-center justify-between text-xs text-slate-400 font-sans gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Perangkat cetak siap: Mendukung pencetakan langsung ke printer USB, WiFi, Bluetooth, atau Jaringan.</span>
          </div>
          <span className="text-[11px] text-slate-500 font-mono">
            SIPERDITAN • DINAS PERUMAHAN RAKYAT DAN KAWASAN PERMUKIMAN PROVINSI JAWA TENGAH
          </span>
        </div>
      </div>
    </div>
  );
};
