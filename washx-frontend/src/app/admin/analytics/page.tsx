'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAdmin } from '@/context/AdminContext';
import AdminShell from '@/components/AdminShell';
import { BarChart3, TrendingUp, MapPin, AlertTriangle, ShieldCheck, RefreshCw, IndianRupee, Layers } from 'lucide-react';

interface CityRev {
  city: string;
  revenue: number;
  orders: number;
}

interface AnalyticsData {
  totalOrders: number;
  totalRevenue: number;
  subscriptionRevenue: number;
  orderRevenue: number;
  activeSubscriptions: number;
  delivered: number;
  cancelled: number;
  cityRevenue: CityRev[];
}

export default function AdminAnalyticsPage() {
  const { apiCall } = useAdmin();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = useCallback(async () => {
    setLoading(true);
    try {
      const stats = (await apiCall('GET', '/admin/stats')) as AnalyticsData;
      setData(stats);
    } catch {
      // Handled gracefully
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const maxCityRev = Math.max(...(data?.cityRevenue?.map((c) => c.revenue) || [1]));
  const fulfillmentRate = data && data.totalOrders > 0
    ? Math.round((data.delivered / data.totalOrders) * 100)
    : 0;
  const cancellationRate = data && data.totalOrders > 0
    ? Math.round((data.cancelled / data.totalOrders) * 100)
    : 0;

  return (
    <AdminShell>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: 10 }}>
              <BarChart3 size={26} color="#06b6d4" /> Business & Operational Analytics
            </h1>
            <p style={{ color: '#71717a', fontSize: 14, marginTop: 4 }}>
              Revenue attribution, city performance, order fulfillment, and churn metrics
            </p>
          </div>
          <button
            onClick={fetchAnalytics}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, color: '#a1a1aa', cursor: 'pointer', fontSize: 13,
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh Data
          </button>
        </div>

        {/* Top Key Metrics */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 24 }}>
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#71717a', fontSize: 13, marginBottom: 8 }}>
              <span>Fulfillment Rate</span>
              <ShieldCheck size={18} color="#10b981" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#34d399' }}>{fulfillmentRate}%</div>
            <div style={{ fontSize: 12, color: '#71717a', marginTop: 4 }}>{data?.delivered || 0} orders delivered successfully</div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#71717a', fontSize: 13, marginBottom: 8 }}>
              <span>Cancellation Rate</span>
              <AlertTriangle size={18} color="#ef4444" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#f87171' }}>{cancellationRate}%</div>
            <div style={{ fontSize: 12, color: '#71717a', marginTop: 4 }}>{data?.cancelled || 0} total cancellations</div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#71717a', fontSize: 13, marginBottom: 8 }}>
              <span>Subscription MRR</span>
              <Layers size={18} color="#a78bfa" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#c084fc' }}>₹{(data?.subscriptionRevenue || 0).toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 12, color: '#71717a', marginTop: 4 }}>{data?.activeSubscriptions || 0} active subscribers</div>
          </div>

          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 14, padding: '20px',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#71717a', fontSize: 13, marginBottom: 8 }}>
              <span>Total Revenue</span>
              <IndianRupee size={18} color="#06b6d4" />
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#38bdf8' }}>₹{(data?.totalRevenue || 0).toLocaleString('en-IN')}</div>
            <div style={{ fontSize: 12, color: '#71717a', marginTop: 4 }}>Orders + Subscriptions combined</div>
          </div>
        </div>

        {/* City Breakdown & Revenue Mix */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: 20 }}>
          {/* City Revenue Performance */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <MapPin size={18} color="#06b6d4" />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f4f4f5' }}>Revenue by City</h3>
            </div>

            {!data?.cityRevenue || data.cityRevenue.length === 0 ? (
              <div style={{ color: '#71717a', textAlign: 'center', padding: '40px 0', fontSize: 13 }}>
                No city-level revenue records found yet.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {data.cityRevenue.map((item, idx) => {
                  const pct = Math.round((item.revenue / (maxCityRev || 1)) * 100);
                  return (
                    <div key={idx}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, color: '#e4e4e7' }}>{item.city}</span>
                        <span style={{ color: '#a1a1aa' }}>
                          ₹{item.revenue.toLocaleString('en-IN')}{' '}
                          <span style={{ color: '#71717a', fontSize: 11 }}>({item.orders} orders)</span>
                        </span>
                      </div>
                      <div style={{
                        height: 8, background: 'rgba(255,255,255,0.06)', borderRadius: 99,
                        overflow: 'hidden',
                      }}>
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 0.8, delay: idx * 0.1 }}
                          style={{
                            height: '100%',
                            background: idx === 0
                              ? 'linear-gradient(90deg, #06b6d4, #3b82f6)'
                              : 'linear-gradient(90deg, #7c3aed, #a855f7)',
                            borderRadius: 99,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Revenue Split (Orders vs Subscriptions) */}
          <div style={{
            background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16, padding: '24px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
              <TrendingUp size={18} color="#a78bfa" />
              <h3 style={{ fontSize: 16, fontWeight: 700, color: '#f4f4f5' }}>Revenue Mix</h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, justifyContent: 'center' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: '#e4e4e7' }}>Laundry Orders (Pay-per-wash)</span>
                  <span style={{ color: '#38bdf8' }}>₹{(data?.orderRevenue || 0).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${data?.totalRevenue ? Math.round(((data.orderRevenue || 0) / data.totalRevenue) * 100) : 0}%`,
                    background: 'linear-gradient(90deg, #06b6d4, #38bdf8)',
                  }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                  <span style={{ fontWeight: 600, color: '#e4e4e7' }}>WashX Passes & Subscriptions</span>
                  <span style={{ color: '#c084fc' }}>₹{(data?.subscriptionRevenue || 0).toLocaleString('en-IN')}</span>
                </div>
                <div style={{ height: 10, background: 'rgba(255,255,255,0.06)', borderRadius: 99, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: `${data?.totalRevenue ? Math.round(((data.subscriptionRevenue || 0) / data.totalRevenue) * 100) : 0}%`,
                    background: 'linear-gradient(90deg, #7c3aed, #c084fc)',
                  }} />
                </div>
              </div>

              {/* Summary pill banner */}
              <div style={{
                marginTop: 20, padding: '14px 16px', background: 'rgba(124,58,237,0.1)',
                border: '1px solid rgba(124,58,237,0.2)', borderRadius: 12, fontSize: 13, color: '#d4d4d8',
                lineHeight: 1.5,
              }}>
                💡 <strong>Fair Usage Policy (FUP) Health:</strong> {data?.activeSubscriptions || 0} active subscribers are monitored hourly for quota limits. Express turnarounds are guaranteed within 24h.
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminShell>
  );
}
