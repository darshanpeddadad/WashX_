'use client';
import { ReactNode, useEffect } from 'react';
import { useAdmin } from '@/context/AdminContext';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { LayoutDashboard, Table2, Kanban, Users, LogOut, Zap, Tag, BarChart3 } from 'lucide-react';

const NAV = [
  { href: '/admin/dashboard', icon: <LayoutDashboard size={18} />, label: 'Overview' },
  { href: '/admin/orders', icon: <Table2 size={18} />, label: 'Orders Table' },
  { href: '/admin/kanban', icon: <Kanban size={18} />, label: 'Kanban Board' },
  { href: '/admin/agents', icon: <Users size={18} />, label: 'Agents' },
  { href: '/admin/coupons', icon: <Tag size={18} />, label: 'Coupons & Promos' },
  { href: '/admin/analytics', icon: <BarChart3 size={18} />, label: 'Analytics' },
];

export default function AdminShell({ children }: { children: ReactNode }) {
  const { isAuthenticated, isLoading, logout } = useAdmin();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated && pathname !== '/admin/login') {
      router.push('/admin/login');
    }
  }, [isAuthenticated, isLoading, pathname, router]);

  if (pathname === '/admin/login') return <>{children}</>;
  if (isLoading || !isAuthenticated) return null;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#09090b' }}>
      {/* Sidebar */}
      <aside style={{ width: 220, background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)', padding: '24px 12px', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, bottom: 0, left: 0, zIndex: 50 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 8px', marginBottom: 32 }}>
          <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Zap size={16} color="white" />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: '#a78bfa' }}>WashX Admin</div>
            <div style={{ fontSize: 10, color: '#52525b' }}>Management Console</div>
          </div>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link key={item.href} href={item.href} style={{ textDecoration: 'none' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderRadius: 10, cursor: 'pointer', transition: 'all 0.15s',
                  background: active ? 'rgba(124,58,237,0.15)' : 'transparent',
                  color: active ? '#a78bfa' : '#71717a',
                  fontWeight: active ? 600 : 400, fontSize: 14,
                  border: active ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
                }}>
                  {item.icon}
                  {item.label}
                </div>
              </Link>
            );
          })}
        </nav>

        <button onClick={() => { logout(); router.push('/admin/login'); }} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 12px', background: 'none', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, cursor: 'pointer', color: '#71717a', fontSize: 14, width: '100%' }}>
          <LogOut size={16} /> Logout
        </button>
      </aside>

      {/* Main */}
      <main style={{ marginLeft: 220, flex: 1, padding: '32px 28px', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}
