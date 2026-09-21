import React from 'react';
import { SuratKeluar } from '../../types';
import { X, Printer, CheckCircle2, QrCode } from 'lucide-react';
import { GOOGLE_DRIVE_FOLDER_URL } from '../../data/initialData';

interface CetakResiSuratKeluarModalProps {
  suratKeluar: SuratKeluar | null;
  onClose: () => void;
}

export const CetakResiSuratKeluarModal: React.FC<CetakResiSuratKeluarModalProps> = ({
  suratKeluar,
  onClose,
}) => {
  if (!suratKeluar) return null;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/75 backdrop-blur-xs p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-auto print:m-0 print:border-none print:shadow-none print:max-w-none">
        {/* Header - Hidden on physical print */}
        <div className="bg-blue-950 text-white px-5 py-3.5 flex items-center justify-between print:hidden shadow-sm">
          <div className="flex items-center gap-2">
            <Printer className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-bold text-sm">Bukti Penomoran Surat Keluar</h3>
              <p className="text-[11px] text-blue-200">Format Resmi Bidang Pertanahan Disperakim</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-400 text-blue-950 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4" />
              <span>Cetak Bukti</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-blue-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Receipt Body */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800 bg-white">
          {/* Kop Surat Resmi */}
          <div className="border-b-2 border-black pb-4 text-center space-y-1">
            <div className="text-xs tracking-widest font-serif uppercase text-slate-700">
              Pemerintah Provinsi Jawa Tengah
            </div>
            <div className="text-sm sm:text-base font-serif font-black tracking-wide uppercase text-slate-950 leading-tight">
              Dinas Perumahan Rakyat dan Kawasan Permukiman
            </div>
            <div className="text-xs sm:text-sm font-bold text-slate-800">
              Bidang Pertanahan (Bidang III)
            </div>
            <div className="text-[11px] text-slate-600 font-sans">
              Jl. Madukoro Blok AA-BB, Kompleks Puri Anjasmoro, Semarang | Telp. (024) 7608533
            </div>
          </div>

          {/* Title */}
          <div className="text-center space-y-1 py-1">
            <h2 className="text-sm sm:text-base font-bold uppercase tracking-wider text-slate-900 border-b border-dashed border-slate-300 pb-1.5 inline-block px-4">
              Lembar Bukti Registrasi Penomoran Surat Keluar
            </h2>
            <p className="text-[11px] text-slate-500 font-mono">
              Dicatat pada Buku Agenda Elektronik Bidang Pertanahan
            </p>
          </div>

          {/* Nomor Surat Big Callout */}
          <div className="bg-slate-50 border-2 border-blue-900 rounded-xl p-4 text-center space-y-1">
            <div className="text-[11px] font-bold text-blue-950 uppercase tracking-widest">
              Nomor Registrasi Surat Keluar
            </div>
            <div className="text-xl sm:text-2xl font-mono font-black text-blue-950 tracking-wider">
              {suratKeluar.nomorSurat}
            </div>
            <div className="text-[10px] text-slate-500">
              Nomor Urut: <strong className="text-slate-800">#{suratKeluar.nomorUrut}</strong> | Tahun Anggaran:{' '}
              <strong className="text-slate-800">{suratKeluar.tahun}</strong>
            </div>
          </div>

          {/* Details Table */}
          <div className="border border-slate-300 rounded-lg overflow-hidden text-xs">
            <table className="w-full text-left divide-y divide-slate-200">
              <tbody className="divide-y divide-slate-200">
                <tr>
                  <td className="w-1/3 px-3 py-2.5 bg-slate-50 font-semibold text-slate-700">Tanggal Surat</td>
                  <td className="px-3 py-2.5 font-mono text-slate-900 font-bold">{suratKeluar.tanggalSurat}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5 bg-slate-50 font-semibold text-slate-700">Tujuan / Penerima</td>
                  <td className="px-3 py-2.5 text-slate-900 font-medium">{suratKeluar.tujuanSurat}</td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5 bg-slate-50 font-semibold text-slate-700">Perihal / Isi Ringkas</td>
                  <td className="px-3 py-2.5 text-slate-900 font-medium leading-relaxed">{suratKeluar.perihal}</td>
                </tr>
                {suratKeluar.keterangan && (
                  <tr>
                    <td className="px-3 py-2.5 bg-slate-50 font-semibold text-slate-700">Catatan / Keterangan</td>
                    <td className="px-3 py-2.5 text-slate-700 italic">{suratKeluar.keterangan}</td>
                  </tr>
                )}
                <tr>
                  <td className="px-3 py-2.5 bg-slate-50 font-semibold text-slate-700">Dokumen Lampiran</td>
                  <td className="px-3 py-2.5 text-slate-800">
                    <span className="font-mono text-[11px] font-semibold">{suratKeluar.fileName || 'Naskah_Surat.pdf'}</span>
                    <span className="text-slate-500 text-[10px] ml-2">({suratKeluar.fileSize || '1.0 MB'})</span>
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5 bg-slate-50 font-semibold text-slate-700">Pengambil Nomor / Pegawai</td>
                  <td className="px-3 py-2.5 text-slate-900">
                    <div className="font-bold">{suratKeluar.createdBy}</div>
                    {suratKeluar.createdByNip && (
                      <div className="text-slate-500 text-[11px] font-mono">NIP. {suratKeluar.createdByNip}</div>
                    )}
                    {suratKeluar.createdByJabatan && (
                      <div className="text-slate-600 text-[11px]">{suratKeluar.createdByJabatan}</div>
                    )}
                  </td>
                </tr>
                <tr>
                  <td className="px-3 py-2.5 bg-slate-50 font-semibold text-slate-700">Waktu Registrasi Sistem</td>
                  <td className="px-3 py-2.5 font-mono text-slate-600 text-[11px]">{suratKeluar.createdAt} WIB</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer & QR Verification */}
          <div className="pt-2 flex items-center justify-between gap-4 border-t border-slate-200 text-xs">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                <CheckCircle2 className="w-4 h-4" />
                <span>Dokumen Tersimpan di Google Drive Disperakim</span>
              </div>
              <p className="text-[10px] text-slate-500 max-w-sm">
                Tersinkronisasi otomatis dengan Google Drive Bidang Pertanahan Provinsi Jawa Tengah.
              </p>
              <a
                href={suratKeluar.googleDriveUrl || GOOGLE_DRIVE_FOLDER_URL}
                target="_blank"
                rel="noreferrer"
                className="text-[10px] text-blue-800 underline block break-all font-mono"
              >
                {suratKeluar.googleDriveUrl || GOOGLE_DRIVE_FOLDER_URL}
              </a>
            </div>

            <div className="text-center p-2 border border-slate-300 rounded-lg bg-slate-50 shrink-0">
              <QrCode className="w-12 h-12 text-slate-800 mx-auto" />
              <div className="text-[9px] font-mono font-bold text-slate-600 mt-1">VERIFIKASI RESMI</div>
            </div>
          </div>

          {/* Bottom sign block */}
          <div className="pt-4 flex justify-between text-[11px] text-slate-600">
            <div>
              <p>Petugas Pencatat Agenda,</p>
              <p className="font-bold text-slate-900 mt-10">Admin Persuratan Bidang III</p>
            </div>
            <div className="text-right">
              <p>Semarang, {suratKeluar.tanggalSurat}</p>
              <p>Pegawai Pemohon Penomoran,</p>
              <p className="font-bold text-slate-900 mt-10">{suratKeluar.createdBy}</p>
            </div>
          </div>
        </div>

        {/* Modal Action Bar (Bottom) - Hidden on print */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-between items-center print:hidden text-xs">
          <span className="text-slate-500 text-[11px]">
            Dokumen ini sah sebagai tanda terima penomoran surat keluar Bidang Pertanahan.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-semibold rounded-lg transition-colors"
            >
              Tutup
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Printer className="w-4 h-4 text-amber-400" />
              <span>Cetak Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
