import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Calendar,
  Archive,
  Send,
  Users,
  ArrowRight,
  TrendingUp,
  Inbox,
  AlertCircle,
  FileSpreadsheet,
  Printer,
} from 'lucide-react';
import { formatDateIndo, calculateSlaStatus, getStatusBadgeColor } from '../../utils/helpers';
import { Surat } from '../../types';

interface DashboardViewProps {
  onNavigateToSurat: () => void;
  onNavigateToAgenda: () => void;
  onNavigateToInput: () => void;
  onSelectSuratForDetail: (surat: Surat) => void;
  onOpenDisposisiModal: (surat: Surat) => void;
  onOpenLembarDisposisi?: (surat: Surat) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToSurat,
  onNavigateToAgenda,
  onNavigateToInput,
  onSelectSuratForDetail,
  onOpenDisposisiModal,
  onOpenLembarDisposisi,
}) => {
  const {
    currentUser,
    suratList,
    disposisiList,
    tindakLanjutList,
    pokjas,
    getStafByPokja,
    getSuratVisibleForUser,
  } = useApp();

  const visibleSurat = getSuratVisibleForUser(currentUser);
  const currentPokja = pokjas.find((p) => p.id === currentUser.pokjaId);

  // Stats calculation
  const totalSurat = suratList.length;
  const suratBaru = suratList.filter((s) => s.status === 'Surat Baru').length;
  const menungguKabid = suratList.filter((s) => s.status === 'Menunggu Disposisi Kabid').length;
  const prosesPokja = suratList.filter((s) => s.status === 'Menunggu Disposisi Ketua Pokja').length;
  const sedangDikerjakan = suratList.filter((s) => s.status === 'Sedang Dikerjakan' || s.status === 'Sudah Didisposisikan ke Staf').length;
  const selesaiCount = suratList.filter((s) => s.status === 'Selesai').length;
  const arsipCount = suratList.filter((s) => s.status === 'Diarsipkan').length;
  const totalUndangan = suratList.filter((s) => s.kategori === 'Undangan').length;

  // Staf personal stats
  const stafDisposisi = disposisiList.filter((d) => d.kepadaUserId === currentUser.id);
  const stafBaru = stafDisposisi.filter((d) => d.status === 'Terkirim').length;
  const stafDikerjakan = visibleSurat.filter((s) => s.status === 'Sedang Dikerjakan').length;
  const stafSelesai = tindakLanjutList.filter(
    (tl) => tl.userId === currentUser.id && (tl.progresStatus === 'Selesai' || tl.jenisTindakLanjut === 'Arsipkan')
  ).length;
  const stafUndangan = visibleSurat.filter((s) => s.kategori === 'Undangan').length;

  // Upcoming agenda (sorted)
  const upcomingAgendas = suratList
    .filter((s) => s.agenda)
    .sort((a, b) => (a.agenda!.tanggalAcara > b.agenda!.tanggalAcara ? 1 : -1))
    .slice(0, 3);

  return (
    <div className="space-y-6 pb-12">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white rounded-2xl p-5 sm:p-7 shadow-md border border-blue-900">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 mb-2">
              Bidang Pertanahan • DISPERAKIM Jateng
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              Selamat Datang, {currentUser.nama}
            </h2>
            <p className="text-xs sm:text-sm text-blue-200 mt-1 max-w-2xl leading-relaxed">
              {currentUser.jabatan}
              {currentPokja && ` — ${currentPokja.nama}`}
            </p>
          </div>

          {(currentUser.role === 'admin_pertanahan' || currentUser.role === 'super_admin') && (
            <div className="shrink-0">
              <button
                onClick={onNavigateToInput}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-blue-950 font-bold rounded-xl shadow-md transition-all text-xs sm:text-sm"
              >
                <FileText className="w-4 h-4" />
                Input Surat Masuk Baru
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- DASHBOARD VIEW: STAF POKJA --- */}
      {currentUser.role === 'staf_pokja' && (
        <>
          {/* Staf Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-blue-100 shadow-xs">
              <div className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">
                Disposisi Baru
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {stafBaru}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-blue-500" /> Perlu dibuka
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-cyan-100 shadow-xs">
              <div className="text-[11px] font-semibold text-cyan-700 uppercase tracking-wider">
                Sedang Dikerjakan
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {stafDikerjakan}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-cyan-600" /> Dalam progres
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-xs">
              <div className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">
                Selesai / Arsip
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {stafSelesai}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tuntas
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-purple-100 shadow-xs">
              <div className="text-[11px] font-semibold text-purple-700 uppercase tracking-wider">
                Undangan Tugas
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {stafUndangan}
              </div>
              <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-purple-600" /> Hadir rapat/acara
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-xs col-span-2 sm:col-span-1">
              <div className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">
                Total Surat Ditugaskan
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {visibleSurat.length}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Khusus akun Anda</div>
            </div>
          </div>

          {/* Staf Task List */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900">
                  Daftar Surat & Tugas Disposisi Anda
                </h3>
                <p className="text-xs text-slate-500">
                  Hanya menampilkan disposisi sah yang ditujukan kepada Anda
                </p>
              </div>
              <button
                onClick={onNavigateToSurat}
                className="text-xs font-semibold text-blue-900 hover:text-blue-700 inline-flex items-center gap-1"
              >
                Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {visibleSurat.length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  Belum ada surat atau tugas disposisi yang ditujukan kepada Anda.
                </div>
              ) : (
                visibleSurat.map((surat) => {
                  const disp = stafDisposisi.find((d) => d.suratId === surat.id);
                  const sla = calculateSlaStatus(disp?.batasWaktu);

                  return (
                    <div
                      key={surat.id}
                      className="p-4 sm:p-5 hover:bg-slate-50/80 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1.5 min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-[11px] bg-slate-100 text-slate-700 px-2 py-0.5 rounded font-medium">
                            {surat.nomorAgenda}
                          </span>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadgeColor(
                              surat.status
                            )}`}
                          >
                            {surat.status}
                          </span>
                          {surat.kategori === 'Undangan' && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800">
                              Undangan
                            </span>
                          )}
                          {disp?.prioritas && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                disp.prioritas === 'Mendesak'
                                  ? 'bg-rose-100 text-rose-800'
                                  : disp.prioritas === 'Tinggi'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              Prioritas: {disp.prioritas}
                            </span>
                          )}
                        </div>

                        <h4
                          onClick={() => onSelectSuratForDetail(surat)}
                          className="font-bold text-sm text-slate-900 hover:text-blue-900 cursor-pointer leading-snug"
                        >
                          {surat.perihal}
                        </h4>

                        <div className="text-xs text-slate-500 flex flex-wrap items-center gap-y-1 gap-x-4">
                          <span>Nomor: <strong>{surat.nomorSurat}</strong></span>
                          <span>Asal: <strong>{surat.asalSurat}</strong></span>
                          {disp?.batasWaktu && (
                            <span className={`px-2 py-0.5 rounded border text-[10px] font-semibold ${sla.badgeClass}`}>
                              Batas: {formatDateIndo(disp.batasWaktu)} ({sla.label})
                            </span>
                          )}
                        </div>

                        {disp?.narasi && (
                          <div className="text-xs bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 text-slate-700 mt-2">
                            <span className="font-semibold text-slate-800">Instruksi Ketua Pokja:</span> &ldquo;{disp.narasi}&rdquo;
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {onOpenLembarDisposisi && (
                          <button
                            type="button"
                            onClick={() => onOpenLembarDisposisi(surat)}
                            className="px-3 py-2 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded-xl transition-colors inline-flex items-center gap-1.5"
                            title="Cetak Surat sekaligus Lembar Disposisi Resmi"
                          >
                            <Printer className="w-3.5 h-3.5 text-amber-700" />
                            <span>Cetak Surat & Disposisi</span>
                          </button>
                        )}
                        <button
                          onClick={() => onSelectSuratForDetail(surat)}
                          className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl transition-colors"
                        >
                          Detail & Dokumen
                        </button>
                        <button
                          onClick={() => onOpenDisposisiModal(surat)}
                          className="px-4 py-2 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl shadow-xs transition-colors"
                        >
                          Tindak Lanjuti
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}

      {/* --- DASHBOARD VIEW: KETUA POKJA --- */}
      {currentUser.role === 'ketua_pokja' && currentPokja && (
        <>
          {/* Ketua Pokja Metric Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
              <div className="text-[10px] font-bold text-blue-800 uppercase tracking-wider">
                Disposisi Masuk
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {visibleSurat.length}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Total surat masuk Pokja</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-amber-200 shadow-xs">
              <div className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">
                Belum ke Staf
              </div>
              <div className="text-2xl sm:text-3xl font-black text-amber-600 mt-1">
                {visibleSurat.filter((s) => s.status === 'Menunggu Disposisi Ketua Pokja').length}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Perlu didisposisikan</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-sky-200 shadow-xs">
              <div className="text-[10px] font-bold text-sky-800 uppercase tracking-wider">
                Sudah ke Staf
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {visibleSurat.filter((s) => s.status === 'Sudah Didisposisikan ke Staf').length}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Menunggu respon</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-cyan-200 shadow-xs">
              <div className="text-[10px] font-bold text-cyan-800 uppercase tracking-wider">
                Sedang Dikerjakan
              </div>
              <div className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {visibleSurat.filter((s) => s.status === 'Sedang Dikerjakan').length}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Progres pengerjaan</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-emerald-200 shadow-xs">
              <div className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">
                Selesai / Hadir
              </div>
              <div className="text-2xl sm:text-3xl font-black text-emerald-700 mt-1">
                {visibleSurat.filter((s) => s.status === 'Selesai' || s.status === 'Hadir').length}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Tuntas dikerjakan</div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-rose-200 shadow-xs">
              <div className="text-[10px] font-bold text-rose-800 uppercase tracking-wider">
                Mendesak / SLA
              </div>
              <div className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">
                {disposisiList.filter((d) => d.pokjaId === currentPokja.id && d.prioritas === 'Mendesak').length}
              </div>
              <div className="text-[10px] text-slate-500 mt-1">Prioritas tinggi</div>
            </div>
          </div>

          {/* Section AF: Tabel Monitoring Kinerja Staf Pokja */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50/50">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-slate-900 flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-900" />
                  Monitoring Status Penugasan Staf — {currentPokja.nama}
                </h3>
                <p className="text-xs text-slate-500">
                  Memantau beban kerja dan status pengerjaan seluruh staf di bawah Pokja Anda
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-blue-100 text-blue-900 rounded-lg self-start sm:self-auto">
                {getStafByPokja(currentPokja.id).length} Staf Terdaftar
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Nama Staf</th>
                    <th className="py-3 px-4">NIP & Jabatan</th>
                    <th className="py-3 px-4 text-center">Baru</th>
                    <th className="py-3 px-4 text-center">Dikerjakan</th>
                    <th className="py-3 px-4 text-center">Selesai</th>
                    <th className="py-3 px-4 text-center">Terlambat</th>
                    <th className="py-3 px-4 text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {getStafByPokja(currentPokja.id, false).map((staf) => {
                    const stafDisp = disposisiList.filter((d) => d.kepadaUserId === staf.id);
                    const baruCount = stafDisp.filter((d) => d.status === 'Terkirim').length;
                    const dikerjakanCount = stafDisp.filter(
                      (d) => d.status === 'Ditindaklanjuti' || d.status === 'Dibaca'
                    ).length;
                    const selesaiCountStaf = stafDisp.filter((d) => d.status === 'Selesai').length;

                    // Overdue count
                    const overdueCount = stafDisp.filter((d) => {
                      if (!d.batasWaktu || d.status === 'Selesai') return false;
                      const sla = calculateSlaStatus(d.batasWaktu);
                      return sla.status === 'expired';
                    }).length;

                    return (
                      <tr key={staf.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          {staf.nama}
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          <div>NIP. {staf.nip}</div>
                          <div className="text-[11px] text-slate-400">{staf.jabatan}</div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                            {baruCount}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800">
                            {dikerjakanCount}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                            {selesaiCountStaf}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span
                            className={`font-bold px-2 py-0.5 rounded ${
                              overdueCount > 0 ? 'bg-rose-100 text-rose-800 font-black' : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {overdueCount}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
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
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* --- DASHBOARD VIEW: KABID & ADMIN --- */}
      {(currentUser.role === 'kabid' || currentUser.role === 'admin_pertanahan' || currentUser.role === 'super_admin') && (
        <>
          {/* Main Executive Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-500 uppercase">Total Surat</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalSurat}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">Semua kategori</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-amber-200 shadow-xs">
              <div className="text-[10px] font-bold text-amber-800 uppercase">Menunggu Kabid</div>
              <div className="text-2xl font-black text-amber-600 mt-1">{menungguKabid}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">Perlu disposisi</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-indigo-200 shadow-xs">
              <div className="text-[10px] font-bold text-indigo-800 uppercase">Di Pokja</div>
              <div className="text-2xl font-black text-indigo-700 mt-1">{prosesPokja}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">Proses 3 Pokja</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-cyan-200 shadow-xs">
              <div className="text-[10px] font-bold text-cyan-800 uppercase">Dikerjakan</div>
              <div className="text-2xl font-black text-cyan-700 mt-1">{sedangDikerjakan}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">Tindak lanjut staf</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-emerald-200 shadow-xs">
              <div className="text-[10px] font-bold text-emerald-800 uppercase">Selesai</div>
              <div className="text-2xl font-black text-emerald-700 mt-1">{selesaiCount}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">Tuntas tervalidasi</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-purple-200 shadow-xs">
              <div className="text-[10px] font-bold text-purple-800 uppercase">Undangan</div>
              <div className="text-2xl font-black text-purple-700 mt-1">{totalUndangan}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">Agenda rakor/acara</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
              <div className="text-[10px] font-bold text-slate-600 uppercase">Arsip Digital</div>
              <div className="text-2xl font-black text-slate-800 mt-1">{arsipCount}</div>
              <div className="text-[9px] text-slate-400 mt-0.5">Tersimpan rapi</div>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-rose-200 shadow-xs">
              <div className="text-[10px] font-bold text-rose-800 uppercase">Mendesak</div>
              <div className="text-2xl font-black text-rose-600 mt-1">
                {disposisiList.filter((d) => d.prioritas === 'Mendesak').length}
              </div>
              <div className="text-[9px] text-slate-400 mt-0.5">Perlu atensi khusus</div>
            </div>
          </div>

          {/* Pokja Breakdown Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {pokjas.map((pokja) => {
              const ketua = pokjas.find((p) => p.id === pokja.id)
                ? getStafByPokja(pokja.id, false)
                : [];
              const suratPokjaCount = suratList.filter((s) => s.assignedPokjaIds.includes(pokja.id)).length;

              return (
                <div key={pokja.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
                  <div className="text-[11px] font-bold text-blue-900 uppercase tracking-wide">
                    {pokja.nama}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 line-clamp-1">{pokja.deskripsi}</div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Surat Didisposisikan</span>
                      <span className="font-bold text-slate-800 text-base">{suratPokjaCount}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Staf Aktif</span>
                      <span className="font-bold text-slate-800 text-base">{ketua.filter((s) => s.status === 'active').length}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Upcoming Agenda Banner & Quick Letters */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2 cols): Surat Terbaru Menunggu Tindak Lanjut */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-slate-900">
                Surat Masuk & Disposisi Terbaru
              </h3>
              <p className="text-xs text-slate-500">
                Aktivitas alur persuratan Bidang Pertanahan
              </p>
            </div>
            <button
              onClick={onNavigateToSurat}
              className="text-xs font-semibold text-blue-900 hover:text-blue-700 inline-flex items-center gap-1"
            >
              Lihat Persuratan <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {suratList.slice(0, 4).map((surat) => (
              <div
                key={surat.id}
                className="p-4 hover:bg-slate-50/70 transition-colors flex items-start justify-between gap-4"
              >
                <div className="space-y-1 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">
                      {surat.nomorAgenda}
                    </span>
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getStatusBadgeColor(
                        surat.status
                      )}`}
                    >
                      {surat.status}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {formatDateIndo(surat.tanggalSurat)}
                    </span>
                  </div>

                  <h4
                    onClick={() => onSelectSuratForDetail(surat)}
                    className="font-bold text-xs sm:text-sm text-slate-900 hover:text-blue-900 cursor-pointer line-clamp-1"
                  >
                    {surat.perihal}
                  </h4>

                  <div className="text-[11px] text-slate-500 truncate">
                    Asal: <strong>{surat.asalSurat}</strong> • No: {surat.nomorSurat}
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => onSelectSuratForDetail(surat)}
                    className="px-3 py-1 text-xs font-medium text-blue-900 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    Buka
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right (1 col): Agenda Undangan Terdekat */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-purple-50/30">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-700" />
              <h3 className="font-bold text-sm text-slate-900">Agenda Undangan Terdekat</h3>
            </div>
            <button
              onClick={onNavigateToAgenda}
              className="text-[11px] font-semibold text-purple-700 hover:text-purple-900"
            >
              Buka Kalender
            </button>
          </div>

          <div className="p-4 space-y-3 flex-1">
            {upcomingAgendas.length === 0 ? (
              <div className="text-center text-xs text-slate-400 py-8">
                Tidak ada agenda undangan terdekat
              </div>
            ) : (
              upcomingAgendas.map((surat) => (
                <div
                  key={surat.id}
                  onClick={() => onSelectSuratForDetail(surat)}
                  className="p-3 rounded-xl border border-purple-100 bg-purple-50/30 hover:bg-purple-50/80 cursor-pointer transition-colors space-y-1 text-xs"
                >
                  <div className="flex items-center justify-between text-[10px] font-semibold text-purple-900">
                    <span>{formatDateIndo(surat.agenda!.tanggalAcara)}</span>
                    <span className="font-mono bg-white px-1.5 py-0.5 rounded border border-purple-200">
                      {surat.agenda!.waktuAcara}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 line-clamp-1">
                    {surat.agenda!.namaAcara}
                  </div>
                  <div className="text-[11px] text-slate-500 line-clamp-1">
                    📍 {surat.agenda!.tempatAcara}
                  </div>
                  {surat.kehadiranList && surat.kehadiranList.length > 0 && (
                    <div className="text-[10px] text-emerald-700 font-medium pt-1">
                      ✓ Dihadiri oleh: {surat.kehadiranList.map((k) => k.namaUser).join(', ')}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
