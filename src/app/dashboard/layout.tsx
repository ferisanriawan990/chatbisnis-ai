'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect } from 'next/navigation';
import { usePathname } from 'next/navigation';
import { BotMessageSquare, Menu, X, Settings, FileJson, Users, MessageSquare, CreditCard, LayoutDashboard, Inbox, Database, Box } from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login');
    },
  });

  const pathname = usePathname();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Prevent scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [mobileMenuOpen]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <span className="animate-pulse text-blue-600 font-medium">Memuat dashboard...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile) */}
      <aside className={`fixed md:sticky top-0 left-0 z-50 w-64 h-screen bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            ChatBisnis AI
          </h1>
          <button className="md:hidden text-slate-500" onClick={() => setMobileMenuOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link 
            href="/dashboard" 
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === '/dashboard' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="font-medium">Overview</span>
          </Link>
          <Link 
            href="/dashboard/chatbot" 
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === '/dashboard/chatbot' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <BotMessageSquare className="w-5 h-5" />
            <span className="font-medium">AI Chatbot</span>
          </Link>

          <Link 
            href="/dashboard/knowledge" 
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === '/dashboard/knowledge' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Database className="w-5 h-5 mr-3" />
            <span className="font-medium">Knowledge Base</span>
          </Link>
          <Link 
            href="/dashboard/products" 
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === '/dashboard/products' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Box className="w-5 h-5 mr-3" />
            <span className="font-medium">Katalog Produk</span>
          </Link>

          <Link 
            href="/dashboard/inbox" 
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === '/dashboard/inbox' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Inbox className="w-5 h-5" />
            <span className="font-medium">Live Chat Inbox</span>
          </Link>

          <Link 
            href="/dashboard/whatsapp" 
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === '/dashboard/whatsapp' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Settings className="w-5 h-5" />
            <span className="font-medium">Status WhatsApp</span>
          </Link>
          <Link 
            href="/dashboard/leads" 
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === '/dashboard/leads' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="font-medium">Leads</span>
          </Link>
          <Link 
            href="/dashboard/chat-logs" 
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === '/dashboard/chat-logs' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <MessageSquare className="w-5 h-5" />
            <span className="font-medium">Chat Logs</span>
          </Link>
          <Link 
            href="/dashboard/billing" 
            onClick={() => setMobileMenuOpen(false)}
            className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
              pathname === '/dashboard/billing' ? 'bg-blue-50 text-blue-700' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-5 h-5" />
            <span className="font-medium">Billing</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-200">
          <div className="mb-4 px-3 text-sm text-slate-500 truncate">
            {session?.user?.email}
          </div>
          <LogoutButton />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-h-screen w-full md:w-[calc(100%-16rem)]">
        {/* Mobile Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sticky top-0 z-30 md:hidden">
          <div className="flex items-center gap-3">
            <button className="text-slate-500 hover:text-slate-700" onClick={() => setMobileMenuOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <h1 className="text-xl font-bold text-blue-600">ChatBisnis AI</h1>
          </div>
        </header>

        <div className="flex-1 p-4 md:p-8 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
