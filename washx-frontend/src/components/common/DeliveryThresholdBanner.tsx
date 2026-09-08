'use client';

import { motion } from 'framer-motion';
import { Truck, CheckCircle2, Zap, AlertTriangle } from 'lucide-react';
import { FREE_DELIVERY_THRESHOLD, STANDARD_DELIVERY_FEE, MIN_ORDER_VALUE } from '@/lib/constants';

interface DeliveryThresholdBannerProps {
  currentTotal: number;
  isExpress?: boolean;
}

export default function DeliveryThresholdBanner({ currentTotal, isExpress = false }: DeliveryThresholdBannerProps) {
  const isFreeDelivery = isExpress || currentTotal >= FREE_DELIVERY_THRESHOLD;
  const deliveryFee = isFreeDelivery ? 0 : STANDARD_DELIVERY_FEE;
  const amountNeeded = Math.max(0, FREE_DELIVERY_THRESHOLD - currentTotal);
  const progressPercent = Math.min(100, Math.round((currentTotal / FREE_DELIVERY_THRESHOLD) * 100));
  const belowMinimum = currentTotal < MIN_ORDER_VALUE && currentTotal > 0;
  const minOrderShortfall = Math.max(0, MIN_ORDER_VALUE - currentTotal);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {/* Free Delivery Bar */}
      <div
        style={{
          background: isFreeDelivery
            ? 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(6, 182, 212, 0.08))'
            : 'var(--bg-card)',
          border: isFreeDelivery
            ? '1px solid rgba(16, 185, 129, 0.35)'
            : '1px solid var(--border-card)',
          borderRadius: 16,
          padding: '16px 20px',
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {isExpress ? (
              <>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(6,182,212,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#06b6d4' }}>
                  <Zap size={16} />
                </div>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8' }}>Express Pass Member</span>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>Enjoy Unlimited FREE delivery on every order!</p>
                </div>
              </>
            ) : isFreeDelivery ? (
              <>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                  <CheckCircle2 size={16} />
                </div>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#10b981' }}>FREE Doorstep Delivery Unlocked! 🎉</span>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', margin: 0 }}>You saved ₹{STANDARD_DELIVERY_FEE} on this order</p>
                </div>
              </>
            ) : (
              <>
                <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#818cf8' }}>
                  <Truck size={16} />
                </div>
                <div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>
                    Add ₹{amountNeeded} more for <span style={{ color: '#10b981' }}>FREE Delivery</span>
                  </span>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', margin: 0 }}>
                    Orders under ₹{FREE_DELIVERY_THRESHOLD} include ₹{STANDARD_DELIVERY_FEE} delivery fee
                  </p>
                </div>
              </>
            )}
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: isFreeDelivery ? '#10b981' : 'var(--text-secondary)' }}>
              {isFreeDelivery ? 'FREE' : `₹${deliveryFee}`}
            </span>
          </div>
        </div>

        {/* Progress bar (only for non-subscribers) */}
        {!isExpress && (
          <div style={{ height: 6, background: 'rgba(255, 255, 255, 0.08)', borderRadius: 99, overflow: 'hidden' }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{
                height: '100%',
                background: isFreeDelivery
                  ? 'linear-gradient(90deg, #10b981, #06b6d4)'
                  : 'linear-gradient(90deg, #6366f1, #3b82f6)',
                borderRadius: 99,
              }}
            />
          </div>
        )}
      </div>

      {/* Minimum Order Value Alert */}
      {belowMinimum && (
        <div
          style={{
            background: 'rgba(245, 158, 11, 0.1)',
            border: '1px solid rgba(245, 158, 11, 0.3)',
            borderRadius: 12,
            padding: '12px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            color: '#fbbf24',
          }}
        >
          <AlertTriangle size={18} style={{ flexShrink: 0 }} />
          <div>
            <strong>Minimum order is ₹{MIN_ORDER_VALUE}.</strong> Add ₹{minOrderShortfall} more in garments to checkout.
          </div>
        </div>
      )}
    </div>
  );
}
