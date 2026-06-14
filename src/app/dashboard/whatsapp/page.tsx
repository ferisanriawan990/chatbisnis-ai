'use client';

import { useState, useEffect, useCallback } from 'react';
import { Server, Power, RefreshCw, AlertCircle, QrCode } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function WhatsappDashboard() {
  const [whatsappStatus, setWhatsappStatus] = useState('disconnected');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  
  const [sessionName, setSessionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const [loginMethod, setLoginMethod] = useState<'qr' | 'phone'>('qr');
  const [phoneNumber, setPhoneNumber] = useState('');

  const fetchQrCode = async () => {
    try {
      const res = await fetch('/api/dashboard/whatsapp/qr');
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
      const res = await fetch('/api/dashboard/whatsapp/status');
      if (res.ok) {
        const { status, sessionName: sName } = await res.json();
        setWhatsappStatus(status);
        if (sName) setSessionName(sName);

        if (status === 'qr' && !pairingCode) {
          await fetchQrCode();
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

  // Auto-polling when starting
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (whatsappStatus === 'starting') {
      interval = setInterval(() => {
        void fetchStatus();
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [whatsappStatus, fetchStatus]);

  // Auto-refresh QR code every 15 seconds
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (whatsappStatus === 'qr') {
      interval = setInterval(() => {
        void fetchQrCode();
        void fetchStatus(); // Also check if it became connected
      }, 15000);
    }
    return () => clearInterval(interval);
  }, [whatsappStatus, fetchStatus]);

  const handleStart = async () => {
    if (loginMethod === 'phone' && !phoneNumber) {
      toast.error('Masukkan nomor WhatsApp Anda');
      return;
    }

    setLoading(true);
    toast.loading('Memulai sesi WhatsApp...', { id: 'whatsapp' });
    try {
      const res = await fetch('/api/dashboard/whatsapp/start', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: loginMethod === 'phone' ? phoneNumber : undefined 
        })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success('Sesi berhasil dimulai!', { id: 'whatsapp' });
        if (data.pairingCode) {
          setPairingCode(data.pairingCode);
        }
        setTimeout(() => {
          fetchStatus();
        }, 3000);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal memulai', { id: 'whatsapp' });
      }
    } catch {
      toast.error('Jaringan bermasalah', { id: 'whatsapp' });
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    setLoading(true);
    toast.loading('Menghentikan sesi...', { id: 'whatsapp' });
    try {
      const res = await fetch('/api/dashboard/whatsapp/stop', { method: 'POST' });
      if (res.ok) {
        toast.success('Sesi dihentikan', { id: 'whatsapp' });
        fetchStatus();
        setQrCode(null);
        setPairingCode(null);
      } else {
        toast.error('Gagal menghentikan sesi', { id: 'whatsapp' });
      }
    } catch {
      toast.error('Jaringan bermasalah', { id: 'whatsapp' });
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
          <p className="text-slate-500 mt-1">Sambungkan nomor WhatsApp bisnis Anda ke ChatBisnis AI Gateway untuk mulai melayani pelanggan.</p>
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 gap-4">
          <div>
            <p className="text-sm font-medium text-slate-500">Status Koneksi</p>
            <div className="flex items-center gap-2 mt-1">
              <span className={`w-3 h-3 rounded-full ${whatsappStatus === 'connected' ? 'bg-emerald-500' : whatsappStatus === 'qr' ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`}></span>
              <span className={`text-xl font-bold capitalize ${whatsappStatus === 'connected' ? 'text-emerald-700' : whatsappStatus === 'qr' ? 'text-blue-700' : 'text-red-700'}`}>
                {whatsappStatus === 'disconnected' ? 'Terputus' : whatsappStatus}
              </span>
            </div>
            {sessionName && <p className="text-xs text-slate-400 mt-1">Sesi: {sessionName}</p>}
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button onClick={fetchStatus} disabled={refreshing} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 disabled:opacity-50">
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
            </button>
            {whatsappStatus === 'connected' ? (
              <button onClick={handleStop} disabled={loading} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium flex items-center gap-2 hover:bg-red-200 disabled:opacity-50">
                <Power className="w-4 h-4" /> Hentikan Sesi
              </button>
            ) : (
              <button onClick={handleStart} disabled={loading || whatsappStatus === 'starting'} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50">
                <Power className="w-4 h-4" /> Mulai Sesi Baru
              </button>
            )}
          </div>
        </div>

        {whatsappStatus === 'qr' && (
          <div className="mt-8">
            {pairingCode ? (
              <div className="border border-emerald-100 rounded-xl p-8 text-center bg-emerald-50">
                <h3 className="text-xl font-bold text-slate-800 mb-2">Kode Tautan Anda</h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">
                  Buka WhatsApp &gt; Tautkan Perangkat &gt; <b>Tautkan dengan Nomor Telepon Saja</b>. Masukkan kode 8-digit ini:
                </p>
                <div className="bg-white px-8 py-4 inline-block rounded-2xl shadow-sm border border-emerald-200">
                  <p className="text-4xl font-black text-emerald-700 tracking-[0.25em]">{pairingCode}</p>
                </div>
                <p className="text-sm text-slate-500 mt-6">
                  <RefreshCw className="w-4 h-4 inline mr-1 animate-spin" /> Menunggu WhatsApp Anda terhubung...
                </p>
              </div>
            ) : qrCode ? (
              <div className="border border-blue-100 rounded-xl p-8 text-center bg-blue-50">
                <QrCode className="w-12 h-12 text-blue-500 mx-auto mb-4" />
                <h3 className="text-lg font-bold text-slate-800 mb-2">Scan QR Code Ini</h3>
                <p className="text-slate-600 mb-6 max-w-md mx-auto">Buka aplikasi WhatsApp di HP Anda, pilih <b>Perangkat Tertaut (Linked Devices)</b>, lalu scan kode QR di bawah ini.</p>
                <div className="bg-white p-4 inline-block rounded-xl shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="WhatsApp QR" className="w-64 h-64 object-contain" />
                </div>
                <p className="text-xs text-slate-400 mt-4">QR code ini akan berubah otomatis. Klik Refresh jika gagal.</p>
              </div>
            ) : null}
          </div>
        )}

        {whatsappStatus === 'disconnected' && (
          <div className="border border-slate-200 rounded-xl p-6 bg-white shadow-sm space-y-6 mt-4">
            <div>
              <h3 className="text-lg font-bold text-slate-800 mb-4">Pilih Metode Login</h3>
              <div className="flex gap-4">
                <button
                  onClick={() => setLoginMethod('qr')}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all ${
                    loginMethod === 'qr' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  Scan QR Code
                </button>
                <button
                  onClick={() => setLoginMethod('phone')}
                  className={`flex-1 py-3 px-4 rounded-xl border-2 font-semibold transition-all ${
                    loginMethod === 'phone' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  Gunakan Nomor HP
                </button>
              </div>
            </div>

            {loginMethod === 'phone' && (
              <div className="animate-in fade-in slide-in-from-top-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Nomor WhatsApp Anda</label>
                <div className="flex">
                  <span className="inline-flex items-center px-4 rounded-l-lg border border-r-0 border-slate-300 bg-slate-50 text-slate-500 font-medium">
                    +
                  </span>
                  <input
                    type="text"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                    placeholder="62812xxxxxx"
                    className="flex-1 min-w-0 block w-full px-4 py-2.5 rounded-none rounded-r-lg border border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
                <p className="text-xs text-slate-500 mt-2">Gunakan kode negara (misal: 62) tanpa tanda plus (+), spasi, atau strip.</p>
              </div>
            )}

            <div className="flex items-start gap-3 p-4 bg-amber-50 text-amber-800 rounded-xl text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold mb-1">Bot belum terhubung ke WhatsApp.</p>
                <p>Silakan pilih metode login di atas, lalu tekan tombol <b>Mulai Sesi Baru</b> untuk menghubungkan.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
