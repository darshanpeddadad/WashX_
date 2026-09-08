'use client';

import { ReactNode } from 'react';

interface MetricCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: string;
  accentColor?: string;
  onClick?: () => void;
}

export default function MetricCard({
  icon,
  label,
  value,
  subtitle,
  trend,
  accentColor = '#6366f1',
  onClick,
}: MetricCardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--bg-card)',
        border: '1px solid var(--border-card)',
        borderRadius: 16,
        padding: '20px 24px',
        boxShadow: 'var(--card-shadow)',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
      }}
      className={onClick ? 'hover:translate-y-[-2px]' : ''}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</span>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: `${accentColor}18`,
            border: `1px solid ${accentColor}30`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accentColor,
          }}
        >
          {icon}
        </div>
      </div>

      <div>
        <div
          style={{
            fontSize: 'clamp(24px, 3vw, 30px)',
            fontWeight: 800,
            color: 'var(--text-primary)',
            lineHeight: 1.1,
            marginBottom: 4,
            fontFamily: 'var(--font-display, inherit)',
          }}
        >
          {value}
        </div>

        {(subtitle || trend) && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-muted)' }}>
            {trend && <span style={{ color: '#10b981', fontWeight: 600 }}>{trend}</span>}
            {subtitle && <span>{subtitle}</span>}
          </div>
        )}
      </div>
    </div>
  );
}
