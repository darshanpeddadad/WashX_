'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Plus, Clock, CheckCircle, ChevronRight, Zap, Crown, RefreshCw, Shirt, IndianRupee } from 'lucide-react';
import Navbar from '@/components/common/Navbar';
import MetricCard from '@/components/common/MetricCard';
import LoadingScreen from '@/components/common/LoadingScreen';
import OrderCard, { OrderItem } from '@/components/orders/OrderCard';

interface UserSub {
  isActive: boolean;
  plan: string | null;
  planDetails?: { name: string; turnaroundLabel: string; price: number };
  daysRemaining: number;
  turnaroundDays: number;
}

export default function DashboardPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [subscription, setSubscription] = useState<UserSub | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
  }, [user, isLoading, router]);

  useEffect(() => {
    if (user) {
      api.get('/orders').then((r) => setOrders(r.data)).catch(() => {}).finally(() => setLoading(false));
      api.get('/subscriptions/my').then((r) => setSubscription(r.data)).catch(() => {});
    }
  }, [user]);

  if (isLoading || !user) return <LoadingScreen message="Loading your dashboard..." />;

  const activeOrders = orders.filter((o) => !['DELIVERED', 'CANCELLED'].includes(o.status));
  const pastOrders = orders.filter((o) => ['DELIVERED', 'CANCELLED'].includes(o.status));

  const totalClothes = orders.reduce((s, o) => s + (o.clothesItems?.reduce((a, c) => a + (c.quantity || 0), 0) || 0), 0);
  const totalSpent = orders.filter((o) => o.status === 'DELIVERED').reduce((s, o) => s + o.totalPrice, 0);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Universal Navbar */}
      <Navbar />

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '36px 24px 80px' }}>
        {/* Welcome Header */}
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 'clamp(26px, 3.5vw, 34px)', fontWeight: 800, marginBottom: 6 }}>
            Hey, {user.name.split(' ')[0]} 👋
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15, margin: 0 }}>
            {user.city ? `Serving your doorstep laundry in ${user.city}` : 'Manage your laundry and track orders in real-time'}
          </p>
        </motion.div>

        {/* Subscription Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            marginBottom: 32,
            padding: '20px 24px',
            borderRadius: 20,
            background: subscription?.isActive
              ? 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))'
              : 'var(--bg-card)',
            border: subscription?.isActive
              ? '1px solid rgba(99,102,241,0.35)'
              : '1px solid var(--border-card)',
            boxShadow: 'var(--card-shadow)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 14,
                background: subscription?.isActive
                  ? 'linear-gradient(135deg, #6366f1, #06b6d4)'
                  : 'var(--tag-bg)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
              }}
            >
              {subscription?.isActive ? <Crown size={22} /> : <Zap size={22} color="#06b6d4" />}
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text-primary)' }}>
                  {subscription?.isActive
                    ? `${subscription.planDetails?.name || subscription.plan} Active`
                    : 'Standard Turnaround (3 Days)'}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 999,
                    background: subscription?.isActive ? 'rgba(16,185,129,0.2)' : 'var(--tag-bg)',
                    color: subscription?.isActive ? '#34d399' : 'var(--text-muted)',
                    border: '1px solid var(--border-subtle)',
                  }}
                >
                  {subscription?.isActive ? '⚡ 1-Day Express Enabled' : 'No Active Pass'}
                </span>
              </div>
              <p style={{ color: 'var(--text-secondary)', fontSize: 13, margin: 0 }}>
                {subscription?.isActive
                  ? `Your orders arrive in 24 hours. Pass active for ${subscription.daysRemaining} more days.`
                  : 'Get clothes back in 24 hours instead of 3 days with a Weekly (₹99) or Annual Express Pass.'}
              </p>
            </div>
          </div>

          <Link href="/subscription" style={{ textDecoration: 'none' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '10px 18px',
                borderRadius: 12,
                background: subscription?.isActive ? 'var(--tag-bg)' : 'linear-gradient(135deg, #6366f1, #06b6d4)',
                border: '1px solid var(--border-subtle)',
                color: '#ffffff',
                fontSize: 13,
                fontWeight: 700,
              }}
            >
              <span>{subscription?.isActive ? 'Manage Pass' : 'Upgrade to 1-Day Express'}</span>
              <ChevronRight size={14} />
            </div>
          </Link>
        </motion.div>

        {/* Metric KPI Cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 32,
          }}
        >
          <MetricCard
            icon={<RefreshCw size={20} />}
            label="Active Orders"
            value={activeOrders.length}
            accentColor="#06b6d4"
            subtitle="In progress"
          />
          <MetricCard
            icon={<Shirt size={20} />}
            label="Clothes Washed"
            value={totalClothes}
            accentColor="#8b5cf6"
            subtitle="Garments treated"
          />
          <MetricCard
            icon={<IndianRupee size={20} />}
            label="Total Spent"
            value={`₹${totalSpent}`}
            accentColor="#10b981"
            subtitle="Completed orders"
          />
        </div>

        {/* Quick Action: Book New Pickup */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          style={{ marginBottom: 36 }}
        >
          <Link href="/book" style={{ textDecoration: 'none' }}>
            <div
              style={{
                background: 'linear-gradient(135deg, rgba(99,102,241,0.12), rgba(6,182,212,0.08))',
                border: '1px solid rgba(99,102,241,0.35)',
                borderRadius: 20,
                padding: '22px 28px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                boxShadow: 'var(--card-shadow)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
              className="hover:border-indigo-500 hover:translate-y-[-2px]"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 8px 16px -4px rgba(99,102,241,0.5)',
                  }}
                >
                  <Plus size={24} color="#ffffff" />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 18, color: 'var(--text-primary)', marginBottom: 3 }}>
                    Book New Laundry Pickup
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: 14 }}>
                    Schedule doorstep pickup slot and select clothes
                  </div>
                </div>
              </div>
              <ChevronRight size={22} color="#6366f1" />
            </div>
          </Link>
        </motion.div>

        {/* Active Orders Section */}
        {activeOrders.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 36 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--text-primary)',
              }}
            >
              <Clock size={20} color="#06b6d4" />
              <span>Active Orders ({activeOrders.length})</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {activeOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Order History Section */}
        {pastOrders.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 36 }}>
            <h2
              style={{
                fontSize: 20,
                fontWeight: 800,
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--text-primary)',
              }}
            >
              <CheckCircle size={20} color="#10b981" />
              <span>Order History</span>
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {pastOrders.slice(0, 5).map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Empty State */}
        {orders.length === 0 && !loading && (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 24px',
              background: 'var(--bg-card)',
              borderRadius: 24,
              border: '1px solid var(--border-card)',
            }}
          >
            <div style={{ fontSize: 56, marginBottom: 16 }}>🧺</div>
            <div style={{ fontSize: 22, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>
              No orders placed yet
            </div>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 400, margin: '0 auto 24px' }}>
              Book your first laundry collection to experience doorstep steam wash and express delivery.
            </p>
            <Link
              href="/book"
              style={{
                textDecoration: 'none',
                color: '#ffffff',
                background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                padding: '12px 28px',
                borderRadius: 12,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>Book First Pickup</span>
              <Plus size={16} />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
