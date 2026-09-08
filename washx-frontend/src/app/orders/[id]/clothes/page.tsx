'use client';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter, useParams } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import {
  CLOTHES_CATALOG,
  CATEGORY_LABELS,
  CATEGORY_ICONS,
  BASE_PRICES,
  getPricePerUnit,
  SERVICE_LABELS,
  FREE_DELIVERY_THRESHOLD,
  STANDARD_DELIVERY_FEE,
  MIN_ORDER_VALUE,
} from '@/lib/constants';
import { Plus, Trash2, ArrowRight, Loader, Sparkles, Zap, ShieldCheck, Truck, CheckCircle2 } from 'lucide-react';
import DeliveryThresholdBanner from '@/components/common/DeliveryThresholdBanner';

interface ClothesRow {
  id: string;
  category: string;
  type: string;
  quantity: number;
  service: string;
}

const SERVICES = ['wash', 'wash_iron', 'dry_clean'];

function makeRow(): ClothesRow {
  return {
    id: Math.random().toString(36).slice(2),
    category: 'mens',
    type: 'Shirt (Casual / Formal)',
    quantity: 1,
    service: 'wash',
  };
}

export default function ClothesPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;
  const [rows, setRows] = useState<ClothesRow[]>([makeRow()]);
  const [saving, setSaving] = useState(false);
  const [orderInfo, setOrderInfo] = useState<{ isExpress?: boolean; turnaroundDays?: number } | null>(null);
  const [inspectionAcknowledged, setInspectionAcknowledged] = useState(true);
  const [inspectionNotes, setInspectionNotes] = useState('');

  useEffect(() => {
    api.get(`/orders/${orderId}`).then((r) => setOrderInfo(r.data)).catch(() => {});
  }, [orderId]);

  const updateRow = (id: string, field: keyof ClothesRow, value: string | number) => {
    setRows((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const updated = { ...r, [field]: value };
        // Reset type when category changes
        if (field === 'category') {
          const cat = value as string;
          const catalog = CLOTHES_CATALOG[cat as keyof typeof CLOTHES_CATALOG] || CLOTHES_CATALOG.mens;
          updated.type = catalog[0];
        }
        return updated;
      })
    );
  };

  const removeRow = (id: string) => {
    if (rows.length === 1) {
      toast.error('At least one item is required');
      return;
    }
    setRows((prev) => prev.filter((r) => r.id !== id));
  };

  const garmentsTotal = rows.reduce((s, r) => s + getPricePerUnit(r.category, r.service) * r.quantity, 0);
  const isExpressUser = Boolean(orderInfo?.isExpress);
  const isFreeDelivery = isExpressUser || garmentsTotal >= FREE_DELIVERY_THRESHOLD;
  const deliveryFee = isFreeDelivery ? 0 : STANDARD_DELIVERY_FEE;
  const finalTotal = garmentsTotal + deliveryFee;
  const amountNeeded = Math.max(0, FREE_DELIVERY_THRESHOLD - garmentsTotal);
  const progressPercent = Math.min(100, Math.round((garmentsTotal / FREE_DELIVERY_THRESHOLD) * 100));
  const belowMinimum = garmentsTotal < MIN_ORDER_VALUE && garmentsTotal > 0;
  const minOrderShortfall = Math.max(0, MIN_ORDER_VALUE - garmentsTotal);

  const handleSave = async () => {
    if (rows.some((r) => r.quantity < 1)) {
      toast.error('Quantity must be at least 1');
      return;
    }
    setSaving(true);
    try {
      await api.put(`/orders/${orderId}/clothes`, {
        items: rows.map((r) => ({
          category: r.category,
          type: r.type,
          quantity: r.quantity,
          service: r.service,
        })),
        inspectionAcknowledged,
        inspectionNotes,
      });
      toast.success('Clothes saved to your order!');
      router.push(`/orders/${orderId}`);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to save';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#060608',
        padding: '80px 24px 120px',
        position: 'relative',
        overflowX: 'hidden',
      }}
    >
      {/* Background Mesh */}
      <div className="mesh-glow-blue" style={{ top: '-140px', left: '10%' }} />
      <div className="mesh-glow-cyan" style={{ top: '350px', right: '5%' }} />

      <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative', zIndex: 2 }}>
        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 12 }} className="tag-pill tag-pill-active">
            <Sparkles size={12} />
            <span>ORDER #{orderId.slice(0, 12).toUpperCase()}</span>
          </div>
          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'clamp(32px, 4.2vw, 48px)',
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '-0.03em',
              marginBottom: 8,
            }}
          >
            Add Garments to Order
          </h1>
          <p style={{ color: '#94a3b8', fontSize: 16, marginBottom: 16 }}>
            Select from over 60+ garment items. Unit rates and live total update automatically.
          </p>

          {/* Turnaround Badge */}
          {orderInfo?.isExpress || orderInfo?.turnaroundDays === 1 ? (
            <div
              style={{
                padding: '12px 20px',
                borderRadius: 14,
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.3)',
                color: '#38bdf8',
                fontSize: 13,
                fontWeight: 700,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <Zap size={16} /> 1-Day Express Delivery Applied (WashX Express Pass)
            </div>
          ) : (
            <div
              style={{
                padding: '12px 20px',
                borderRadius: 14,
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                color: '#94a3b8',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>🕒 Standard 3-Day Turnaround.</span>
                <span style={{ color: '#64748b' }}>Need this delivered back tomorrow?</span>
              </div>
              <a
                href="/subscription"
                target="_blank"
                rel="noreferrer"
                style={{
                  color: '#38bdf8',
                  fontWeight: 700,
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span>Activate Express Pass (From ₹99)</span>
                <ArrowRight size={13} />
              </a>
            </div>
          )}
        </div>

        {/* Pricing Quick Bar */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 32 }}>
          {Object.entries(CATEGORY_LABELS).filter(([k]) => k !== 'common').map(([k, label]) => (
            <div
              key={k}
              style={{
                background: 'rgba(15, 16, 24, 0.8)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: 999,
                padding: '7px 16px',
                fontSize: 13,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              <span>{CATEGORY_ICONS[k]}</span>
              <span style={{ color: '#cbd5e1' }}>{label}:</span>
              <span style={{ color: '#a5b4fc', fontWeight: 700 }}>₹{BASE_PRICES[k]}</span>
            </div>
          ))}
          <div
            style={{
              background: 'rgba(99, 102, 241, 0.12)',
              border: '1px solid rgba(99, 102, 241, 0.3)',
              borderRadius: 999,
              padding: '7px 16px',
              fontSize: 13,
              color: '#a5b4fc',
              display: 'flex',
              alignItems: 'center',
              fontWeight: 600,
            }}
          >
            Wash+Iron: 1.5× &nbsp;|&nbsp; Dry Clean: 3×
          </div>
        </div>

        {/* Clothes Rows */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 26 }}>
          <AnimatePresence>
            {rows.map((row) => {
              const catalog = CLOTHES_CATALOG[row.category as keyof typeof CLOTHES_CATALOG] || CLOTHES_CATALOG.mens;
              const price = getPricePerUnit(row.category, row.service);
              const rowTotal = price * row.quantity;

              return (
                <motion.div
                  key={row.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  className="washx-card"
                  style={{ padding: 22, border: '1px solid rgba(255, 255, 255, 0.1)' }}
                >
                  <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.3fr 1fr 85px auto', gap: 14, alignItems: 'end' }}>
                    {/* Category */}
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 6, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        CATEGORY
                      </label>
                      <select
                        className="input-field"
                        style={{ fontSize: 14 }}
                        value={row.category}
                        onChange={(e) => updateRow(row.id, 'category', e.target.value)}
                      >
                        {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                          <option key={k} value={k}>
                            {CATEGORY_ICONS[k] ? `${CATEGORY_ICONS[k]} ` : ''}
                            {v}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Type */}
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 6, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        GARMENT TYPE
                      </label>
                      <select
                        className="input-field"
                        style={{ fontSize: 14 }}
                        value={row.type}
                        onChange={(e) => updateRow(row.id, 'type', e.target.value)}
                      >
                        {catalog.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Service */}
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 6, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        SERVICE
                      </label>
                      <select
                        className="input-field"
                        style={{ fontSize: 14 }}
                        value={row.service}
                        onChange={(e) => updateRow(row.id, 'service', e.target.value)}
                      >
                        {SERVICES.map((s) => (
                          <option key={s} value={s}>
                            {SERVICE_LABELS[s]}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Qty */}
                    <div>
                      <label style={{ fontSize: 11, color: '#94a3b8', display: 'block', marginBottom: 6, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                        QTY
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={50}
                        className="input-field"
                        style={{ fontSize: 14, textAlign: 'center', fontWeight: 700 }}
                        value={row.quantity}
                        onChange={(e) => updateRow(row.id, 'quantity', Math.max(1, parseInt(e.target.value) || 1))}
                      />
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => removeRow(row.id)}
                      style={{
                        background: 'rgba(239, 68, 68, 0.12)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        borderRadius: 10,
                        padding: 12,
                        cursor: 'pointer',
                        color: '#f87171',
                        alignSelf: 'end',
                        transition: 'all 0.2s',
                      }}
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  {/* Row Total */}
                  <div
                    style={{
                      marginTop: 14,
                      fontSize: 13,
                      color: '#94a3b8',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                      paddingTop: 10,
                    }}
                  >
                    <span>
                      {row.quantity} pcs × ₹{price} ({SERVICE_LABELS[row.service]})
                    </span>
                    <span style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 800, color: '#a5b4fc' }}>
                      ₹{rowTotal}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Add Row Button */}
        <button
          onClick={() => setRows((p) => [...p, makeRow()])}
          className="btn-outline"
          style={{ width: '100%', justifyContent: 'center', marginBottom: 24 }}
        >
          <Plus size={16} /> Add Another Garment
        </button>

        {/* Reusable Free Delivery Dynamic Threshold & Minimum Value Banner */}
        <div style={{ marginBottom: 24 }}>
          <DeliveryThresholdBanner currentTotal={garmentsTotal} isExpress={isExpressUser} />
        </div>

        {/* Pre-Wash Intake Inspection Guarantee (Fraud & Quality Protection) */}
        <div
          className="washx-card"
          style={{
            padding: 20,
            marginBottom: 24,
            background: 'rgba(15, 23, 42, 0.65)',
            border: '1px solid rgba(99, 102, 241, 0.25)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <input
              id="inspection-check"
              type="checkbox"
              checked={inspectionAcknowledged}
              onChange={(e) => setInspectionAcknowledged(e.target.checked)}
              style={{ marginTop: 3, accentColor: '#6366f1', width: 16, height: 16, cursor: 'pointer' }}
            />
            <div style={{ flex: 1 }}>
              <label
                htmlFor="inspection-check"
                style={{ fontSize: 14, fontWeight: 700, color: '#ffffff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}
              >
                <ShieldCheck size={16} color="#818cf8" /> Doorstep Pre-Wash Fabric Inspection Guarantee
              </label>
              <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, lineHeight: 1.5 }}>
                Our associate conducts a digital intake check (stains, loose seams, delicate trims) at pickup and seals items in a tamper-evident QR bag.
              </p>
              <input
                type="text"
                placeholder="Optional notes for associate (e.g., ink spot on cuff, delicate buttons)"
                className="input-field"
                style={{ fontSize: 13, marginTop: 10, padding: '8px 12px' }}
                value={inspectionNotes}
                onChange={(e) => setInspectionNotes(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Grand Total Valuation Card */}
        <div
          className="washx-card"
          style={{
            padding: 28,
            marginBottom: 28,
            background: 'linear-gradient(135deg, rgba(18, 20, 32, 0.95), rgba(12, 13, 20, 0.98))',
            border: '1px solid rgba(6, 182, 212, 0.35)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <span style={{ fontSize: 14, color: '#cbd5e1' }}>Garments Total ({rows.reduce((s, r) => s + r.quantity, 0)} pcs):</span>
            <span style={{ fontSize: 15, fontWeight: 700, color: '#ffffff' }}>
              ₹{garmentsTotal}
            </span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 14, color: '#cbd5e1' }}>Doorstep Delivery:</span>
              <span style={{ fontSize: 11, color: '#94a3b8' }}>
                {isFreeDelivery ? '(Free above ₹250)' : '(Cart under ₹250)'}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {isFreeDelivery ? (
                <>
                  <span style={{ textDecoration: 'line-through', fontSize: 13, color: '#64748b' }}>₹{STANDARD_DELIVERY_FEE}</span>
                  <span style={{ fontSize: 14, fontWeight: 800, color: '#10b981' }}>FREE</span>
                </>
              ) : (
                <span style={{ fontSize: 15, fontWeight: 800, color: '#f59e0b' }}>+₹{STANDARD_DELIVERY_FEE}</span>
              )}
            </div>
          </div>

          <div style={{ height: 1, background: 'rgba(255, 255, 255, 0.08)', marginBottom: 16 }} />

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div>
              <span style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 800, color: '#ffffff', display: 'block' }}>
                Order Grand Total
              </span>
              <span style={{ fontSize: 12, color: isFreeDelivery ? '#10b981' : '#a5b4fc' }}>
                {isFreeDelivery ? '✓ Free Delivery Applied' : `✓ Includes ₹${deliveryFee} doorstep transit`}
              </span>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'clamp(36px, 4.5vw, 50px)',
                fontWeight: 800,
                background: 'linear-gradient(135deg, #ffffff 30%, #a5b4fc 70%, #06b6d4 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              ₹{finalTotal}
            </div>
          </div>
        </div>

        {/* Minimum Order Warning */}
        {belowMinimum && (
          <div style={{
            marginBottom: 12,
            padding: '12px 16px',
            borderRadius: 12,
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            color: '#f87171',
            fontSize: 13,
            fontWeight: 600,
          }}>
            <span>⚠️</span>
            <span>Minimum order value is ₹{MIN_ORDER_VALUE}. Add ₹{minOrderShortfall} more to continue.</span>
          </div>
        )}

        {/* Save & Confirm Button */}
        <button
          className="btn-pill"
          onClick={handleSave}
          disabled={saving || belowMinimum}
          style={{ width: '100%', opacity: belowMinimum ? 0.5 : 1 }}
        >
          <span className="btn-pill__body" style={{ width: 'calc(100% - 48px)', height: 52, justifyContent: 'center', fontSize: 15 }}>
            {saving ? (
              <>
                <Loader size={16} className="animate-spin" style={{ marginRight: 8 }} /> Saving Clothes...
              </>
            ) : belowMinimum ? (
              `Add ₹${minOrderShortfall} more to reach minimum order`
            ) : (
              `Save Clothes (₹${finalTotal}) & Complete Booking`
            )}
          </span>
          <span className="btn-pill__disc" style={{ width: 52, height: 52 }}>
            <ArrowRight size={18} />
          </span>
        </button>
      </div>
    </div>
  );
}
