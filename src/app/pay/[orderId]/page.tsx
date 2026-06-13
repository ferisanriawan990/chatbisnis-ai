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
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header / Store Name */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 text-blue-600 mb-4">
            <ShoppingBag className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">{order.businessProfile?.businessName || 'Toko Online'}</h1>
          <p className="text-slate-500">Invoice Tagihan Pembayaran</p>
        </div>

        {/* Status Banner */}
        <div className={`p-4 rounded-xl flex items-center justify-between border ${isPaid ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
          <div className="flex items-center gap-3">
            {isPaid ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
            <div>
              <p className="font-semibold">{isPaid ? 'Pembayaran Berhasil' : 'Menunggu Pembayaran'}</p>
              <p className="text-sm opacity-80">{isPaid ? 'Terima kasih atas pesanan Anda.' : 'Silakan selesaikan pembayaran agar pesanan diproses.'}</p>
            </div>
          </div>
        </div>

        {/* Invoice Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <div>
              <p className="text-sm text-slate-500">No. Tagihan</p>
              <p className="font-bold text-slate-800">{order.orderNumber}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500">Tanggal</p>
              <p className="font-medium text-slate-800">{format(new Date(order.createdAt), 'dd MMMM yyyy', { locale: id })}</p>
            </div>
          </div>

          <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row gap-6">
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider">Rincian Pelanggan</h3>
              <p className="font-medium text-slate-800">{order.customerName}</p>
              <p className="text-slate-600 flex items-center gap-2 mt-1"><MapPin className="w-4 h-4" /> {order.customerPhone}</p>
            </div>
            {order.deliveryMethod === 'shipping' && order.shippingAddress && (
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider">Alamat Pengiriman</h3>
                <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded border border-slate-100">{order.shippingAddress}</p>
              </div>
            )}
            {order.deliveryMethod === 'pickup' && (
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider">Metode Pengambilan</h3>
                <p className="text-sm font-medium text-blue-700 bg-blue-50 p-3 rounded border border-blue-100 flex items-center gap-2">
                  Ambil Sendiri di Toko (Pickup)
                </p>
              </div>
            )}
          </div>

          <div className="p-6 border-b border-slate-100">
            <h3 className="text-sm font-semibold text-slate-800 mb-4 uppercase tracking-wider">Rincian Pesanan</h3>
            <div className="space-y-4">
              {order.items.map((item: any, idx: number) => (
                <div key={idx} className="flex justify-between items-start">
                  <div>
                    <p className="font-medium text-slate-800">{item.productName}</p>
                    <p className="text-sm text-slate-500">{item.quantity} x Rp {Number(item.price).toLocaleString('id-ID')}</p>
                  </div>
                  <p className="font-medium text-slate-800">Rp {(item.quantity * Number(item.price)).toLocaleString('id-ID')}</p>
                </div>
              ))}
              
              <div className="border-t border-slate-100 pt-4 mt-4 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <p className="text-slate-500">Subtotal Produk</p>
                  <p className="font-medium text-slate-800">Rp {Number(order.totalAmount).toLocaleString('id-ID')}</p>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <p className="text-slate-500">Biaya Pengiriman</p>
                  <p className="font-medium text-slate-800">
                    {Number(order.shippingFee) > 0 ? `Rp ${Number(order.shippingFee).toLocaleString('id-ID')}` : 'Gratis'}
                  </p>
                </div>
                {Number(order.discountAmount) > 0 && (
                  <div className="flex justify-between items-center text-sm">
                    <p className="text-green-600 font-medium">Diskon Voucher {order.voucherCode ? `(${order.voucherCode})` : ''}</p>
                    <p className="font-bold text-green-600">- Rp {Number(order.discountAmount).toLocaleString('id-ID')}</p>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 mt-2 border-t border-slate-100">
                  <p className="font-bold text-slate-800">Total Tagihan</p>
                  <p className="font-bold text-blue-700 text-lg">Rp {(Number(order.totalAmount) + Number(order.shippingFee) - Number(order.discountAmount)).toLocaleString('id-ID')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Payment / Tracking Status Area */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 space-y-4">
          
          {order.status === 'shipped' || order.status === 'completed' ? (
            <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-indigo-600" />
                </div>
                <div>
                  <h4 className="font-bold text-indigo-900">Pesanan Telah Dikirim</h4>
                  <p className="text-xs text-indigo-700">Barang Anda sedang dalam perjalanan.</p>
                </div>
              </div>
              <div className="mt-3 bg-white p-3 rounded-lg border border-indigo-50">
                <p className="text-xs text-slate-500 mb-1 font-medium">KURIR PENGIRIMAN</p>
                <p className="text-sm font-bold text-slate-800 uppercase">{order.shippingCourier || 'Kurir Reguler'}</p>
                
                <p className="text-xs text-slate-500 mt-2 mb-1 font-medium">NOMOR RESI</p>
                <div className="flex items-center justify-between">
                  <p className="text-sm font-mono font-bold text-blue-600 tracking-wider">
                    {order.shippingResi || 'Menunggu Resi...'}
                  </p>
                  {order.shippingResi && (
                    <button className="text-xs px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors font-medium">
                      Salin
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : order.status === 'paid' ? (
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3">
              <div className="mt-0.5">
                <CheckCircle className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-bold text-blue-900 text-sm">Pembayaran Berhasil</h4>
                <p className="text-xs text-blue-700 mt-1">
                  Terima kasih! Pembayaran Anda telah kami verifikasi. Pesanan sedang diproses dan disiapkan untuk pengiriman.
                </p>
              </div>
            </div>
          ) : order.status === 'processing' ? (
            <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 flex items-start gap-3">
              <div className="mt-0.5">
                <Clock className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <h4 className="font-bold text-purple-900 text-sm">Sedang Dikemas</h4>
                <p className="text-xs text-purple-700 mt-1">
                  Pesanan Anda sedang dalam tahap pengemasan oleh tim kami. Resi pengiriman akan muncul di sini segera setelah dikirim.
                </p>
              </div>
            </div>
          ) : (
            <>
              <h3 className="font-bold text-slate-800 text-sm">Cara Pembayaran</h3>
              <p className="text-sm text-slate-600 mb-4">
                Total Tagihan: <strong className="text-blue-600 text-lg">Rp {(Number(order.totalAmount) + Number(order.shippingFee) - Number(order.discountAmount)).toLocaleString('id-ID')}</strong>.
              </p>
              
              <button
                disabled={loadingCheckout}
                onClick={handleCheckout}
                className={`w-full py-3.5 rounded-xl font-bold border text-center text-sm transition-all flex items-center justify-center gap-2 ${
                  loadingCheckout 
                    ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed'
                    : 'border-blue-600 bg-blue-600 text-white hover:bg-blue-700 shadow-md shadow-blue-200'
                }`}
              >
                {loadingCheckout ? 'Memproses...' : (
                  <>
                    <Banknote className="w-5 h-5" /> Bayar Sekarang (Otomatis)
                  </>
                )}
              </button>

              <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-500">
                  Pembayaran diproses secara otomatis 24/7 menggunakan Payment Gateway. Anda dapat menggunakan transfer Virtual Account, E-Wallet (GoPay/OVO), atau Kartu Kredit.
                </p>
              </div>
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
