/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { ReactNode, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Key,
  Server,
  Workflow,
  CreditCard,
  Activity,
  History,
  ArrowLeft,
  Menu,
  X,
  ShieldCheck
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import LogoutButton from '@/components/LogoutButton';

const navItems = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Templates', href: '/admin/templates', icon: Workflow },
  { name: 'API Keys', href: '/admin/api-keys', icon: Key },
  { name: 'WhatsApp Servers', href: '/admin/whatsapp-servers', icon: Server },
  { name: 'Plans', href: '/admin/plans', icon: CreditCard },
  { name: 'Usage', href: '/admin/usage', icon: Activity },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: History },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  // Close mobile menu on route change
  useEffect(() => { void setIsMobileMenuOpen(false); }, [pathname]);

  return (
    <div className="flex h-screen bg-[#F8FAFC] font-sans overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-1.5 rounded-lg"><ShieldCheck className="w-5 h-5 text-white" /></div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Super Admin</h2>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-600 hover:text-slate-900 p-2">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-30" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Clean Light Modern UI */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-8 hidden lg:flex items-center gap-3">
          <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-2 rounded-xl shadow-lg shadow-indigo-500/30">
            <ShieldCheck className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">Super Admin</h2>
            <p className="text-xs font-medium text-slate-400">ChatBisnis AI Suite</p>
          </div>
        </div>

        <nav className="flex-1 px-4 py-6 lg:py-0 space-y-1.5 overflow-y-auto mt-16 lg:mt-0">
          <div className="px-3 mb-2 text-xs font-bold tracking-wider text-slate-400 uppercase">System Management</div>
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                  isActive 
                    ? 'bg-indigo-50 text-indigo-700' 
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <item.icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-100 flex flex-col gap-4 bg-slate-50/50">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors p-2 rounded-lg hover:bg-indigo-50"
          >
            <div className="bg-white p-1.5 rounded-md shadow-sm border border-slate-200"><ArrowLeft className="w-4 h-4" /></div>
            User Dashboard
          </Link>
          <div className="pt-2">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto mt-16 lg:mt-0 p-4 lg:p-10 w-full relative">
        <div className="absolute top-0 left-0 w-full h-64 bg-indigo-500/5 blur-[120px] rounded-full pointer-events-none -z-10"></div>
        <div className="max-w-7xl mx-auto z-10">
          {children}
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
