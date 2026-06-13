'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { redirect, usePathname } from 'next/navigation';
import { 
  Bot, Settings, BookOpen, Package, MessageSquare, Phone, 
  Users, CreditCard, LayoutDashboard, Send, Inbox, Database, 
  Box, X, Menu, BotMessageSquare, BarChart3, Shield, ShoppingCart, Star, History, Megaphone, Sparkles, UserCircle
} from 'lucide-react';
import Link from 'next/link';
import LogoutButton from '@/components/LogoutButton';
import SessionAlertBanner from '@/components/dashboard/SessionAlertBanner';

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession({
    required: true,
    onUnauthenticated() {
      redirect('/login');
    },
  });

  const pathname = usePathname();

  // Phase 35: Admin Presence Ping
  useEffect(() => {
    if (status !== 'authenticated') return;
    
    const pingServer = async () => {
      try {
        await fetch('/api/admin/ping', { method: 'POST' });
      } catch (e) {
        // silently fail
      }
    };
    pingServer(); // initial ping
    const interval = setInterval(pingServer, 30000); // every 30s
    return () => clearInterval(interval);
  }, [status]);  

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
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center space-y-4">
        <Sparkles className="w-8 h-8 text-indigo-500 animate-spin" />
        <span className="text-slate-500 font-medium tracking-wide">Memuat workspace Anda...</span>
      </div>
    );
  }

  const NavItem = ({ href, icon: Icon, label, colorClass = "text-indigo-600", bgClass = "bg-indigo-50" }: { href: string, icon: any, label: string, colorClass?: string, bgClass?: string }) => {
    const isActive = pathname === href;
    return (
      <Link 
        href={href} 
        onClick={() => setMobileMenuOpen(false)}
        className={`flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all duration-200 group ${
          isActive 
            ? `${bgClass} ${colorClass} font-bold shadow-sm border border-slate-200/40` 
            : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 font-medium border border-transparent'
        }`}
      >
        <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? colorClass : 'text-slate-400 group-hover:text-slate-700'}`} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex font-sans">
      <SessionAlertBanner />

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar (Desktop & Mobile) */}
      <aside className={`fixed md:sticky top-0 left-0 z-50 w-[280px] h-screen bg-white border-r border-slate-200/80 shadow-[4px_0_24px_rgba(0,0,0,0.02)] flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Logo Area */}
        <div className="p-6 md:p-8 flex items-center justify-between border-b border-slate-100/50">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 text-white p-2 rounded-xl shadow-md shadow-indigo-600/20 group-hover:shadow-lg group-hover:-translate-y-0.5 transition-all">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight leading-none">ChatBisnis</h1>
              <span className="text-[10px] uppercase font-bold tracking-widest text-indigo-500">AI Workspace</span>
            </div>
          </Link>
          <button className="md:hidden text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors" onClick={() => setMobileMenuOpen(false)}>
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Area */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
          <div className="px-4 mb-3 mt-2 text-[11px] font-black tracking-widest text-slate-400 uppercase">Core Systems</div>
          <NavItem href="/dashboard" icon={LayoutDashboard} label="Overview" colorClass="text-blue-700" bgClass="bg-blue-50" />
          <NavItem href="/dashboard/chatbot" icon={BotMessageSquare} label="AI Chatbot" colorClass="text-indigo-700" bgClass="bg-indigo-50" />
          <NavItem href="/dashboard/knowledge" icon={Database} label="Knowledge Base" colorClass="text-emerald-700" bgClass="bg-emerald-50" />
          <NavItem href="/dashboard/whatsapp" icon={Phone} label="WhatsApp Device" colorClass="text-teal-700" bgClass="bg-teal-50" />
          
          <div className="px-4 mb-3 mt-8 text-[11px] font-black tracking-widest text-slate-400 uppercase">E-Commerce</div>
          <NavItem href="/dashboard/products" icon={Box} label="Katalog Produk" colorClass="text-amber-700" bgClass="bg-amber-50" />
          <NavItem href="/dashboard/orders" icon={ShoppingCart} label="Daftar Pesanan" colorClass="text-orange-700" bgClass="bg-orange-50" />
          <NavItem href="/dashboard/bookings" icon={BookOpen} label="Reservasi (Booking)" colorClass="text-pink-700" bgClass="bg-pink-50" />
          <NavItem href="/dashboard/testimonials" icon={Star} label="Testimoni" colorClass="text-yellow-700" bgClass="bg-yellow-50" />

          <div className="px-4 mb-3 mt-8 text-[11px] font-black tracking-widest text-slate-400 uppercase">Engagement & Logs</div>
          <NavItem href="/dashboard/inbox" icon={Inbox} label="Live Inbox" colorClass="text-sky-700" bgClass="bg-sky-50" />
          <NavItem href="/dashboard/chat-logs" icon={MessageSquare} label="History Chat" colorClass="text-slate-700" bgClass="bg-slate-100" />
          <NavItem href="/dashboard/leads" icon={Users} label="Lead CRM" colorClass="text-cyan-700" bgClass="bg-cyan-50" />
          <NavItem href="/dashboard/campaigns" icon={Megaphone} label="Campaigns" colorClass="text-rose-700" bgClass="bg-rose-50" />
          <NavItem href="/dashboard/broadcast" icon={Send} label="Broadcast" colorClass="text-violet-700" bgClass="bg-violet-50" />
          <NavItem href="/dashboard/analytics" icon={BarChart3} label="Analytics" colorClass="text-blue-700" bgClass="bg-blue-50" />

          <div className="px-4 mb-3 mt-8 text-[11px] font-black tracking-widest text-slate-400 uppercase">Organization</div>
          <NavItem href="/dashboard/team" icon={Shield} label="Manajemen Tim" colorClass="text-fuchsia-700" bgClass="bg-fuchsia-50" />
          <NavItem href="/dashboard/billing" icon={CreditCard} label="Billing & Plan" colorClass="text-green-700" bgClass="bg-green-50" />
          <NavItem href="/dashboard/settings/privacy" icon={Settings} label="Settings" colorClass="text-slate-700" bgClass="bg-slate-100" />
        </nav>

        {/* User Profile Footer */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <Link href="/dashboard/profile" className="flex items-center gap-3 p-3 bg-white hover:bg-indigo-50/50 rounded-xl border border-slate-200 shadow-sm mb-3 transition-colors group cursor-pointer">
            <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center text-indigo-700 font-bold overflow-hidden shrink-0">
              {/* To fully support avatar from session, next-auth needs custom callbacks. For now, use initials. Avatar will show in Profile Page. */}
              {session?.user?.name?.[0]?.toUpperCase() || <UserCircle className="w-5 h-5" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-700 transition-colors truncate">{session?.user?.name || 'User'}</p>
              <p className="text-[10px] uppercase font-bold text-slate-400 group-hover:text-indigo-500 transition-colors mt-0.5 tracking-wider">Atur Profil</p>
            </div>
          </Link>
          <div className="px-1">
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Background Decor */}
        <div className="absolute top-0 left-0 w-full h-80 bg-indigo-500/5 blur-[120px] rounded-b-full pointer-events-none z-0"></div>

        {/* Mobile Header (Sticky) */}
        <header className="md:hidden sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-slate-200 px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="bg-indigo-600 p-1.5 rounded-lg"><Bot className="w-5 h-5 text-white" /></div>
            <span className="font-bold text-slate-900">ChatBisnis</span>
          </div>
          <button onClick={() => setMobileMenuOpen(true)} className="p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-full transition-colors">
            <Menu className="w-6 h-6" />
          </button>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8 lg:p-10 z-10">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
