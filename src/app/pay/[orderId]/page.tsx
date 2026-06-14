'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { ShoppingBag, Banknote, MapPin, CheckCircle2, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

export default function PublicInvoicePage() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [loadingCheckout, setLoadingCheckout] = useState(false);

  useEffect(() => {
    if (orderId) {
      fetch(`/api/pay/${orderId}`)
        .then(res => res.json())
        .then(data => {
          setOrder(data);
          setLoading(false);
        })
        .catch(err => {
          console.error(err);
          setLoading(false);
        });
    }
  }, [orderId]);

  const handleCheckout = async () => {
    try {
      setLoadingCheckout(true);
      const res = await fetch(`/api/pay/${orderId}/checkout`, { method: 'POST' });
      const result = await res.json();
      if (result.redirect_url) {
        window.location.href = result.redirect_url;
      } else {
        alert(result.error || 'Gagal memulai pembayaran.');
      }
    } catch (err) {
      alert('Terjadi kesalahan jaringan.');
    } finally {
      setLoadingCheckout(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-slate-500">Memuat Invoice...</p></div>;
  }

  if (!order || order.error) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-red-500">Invoice tidak ditemukan atau sudah kadaluarsa.</p></div>;
  }

  const isPaid = order.status === 'paid' || order.status === 'completed';

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 relative overflow-hidden animate-in fade-in duration-700">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[600px] bg-gradient-to-b from-indigo-500/10 via-purple-500/5 to-transparent blur-[100px] rounded-full pointer-events-none -z-10"></div>
      
      <div className="max-w-2xl mx-auto space-y-6 relative z-10">
        
        {/* Header / Store Name */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white mb-6 shadow-xl shadow-indigo-500/20 rotate-3 transition-transform hover:rotate-0 duration-300">
            <ShoppingBag className="w-10 h-10" />
          </div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent">{order.businessProfile?.businessName || 'Toko Online'}</h1>
          <p className="text-slate-500 font-medium mt-1">Invoice Tagihan Pembayaran</p>
        </div>

        {/* Status Banner */}
        <div className={`p-6 rounded-[2rem] flex items-center justify-between border shadow-sm transition-all duration-300 ${isPaid ? 'bg-emerald-50/80 backdrop-blur-md border-emerald-200/60 text-emerald-800' : 'bg-amber-50/80 backdrop-blur-md border-amber-200/60 text-amber-800'}`}>
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isPaid ? 'bg-emerald-100/50 text-emerald-600' : 'bg-amber-100/50 text-amber-600'}`}>
              {isPaid ? <CheckCircle2 className="w-8 h-8" /> : <Clock className="w-8 h-8 animate-pulse" />}
            </div>
            <div>
              <p className="font-extrabold text-lg tracking-tight">{isPaid ? 'Pembayaran Berhasil' : 'Menunggu Pembayaran'}</p>
              <p className="text-sm font-medium opacity-80 mt-0.5">{isPaid ? 'Terima kasih atas pesanan Anda.' : 'Silakan selesaikan pembayaran agar pesanan diproses.'}</p>
            </div>
          </div>
        </div>

        {/* Invoice Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-slate-100/50 to-transparent rounded-bl-full pointer-events-none"></div>
          
          <div className="p-8 border-b border-slate-100/50 flex justify-between items-center relative z-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">No. Tagihan</p>
              <p className="font-mono font-extrabold text-lg text-slate-800">{order.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">Tanggal</p>
              <p className="font-bold text-slate-800">{format(new Date(order.createdAt), 'dd MMMM yyyy', { locale: id })}</p>
            </div>
          </div>

          <div className="p-8 border-b border-slate-100/50 flex flex-col md:flex-row gap-8 relative z-10">
            <div className="flex-1">
              <h3 className="text-xs font-bold text-indigo-500 mb-4 uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Rincian Pelanggan</h3>
              <p className="font-extrabold text-slate-800 text-lg">{order.customerName}</p>
              <p className="text-slate-500 font-medium flex items-center gap-2 mt-2"><MapPin className="w-4 h-4" /> {order.customerPhone}</p>
            </div>
            {order.deliveryMethod === 'shipping' && order.shippingAddress && (
              <div className="flex-1">
                <h3 className="text-xs font-bold text-indigo-500 mb-4 uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Alamat Pengiriman</h3>
                <p className="text-sm text-slate-600 font-medium leading-relaxed bg-slate-50/80 p-4 rounded-2xl border border-slate-200/60 shadow-sm">{order.shippingAddress}</p>
              </div>
            )}
            {order.deliveryMethod === 'pickup' && (
              <div className="flex-1">
                <h3 className="text-xs font-bold text-indigo-500 mb-4 uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Metode Pengambilan</h3>
                <p className="text-sm font-bold text-indigo-700 bg-indigo-50/80 p-4 rounded-2xl border border-indigo-100 shadow-sm flex items-center gap-2">
                  Ambil Sendiri di Toko (Pickup)
                </p>
              </div>
            )}
          </div>

          <div className="p-8 border-b border-slate-100/50 relative z-10">
            <h3 className="text-xs font-bold text-indigo-500 mb-6 uppercase tracking-wider flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Rincian Pesanan</h3>
            <div className="space-y-5">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start group">
                  <div>
                    <p className="font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">{item.productName}</p>
                    <p className="text-sm font-medium text-slate-500 mt-1">{item.quantity} x Rp {Number(item.price).toLocaleString('id-ID')}</p>
                  </div>
                  <p className="font-extrabold text-slate-800">Rp {(item.quantity * Number(item.price)).toLocaleString('id-ID')}</p>
                </div>
              ))}
              
              <div className="border-t border-slate-100/50 pt-6 mt-6 space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <p className="text-slate-500 font-medium">Subtotal Produk</p>
                  <p className="font-bold text-slate-800">Rp {Number(order.totalAmount).toLocaleString('id-ID')}</p>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <p className="text-slate-500 font-medium">Biaya Pengiriman</p>
                  <p className="font-bold text-slate-800">
                    {Number(order.shippingFee) > 0 ? `Rp ${Number(order.shippingFee).toLocaleString('id-ID')}` : 'Gratis'}
                  </p>
                </div>
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <p className="text-emerald-600 font-bold">Diskon Voucher {order.voucherCode ? `(${order.voucherCode})` : ''}</p>
                    <p className="font-black text-emerald-600">- Rp {Number(order.discountAmount).toLocaleString('id-ID')}</p>
                  </div>
                )}
                <div className="flex justify-between items-center pt-4 mt-4 border-t border-slate-200/60">
                  <p className="font-black text-slate-800 text-lg tracking-tight">Total Tagihan</p>
                  <p className="font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent text-2xl tracking-tight">Rp {(Number(order.totalAmount) + Number(order.shippingFee) - Number(order.discountAmount)).toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment / Tracking Status Area */}
        <div className="p-8 bg-slate-50/50 relative z-10 space-y-6">
          
          {order.status === 'shipped' || order.status === 'completed' ? (
            <div className="bg-indigo-50/80 backdrop-blur-sm border border-indigo-200/60 rounded-[2rem] p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-sm border border-indigo-100">
                  <CheckCircle className="w-6 h-6 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-indigo-900 text-lg tracking-tight">Pesanan Telah Dikirim</h4>
                  <p className="text-sm font-medium text-indigo-700 mt-0.5">Barang Anda sedang dalam perjalanan.</p>
                </div>
              </div>
              <div className="bg-white rounded-xl p-5 border border-indigo-100 shadow-sm mt-4">
                <p className="text-xs font-bold text-slate-400 mb-1 uppercase tracking-wider">KURIR PENGIRIMAN</p>
                <p className="text-base font-extrabold text-slate-800 uppercase">{order.shippingCourier || 'Kurir Reguler'}</p>
                
                <p className="text-xs font-bold text-slate-400 mt-4 mb-1 uppercase tracking-wider">NOMOR RESI</p>
                <div className="flex items-center justify-between">
                  <p className="text-base font-mono font-black text-indigo-600 tracking-wider">
                    {order.shippingResi || 'Menunggu Resi...'}
                  </p>
                  {order.shippingResi && (
                    <button className="text-xs px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-all font-bold hover:scale-105 active:scale-95 shadow-sm border border-slate-200/50">
                      Salin
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : order.status === 'paid' ? (
            <div className="bg-emerald-50/80 backdrop-blur-sm border border-emerald-200/60 rounded-[2rem] p-6 flex items-start gap-4 shadow-sm">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-emerald-100 shrink-0">
                <CheckCircle className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-emerald-900 text-lg tracking-tight">Pembayaran Berhasil</h4>
                <p className="text-sm font-medium text-emerald-700 mt-1 leading-relaxed">
                  Terima kasih! Pembayaran Anda telah kami verifikasi. Pesanan sedang diproses dan disiapkan untuk pengiriman.
                </p>
              </div>
            </div>
          ) : order.status === 'processing' ? (
            <div className="bg-purple-50/80 backdrop-blur-sm border border-purple-200/60 rounded-[2rem] p-6 flex items-start gap-4 shadow-sm">
              <div className="p-3 bg-white rounded-2xl shadow-sm border border-purple-100 shrink-0">
                <Clock className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h4 className="font-extrabold text-purple-900 text-lg tracking-tight">Sedang Dikemas</h4>
                <p className="text-sm font-medium text-purple-700 mt-1 leading-relaxed">
                  Pesanan Anda sedang dalam tahap pengemasan oleh tim kami. Resi pengiriman akan muncul di sini segera setelah dikirim.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <h3 className="font-extrabold text-slate-800 mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-indigo-500"></div> Cara Pembayaran</h3>
                <p className="text-sm font-medium text-slate-500">
                  Total yang harus dibayar: <strong className="text-indigo-600 text-xl font-black ml-1 tracking-tight">Rp {(Number(order.totalAmount) + Number(order.shippingFee) - Number(order.discountAmount)).toLocaleString('id-ID')}</strong>
                </p>
              </div>
              
              <button
                disabled={loadingCheckout}
                onClick={handleCheckout}
                className={`w-full py-4 rounded-2xl font-bold border text-center transition-all flex items-center justify-center gap-3 ${
                  loadingCheckout 
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'bg-gradient-to-r from-indigo-500 to-purple-600 border-transparent text-white hover:from-indigo-600 hover:to-purple-700 shadow-lg shadow-indigo-500/30 hover:scale-[1.02] active:scale-[0.98]'
                }`}
              >
                {loadingCheckout ? 'Memproses...' : (
                  <>
                    <Banknote className="w-6 h-6" /> Bayar Sekarang (Otomatis)
                  </>
                )}
              </button>

              <div className="p-5 bg-white border border-slate-200/60 shadow-sm rounded-2xl flex items-start gap-3">
                <div className="p-2 bg-slate-50 rounded-lg shrink-0">
                  <AlertCircle className="w-5 h-5 text-indigo-500" />
                </div>
                <p className="text-xs font-medium text-slate-500 leading-relaxed pt-0.5">
                  Pembayaran diproses secara otomatis 24/7 menggunakan Payment Gateway. Anda dapat menggunakan transfer Virtual Account, E-Wallet (GoPay/OVO), atau Kartu Kredit.
                </p>
              </div>
            </div>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
