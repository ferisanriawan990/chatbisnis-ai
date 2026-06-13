'use client';

import { useState, useEffect } from 'react';
import { ShieldCheck, QrCode, Smartphone, XCircle } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';

export default function SecurityProfilePage() {
  const [loading, setLoading] = useState(true);
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<{ secret: string; qrCodeDataUrl: string } | null>(null);
  const [otpCode, setOtpCode] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProfileStatus();
  }, []);

  const fetchProfileStatus = async () => {
    try {
      const res = await fetch('/api/dashboard/profile');
      if (res.ok) {
        const data = await res.json();
        setIs2FAEnabled(data.user.twoFactorEnabled);
      }
    } catch (e) {} finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/auth/2fa/generate');
      const data = await res.json();
      if (res.ok) {
        setQrCodeData(data);
      } else {
        toast.error(data.error || 'Gagal generate QR');
      }
    } catch {
      toast.error('Kesalahan jaringan');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/2fa/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: otpCode })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setIs2FAEnabled(true);
        setQrCodeData(null);
        setOtpCode('');
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Gagal verifikasi kode');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('/api/auth/2fa/disable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: passwordConfirm })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message);
        setIs2FAEnabled(false);
        setPasswordConfirm('');
      } else {
        toast.error(data.error);
      }
    } catch {
      toast.error('Gagal mematikan 2FA');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-8">Memuat profil...</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <Toaster position="top-right" />
      <div>
        <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 text-blue-600" /> Keamanan Akun
        </h1>
        <p className="text-slate-500 mt-1">Lindungi akun Anda dari akses tidak sah dengan fitur Autentikasi Dua Langkah (2FA).</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 md:p-8">
        {!is2FAEnabled ? (
          <div>
            <div className="flex items-start gap-4 mb-6">
              <div className="p-3 bg-red-50 text-red-600 rounded-xl shrink-0">
                <XCircle className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">2FA Belum Aktif</h3>
                <p className="text-slate-500 text-sm mt-1">Kami sangat merekomendasikan aktivasi 2FA untuk melindungi privasi data leads bisnis Anda dari pembajakan.</p>
              </div>
            </div>

            {!qrCodeData ? (
              <button 
                onClick={handleGenerate}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              >
                Mulai Setup 2FA
              </button>
            ) : (
              <div className="mt-8 border-t border-slate-200 pt-8 flex flex-col md:flex-row gap-8 items-start">
                <div className="bg-white p-4 border-2 border-dashed border-slate-300 rounded-2xl shrink-0">
                  <img src={qrCodeData.qrCodeDataUrl} alt="QR Code" className="w-48 h-48" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-slate-900 mb-2 flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-slate-400" /> Langkah Instalasi
                  </h4>
                  <ol className="list-decimal list-inside text-sm text-slate-600 space-y-2 mb-6">
                    <li>Buka aplikasi <strong>Google Authenticator</strong> di HP Anda.</li>
                    <li>Pilih ikon <strong>+</strong> lalu <strong>Scan a QR code</strong>.</li>
                    <li>Scan gambar barcode di samping kiri.</li>
                    <li>Masukkan 6 digit angka yang muncul pada form di bawah ini.</li>
                  </ol>
                  <form onSubmit={handleVerify} className="flex flex-col sm:flex-row gap-3">
                    <input 
                      type="text" 
                      maxLength={6} 
                      required 
                      value={otpCode}
                      onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456" 
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none w-full sm:w-32 text-center tracking-widest font-mono"
                    />
                    <button 
                      type="submit" 
                      disabled={submitting}
                      className="bg-emerald-600 text-white px-5 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                      {submitting ? 'Verifikasi...' : 'Verifikasi & Aktifkan'}
                    </button>
                  </form>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="flex items-start gap-4 mb-8">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-emerald-800">2FA Berhasil Diaktifkan!</h3>
                <p className="text-emerald-600 text-sm mt-1">Akun Anda saat ini telah diproteksi lapis baja. Setiap login pada perangkat baru akan meminta kode dari Authenticator.</p>
              </div>
            </div>

            <div className="border-t border-slate-200 pt-6">
              <h4 className="font-bold text-slate-900 mb-3 text-sm">Matikan 2FA (ZONA BAHAYA)</h4>
              <form onSubmit={handleDisable} className="flex flex-col sm:flex-row gap-3 items-start">
                <input 
                  type="password" 
                  required 
                  value={passwordConfirm}
                  onChange={e => setPasswordConfirm(e.target.value)}
                  placeholder="Masukkan password Anda" 
                  className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none w-full sm:w-64"
                />
                <button 
                  type="submit" 
                  disabled={submitting}
                  className="bg-white border border-red-200 text-red-600 px-5 py-2 rounded-lg font-bold hover:bg-red-50 transition-colors disabled:opacity-50 shrink-0"
                >
                  {submitting ? 'Memproses...' : 'Matikan 2FA'}
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
