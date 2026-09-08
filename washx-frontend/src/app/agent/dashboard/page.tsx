'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAgent } from '@/context/AgentContext';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { ORDER_STATUS_CONFIG } from '@/lib/constants';
import { LogOut, RefreshCw, Phone, MapPin, Package, Clock, CheckCircle2, Truck } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

interface Order {
  id: string; status: string; totalPrice: number;
  pickupSlot?: string; deliverySlot?: string;
  pickupAddress?: string; deliveryAddress?: string; city?: string;
  createdAt?: string;
  clothesItems: { type: string; quantity: number; service: string }[];
  user: { name: string; phone: string; address?: string };
  payment?: { status: string };
}

// Status transitions an agent can perform
const NEXT_STATUS: Record<string, { label: string; next: string; color: string; icon: string }> = {
  PICKUP_SCHEDULED:   { next: 'PICKED_UP',        label: 'Mark as Picked Up',      color: '#8b5cf6', icon: '✅' },
  PICKED_UP:          { next: 'IN_WASHING',        label: 'Drop at Facility',        color: '#06b6d4', icon: '🫧' },
  IN_WASHING:         { next: 'WASHING_DONE',      label: 'Mark Washing Done',       color: '#10b981', icon: '✅' },
  WASHING_DONE:       { next: 'OUT_FOR_DELIVERY',  label: 'Start Delivery',          color: '#f59e0b', icon: '🛵' },
  DELIVERY_SCHEDULED: { next: 'OUT_FOR_DELIVERY',  label: 'Start Delivery',          color: '#f59e0b', icon: '🛵' },
  OUT_FOR_DELIVERY:   { next: 'DELIVERED',         label: 'Mark as Delivered',       color: '#10b981', icon: '🎉' },
};

export default function AgentDashboard() {
  const { agent, token, logout, isLoading } = useAgent();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'available' | 'mine'>('available');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !agent) router.push('/agent/login');
  }, [agent, isLoading, router]);

  const authHeader = { headers: { Authorization: `Bearer ${token}` } };

  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [avail, mine] = await Promise.all([
        axios.get(`${API_URL}/agent/orders`, authHeader),
        axios.get(`${API_URL}/agent/orders/my`, authHeader),
      ]);
      setOrders(avail.data);
      setMyOrders(mine.data);
    } catch {
      toast.error('Could not fetch orders');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdating(orderId);
    try {
      await axios.put(`${API_URL}/agent/orders/${orderId}/status`, { status: newStatus }, authHeader);
      toast.success(`Order updated to ${ORDER_STATUS_CONFIG[newStatus]?.label || newStatus} ✅`);
      fetchOrders();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Update failed';
      toast.error(msg);
    } finally {
      setUpdating(null);
    }
  };

  const claimOrder = async (orderId: string) => {
    setUpdating(orderId);
    try {
      await axios.put(`${API_URL}/agent/orders/${orderId}/claim`, {}, authHeader);
      toast.success('Order claimed! Moved to My Orders 🛵');
      await fetchOrders();
      setActiveTab('mine');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Could not claim order';
      toast.error(msg);
    } finally {
      setUpdating(null);
    }
  };

  const handleLogout = () => { logout(); router.push('/agent/login'); };

  if (isLoading || !agent) return (
    <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}><div style={{ fontSize: 48 }}>🛵</div><div style={{ color: '#71717a', marginTop: 12 }}>Loading...</div></div>
    </div>
  );

  const displayOrders = activeTab === 'available' ? orders : myOrders;
  const dailyClaimed = myOrders.filter(o => {
    if (!o.createdAt) return false;
    const today = new Date();
    today.setHours(0,0,0,0);
    return new Date(o.createdAt) >= today;
  }).length;

  return (
    <div style={{ minHeight: '100vh', background: '#09090b' }}>
      {/* Agent Nav */}
      <nav style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: '0 24px', background: 'rgba(6,182,212,0.04)', backdropFilter: 'blur(20px)', position: 'sticky', top: 0, zIndex: 40 }}>
        <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: 64 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#06b6d4,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🛵</div>
            <div>
              <div style={{ fontWeight: 800, fontSize: 16, color: '#06b6d4' }}>WashX Agent</div>
              <div style={{ fontSize: 12, color: '#71717a' }}>
                {agent.name} · {agent.city} · <span style={{ color: '#38bdf8', fontWeight: 600 }}>Cap: {dailyClaimed}/15 today</span>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button onClick={fetchOrders} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button onClick={handleLogout} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', display: 'flex', alignItems: 'center', gap: 4, fontSize: 13 }}>
              <LogOut size={15} /> Logout
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1000, margin: '0 auto', padding: '28px 24px' }}>
        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14, marginBottom: 28 }}>
          {[
            { icon: <Clock size={18} />, label: 'Available Orders', value: orders.length, color: '#8b5cf6' },
            { icon: <Package size={18} />, label: 'My Active Tasks', value: myOrders.filter(o => !['DELIVERED','CANCELLED'].includes(o.status)).length, color: '#f59e0b' },
            { icon: <CheckCircle2 size={18} />, label: 'Completed Today', value: myOrders.filter(o => o.status === 'DELIVERED').length, color: '#10b981' },
            { icon: <Truck size={18} />, label: 'Daily Cap Remaining', value: Math.max(0, 15 - dailyClaimed), color: '#06b6d4' },
          ].map((s, i) => (
            <motion.div key={i} className="glass" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} style={{ padding: '16px 20px' }}>
              <div style={{ color: s.color, marginBottom: 8 }}>{s.icon}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#71717a', marginTop: 2 }}>{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
          {[{ id: 'available', label: `Available to Claim (${orders.length})` }, { id: 'mine', label: `My Claimed Orders (${myOrders.length})` }].map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id as 'available' | 'mine')} style={{
              padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600, transition: 'all 0.2s',
              background: activeTab === t.id ? 'linear-gradient(135deg,#06b6d4,#0891b2)' : 'rgba(255,255,255,0.06)',
              color: activeTab === t.id ? 'white' : '#a1a1aa',
            }}>{t.label}</button>
          ))}
        </div>

        {/* Orders */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#52525b' }}>Loading orders...</div>
        ) : displayOrders.length === 0 ? (
          <div className="glass" style={{ padding: 48, textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
            <div style={{ fontWeight: 700, marginBottom: 8 }}>{activeTab === 'available' ? 'No available orders in your city right now' : 'No orders assigned to you yet'}</div>
            <div style={{ color: '#71717a', fontSize: 14 }}>Check back soon or refresh the page.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <AnimatePresence>
              {displayOrders.map((order) => (
                <AgentOrderCard
                  key={order.id}
                  order={order}
                  onUpdate={updateStatus}
                  onClaim={claimOrder}
                  isAvailable={activeTab === 'available'}
                  updating={updating === order.id}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}

function AgentOrderCard({
  order,
  onUpdate,
  onClaim,
  isAvailable,
  updating,
}: {
  order: Order;
  onUpdate: (id: string, s: string) => void;
  onClaim: (id: string) => void;
  isAvailable: boolean;
  updating: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const cfg = ORDER_STATUS_CONFIG[order.status] || { label: order.status, icon: '📦', step: 0 };
  const nextAction = NEXT_STATUS[order.status];
  const totalItems = order.clothesItems.reduce((s, c) => s + c.quantity, 0);

  const slot = order.status === 'PICKUP_SCHEDULED' ? order.pickupSlot : order.deliverySlot;
  const slotLabel = slot ? new Date(slot).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="glass" style={{ overflow: 'hidden' }}>
      {/* Card header */}
      <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 42, height: 42, borderRadius: 12, background: 'rgba(6,182,212,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{cfg.icon}</div>
          <div>
            <div style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 15, letterSpacing: 0.5, color: '#a78bfa' }}>#{order.id.slice(0, 12).toUpperCase()}</div>
            <div style={{ fontSize: 13, color: '#71717a', display: 'flex', alignItems: 'center', gap: 12, marginTop: 2 }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={11} /> {slotLabel}</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Package size={11} /> {totalItems} items</span>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span className="badge" style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.2)', color: '#67e8f9', fontSize: 12 }}>
            {cfg.icon} {cfg.label}
          </span>
          <span style={{ fontWeight: 700, color: '#10b981' }}>₹{order.totalPrice}</span>
          
          {isAvailable ? (
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => onClaim(order.id)}
              disabled={updating}
              style={{
                background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
                color: 'white', border: 'none', borderRadius: 8, padding: '7px 14px',
                fontWeight: 700, fontSize: 13, cursor: updating ? 'not-allowed' : 'pointer',
                boxShadow: '0 2px 10px rgba(6,182,212,0.3)',
              }}
            >
              {updating ? 'Claiming…' : '⚡ Claim Order'}
            </motion.button>
          ) : null}

          <button onClick={() => setExpanded(!expanded)} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', color: '#a1a1aa', fontSize: 13 }}>
            {expanded ? 'Hide' : 'Details'}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} style={{ overflow: 'hidden', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div style={{ padding: '18px 22px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
              {/* Customer info */}
              <div>
                <div style={{ fontSize: 11, color: '#52525b', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Customer</div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{order.user.name}</div>
                <a href={`tel:${order.user.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#06b6d4', textDecoration: 'none', fontSize: 14, marginBottom: 4 }}>
                  <Phone size={13} /> {order.user.phone}
                </a>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6, color: '#71717a', fontSize: 13 }}>
                  <MapPin size={13} style={{ flexShrink: 0, marginTop: 2 }} />
                  {order.pickupAddress || order.deliveryAddress || order.user.address || '—'}
                </div>
              </div>

              {/* Clothes list */}
              <div>
                <div style={{ fontSize: 11, color: '#52525b', fontWeight: 700, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>Clothes</div>
                {order.clothesItems.map((item, i) => (
                  <div key={i} style={{ fontSize: 13, color: '#a1a1aa', marginBottom: 4 }}>
                    {item.type} × {item.quantity} <span style={{ color: '#52525b' }}>({item.service})</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Action button */}
            {isAvailable ? (
              <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onClaim(order.id)}
                  disabled={updating}
                  style={{
                    width: '100%', padding: '13px 24px', borderRadius: 12, border: 'none',
                    background: 'linear-gradient(135deg, #06b6d4, #0284c7)',
                    color: 'white', fontWeight: 700, fontSize: 15, cursor: updating ? 'not-allowed' : 'pointer',
                    opacity: updating ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: '0 4px 16px rgba(6,182,212,0.35)',
                  }}
                >
                  {updating ? 'Claiming…' : '⚡ Claim This Order Now'}
                </motion.button>
              </div>
            ) : nextAction ? (
              <div style={{ padding: '14px 22px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => onUpdate(order.id, nextAction.next)}
                  disabled={updating}
                  style={{
                    width: '100%', padding: '13px 24px', borderRadius: 12, border: 'none',
                    background: `linear-gradient(135deg, ${nextAction.color}, ${nextAction.color}cc)`,
                    color: 'white', fontWeight: 700, fontSize: 15, cursor: updating ? 'not-allowed' : 'pointer',
                    opacity: updating ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: `0 4px 16px ${nextAction.color}40`,
                  }}
                >
                  {updating ? 'Updating...' : `${nextAction.icon} ${nextAction.label}`}
                </motion.button>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
