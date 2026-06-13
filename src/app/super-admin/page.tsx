import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Users, Building2, MessageCircle, Server } from "lucide-react";

export const metadata = {
  title: 'Super Admin - ChatBisnis AI',
};

export default async function SuperAdminDashboard() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user as any)?.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  // Fetch Global Stats
  const totalTenants = await prisma.businessProfile.count();
  const totalUsers = await prisma.user.count();
  const activeBots = await prisma.chatbotSetting.count({ where: { isActive: true } });
  
  // Aggregate Usage
  const globalUsage = await prisma.usageCounter.aggregate({
    _sum: { aiChats: true, whatsappMessages: true }
  });

  const recentTenants = await prisma.businessProfile.findMany({
    orderBy: { createdAt: 'desc' },
    take: 10,
    include: { user: { select: { name: true, email: true } } }
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Platform Overview</h1>
        <p className="text-slate-500">Ringkasan performa keseluruhan ekosistem SaaS ChatBisnis AI.</p>
      </div>

      {/* Global Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Tenants</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{totalTenants}</p>
            </div>
            <div className="w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-6 h-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Pengguna</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{totalUsers}</p>
            </div>
            <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Bot Aktif</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{activeBots}</p>
            </div>
            <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
              <Server className="w-6 h-6 text-emerald-600" />
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">Total Pesan AI</p>
              <p className="text-3xl font-bold text-slate-900 mt-2">{globalUsage._sum.aiChats || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-50 rounded-lg flex items-center justify-center">
              <MessageCircle className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Tenant List */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-semibold text-slate-800">Tenant Terbaru</h3>
        </div>
        <div className="p-0">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nama Bisnis</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Admin Phone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Terdaftar Pada</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {recentTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-slate-900">{tenant.businessName}</div>
                    <div className="text-sm text-slate-500">{tenant.user.name} ({tenant.user.email})</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {tenant.adminPhone || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {tenant.createdAt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                </tr>
              ))}
              {recentTenants.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-slate-500">Belum ada data bisnis.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
