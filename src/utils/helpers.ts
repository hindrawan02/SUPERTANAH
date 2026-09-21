import { SuratStatus, DisposisiPrioritas } from '../types';

export const formatDateIndo = (dateStr?: string): string => {
  if (!dateStr) return '-';
  try {
    const parts = dateStr.split(' ')[0].split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIndex = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = [
        'Januari',
        'Februari',
        'Maret',
        'April',
        'Mei',
        'Juni',
        'Juli',
        'Agustus',
        'September',
        'Oktober',
        'November',
        'Desember',
      ];
      const time = dateStr.includes(' ') ? ` pukul ${dateStr.split(' ')[1]}` : '';
      return `${day} ${months[monthIndex]} ${year}${time}`;
    }
    return dateStr;
  } catch {
    return dateStr;
  }
};

export const getStatusBadgeColor = (status: SuratStatus): string => {
  switch (status) {
    case 'Surat Baru':
      return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'Menunggu Disposisi Kabid':
      return 'bg-amber-50 text-amber-800 border-amber-300';
    case 'Sudah Didisposisikan Kabid':
    case 'Menunggu Disposisi Ketua Pokja':
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    case 'Sudah Didisposisikan ke Staf':
      return 'bg-sky-50 text-sky-700 border-sky-200';
    case 'Belum Ditindaklanjuti':
      return 'bg-orange-50 text-orange-700 border-orange-200';
    case 'Sedang Dikerjakan':
      return 'bg-cyan-50 text-cyan-800 border-cyan-300';
    case 'Hadir':
      return 'bg-emerald-50 text-emerald-800 border-emerald-300';
    case 'Tidak Hadir':
      return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'Menunggu Verifikasi':
      return 'bg-purple-50 text-purple-700 border-purple-200';
    case 'Selesai':
      return 'bg-emerald-100 text-emerald-900 border-emerald-400 font-semibold';
    case 'Diarsipkan':
      return 'bg-slate-100 text-slate-700 border-slate-300';
    default:
      return 'bg-gray-100 text-gray-700 border-gray-200';
  }
};

export const getPriorityBadge = (prioritas?: DisposisiPrioritas): { label: string; className: string } => {
  switch (prioritas) {
    case 'Mendesak':
      return { label: 'Mendesak', className: 'bg-rose-100 text-rose-800 border-rose-300 font-medium' };
    case 'Tinggi':
      return { label: 'Tinggi', className: 'bg-amber-100 text-amber-800 border-amber-300 font-medium' };
    case 'Normal':
    default:
      return { label: 'Normal', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  }
};

export const calculateSlaStatus = (batasWaktu?: string): { status: 'safe' | 'warning' | 'expired'; label: string; badgeClass: string; textColor: string } => {
  if (!batasWaktu) {
    return { status: 'safe', label: 'Tidak Ada Batas', badgeClass: 'bg-slate-100 text-slate-600 border-slate-200', textColor: 'text-slate-500' };
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadline = new Date(batasWaktu);
  deadline.setHours(0, 0, 0, 0);

  const diffTime = deadline.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      status: 'expired',
      label: `Terlambat ${Math.abs(diffDays)} hari`,
      badgeClass: 'bg-red-100 text-red-800 border-red-300 animate-pulse font-medium',
      textColor: 'text-red-700 font-bold',
    };
  } else if (diffDays <= 2) {
    return {
      status: 'warning',
      label: diffDays === 0 ? 'Jatuh Tempo Hari Ini!' : `Tersisa ${diffDays} hari`,
      badgeClass: 'bg-amber-100 text-amber-800 border-amber-300 font-medium',
      textColor: 'text-amber-700 font-semibold',
    };
  } else {
    return {
      status: 'safe',
      label: `Tersisa ${diffDays} hari`,
      badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      textColor: 'text-emerald-700',
    };
  }
};

export const ROMAN_MONTHS = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'] as const;

export const getRomanMonth = (dateOrMonth?: Date | string | number): string => {
  let monthIdx = new Date().getMonth(); // 0 to 11
  if (typeof dateOrMonth === 'number') {
    if (dateOrMonth >= 1 && dateOrMonth <= 12) {
      monthIdx = dateOrMonth - 1;
    } else if (dateOrMonth >= 0 && dateOrMonth <= 11) {
      monthIdx = dateOrMonth;
    }
  } else if (typeof dateOrMonth === 'string' && dateOrMonth) {
    const parts = dateOrMonth.split('-');
    if (parts.length >= 2) {
      const parsedMonth = parseInt(parts[1], 10);
      if (!isNaN(parsedMonth) && parsedMonth >= 1 && parsedMonth <= 12) {
        monthIdx = parsedMonth - 1;
      }
    } else {
      const d = new Date(dateOrMonth);
      if (!isNaN(d.getTime())) {
        monthIdx = d.getMonth();
      }
    }
  } else if (dateOrMonth instanceof Date && !isNaN(dateOrMonth.getTime())) {
    monthIdx = dateOrMonth.getMonth();
  }
  return ROMAN_MONTHS[monthIdx] || 'I';
};

