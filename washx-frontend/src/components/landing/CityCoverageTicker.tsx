'use client';

import { MapPin } from 'lucide-react';

const CITIES = [
  'Mumbai', 'Delhi NCR', 'Bengaluru', 'Hyderabad', 'Chennai',
  'Kolkata', 'Pune', 'Ahmedabad', 'Jaipur', 'Chandigarh',
  'Lucknow', 'Surat', 'Kochi', 'Indore', 'Bhopal',
  'Visakhapatnam', 'Vadodara', 'Coimbatore', 'Nagpur', 'Patna',
];

export default function CityCoverageTicker() {
  return (
    <section
      id="coverage"
      style={{
        borderTop: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        background: 'var(--bg-surface)',
        padding: '16px 0',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        <div
          style={{
            paddingLeft: 24,
            paddingRight: 20,
            fontSize: 12,
            fontWeight: 800,
            letterSpacing: '0.08em',
            color: '#6366f1',
            textTransform: 'uppercase',
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <MapPin size={15} /> Active Metros:
        </div>

        <div style={{ overflow: 'hidden', flex: 1 }}>
          <div className="animate-ticker" style={{ display: 'flex', whiteSpace: 'nowrap' }}>
            {[...CITIES, ...CITIES].map((city, idx) => (
              <div
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 16px',
                  marginRight: 10,
                  borderRadius: 99,
                  background: 'var(--tag-bg)',
                  border: '1px solid var(--border-subtle)',
                  fontSize: 13,
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                }}
              >
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#06b6d4' }} />
                <span>{city}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
