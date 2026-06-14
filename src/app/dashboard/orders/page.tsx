"use client";

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Edit, Search, Package, MapPin, Truck, CheckCircle, Clock, XCircle, AlertCircle, RefreshCw } from 'lucide-react';

type OrderItem = {
  id: string;
  productName: string;
  quantity: number;
  price: number;
};

type Order = {
  id: string;
  orderNumber: string;
  customerName: string | null;
  customerPhone: string;
  status: string;
  totalAmount: number;
  dpAmount: number;
  createdAt: string;
  shippingAddress: string | null;
  shippingCourier: string | null;
  shippingResi: string | null;
  items: OrderItem[];
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  
  // Edit state
  const [editStatus, setEditStatus] = useState('');
  const [editDpAmount, setEditDpAmount] = useState<number>(0);
  const [editCourier, setEditCourier] = useState('');
  const [editResi, setEditResi] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/orders?search=${search}&status=${statusFilter}`);
      const data = await res.json();
      if (data.orders) setOrders(data.orders);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, statusFilter]);

  const handleUpdateOrder = async () => {
    if (!selectedOrder) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/dashboard/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: selectedOrder.id,
          status: editStatus,
          dpAmount: editDpAmount,
          shippingCourier: editCourier,
          shippingResi: editResi,
        })
      });
      if (res.ok) {
        setSelectedOrder(null);
        fetchOrders();
      } else {
        alert('Gagal mengupdate pesanan');
      }
    } catch (err) {
      alert('Terjadi kesalahan');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded-full text-xs font-medium">Draft</span>;
      case 'pending_payment': return <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded-full text-xs font-medium">Belum Bayar</span>;
      case 'dp_paid': return <span className="px-2 py-1 bg-teal-100 text-teal-700 rounded-full text-xs font-medium">DP Terbayar</span>;
      case 'paid': return <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">Sudah Bayar</span>;
      case 'processing': return <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">Diproses</span>;
      case 'shipped': return <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">Dikirim</span>;
      case 'completed': return <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Selesai</span>;
      case 'cancelled': return <span className="px-2 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">Dibatalkan</span>;
      default: return <span className="px-2 py-1 bg-slate-100 text-slate-700 rounded-full text-xs font-medium">{status}</span>;
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-700">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-lg p-8 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-blue-900 to-slate-900 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl shadow-lg shadow-blue-500/20">
              <ShoppingCart className="w-8 h-8 text-white" />
            </div>
            Manajemen Pesanan
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-lg ml-14">Pantau transaksi e-commerce, verifikasi pembayaran, dan perbarui resi.</p>
        </div>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-blue-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110"></div>
        
        <div className="p-6 md:p-8 border-b border-slate-100/50 flex flex-col sm:flex-row gap-4 relative z-10">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari Order ID, Nama, atau No. WA..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-semibold text-slate-700 transition-all shadow-sm focus:bg-white"
            />
          </div>
          <select 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-3.5 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-semibold text-slate-700 bg-slate-50/80 hover:bg-white transition-all shadow-sm appearance-none cursor-pointer min-w-[200px]"
          >
            <option value="all">Semua Status</option>
            <option value="pending_payment">Belum Bayar</option>
            <option value="dp_paid">DP Terbayar</option>
            <option value="paid">Sudah Bayar (Perlu Proses)</option>
            <option value="processing">Diproses</option>
            <option value="shipped">Dikirim</option>
            <option value="completed">Selesai</option>
            <option value="cancelled">Dibatalkan</option>
          </select>
          <button 
            onClick={fetchOrders}
            className="px-6 py-3.5 bg-white border border-slate-200 text-blue-600 rounded-2xl shadow-sm hover:border-blue-300 hover:bg-blue-50 transition-all flex items-center gap-2 text-sm font-bold"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto relative z-10 custom-scrollbar p-2">
          <table className="w-full text-left text-sm text-slate-600">
            <thead>
              <tr className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-100">
                <th className="px-6 py-5">Order ID & Tanggal</th>
                <th className="px-6 py-5">Pelanggan</th>
                <th className="px-6 py-5">Total Tagihan</th>
                <th className="px-6 py-5">Status</th>
                <th className="px-6 py-5 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-500">
                    <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto mb-4"></div>
                    <span className="font-medium">Memuat pesanan e-commerce...</span>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-20 text-center text-slate-500">
                    <Package className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                    <span className="font-bold text-lg">Belum ada pesanan.</span>
                  </td>
                </tr>
              ) : (
                orders.map((order) => (
                  <tr key={order.id} className="hover:bg-blue-50/40 transition-colors group/row">
                    <td className="px-6 py-5">
                      <div className="font-extrabold text-slate-800">{order.orderNumber}</div>
                      <div className="text-[11px] font-medium text-slate-500 mt-1">{new Date(order.createdAt).toLocaleString('id-ID')}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="font-bold text-slate-700">{order.customerName || 'Customer'}</div>
                      <div className="text-[11px] font-medium text-slate-500 mt-1">{order.customerPhone}</div>
                    </td>
                    <td className="px-6 py-5 font-extrabold text-indigo-700">
                      Rp {Number(order.totalAmount).toLocaleString('id-ID')}
                    </td>
                    <td className="px-6 py-5">
                      {getStatusBadge(order.status)}
                    </td>
                    <td className="px-6 py-5 text-right">
                      <button 
                        onClick={() => {
                          setSelectedOrder(order);
                          setEditStatus(order.status);
                          setEditDpAmount(Number(order.dpAmount || 0));
                          setEditCourier(order.shippingCourier || '');
                          setEditResi(order.shippingResi || '');
                        }}
                        className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-xl border border-transparent hover:border-blue-700 transition-all shadow-sm hover:shadow-blue-500/20"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail & Edit Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden my-8 relative border border-slate-100">
            <div className="p-6 md:p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50/80">
              <div>
                <h3 className="text-xl font-extrabold text-slate-800 flex items-center gap-3">
                  <div className="p-2 bg-blue-100 text-blue-600 rounded-xl"><Package className="w-5 h-5" /></div>
                  Detail Pesanan
                </h3>
                <p className="text-sm text-slate-500 font-mono mt-2 bg-white px-3 py-1 rounded-lg border border-slate-200 inline-block">{selectedOrder.orderNumber}</p>
              </div>
              <button 
                onClick={() => setSelectedOrder(null)}
                className="absolute top-6 right-6 p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 rounded-full transition-colors"
              >
                <XCircle className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Pelanggan</p>
                  <p className="font-semibold text-slate-800">{selectedOrder.customerName || 'Customer'}</p>
                  <p className="text-sm text-slate-600">{selectedOrder.customerPhone}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-1">Status Saat Ini</p>
                  <div className="mt-1">{getStatusBadge(selectedOrder.status)}</div>
                </div>
              </div>

              {/* Items */}
              <div>
                <h4 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4 text-blue-500" /> Rincian Produk
                </h4>
                <div className="border border-slate-200 rounded-lg overflow-hidden">
                  <table className="w-full text-sm text-left text-slate-600">
                    <thead className="bg-slate-50 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-2">Produk</th>
                        <th className="px-4 py-2 text-center">Qty</th>
                        <th className="px-4 py-2 text-right">Harga</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {selectedOrder.items.map(item => (
                        <tr key={item.id}>
                          <td className="px-4 py-3">{item.productName}</td>
                          <td className="px-4 py-3 text-center">{item.quantity}</td>
                          <td className="px-4 py-3 text-right text-slate-800 font-medium">Rp {Number(item.price).toLocaleString('id-ID')}</td>
                        </tr>
                      ))}
                      <tr className="bg-slate-50 font-bold">
                        <td colSpan={2} className="px-4 py-3 text-right text-slate-700">Total Tagihan:</td>
                        <td className="px-4 py-3 text-right text-blue-600">Rp {Number(selectedOrder.totalAmount).toLocaleString('id-ID')}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Update Form */}
              <div className="pt-6 border-t border-slate-100">
                <h4 className="text-sm font-extrabold text-slate-800 mb-4 flex items-center gap-2">
                  <Edit className="w-4 h-4 text-blue-500" /> Update Pemrosesan
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Ubah Status</label>
                    <select 
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium transition-all"
                    >
                      <option value="pending_payment">Belum Bayar (Menunggu Transfer)</option>
                      <option value="dp_paid">Uang Muka / DP Terbayar</option>
                      <option value="paid">Sudah Bayar (Lunas)</option>
                      <option value="processing">Diproses (Sedang Disiapkan)</option>
                      <option value="shipped">Dikirim (Dalam Perjalanan)</option>
                      <option value="completed">Selesai (Diterima)</option>
                      <option value="cancelled">Dibatalkan</option>
                    </select>
                    {editStatus === 'paid' && selectedOrder.status === 'pending_payment' && (
                      <p className="text-xs text-blue-600 mt-2 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Konfirmasi pembayaran manual aktif
                      </p>
                    )}
                    {editStatus === 'dp_paid' && (
                      <div className="mt-4 border-t border-slate-100 pt-3">
                        <label className="block text-sm font-medium text-slate-700 mb-1">Nominal Uang Muka (DP) Terbayar</label>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm font-medium">Rp</span>
                          <input 
                            type="number" 
                            min="0"
                            value={editDpAmount}
                            onChange={(e) => setEditDpAmount(Number(e.target.value))}
                            className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Kurir Pengiriman</label>
                    <input 
                      type="text" 
                      placeholder="Contoh: JNE, J&T, Sicepat..." 
                      value={editCourier}
                      onChange={(e) => setEditCourier(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-medium transition-all"
                    />
                  </div>
                  <div className="md:col-span-2 mt-2">
                    <label className="block text-sm font-bold text-slate-700 mb-1.5">Nomor Resi Pelacakan</label>
                    <input 
                      type="text" 
                      placeholder="Masukkan kode resi pengiriman..." 
                      value={editResi}
                      onChange={(e) => setEditResi(e.target.value)}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none text-sm font-mono font-bold transition-all"
                    />
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <Truck className="w-3 h-3" /> Pelanggan akan dapat melihat resi ini di halaman Invoice mereka.
                    </p>
                  </div>
                </div>
              </div>

            </div>
            <div className="p-6 md:p-8 border-t border-slate-100 bg-slate-50/80 flex justify-end gap-3 rounded-b-3xl">
              <button 
                onClick={() => setSelectedOrder(null)}
                className="px-6 py-3 text-sm font-bold text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-colors shadow-sm"
                disabled={isSaving}
              >
                Batal
              </button>
              <button 
                onClick={handleUpdateOrder}
                disabled={isSaving}
                className="px-6 py-3 text-sm font-bold text-white bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:-translate-y-0.5 flex items-center gap-2"
              >
                {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
