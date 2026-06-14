'use client';

import { useState, useEffect, useCallback } from 'react';
import { Server, Power, RefreshCw, AlertCircle, QrCode, Plus } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

interface WhatsappSession {
  id: string;
  sessionName: string;
  status: string;
  phoneNumber: string | null;
  lastConnectedAt: string | null;
  lastError: string | null;
  pairingCode?: string;
}

export default function WhatsappDashboard() {
  const [sessions, setSessions] = useState<WhatsappSession[]>([]);
  const [maxSessions, setMaxSessions] = useState<number>(1);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});
  const [pairingCodes, setPairingCodes] = useState<Record<string, string>>({});
  
  const [loadingAction, setLoadingAction] = useState<string | null>(null); // To track which session is loading
  const [refreshing, setRefreshing] = useState(false);

  const [loginMethod, setLoginMethod] = useState<'qr' | 'phone'>('qr');
  const [phoneNumberInput, setPhoneNumberInput] = useState('');

  const fetchQrCode = async (sessionName: string) => {
    try {
      const res = await fetch(`/api/dashboard/whatsapp/qr?sessionName=${encodeURIComponent(sessionName)}`);
      if (res.ok) {
        const { qr } = await res.json();
        setQrCodes((prev) => ({ ...prev, [sessionName]: qr }));
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
        const data = await res.json();
        setSessions(data.sessions || []);
        setMaxSessions(data.maxSessions || 1);

        // Cek jika API mengembalikan pairingCode untuk sesi yang sedang "qr" (menunggu koneksi)
        const newPairingCodes = { ...pairingCodes };
        let updatedPairing = false;
        
        data.sessions?.forEach((s: WhatsappSession) => {
          if (s.pairingCode) {
            newPairingCodes[s.sessionName] = s.pairingCode;
            updatedPairing = true;
          }
          if (s.status === 'qr' && !newPairingCodes[s.sessionName]) {
            fetchQrCode(s.sessionName);
          }
        });
        
        if (updatedPairing) {
          setPairingCodes(newPairingCodes);
        }
      }
    } catch {
      toast.error('Gagal mengambil status');
    } finally {
      setRefreshing(false);
    }
  }, [pairingCodes]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Auto-polling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    const hasStarting = sessions.some(s => s.status === 'starting');
    const hasQr = sessions.some(s => s.status === 'qr');
    
    if (hasStarting || hasQr) {
      interval = setInterval(() => {
        fetchStatus();
      }, hasStarting ? 3000 : 15000);
    }
    return () => clearInterval(interval);
  }, [sessions, fetchStatus]);

  const handleStart = async (isNew: boolean, targetSessionName?: string) => {
    if (loginMethod === 'phone' && !phoneNumberInput) {
      toast.error('Masukkan nomor WhatsApp Anda');
      return;
    }

    setLoadingAction(targetSessionName || 'new');
    toast.loading(isNew ? 'Membuat sesi baru...' : 'Memulai sesi WhatsApp...', { id: 'whatsapp' });
    try {
      const res = await fetch('/api/dashboard/whatsapp/start', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          phoneNumber: loginMethod === 'phone' ? phoneNumberInput : undefined,
          sessionName: targetSessionName,
          isNew
        })
      });
      if (res.ok) {
        const data = await res.json();
        toast.success(isNew ? 'Sesi baru berhasil dibuat!' : 'Sesi berhasil dimulai!', { id: 'whatsapp' });
        if (data.pairingCode && data.sessionName) {
          setPairingCodes(prev => ({ ...prev, [data.sessionName]: data.pairingCode }));
        }
        setTimeout(() => {
          fetchStatus();
        }, 2000);
      } else {
        const err = await res.json();
        toast.error(err.error || 'Gagal memulai', { id: 'whatsapp' });
      }
    } catch {
      toast.error('Jaringan bermasalah', { id: 'whatsapp' });
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStop = async (sessionName: string) => {
    setLoadingAction(sessionName);
    toast.loading('Menghentikan sesi...', { id: 'whatsapp' });
    try {
      const res = await fetch('/api/dashboard/whatsapp/stop', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionName })
      });
      if (res.ok) {
        toast.success('Sesi dihentikan', { id: 'whatsapp' });
        fetchStatus();
        setQrCodes(prev => { const next = {...prev}; delete next[sessionName]; return next; });
        setPairingCodes(prev => { const next = {...prev}; delete next[sessionName]; return next; });
      } else {
        toast.error('Gagal menghentikan sesi', { id: 'whatsapp' });
      }
    } catch {
      toast.error('Jaringan bermasalah', { id: 'whatsapp' });
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-20">
      <Toaster position="top-right" />
      
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="bg-emerald-100 p-4 rounded-xl text-emerald-600">
            <Server className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Manajemen Nomor WhatsApp</h1>
            <p className="text-slate-500 mt-1">Kuota Anda: <b>{sessions.length} / {maxSessions}</b> Sesi</p>
          </div>
        </div>
        <button onClick={fetchStatus} disabled={refreshing} className="px-4 py-2 bg-white border border-slate-200 text-slate-700 rounded-lg font-medium flex items-center gap-2 hover:bg-slate-50 disabled:opacity-50">
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      <div className="space-y-6">
        {sessions.map((session, index) => (
          <div key={session.id} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-200 gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-slate-800">Nomor {index + 1}</h3>
                  <span className="text-xs bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full font-mono">{session.sessionName}</span>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`w-3 h-3 rounded-full ${session.status === 'connected' ? 'bg-emerald-500' : session.status === 'qr' ? 'bg-blue-500 animate-pulse' : 'bg-red-500'}`}></span>
                  <span className={`text-sm font-bold capitalize ${session.status === 'connected' ? 'text-emerald-700' : session.status === 'qr' ? 'text-blue-700' : 'text-red-700'}`}>
                    {session.status === 'disconnected' ? 'Terputus' : session.status}
                  </span>
                  {session.phoneNumber && <span className="text-sm font-medium text-slate-600 ml-2 border-l pl-2 border-slate-300">+{session.phoneNumber}</span>}
                </div>
                {session.lastError && <p className="text-xs text-red-500 mt-1 truncate max-w-xs">{session.lastError}</p>}
              </div>
              
              <div className="flex flex-wrap gap-2">
                {session.status === 'connected' || session.status === 'starting' || session.status === 'qr' ? (
                  <button onClick={() => handleStop(session.sessionName)} disabled={loadingAction === session.sessionName} className="px-4 py-2 bg-red-100 text-red-700 rounded-lg font-medium flex items-center gap-2 hover:bg-red-200 disabled:opacity-50 text-sm">
                    <Power className="w-4 h-4" /> Hentikan Sesi
                  </button>
                ) : (
                  <button onClick={() => handleStart(false, session.sessionName)} disabled={loadingAction === session.sessionName} className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50 text-sm">
                    <Power className="w-4 h-4" /> Hubungkan Ulang
                  </button>
                )}
              </div>
            </div>

            {session.status === 'qr' && (
              <div className="mt-4">
                {pairingCodes[session.sessionName] ? (
                  <div className="border border-emerald-100 rounded-xl p-6 text-center bg-emerald-50">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">Kode Tautan Anda</h3>
                    <p className="text-sm text-slate-600 mb-4 max-w-md mx-auto">
                      Buka WhatsApp &gt; Tautkan Perangkat &gt; <b>Tautkan dengan Nomor Telepon Saja</b>. Masukkan kode 8-digit ini:
                    </p>
                    <div className="bg-white px-6 py-3 inline-block rounded-xl shadow-sm border border-emerald-200">
                      <p className="text-3xl font-black text-emerald-700 tracking-[0.25em]">{pairingCodes[session.sessionName]}</p>
                    </div>
                  </div>
                ) : qrCodes[session.sessionName] ? (
                  <div className="border border-blue-100 rounded-xl p-6 text-center bg-blue-50">
                    <QrCode className="w-10 h-10 text-blue-500 mx-auto mb-2" />
                    <h3 className="text-md font-bold text-slate-800 mb-1">Scan QR Code Ini</h3>
                    <div className="bg-white p-3 inline-block rounded-xl shadow-sm">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={qrCodes[session.sessionName]} alt="WhatsApp QR" className="w-48 h-48 object-contain" />
                    </div>
                  </div>
                ) : (
                  <div className="text-center p-6 text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                    Memuat QR Code...
                  </div>
                )}
              </div>
            )}
          </div>
        ))}

        {sessions.length < maxSessions && (
          <div className="border border-dashed border-emerald-300 rounded-2xl p-8 bg-emerald-50/50 text-center space-y-6 transition-all hover:bg-emerald-50">
            <div>
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Plus className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-800">Tambah Nomor WhatsApp</h3>
              <p className="text-slate-600 mt-2">Anda masih memiliki sisa kuota {maxSessions - sessions.length} nomor.</p>
            </div>
            
            <div className="max-w-md mx-auto bg-white p-6 rounded-xl border border-emerald-100 shadow-sm text-left">
              <h4 className="text-sm font-bold text-slate-700 mb-3">Metode Login</h4>
              <div className="flex gap-2 mb-4">
                <button
                  onClick={() => setLoginMethod('qr')}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-semibold transition-all ${
                    loginMethod === 'qr' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  Scan QR Code
                </button>
                <button
                  onClick={() => setLoginMethod('phone')}
                  className={`flex-1 py-2 px-3 rounded-lg border text-sm font-semibold transition-all ${
                    loginMethod === 'phone' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'
                  }`}
                >
                  Gunakan Nomor HP
                </button>
              </div>

              {loginMethod === 'phone' && (
                <div className="mb-4 animate-in fade-in">
                  <label className="block text-xs font-medium text-slate-600 mb-1">Nomor WhatsApp Anda</label>
                  <div className="flex">
                    <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-slate-300 bg-slate-50 text-slate-500 text-sm">
                      +
                    </span>
                    <input
                      type="text"
                      value={phoneNumberInput}
                      onChange={(e) => setPhoneNumberInput(e.target.value.replace(/\D/g, ''))}
                      placeholder="62812xxxxxx"
                      className="flex-1 min-w-0 block w-full px-3 py-2 text-sm rounded-none rounded-r-md border border-slate-300 focus:ring-emerald-500 focus:border-emerald-500"
                    />
                  </div>
                </div>
              )}

              <button 
                onClick={() => handleStart(true)} 
                disabled={loadingAction === 'new'} 
                className="w-full py-2.5 bg-emerald-600 text-white rounded-lg font-bold shadow-sm hover:bg-emerald-700 disabled:opacity-50 flex justify-center items-center gap-2"
              >
                <Power className="w-4 h-4" /> Buat & Mulai Sesi
              </button>
            </div>
          </div>
        )}

        {sessions.length >= maxSessions && (
          <div className="flex items-start gap-3 p-4 bg-amber-50 text-amber-800 rounded-xl text-sm border border-amber-200">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold mb-1">Batas Kuota Tercapai</p>
              <p>Anda telah mencapai batas maksimal ({maxSessions} nomor) untuk paket berlangganan saat ini. Tingkatkan paket Anda jika ingin menambahkan lebih banyak nomor WhatsApp.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

