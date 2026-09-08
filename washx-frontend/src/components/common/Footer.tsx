'use client';

import Link from 'next/link';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-subtle)',
        background: 'var(--bg-primary)',
        padding: '50px 24px 36px',
        position: 'relative',
        zIndex: 10,
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: 32,
        }}
      >
        {/* Top Info Grid */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 20,
            paddingBottom: 28,
            borderBottom: '1px solid var(--border-subtle)',
          }}
        >
          {/* Logo & Slogan */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 10,
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
              }}
            >
              🧺
            </div>
            <span
              style={{
                fontFamily: 'var(--font-display)',
                fontWeight: 800,
                fontSize: 18,
                background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              WashX
            </span>
            <span style={{ color: 'var(--text-dim)', margin: '0 4px' }}>|</span>
            <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 500 }}>
              Premium Fabric Care & On-Demand Laundry
            </span>
          </div>

          {/* Quick Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 13 }}>
            <Link href="/subscription" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Express Pass
            </Link>
            <Link href="/book" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
              Book Pickup
            </Link>
            <Link href="/dashboard" style={{ color: 'var(--text-secondary)', textDecoration: 'none' }}>
              My Orders
            </Link>
            <Link href="/agent/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              Agent Portal
            </Link>
            <Link href="/admin/login" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>
              Admin Ops
            </Link>
          </div>
        </div>

        {/* Bottom Disclaimer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
            fontSize: 12,
            color: 'var(--text-muted)',
          }}
        >
          <div>
            © {currentYear} WashX Technologies Pvt. Ltd. Operating across 50+ major cities in India.
          </div>
          <div style={{ display: 'flex', gap: 16 }}>
            <span>Free Pickup & Delivery on orders ₹250+</span>
            <span>•</span>
            <span>German Bio-Enzyme Technology</span>
            <span>•</span>
            <span>100% Barcode Traceability</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
