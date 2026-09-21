import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { User, Surat } from '../../types';
import {
  Users,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertTriangle,
  FileText,
  TrendingUp,
  UserCheck,
  ChevronRight,
} from 'lucide-react';
import { formatDateIndo, calculateSlaStatus } from '../../utils/helpers';

interface MonitoringPokjaViewProps {
  onSelectSuratForDetail: (surat: Surat) => void;
}

export const MonitoringPokjaView: React.FC<MonitoringPokjaViewProps> = ({
  onSelectSuratForDetail,
}) => {
  const { pokjas, users, disposisiList, suratList, currentUser, getStafByPokja } = useApp();

  // If user is Ketua Pokja, lock to their Pokja; otherwise default to Pokja 1
  const initialPokjaId =
    currentUser.role === 'ketua_pokja' && currentUser.pokjaId
      ? currentUser.pokjaId
      : pokjas[0]?.id || 'pokja_1';

  const [activePokjaId, setActivePokjaId] = useState<string>(initialPokjaId);
  const [selectedStaf, setSelectedStaf] = useState<User | null>(null);

  const activePokja = pokjas.find((p) => p.id === activePokjaId);
  const ketua = users.find((u) => u.id === activePokja?.ketuaId);
  const staffList = activePokjaId ? getStafByPokja(activePokjaId, false) : [];

  // Letters assigned to this Pokja
  const pokjaSurat = suratList.filter((s) => s.assignedPokjaIds.includes(activePokjaId));

  // Staff specific letters if selected
  const selectedStafDisposisi = selectedStaf
    ? disposisiList.filter((d) => d.kepadaUserId === selectedStaf.id)
    : [];

  const selectedStafSurat = selectedStaf
    ? suratList.filter((s) => selectedStafDisposisi.some((d) => d.suratId === s.id))
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <Users className="w-5 h-5 text-blue-900" />
          Monitoring Beban Kerja Staf & Pokja
        </h2>
        <p className="text-xs text-slate-500">
          Evaluasi penugasan, progres pengerjaan disposisi, dan kepatuhan batas waktu (SLA)
        </p>
      </div>

      {/* Pokja Selector (only switchable by Kabid / Admin; locked for Ketua Pokja) */}
      {currentUser.role !== 'ketua_pokja' && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {pokjas.map((pokja) => {
            const isActive = activePokjaId === pokja.id;
            const pStaf = getStafByPokja(pokja.id, false);
            const pSuratCount = suratList.filter((s) =>
              s.assignedPokjaIds.includes(pokja.id)
            ).length;

            return (
              <button
                key={pokja.id}
                onClick={() => {
                  setActivePokjaId(pokja.id);
                  setSelectedStaf(null);
                }}
                className={`p-4 rounded-xl border text-left transition-all flex flex-col justify-between ${
                  isActive
                    ? 'bg-blue-900 text-white border-blue-900 shadow-md ring-2 ring-blue-300'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                }`}
              >
                <div>
                  <div className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                    POKJA
                  </div>
                  <div className="font-bold text-xs sm:text-sm mt-0.5 leading-snug">
                    {pokja.nama}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-3 mt-2 border-t border-white/10">
                  <span className={isActive ? 'text-blue-100' : 'text-slate-500'}>
                    {pStaf.length} Staf
                  </span>
                  <span className={`font-bold ${isActive ? 'text-amber-300' : 'text-slate-800'}`}>
                    {pSuratCount} Surat
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Active Pokja Banner Info */}
      {activePokja && (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-blue-900">
              Kelompok Kerja Aktif
            </div>
            <h3 className="font-bold text-base text-slate-900 mt-0.5">
              {activePokja.nama}
            </h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">{activePokja.deskripsi}</p>
          </div>

          {ketua && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 shrink-0 text-xs">
              <div className="text-[10px] text-slate-400 font-semibold uppercase">Ketua Pokja</div>
              <div className="font-bold text-slate-900 mt-0.5">{ketua.nama}</div>
              <div className="text-slate-500 text-[11px]">NIP. {ketua.nip} • {ketua.nomorWhatsapp}</div>
            </div>
          )}
        </div>
      )}

      {/* Staf Grid & Workload Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              Daftar Beban Kerja Staf
            </h3>
            <p className="text-xs text-slate-500">
              Klik nama staf untuk menginspeksi surat dan rincian progres tugasnya
            </p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 rounded-lg text-slate-700">
            {staffList.length} Staf Terdaftar
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Staf</th>
                <th className="py-3 px-4">NIP & Jabatan</th>
                <th className="py-3 px-4 text-center">Disposisi Baru</th>
                <th className="py-3 px-4 text-center">Sedang Dikerjakan</th>
                <th className="py-3 px-4 text-center">Selesai</th>
                <th className="py-3 px-4 text-center">Terlambat (Overdue)</th>
                <th className="py-3 px-4 text-center">Status Akun</th>
                <th className="py-3 px-4 text-right">Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {staffList.map((staf) => {
                const sDisps = disposisiList.filter((d) => d.kepadaUserId === staf.id);
                const baruCount = sDisps.filter((d) => d.status === 'Terkirim').length;
                const dikerjakanCount = sDisps.filter(
                  (d) => d.status === 'Ditindaklanjuti' || d.status === 'Dibaca'
                ).length;
                const selesaiCount = sDisps.filter((d) => d.status === 'Selesai').length;

                const overdueCount = sDisps.filter((d) => {
                  if (!d.batasWaktu || d.status === 'Selesai') return false;
                  const sla = calculateSlaStatus(d.batasWaktu);
                  return sla.status === 'expired';
                }).length;

                const isSelected = selectedStaf?.id === staf.id;

                return (
                  <tr
                    key={staf.id}
                    onClick={() => setSelectedStaf(isSelected ? null : staf)}
                    className={`cursor-pointer transition-colors ${
                      isSelected
                        ? 'bg-blue-50/80 font-medium'
                        : 'hover:bg-slate-50/70'
                    }`}
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{staf.nama}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        WA: {staf.nomorWhatsapp}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-600">
                      <div>NIP. {staf.nip}</div>
                      <div className="text-[11px] text-slate-400">{staf.jabatan}</div>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-900">
                        {baruCount}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-900">
                        {dikerjakanCount}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span className="font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-900">
                        {selesaiCount}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`font-bold px-2 py-0.5 rounded ${
                          overdueCount > 0
                            ? 'bg-rose-100 text-rose-800 font-black'
                            : 'bg-slate-100 text-slate-500'
                        }`}
                      >
                        {overdueCount}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 text-center">
                      {staf.status === 'active' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" /> Aktif
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                          Nonaktif
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStaf(isSelected ? null : staf);
                        }}
                        className="text-xs text-blue-900 font-bold hover:underline"
                      >
                        {isSelected ? 'Tutup Rincian' : 'Lihat Surat'}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail Drilldown of Selected Staf's Assigned Letters */}
      {selectedStaf && (
        <div className="bg-white rounded-2xl border-2 border-blue-500 shadow-md p-5 space-y-4 animate-in fade-in">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <div className="text-[11px] font-bold text-blue-900 uppercase">
                Rincian Surat yang Sedang Ditugaskan
              </div>
              <h3 className="font-bold text-base text-slate-900">
                {selectedStaf.nama} ({selectedStaf.jabatan})
              </h3>
            </div>
            <button
              onClick={() => setSelectedStaf(null)}
              className="text-xs px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
            >
              Tutup Rincian
            </button>
          </div>

          <div className="space-y-3">
            {selectedStafSurat.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-400">
                Tidak ada surat yang sedang aktif ditugaskan kepada staf ini.
              </div>
            ) : (
              selectedStafSurat.map((surat) => {
                const disp = selectedStafDisposisi.find((d) => d.suratId === surat.id);
                const sla = calculateSlaStatus(disp?.batasWaktu);

                return (
                  <div
                    key={surat.id}
                    className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] bg-white border border-slate-300 px-2 py-0.5 rounded font-bold">
                          {surat.nomorAgenda}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-600">
                          {surat.status}
                        </span>
                        {disp?.batasWaktu && (
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${sla.badgeClass}`}>
                            SLA: {formatDateIndo(disp.batasWaktu)} ({sla.label})
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-slate-900 text-sm">{surat.perihal}</div>
                      <div className="text-[11px] text-slate-500">
                        Asal: {surat.asalSurat} • No: {surat.nomorSurat}
                      </div>
                      {disp?.narasi && (
                        <div className="text-[11px] bg-white p-2 rounded border border-slate-200 italic mt-1 text-slate-700 font-serif">
                          &ldquo;{disp.narasi}&rdquo;
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      <button
                        onClick={() => onSelectSuratForDetail(surat)}
                        className="px-3 py-1.5 bg-blue-900 text-white rounded-lg font-semibold hover:bg-blue-800 transition-colors"
                      >
                        Buka Detail Surat
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};
