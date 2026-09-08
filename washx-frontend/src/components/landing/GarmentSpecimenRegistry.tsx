'use client';

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { CLOTHES_CATALOG, CATEGORY_LABELS, CATEGORY_ICONS, BASE_PRICES } from '@/lib/constants';

export default function GarmentSpecimenRegistry() {
  const { user } = useAuth();

  return (
    <section
      id="pricing"
      style={{
        padding: '80px 24px 100px',
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 50 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#6366f1',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 10,
            }}
          >
            Garment Catalog & Rates
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
            7 Garment Categories. Over 60+ Items.
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 600, margin: '8px auto 0' }}>
            Every category priced transparently per item. Wash, steam iron, and dry clean with zero hidden surcharges.
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
          }}
        >
          {Object.entries(CATEGORY_LABELS)
            .filter(([k]) => k !== 'common')
            .map(([k, label]) => {
              const items = CLOTHES_CATALOG[k as keyof typeof CLOTHES_CATALOG] || [];
              const price = BASE_PRICES[k];
              const icon = CATEGORY_ICONS[k as keyof typeof CATEGORY_ICONS] || '👔';

              return (
                <div
                  key={k}
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border-card)',
                    borderRadius: 20,
                    padding: '24px',
                    boxShadow: 'var(--card-shadow)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                      <span style={{ fontSize: 30 }}>{icon}</span>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: '#6366f1',
                          background: 'rgba(99, 102, 241, 0.12)',
                          padding: '4px 10px',
                          borderRadius: 8,
                          border: '1px solid rgba(99, 102, 241, 0.25)',
                        }}
                      >
                        From ₹{price}/pc
                      </span>
                    </div>

                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                      {label}
                    </h3>

                    <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
                      {items.slice(0, 4).map((itm) => (
                        <li
                          key={itm}
                          style={{
                            fontSize: 13,
                            color: 'var(--text-secondary)',
                            marginBottom: 6,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <span style={{ color: '#6366f1', fontSize: 10 }}>●</span>
                          <span>{itm}</span>
                        </li>
                      ))}
                      {items.length > 4 && (
                        <li style={{ fontSize: 12, color: 'var(--text-muted)', fontStyle: 'italic', marginTop: 4 }}>
                          + {items.length - 4} more items supported
                        </li>
                      )}
                    </ul>
                  </div>

                  <Link
                    href={user ? '/book' : '/register'}
                    style={{
                      textDecoration: 'none',
                      marginTop: 20,
                      display: 'block',
                      textAlign: 'center',
                      fontSize: 13,
                      fontWeight: 700,
                      color: '#6366f1',
                      padding: '10px 0',
                      borderTop: '1px solid var(--border-subtle)',
                    }}
                    className="hover:underline"
                  >
                    Book {label} →
                  </Link>
                </div>
              );
            })}
        </div>
      </div>
    </section>
  );
}
