'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Plus, Minus } from 'lucide-react';
import {
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  SERVICE_LABELS,
  getPricePerUnit,
  FREE_DELIVERY_THRESHOLD,
  STANDARD_DELIVERY_FEE,
  MIN_ORDER_VALUE,
} from '@/lib/constants';
import DeliveryThresholdBanner from '@/components/common/DeliveryThresholdBanner';
import Stepper from '@/components/common/Stepper';

const SAMPLE_GARMENTS: Record<string, string[]> = {
  mens: ['Shirt (Casual / Formal)', 'Jeans / Denim', 'Suit Jacket / Blazer', 'Kurta / Pyjama'],
  womens_saree: ['Silk / Kanjeevaram Saree', 'Banarasi Saree', 'Cotton Saree', 'Designer Embroidered Saree'],
  womens_other: ['Salwar Kameez (set)', 'Kurti / Tunics', 'One-Piece Dress / Gown', 'Lehenga (set)'],
  kids: ['School Uniform (set)', 'Kids T-Shirt / Shirt', 'Kids Frock / Party Dress'],
  household: ['Bedsheet (Double / King)', 'Duvet Cover / Quilt Cover', 'Bath Towel', 'Door Curtain'],
  winterwear: ['Woolen Sweater / Pullover', 'Overcoat / Trench Coat', 'Woolen Shawl / Pashmina'],
  accessories: ['Sneakers / Casual Shoes (Clean)', 'Backpack / School Bag', 'Canvas / Sports Shoes (Wash & Clean)'],
};

export default function LiveEstimator() {
  const [activeCategory, setActiveCategory] = useState<string>('mens');
  const [activeService, setActiveService] = useState<'wash' | 'wash_iron' | 'dry_clean'>('wash_iron');
  const [itemCounts, setItemCounts] = useState<Record<string, number>>({
    'Shirt (Casual / Formal)': 4,
    'Jeans / Denim': 2,
    'Suit Jacket / Blazer': 1,
  });

  const handleUpdateCount = (item: string, qty: number) => {
    setItemCounts((prev) => {
      if (qty <= 0) {
        const copy = { ...prev };
        delete copy[item];
        return copy;
      }
      return { ...prev, [item]: qty };
    });
  };

  const currentUnitCost = getPricePerUnit(activeCategory, activeService);
  const totalCalculated = Object.entries(itemCounts).reduce((acc, [, qty]) => {
    return acc + currentUnitCost * qty;
  }, 0);
  const totalPieces = Object.values(itemCounts).reduce((a, b) => a + b, 0);
  const isFreeDelivery = totalCalculated >= FREE_DELIVERY_THRESHOLD;
  const deliveryFee = isFreeDelivery ? 0 : STANDARD_DELIVERY_FEE;
  const grandTotal = totalCalculated + deliveryFee;

  const currentItems = SAMPLE_GARMENTS[activeCategory] || SAMPLE_GARMENTS.mens;

  return (
    <section
      id="estimator"
      style={{
        padding: '70px 24px 90px',
        maxWidth: 1200,
        margin: '0 auto',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 13,
            fontWeight: 700,
            color: '#06b6d4',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 10,
          }}
        >
          <Sparkles size={14} />
          <span>Interactive Garment Calculator</span>
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
          Transparent, Per-Piece Pricing
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 16, maxWidth: 600, margin: '8px auto 0' }}>
          Select service and adjust garments to calculate exact pickup subtotal and delivery rules.
        </p>
      </div>

      {/* Main Grid: Selector on Left, Bill Summary on Right */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 28,
          alignItems: 'start',
        }}
      >
        {/* Left Column: Services + Categories + Garment Steppers */}
        <div
          style={{
            background: 'var(--bg-card)',
            border: '1px solid var(--border-card)',
            borderRadius: 24,
            padding: '28px 24px',
            boxShadow: 'var(--card-shadow)',
          }}
        >
          {/* Service Selector Tabs */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 10 }}>
              Step 1: Choose Care Service
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
              {(['wash', 'wash_iron', 'dry_clean'] as const).map((s) => {
                const isActive = activeService === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setActiveService(s)}
                    style={{
                      padding: '12px 8px',
                      borderRadius: 12,
                      border: isActive ? '1px solid #6366f1' : '1px solid var(--border-subtle)',
                      background: isActive ? 'linear-gradient(135deg, rgba(99,102,241,0.2), rgba(6,182,212,0.15))' : 'var(--tag-bg)',
                      color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
                      fontWeight: isActive ? 700 : 500,
                      fontSize: 13,
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      textAlign: 'center',
                    }}
                  >
                    {SERVICE_LABELS[s]}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Category Pills */}
          <div style={{ marginBottom: 24 }}>
            <label style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em', display: 'block', marginBottom: 10 }}>
              Step 2: Select Garment Category
            </label>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {Object.keys(SAMPLE_GARMENTS).map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    style={{
                      padding: '6px 14px',
                      borderRadius: 99,
                      border: isActive ? '1px solid #6366f1' : '1px solid var(--border-subtle)',
                      background: isActive ? '#6366f1' : 'var(--tag-bg)',
                      color: isActive ? '#ffffff' : 'var(--text-secondary)',
                      fontWeight: 600,
                      fontSize: 12,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span>{CATEGORY_ICONS[cat as keyof typeof CATEGORY_ICONS] || '👔'}</span>
                    <span>{CATEGORY_LABELS[cat as keyof typeof CATEGORY_LABELS] || cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Garment Counter List */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--text-muted)', letterSpacing: '0.05em' }}>
                Step 3: Adjust Quantities
              </span>
              <span style={{ fontSize: 12, color: '#38bdf8', fontWeight: 600 }}>
                ₹{currentUnitCost} / piece
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {currentItems.map((item) => {
                const count = itemCounts[item] || 0;
                return (
                  <div
                    key={item}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '12px 16px',
                      borderRadius: 12,
                      background: 'var(--tag-bg)',
                      border: '1px solid var(--border-subtle)',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{item}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>₹{currentUnitCost} each</div>
                    </div>
                    <Stepper
                      value={count}
                      onChange={(newVal) => handleUpdateCount(item, newVal)}
                      size="sm"
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Bill & Threshold Progress */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Free Delivery Threshold Banner */}
          <DeliveryThresholdBanner currentTotal={totalCalculated} />

          {/* Summary Card */}
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border-card)',
              borderRadius: 24,
              padding: '28px 24px',
              boxShadow: 'var(--card-shadow)',
            }}
          >
            <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text-primary)', marginBottom: 20 }}>
              Estimated Order Summary
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Total Pieces</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{totalPieces} garments</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Garments Subtotal</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>₹{totalCalculated}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                <span>Doorstep Delivery Fee</span>
                <span style={{ fontWeight: 700, color: isFreeDelivery ? '#10b981' : 'var(--text-primary)' }}>
                  {isFreeDelivery ? 'FREE' : `₹${deliveryFee}`}
                </span>
              </div>

              <div style={{ height: 1, background: 'var(--border-subtle)', margin: '8px 0' }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-primary)' }}>Grand Total</span>
                <span style={{ fontSize: 24, fontWeight: 800, color: '#6366f1' }}>₹{grandTotal}</span>
              </div>
            </div>

            <Link
              href="/book"
              style={{
                textDecoration: 'none',
                color: '#ffffff',
                background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                padding: '14px',
                borderRadius: 12,
                fontSize: 15,
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                boxShadow: '0 8px 20px -4px rgba(99, 102, 241, 0.4)',
              }}
            >
              <span>Book Pickup for ₹{grandTotal}</span>
              <ArrowRight size={16} />
            </Link>

            <p style={{ fontSize: 12, color: 'var(--text-muted)', textAlign: 'center', margin: '14px 0 0' }}>
              Final item count and fabric inspection verified at doorstep by verified agent.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
