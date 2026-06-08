import { ReactNode } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { BotMessageSquare, LayoutDashboard, Settings, LogOut } from 'lucide-react';
import Link from 'next/link';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            ChatBisnis AI
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <Link href="/dashboard/chatbot" className="flex items-center gap-3 px-3 py-2 bg-blue-50 text-blue-700 rounded-lg transition-colors">
            <BotMessageSquare className="w-5 h-5" />
            <span className="font-medium">AI Chatbot</span>
          </Link>
        </nav>
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center gap-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Mobile Header */}
        <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 md:hidden">
          <h1 className="text-xl font-bold text-blue-600">ChatBisnis AI</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
