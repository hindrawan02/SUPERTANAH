import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Disposisi, DisposisiPrioritas, Surat } from '../../types';
import {
  X,
  Edit,
  Save,
  Trash2,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Clock,
  User,
  Shield,
} from 'lucide-react';
import { formatDateIndo } from '../../utils/helpers';

interface EditDisposisiModalProps {
  isOpen: boolean;
  onClose: () => void;
  disposisi: Disposisi | null;
  surat?: Surat | null;
}

export const EditDisposisiModal: React.FC<EditDisposisiModalProps> = ({
  isOpen,
  onClose,
  disposisi,
  surat,
}) => {
  const {
    editDisposisi,
    deleteDisposisi,
    pokjas,
    users,
    currentUser,
  } = useApp();

  const [narasi, setNarasi] = useState('');
  const [prioritas, setPrioritas] = useState<DisposisiPrioritas>('Normal');
  const [batasWaktu, setBatasWaktu] = useState('');
  const [status, setStatus] = useState<'Terkirim' | 'Dibaca' | 'Ditindaklanjuti' | 'Selesai'>('Terkirim');
  const [targetPokjaId, setTargetPokjaId] = useState('');
  const [targetUserId, setTargetUserId] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (disposisi) {
      setNarasi(disposisi.narasi || '');
      setPrioritas(disposisi.prioritas || 'Normal');
      setBatasWaktu(disposisi.batasWaktu || '');
      setStatus(disposisi.status || 'Terkirim');
      setTargetPokjaId(disposisi.pokjaId || '');
      setTargetUserId(disposisi.kepadaUserId || '');
      setFeedback(null);
    }
  }, [disposisi]);

  if (!isOpen || !disposisi) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!narasi.trim()) {
      setFeedback({ type: 'error', message: 'Instruksi narasi disposisi tidak boleh kosong.' });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    try {
      const updatedFields: Partial<Disposisi> = {
        narasi: narasi.trim(),
        prioritas,
        batasWaktu: batasWaktu || undefined,
        status,
      };

      if (disposisi.level === 'kabid_ke_pokja' && targetPokjaId) {
        const foundPokja = pokjas.find((p) => p.id === targetPokjaId);
        if (foundPokja) {
          updatedFields.pokjaId = foundPokja.id;
          updatedFields.kepadaNama = foundPokja.nama;
          updatedFields.kepadaUserNama = foundPokja.nama;
          updatedFields.kepadaUserId = foundPokja.ketuaId;
        }
      } else if (disposisi.level === 'pokja_ke_staf' && targetUserId) {
        const foundUser = users.find((u) => u.id === targetUserId);
        if (foundUser) {
          updatedFields.kepadaUserId = foundUser.id;
          updatedFields.kepadaNama = foundUser.nama;
          updatedFields.kepadaUserNama = foundUser.nama;
          updatedFields.kepadaJabatan = foundUser.jabatan;
          if (foundUser.pokjaId) {
            updatedFields.pokjaId = foundUser.pokjaId;
          }
        }
      }

      await editDisposisi(disposisi.id, updatedFields);
      setFeedback({
        type: 'success',
        message: 'Disposisi berhasil diperbarui dan disinkronkan secara live!',
      });
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      console.error('Error updating disposisi:', err);
      setFeedback({
        type: 'error',
        message: `Gagal memperbarui disposisi: ${err?.message || 'Terjadi kesalahan sistem'}`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (
      window.confirm(
        'Apakah Anda yakin ingin menghapus lembar disposisi ini? Data akan langsung terhapus secara permanen bagi semua pengguna.'
      )
    ) {
      try {
        await deleteDisposisi(disposisi.id);
        alert('Lembar disposisi berhasil dihapus.');
        onClose();
      } catch (err) {
        alert('Gagal menghapus disposisi.');
      }
    }
  };

  const stafList = users.filter((u) => u.role === 'staf_pokja');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl my-6 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-800 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-white/20 text-white border border-white/30">
              <Edit className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Edit Lembar Disposisi
              </h2>
              <p className="text-[11px] text-amber-100">
                Tingkat: {disposisi.level === 'kabid_ke_pokja' ? 'Kepala Bidang ke Pokja' : 'Ketua Pokja ke Staf Pelaksana'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-amber-100 hover:text-white hover:bg-white/10 transition-colors"
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

        {/* Surat Context Card */}
        {surat && (
          <div className="px-5 py-3 bg-amber-50/50 border-b border-amber-100 text-xs text-slate-700 space-y-0.5">
            <div className="font-bold text-amber-950 flex items-center gap-2">
              <span>No. Agenda: {surat.nomorAgenda}</span>
              <span>•</span>
              <span>No. Surat: {surat.nomorSurat}</span>
            </div>
            <div className="text-slate-600 truncate">{surat.perihal}</div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 text-xs">
          {/* Penerima Disposisi */}
          {disposisi.level === 'kabid_ke_pokja' ? (
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Tujuan Kelompok Kerja (Pokja)
              </label>
              <select
                value={targetPokjaId}
                onChange={(e) => setTargetPokjaId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium"
              >
                {pokjas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nama}
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Tujuan Staf Pelaksana
              </label>
              <select
                value={targetUserId}
                onChange={(e) => setTargetUserId(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium"
              >
                {stafList.map((staf) => (
                  <option key={staf.id} value={staf.id}>
                    {staf.nama} - {staf.jabatan}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Narasi Instruksi */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Petunjuk / Instruksi Disposisi <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              required
              value={narasi}
              onChange={(e) => setNarasi(e.target.value)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-serif italic text-slate-900"
              placeholder="Tuliskan petunjuk atau instruksi pengerjaan..."
            />
          </div>

          {/* Prioritas & Batas Waktu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Tingkat Prioritas
              </label>
              <select
                value={prioritas}
                onChange={(e) => setPrioritas(e.target.value as DisposisiPrioritas)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-semibold"
              >
                <option value="Normal">🟢 Normal</option>
                <option value="Tinggi">🟡 Tinggi (Prioritas)</option>
                <option value="Mendesak">🔴 Mendesak (Segera)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Batas Waktu Penyelesaian (SLA)
              </label>
              <input
                type="date"
                value={batasWaktu}
                onChange={(e) => setBatasWaktu(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Status Disposisi */}
          <div>
            <label className="block text-slate-700 font-semibold mb-1">
              Status Disposisi
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-medium"
            >
              <option value="Terkirim">Terkirim</option>
              <option value="Dibaca">Dibaca</option>
              <option value="Ditindaklanjuti">Ditindaklanjuti</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            {(currentUser.role === 'super_admin' || currentUser.role === 'admin_pertanahan' || currentUser.role === 'kabid') && (
              <button
                type="button"
                onClick={handleDelete}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-semibold transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Hapus Disposisi</span>
              </button>
            )}

            <div className="flex items-center gap-2 ml-auto">
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
                className="px-5 py-2 bg-amber-600 hover:bg-amber-500 disabled:bg-amber-300 text-white rounded-xl font-bold transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <Save className="w-4 h-4 text-white" />
                <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Pembaruan'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
