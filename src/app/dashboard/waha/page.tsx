'use client';

import { useState, useEffect, useCallback } from 'react';
import { Server, Power, RefreshCw, AlertCircle, QrCode } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function WahaDashboard() {
  const [wahaStatus, setWahaStatus] = useState('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  
  const [sessionName, setSessionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isCoreMode, setIsCoreMode] = useState(false);

  const fetchQrCode = async () => {
    try {
      const res = await fetch('/api/dashboard/waha/qr');
      if (res.ok) {
        const { qr } = await res.json();
        setQrCode(qr);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchStatus = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch('/api/dashboard/waha/status');
      if (res.ok) {
        const { status, sessionName: sName, isCoreMode: coreMode } = await res.json();
        setWahaStatus(status);
        if (sName) setSessionName(sName);
        setIsCoreMode(!!coreMode);

        if (status === 'qr') {
          fetchQrCode();
        }
      }
    } catch {
      toast.error('Gagal mengambil status');
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (fetchStatus as any)();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStart = async () => {
    setLoading(true);
    toast.loading('Memulai sesi WAHA...', { id: 'waha' });
    try {
      const res = await fetch('/api/dashboard/waha/start', { method: 'POST' });
      if (res.ok) {
        toast.success('Sesi berhasil dimulai!', { id: 'waha' });
        setTimeout(() => {
          fetchStatus();
        }, 3000);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal memulai', { id: 'waha' });
      }
    } catch {
      toast.error('Jaringan bermasalah', { id: 'waha' });
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    toast.loading('Menghentikan sesi...', { id: 'waha' });
    try {
      const res = await fetch('/api/dashboard/waha/stop', { method: 'POST' });
      if (res.ok) {
        toast.success('Sesi dihentikan', { id: 'waha' });
        fetchStatus();
        setQrCode(null);
      } else {
        toast.error('Gagal menghentikan sesi', { id: 'waha' });
      }
    } catch {
      toast.error('Jaringan bermasalah', { id: 'waha' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <Toaster position="top-right" />
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
        <div className="bg-emerald-100 p-4 rounded-xl text-emerald-600">
          <Server className="w-8 h-8" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Koneksi WhatsApp Server</h1>
          <p className="text-slate-500 mt-1">Sambungkan nomor WhatsApp bisnis Anda ke server WAHA untuk mulai melayani pelanggan.</p>
        </div>
      </div>

      {isCoreMode && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-6 py-4 rounded-xl flex items-start gap-3 shadow-sm">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-blue-600" />
          <div>
            <p className="font-semibold text-sm">Mode WAHA Core aktif</p>
            <p className="text-sm mt-1">Hanya mendukung 1 nomor WhatsApp (Sesi &quot;default&quot;). Untuk mendaftarkan banyak user dan nomor, gunakan WAHA Plus.</p>
          </div>
        </div>
      )}

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Status Koneksi</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-3 h-3 rounded-full ${wahaStatus === 'connected' ? 'bg-emerald-500' : wahaStatus === 'qr' ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className={`text-xl font-bold capitalize ${wahaStatus === 'connected' ? 'text-emerald-700' : wahaStatus === 'qr' ? 'text-blue-700' : 'text-red-700'}`}>
                {wahaStatus === 'disconnected' ? 'Terputus' : wahaStatus}
              </span>
            </div>
            {sessionName && <p className="text-xs text-slate-400 mt-1">Sesi: {sessionName}</p>}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button onClick={fetchStatus} disabled={refreshing} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
            {wahaStatus === 'connected' ? (
              <button onClick={handleStop} disabled={loading} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium flex items-center gap-2 hover:bg-red-200 disabled:opacity-50">
                <Power className="w-4 h-4" /> Hentikan Sesi
              </button>
            ) : (
              <button onClick={handleStart} disabled={loading || wahaStatus === 'starting'} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50">
                <Power className="w-4 h-4" /> Mulai Sesi Baru
              </button>
            )}
          </div>
        </div>

        {wahaStatus === 'qr' && qrCode && (
          <div className="mt-8 border border-blue-100 rounded-xl p-8 text-center bg-blue-50">
            <QrCode className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800 mb-2">Scan QR Code Ini</h3>
            <p className="text-slate-600 mb-6 max-w-md mx-auto">Buka aplikasi WhatsApp di HP Anda, pilih <b>Perangkat Tertaut (Linked Devices)</b>, lalu scan kode QR di bawah ini.</p>
            <div className="bg-white p-4 inline-block rounded-xl shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrCode} alt="WhatsApp QR" className="w-64 h-64 object-contain" />
            </div>
            <p className="text-xs text-slate-400 mt-4">QR code ini akan berubah otomatis. Klik Refresh jika gagal.</p>
          </div>
        )}

        {wahaStatus === 'disconnected' && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 text-amber-800 rounded-xl text-sm">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold mb-1">Bot belum terhubung ke WhatsApp.</p>
              <p>Tekan tombol <b>Mulai Sesi Baru</b> di atas, lalu scan QR code yang muncul menggunakan WhatsApp yang ingin Anda jadikan bot customer service.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
