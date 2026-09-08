'use client';

import { Plus, Minus } from 'lucide-react';

interface StepperProps {
  value: number;
  onChange: (newValue: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
}

export default function Stepper({
  value,
  onChange,
  min = 0,
  max = 999,
  size = 'md',
}: StepperProps) {
  const isSm = size === 'sm';
  const btnSize = isSm ? 26 : 32;
  const iconSize = isSm ? 12 : 14;

  const handleDecrement = () => {
    if (value > min) onChange(value - 1);
  };

  const handleIncrement = () => {
    if (value < max) onChange(value + 1);
  };

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: isSm ? 6 : 8,
        background: 'var(--tag-bg)',
        border: '1px solid var(--border-card)',
        borderRadius: 10,
        padding: isSm ? '2px 4px' : '4px 6px',
      }}
    >
      <button
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        style={{
          width: btnSize,
          height: btnSize,
          borderRadius: 8,
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          color: value <= min ? 'var(--text-dim)' : 'var(--text-primary)',
          cursor: value <= min ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}
      >
        <Minus size={iconSize} />
      </button>

      <span
        style={{
          minWidth: isSm ? 20 : 28,
          textAlign: 'center',
          fontWeight: 700,
          fontSize: isSm ? 13 : 15,
          color: 'var(--text-primary)',
          fontFamily: 'monospace',
        }}
      >
        {value}
      </span>

      <button
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        style={{
          width: btnSize,
          height: btnSize,
          borderRadius: 8,
          border: '1px solid var(--border-subtle)',
          background: 'var(--bg-surface)',
          color: value >= max ? 'var(--text-dim)' : 'var(--text-primary)',
          cursor: value >= max ? 'not-allowed' : 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.15s ease',
        }}
      >
        <Plus size={iconSize} />
      </button>
    </div>
  );
}
