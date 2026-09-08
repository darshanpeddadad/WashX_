'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { IndianRupee, ShieldCheck, Loader } from 'lucide-react';

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  prefill: { name: string; email: string; contact: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => { open: () => void };
  }
}

interface Props {
  orderId: string;
  amount: number;
  userName: string;
  userEmail: string;
  userPhone: string;
  onSuccess: () => void;
}

export default function RazorpayCheckout({ orderId, amount, userName, userEmail, userPhone, onSuccess }: Props) {
  const [loading, setLoading] = useState(false);

  const loadScript = (): Promise<boolean> =>
    new Promise((resolve) => {
      if (window.Razorpay) { resolve(true); return; }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePay = async () => {
    setLoading(true);
    try {
      const loaded = await loadScript();
      if (!loaded) { toast.error('Razorpay failed to load. Check your connection.'); return; }

      // Create Razorpay order
      const { data } = await api.post('/payments/create-order', { orderId });

      const options: RazorpayOptions = {
        key: data.key,
        amount: data.amount,
        currency: data.currency,
        name: 'WashX',
        description: `Order #${orderId.slice(0, 12).toUpperCase()}`,
        order_id: data.razorpayOrderId,
        handler: async (response) => {
          try {
            await api.post('/payments/verify', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              orderId,
            });
            toast.success('Payment successful! 🎉 Pickup confirmed!');
            onSuccess();
          } catch {
            toast.error('Payment verification failed. Contact support.');
          }
        },
        prefill: { name: userName, email: userEmail, contact: userPhone },
        theme: { color: '#6366f1' },
        modal: { ondismiss: () => toast('Payment cancelled', { icon: '⚠️' }) },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Payment initiation failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="glass"
      style={{ padding: 24, background: 'linear-gradient(135deg, rgba(99,102,241,0.08), rgba(6,182,212,0.05))', border: '1px solid rgba(99,102,241,0.25)' }}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <ShieldCheck size={18} color="#10b981" />
        <span style={{ fontWeight: 700, fontSize: 16 }}>Secure Payment</span>
        <span style={{ fontSize: 12, color: '#71717a', marginLeft: 'auto' }}>Powered by Razorpay</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <span style={{ color: '#a1a1aa', fontSize: 15 }}>Order Total</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontSize: 28, fontWeight: 900, background: 'linear-gradient(135deg,#6366f1,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          <IndianRupee size={20} color="#6366f1" />{amount}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        {['UPI', 'Cards', 'Wallets', 'NetBanking'].map((m) => (
          <div key={m} style={{ fontSize: 11, padding: '3px 10px', borderRadius: 6, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: '#71717a' }}>{m}</div>
        ))}
      </div>

      <motion.button
        onClick={handlePay}
        disabled={loading || amount === 0}
        whileHover={{ scale: loading ? 1 : 1.02 }}
        whileTap={{ scale: 0.98 }}
        style={{
          width: '100%', padding: '14px 24px', borderRadius: 12, border: 'none',
          background: amount === 0 ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#6366f1,#4f46e5)',
          color: 'white', fontWeight: 700, fontSize: 15, cursor: loading || amount === 0 ? 'not-allowed' : 'pointer',
          opacity: loading ? 0.7 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          boxShadow: amount > 0 ? '0 4px 20px rgba(99,102,241,0.4)' : 'none',
        }}
      >
        {loading ? <><Loader size={16} className="animate-spin" /> Processing...</> : `Pay ₹${amount} with Razorpay`}
      </motion.button>

      {amount === 0 && <p style={{ textAlign: 'center', fontSize: 12, color: '#52525b', marginTop: 10 }}>Add clothes to enable payment</p>}

      <p style={{ textAlign: 'center', fontSize: 12, color: '#52525b', marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
        <ShieldCheck size={11} /> 256-bit SSL encryption · PCI DSS compliant
      </p>
    </motion.div>
  );
}
