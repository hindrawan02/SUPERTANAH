import React from 'react';
import { WhatsAppNotification } from '../../types';
import { MessageSquare, ExternalLink, Copy, Check, X, ShieldCheck } from 'lucide-react';

interface WhatsAppModalProps {
  notification?: WhatsAppNotification | null;
  isOpen?: boolean;
  onClose: () => void;
}

export const WhatsAppModal: React.FC<WhatsAppModalProps> = ({
  notification,
  isOpen,
  onClose,
}) => {
  const [copied, setCopied] = React.useState(false);

  if (isOpen === false) return null;
  if (!isOpen && !notification) return null;

  const activeNotification: WhatsAppNotification = notification || {
    id: 'wa-demo',
    suratId: 'surat-1',
    penerimaNama: 'Boedyo Dharmawan, S.T., MT.',
    penerimaNomor: '082226434729',
    pesan: `*DISPERAKIM PROV. JATENG - NOTIFIKASI ARSIP PERSURATAN*\n\nYth. Bapak Boedyo Dharmawan, S.T., MT. (Kepala Dinas)\n\nTerdapat naskah dinas masuk baru di sistem Bidang Pertanahan:\nNomor: 005/1842/2026\nPerihal: Koordinasi Penanganan Sengketa Tanah Relokasi Kawasan Permukiman\nStatus: Menunggu Disposisi Pimpinan\n\nSilakan cek tautan sistem untuk lembar disposisi digital.`,
    status: 'Terkirim',
    linkToken: 'TOKEN-DISPERAKIM-8821',
    waktuKirim: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(activeNotification.pesan);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleOpenWa = () => {
    // Sanitize phone number (e.g. 0812 -> 62812)
    let phone = (activeNotification.penerimaNomor || '').replace(/\D/g, '');
    if (phone.startsWith('0')) {
      phone = '62' + phone.substring(1);
    }
    const encodedText = encodeURIComponent(activeNotification.pesan || '');
    window.open(`https://api.whatsapp.com/send?phone=${phone}&text=${encodedText}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
        {/* Header with WhatsApp brand feel */}
        <div className="bg-emerald-700 text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-base">Notifikasi WhatsApp Otomatis</h3>
              <p className="text-xs text-emerald-100">Gateway Notifikasi Persuratan Disperakim Jateng</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-emerald-200 hover:text-white rounded-lg p-1 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto">
          {/* Recipient info */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 flex items-center justify-between text-xs">
            <div>
              <div className="text-slate-500">Penerima Pesan:</div>
              <div className="font-semibold text-slate-800 text-sm">{activeNotification.penerimaNama}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-500">Nomor WhatsApp:</div>
              <div className="font-mono font-medium text-emerald-700">{activeNotification.penerimaNomor}</div>
            </div>
          </div>

          {/* Message bubble */}
          <div>
            <label className="text-xs font-medium text-slate-700 block mb-1.5">
              Pratinjau Pesan yang Dikirim ke Penerima:
            </label>
            <div className="bg-[#EFEAE2] p-3.5 rounded-lg border border-[#D1D7DB] relative shadow-inner">
              <div className="bg-white rounded-lg p-3 shadow-xs text-xs font-sans text-slate-800 whitespace-pre-wrap leading-relaxed border border-slate-200/60">
                {activeNotification.pesan}
              </div>
              <div className="text-[10px] text-slate-500 text-right mt-1">
                Waktu Kirim: {activeNotification.waktuKirim} • Token: {activeNotification.linkToken}
              </div>
            </div>
          </div>

          {/* Security note */}
          <div className="flex items-start gap-2 text-[11px] text-slate-600 bg-amber-50 border border-amber-200 rounded-lg p-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              Tautan dalam pesan diamankan dengan token terenkripsi yang memiliki masa berlaku terbatas
              dan tidak menyimpan kredensial pada URL.
            </p>
          </div>
        </div>

        {/* Footer actions */}
        <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Tersalin!' : 'Salin Pesan'}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800"
            >
              Tutup
            </button>
            <button
              type="button"
              onClick={handleOpenWa}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition-colors"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Buka WhatsApp Web / App
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
