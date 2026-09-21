import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { Surat } from '../../types';
import { QrCode, X, Download, ShieldCheck } from 'lucide-react';

interface QrCodeModalProps {
  surat: Surat | null;
  onClose: () => void;
}

export const QrCodeModal: React.FC<QrCodeModalProps> = ({ surat, onClose }) => {
  const [qrUrl, setQrUrl] = useState<string>('');

  useEffect(() => {
    if (surat) {
      const payload = JSON.stringify({
        id: surat.id,
        nomorAgenda: surat.nomorAgenda,
        nomorSurat: surat.nomorSurat,
        perihal: surat.perihal,
        instansi: 'Dinas Perumahan Rakyat dan Kawasan Permukiman Provinsi Jawa Tengah',
        verifikasiUrl: `https://disperakim.jatengprov.go.id/verifikasi/surat/${surat.id}`,
      });

      QRCode.toDataURL(payload, {
        width: 256,
        margin: 2,
        color: {
          dark: '#0F2C59',
          light: '#FFFFFF',
        },
      })
        .then((url) => setQrUrl(url))
        .catch((err) => console.error(err));
    }
  }, [surat]);

  if (!surat) return null;

  const downloadQr = () => {
    if (!qrUrl) return;
    const a = document.createElement('a');
    a.href = qrUrl;
    const safeNomor = surat.nomorAgenda || surat.id || 'surat';
    a.download = `QR_${safeNomor.replace(/\//g, '_')}.png`;
    a.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl max-w-sm w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-blue-900 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <QrCode className="w-5 h-5 text-amber-400" />
            <div>
              <h3 className="font-semibold text-sm">QR Code Validasi Surat</h3>
              <p className="text-[11px] text-blue-200">Disperakim Prov. Jateng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-200 hover:text-white rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Display */}
        <div className="p-6 text-center space-y-4">
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 inline-block shadow-inner">
            {qrUrl ? (
              <img src={qrUrl} alt="QR Code" className="w-48 h-48 mx-auto rounded-lg" />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center text-slate-400 text-xs">
                Membuat QR Code...
              </div>
            )}
          </div>

          <div className="text-left bg-blue-50/50 p-3 rounded-lg border border-blue-100 text-xs space-y-1">
            <div className="font-semibold text-blue-950 truncate">{surat.nomorSurat}</div>
            <div className="text-slate-600 line-clamp-2">{surat.perihal}</div>
            <div className="text-slate-500 font-mono text-[10px]">Agenda: {surat.nomorAgenda}</div>
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500 justify-center">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Tanda Keaslian Digital Bidang Pertanahan</span>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
          >
            Tutup
          </button>
          <button
            type="button"
            onClick={downloadQr}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            Unduh QR
          </button>
        </div>
      </div>
    </div>
  );
};
