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
  X
} from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import LogoutButton from '@/components/LogoutButton';

const navItems = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Templates', href: '/admin/templates', icon: Workflow },
  { name: 'API Keys', href: '/admin/api-keys', icon: Key },
  { name: 'WAHA Servers', href: '/admin/waha-servers', icon: Server },
  { name: 'n8n Templates', href: '/admin/n8n-templates', icon: Workflow },
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
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-16 bg-slate-900 flex items-center justify-between px-4 z-20">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold text-white tracking-tight">Super Admin</h2>
        </div>
        <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="text-slate-300 hover:text-white p-2">
          {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-30" 
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-300
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 hidden lg:block">
          <h2 className="text-xl font-bold text-white tracking-tight">Super Admin</h2>
          <p className="text-xs text-slate-500 mt-1">ChatBisnis AI</p>
        </div>

        <nav className="flex-1 px-4 py-6 lg:py-0 space-y-1 overflow-y-auto mt-16 lg:mt-0">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'bg-indigo-600 text-white' : 'hover:bg-slate-800 hover:text-white'
                }`}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-800 flex flex-col gap-4">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to User Dashboard
          </Link>
          <div className="text-sm text-slate-400 hover:text-white transition-colors">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto mt-16 lg:mt-0 p-4 lg:p-8 w-full">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <Toaster position="top-right" />
    </div>
  );
}
