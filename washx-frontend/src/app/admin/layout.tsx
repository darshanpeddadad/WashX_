import { AdminProvider } from '@/context/AdminContext';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'WashX Admin Dashboard',
  description: 'WashX internal order management and analytics dashboard',
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminProvider>{children}</AdminProvider>;
}
