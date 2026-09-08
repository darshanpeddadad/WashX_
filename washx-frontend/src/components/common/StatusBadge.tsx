'use client';

import { ORDER_STATUS_CONFIG } from '@/lib/constants';

interface StatusBadgeProps {
  status: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
}

export default function StatusBadge({ status, size = 'md', showIcon = true }: StatusBadgeProps) {
  const config = ORDER_STATUS_CONFIG[status] || {
    label: status.replace(/_/g, ' '),
    color: '#64748b',
    icon: '📦',
  };

  const sizeStyles = {
    sm: { fontSize: '11px', padding: '3px 8px', gap: '4px', borderRadius: '6px' },
    md: { fontSize: '12px', padding: '4px 10px', gap: '6px', borderRadius: '8px' },
    lg: { fontSize: '13px', padding: '6px 14px', gap: '8px', borderRadius: '10px' },
  }[size];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        fontWeight: 700,
        letterSpacing: '0.02em',
        color: config.color,
        background: `${config.color}15`,
        border: `1px solid ${config.color}35`,
        ...sizeStyles,
      }}
    >
      {showIcon && <span style={{ lineHeight: 1 }}>{config.icon}</span>}
      <span>{config.label}</span>
    </span>
  );
}
