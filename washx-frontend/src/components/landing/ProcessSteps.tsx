'use client';

const PROCESS_STEPS = [
  {
    index: '01',
    title: 'One-Click Slot Scheduling',
    desc: 'Select a convenient 1-hour collection slot. A verified WashX delivery associate arrives with sanitized tote bags.',
    tag: 'Doorstep Pickup',
  },
  {
    index: '02',
    title: 'Individual QR Barcoding',
    desc: 'Each garment is logged and tagged with an individual barcode. Zero garment mix-ups, complete fabric tracking.',
    tag: '100% Traceability',
  },
  {
    index: '03',
    title: 'Enzyme Infused RO Washing',
    desc: 'Treated in triple-filtered RO water with fabric-specific bio-enzymes to eliminate odors and lock in original dyes.',
    tag: 'German Chemistry',
  },
  {
    index: '04',
    title: 'High-Pressure Steam & Return',
    desc: 'Commercial steam pressing creates showroom creases without fiber burn. Delivered in protective packaging in 24 hours.',
    tag: '24-48h Return',
  },
];

export default function ProcessSteps() {
  return (
    <section
      id="process"
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
            color: '#6366f1',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 10,
          }}
        >
          Execution Pipeline
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
          The 4-Stage Fabric Care Protocol
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 620, margin: '8px auto 0' }}>
          Standardized industrial precision from the moment your clothes leave your door until they return crisp and fragrant.
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: 20,
        }}
      >
        {PROCESS_STEPS.map((step) => (
          <div
            key={step.index}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: 20,
              padding: '28px 24px',
              boxShadow: 'var(--card-shadow)',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    fontFamily: 'monospace',
                    background: 'linear-gradient(135deg, #6366f1, #06b6d4)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  {step.index}
                </span>
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '4px 10px',
                    borderRadius: 99,
                    background: 'var(--tag-bg)',
                    border: '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {step.tag}
                </span>
              </div>

              <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 10 }}>
                {step.title}
              </h3>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, margin: 0 }}>
                {step.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
