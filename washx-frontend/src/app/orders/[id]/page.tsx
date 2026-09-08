'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ORDER_STATUS_CONFIG, SERVICE_LABELS, CATEGORY_LABELS } from '@/lib/constants';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ChevronLeft, Package, Clock, MapPin, Star, Zap } from 'lucide-react';
import RazorpayCheckout from '@/components/RazorpayCheckout';

interface Order {
  id: string; status: string; totalPrice: number;
  garmentsTotal?: number; deliveryFee?: number;
  isExpress?: boolean; turnaroundDays?: number;
  deliveryPreference?: string; deliveryOtp?: string;
  inspectionVerified?: boolean; inspectionNotes?: string;
  pickupSlot?: string; deliverySlot?: string;
  pickupAddress?: string; deliveryAddress?: string;
  specialNotes?: string; city?: string; createdAt: string;
  cancellationReason?: string;
  rating?: number; review?: string;
  clothesItems: { id: string; category: string; type: string; quantity: number; service: string; pricePerUnit: number; totalPrice: number }[];
  payment?: { status: string; amount: number; paidAt?: string };
  user: { name: string; phone: string; email: string };
}

const STATUS_ORDER = ['PENDING', 'PICKUP_SCHEDULED', 'PICKED_UP', 'IN_WASHING', 'WASHING_DONE', 'DELIVERY_SCHEDULED', 'OUT_FOR_DELIVERY', 'DELIVERED'];

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(0);
  const [review, setReview] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancellationReason, setCancellationReason] = useState('');
  const [showCancelForm, setShowCancelForm] = useState(false);

  const fetchOrder = async () => {
    try {
      const res = await api.get(`/orders/${orderId}`);
      setOrder(res.data);
    } catch {
      toast.error('Order not found');
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [orderId]);

  const handleRating = async () => {
    if (!rating) { toast.error('Please select a rating'); return; }
    setSubmittingRating(true);
    try {
      await api.put(`/orders/${orderId}/rate`, { rating, review });
      toast.success('Thanks for your feedback! ⭐');
      fetchOrder();
    } catch {
      toast.error('Rating failed');
    } finally {
      setSubmittingRating(false);
    }
  };

  const handleCancel = async () => {
    if (!cancellationReason.trim()) {
      toast.error('Please provide a cancellation reason');
      return;
    }
    setCancelling(true);
    try {
      await api.put(`/orders/${orderId}/cancel`, { cancellationReason });
      toast.success('Order cancelled.');
      setShowCancelForm(false);
      fetchOrder();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Cancellation failed';
      toast.error(msg);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) return <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ fontSize: 48 }}>🧺</div></div>;
  if (!order) return null;

  const cfg = ORDER_STATUS_CONFIG[order.status] || { label: order.status, color: '', icon: '📦', step: 0 };
  const currentStep = STATUS_ORDER.indexOf(order.status);
  const totalItems = order.clothesItems.reduce((s, c) => s + c.quantity, 0);

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', padding: '40px 24px 80px' }}>
      <div style={{ maxWidth: 760, margin: '0 auto' }}>
        {/* Back */}
        <Link href="/dashboard" style={{ textDecoration: 'none', color: '#71717a', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
          <ChevronLeft size={16} /> Back to Dashboard
        </Link>

        {/* Header */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ padding: 28, marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
            <div>
              <div style={{ fontSize: 13, color: '#71717a', marginBottom: 6 }}>Order ID</div>
              <div style={{ fontFamily: 'monospace', fontSize: 22, fontWeight: 800, letterSpacing: 1, color: '#a78bfa' }}>
                {order.id.slice(0, 16).toUpperCase()}
              </div>
              <div style={{ fontSize: 13, color: '#71717a', marginTop: 4 }}>
                Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
              <span className="badge" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)', color: '#a78bfa', fontSize: 14, padding: '8px 16px' }}>
                {cfg.icon} {cfg.label}
              </span>
              {order.isExpress || order.turnaroundDays === 1 ? (
                <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', padding: '4px 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <Zap size={12} /> 1-Day Express Delivery
                </span>
              ) : (
                <Link href="/subscription" style={{ textDecoration: 'none' }}>
                  <span style={{ fontSize: 11, color: '#94a3b8', background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    🕒 3-Day Standard • <span style={{ color: '#38bdf8', fontWeight: 600 }}>Get 1-Day Pass →</span>
                  </span>
                </Link>
              )}
            </div>
          </div>
        </motion.div>

        {/* Status Timeline */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass" style={{ padding: 28, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 24 }}>📍 Order Timeline</h2>
          <div style={{ position: 'relative' }}>
            {STATUS_ORDER.filter((s) => s !== 'CANCELLED').map((status, i) => {
              const sCfg = ORDER_STATUS_CONFIG[status];
              const isDone = i <= currentStep;
              const isCurrent = i === currentStep;

              return (
                <div key={status} style={{ display: 'flex', gap: 16, marginBottom: i < STATUS_ORDER.length - 2 ? 20 : 0 }}>
                  {/* Circle + line */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', flexShrink: 0,
                      background: isDone ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(255,255,255,0.06)',
                      border: isCurrent ? '2px solid #6366f1' : isDone ? 'none' : '1px solid rgba(255,255,255,0.1)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 16,
                      boxShadow: isCurrent ? '0 0 16px rgba(99,102,241,0.4)' : 'none',
                    }}>
                      {isDone ? sCfg.icon : '○'}
                    </div>
                    {i < STATUS_ORDER.length - 2 && (
                      <div style={{ width: 2, flex: 1, minHeight: 20, background: i < currentStep ? 'rgba(99,102,241,0.6)' : 'rgba(255,255,255,0.08)', marginTop: 4 }} />
                    )}
                  </div>
                  {/* Label */}
                  <div style={{ paddingTop: 6 }}>
                    <div style={{ fontWeight: isCurrent ? 700 : isDone ? 600 : 400, color: isDone ? 'white' : '#52525b', fontSize: 15 }}>
                      {sCfg.label}
                    </div>
                    {isCurrent && (
                      <div style={{ fontSize: 12, color: '#6366f1', marginTop: 2 }}>← Current Status</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Book Delivery Slot (when WASHING_DONE) */}
        {order.status === 'WASHING_DONE' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            style={{ background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(6,182,212,0.1))', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 16, padding: 24, marginBottom: 20, textAlign: 'center' }}
          >
            <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 8 }}>Your clothes are clean & ready!</h3>
            <p style={{ color: '#a1a1aa', marginBottom: 20 }}>Book a delivery slot and we'll bring them right to your door.</p>
            <Link href={`/orders/${orderId}/delivery`}>
              <button className="btn-primary" style={{ padding: '12px 32px', fontSize: 15 }}>📅 Book Delivery Slot</button>
            </Link>
          </motion.div>
        )}

        {/* Clothes Details */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass" style={{ padding: 28, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={16} color="#6366f1" /> Clothes Details ({totalItems} items)
          </h2>

          {order.clothesItems.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#52525b', padding: 20 }}>
              <p>No clothes added yet.</p>
              <Link href={`/orders/${orderId}/clothes`}>
                <button className="btn-primary" style={{ marginTop: 12, padding: '10px 20px' }}>Add Clothes</button>
              </Link>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {order.clothesItems.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 16px', background: 'rgba(255,255,255,0.03)', borderRadius: 10, flexWrap: 'wrap', gap: 8 }}>
                    <div>
                      <span style={{ fontWeight: 600 }}>{item.type}</span>
                      <span style={{ color: '#71717a', fontSize: 13, marginLeft: 8 }}>({CATEGORY_LABELS[item.category] || item.category})</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span style={{ fontSize: 12, background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 6, padding: '2px 8px', color: '#a78bfa' }}>
                        {SERVICE_LABELS[item.service] || item.service}
                      </span>
                      <span style={{ color: '#a1a1aa', fontSize: 13 }}>×{item.quantity}</span>
                      <span style={{ fontWeight: 700 }}>₹{item.totalPrice}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 14, color: '#a1a1aa' }}>
                  <span>Garments Subtotal ({totalItems} pcs)</span>
                  <span style={{ fontWeight: 600, color: '#ffffff' }}>
                    ₹{order.garmentsTotal ?? (order.totalPrice - (order.deliveryFee ?? 0))}
                  </span>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, fontSize: 14 }}>
                  <span style={{ color: '#a1a1aa' }}>
                    Doorstep Transit & Delivery {((order.deliveryFee ?? 0) === 0) ? '(Cart ≥ ₹250 / Express)' : '(Cart < ₹250)'}
                  </span>
                  <div>
                    {((order.deliveryFee ?? 0) === 0) ? (
                      <span style={{ fontWeight: 700, color: '#10b981' }}>FREE (₹0)</span>
                    ) : (
                      <span style={{ fontWeight: 700, color: '#f59e0b' }}>+₹{order.deliveryFee}</span>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ fontSize: 16, fontWeight: 700 }}>Order Grand Total</span>
                  <span style={{ fontSize: 24, fontWeight: 900, background: 'linear-gradient(135deg,#6366f1,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                    ₹{order.totalPrice}
                  </span>
                </div>
              </div>

              {/* Inspection Badge if available */}
              {(order.inspectionVerified || order.inspectionNotes) && (
                <div style={{ marginTop: 16, padding: '12px 16px', background: 'rgba(99, 102, 241, 0.08)', border: '1px solid rgba(99, 102, 241, 0.25)', borderRadius: 10, fontSize: 13 }}>
                  <div style={{ fontWeight: 700, color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: 6 }}>
                    🛡️ Pre-Wash Doorstep Inspection Verified
                  </div>
                  {order.inspectionNotes && (
                    <div style={{ color: '#cbd5e1', marginTop: 4, fontSize: 12 }}>
                      Intake Note: <em>"{order.inspectionNotes}"</em>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </motion.div>

        {/* Pickup & Delivery Info */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass" style={{ padding: 28, marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 20 }}>📅 Slot & Handover Information</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#71717a', fontSize: 12, marginBottom: 8 }}>
                <Clock size={14} /> PICKUP SLOT
              </div>
              <div style={{ fontWeight: 600 }}>
                {order.pickupSlot
                  ? new Date(order.pickupSlot).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                  : <span style={{ color: '#52525b' }}>Not scheduled</span>}
              </div>
              <div style={{ fontSize: 13, color: '#71717a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} /> {order.pickupAddress || '—'}
              </div>
            </div>
            <div style={{ padding: 16, background: 'rgba(255,255,255,0.03)', borderRadius: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#71717a', fontSize: 12, marginBottom: 8 }}>
                <Clock size={14} /> DELIVERY SLOT
              </div>
              <div style={{ fontWeight: 600 }}>
                {order.deliverySlot
                  ? new Date(order.deliverySlot).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                  : <span style={{ color: '#52525b' }}>Not scheduled yet</span>}
              </div>
              <div style={{ fontSize: 13, color: '#71717a', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                <MapPin size={12} /> {order.deliveryAddress || '—'}
              </div>
            </div>
          </div>

          {/* Gate Delivery Handover & OTP Security Card */}
          {order.deliveryPreference === 'SECURITY_GATE' ? (
            <div style={{ padding: '16px 20px', background: 'linear-gradient(135deg, rgba(6, 182, 212, 0.12), rgba(16, 185, 129, 0.08))', border: '1px solid rgba(6, 182, 212, 0.35)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8', display: 'flex', alignItems: 'center', gap: 6 }}>
                  🏢 Society Security Gate / Reception Drop Active
                </div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, maxWidth: 440 }}>
                  Share this OTP with your security guard. Rider cannot mark delivered without verifying this code.
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 2 }}>
                  Secure Delivery OTP
                </div>
                <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: '0.15em', color: '#22d3ee', background: 'rgba(6, 182, 212, 0.2)', padding: '6px 14px', borderRadius: 8, display: 'inline-block' }}>
                  {order.deliveryOtp || '8492'}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: 13, color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: 'rgba(255,255,255,0.02)', borderRadius: 8 }}>
              <span>👤 Handover Preference: Direct In-Person Delivery to Patron</span>
            </div>
          )}
        </motion.div>

        {/* Payment Section — show when clothes added but not yet paid */}
        {order.clothesItems.length > 0 && (!order.payment || order.payment.status !== 'PAID') && order.status !== 'CANCELLED' && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} style={{ marginBottom: 20 }}>
            <RazorpayCheckout
              orderId={order.id}
              amount={order.totalPrice}
              userName={order.user.name}
              userEmail={order.user.email}
              userPhone={order.user.phone}
              onSuccess={fetchOrder}
            />
          </motion.div>
        )}
        {order.payment?.status === 'PAID' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.35 }} style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', borderRadius: 12, padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10, fontSize: 14 }}>
            <span style={{ fontSize: 18 }}>✅</span>
            <div><span style={{ color: '#10b981', fontWeight: 700 }}>Payment Confirmed</span><span style={{ color: '#71717a', marginLeft: 10 }}>₹{order.payment.amount} paid via Razorpay</span></div>
          </motion.div>
        )}

        {/* Rating (only for DELIVERED orders without rating) */}

        {order.status === 'DELIVERED' && !order.rating && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>⭐ Rate Your Experience</h2>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} style={{ fontSize: 28, background: 'none', border: 'none', cursor: 'pointer', transition: 'transform 0.1s', transform: rating >= n ? 'scale(1.2)' : 'scale(1)' }}>
                  {rating >= n ? '⭐' : '☆'}
                </button>
              ))}
            </div>
            <textarea
              className="input-field"
              placeholder="Tell us about your experience..."
              rows={3}
              value={review}
              onChange={(e) => setReview(e.target.value)}
              style={{ marginBottom: 12, resize: 'vertical' }}
            />
            <button className="btn-primary" onClick={handleRating} disabled={submittingRating} style={{ padding: '10px 24px' }}>
              {submittingRating ? 'Submitting...' : 'Submit Rating'}
            </button>
          </motion.div>
        )}

        {order.rating && (
          <div className="glass" style={{ padding: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <Star size={20} color="#f59e0b" fill="#f59e0b" />
            <span style={{ fontWeight: 600 }}>You rated this order {order.rating}/5</span>
            {order.review && <span style={{ color: '#71717a', fontSize: 14 }}>— "{order.review}"</span>}
          </div>
        )}

        {/* Cancellation Info — shown for cancelled orders */}
        {order.status === 'CANCELLED' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{
            background: 'rgba(239,68,68,0.08)',
            border: '1px solid rgba(239,68,68,0.25)',
            borderRadius: 12,
            padding: '16px 20px',
            marginBottom: 20,
          }}>
            <div style={{ fontWeight: 700, color: '#f87171', marginBottom: 4 }}>❌ Order Cancelled</div>
            {order.cancellationReason && (
              <div style={{ color: '#a1a1aa', fontSize: 14 }}>
                Reason: <span style={{ color: '#e4e4e7' }}>{order.cancellationReason}</span>
              </div>
            )}
          </motion.div>
        )}

        {/* Cancel Order — shown for cancellable statuses */}
        {['PENDING', 'PICKUP_SCHEDULED', 'PICKUP_MISSED'].includes(order.status) && !showCancelForm && (
          <div style={{ textAlign: 'center', marginTop: 8 }}>
            <button
              onClick={() => setShowCancelForm(true)}
              style={{
                background: 'transparent',
                border: '1px solid rgba(239,68,68,0.3)',
                color: '#f87171',
                padding: '8px 20px',
                borderRadius: 999,
                fontSize: 13,
                cursor: 'pointer',
                fontWeight: 600,
              }}
            >
              Cancel Order
            </button>
          </div>
        )}

        {showCancelForm && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass"
            style={{ padding: 24, marginTop: 16 }}
          >
            <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, color: '#f87171' }}>Cancel Order</h3>
            <p style={{ fontSize: 13, color: '#71717a', marginBottom: 12 }}>
              Please tell us why you're cancelling. This helps us improve.
            </p>
            <textarea
              className="input-field"
              placeholder="e.g. Changed my mind, Found better service, Agent didn't arrive..."
              rows={3}
              value={cancellationReason}
              onChange={(e) => setCancellationReason(e.target.value)}
              style={{ marginBottom: 12, resize: 'vertical' }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button
                className="btn-primary"
                onClick={handleCancel}
                disabled={cancelling || !cancellationReason.trim()}
                style={{ background: 'rgba(239,68,68,0.15)', borderColor: 'rgba(239,68,68,0.4)', color: '#f87171', padding: '10px 20px' }}
              >
                {cancelling ? 'Cancelling...' : 'Confirm Cancellation'}
              </button>
              <button
                onClick={() => setShowCancelForm(false)}
                style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#71717a', padding: '10px 20px', borderRadius: 8, cursor: 'pointer', fontSize: 13 }}
              >
                Keep Order
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
