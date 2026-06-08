'use client';

import { LogOut } from 'lucide-react';
import { signOut } from 'next-auth/react';

export default function LogoutButton() {
  const handleLogout = () => {
    signOut({ callbackUrl: '/login' });
  };

  return (
    <button 
      type="button"
      onClick={handleLogout}
      className="flex items-center gap-3 px-3 py-2 text-slate-600 rounded-lg hover:bg-slate-50 hover:text-red-600 transition-colors cursor-pointer w-full text-left"
    >
      <LogOut className="w-5 h-5" />
      <span className="font-medium">Logout</span>
    </button>
  );
}
