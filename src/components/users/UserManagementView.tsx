import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { User, UserRole, Pokja } from '../../types';
import {
  Users,
  Shield,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserPlus,
  Edit2,
  Lock,
  Phone,
  Mail,
  Building,
  UserCheck,
  Award,
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const {
    users,
    pokjas,
    updateStafPokja,
    toggleUserStatus,
    currentUser,
    addUser,
    updateUser,
    updatePokja,
  } = useApp();

  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Auto-dismiss notification after 4.5 seconds
  useEffect(() => {
    if (!notification) return;
    const timer = setTimeout(() => {
      setNotification(null);
    }, 4500);
    return () => clearTimeout(timer);
  }, [notification]);

  const [selectedUserForTransfer, setSelectedUserForTransfer] = useState<User | null>(null);
  const [targetPokjaId, setTargetPokjaId] = useState<string>('');
  const [catatanMutasi, setCatatanMutasi] = useState<string>('');

  // Add new staff modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newNama, setNewNama] = useState('');
  const [newNip, setNewNip] = useState('');
  const [newJabatan, setNewJabatan] = useState('Analis Pengadaan Tanah & Pertanahan');
  const [newWhatsapp, setNewWhatsapp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPokjaId, setNewPokjaId] = useState('pokja-1');

  // Edit Pejabat / User Modal state (Req 1)
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState<{
    nama: string;
    nip: string;
    jabatan: string;
    nomorWhatsapp: string;
    email: string;
    password: string;
    role: UserRole;
    pokjaId: string;
    status: 'active' | 'inactive';
  }>({
    nama: '',
    nip: '',
    jabatan: '',
    nomorWhatsapp: '',
    email: '',
    password: '',
    role: 'staf_pokja',
    pokjaId: '',
    status: 'active',
  });

  // Edit Pokja Modal state
  const [editingPokja, setEditingPokja] = useState<Pokja | null>(null);
  const [editPokjaForm, setEditPokjaForm] = useState<{
    nama: string;
    kode: string;
    deskripsi: string;
    ketuaId: string;
  }>({
    nama: '',
    kode: '',
    deskripsi: '',
    ketuaId: '',
  });

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      nama: user.nama || '',
      nip: user.nip || '',
      jabatan: user.jabatan || '',
      nomorWhatsapp: user.nomorWhatsapp || '',
      email: user.email || '',
      password: user.password || user.nip.replace(/\s+/g, ''),
      role: user.role || 'staf_pokja',
      pokjaId: user.pokjaId || '',
      status: user.status || 'active',
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    if (!editForm.nama.trim()) {
      setNotification({ type: 'error', message: 'Nama pejabat/staf tidak boleh kosong.' });
      return;
    }

    updateUser(editingUser.id, {
      nama: editForm.nama.trim(),
      nip: editForm.nip.trim(),
      jabatan: editForm.jabatan.trim(),
      nomorWhatsapp: editForm.nomorWhatsapp.trim(),
      email: editForm.email.trim(),
      password: editForm.password.trim() || editForm.nip.replace(/\s+/g, ''),
      role: editForm.role,
      pokjaId: editForm.pokjaId || undefined,
      status: editForm.status,
    });

    setNotification({
      type: 'success',
      message: `Profil & data akun "${editForm.nama}" (NIP: ${editForm.nip || '-'}) berhasil disimpan dan disinkronkan ke Cloud Firestore secara real-time!`,
    });
    setEditingUser(null);
  };

  const handleOpenEditPokja = (pokja: Pokja) => {
    setEditingPokja(pokja);
    setEditPokjaForm({
      nama: pokja.nama || '',
      kode: pokja.kode || '',
      deskripsi: pokja.deskripsi || '',
      ketuaId: pokja.ketuaId || '',
    });
  };

  const handleSaveEditPokja = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPokja) return;

    if (!editPokjaForm.nama.trim() || !editPokjaForm.kode.trim()) {
      setNotification({ type: 'error', message: 'Nama Pokja dan Kode Pokja tidak boleh kosong.' });
      return;
    }

    updatePokja(editingPokja.id, {
      nama: editPokjaForm.nama.trim(),
      kode: editPokjaForm.kode.trim(),
      deskripsi: editPokjaForm.deskripsi.trim(),
      ketuaId: editPokjaForm.ketuaId,
    });

    setNotification({
      type: 'success',
      message: `Data Kelompok Kerja "${editPokjaForm.nama}" (${editPokjaForm.kode}) berhasil disimpan dan disinkronkan secara real-time!`,
    });
    setEditingPokja(null);
  };

  const handleOpenTransfer = (user: User) => {
    setSelectedUserForTransfer(user);
    const other = pokjas.find((p) => p.id !== user.pokjaId);
    setTargetPokjaId(other?.id || pokjas[0].id);
    setCatatanMutasi('Penyesuaian formasi penugasan teknis Bidang Pertanahan');
  };

  const handleConfirmTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForTransfer || !targetPokjaId) return;

    updateStafPokja(selectedUserForTransfer.id, targetPokjaId, catatanMutasi);
    setNotification({
      type: 'success',
      message: `Staf ${selectedUserForTransfer.nama} berhasil dipindahkan ke Pokja baru dan tersimpan ke Firestore! Log mutasi resmi telah dicatat ke audit trail.`,
    });
    setSelectedUserForTransfer(null);
  };

  const handleAddNewStaf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNama.trim() || !newNip.trim()) {
      setNotification({ type: 'error', message: 'Nama staf dan NIP wajib diisi!' });
      return;
    }

    addUser({
      nama: newNama.trim(),
      nip: newNip.trim(),
      role: 'staf_pokja',
      pokjaId: newPokjaId,
      jabatan: newJabatan.trim() || 'Staf Pelaksana Bidang Pertanahan',
      nomorWhatsapp: newWhatsapp.trim() || '081234567890',
      email: `${newNama.toLowerCase().replace(/[^a-z0-9]/g, '.')}@jatengprov.go.id`,
      password: newPassword.trim() || newNip.replace(/\s+/g, ''),
      status: 'active',
    });

    const targetPokja = pokjas.find((p) => p.id === newPokjaId);
    setNotification({
      type: 'success',
      message: `Staf baru ${newNama} berhasil ditambahkan ke ${targetPokja?.nama || 'Pokja'} dan tersimpan secara real-time!`,
    });
    setIsAddModalOpen(false);
    setNewNama('');
    setNewNip('');
    setNewPassword('');
    setNewJabatan('Analis Pengadaan Tanah & Pertanahan');
    setNewWhatsapp('');
  };

  // Find key structural officials
  const kadisUser = users.find((u) => u.role === 'kadis') || users.find((u) => u.id === 'user-kadis');
  const kabidUser = users.find((u) => u.role === 'kabid');
  const ketuaPokjaUsers = pokjas.map((pokja) => ({
    pokja,
    ketua: users.find((u) => u.id === pokja.ketuaId),
  }));

  const isSuperAdminOrAdmin =
    currentUser.role === 'super_admin' || currentUser.role === 'admin_pertanahan';

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-900" />
            Manajemen Pejabat, Staf & 3 Pokja
          </h2>
          <p className="text-xs text-slate-500">
            Kewenangan Super Admin & Admin • Edit nama pejabat (Kadis, Kabid, Ketua Pokja), profil nomor WhatsApp, data Pokja, dan mutasi staf
          </p>
        </div>

        {isSuperAdminOrAdmin && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs transition-colors self-start sm:self-auto"
          >
            <UserPlus className="w-4 h-4 text-amber-300" />
            <span>+ Tambah Staf Baru</span>
          </button>
        )}
      </div>

      {/* Real-time Notification Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-xl border flex items-center justify-between text-xs font-semibold animate-in fade-in slide-in-from-top-2 duration-200 shadow-xs ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-slate-400 hover:text-slate-700 ml-3"
            title="Tutup pemberitahuan"
          >
            ✕
          </button>
        </div>
      )}

      {/* SECTION 1: PEJABAT STRUKTURAL UTAMA (Req 1) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Award className="w-4 h-4 text-amber-500" />
              Pejabat Struktural Utama Bidang Pertanahan & Dinas
            </h3>
            <p className="text-xs text-slate-500">
              Super Admin dapat menyesuaikan pergantian nama Kepala Dinas, Kepala Bidang, serta nomor WhatsApp untuk notifikasi otomatis.
            </p>
          </div>
          <span className="text-[11px] font-bold text-blue-950 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
            Penyesuaian Resmi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* KEPALA DINAS */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-200 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-blue-900 text-white px-2 py-0.5 rounded">
                  Kepala Dinas
                </span>
                <h4 className="font-bold text-sm text-slate-900 mt-1">
                  {kadisUser?.nama || 'Belum Ditetapkan'}
                </h4>
                <div className="text-xs text-slate-600 font-medium">
                  {kadisUser?.jabatan || 'Kepala Dinas Perumahan Rakyat dan Kawasan Permukiman'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  NIP. {kadisUser?.nip || '-'}
                </div>
                <div className="text-xs text-blue-900 flex items-center gap-1 mt-1 font-medium">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp: {kadisUser?.nomorWhatsapp || 'Belum diisi'}</span>
                </div>
              </div>

              {isSuperAdminOrAdmin && kadisUser && (
                <button
                  onClick={() => handleOpenEdit(kadisUser)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0"
                >
                  <Edit2 className="w-3 h-3 text-amber-300" />
                  <span>Edit Pejabat</span>
                </button>
              )}
            </div>
          </div>

          {/* KEPALA BIDANG PERTANAHAN */}
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/40 border border-amber-200 rounded-xl p-4 flex flex-col justify-between">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider bg-amber-600 text-white px-2 py-0.5 rounded">
                  Kepala Bidang Pertanahan
                </span>
                <h4 className="font-bold text-sm text-slate-900 mt-1">
                  {kabidUser?.nama || 'Belum Ditetapkan'}
                </h4>
                <div className="text-xs text-slate-600 font-medium">
                  {kabidUser?.jabatan || 'Kepala Bidang Pertanahan Disperakim Prov. Jateng'}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  NIP. {kabidUser?.nip || '-'}
                </div>
                <div className="text-xs text-amber-950 flex items-center gap-1 mt-1 font-medium">
                  <Phone className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp: {kabidUser?.nomorWhatsapp || 'Belum diisi'}</span>
                </div>
              </div>

              {isSuperAdminOrAdmin && kabidUser && (
                <button
                  onClick={() => handleOpenEdit(kabidUser)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold shadow-2xs transition-colors shrink-0"
                >
                  <Edit2 className="w-3 h-3 text-white" />
                  <span>Edit Pejabat</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3 Pokja Overview Cards with Ketua Pokja & Pokja Edit actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ketuaPokjaUsers.map(({ pokja, ketua }, idx) => {
          const stafInPokja = users.filter(
            (u) =>
              u.pokjaId === pokja.id &&
              (u.role === 'staf_pokja' || u.id === 'staf-3' || u.nama.includes('Marsudi'))
          );

          return (
            <div
              key={pokja.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-3 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      POKJA {idx + 1}
                    </span>
                    <span className="text-[10px] font-mono font-bold bg-blue-50 text-blue-900 px-1.5 py-0.5 rounded border border-blue-200">
                      {pokja.kode}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-blue-900 bg-blue-50 px-2 py-0.5 rounded">
                      {stafInPokja.length} Staf
                    </span>
                    {isSuperAdminOrAdmin && (
                      <button
                        type="button"
                        onClick={() => handleOpenEditPokja(pokja)}
                        className="p-1 text-slate-400 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Edit Data & Tupoksi Pokja"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="font-bold text-sm text-slate-900 leading-snug">
                    {pokja.nama}
                  </h3>
                  {pokja.deskripsi && (
                    <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {pokja.deskripsi}
                    </p>
                  )}
                </div>

                {/* Ketua Pokja Card */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs relative">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] text-slate-500 font-bold uppercase block">
                        Ketua Pokja:
                      </span>
                      <div className="font-bold text-slate-900 mt-0.5">{ketua?.nama || 'Belum ada ketua'}</div>
                      <div className="text-[11px] text-slate-500">NIP. {ketua?.nip || '-'}</div>
                      <div className="text-[11px] text-emerald-700 font-mono mt-0.5 flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{ketua?.nomorWhatsapp || '-'}</span>
                      </div>
                    </div>

                    {isSuperAdminOrAdmin && ketua && (
                      <button
                        onClick={() => handleOpenEdit(ketua)}
                        className="p-1.5 bg-white hover:bg-blue-50 text-blue-900 border border-slate-200 rounded-lg text-xs transition-colors shrink-0 shadow-2xs"
                        title="Edit Profil & Nomor WA Ketua Pokja"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
                  <span className="text-[11px] font-semibold text-slate-600 block">
                    Anggota Staf Terdaftar:
                  </span>
                  {stafInPokja.map((s, sIdx) => (
                    <div
                      key={s.id}
                      className="flex items-center justify-between py-1 text-[11px] text-slate-700"
                    >
                      <span className="truncate max-w-[150px]">
                        {sIdx + 1}. {s.nama}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                            s.status === 'active'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {s.status === 'active' ? 'Aktif' : 'Nonaktif'}
                        </span>
                        {isSuperAdminOrAdmin && (
                          <button
                            onClick={() => handleOpenEdit(s)}
                            className="p-1 text-slate-400 hover:text-blue-900"
                            title="Edit Profil Staf"
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {isSuperAdminOrAdmin && (
                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Pengaturan Pokja:</span>
                  <button
                    type="button"
                    onClick={() => handleOpenEditPokja(pokja)}
                    className="inline-flex items-center gap-1 font-bold text-blue-900 hover:text-blue-700"
                  >
                    <Edit2 className="w-3 h-3" />
                    <span>Edit Data Pokja</span>
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Full Users Table with Edit & Transfer Actions */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-sm sm:text-base text-slate-900">
              Daftar Seluruh Pengguna & Pejabat Sistem ({users.length})
            </h3>
            <p className="text-xs text-slate-500">
              Kelola profil, penyesuaian nama pejabat, nomor WhatsApp, peran, dan mutasi Pokja
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Nama Lengkap & NIP</th>
                <th className="py-3 px-4">Kontak WhatsApp & Email</th>
                <th className="py-3 px-4">Jabatan Kedinasan</th>
                <th className="py-3 px-4">Role & Pokja</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Aksi Super Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map((user) => {
                const uPokja = pokjas.find((p) => p.id === user.pokjaId);

                return (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{user.nama}</div>
                      <div className="text-[11px] text-slate-500 font-mono">NIP. {user.nip}</div>
                      <div className="text-[10px] text-slate-600 bg-slate-100 border border-slate-200 rounded px-1.5 py-0.5 inline-flex items-center gap-1 mt-1 font-mono">
                        <Lock className="w-2.5 h-2.5 text-slate-500" />
                        <span>Sandi: {user.password ? '••••••••' : 'Sesuai NIP'}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-600">
                      <div className="font-mono text-emerald-700 font-semibold flex items-center gap-1">
                        <Phone className="w-3 h-3" />
                        <span>{user.nomorWhatsapp || '-'}</span>
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-[180px]">
                        {user.email}
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800 max-w-xs">{user.jabatan}</div>
                    </td>

                    <td className="py-3 px-4">
                      {user.id === 'staf-3' || user.nama.includes('Marsudi') ? (
                        <div className="flex flex-col gap-1 items-start">
                          <span className="text-[10px] bg-purple-100 text-purple-800 border border-purple-300 px-2 py-0.5 rounded font-bold uppercase">
                            SUPER ADMIN
                          </span>
                          <span className="text-[10px] bg-emerald-100 text-emerald-800 border border-emerald-300 px-2 py-0.5 rounded font-bold uppercase">
                            STAF POKJA 1
                          </span>
                        </div>
                      ) : (
                        <div className="inline-block">
                          <span className="text-[10px] bg-blue-50 text-blue-900 border border-blue-200 px-2 py-0.5 rounded font-bold uppercase">
                            {(user.role || '').replace('_', ' ')}
                          </span>
                        </div>
                      )}
                      <div className="text-[11px] text-slate-500 mt-1">
                        {uPokja ? uPokja.nama : 'Struktural Utama'}
                      </div>
                    </td>

                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => {
                          toggleUserStatus(user.id);
                          setNotification({
                            type: 'success',
                            message: `Status akun ${user.nama} berhasil diubah menjadi ${user.status === 'active' ? 'Nonaktif' : 'Aktif'} dan tersimpan secara real-time.`,
                          });
                        }}
                        className={`text-[10px] font-bold px-2.5 py-1 rounded-full transition-colors ${
                          user.status === 'active'
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                        }`}
                        title="Klik untuk ubah status aktif/nonaktif"
                      >
                        {user.status === 'active' ? 'Aktif' : 'Nonaktif'}
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Edit Button for Super Admin & Admin */}
                        {isSuperAdminOrAdmin && (
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-blue-100 text-blue-900 font-semibold rounded-lg text-xs transition-colors"
                            title="Edit Nama Pejabat & No. WhatsApp"
                          >
                            <Edit2 className="w-3.5 h-3.5 text-blue-800" />
                            <span>Edit Profil</span>
                          </button>
                        )}

                        {/* Transfer Pokja for Staff */}
                        {(user.role === 'staf_pokja' || user.id === 'staf-3' || user.nama.includes('Marsudi')) && isSuperAdminOrAdmin && (
                          <button
                            onClick={() => handleOpenTransfer(user)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-blue-950 font-bold rounded-lg text-xs transition-colors shadow-2xs"
                            title="Pindah Pokja"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>Pindah</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL 1: EDIT PEJABAT / PROFIL STAF (Req 1) */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-blue-900" />
                <h3 className="font-bold text-base text-slate-900">
                  Edit Profil & Nama Pejabat / Staf
                </h3>
              </div>
              <button
                onClick={() => setEditingUser(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap (beserta Gelar) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editForm.nama}
                  onChange={(e) => setEditForm({ ...editForm, nama: e.target.value })}
                  placeholder="Contoh: Drs. Eko Prasetyo, M.Si"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    NIP Pegawai
                  </label>
                  <input
                    type="text"
                    value={editForm.nip}
                    onChange={(e) => setEditForm({ ...editForm, nip: e.target.value })}
                    placeholder="19730510 199803 1 005"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Nomor WhatsApp Aktif</span>
                  </label>
                  <input
                    type="text"
                    value={editForm.nomorWhatsapp}
                    onChange={(e) => setEditForm({ ...editForm, nomorWhatsapp: e.target.value })}
                    placeholder="081223344552"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-mono"
                  />
                  <span className="text-[10px] text-slate-400">Untuk gateway notifikasi WA</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jabatan Kedinasan
                </label>
                <input
                  type="text"
                  value={editForm.jabatan}
                  onChange={(e) => setEditForm({ ...editForm, jabatan: e.target.value })}
                  placeholder="Contoh: Kepala Bidang Pertanahan Disperakim Prov. Jateng"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Kedinasan
                </label>
                <input
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                  placeholder="nama.pegawai@jatengprov.go.id"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>

              {/* Password Management by Super Admin */}
              <div className="p-3.5 bg-amber-50/80 border border-amber-300/80 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-amber-950 flex items-center gap-1.5 text-xs">
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Kata Sandi / Password Login Pengguna</span>
                  </label>
                  <button
                    type="button"
                    onClick={() =>
                      setEditForm({
                        ...editForm,
                        password: editForm.nip ? editForm.nip.replace(/\s+/g, '') : '',
                      })
                    }
                    className="text-[11px] text-blue-700 hover:text-blue-900 font-bold hover:underline"
                    title="Set kata sandi otomatis sama dengan NIP pegawai"
                  >
                    Set Password = NIP
                  </button>
                </div>
                <input
                  type="text"
                  value={editForm.password}
                  onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                  placeholder="Masukkan kata sandi baru untuk login"
                  className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:outline-hidden font-mono bg-white text-slate-900 font-semibold"
                />
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Dikelola khusus oleh Super Admin. Pengguna dapat login menggunakan NIP dan kata sandi ini.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Peran / Role Pengguna
                  </label>
                  <select
                    value={editForm.role}
                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="kadis">Kepala Dinas</option>
                    <option value="kabid">Kepala Bidang Pertanahan</option>
                    <option value="ketua_pokja">Ketua Pokja</option>
                    <option value="staf_pokja">Staf Pokja</option>
                    <option value="admin_pertanahan">Admin Persuratan Pertanahan</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Pokja Penempatan
                  </label>
                  <select
                    value={editForm.pokjaId}
                    onChange={(e) => setEditForm({ ...editForm, pokjaId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  >
                    <option value="">-- Tidak Terikat Pokja (Struktural) --</option>
                    {pokjas.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.kode} - {p.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingUser(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  Simpan Perubahan Pejabat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: TRANSFER POKJA STAF */}
      {selectedUserForTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-base text-slate-900">
                  Mutasi Formasi Pokja Staf
                </h3>
              </div>
              <button
                onClick={() => setSelectedUserForTransfer(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmTransfer} className="space-y-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="text-slate-500">Nama Staf yang Dipindahkan:</div>
                <div className="font-bold text-sm text-slate-900">
                  {selectedUserForTransfer.nama}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  NIP. {selectedUserForTransfer.nip}
                </div>
                <div className="text-[11px] text-blue-900 font-semibold pt-1">
                  Pokja Saat Ini: {pokjas.find((p) => p.id === selectedUserForTransfer.pokjaId)?.nama || '-'}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Pokja Tujuan Baru <span className="text-rose-500">*</span>
                </label>
                <select
                  value={targetPokjaId}
                  onChange={(e) => setTargetPokjaId(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-300 rounded-xl font-bold text-slate-900 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                >
                  {pokjas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.kode} - {p.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Catatan / Dasar Mutasi Resmi
                </label>
                <textarea
                  rows={2}
                  value={catatanMutasi}
                  onChange={(e) => setCatatanMutasi(e.target.value)}
                  placeholder="Dasar surat keputusan mutasi internal..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedUserForTransfer(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-blue-950 rounded-xl font-bold shadow-xs flex items-center gap-1.5"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  Konfirmasi Mutasi Pokja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: TAMBAH STAF BARU */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-blue-900" />
                <h3 className="font-bold text-base text-slate-900">
                  Tambah Staf Baru Bidang Pertanahan
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddNewStaf} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Lengkap Staf <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Danang Prasetyo, S.P."
                  value={newNama}
                  onChange={(e) => setNewNama(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  NIP Pegawai <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: 19950812 202012 1 004"
                  value={newNip}
                  onChange={(e) => setNewNip(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Jabatan / Penugasan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Analis Pengadaan Tanah"
                  value={newJabatan}
                  onChange={(e) => setNewJabatan(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nomor WhatsApp Gateway
                </label>
                <input
                  type="text"
                  placeholder="Contoh: 081234567890"
                  value={newWhatsapp}
                  onChange={(e) => setNewWhatsapp(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Kata Sandi Awal Login</span>
                  <span className="text-[10px] text-slate-500">Default: Mengikuti NIP</span>
                </label>
                <input
                  type="text"
                  placeholder="Kosongkan untuk otomatis menggunakan NIP"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Pilih Pokja Penempatan <span className="text-rose-500">*</span>
                </label>
                <select
                  value={newPokjaId}
                  onChange={(e) => setNewPokjaId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                >
                  {pokjas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.kode} - {p.nama}
                    </option>
                  ))}
                </select>
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
                >
                  <UserPlus className="w-4 h-4 text-amber-300" />
                  Simpan Staf
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* MODAL 4: EDIT POKJA (KELOMPOK KERJA PERTANAHAN) */}
      {editingPokja && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Building className="w-5 h-5 text-blue-900" />
                <div>
                  <h3 className="font-bold text-base text-slate-900">
                    Edit Data Kelompok Kerja (Pokja)
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Perbarui nama, kode singkatan, deskripsi tugas, dan penetapan Ketua Pokja
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setEditingPokja(null)}
                className="text-slate-400 hover:text-slate-600 text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditPokja} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nama Kelompok Kerja (Pokja) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editPokjaForm.nama}
                  onChange={(e) => setEditPokjaForm({ ...editPokjaForm, nama: e.target.value })}
                  placeholder="Contoh: Pokja Fasilitasi Pengadaan Tanah"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-medium text-slate-900"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Kode Singkatan Pokja <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={editPokjaForm.kode}
                    onChange={(e) => setEditPokjaForm({ ...editPokjaForm, kode: e.target.value.toUpperCase() })}
                    placeholder="Contoh: POKJA-FPT"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden font-mono font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Penetapan Ketua Pokja
                  </label>
                  <select
                    value={editPokjaForm.ketuaId}
                    onChange={(e) => setEditPokjaForm({ ...editPokjaForm, ketuaId: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl font-semibold text-slate-800 focus:ring-2 focus:ring-blue-900 focus:outline-hidden"
                  >
                    <option value="">-- Pilih Ketua Pokja --</option>
                    {users
                      .filter((u) => u.status === 'active')
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.nama} ({u.role.replace('_', ' ')})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Deskripsi Tugas / Tupoksi Pokja
                </label>
                <textarea
                  rows={3}
                  value={editPokjaForm.deskripsi}
                  onChange={(e) => setEditPokjaForm({ ...editPokjaForm, deskripsi: e.target.value })}
                  placeholder="Rincian deskripsi tugas dan wewenang kelompok kerja..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-900 focus:outline-hidden leading-relaxed"
                />
              </div>

              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-[11px] text-blue-900 leading-relaxed">
                <strong>Penyimpanan Real-Time:</strong> Perubahan data Pokja ini akan tersimpan otomatis ke Cloud Firestore dan terintegrasi secara real-time ke modul disposisi, surat, dan monitoring seluruh pengguna.
              </div>

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingPokja(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl font-semibold text-slate-700"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold shadow-xs flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-amber-300" />
                  Simpan Perubahan Pokja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
