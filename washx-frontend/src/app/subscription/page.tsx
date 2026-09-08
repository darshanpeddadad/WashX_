'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  Zap,
  Clock,
  CheckCircle2,
  ArrowRight,
  ChevronLeft,
  Crown,
  Loader,
  ShieldAlert,
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  durationDays: number;
  turnaroundDays: number;
  turnaroundLabel: string;
  tagline: string;
  description: string;
  popular?: boolean;
  fupLabel?: string;
  features: string[];
}

interface UserSubscription {
  hasSubscription: boolean;
  isActive: boolean;
  plan: string | null;
  planDetails: SubscriptionPlan | null;
  startDate: string | null;
  endDate: string | null;
  daysRemaining: number;
  turnaroundDays: number;
  deliverySpeedLabel: string;
}

interface FupUsage {
  isSubscriber: boolean;
  plan?: string;
  usedPickups?: number;
  usedItems?: number;
  maxPickups?: number;
  maxItems?: number;
  pickupPercentUsed?: number;
  itemPercentUsed?: number;
  daysRemaining?: number;
}


export default function SubscriptionPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [mySub, setMySub] = useState<UserSubscription | null>(null);
  const [fupUsage, setFupUsage] = useState<FupUsage | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string>('MONTHLY');
  const [loading, setLoading] = useState(true);
  const [subscribing, setSubscribing] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchStatus = useCallback(async () => {
    try {
      const [plansRes, myRes] = await Promise.all([
        api.get('/subscriptions/plans'),
        user ? api.get('/subscriptions/my').catch(() => ({ data: null })) : Promise.resolve({ data: null }),
      ]);
      setPlans(plansRes.data.plans || []);
      if (myRes?.data) {
        setMySub(myRes.data);
        if (myRes.data.plan) {
          setSelectedPlanId(myRes.data.plan);
        }
      }
      // Fetch FUP usage if user is subscribed
      if (user && myRes?.data?.isActive) {
        const usageRes = await api.get('/subscriptions/usage').catch(() => ({ data: null }));
        if (usageRes?.data) setFupUsage(usageRes.data);
      }
    } catch {
      toast.error('Could not load subscription details');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchStatus();
  }, [fetchStatus]);

  // Load Razorpay script dynamically
  const loadRazorpay = () =>
    new Promise<boolean>((resolve) => {
      if ((window as unknown as Record<string, unknown>).Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handleSubscribe = async (planId: string) => {
    if (!user) {
      toast.error('Please login to activate a subscription');
      router.push('/login');
      return;
    }

    setSubscribing(true);
    try {
      // Step 1: Create Razorpay order
      const orderRes = await api.post('/subscriptions/create-order', { plan: planId });
      const { razorpayOrderId, amount, currency, key, planDetails } = orderRes.data;

      // Step 2: Load Razorpay SDK
      const loaded = await loadRazorpay();
      if (!loaded) {
        toast.error('Payment gateway failed to load. Please try again.');
        setSubscribing(false);
        return;
      }

      // Step 3: Open Razorpay checkout
      const options = {
        key,
        amount,
        currency,
        name: 'WashX',
        description: planDetails?.name || 'Express Pass Subscription',
        order_id: razorpayOrderId,
        handler: async (response: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }) => {
          try {
            // Step 4: Verify and activate
            const verifyRes = await api.post('/subscriptions/verify-and-activate', {
              plan: planId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            });
            toast.success(verifyRes.data.message || '⚡ Express Pass Activated!');
            await fetchStatus();
          } catch {
            toast.error('Payment received but activation failed. Contact support.');
          }
        },
        prefill: { name: user.name, email: user.email },
        theme: { color: '#06b6d4' },
        modal: {
          ondismiss: () => {
            toast('Payment cancelled.');
            setSubscribing(false);
          },
        },
      };

      const rzp = new (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Could not initiate payment';
      toast.error(msg);
    } finally {
      setSubscribing(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel? Your turnaround will revert to 3 days.')) return;
    setCancelling(true);
    try {
      await api.post('/subscriptions/cancel');
      toast.success('Subscription cancelled. Reverted to standard 3-day turnaround.');
      await fetchStatus();
    } catch {
      toast.error('Could not cancel subscription');
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: '#060608', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Loader className="animate-spin text-cyan-400" size={32} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-primary)', color: 'var(--text-primary)' }} className="selection:bg-cyan-500/30">
      {/* Background radial atmosphere */}
      <div
        style={{
          position: 'fixed',
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: '90vw',
          maxWidth: 1200,
          height: 600,
          background: 'radial-gradient(ellipse at center, rgba(99,102,241,0.12) 0%, rgba(6,182,212,0.04) 50%, transparent 80%)',
          filter: 'blur(90px)',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Top Navbar */}
      <nav
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 50,
          backdropFilter: 'blur(20px)',
          background: 'var(--nav-bg)',
          borderBottom: '1px solid var(--nav-border)',
          padding: '0 24px',
          transition: 'background-color 0.25s ease, border-color 0.25s ease',
        }}
      >
        <div
          style={{
            maxWidth: 1200,
            margin: '0 auto',
            height: 68,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link
              href="/"
              style={{
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                color: 'var(--text-secondary)',
                fontSize: 13,
                fontWeight: 600,
              }}
              className="hover:text-indigo-500 transition-colors"
            >
              <ChevronLeft size={16} /> Home
            </Link>
            <div style={{ width: 1, height: 16, background: 'var(--border-subtle)' }} />
            <span style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.04em' }}>
              WASHX EXPRESS PASS
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <ThemeToggle />

            {user ? (
              <Link
                href="/dashboard"
                style={{
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '6px 14px',
                  borderRadius: 999,
                  background: 'var(--btn-outline-bg)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                style={{
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '6px 14px',
                  borderRadius: 999,
                  background: 'var(--btn-outline-bg)',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Container */}
      <main style={{ maxWidth: 1200, margin: '0 auto', padding: '56px 24px 100px', position: 'relative', zIndex: 10 }}>
        {/* Active Subscription Banner if user is currently subscribed */}
        {mySub?.isActive && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: 40,
              padding: '24px 32px',
              borderRadius: 20,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.18), rgba(6,182,212,0.12))',
              border: '1px solid rgba(99,102,241,0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 20,
              boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
              <div
                style={{
                  width: 52,
                  height: 52,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg,#6366f1,#06b6d4)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  boxShadow: '0 0 30px rgba(99,102,241,0.5)',
                }}
              >
                <Crown size={26} />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 18, fontWeight: 800, color: '#ffffff' }}>
                    {mySub.planDetails?.name || mySub.plan} Active
                  </span>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      padding: '3px 10px',
                      borderRadius: 999,
                      background: 'rgba(16,185,129,0.2)',
                      border: '1px solid rgba(16,185,129,0.4)',
                      color: '#34d399',
                    }}
                  >
                    1-Day Express Enabled
                  </span>
                </div>
                <p style={{ color: '#a1a1aa', fontSize: 14, margin: 0 }}>
                  Your turnaround is <strong>1 Day (24 Hours)</strong>. Pass expires in{' '}
                  <span style={{ color: '#38bdf8', fontWeight: 700 }}>{mySub.daysRemaining} days</span> (
                  {mySub.endDate ? new Date(mySub.endDate).toLocaleDateString('en-IN') : ''}).
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link href="/book">
                <button
                  className="btn-pill"
                  style={{
                    padding: '12px 24px',
                    fontSize: 14,
                    fontWeight: 700,
                  }}
                >
                  <span>Book 1-Day Pickup</span>
                  <div className="btn-pill-arrow">
                    <ArrowRight size={14} />
                  </div>
                </button>
              </Link>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                style={{
                  padding: '12px 20px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#71717a',
                  fontSize: 13,
                  cursor: cancelling ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s',
                }}
                className="hover:text-red-400 hover:border-red-500/30"
              >
                {cancelling ? 'Cancelling...' : 'Cancel Pass'}
              </button>
            </div>
          </motion.div>
        )}

        {/* FUP Usage Widget */}
        {mySub?.isActive && fupUsage?.isSubscriber && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            style={{
              marginBottom: 32,
              padding: '20px 28px',
              borderRadius: 16,
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 20,
            }}
          >
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600 }}>Express Pickups Used</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: (fupUsage.pickupPercentUsed ?? 0) > 80 ? '#f87171' : '#34d399' }}>
                  {fupUsage.usedPickups}/{fupUsage.maxPickups}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  borderRadius: 999,
                  width: `${fupUsage.pickupPercentUsed ?? 0}%`,
                  background: (fupUsage.pickupPercentUsed ?? 0) > 80 ? 'linear-gradient(90deg,#ef4444,#f97316)' : 'linear-gradient(90deg,#6366f1,#06b6d4)',
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, color: '#a1a1aa', fontWeight: 600 }}>Express Garments Used</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: (fupUsage.itemPercentUsed ?? 0) > 80 ? '#f87171' : '#34d399' }}>
                  {fupUsage.usedItems}/{fupUsage.maxItems}
                </span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.08)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  borderRadius: 999,
                  width: `${fupUsage.itemPercentUsed ?? 0}%`,
                  background: (fupUsage.itemPercentUsed ?? 0) > 80 ? 'linear-gradient(90deg,#ef4444,#f97316)' : 'linear-gradient(90deg,#6366f1,#06b6d4)',
                  transition: 'width 0.6s ease',
                }} />
              </div>
            </div>
            {((fupUsage.pickupPercentUsed ?? 0) > 80 || (fupUsage.itemPercentUsed ?? 0) > 80) && (
              <div style={{ gridColumn: '1/-1', display: 'flex', alignItems: 'center', gap: 8, color: '#fbbf24', fontSize: 12, fontWeight: 600 }}>
                <ShieldAlert size={14} />
                You&apos;re approaching your Fair Usage Policy limit. Renewing your plan resets your allowances.
              </div>
            )}
          </motion.div>
        )}

        {/* Hero Section */}
        <div style={{ textAlign: 'center', maxWidth: 840, margin: '0 auto 60px' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 16px',
              borderRadius: 999,
              background: 'rgba(99,102,241,0.1)',
              border: '1px solid rgba(99,102,241,0.3)',
              color: '#818cf8',
              fontSize: 12,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 20,
            }}
          >
            <Zap size={14} className="text-cyan-400" />
            Turnaround Engineering
          </div>

          <h1
            className="font-heading"
            style={{
              fontSize: 'clamp(2.4rem, 5vw, 4.2rem)',
              lineHeight: 1.05,
              fontWeight: 800,
              letterSpacing: '-0.03em',
              marginBottom: 20,
              color: '#ffffff',
            }}
          >
            GET YOUR CLOTHES BACK IN{' '}
            <span
              style={{
                background: 'linear-gradient(135deg, #ffffff 0%, #38bdf8 60%, #818cf8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              1 DAY INSTEAD OF 3
            </span>
          </h1>

          <p
            style={{
              fontSize: 17,
              lineHeight: 1.6,
              color: '#a1a1aa',
              maxWidth: 640,
              margin: '0 auto',
            }}
          >
            Standard orders take <strong>3 days</strong> to carefully process. With an active{' '}
            <strong style={{ color: '#fff' }}>WashX Express Pass</strong>, unlock priority washer allocation,
            express delivery slots, and <strong>24-hour return</strong>.
          </p>

          {/* Turnaround speed indicator pill */}
          <div
            style={{
              marginTop: 36,
              display: 'inline-flex',
              alignItems: 'center',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 999,
              padding: '6px 8px',
              gap: 8,
            }}
          >
            <div
              style={{
                padding: '8px 20px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 600,
                color: '#71717a',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <Clock size={14} /> Without Pass: 3 Days (72h)
            </div>
            <div
              style={{
                padding: '8px 20px',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                background: 'linear-gradient(135deg,#6366f1,#06b6d4)',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 4px 16px rgba(99,102,241,0.3)',
              }}
            >
              <Zap size={14} /> With Pass: 1 Day (24h Express)
            </div>
          </div>
        </div>

        {/* Plan Cards Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: 24,
            marginBottom: 72,
          }}
        >
          {plans.map((plan) => {
            const isCurrent = mySub?.isActive && mySub.plan === plan.id;
            const isSelected = selectedPlanId === plan.id;

            return (
              <motion.div
                key={plan.id}
                whileHover={{ y: -6 }}
                transition={{ duration: 0.2 }}
                onClick={() => setSelectedPlanId(plan.id)}
                style={{
                  cursor: 'pointer',
                  position: 'relative',
                  borderRadius: 24,
                  padding: 36,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  background: plan.popular
                    ? 'linear-gradient(180deg, rgba(24,25,36,0.95) 0%, rgba(12,13,18,0.95) 100%)'
                    : 'rgba(15,16,22,0.85)',
                  border: plan.popular
                    ? '1.5px solid rgba(99,102,241,0.6)'
                    : isSelected
                    ? '1.5px solid rgba(255,255,255,0.3)'
                    : '1px solid rgba(255,255,255,0.08)',
                  boxShadow: plan.popular
                    ? '0 20px 50px -10px rgba(99,102,241,0.25), inset 0 1px 0 rgba(255,255,255,0.1)'
                    : '0 10px 30px rgba(0,0,0,0.4)',
                }}
              >
                {/* Popular / Best Value Ribbon */}
                {plan.popular && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -13,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                      color: 'white',
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '4px 16px',
                      borderRadius: 999,
                      boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    ★ Most Popular for Homes
                  </div>
                )}

                {plan.id === 'YEARLY' && (
                  <div
                    style={{
                      position: 'absolute',
                      top: -13,
                      left: '50%',
                      transform: 'translateX(-50%)',
                      background: 'linear-gradient(135deg, #10b981, #059669)',
                      color: 'white',
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      padding: '4px 16px',
                      borderRadius: 999,
                      boxShadow: '0 4px 14px rgba(16,185,129,0.3)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    30% Annual Savings
                  </div>
                )}

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <div>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          color: '#818cf8',
                        }}
                      >
                        {plan.tagline}
                      </span>
                      <h3
                        className="font-heading"
                        style={{
                          fontSize: 22,
                          fontWeight: 700,
                          color: '#ffffff',
                          marginTop: 4,
                          marginBottom: 0,
                        }}
                      >
                        {plan.name}
                      </h3>
                    </div>

                    {isCurrent && (
                      <span
                        style={{
                          padding: '4px 10px',
                          borderRadius: 999,
                          background: 'rgba(16,185,129,0.15)',
                          border: '1px solid rgba(16,185,129,0.3)',
                          color: '#34d399',
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        Current
                      </span>
                    )}
                  </div>

                  {/* Price */}
                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, margin: '20px 0 16px' }}>
                    <span
                      className="font-heading"
                      style={{
                        fontSize: 44,
                        fontWeight: 800,
                        letterSpacing: '-0.03em',
                        color: '#ffffff',
                      }}
                    >
                      ₹{plan.price}
                    </span>
                    <span style={{ color: '#71717a', fontSize: 14, fontWeight: 500 }}>
                      / {plan.id === 'WEEKLY' ? '7 days' : plan.id === 'MONTHLY' ? 'month' : 'year'}
                    </span>
                  </div>

                  {/* Turnaround highlight */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '10px 14px',
                      borderRadius: 12,
                      background: 'rgba(56,189,248,0.08)',
                      border: '1px solid rgba(56,189,248,0.2)',
                      marginBottom: 12,
                    }}
                  >
                    <Zap size={16} className="text-cyan-400 shrink-0" />
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>
                      {plan.turnaroundLabel} Delivery
                    </span>
                  </div>

                  {/* FUP Capacity Badge */}
                  {plan.fupLabel && (
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '6px 12px',
                        borderRadius: 8,
                        background: 'rgba(99, 102, 241, 0.12)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#a5b4fc',
                        marginBottom: 18,
                      }}
                    >
                      <span>🛡️ {plan.fupLabel}</span>
                    </div>
                  )}

                  <p style={{ color: '#a1a1aa', fontSize: 14, lineHeight: 1.5, marginBottom: 24 }}>
                    {plan.description}
                  </p>

                  {/* Features list */}
                  <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 20, marginBottom: 28 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#52525b', marginBottom: 14 }}>
                      Included Privileges:
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {plan.features.map((feat, idx) => (
                        <li key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, fontSize: 13, color: '#d4d4d8' }}>
                          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" style={{ marginTop: 2 }} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Card CTA */}
                <div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSubscribe(plan.id);
                    }}
                    disabled={subscribing || isCurrent}
                    className={plan.popular ? 'btn-pill' : 'btn-pill'}
                    style={{
                      width: '100%',
                      padding: '14px 20px',
                      fontSize: 14,
                      fontWeight: 700,
                      justifyContent: 'center',
                      opacity: isCurrent ? 0.6 : 1,
                      cursor: isCurrent ? 'default' : 'pointer',
                    }}
                  >
                    <span>
                      {isCurrent
                        ? 'Current Active Pass'
                        : subscribing && selectedPlanId === plan.id
                        ? 'Activating...'
                        : `Activate ${plan.id === 'WEEKLY' ? 'Weekly' : plan.id === 'MONTHLY' ? 'Monthly' : 'Yearly'} Pass`}
                    </span>
                    {!isCurrent && (
                      <div className="btn-pill-arrow">
                        <ArrowRight size={14} />
                      </div>
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Feature Matrix / Comparison Table */}
        <section
          style={{
            background: 'rgba(15,16,22,0.85)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 24,
            padding: '40px 32px',
            marginBottom: 72,
          }}
        >
          <div style={{ textAlign: 'center', maxWidth: 640, margin: '0 auto 36px' }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#818cf8' }}>
              Comparison Matrix
            </span>
            <h2 className="font-heading" style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', marginTop: 4 }}>
              Standard Turnaround vs. WashX Express
            </h2>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 600 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '16px 20px', color: '#71717a', fontSize: 13, fontWeight: 600 }}>Capability</th>
                  <th style={{ padding: '16px 20px', color: '#a1a1aa', fontSize: 13, fontWeight: 600 }}>Standard (No Pass)</th>
                  <th style={{ padding: '16px 20px', color: '#38bdf8', fontSize: 14, fontWeight: 700 }}>WashX Express Pass ⚡</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: 14 }}>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px 20px', color: '#f4f4f5', fontWeight: 600 }}>Delivery Turnaround</td>
                  <td style={{ padding: '16px 20px', color: '#71717a' }}>3 Days (72 Hours)</td>
                  <td style={{ padding: '16px 20px', color: '#34d399', fontWeight: 700 }}>
                    1 Day (24 Hours Express)
                  </td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px 20px', color: '#f4f4f5', fontWeight: 600 }}>Washer Processing Queue</td>
                  <td style={{ padding: '16px 20px', color: '#71717a' }}>Standard chronological</td>
                  <td style={{ padding: '16px 20px', color: '#ffffff', fontWeight: 600 }}>VIP Priority Queue</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px 20px', color: '#f4f4f5', fontWeight: 600 }}>Peak Hours Slot Access</td>
                  <td style={{ padding: '16px 20px', color: '#71717a' }}>Subject to availability</td>
                  <td style={{ padding: '16px 20px', color: '#ffffff', fontWeight: 600 }}>Guaranteed Preferred Windows</td>
                </tr>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                  <td style={{ padding: '16px 20px', color: '#f4f4f5', fontWeight: 600 }}>Doorstep Pickup & Delivery</td>
                  <td style={{ padding: '16px 20px', color: '#71717a' }}>Across 50+ cities</td>
                  <td style={{ padding: '16px 20px', color: '#ffffff', fontWeight: 600 }}>Across 50+ cities (Zero surcharge)</td>
                </tr>
                <tr>
                  <td style={{ padding: '16px 20px', color: '#f4f4f5', fontWeight: 600 }}>Garment Protection</td>
                  <td style={{ padding: '16px 20px', color: '#71717a' }}>Standard ₹5,000 policy</td>
                  <td style={{ padding: '16px 20px', color: '#ffffff', fontWeight: 600 }}>Express Priority Replacement Guarantee</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ Section */}
        <section style={{ maxWidth: 840, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 36 }}>
            <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#818cf8' }}>
              Frequently Asked Questions
            </span>
            <h2 className="font-heading" style={{ fontSize: 26, fontWeight: 700, color: '#ffffff', marginTop: 4 }}>
              Everything You Need to Know
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              {
                q: 'How does 1-day express delivery work?',
                a: 'When an agent picks up your clothes, your order is tagged with an express priority barcode. It bypasses regular batch queues into our immediate wash & steam chamber and is scheduled for doorstep delivery within 24 hours (next day).',
              },
              {
                q: 'What happens without a subscription?',
                a: 'Standard orders without an active pass take 3 business days (72 hours) to complete our thorough multi-stage cleaning and return cycle.',
              },
              {
                q: 'Can I switch between weekly, monthly, or yearly?',
                a: 'Yes! You can upgrade or renew anytime. When you activate a new pass, the extra duration is seamlessly added to your existing expiration date.',
              },
              {
                q: 'Is there a limit on how many orders I can place?',
                a: 'No. Active subscribers enjoy unlimited orders with 1-day express turnaround throughout the entire duration of their pass.',
              },
            ].map((faq, i) => (
              <div
                key={i}
                style={{
                  padding: '24px 28px',
                  borderRadius: 16,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.06)',
                }}
              >
                <h4 style={{ fontSize: 16, fontWeight: 700, color: '#ffffff', marginBottom: 8 }}>
                  {faq.q}
                </h4>
                <p style={{ color: '#a1a1aa', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
