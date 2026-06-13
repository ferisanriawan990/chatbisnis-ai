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
    <div className="max-w-6xl mx-auto p-6 space-y-8">
      <div className="mb-8 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Laporan Kinerja & Analytics</h1>
          <p className="text-slate-500 mt-1">Pantau performa Chatbot AI, jumlah chat, dan konversi penjualan Anda (7 Hari Terakhir).</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-sm font-medium transition"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-blue-50 p-4 rounded-xl text-blue-600"><MessageSquare className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Total Chat Masuk</p>
            <p className="text-2xl font-bold text-slate-800">{summary.totalChats}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-purple-50 p-4 rounded-xl text-purple-600"><Bot className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Dijawab AI</p>
            <p className="text-2xl font-bold text-slate-800">{summary.aiAnswered}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-emerald-50 p-4 rounded-xl text-emerald-600"><Banknote className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Omset Penjualan</p>
            <p className="text-2xl font-bold text-slate-800">Rp {summary.revenue.toLocaleString('id-ID')}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
          <div className="bg-amber-50 p-4 rounded-xl text-amber-600"><Percent className="w-6 h-6" /></div>
          <div>
            <p className="text-sm text-slate-500 font-medium">Conversion Rate</p>
            <p className="text-2xl font-bold text-slate-800">{summary.conversionRate}%</p>
          </div>
        </div>

        {advancedData && (
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 flex items-center gap-4">
            <div className="bg-indigo-50 p-4 rounded-xl text-indigo-600">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p className="text-sm text-slate-500 font-medium">Waktu Balas Admin</p>
              <p className="text-2xl font-bold text-slate-800">
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
