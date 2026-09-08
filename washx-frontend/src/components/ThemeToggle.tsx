'use client';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';

interface ThemeToggleProps {
  showLabel?: boolean;
  className?: string;
}

export default function ThemeToggle({ showLabel = false, className = '' }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      type="button"
      onClick={toggleTheme}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: showLabel ? '6px 14px' : '8px',
        borderRadius: 999,
        background: 'var(--toggle-bg, rgba(255, 255, 255, 0.08))',
        border: '1px solid var(--border-subtle, rgba(255, 255, 255, 0.12))',
        color: 'var(--text-primary, #ffffff)',
        cursor: 'pointer',
        transition: 'all 0.2s ease',
      }}
      className={`hover:border-indigo-500/50 ${className}`}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {theme === 'dark' ? (
          <Sun size={17} className="text-amber-400" />
        ) : (
          <Moon size={17} className="text-indigo-600" />
        )}
      </div>
      {showLabel && (
        <span style={{ fontSize: 12, fontWeight: 600 }}>
          {theme === 'dark' ? 'Light' : 'Dark'}
        </span>
      )}
    </motion.button>
  );
}
