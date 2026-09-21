import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Activity, ShieldCheck, Search, Filter, Clock, User } from 'lucide-react';

export const AuditTrailView: React.FC = () => {
  const { logs } = useApp();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredLogs = logs.filter((log) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nama = (log.namaUser || log.userNama || '').toLowerCase();
    const act = (log.aktivitas || log.aksi || '').toLowerCase();
    const desc = (log.keterangan || log.deskripsi || '').toLowerCase();
    const role = (log.jabatanUser || log.userRole || '').toLowerCase();
    return nama.includes(q) || act.includes(q) || desc.includes(q) || role.includes(q);
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-5 h-5 text-blue-900" />
            Audit Trail & Log Aktivitas Sistem
          </h2>
          <p className="text-xs text-slate-500">
            Rekam jejak mutlak seluruh aksi persuratan, disposisi berjenjang, dan perubahan sistem
          </p>
        </div>

        <div className="text-xs font-semibold px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl flex items-center gap-1.5 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Log Terproteksi & Akurat</span>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-xs">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari aktivitas berdasarkan nama pengguna, aksi, nomor surat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="font-bold text-xs sm:text-sm text-slate-900">
            Riwayat Aktivitas ({filteredLogs.length})
          </h3>
          <span className="text-[11px] text-slate-400">Urutan: Terkini ke Terlama</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4 w-44">Waktu (Timestamp)</th>
                <th className="py-3 px-4 w-48">Pengguna & Peran</th>
                <th className="py-3 px-4 w-40">Aktivitas (Aksi)</th>
                <th className="py-3 px-4">Deskripsi Rincian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4 text-slate-500 font-mono text-[11px] whitespace-nowrap">
                    {log.createdAt}
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-900">{log.namaUser || log.userNama || 'Pengguna Sistem'}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">
                      {log.jabatanUser || (log.userRole ? log.userRole.replace('_', ' ') : 'Staf')}
                    </div>
                  </td>

                  <td className="py-3 px-4">
                    <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-blue-900 text-[10px] font-bold border border-blue-100">
                      {log.aktivitas || log.aksi || 'Aktivitas'}
                    </span>
                  </td>

                  <td className="py-3 px-4 text-slate-700 leading-relaxed">
                    {log.keterangan || log.deskripsi || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
