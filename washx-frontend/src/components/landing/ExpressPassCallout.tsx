'use client';

import Link from 'next/link';
import { Zap, Check, ArrowRight } from 'lucide-react';

export default function ExpressPassCallout() {
  return (
    <section
      id="pass"
      style={{
        padding: '90px 24px 100px',
        maxWidth: 1200,
        margin: '0 auto',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 50 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: '#38bdf8',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 10,
          }}
        >
          Express Membership
        </div>
        <h2
          style={{
            fontSize: 'clamp(28px, 4vw, 44px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            letterSpacing: '-0.02em',
            fontFamily: 'var(--font-display, inherit)',
          }}
        >
          Unlock 24-Hour Express Turnaround
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 620, margin: '8px auto 0' }}>
          Subscribe to WashX Express Pass for unlimited free doorstep delivery and priority 1-day processing.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 24,
          marginBottom: 40,
        }}
      >
        {/* Monthly Plan */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 24,
            padding: '32px 24px',
            boxShadow: 'var(--card-shadow)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 8 }}>
              Standard Monthly
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)' }}>₹349</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ 30 days</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={16} color="#10b981" /> <strong>Unlimited FREE Delivery</strong>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={16} color="#10b981" /> 24-Hour Turnaround (vs 3 days)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={16} color="#10b981" /> 8 Express Pickups (80 pcs cap)
              </li>
            </ul>
          </div>

          <Link
            href="/subscription"
            style={{
              textDecoration: 'none',
              color: 'var(--text-primary)',
              background: 'var(--tag-bg)',
              border: '1px solid var(--border-card)',
              padding: '12px',
              borderRadius: 12,
              textAlign: 'center',
              fontWeight: 700,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <span>Get Monthly Pass</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        {/* Annual Elite (Highlighted) */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.12))',
            border: '2px solid rgba(99,102,241,0.5)',
            borderRadius: 24,
            padding: '32px 24px',
            boxShadow: '0 20px 40px -10px rgba(99,102,241,0.3)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            position: 'relative',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -12,
              right: 24,
              background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
              color: '#ffffff',
              fontSize: 11,
              fontWeight: 800,
              padding: '4px 12px',
              borderRadius: 99,
              letterSpacing: '0.05em',
            }}
          >
            BEST VALUE • SAVE 40%
          </div>

          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#38bdf8', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Zap size={14} /> Annual Elite Pass
            </div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 16 }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: 'var(--text-primary)' }}>₹2,499</span>
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>/ 365 days</span>
            </div>

            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13, color: 'var(--text-secondary)' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={16} color="#10b981" /> <strong>Unlimited FREE Delivery 365 Days</strong>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={16} color="#10b981" /> Guaranteed 1-Day Express Return
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={16} color="#10b981" /> 100 Pickups (1,000 pcs FUP cap)
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Check size={16} color="#10b981" /> Complimentary Garment Hanger Bags
              </li>
            </ul>
          </div>

          <Link
            href="/subscription"
            style={{
              textDecoration: 'none',
              color: '#ffffff',
              background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
              padding: '12px',
              borderRadius: 12,
              textAlign: 'center',
              fontWeight: 700,
              fontSize: 14,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
              boxShadow: '0 8px 20px -4px rgba(99, 102, 241, 0.4)',
            }}
          >
            <span>Activate Annual Elite</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    </section>
  );
}
