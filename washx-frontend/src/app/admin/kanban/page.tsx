'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '@/context/AdminContext';
import AdminShell from '@/components/AdminShell';
import { ORDER_STATUS_CONFIG } from '@/lib/constants';
import toast from 'react-hot-toast';
import { Phone, MapPin, Package, RefreshCw, ChevronRight } from 'lucide-react';

interface KanbanOrder {
  id: string; status: string; totalPrice: number; city?: string;
  pickupSlot?: string; createdAt: string;
  user: { name: string; phone: string; address?: string };
  clothesItems: { quantity: number }[];
  payment?: { status: string };
}

const COLUMNS: { status: string; label: string; color: string; bg: string; icon: string }[] = [
  { status: 'PENDING',            label: 'Pending',         color: '#f59e0b', bg: 'rgba(245,158,11,0.08)',  icon: '📋' },
  { status: 'PICKUP_SCHEDULED',   label: 'Pickup Booked',   color: '#6366f1', bg: 'rgba(99,102,241,0.08)',  icon: '📅' },
  { status: 'PICKED_UP',          label: 'Picked Up',       color: '#8b5cf6', bg: 'rgba(139,92,246,0.08)', icon: '🚗' },
  { status: 'IN_WASHING',         label: 'In Washing',      color: '#06b6d4', bg: 'rgba(6,182,212,0.08)',   icon: '🫧' },
  { status: 'WASHING_DONE',       label: 'Ready',           color: '#10b981', bg: 'rgba(16,185,129,0.08)', icon: '✅' },
  { status: 'DELIVERY_SCHEDULED', label: 'Delivery Booked', color: '#ec4899', bg: 'rgba(236,72,153,0.08)', icon: '📦' },
  { status: 'OUT_FOR_DELIVERY',   label: 'Out for Del.',    color: '#f97316', bg: 'rgba(249,115,22,0.08)',  icon: '🛵' },
  { status: 'DELIVERED',          label: 'Delivered',       color: '#10b981', bg: 'rgba(16,185,129,0.05)', icon: '🎉' },
];

const VALID_TRANSITIONS: Record<string, string[]> = {
  PENDING:            ['PICKUP_SCHEDULED', 'CANCELLED'],
  PICKUP_SCHEDULED:   ['PICKED_UP', 'CANCELLED'],
  PICKED_UP:          ['IN_WASHING'],
  IN_WASHING:         ['WASHING_DONE'],
  WASHING_DONE:       ['DELIVERY_SCHEDULED', 'OUT_FOR_DELIVERY'],
  DELIVERY_SCHEDULED: ['OUT_FOR_DELIVERY'],
  OUT_FOR_DELIVERY:   ['DELIVERED'],
};

export default function AdminKanbanPage() {
  const { apiCall } = useAdmin();
  const [orders, setOrders] = useState<KanbanOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState<KanbanOrder | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const dragRef = useRef<KanbanOrder | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all non-cancelled, non-delivered (active pipeline) + today's delivered
      const data = await apiCall('GET', '/admin/orders?limit=200') as { orders: KanbanOrder[] };
      setOrders(data.orders);
    } catch { toast.error('Failed to load'); }
    finally { setLoading(false); }
  }, [apiCall]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Auto-refresh every 20s
  useEffect(() => {
    const t = setInterval(fetchOrders, 20000);
    return () => clearInterval(t);
  }, [fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await apiCall('PUT', `/admin/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus } : o));
      toast.success(`Moved → ${ORDER_STATUS_CONFIG[newStatus]?.label} ${ORDER_STATUS_CONFIG[newStatus]?.icon}`);
    } catch { toast.error('Move failed'); }
    finally { setUpdatingId(null); }
  };

  // Drag handlers
  const onDragStart = (e: React.DragEvent, order: KanbanOrder) => {
    dragRef.current = order;
    setDragging(order);
    e.dataTransfer.effectAllowed = 'move';
  };

  const onDragOver = (e: React.DragEvent, colStatus: string) => {
    e.preventDefault();
    const o = dragRef.current;
    if (!o) return;
    const allowed = VALID_TRANSITIONS[o.status] || [];
    e.dataTransfer.dropEffect = allowed.includes(colStatus) ? 'move' : 'none';
    setDragOver(colStatus);
  };

  const onDrop = (e: React.DragEvent, colStatus: string) => {
    e.preventDefault();
    setDragOver(null);
    const o = dragRef.current;
    if (!o || o.status === colStatus) return;
    const allowed = VALID_TRANSITIONS[o.status] || [];
    if (!allowed.includes(colStatus)) { toast.error(`Cannot move from ${o.status} → ${colStatus}`); return; }
    updateStatus(o.id, colStatus);
    setDragging(null);
    dragRef.current = null;
  };

  const onDragEnd = () => { setDragging(null); setDragOver(null); dragRef.current = null; };

  const colOrders = (status: string) => orders.filter((o) => o.status === status);

  return (
    <AdminShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>🗂️ Kanban Board</h1>
          <p style={{ color: '#71717a', fontSize: 14 }}>Drag & drop orders to update their status. Auto-refreshes every 20s.</p>
        </div>
        <button onClick={fetchOrders} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '8px 16px', cursor: 'pointer', color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
          <RefreshCw size={13} /> Refresh
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 16 }}>
          {COLUMNS.map((col) => <div key={col.status} className="glass shimmer" style={{ width: 240, flexShrink: 0, height: 400, borderRadius: 14 }} />)}
        </div>
      ) : (
        <div style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 16, alignItems: 'flex-start' }}>
          {COLUMNS.map((col) => {
            const colCards = colOrders(col.status);
            const isDropTarget = dragOver === col.status;
            const canDrop = dragging ? (VALID_TRANSITIONS[dragging.status] || []).includes(col.status) : false;

            return (
              <div
                key={col.status}
                onDragOver={(e) => onDragOver(e, col.status)}
                onDrop={(e) => onDrop(e, col.status)}
                onDragLeave={() => setDragOver(null)}
                style={{
                  width: 236, flexShrink: 0, borderRadius: 14, padding: 12,
                  background: isDropTarget && canDrop ? `${col.bg}` : 'rgba(255,255,255,0.02)',
                  border: isDropTarget && canDrop ? `2px dashed ${col.color}` : '1px solid rgba(255,255,255,0.06)',
                  transition: 'all 0.2s',
                  boxShadow: isDropTarget && canDrop ? `0 0 24px ${col.color}20` : 'none',
                }}
              >
                {/* Column header */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12, padding: '4px 6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                    <span style={{ fontSize: 16 }}>{col.icon}</span>
                    <span style={{ fontWeight: 700, fontSize: 13, color: col.color }}>{col.label}</span>
                  </div>
                  <span style={{ background: col.bg, border: `1px solid ${col.color}40`, color: col.color, borderRadius: 999, padding: '2px 9px', fontSize: 12, fontWeight: 700 }}>
                    {colCards.length}
                  </span>
                </div>

                {/* Drop zone hint */}
                {isDropTarget && canDrop && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ border: `2px dashed ${col.color}`, borderRadius: 10, padding: 12, marginBottom: 10, textAlign: 'center', color: col.color, fontSize: 13, fontWeight: 600 }}>
                    Drop here →
                  </motion.div>
                )}

                {/* Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minHeight: 80 }}>
                  <AnimatePresence>
                    {colCards.map((order) => (
                      <KanbanCard
                        key={order.id}
                        order={order}
                        colColor={col.color}
                        isDragging={dragging?.id === order.id}
                        isUpdating={updatingId === order.id}
                        validTransitions={VALID_TRANSITIONS[order.status] || []}
                        onDragStart={(e) => onDragStart(e, order)}
                        onDragEnd={onDragEnd}
                        onMove={updateStatus}
                      />
                    ))}
                  </AnimatePresence>
                  {colCards.length === 0 && !isDropTarget && (
                    <div style={{ textAlign: 'center', padding: '20px 0', color: '#3f3f46', fontSize: 12 }}>Empty</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </AdminShell>
  );
}

function KanbanCard({ order, colColor, isDragging, isUpdating, validTransitions, onDragStart, onDragEnd, onMove }: {
  order: KanbanOrder; colColor: string; isDragging: boolean; isUpdating: boolean;
  validTransitions: string[]; onDragStart: (e: React.DragEvent) => void; onDragEnd: () => void;
  onMove: (id: string, status: string) => void;
}) {
  const totalItems = order.clothesItems.reduce((s, c) => s + c.quantity, 0);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{ cursor: 'grab', userSelect: 'none' }}
    >
      <motion.div
        layout
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: isDragging ? 0.5 : isUpdating ? 0.7 : 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        style={{
          background: isDragging ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.04)',
          border: `1px solid ${isDragging ? colColor + '60' : 'rgba(255,255,255,0.08)'}`,
          borderRadius: 10, padding: 14,
          boxShadow: isDragging ? `0 8px 24px ${colColor}30` : 'none',
          transition: 'box-shadow 0.2s, opacity 0.2s',
        }}
      >
      {isUpdating && (
        <div style={{ fontSize: 11, color: '#a78bfa', marginBottom: 6, fontWeight: 600 }}>⏳ Updating...</div>
      )}

      {/* Order ID */}
      <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#a78bfa', marginBottom: 8, fontWeight: 700, letterSpacing: 0.5 }}>
        #{order.id.slice(0, 10).toUpperCase()}
      </div>

      {/* Customer */}
      <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 4 }}>{order.user.name}</div>
      <a href={`tel:${order.user.phone}`} onClick={(e) => e.stopPropagation()} style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#52525b', textDecoration: 'none', fontSize: 11, marginBottom: 4 }}>
        <Phone size={10} /> {order.user.phone}
      </a>
      {order.city && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#52525b', fontSize: 11, marginBottom: 8 }}>
          <MapPin size={10} /> {order.city}
        </div>
      )}

      {/* Meta */}
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#71717a' }}>
          <Package size={11} /> {totalItems} items
        </span>
        <span style={{ fontWeight: 700, color: '#10b981' }}>₹{order.totalPrice}</span>
      </div>

      {/* Payment indicator */}
      <div style={{ marginTop: 8, fontSize: 10, color: order.payment?.status === 'PAID' ? '#10b981' : '#f59e0b' }}>
        {order.payment?.status === 'PAID' ? '✅ Paid' : '⏳ Unpaid'}
      </div>

      {/* Quick move buttons */}
      {validTransitions.length > 0 && (
        <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 5 }}>
          {validTransitions.map((s) => {
            const nextCfg = ORDER_STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={(e) => { e.stopPropagation(); onMove(order.id, s); }}
                disabled={isUpdating}
                style={{ fontSize: 11, padding: '5px 8px', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.06)', color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between', transition: 'background 0.15s' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
              >
                <span>{nextCfg?.icon} {nextCfg?.label}</span>
                <ChevronRight size={10} />
              </button>
            );
          })}
        </div>
      )}
      </motion.div>
    </div>
  );
}
