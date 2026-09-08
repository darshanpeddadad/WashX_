'use client';
import { useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { MapPin, Clock, ChevronLeft, ChevronRight, Loader } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import LoadingScreen from '@/components/common/LoadingScreen';

interface SlotTime {
  label: string; start: string; end: string; hour: number;
  available: boolean; remainingCapacity: number;
}
interface SlotDay {
  date: string; displayDate: string; slots: SlotTime[];
}

export default function BookPage() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1); // 1: address, 2: slot picker
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [specialNotes, setSpecialNotes] = useState('');
  const [slotDays, setSlotDays] = useState<SlotDay[]>([]);
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedSlot, setSelectedSlot] = useState<SlotTime | null>(null);
  const [creating, setCreating] = useState(false);
  const [loadingSlots, setLoadingSlots] = useState(false);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
    if (user) {
      setAddress(user.address || '');
      setCity((user as { city?: string }).city || '');
    }
  }, [user, isLoading, router]);

  const loadSlots = async () => {
    if (!city) { toast.error('Please enter your city'); return; }
    setLoadingSlots(true);
    try {
      const res = await api.get(`/slots/pickup?city=${encodeURIComponent(city)}`);
      setSlotDays(res.data);
      setStep(2);
    } catch {
      toast.error('Could not load slots. Try again.');
    } finally {
      setLoadingSlots(false);
    }
  };

  const confirmBooking = async () => {
    if (!selectedSlot) { toast.error('Please select a time slot'); return; }
    setCreating(true);
    try {
      // Step 1: Create order
      const orderRes = await api.post('/orders', { city, pickupAddress: address, specialNotes });
      const orderId = orderRes.data.id;

      // Step 2: Book pickup slot
      await api.put(`/orders/${orderId}/pickup-slot`, { pickupSlot: selectedSlot.start });

      toast.success('Pickup slot booked! Now add your clothes 👔');
      router.push(`/orders/${orderId}/clothes`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Booking failed';
      toast.error(msg);
    } finally {
      setCreating(false);
    }
  };

  if (isLoading || !user) return <LoadingScreen message="Checking authorization..." />;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)', padding: '80px 24px' }}>
      <div style={{ maxWidth: 680, margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <Link href="/dashboard" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <ChevronLeft size={16} /> Back to Dashboard
            </Link>
            <ThemeToggle />
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8, color: 'var(--text-primary)' }}>Book a Pickup Slot</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 15 }}>Tell us where & when — we'll send our agent to collect your clothes.</p>
        </div>

        {/* Step Indicator */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 0, marginBottom: 40 }}>
          {[{ n: 1, label: 'Your Details' }, { n: 2, label: 'Pick a Slot' }].map((s, i) => (
            <Fragment key={s.n}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: step >= s.n ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(255,255,255,0.06)',
                  border: step >= s.n ? 'none' : '1px solid rgba(255,255,255,0.1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, fontWeight: 700, color: step >= s.n ? 'white' : '#52525b',
                  transition: 'all 0.3s',
                }}>
                  {s.n}
                </div>
                <span style={{ fontSize: 14, fontWeight: step === s.n ? 600 : 400, color: step === s.n ? 'white' : '#52525b' }}>{s.label}</span>
              </div>
              {i < 1 && <div style={{ flex: 1, height: 1, background: step > 1 ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.06)', margin: '0 16px' }} />}
            </Fragment>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="glass" style={{ padding: 32 }}>
              <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                <MapPin size={20} color="#6366f1" /> Pickup Details
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: 8 }}>City *</label>
                  <input
                    className="input-field"
                    placeholder="Mumbai"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: 8 }}>Pickup Address *</label>
                  <textarea
                    className="input-field"
                    placeholder="Flat 4B, Lotus Apartments, MG Road, Near Metro Station..."
                    rows={3}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    style={{ resize: 'vertical', minHeight: 80 }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: 8 }}>Special Instructions (optional)</label>
                  <input
                    className="input-field"
                    placeholder="Ring doorbell twice, call before coming..."
                    value={specialNotes}
                    onChange={(e) => setSpecialNotes(e.target.value)}
                  />
                </div>

                <motion.button
                  className="btn-primary"
                  onClick={loadSlots}
                  disabled={loadingSlots || !city || !address}
                  whileHover={{ scale: 1.02 }}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                >
                  {loadingSlots ? <><Loader size={16} className="animate-spin" /> Loading slots...</> : <>View Available Slots <ChevronRight size={16} /></>}
                </motion.button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className="glass" style={{ padding: 32 }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Clock size={20} color="#6366f1" /> Select Pickup Time
                </h2>

                {/* Day tabs */}
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 8, marginBottom: 24 }}>
                  {slotDays.map((day, i) => (
                    <button
                      key={day.date}
                      onClick={() => { setSelectedDay(i); setSelectedSlot(null); }}
                      style={{
                        flexShrink: 0, padding: '8px 16px', borderRadius: 10, border: 'none', cursor: 'pointer',
                        background: selectedDay === i ? 'linear-gradient(135deg,#6366f1,#4f46e5)' : 'rgba(255,255,255,0.06)',
                        color: selectedDay === i ? 'white' : '#a1a1aa',
                        fontWeight: selectedDay === i ? 700 : 400,
                        fontSize: 13,
                        transition: 'all 0.2s',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {day.displayDate}
                    </button>
                  ))}
                </div>

                {/* Slots grid */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 28 }}>
                  {slotDays[selectedDay]?.slots.map((slot) => (
                    <motion.button
                      key={slot.start}
                      disabled={!slot.available}
                      onClick={() => setSelectedSlot(slot)}
                      whileHover={slot.available ? { scale: 1.03 } : {}}
                      style={{
                        padding: '12px 8px',
                        borderRadius: 10,
                        border: selectedSlot?.start === slot.start
                          ? '2px solid #6366f1'
                          : '1px solid rgba(255,255,255,0.08)',
                        background: !slot.available
                          ? 'rgba(255,255,255,0.02)'
                          : selectedSlot?.start === slot.start
                            ? 'rgba(99,102,241,0.2)'
                            : 'rgba(255,255,255,0.05)',
                        color: !slot.available ? '#3f3f46' : 'white',
                        cursor: slot.available ? 'pointer' : 'not-allowed',
                        fontSize: 13,
                        fontWeight: 600,
                        transition: 'all 0.2s',
                        textAlign: 'center',
                      }}
                    >
                      {slot.label}
                      <div style={{ fontSize: 10, marginTop: 4, color: slot.available ? '#71717a' : '#3f3f46' }}>
                        {slot.available ? `${slot.remainingCapacity} left` : 'Full'}
                      </div>
                    </motion.button>
                  ))}
                </div>

                {selectedSlot && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 12, padding: 16, marginBottom: 20, fontSize: 14, color: '#a78bfa' }}
                  >
                    ✅ Selected: <strong>{slotDays[selectedDay]?.displayDate}</strong> — <strong>{selectedSlot.label}</strong>
                  </motion.div>
                )}

                <div style={{ display: 'flex', gap: 12 }}>
                  <button className="btn-secondary" onClick={() => setStep(1)} style={{ flex: '0 0 auto' }}>
                    <ChevronLeft size={16} />
                  </button>
                  <motion.button
                    className="btn-primary"
                    onClick={confirmBooking}
                    disabled={!selectedSlot || creating}
                    whileHover={{ scale: 1.02 }}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                  >
                    {creating ? 'Booking...' : <>Confirm Pickup Slot <ChevronRight size={16} /></>}
                  </motion.button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
