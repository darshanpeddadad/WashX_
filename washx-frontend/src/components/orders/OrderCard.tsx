'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ChevronRight, Zap } from 'lucide-react';
import StatusBadge from '@/components/common/StatusBadge';

export interface OrderItem {
  id: string;
  status: string;
  totalPrice: number;
  pickupSlot?: string;
  createdAt: string;
  isExpress?: boolean;
  turnaroundDays?: number;
  clothesItems: { quantity: number }[];
}

interface OrderCardProps {
  order: OrderItem;
}

export default function OrderCard({ order }: OrderCardProps) {
  const totalItems = order.clothesItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
  const isExpress = order.isExpress || order.turnaroundDays === 1;

  return (
    <Link href={`/orders/${order.id}`} style={{ textDecoration: 'none' }}>
      <motion.div
        whileHover={{ y: -2 }}
        transition={{ duration: 0.15 }}
        style={{
          background: 'var(--bg-card)',
          border: '1px solid var(--border-card)',
          borderRadius: 16,
          padding: '18px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 16,
          boxShadow: 'var(--card-shadow)',
          transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
        }}
      >
        {/* Left: Order Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: 12,
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))',
              border: '1px solid var(--border-subtle)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
            }}
          >
            🧺
          </div>
          <div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 2 }}>Order ID</div>
            <div
              style={{
                fontWeight: 700,
                fontSize: 15,
                fontFamily: 'monospace',
                color: 'var(--text-primary)',
                letterSpacing: 0.5,
              }}
            >
              {order.id.slice(0, 12).toUpperCase()}
            </div>
          </div>
        </div>

        {/* Right: Metrics & Badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Items</div>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-primary)' }}>{totalItems}</div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Total</div>
            <div style={{ fontWeight: 800, fontSize: 14, color: 'var(--text-primary)' }}>₹{order.totalPrice}</div>
          </div>

          <div>
            {isExpress ? (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#38bdf8',
                  background: 'rgba(56,189,248,0.12)',
                  border: '1px solid rgba(56,189,248,0.3)',
                  padding: '4px 8px',
                  borderRadius: 6,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Zap size={12} /> 1-Day Express
              </span>
            ) : (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 500,
                  color: 'var(--text-muted)',
                  background: 'var(--tag-bg)',
                  border: '1px solid var(--border-subtle)',
                  padding: '4px 8px',
                  borderRadius: 6,
                }}
              >
                3-Day Standard
              </span>
            )}
          </div>

          <StatusBadge status={order.status} size="sm" />

          <ChevronRight size={18} color="var(--text-muted)" />
        </div>
      </motion.div>
    </Link>
  );
}
