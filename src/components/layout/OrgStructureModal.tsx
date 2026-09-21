import React from 'react';
import { useApp } from '../../context/AppContext';
import { X, Users, ChevronDown, CheckCircle2, Shield, ArrowDown } from 'lucide-react';

interface OrgStructureModalProps {
  onClose: () => void;
}

export const OrgStructureModal: React.FC<OrgStructureModalProps> = ({ onClose }) => {
  const { users, pokjas, currentUser, setCurrentUser } = useApp();

  const kadisUser = users.find((u) => u.role === 'kadis');
  const kadis = {
    nama: kadisUser?.nama || 'Boedyo Dharmawan, S.T., MT.',
    jabatan: kadisUser?.jabatan || 'Kepala Dinas Perumahan Rakyat dan Kawasan Permukiman Prov. Jateng',
  };

  const kabid = users.find((u) => u.role === 'kabid');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur-xs p-3 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-950 via-blue-900 to-indigo-950 text-white px-6 py-4 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-800/60 border border-blue-700/50 flex items-center justify-center">
              <Users className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="font-bold text-base sm:text-lg">Struktur Organisasi & Alur Disposisi Digital</h2>
              <p className="text-xs text-blue-200">
                Bidang Pertanahan - Dinas Perumahan Rakyat dan Kawasan Permukiman Provinsi Jawa Tengah
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-blue-300 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Hierarchy Tree Content */}
        <div className="p-6 overflow-y-auto bg-slate-50/70 space-y-6">
          <div className="text-center text-xs text-slate-500 max-w-xl mx-auto">
            Struktur resmi penjenjangan kewenangan disposisi dan penugasan staf. Klik tombol <strong>&ldquo;Beralih Akun&rdquo;</strong> pada profil manapun untuk menguji alur kerja dari perspektif pengguna tersebut.
          </div>

          {/* Level 1: Kepala Dinas */}
          <div className="flex flex-col items-center">
            <div className="bg-white border-2 border-slate-300 rounded-xl p-4 shadow-sm max-w-md w-full text-center relative hover:border-blue-500 transition-colors">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-slate-100 text-slate-700 mb-1.5">
                <Shield className="w-3 h-3 text-slate-600" /> Pimpinan Tertinggi Instansi
              </div>
              <div className="font-bold text-slate-900 text-sm">{kadis.nama}</div>
              <div className="text-xs text-slate-600 mt-0.5">{kadis.jabatan}</div>
              <div className="text-[11px] text-amber-700 bg-amber-50 rounded px-2 py-0.5 mt-2 inline-block border border-amber-200">
                Memberikan Disposisi Awal kepada Kepala Bidang
              </div>
            </div>
            <div className="h-6 w-0.5 bg-blue-300 my-1"></div>
            <ArrowDown className="w-4 h-4 text-blue-600 -mt-2" />
          </div>

          {/* Level 2: Kepala Bidang */}
          {kabid && (
            <div className="flex flex-col items-center">
              <div className={`bg-white border-2 rounded-xl p-4 shadow-sm max-w-md w-full text-center relative transition-all ${
                currentUser.id === kabid.id ? 'border-blue-600 ring-2 ring-blue-100 bg-blue-50/20' : 'border-blue-200 hover:border-blue-400'
              }`}>
                {currentUser.id === kabid.id && (
                  <span className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Akun Aktif
                  </span>
                )}
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-blue-100 text-blue-800 mb-1.5">
                  <Shield className="w-3 h-3 text-blue-700" /> Kepala Bidang Pertanahan
                </div>
                <div className="font-bold text-slate-900 text-sm">{kabid.nama}</div>
                <div className="text-xs text-slate-600">NIP. {kabid.nip}</div>
                <div className="text-[11px] text-blue-700 bg-blue-50 rounded px-2.5 py-1 mt-2 inline-block border border-blue-200">
                  Dapat mendisposisikan ke 1, 2, atau ketiga Ketua Pokja sekaligus
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => {
                      setCurrentUser(kabid);
                      onClose();
                    }}
                    className="text-xs font-medium px-3 py-1 bg-blue-900 hover:bg-blue-800 text-white rounded-lg transition-colors"
                  >
                    Beralih ke Akun Kabid
                  </button>
                </div>
              </div>
              <div className="h-6 w-0.5 bg-blue-300 my-1"></div>
              <ArrowDown className="w-4 h-4 text-blue-600 -mt-2" />
            </div>
          )}

          {/* Level 3: 3 Pokja Columns */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            {pokjas.map((pokja, idx) => {
              const ketua = users.find((u) => u.id === pokja.ketuaId);
              const stafList = users.filter((u) => (u.role === 'staf_pokja' || u.id === 'staf-3' || u.nama.includes('Marsudi')) && u.pokjaId === pokja.id);

              return (
                <div
                  key={pokja.id}
                  className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col"
                >
                  {/* Pokja Header */}
                  <div className="bg-slate-100 border-b border-slate-200 px-4 py-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                      POKJA {idx + 1}
                    </div>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm mt-0.5 leading-snug">
                      {pokja.nama}
                    </h3>
                  </div>

                  {/* Ketua Pokja Card */}
                  <div className="p-4 border-b border-slate-100 bg-indigo-50/30">
                    <div className="text-[10px] font-semibold text-indigo-700 uppercase tracking-wider mb-1">
                      Ketua Pokja
                    </div>
                    {ketua ? (
                      <div>
                        <div className="font-bold text-slate-900 text-xs">{ketua.nama}</div>
                        <div className="text-[11px] text-slate-500">NIP. {ketua.nip}</div>
                        <div className="text-[11px] text-slate-500 font-mono mt-0.5">WA: {ketua.nomorWhatsapp}</div>
                        <button
                          onClick={() => {
                            setCurrentUser(ketua);
                            onClose();
                          }}
                          className={`mt-2 text-[11px] font-medium px-2.5 py-1 rounded transition-colors w-full text-center ${
                            currentUser.id === ketua.id
                              ? 'bg-emerald-600 text-white font-semibold'
                              : 'bg-indigo-100 hover:bg-indigo-200 text-indigo-900'
                          }`}
                        >
                          {currentUser.id === ketua.id ? '✓ Sedang Digunakan' : 'Beralih Akun Ketua'}
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-rose-500">Ketua belum ditentukan</div>
                    )}
                  </div>

                  {/* Staff List */}
                  <div className="p-4 flex-1 bg-white space-y-3">
                    <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                      <span>Daftar Staf Resmi ({stafList.length})</span>
                      <span className="text-[10px] text-slate-400">Penerima Disposisi</span>
                    </div>

                    <div className="space-y-2">
                      {stafList.map((staf, sIdx) => {
                        const isCurrent = currentUser.id === staf.id;
                        return (
                          <div
                            key={staf.id}
                            className={`p-2.5 rounded-lg border text-xs transition-all ${
                              isCurrent
                                ? 'bg-emerald-50 border-emerald-300 ring-1 ring-emerald-200'
                                : staf.status === 'active'
                                ? 'bg-slate-50 border-slate-200 hover:border-slate-300'
                                : 'bg-slate-100/60 border-dashed border-slate-200 opacity-60'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-1">
                              <div className="font-semibold text-slate-900">
                                {sIdx + 1}. {staf.nama}
                              </div>
                              {staf.status === 'active' ? (
                                <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0 mt-1" title="Aktif" />
                              ) : (
                                <span className="text-[10px] text-rose-600 font-medium">Nonaktif</span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 mt-0.5">{staf.jabatan}</div>
                            <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                              NIP: {staf.nip}
                            </div>

                            <button
                              onClick={() => {
                                setCurrentUser(staf);
                                onClose();
                              }}
                              className={`mt-2 text-[10px] font-medium px-2 py-0.5 rounded w-full transition-colors ${
                                isCurrent
                                  ? 'bg-emerald-600 text-white font-bold'
                                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {isCurrent ? '✓ Akun Aktif Anda' : 'Beralih Akun Staf'}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Pokja Note */}
                  <div className="bg-slate-50 px-4 py-2 border-t border-slate-200 text-[10px] text-slate-500 italic">
                    Ketua Pokja hanya dapat memilih staf dalam Pokja ini.
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-200 flex items-center justify-between text-xs">
          <div className="text-slate-500">
            Bidang Pertanahan • Dinas Perumahan Rakyat dan Kawasan Permukiman Provinsi Jawa Tengah
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
