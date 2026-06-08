import { ReactNode } from 'react';
import Link from 'next/link';
import { requireAdmin } from '@/lib/admin-helper';
import { redirect } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Key,
  Server,
  Workflow,
  CreditCard,
  Activity,
  History,
  ArrowLeft
} from 'lucide-react';

const navItems = [
  { name: 'Overview', href: '/admin', icon: LayoutDashboard },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'API Keys', href: '/admin/api-keys', icon: Key },
  { name: 'WAHA Servers', href: '/admin/waha-servers', icon: Server },
  { name: 'n8n Templates', href: '/admin/n8n-templates', icon: Workflow },
  { name: 'Plans', href: '/admin/plans', icon: CreditCard },
  { name: 'Usage', href: '/admin/usage', icon: Activity },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: History },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  if (!admin) {
    redirect('/dashboard');
  }

  return (
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col">
        <div className="p-6">
          <h2 className="text-xl font-bold text-white tracking-tight">Super Admin</h2>
          <p className="text-xs text-slate-500 mt-1">ChatBisnis AI</p>
        </div>

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-800 hover:text-white transition-colors"
            >
              <item.icon className="w-5 h-5" />
              {item.name}
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to User Dashboard
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
