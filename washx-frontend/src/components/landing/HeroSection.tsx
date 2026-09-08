'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowRight, Star, Shield, Sparkles, Clock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function HeroSection() {
  const { user } = useAuth();

  return (
    <section
      style={{
        padding: '120px 24px 70px',
        maxWidth: 1200,
        margin: '0 auto',
        position: 'relative',
        zIndex: 2,
        textAlign: 'center',
      }}
    >
      {/* Top Floating Pill Badge */}
      <motion.div
        initial={{ opacity: 0, y: -15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          padding: '6px 16px',
          borderRadius: 99,
          background: 'var(--tag-bg)',
          border: '1px solid var(--border-highlight)',
          marginBottom: 24,
          boxShadow: 'var(--card-shadow)',
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: '#10b981',
            boxShadow: '0 0 10px #10b981',
            display: 'inline-block',
          }}
        />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)' }}>
          Operating Across 50+ Cities in India • Pickup in 60 Mins
        </span>
      </motion.div>

      {/* Main Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        style={{
          fontSize: 'clamp(38px, 6vw, 76px)',
          fontWeight: 800,
          letterSpacing: '-0.035em',
          lineHeight: 1.06,
          color: 'var(--text-primary)',
          maxWidth: 960,
          margin: '0 auto 24px',
          fontFamily: 'var(--font-display, inherit)',
        }}
      >
        Engineered Laundry &{' '}
        <span
          style={{
            background: 'linear-gradient(135deg, #6366f1 10%, #06b6d4 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Haute Fabric Care
        </span>
      </motion.h1>

      {/* Subtitle */}
      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        style={{
          fontSize: 'clamp(16px, 2vw, 20px)',
          color: 'var(--text-secondary)',
          maxWidth: 680,
          margin: '0 auto 40px',
          lineHeight: 1.6,
        }}
      >
        Sanitized doorstep collection, triple-filtered RO bio-washing, individual barcode tracking, and showroom steam pressing returned to your door in 24–48 hours.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 16,
          flexWrap: 'wrap',
          marginBottom: 50,
        }}
      >
        <Link
          href={user ? '/book' : '/register'}
          style={{
            textDecoration: 'none',
            color: '#ffffff',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            padding: '15px 32px',
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 700,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            boxShadow: '0 12px 28px -4px rgba(99, 102, 241, 0.45)',
            transition: 'transform 0.15s ease, box-shadow 0.15s ease',
          }}
          className="hover:translate-y-[-2px]"
        >
          <span>Book Doorstep Pickup</span>
          <ArrowRight size={18} />
        </Link>

        <a
          href="#estimator"
          style={{
            textDecoration: 'none',
            color: 'var(--text-primary)',
            background: 'var(--btn-outline-bg)',
            border: '1px solid var(--border-card)',
            padding: '14px 28px',
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            backdropFilter: 'blur(10px)',
            transition: 'all 0.2s ease',
          }}
          className="hover:border-indigo-500"
        >
          <Sparkles size={16} color="#06b6d4" />
          <span>Estimate Garment Cost</span>
        </a>
      </motion.div>

      {/* Value Proposition Pills */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 28,
          flexWrap: 'wrap',
          fontSize: 13,
          color: 'var(--text-secondary)',
          fontWeight: 600,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} color="#10b981" />
          <span>₹5,000 Garment Protection Guarantee</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Clock size={16} color="#06b6d4" />
          <span>24h Turnaround on Express Pass</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ display: 'flex', color: '#f59e0b' }}>
            {[...Array(5)].map((_, i) => (
              <Star key={i} size={14} fill="#f59e0b" />
            ))}
          </div>
          <span>4.9/5 Rating (45,000+ Clothes Cleaned)</span>
        </div>
      </motion.div>
    </section>
  );
}
