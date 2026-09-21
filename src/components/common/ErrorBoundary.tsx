import React from 'react';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { cleanupStorageQuota } from '../../utils/storage';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Uncaught error in application:', error, errorInfo);
    try {
      cleanupStorageQuota();
    } catch {}
  }

  handleReset = () => {
    try {
      cleanupStorageQuota();
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  handleHardCleanAndReload = () => {
    try {
      cleanupStorageQuota();
      // Remove potentially overloaded keys
      localStorage.removeItem('disperakim_surat_v1');
      localStorage.removeItem('disperakim_logs_v1');
    } catch {}
    this.setState({ hasError: false, error: null });
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isQuotaError =
        this.state.error?.message?.toLowerCase().includes('quota') ||
        this.state.error?.message?.toLowerCase().includes('setitem');

      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
          <div className="bg-white rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-xl border border-slate-200 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center border border-rose-100">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">
              {isQuotaError ? 'Kapasitas Penyimpanan Penuh' : 'Terjadi Kendala Tampilan'}
            </h2>
            <p className="text-xs text-slate-600 leading-relaxed">
              {isQuotaError
                ? 'Penyimpanan browser telah dioptimalkan secara otomatis untuk membebaskan ruang memori dokumen. Silakan klik tombol pulihkan di bawah.'
                : 'Sistem mendeteksi kendala pada pembaruan data tampilan. Data persuratan Anda tetap aman tersimpan. Silakan klik tombol di bawah untuk memulihkan tampilan sistem.'}
            </p>
            {this.state.error && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-left text-[11px] font-mono text-slate-700 overflow-x-auto max-h-32">
                {this.state.error.message}
              </div>
            )}
            <div className="space-y-2 pt-2">
              <button
                onClick={this.handleReset}
                className="w-full py-2.5 px-4 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Pulihkan Tampilan Sistem
              </button>
              {isQuotaError && (
                <button
                  onClick={this.handleHardCleanAndReload}
                  className="w-full py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer border border-slate-300"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  Kosongkan Cache Naskah & Muat Ulang
                </button>
              )}
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

