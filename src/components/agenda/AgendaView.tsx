import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Surat } from '../../types';
import {
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  Users,
  CheckCircle2,
  XCircle,
  FileText,
  Filter,
  ChevronLeft,
  ChevronRight,
  List,
  Printer,
} from 'lucide-react';
import { formatDateIndo } from '../../utils/helpers';

interface AgendaViewProps {
  onSelectSuratForDetail: (surat: Surat) => void;
  onOpenPdf: (surat: Surat) => void;
  onOpenDisposisiModal: (surat: Surat) => void;
  onOpenLembarDisposisi?: (surat: Surat) => void;
}

type CalendarMode = 'list' | 'month';

export const AgendaView: React.FC<AgendaViewProps> = ({
  onSelectSuratForDetail,
  onOpenPdf,
  onOpenDisposisiModal,
  onOpenLembarDisposisi,
}) => {
  const { suratList, pokjas, currentUser } = useApp();

  const [mode, setMode] = useState<CalendarMode>('list');
  const [filterRange, setFilterRange] = useState<'semua' | 'hari_ini' | 'minggu_ini' | 'bulan_ini'>('semua');

  // Filter letters that have agenda
  const agendaSurat = useMemo(() => {
    const list = suratList.filter((s) => s.kategori === 'Undangan' && s.agenda);

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    return list.filter((s) => {
      if (!s.agenda) return false;
      const tgl = s.agenda.tanggalAcara;

      if (filterRange === 'hari_ini') {
        return tgl === todayStr;
      }
      if (filterRange === 'bulan_ini') {
        const curMonth = todayStr.substring(0, 7);
        return tgl.startsWith(curMonth);
      }
      return true;
    }).sort((a, b) => (a.agenda!.tanggalAcara > b.agenda!.tanggalAcara ? 1 : -1));
  }, [suratList, filterRange]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-purple-700" />
            Agenda Undangan & Kegiatan Kedinasan
          </h2>
          <p className="text-xs text-slate-500">
            Jadwal kegiatan rapat, sosialisasi, dan koordinasi Bidang Pertanahan
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="bg-slate-100 p-1 rounded-xl flex items-center text-xs font-semibold">
            <button
              onClick={() => setMode('list')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                mode === 'list'
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Daftar Agenda</span>
            </button>
            <button
              onClick={() => setMode('month')}
              className={`px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                mode === 'month'
                  ? 'bg-white text-purple-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CalendarIcon className="w-3.5 h-3.5" />
              <span>Kalender</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <button
          onClick={() => setFilterRange('semua')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
            filterRange === 'semua'
              ? 'bg-purple-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Semua Agenda ({suratList.filter((s) => s.agenda).length})
        </button>
        <button
          onClick={() => setFilterRange('hari_ini')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
            filterRange === 'hari_ini'
              ? 'bg-purple-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Hari Ini
        </button>
        <button
          onClick={() => setFilterRange('bulan_ini')}
          className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
            filterRange === 'bulan_ini'
              ? 'bg-purple-900 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Bulan Ini
        </button>
      </div>

      {/* LIST VIEW */}
      {mode === 'list' && (
        <div className="space-y-4">
          {agendaSurat.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-xs text-slate-400">
              Tidak ada agenda undangan pada rentang yang dipilih.
            </div>
          ) : (
            agendaSurat.map((surat) => {
              const agenda = surat.agenda!;
              const assignedPokjas = pokjas.filter((p) =>
                surat.assignedPokjaIds.includes(p.id)
              );

              return (
                <div
                  key={surat.id}
                  className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-purple-300 transition-all flex flex-col md:flex-row md:items-center justify-between gap-5"
                >
                  {/* Left: Date Badge & Details */}
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {/* Date Block */}
                    <div className="w-16 h-18 rounded-xl bg-gradient-to-b from-purple-700 to-purple-900 text-white flex flex-col items-center justify-center shrink-0 shadow-xs">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-purple-200">
                        {new Date(agenda.tanggalAcara).toLocaleDateString('id-ID', { month: 'short' })}
                      </span>
                      <span className="text-2xl font-black leading-none my-0.5">
                        {new Date(agenda.tanggalAcara).getDate()}
                      </span>
                      <span className="text-[9px] text-purple-200">
                        {new Date(agenda.tanggalAcara).toLocaleDateString('id-ID', { weekday: 'short' })}
                      </span>
                    </div>

                    {/* Content */}
                    <div className="space-y-1.5 min-w-0 flex-1 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                          {surat.nomorAgenda}
                        </span>
                        <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded">
                          Undangan Resmi
                        </span>
                      </div>

                      <h3
                        onClick={() => onSelectSuratForDetail(surat)}
                        className="font-bold text-sm sm:text-base text-slate-900 hover:text-purple-900 cursor-pointer leading-snug"
                      >
                        {agenda.namaAcara}
                      </h3>

                      <div className="text-slate-600 flex flex-wrap items-center gap-y-1 gap-x-4 text-xs">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-purple-700 shrink-0" />
                          {agenda.waktuAcara}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          {agenda.tempatAcara}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 pt-1">
                        Asal Undangan: <strong>{surat.asalSurat}</strong> (No: {surat.nomorSurat})
                      </div>

                      {/* Delegated Pokja and Attendance */}
                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        {assignedPokjas.map((p) => (
                          <span
                            key={p.id}
                            className="text-[10px] font-medium bg-blue-50 text-blue-900 px-2 py-0.5 rounded border border-blue-200"
                          >
                            Pokja: {p.nama}
                          </span>
                        ))}

                        {surat.kehadiranList && surat.kehadiranList.length > 0 ? (
                          <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Dihadiri: {surat.kehadiranList.map((k) => k.namaUser).join(', ')}
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                            Menunggu Konfirmasi Hadir
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center">
                    {onOpenLembarDisposisi && (
                      <button
                        type="button"
                        onClick={() => onOpenLembarDisposisi(surat)}
                        className="p-2 text-amber-700 hover:text-amber-900 hover:bg-amber-50 rounded-xl transition-colors border border-amber-200"
                        title="Cetak Surat Undangan & Lembar Disposisi"
                      >
                        <Printer className="w-4 h-4" />
                      </button>
                    )}
                    <button
                      onClick={() => onOpenPdf(surat)}
                      className="p-2 text-slate-600 hover:text-purple-900 hover:bg-purple-50 rounded-xl transition-colors"
                      title="Buka PDF Undangan"
                    >
                      <FileText className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onSelectSuratForDetail(surat)}
                      className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                    >
                      Detail Acara
                    </button>
                    <button
                      onClick={() => onOpenDisposisiModal(surat)}
                      className="px-4 py-2 text-xs font-bold text-white bg-purple-900 hover:bg-purple-800 rounded-xl shadow-xs transition-colors"
                    >
                      {currentUser.role === 'staf_pokja' ? 'Konfirmasi Hadir' : 'Disposisikan'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* MONTH CALENDAR VIEW */}
      {mode === 'month' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-slate-900">
              September 2026
            </h3>
            <span className="text-xs text-slate-500">
              Total {agendaSurat.length} Kegiatan Terjadwal
            </span>
          </div>

          <div className="grid grid-cols-7 gap-2 text-center text-xs font-semibold text-slate-500 border-b border-slate-100 pb-2">
            <div>Sen</div>
            <div>Sel</div>
            <div>Rab</div>
            <div>Kam</div>
            <div>Jum</div>
            <div className="text-rose-600">Sab</div>
            <div className="text-rose-600">Min</div>
          </div>

          {/* Simple month grid representation */}
          <div className="grid grid-cols-7 gap-2 text-xs min-h-[360px]">
            {Array.from({ length: 30 }).map((_, i) => {
              const day = i + 1;
              const dateStr = `2026-09-${day < 10 ? '0' + day : day}`;
              const events = agendaSurat.filter(
                (s) => s.agenda?.tanggalAcara === dateStr
              );

              return (
                <div
                  key={day}
                  className={`border rounded-xl p-2 flex flex-col justify-between transition-colors min-h-[90px] ${
                    events.length > 0
                      ? 'bg-purple-50/50 border-purple-200'
                      : 'bg-slate-50/30 border-slate-100'
                  }`}
                >
                  <span className="font-bold text-slate-700 text-left">{day}</span>
                  <div className="space-y-1 my-1">
                    {events.map((ev) => (
                      <div
                        key={ev.id}
                        onClick={() => onSelectSuratForDetail(ev)}
                        className="bg-purple-800 text-white rounded p-1 text-[10px] font-medium text-left truncate cursor-pointer hover:bg-purple-900 shadow-2xs"
                        title={ev.agenda?.namaAcara}
                      >
                        {ev.agenda?.waktuAcara} {ev.agenda?.namaAcara}
                      </div>
                    ))}
                  </div>
                  <div className="text-[9px] text-slate-400 text-right">
                    {events.length > 0 ? `${events.length} acara` : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
