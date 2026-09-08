'use client';

import { Loader } from 'lucide-react';

interface LoadingScreenProps {
  message?: string;
  fullScreen?: boolean;
}

export default function LoadingScreen({
  message = 'Loading WashX...',
  fullScreen = true,
}: LoadingScreenProps) {
  return (
    <div
      style={{
        minHeight: fullScreen ? '100vh' : '300px',
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 16,
        padding: 24,
      }}
    >
      <div
        style={{
          width: 54,
          height: 54,
          borderRadius: 16,
          background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.15))',
          border: '1px solid rgba(99,102,241,0.3)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Loader className="animate-spin" size={24} color="#6366f1" />
      </div>
      <p style={{ color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>
        {message}
      </p>
    </div>
  );
}
