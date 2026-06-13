'use client';

import { ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Users, Server, ShieldAlert, LogOut } from 'lucide-react';
import LogoutButton from '@/components/LogoutButton';

export default function SuperAdminLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login');
    },
  });

  const pathname = usePathname();

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  // Super Admin Authorization Check
  if ((session?.user as any)?.role !== 'ADMIN') {
    redirect('/dashboard'); // Redirect normal users back to their tenant dashboard
  }

  return (
    <div className="min-h-screen flex bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col hidden md:flex border-r border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-red-500" />
            Super Admin
          </h1>
        </div>
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          <Link 
            href="/super-admin" 
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === '/super-admin' ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Overview</span>
          </Link>
          <Link 
            href="/super-admin/tenants" 
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname.includes('/super-admin/tenants') ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Semua Tenant</span>
          </Link>
          <Link 
            href="/super-admin/servers" 
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname.includes('/super-admin/servers') ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Server className="w-5 h-5" />
            <span className="font-medium">Gateway Servers</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-800">
          <div className="mb-4 px-3 text-sm text-slate-400 truncate">
            {session?.user?.email}
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen">
        <header className="bg-white border-b border-slate-200 h-16 flex items-center px-8 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-800">SaaS Master Control</h2>
        </header>
        <div className="flex-1 p-8 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
