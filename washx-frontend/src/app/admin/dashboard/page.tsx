'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAdmin } from '@/context/AdminContext';
import AdminShell from '@/components/AdminShell';
import { TrendingUp, Package, Clock, Truck, CheckCircle2, XCircle, DollarSign, RefreshCw } from 'lucide-react';

interface Stats {
  totalOrders?: number; todayOrders?: number; pendingPickup?: number;
  inWashing?: number; washingDone?: number; outForDelivery?: number;
  delivered?: number; cancelled?: number;
  totalRevenue?: number; todayRevenue?: number; todayOrderRevenue?: number;
}

const STAT_CARDS = (s: Stats) => {
  const totRev = s?.totalRevenue ?? 0;
  const todRev = s?.todayRevenue ?? s?.todayOrderRevenue ?? 0;
  return [
    { icon: <Package size={22} />,      label: 'Total Orders',     value: s?.totalOrders ?? 0,    sub: `${s?.todayOrders ?? 0} today`,         color: '#6366f1', bg: 'rgba(99,102,241,0.1)'  },
    { icon: <DollarSign size={22} />,   label: 'Total Revenue',    value: `₹${totRev.toLocaleString('en-IN')}`, sub: `₹${todRev.toLocaleString('en-IN')} today`, color: '#10b981', bg: 'rgba(16,185,129,0.1)' },
    { icon: <Clock size={22} />,        label: 'Pending Pickup',   value: s?.pendingPickup ?? 0,  sub: 'Awaiting agent',                 color: '#f59e0b', bg: 'rgba(245,158,11,0.1)'  },
    { icon: <TrendingUp size={22} />,   label: 'In Washing',       value: s?.inWashing ?? 0,      sub: 'At facility',                    color: '#06b6d4', bg: 'rgba(6,182,212,0.1)'   },
    { icon: <CheckCircle2 size={22} />, label: 'Ready/Scheduled',  value: s?.washingDone ?? 0,    sub: 'Awaiting delivery booking',      color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)'  },
    { icon: <Truck size={22} />,        label: 'Out for Delivery', value: s?.outForDelivery ?? 0, sub: 'En route',                       color: '#ec4899', bg: 'rgba(236,72,153,0.1)'  },
    { icon: <CheckCircle2 size={22} />, label: 'Delivered',        value: s?.delivered ?? 0,      sub: 'Completed',                      color: '#10b981', bg: 'rgba(16,185,129,0.08)' },
    { icon: <XCircle size={22} />,      label: 'Cancelled',        value: s?.cancelled ?? 0,      sub: 'All time',                       color: '#ef4444', bg: 'rgba(239,68,68,0.08)'  },
  ];
};

export default function AdminDashboardPage() {
  const { apiCall } = useAdmin();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall('GET', '/admin/stats') as Stats;
      setStats(data);
      setLastUpdated(new Date());
    } catch { /* swallow */ }
    finally { setLoading(false); }
  }, [apiCall]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const t = setInterval(fetchStats, 30000);
    return () => clearInterval(t);
  }, [fetchStats]);

  return (
    <AdminShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>📊 Overview</h1>
          <p style={{ color: '#71717a', fontSize: 14 }}>
            {lastUpdated ? `Last updated ${lastUpdated.toLocaleTimeString('en-IN')}` : 'Loading...'}
          </p>
        </div>
        <button
          onClick={fetchStats}
          disabled={loading}
          style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', color: '#a1a1aa', fontSize: 14 }}
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
        </button>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16, marginBottom: 36 }}>
        {stats ? STAT_CARDS(stats).map((card, i) => (
          <motion.div
            key={i}
            className="glass"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            style={{ padding: 20, borderLeft: `3px solid ${card.color}` }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: card.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color: card.color }}>
                {card.icon}
              </div>
            </div>
            <div style={{ fontSize: 28, fontWeight: 900, color: card.color, marginBottom: 4 }}>{card.value}</div>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 2 }}>{card.label}</div>
            <div style={{ fontSize: 12, color: '#52525b' }}>{card.sub}</div>
          </motion.div>
        )) : Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="glass shimmer" style={{ height: 120, borderRadius: 12 }} />
        ))}
      </div>

      {/* Order pipeline bar */}
      {stats && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="glass" style={{ padding: 24, marginBottom: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>🔄 Order Pipeline</h2>
          <div style={{ display: 'flex', gap: 0, borderRadius: 12, overflow: 'hidden', height: 36 }}>
            {[
              { label: 'Pickup', count: stats.pendingPickup ?? 0, color: '#f59e0b' },
              { label: 'Washing', count: stats.inWashing ?? 0, color: '#06b6d4' },
              { label: 'Ready', count: stats.washingDone ?? 0, color: '#8b5cf6' },
              { label: 'Delivery', count: stats.outForDelivery ?? 0, color: '#ec4899' },
              { label: 'Done', count: stats.delivered ?? 0, color: '#10b981' },
            ].map((seg) => {
              const total = (stats.pendingPickup ?? 0) + (stats.inWashing ?? 0) + (stats.washingDone ?? 0) + (stats.outForDelivery ?? 0) + (stats.delivered ?? 0) || 1;
              const pct = (seg.count / total) * 100;
              return pct > 0 ? (
                <div key={seg.label} style={{ flex: pct, background: seg.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: 'white', opacity: 0.9, minWidth: seg.count > 0 ? 40 : 0, transition: 'flex 0.5s' }}>
                  {seg.count > 0 && `${seg.label} (${seg.count})`}
                </div>
              ) : null;
            })}
          </div>
          <div style={{ display: 'flex', gap: 20, marginTop: 12, flexWrap: 'wrap' }}>
            {[
              { label: 'Pending Pickup', color: '#f59e0b' },
              { label: 'In Washing', color: '#06b6d4' },
              { label: 'Ready', color: '#8b5cf6' },
              { label: 'Out for Delivery', color: '#ec4899' },
              { label: 'Delivered', color: '#10b981' },
            ].map((l) => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#71717a' }}>
                <div style={{ width: 10, height: 10, borderRadius: 3, background: l.color }} />{l.label}
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Quick links */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
        {[
          { href: '/admin/orders', label: '📋 View All Orders', desc: 'Filter, search, paginate' },
          { href: '/admin/kanban', label: '🗂️ Kanban Board', desc: 'Drag orders through pipeline' },
          { href: '/admin/agents', label: '🛵 Manage Agents', desc: 'Add/edit pickup & delivery agents' },
        ].map((l) => (
          <a key={l.href} href={l.href} style={{ textDecoration: 'none' }}>
            <div className="glass glass-hover" style={{ padding: 20, cursor: 'pointer' }}>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>{l.label}</div>
              <div style={{ color: '#71717a', fontSize: 13 }}>{l.desc}</div>
            </div>
          </a>
        ))}
      </div>
    </AdminShell>
  );
}
