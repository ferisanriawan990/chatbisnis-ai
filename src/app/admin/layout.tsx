import { ReactNode } from 'react';
import { requireAdmin } from '@/lib/admin-helper';
import { redirect } from 'next/navigation';
import AdminShell from './AdminShell';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin();

  if (!admin) {
    redirect('/dashboard');
  }

  return <AdminShell>{children}</AdminShell>;
}
