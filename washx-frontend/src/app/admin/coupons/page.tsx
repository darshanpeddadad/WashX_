'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '@/context/AdminContext';
import AdminShell from '@/components/AdminShell';
import toast from 'react-hot-toast';
import { Tag, Plus, Trash2, CheckCircle2, XCircle, Copy, Percent, IndianRupee, RefreshCw, Calendar, Users } from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  type: 'PERCENT' | 'FLAT';
  value: number;
  minOrder: number;
  maxUses: number | null;
  usedCount: number;
  isActive: boolean;
  expiresAt: string | null;
  createdAt: string;
}

export default function AdminCouponsPage() {
  const { apiCall } = useAdmin();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [creating, setCreating] = useState(false);

  // Form State
  const [code, setCode] = useState('');
  const [type, setType] = useState<'PERCENT' | 'FLAT'>('PERCENT');
  const [value, setValue] = useState('');
  const [minOrder, setMinOrder] = useState('0');
  const [maxUses, setMaxUses] = useState('');
  const [expiresAt, setExpiresAt] = useState('');

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const data = (await apiCall('GET', '/coupons')) as Coupon[];
      if (Array.isArray(data)) {
        setCoupons(data);
      }
    } catch {
      toast.error('Failed to load coupons');
    } finally {
      setLoading(false);
    }
  }, [apiCall]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !value) {
      toast.error('Please enter coupon code and discount value');
      return;
    }
    setCreating(true);
    try {
      await apiCall('POST', '/coupons', {
        code: code.trim().toUpperCase(),
        type,
        value: parseFloat(value),
        minOrder: parseFloat(minOrder) || 0,
        maxUses: maxUses ? parseInt(maxUses) : null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      toast.success(`Coupon ${code.toUpperCase()} created successfully!`);
      setShowModal(false);
      // Reset
      setCode('');
      setValue('');
      setMinOrder('0');
      setMaxUses('');
      setExpiresAt('');
      fetchCoupons();
    } catch {
      toast.error('Could not create coupon. Code may already exist.');
    } finally {
      setCreating(false);
    }
  };

  const handleToggle = async (coupon: Coupon) => {
    try {
      await apiCall('PUT', `/coupons/${coupon.id}`, { isActive: !coupon.isActive });
      toast.success(`Coupon ${coupon.code} ${!coupon.isActive ? 'activated' : 'deactivated'}`);
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? { ...c, isActive: !c.isActive } : c))
      );
    } catch {
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (id: string, cCode: string) => {
    if (!confirm(`Are you sure you want to delete coupon "${cCode}"?`)) return;
    try {
      await apiCall('DELETE', `/coupons/${id}`);
      toast.success(`Coupon ${cCode} deleted`);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  const copyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`Copied "${text}" to clipboard!`);
  };

  return (
    <AdminShell>
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: '#f4f4f5', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Tag size={26} color="#a78bfa" /> Coupons & Promo Codes
            </h1>
            <p style={{ color: '#71717a', fontSize: 14, marginTop: 4 }}>
              Manage promotional discounts, Fair Usage limits, and voucher campaigns
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={fetchCoupons}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '10px 14px',
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 10, color: '#a1a1aa', cursor: 'pointer', fontSize: 13,
              }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
            </button>
            <button
              onClick={() => setShowModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px',
                background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                border: 'none', borderRadius: 10, color: '#fff', fontWeight: 600,
                cursor: 'pointer', fontSize: 14, boxShadow: '0 4px 14px rgba(124,58,237,0.3)',
              }}
            >
              <Plus size={16} /> Create Coupon
            </button>
          </div>
        </div>

        {/* Coupons Grid */}
        {loading && coupons.length === 0 ? (
          <div style={{ padding: '60px 0', textAlign: 'center', color: '#71717a' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 12px' }} />
            Loading coupons...
          </div>
        ) : coupons.length === 0 ? (
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px dashed rgba(255,255,255,0.1)',
            borderRadius: 16, padding: '48px 24px', textAlign: 'center', color: '#71717a',
          }}>
            <Tag size={40} style={{ margin: '0 auto 16px', opacity: 0.4 }} />
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#d4d4d8', marginBottom: 6 }}>No Coupons Created Yet</h3>
            <p style={{ fontSize: 13, maxWidth: 360, margin: '0 auto 20px' }}>
              Create your first promotional discount coupon to boost customer bookings and reward loyal users.
            </p>
            <button
              onClick={() => setShowModal(true)}
              style={{
                padding: '9px 16px', background: '#7c3aed', color: '#fff', border: 'none',
                borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 13,
              }}
            >
              + Create First Coupon
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
            {coupons.map((coupon) => (
              <motion.div
                key={coupon.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${coupon.isActive ? 'rgba(124,58,237,0.25)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 14,
                  padding: '20px 22px',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Active Indicator Top Stripe */}
                <div style={{
                  position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                  background: coupon.isActive ? 'linear-gradient(90deg, #7c3aed, #06b6d4)' : 'rgba(255,255,255,0.1)',
                }} />

                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{
                        fontFamily: 'monospace', fontWeight: 800, fontSize: 18, color: '#f4f4f5',
                        background: 'rgba(124,58,237,0.15)', padding: '4px 10px', borderRadius: 8,
                        border: '1px solid rgba(124,58,237,0.3)', letterSpacing: 1,
                      }}>
                        {coupon.code}
                      </span>
                      <button
                        onClick={() => copyCode(coupon.code)}
                        title="Copy Code"
                        style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: 4 }}
                      >
                        <Copy size={15} />
                      </button>
                    </div>
                    <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 6 }}>
                      {coupon.type === 'PERCENT' ? (
                        <span style={{ color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <Percent size={13} /> {coupon.value}% OFF
                        </span>
                      ) : (
                        <span style={{ color: '#10b981', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                          <IndianRupee size={13} /> ₹{coupon.value} FLAT OFF
                        </span>
                      )}
                    </div>
                  </div>

                  <span style={{
                    display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                    borderRadius: 99, fontSize: 11, fontWeight: 700,
                    background: coupon.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)',
                    color: coupon.isActive ? '#34d399' : '#f87171',
                    border: `1px solid ${coupon.isActive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'}`,
                  }}>
                    {coupon.isActive ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                    {coupon.isActive ? 'Active' : 'Disabled'}
                  </span>
                </div>

                {/* Details list */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.06)', borderBottom: '1px solid rgba(255,255,255,0.06)', fontSize: 12, color: '#a1a1aa' }}>
                  <div>
                    <span style={{ color: '#71717a' }}>Min Order:</span> <strong style={{ color: '#d4d4d8' }}>₹{coupon.minOrder}</strong>
                  </div>
                  <div>
                    <span style={{ color: '#71717a' }}>Used:</span> <strong style={{ color: '#d4d4d8' }}>{coupon.usedCount} {coupon.maxUses ? `/ ${coupon.maxUses}` : 'times'}</strong>
                  </div>
                  <div style={{ gridColumn: 'span 2', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Calendar size={13} color="#71717a" />
                    <span>Expires: {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never'}</span>
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                  <button
                    onClick={() => handleToggle(coupon)}
                    style={{
                      background: 'none', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
                      padding: '6px 12px', fontSize: 12, color: coupon.isActive ? '#f87171' : '#34d399',
                      cursor: 'pointer', fontWeight: 600,
                    }}
                  >
                    {coupon.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    onClick={() => handleDelete(coupon.id, coupon.code)}
                    style={{
                      background: 'none', border: 'none', color: '#71717a', cursor: 'pointer',
                      padding: '6px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 4, fontSize: 12,
                    }}
                    title="Delete Coupon"
                  >
                    <Trash2 size={15} color="#ef4444" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Create Modal */}
        <AnimatePresence>
          {showModal && (
            <div style={{
              position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100,
              backdropFilter: 'blur(4px)', padding: 16,
            }}>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                style={{
                  background: '#121214', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 18, width: '100%', maxWidth: 480, padding: 26,
                  boxShadow: '0 20px 40px rgba(0,0,0,0.6)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: '#f4f4f5' }}>Create Promo Code</h3>
                  <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', fontSize: 18 }}>✕</button>
                </div>

                <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>
                      COUPON CODE
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. WELCOME50, DIWALI100"
                      value={code}
                      onChange={(e) => setCode(e.target.value.toUpperCase())}
                      required
                      style={{
                        width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff',
                        fontFamily: 'monospace', fontSize: 15, textTransform: 'uppercase',
                      }}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>
                        DISCOUNT TYPE
                      </label>
                      <select
                        value={type}
                        onChange={(e) => setType(e.target.value as 'PERCENT' | 'FLAT')}
                        style={{
                          width: '100%', padding: '10px 14px', background: '#1c1c20',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff',
                          fontSize: 13,
                        }}
                      >
                        <option value="PERCENT">Percentage (%)</option>
                        <option value="FLAT">Flat Amount (₹)</option>
                      </select>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>
                        DISCOUNT VALUE {type === 'PERCENT' ? '(%)' : '(₹)'}
                      </label>
                      <input
                        type="number"
                        placeholder={type === 'PERCENT' ? 'e.g. 20' : 'e.g. 100'}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        required
                        min="1"
                        max={type === 'PERCENT' ? '100' : '10000'}
                        style={{
                          width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 14,
                        }}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>
                        MIN ORDER (₹)
                      </label>
                      <input
                        type="number"
                        placeholder="0"
                        value={minOrder}
                        onChange={(e) => setMinOrder(e.target.value)}
                        min="0"
                        style={{
                          width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 14,
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>
                        MAX USES (OPTIONAL)
                      </label>
                      <input
                        type="number"
                        placeholder="Unlimited"
                        value={maxUses}
                        onChange={(e) => setMaxUses(e.target.value)}
                        min="1"
                        style={{
                          width: '100%', padding: '10px 14px', background: 'rgba(255,255,255,0.04)',
                          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 14,
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: '#a1a1aa', marginBottom: 6 }}>
                      EXPIRY DATE (OPTIONAL)
                    </label>
                    <input
                      type="date"
                      value={expiresAt}
                      onChange={(e) => setExpiresAt(e.target.value)}
                      style={{
                        width: '100%', padding: '10px 14px', background: '#1c1c20',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#fff', fontSize: 14,
                      }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      style={{
                        flex: 1, padding: '11px', background: 'rgba(255,255,255,0.05)',
                        border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#a1a1aa',
                        cursor: 'pointer', fontWeight: 600,
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={creating}
                      style={{
                        flex: 1, padding: '11px', background: 'linear-gradient(135deg, #7c3aed, #6366f1)',
                        border: 'none', borderRadius: 10, color: '#fff', cursor: 'pointer', fontWeight: 700,
                      }}
                    >
                      {creating ? 'Creating...' : 'Create Coupon'}
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </AdminShell>
  );
}
