'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { MessageSquare, Bot, ShieldAlert, Banknote, Percent, Download } from 'lucide-react';

export default function AnalyticsPage() {
  const [data, setData] = useState<any>(null);
  const [advancedData, setAdvancedData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch('/api/dashboard/analytics').then(res => res.json()),
      fetch('/api/dashboard/analytics/advanced').then(res => res.json())
    ])
      .then(([baseJson, advJson]) => {
        setData(baseJson);
        setAdvancedData(advJson);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  const handleExportCSV = async () => {
    try {
      window.location.href = '/api/dashboard/analytics/export';
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-500">Memuat data analitik...</div>;
  }

  if (!data || !data.summary) {
    return <div className="p-8 text-center text-red-500">Gagal memuat data.</div>;
  }

  const { summary, chartData } = data;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-20 p-4 md:p-8 animate-in fade-in duration-700">
      {/* Header Premium */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white/60 backdrop-blur-lg p-8 rounded-3xl border border-white/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)] relative overflow-hidden">
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-cyan-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -left-20 -bottom-20 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-slate-900 via-cyan-900 to-slate-900 bg-clip-text text-transparent flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-2xl shadow-lg shadow-cyan-500/20">
              <BarChart className="w-8 h-8 text-white" />
            </div>
            Laporan Kinerja & Analytics
          </h1>
          <p className="text-slate-500 mt-2 font-medium text-lg ml-14">Pantau performa Chatbot AI, jumlah chat, dan konversi penjualan Anda (7 Hari Terakhir).</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="relative z-10 bg-gradient-to-r from-slate-800 to-slate-900 text-white px-6 py-3.5 rounded-2xl font-bold shadow-md shadow-slate-900/20 hover:shadow-slate-900/40 hover:-translate-y-0.5 transition-all flex items-center gap-2"
        >
          <Download size={20} />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-5 relative z-10">
        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col justify-between hover:shadow-xl hover:shadow-blue-100/50 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-100 to-blue-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Total Chat Masuk</p>
            <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{summary.totalChats}</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col justify-between hover:shadow-xl hover:shadow-purple-100/50 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-purple-100 to-purple-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Bot className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Dijawab AI</p>
            <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600">{summary.aiAnswered}</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col justify-between hover:shadow-xl hover:shadow-emerald-100/50 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Banknote className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Omset Penjualan</p>
            <p className="text-2xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500">Rp {summary.revenue.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col justify-between hover:shadow-xl hover:shadow-amber-100/50 transition-all group">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-100 to-amber-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
              <Percent className="w-6 h-6 text-amber-600" />
            </div>
          </div>
          <div>
            <p className="text-sm font-bold text-slate-500">Conversion Rate</p>
            <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">{summary.conversionRate}%</p>
          </div>
        </div>

        {advancedData && (
          <div className="bg-white/80 backdrop-blur-xl p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white/60 flex flex-col justify-between hover:shadow-xl hover:shadow-indigo-100/50 transition-all group">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-indigo-100 to-indigo-50 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                <svg className="w-6 h-6 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div>
              <p className="text-sm font-bold text-slate-500">Waktu Balas Admin</p>
              <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-purple-500">
                {advancedData.averageResponseTimeMinutes > 0 
                  ? `${advancedData.averageResponseTimeMinutes} mnt` 
                  : `${Math.floor(advancedData.averageResponseTimeMs / 1000)} dtk`}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Chat Volume Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            Volume Chat (7 Hari)
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }} />
                <Bar dataKey="aiAnswered" name="Dijawab AI" fill="#8b5cf6" radius={[4, 4, 0, 0]} stackId="a" />
                <Bar dataKey="handover" name="Handover Admin" fill="#f59e0b" radius={[4, 4, 0, 0]} stackId="a" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Traffic Line Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            Tren Interaksi Total
          </h2>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                <Tooltip cursor={{ stroke: '#cbd5e1' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="chats" name="Total Chat Masuk" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Sentiment Analysis Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            Analisis Sentimen (7 Hari)
          </h2>
          <div className="h-[300px] w-full flex justify-center items-center">
            {data.sentimentData && data.sentimentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {data.sentimentData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-slate-400">Belum ada data sentimen yang cukup.</p>
            )}
          </div>
        </div>

        {/* Top Selling Products */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
          <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            Produk Terlaris (7 Hari)
          </h2>
          <div className="w-full overflow-x-auto">
            {data.topProducts && data.topProducts.length > 0 ? (
              <table className="w-full text-left text-sm text-slate-600">
                <thead className="bg-slate-50 text-slate-500 font-medium">
                  <tr>
                    <th className="p-3 rounded-tl-lg">Nama Produk</th>
                    <th className="p-3">Terjual</th>
                    <th className="p-3 rounded-tr-lg">Pendapatan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.topProducts.map((p: any) => (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-medium text-slate-800">{p.name}</td>
                      <td className="p-3">{p.quantity} pcs</td>
                      <td className="p-3 text-emerald-600 font-medium">Rp {p.revenue.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="text-sm text-slate-400 text-center py-8">Belum ada penjualan produk.</p>
            )}
          </div>
        </div>

        {/* Top FAQs Chart */}
        {advancedData && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              Top FAQ / Topik Terpopuler
            </h2>
            <div className="h-[300px] w-full">
              {advancedData.topFaqs && advancedData.topFaqs.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={advancedData.topFaqs} layout="vertical" margin={{ top: 10, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                    <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <YAxis type="category" dataKey="title" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#475569' }} width={120} />
                    <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Bar dataKey="count" name="Jumlah Ditanyakan" fill="#ec4899" radius={[0, 4, 4, 0]} barSize={20} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <p className="text-sm text-slate-400">Belum ada data FAQ tercatat.</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sales Leaderboard */}
        {advancedData && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              Papan Peringkat Tim Sales (Closing Terbanyak)
            </h2>
            <div className="w-full overflow-x-auto">
              {advancedData.salesLeaderboard && advancedData.salesLeaderboard.length > 0 ? (
                <table className="w-full text-left text-sm text-slate-600">
                  <thead className="bg-slate-50 text-slate-500 font-medium">
                    <tr>
                      <th className="p-3 rounded-tl-lg">Peringkat</th>
                      <th className="p-3">Nama Admin / CS</th>
                      <th className="p-3 rounded-tr-lg">Total Closing</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {advancedData.salesLeaderboard.map((admin: any, idx: number) => (
                      <tr key={admin.id} className="hover:bg-slate-50 transition">
                        <td className="p-3 font-bold text-slate-800">
                          {idx === 0 ? '🏆 #1' : idx === 1 ? '🥈 #2' : idx === 2 ? '🥉 #3' : `#${idx + 1}`}
                        </td>
                        <td className="p-3 font-medium text-slate-700">{admin.name}</td>
                        <td className="p-3 text-emerald-600 font-bold">{admin.convertedLeads} Deals</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-slate-400 text-center py-8">Belum ada data closing sales yang di-assign.</p>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
