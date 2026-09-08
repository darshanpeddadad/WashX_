'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Clock, Loader, Zap, Building, User, Lock } from 'lucide-react';

interface SlotTime {
  label: string; start: string; end: string; hour: number;
  available: boolean; remainingCapacity: number;
}
interface SlotDay {
  date: string; displayDate: string; turnaroundDayIndex?: number; isExpressNextDay?: boolean; slots: SlotTime[];
}

export default function DeliverySlotPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;
  const [slotDays, setSlotDays] = useState<SlotDay[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<SlotTime | null>(null);
  const [loading, setLoading] = useState(true);
  const [booking, setBooking] = useState(false);
  const [city, setCity] = useState('');
  const [turnaroundDays, setTurnaroundDays] = useState<number>(3);
  const [isExpress, setIsExpress] = useState<boolean>(false);
  const [deliveryPreference, setDeliveryPreference] = useState<'HANDOVER_PERSON' | 'SECURITY_GATE'>('HANDOVER_PERSON');

  useEffect(() => {
    api.get(`/orders/${orderId}`).then((r) => {
      const c = r.data.city;
      const tDays = r.data.turnaroundDays || (r.data.isExpress ? 1 : 3);
      setCity(c);
      setTurnaroundDays(tDays);
      setIsExpress(Boolean(r.data.isExpress || tDays === 1));
      if (r.data.deliveryPreference) {
        setDeliveryPreference(r.data.deliveryPreference);
      }
      return api.get(`/slots/delivery?city=${encodeURIComponent(c)}&turnaroundDays=${tDays}`);
    }).then((r) => {
      setSlotDays(r.data);
    }).catch(() => {
      toast.error('Could not load delivery slots');
      router.push(`/orders/${orderId}`);
    }).finally(() => setLoading(false));
  }, [orderId, router]);

  const confirmDelivery = async () => {
    if (!selectedSlot) { toast.error('Please select a slot'); return; }
    setBooking(true);
    try {
      await api.put(`/orders/${orderId}/delivery-slot`, {
        deliverySlot: selectedSlot.start,
        deliveryPreference,
      });
      toast.success('Delivery scheduled! We\'ll bring your clothes soon 🛵');
      router.push(`/orders/${orderId}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Booking failed';
      toast.error(msg);
    } finally {
      setBooking(false);
    }
  };

  if (loading) return <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader color="#6366f1" /></div>;

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', padding: '60px 24px 80px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        <Link href={`/orders/${orderId}`} style={{ textDecoration: 'none', color: '#71717a', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
          <ChevronLeft size={16} /> Back to Order
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Schedule Delivery</h1>
          <p style={{ color: '#71717a', fontSize: 15 }}>Your clothes are clean and ready! Pick a time for delivery to {city}.</p>
        </motion.div>

        {/* Turnaround Speed Notice */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            padding: '16px 20px',
            borderRadius: 14,
            marginBottom: 24,
            background: isExpress ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.03)',
            border: isExpress ? '1px solid rgba(56,189,248,0.3)' : '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          {isExpress ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Zap size={18} className="text-cyan-400 shrink-0" />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#38bdf8' }}>
                  ⚡ 1-Day Express Delivery Active
                </div>
                <div style={{ fontSize: 12, color: '#a1a1aa' }}>
                  Your subscription unlocked next-day express delivery windows below.
                </div>
              </div>
            </div>
          ) : (
            <>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>
                  🕒 Standard {turnaroundDays}-Day Delivery Schedule
                </div>
                <div style={{ fontSize: 12, color: '#71717a' }}>
                  Without an active pass, standard turnaround takes {turnaroundDays} days.
                </div>
              </div>
              <Link href="/subscription" target="_blank" style={{ textDecoration: 'none' }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#38bdf8', padding: '6px 12px', borderRadius: 8, background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.2)' }}>
                  Upgrade to 1-Day Express →
                </span>
              </Link>
            </>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass" style={{ padding: 32 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={18} color="#6366f1" /> Choose Delivery Time
          </h2>

          {/* Day tabs */}
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 24 }}>
            {slotDays.map((day, i) => (
              <button key={day.date} onClick={() => { setSelectedDay(i); setSelectedSlot(null); }} style={{
                flexShrink: 0, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                background: selectedDay === i ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(255,255,255,0.06)',
                color: selectedDay === i ? 'white' : '#a1a1aa', fontWeight: selectedDay === i ? 700 : 400, fontSize: 13, whiteSpace: 'nowrap', transition: 'all 0.2s',
              }}>
                {day.displayDate}
              </button>
            ))}
          </div>

          {/* Slots */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 28 }}>
            {slotDays[selectedDay]?.slots.map((slot) => (
              <motion.button key={slot.start} disabled={!slot.available} onClick={() => setSelectedSlot(slot)} whileHover={slot.available ? { scale: 1.03 } : {}}
                style={{
                  padding: '12px 8px', borderRadius: 10, textAlign: 'center', fontSize: 13, fontWeight: 600, cursor: slot.available ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
                  border: selectedSlot?.start === slot.start ? '2px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                  background: !slot.available ? 'rgba(255,255,255,0.02)' : selectedSlot?.start === slot.start ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.05)',
                  color: !slot.available ? '#3f3f46' : 'white',
                }}>
                {slot.label}
                <div style={{ fontSize: 10, marginTop: 4, color: slot.available ? '#71717a' : '#3f3f46' }}>{slot.available ? `${slot.remainingCapacity} left` : 'Full'}</div>
              </motion.button>
            ))}
          </div>

          {selectedSlot && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 14, color: '#a78bfa' }}>
              ✅ Selected: <strong>{slotDays[selectedDay]?.displayDate}</strong> — <strong>{selectedSlot.label}</strong>
            </motion.div>
          )}

          {/* Delivery Handover Preference (Prevents Failed Deliveries & Fraud) */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#cbd5e1', display: 'block', marginBottom: 10 }}>
              📦 Delivery Handover Preference
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 12 }}>
              <div
                onClick={() => setDeliveryPreference('HANDOVER_PERSON')}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  cursor: 'pointer',
                  border: deliveryPreference === 'HANDOVER_PERSON' ? '2px solid #6366f1' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: deliveryPreference === 'HANDOVER_PERSON' ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <User size={16} color={deliveryPreference === 'HANDOVER_PERSON' ? '#818cf8' : '#94a3b8'} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Direct Handover to Me</span>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                  Rider delivers directly to your door and handovers the sealed laundry tote.
                </p>
              </div>

              <div
                onClick={() => setDeliveryPreference('SECURITY_GATE')}
                style={{
                  padding: 16,
                  borderRadius: 12,
                  cursor: 'pointer',
                  border: deliveryPreference === 'SECURITY_GATE' ? '2px solid #06b6d4' : '1px solid rgba(255, 255, 255, 0.1)',
                  background: deliveryPreference === 'SECURITY_GATE' ? 'rgba(6, 182, 212, 0.15)' : 'rgba(255, 255, 255, 0.03)',
                  transition: 'all 0.2s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <Building size={16} color={deliveryPreference === 'SECURITY_GATE' ? '#06b6d4' : '#94a3b8'} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#ffffff' }}>Society Gate / Reception</span>
                </div>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>
                  Generates a secure 4-digit Delivery OTP. Guard must verify OTP before rider can complete drop.
                </p>
              </div>
            </div>

            {deliveryPreference === 'SECURITY_GATE' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                style={{
                  marginTop: 12,
                  padding: '10px 14px',
                  borderRadius: 10,
                  background: 'rgba(6, 182, 212, 0.08)',
                  border: '1px solid rgba(6, 182, 212, 0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  fontSize: 12,
                  color: '#67e8f9',
                }}
              >
                <Lock size={14} />
                <span>Zero Delivery Failure Guarantee: Avoids missed delivery redelivery charges.</span>
              </motion.div>
            )}
          </div>

          <motion.button className="btn-primary" onClick={confirmDelivery} disabled={!selectedSlot || booking} whileHover={{ scale: 1.02 }} style={{ width: '100%', padding: 16, fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            {booking ? 'Scheduling...' : <>Confirm Delivery Slot 🛵 <ChevronRight size={16} /></>}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
