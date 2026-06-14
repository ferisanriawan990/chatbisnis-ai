'use client';

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Plus, Edit, Trash2, Box, Search } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  stock: number;
  isAvailable: boolean;
  category: string;
  imageUrl?: string | null;
}

export default function ProductsPage() {
  const { data: session } = useSession();
  const tenants = (session?.user as any)?.tenants || [];
  const activeTenantId = tenants[0]?.id; // Default tenant
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stock: '0',
    category: '',
    imageUrl: '',
    isAvailable: true
  });

  const fetchProducts = async () => {
    if (!activeTenantId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/products?businessProfileId=${activeTenantId}&search=${search}`);
      const data = await res.json();
      if (res.ok) setProducts(data.products || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // We intentionally disable exhaustive-deps so fetchProducts doesn't trigger loops
   
  useEffect(() => {
    if (activeTenantId) {
      const timeoutId = setTimeout(() => {
        fetchProducts();
      }, 500);
      return () => clearTimeout(timeoutId);
    }
  }, [activeTenantId, search]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingId 
        ? `/api/dashboard/products/${editingId}`
        : `/api/dashboard/products`;
      const method = editingId ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          businessProfileId: activeTenantId,
        }),
      });

      if (res.ok) {
        setIsModalOpen(false);
        fetchProducts();
      } else {
        alert('Gagal menyimpan produk');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus produk ini?')) return;
    try {
      const res = await fetch(`/api/dashboard/products/${id}`, { method: 'DELETE' });
      if (res.ok) fetchProducts();
    } catch (err) {
      console.error(err);
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingId(product.id);
      setFormData({
        name: product.name,
        description: product.description || '',
        price: product.price.toString(),
        stock: product.stock.toString(),
        category: product.category || '',
        imageUrl: product.imageUrl || '',
        isAvailable: product.isAvailable
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', description: '', price: '', stock: '0', category: '', imageUrl: '', isAvailable: true });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto animate-in fade-in duration-700">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-lg p-8 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden mb-8">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-indigo-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl shadow-lg shadow-indigo-500/20">
              <Box className="w-8 h-8 text-white" />
            </div>
            Katalog Produk (E-Commerce)
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-lg ml-14">Kelola produk jualan Anda yang akan ditawarkan oleh AI Chatbot secara otomatis.</p>
        </div>

        <button 
          onClick={() => openModal()}
          className="relative z-10 bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-6 py-3.5 rounded-2xl font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" /> Tambah Produk
        </button>
      </div>

      <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 p-8 relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-indigo-100/50 to-transparent rounded-bl-full pointer-events-none transition-transform duration-500 group-hover:scale-110"></div>
        
        <div className="flex flex-col md:flex-row items-center gap-4 mb-6 relative z-10">
          <div className="relative w-full md:w-96">
            <Search className="w-5 h-5 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Cari nama atau kategori produk..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-slate-50/80 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none text-sm font-semibold text-slate-700 transition-all shadow-sm focus:bg-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 relative z-10">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
            <p className="text-slate-500 font-medium">Memuat katalog e-commerce...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-20 relative z-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
            <Box className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 font-bold text-lg">Belum ada produk jualan.</p>
            <p className="text-slate-400 text-sm mt-1 mb-6">Tambahkan produk pertama Anda agar AI dapat mulai berjualan.</p>
            <button onClick={() => openModal()} className="px-6 py-2.5 bg-white border border-slate-200 text-indigo-600 font-bold rounded-xl shadow-sm hover:border-indigo-300 transition-all">Mulai Tambah Produk</button>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 relative z-10 shadow-sm bg-white">
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left text-sm text-slate-600">
                <thead>
                  <tr className="bg-slate-50/80 text-[11px] font-extrabold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                    <th className="p-5">Gambar</th>
                    <th className="p-5">Nama Produk</th>
                    <th className="p-5">Kategori</th>
                    <th className="p-5">Harga</th>
                    <th className="p-5">Stok</th>
                    <th className="p-5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(p => (
                    <tr key={p.id} className="hover:bg-indigo-50/30 transition-colors group/row">
                      <td className="p-5">
                        {p.imageUrl ? (
                          <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden relative shadow-sm">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).src = 'https://placehold.co/100x100/e2e8f0/64748b?text=Img' }} />
                          </div>
                        ) : (
                          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-dashed border-slate-300 flex items-center justify-center">
                            <Box className="w-5 h-5 text-slate-300" />
                          </div>
                        )}
                      </td>
                      <td className="p-5 font-bold text-slate-800">{p.name}</td>
                      <td className="p-5"><span className="bg-slate-100 border border-slate-200 text-slate-700 px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wide shadow-sm">{p.category || 'UMUM'}</span></td>
                      <td className="p-5 font-bold text-indigo-700">Rp {Number(p.price).toLocaleString('id-ID')}</td>
                      <td className="p-5">
                        <span className={`px-3 py-1.5 rounded-full text-[11px] font-extrabold shadow-sm ${p.stock > 0 ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-red-100 text-red-700 border border-red-200'}`}>
                          {p.stock} Item
                        </span>
                      </td>
                      <td className="p-5 text-right">
                        <div className="flex justify-end gap-2 opacity-100 md:opacity-0 md:group-hover/row:opacity-100 transition-opacity">
                          <button onClick={() => openModal(p)} className="p-2 text-blue-600 hover:text-white hover:bg-blue-600 rounded-lg border border-transparent hover:border-blue-700 transition-all shadow-sm hover:shadow-blue-500/20">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(p.id)} className="p-2 text-red-500 hover:text-white hover:bg-red-500 rounded-lg border border-transparent hover:border-red-600 transition-all shadow-sm hover:shadow-red-500/20">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl p-8 max-h-[90vh] overflow-y-auto custom-scrollbar relative border border-slate-100">
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
            </button>
            <h2 className="text-2xl font-extrabold mb-6 text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl"><Box className="w-6 h-6" /></div>
              {editingId ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Nama Produk <span className="text-red-500">*</span></label>
                <input required type="text" placeholder="Misal: Sepatu Nike Air Max" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Harga (Rp) <span className="text-red-500">*</span></label>
                  <input required type="number" placeholder="Misal: 150000" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Stok Fisik Tersedia <span className="text-red-500">*</span></label>
                  <input required type="number" placeholder="Misal: 100" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800" />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Kategori</label>
                  <input type="text" placeholder="Misal: Sepatu Pria" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">URL Gambar (Opsional)</label>
                  <input type="text" placeholder="https://imgur.com/..." value={formData.imageUrl} onChange={e => setFormData({...formData, imageUrl: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-medium text-slate-800" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Deskripsi Singkat / Spesifikasi</label>
                <textarea rows={3} placeholder="Tulis deskripsi detail produk agar AI bisa menjelaskannya ke pelanggan..." value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none font-medium text-slate-800"></textarea>
              </div>
              <div className="flex items-center gap-3 p-4 bg-indigo-50/50 border border-indigo-100 rounded-xl">
                <input type="checkbox" id="isAvailable" checked={formData.isAvailable} onChange={e => setFormData({...formData, isAvailable: e.target.checked})} className="w-5 h-5 rounded text-indigo-600 focus:ring-indigo-500 border-gray-300 cursor-pointer" />
                <div className="flex flex-col">
                  <label htmlFor="isAvailable" className="text-sm font-bold text-slate-800 cursor-pointer">Tampilkan di Katalog AI</label>
                  <p className="text-[11px] text-slate-500 font-medium">Jika dicentang, AI bisa menawarkan produk ini ke pelanggan via chat.</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-slate-100">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-3 text-slate-600 font-bold hover:bg-slate-100 rounded-xl transition-colors">Batal</button>
                <button type="submit" className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold rounded-xl shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all">
                  Simpan Produk
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
