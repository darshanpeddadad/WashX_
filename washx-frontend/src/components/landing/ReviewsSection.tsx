'use client';

import { Star } from 'lucide-react';

const REVIEWS = [
  {
    name: 'Pooja Venkatesh',
    city: 'Bengaluru',
    rating: 5,
    text: 'Sent two heavy Kanjeevaram silk sarees for dry clean. They were returned in sealed breathable covers with zero crease damage. Truly exceptional service.',
    date: 'Verified Order #CMTN92',
  },
  {
    name: 'Aditya Sharma',
    city: 'Mumbai',
    rating: 5,
    text: 'Office shirts at ₹5-₹7 with steam ironing is unmatched. Raju picked up right at 8:15 AM and delivery was made on time the next evening.',
    date: 'Weekly Subscriber',
  },
  {
    name: 'Sneha Roy',
    city: 'Delhi NCR',
    rating: 5,
    text: 'The interactive load calculator was spot on. Paid exactly what was calculated on the screen without any hidden pickup fees. 10/10.',
    date: 'Verified Order #CMTK44',
  },
];

export default function ReviewsSection() {
  return (
    <section
      id="reviews"
      style={{
        padding: '70px 24px 90px',
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
            color: '#f59e0b',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 10,
          }}
        >
          Customer Trust
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
          Loved Across 100,000+ Indian Households
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 600, margin: '8px auto 0' }}>
          Real feedback from professionals, students, and families trusting WashX with their daily fabrics.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: 24,
        }}
      >
        {REVIEWS.map((rev, i) => (
          <div
            key={i}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: 20,
              padding: '28px 24px',
              boxShadow: 'var(--card-shadow)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
            }}
          >
            <div>
              <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
                {[...Array(rev.rating)].map((_, idx) => (
                  <Star key={idx} size={16} fill="#f59e0b" color="#f59e0b" />
                ))}
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: 20 }}>
                "{rev.text}"
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{rev.name}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{rev.city}</div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: '#10b981', background: 'rgba(16,185,129,0.1)', padding: '3px 8px', borderRadius: 6 }}>
                {rev.date}
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
