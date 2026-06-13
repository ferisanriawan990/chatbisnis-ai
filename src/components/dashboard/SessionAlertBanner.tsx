'use client';

import { useState, useEffect } from 'react';
import { AlertTriangle, WifiOff } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function SessionAlertBanner() {
  const [isDisconnected, setIsDisconnected] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    // Don't show on super-admin or public pages
    if (pathname.startsWith('/super-admin') || pathname.startsWith('/login')) {
      return;
    }

    let isMounted = true;
    
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/dashboard/whatsapp/status');
        if (res.ok) {
          const data = await res.json();
          if (isMounted) {
            setIsDisconnected(data.status === 'disconnected');
          }
        }
      } catch (error) {
        // Ignore fetch errors to avoid spamming the console if server is down
      }
    };

    // Check immediately
    checkStatus();

    // Polling every 2 minutes (120,000 ms)
    const intervalId = setInterval(checkStatus, 120_000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, [pathname]);

  if (!isDisconnected) return null;

  return (
    <div className="bg-red-500 text-white px-4 py-3 flex items-center justify-between shadow-md z-50">
      <div className="flex items-center gap-3">
        <div className="p-1.5 bg-red-600 rounded-lg">
          <WifiOff className="w-5 h-5 text-white animate-pulse" />
        </div>
        <div>
          <p className="font-bold text-sm md:text-base flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> GAWAT! Bot WhatsApp Terputus!
          </p>
          <p className="text-xs md:text-sm text-red-100">
            Chatbisnis AI tidak dapat merespons pelanggan. Silakan scan ulang QR Code segera.
          </p>
        </div>
      </div>
      <Link 
        href="/dashboard/whatsapp" 
        className="shrink-0 bg-white text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg text-sm font-bold shadow-sm transition-colors"
      >
        Perbaiki Sekarang
      </Link>
    </div>
  );
}
