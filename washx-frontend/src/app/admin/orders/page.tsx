'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAdmin } from '@/context/AdminContext';
import AdminShell from '@/components/AdminShell';
import { ORDER_STATUS_CONFIG } from '@/lib/constants';
import toast from 'react-hot-toast';
import { Search, Filter, ChevronLeft, ChevronRight, ExternalLink, RefreshCw, Download, RotateCcw, AlertCircle } from 'lucide-react';

interface OrderRow {
  id: string;
  status: string;
  totalPrice: number;
  city?: string;
  pickupSlot?: string;
  deliverySlot?: string;
  createdAt: string;
  cancellationReason?: string;
  user: { name: string; phone: string; email: string };
  clothesItems: { quantity: number }[];
  payment?: { id: string; status: string; amount: number; refundAmount?: number };
}

const STATUSES = ['ALL', 'PENDING', 'PICKUP_SCHEDULED', 'PICKUP_MISSED', 'PICKED_UP', 'IN_WASHING', 'WASHING_DONE', 'DELIVERY_SCHEDULED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED'];

export default function AdminOrdersPage() {
  const { apiCall } = useAdmin();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const LIMIT = 15;

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(LIMIT) });
      if (statusFilter !== 'ALL') params.set('status', statusFilter);
      if (search) params.set('search', search);
      const data = await apiCall('GET', `/admin/orders?${params}`) as { orders: OrderRow[]; total: number; totalPages: number };
      setOrders(data.orders);
      setTotal(data.total);
      setTotalPages(data.totalPages);
    } catch { toast.error('Failed to load orders'); }
    finally { setLoading(false); }
  }, [apiCall, page, statusFilter, search]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const updateStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await apiCall('PUT', `/admin/orders/${orderId}/status`, { status: newStatus });
      toast.success(`Status → ${ORDER_STATUS_CONFIG[newStatus]?.label}`);
      fetchOrders();
    } catch { toast.error('Update failed'); }
    finally { setUpdatingId(null); }
  };

  const handleRetryPickup = async (orderId: string) => {
    try {
      await apiCall('PUT', `/admin/orders/${orderId}/retry-pickup`);
      toast.success('Pickup reset for rescheduling');
      fetchOrders();
    } catch {
      toast.error('Failed to reset pickup');
    }
  };

  const handleRefund = async (order: OrderRow) => {
    if (!order.payment?.id) return;
    const reason = prompt('Reason for refund:', 'Customer cancellation');
    if (!reason) return;

    try {
      await apiCall('POST', `/admin/payments/${order.payment.id}/refund`, {
        reason,
        amount: order.totalPrice,
      });
      toast.success(`Refund initiated for ₹${order.totalPrice}`);
      fetchOrders();
    } catch {
      toast.error('Refund processing failed');
    }
  };

  const exportCSV = () => {
    if (!orders.length) {
      toast.error('No orders to export');
      return;
    }
    const headers = ['Order ID', 'Customer Name', 'Phone', 'Email', 'City', 'Total (INR)', 'Status', 'Payment Status', 'Created At'];
    const rows = orders.map((o) => [
      o.id,
      `"${o.user?.name || ''}"`,
      o.user?.phone || '',
      o.user?.email || '',
      o.city || '',
      o.totalPrice,
      o.status,
      o.payment?.status || 'PENDING',
      new Date(o.createdAt).toISOString(),
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `washx_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success('Orders CSV exported');
  };

  return (
    <AdminShell>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>📋 Orders Table</h1>
          <p style={{ color: '#71717a', fontSize: 14 }}>{total} total orders</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={exportCSV}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, padding: '8px 14px', cursor: 'pointer', color: '#e4e4e7',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 14,
            }}
          >
            <Download size={15} /> Export CSV
          </button>
          <button
            onClick={fetchOrders}
            style={{
              background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 10, padding: '8px 14px', cursor: 'pointer', color: '#a1a1aa',
              display: 'flex', alignItems: 'center', gap: 6, fontSize: 14,
            }}
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1 1 260px' }}>
          <Search size={15} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#52525b' }} />
          <input
            className="input-field"
            style={{ paddingLeft: 38, fontSize: 14 }}
            placeholder="Search order ID, customer name, phone..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Status filter */}
        <div style={{ position: 'relative' }}>
          <Filter size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#52525b' }} />
          <select
            className="input-field"
            style={{ paddingLeft: 34, fontSize: 14, paddingRight: 36, minWidth: 180 }}
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          >
            {STATUSES.map((s) => <option key={s} value={s}>{s === 'ALL' ? 'All Statuses' : (ORDER_STATUS_CONFIG[s]?.label || s)}</option>)}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="glass" style={{ overflow: 'hidden', marginBottom: 20 }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                {['Order ID', 'Customer', 'City', 'Items', 'Total', 'Status', 'Payment', 'Pickup Slot', 'Update / Actions', ''].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', color: '#52525b', fontWeight: 600, fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5, whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((__, j) => (
                      <td key={j} style={{ padding: '12px 16px' }}>
                        <div className="shimmer" style={{ height: 16, borderRadius: 6, width: j === 0 ? 100 : j === 1 ? 120 : 60 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : orders.map((order) => {
                const cfg = ORDER_STATUS_CONFIG[order.status] || { label: order.status, icon: '📦', color: '' };
                const totalItems = order.clothesItems.reduce((s, c) => s + c.quantity, 0);
                const isUpdating = updatingId === order.id;
                const nextStatuses = getNextStatuses(order.status);
                const isMissed = order.status === 'PICKUP_MISSED';
                const isCancelled = order.status === 'CANCELLED';
                const canRefund = isCancelled && order.payment?.status === 'PAID' && !order.payment?.refundAmount;

                return (
                  <motion.tr
                    key={order.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', transition: 'background 0.15s' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                    onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  >
                    <td style={{ padding: '12px 16px' }}>
                      <code style={{ color: '#a78bfa', fontSize: 12 }}>{order.id.slice(0, 12).toUpperCase()}</code>
                    </td>
                    <td style={{ padding: '12px 16px', whiteSpace: 'nowrap' }}>
                      <div style={{ fontWeight: 600 }}>{order.user.name}</div>
                      <div style={{ color: '#52525b', fontSize: 11 }}>{order.user.phone}</div>
                    </td>
                    <td style={{ padding: '12px 16px', color: '#71717a' }}>{order.city || '—'}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>{totalItems}</td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#10b981' }}>₹{order.totalPrice}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <div>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 10px',
                          borderRadius: 999, fontSize: 11, fontWeight: 600,
                          background: isMissed ? 'rgba(239,68,68,0.15)' : 'rgba(99,102,241,0.12)',
                          border: `1px solid ${isMissed ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.25)'}`,
                          color: isMissed ? '#f87171' : '#a78bfa', whiteSpace: 'nowrap',
                        }}>
                          {cfg.icon} {cfg.label}
                        </span>
                        {isCancelled && order.cancellationReason && (
                          <div style={{ fontSize: 10, color: '#ef4444', marginTop: 4, maxWidth: 140, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={order.cancellationReason}>
                            Reason: {order.cancellationReason}
                          </div>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {order.payment?.status === 'PAID' ? (
                        <span style={{ color: '#10b981', fontWeight: 600, fontSize: 12 }}>✅ Paid</span>
                      ) : (
                        <span style={{ color: '#f59e0b', fontSize: 12 }}>⏳ Pending</span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#71717a', whiteSpace: 'nowrap', fontSize: 12 }}>
                      {order.pickupSlot ? new Date(order.pickupSlot).toLocaleString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        {nextStatuses.length > 0 && (
                          <select
                            disabled={isUpdating}
                            defaultValue=""
                            onChange={(e) => { if (e.target.value) updateStatus(order.id, e.target.value); e.target.value = ''; }}
                            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '5px 8px', color: 'white', fontSize: 11, cursor: 'pointer', opacity: isUpdating ? 0.5 : 1 }}
                          >
                            <option value="" disabled>{isUpdating ? 'Updating…' : 'Move to…'}</option>
                            {nextStatuses.map((s) => (
                              <option key={s} value={s}>{ORDER_STATUS_CONFIG[s]?.label || s}</option>
                            ))}
                          </select>
                        )}
                        {isMissed && (
                          <button
                            onClick={() => handleRetryPickup(order.id)}
                            style={{
                              background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
                              color: '#f87171', borderRadius: 6, padding: '4px 8px', fontSize: 11,
                              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontWeight: 600,
                            }}
                          >
                            <RotateCcw size={11} /> Retry
                          </button>
                        )}
                        {canRefund && (
                          <button
                            onClick={() => handleRefund(order)}
                            style={{
                              background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                              color: '#34d399', borderRadius: 6, padding: '4px 8px', fontSize: 11,
                              cursor: 'pointer', fontWeight: 600,
                            }}
                          >
                            Refund ₹{order.totalPrice}
                          </button>
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <a href={`/orders/${order.id}`} target="_blank" rel="noreferrer" style={{ color: '#52525b', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                        <ExternalLink size={13} />
                      </a>
                    </td>
                  </motion.tr>
                );
              })}
            </tbody>
          </table>
          {!loading && orders.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#52525b' }}>No orders found</div>
          )}
        </div>
      </div>

      {/* Pagination */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div style={{ color: '#71717a', fontSize: 13 }}>
          Showing {((page - 1) * LIMIT) + 1}–{Math.min(page * LIMIT, total)} of {total}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 12px', cursor: page === 1 ? 'not-allowed' : 'pointer', color: page === 1 ? '#3f3f46' : 'white', display: 'flex', alignItems: 'center' }}>
            <ChevronLeft size={16} />
          </button>
          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const p = Math.max(1, Math.min(page - 2 + i, totalPages - 4 + i));
            return (
              <button key={p} onClick={() => setPage(p)} style={{ minWidth: 36, background: page === p ? 'linear-gradient(135deg,#7c3aed,#5b21b6)' : 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 10px', cursor: 'pointer', color: 'white', fontSize: 13, fontWeight: page === p ? 700 : 400 }}>
                {p}
              </button>
            );
          })}
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, padding: '7px 12px', cursor: page === totalPages ? 'not-allowed' : 'pointer', color: page === totalPages ? '#3f3f46' : 'white', display: 'flex', alignItems: 'center' }}>
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </AdminShell>
  );
}

function getNextStatuses(current: string): string[] {
  const flow: Record<string, string[]> = {
    PENDING: ['PICKUP_SCHEDULED', 'CANCELLED'],
    PICKUP_SCHEDULED: ['PICKED_UP', 'CANCELLED'],
    PICKED_UP: ['IN_WASHING'],
    IN_WASHING: ['WASHING_DONE'],
    WASHING_DONE: ['DELIVERY_SCHEDULED', 'OUT_FOR_DELIVERY'],
    DELIVERY_SCHEDULED: ['OUT_FOR_DELIVERY'],
    OUT_FOR_DELIVERY: ['DELIVERED'],
    DELIVERED: [],
    CANCELLED: [],
  };
  return flow[current] || [];
}
