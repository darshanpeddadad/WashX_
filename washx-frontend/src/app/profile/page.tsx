'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { User, Phone, MapPin, Building, Save } from 'lucide-react';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, isLoading, logout } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({ name: '', phone: '', city: '', address: '', pincode: '' });
  const [saving, setSaving] = useState(false);
  const [cities, setCities] = useState<{ name: string; state: string }[]>([]);

  useEffect(() => {
    if (!isLoading && !user) router.push('/login');
    if (user) setForm({ name: user.name, phone: user.phone, city: (user as { city?: string }).city || '', address: (user as { address?: string }).address || '', pincode: '' });
    api.get('/cities').then((r) => setCities(r.data)).catch(() => {});
  }, [user, isLoading, router]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/auth/profile', form);
      toast.success('Profile updated!');
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading || !user) return null;

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', padding: '40px 24px 80px' }}>
      <div style={{ maxWidth: 560, margin: '0 auto' }}>
        <Link href="/dashboard" style={{ textDecoration: 'none', color: '#71717a', fontSize: 14, display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 24 }}>
          ← Back to Dashboard
        </Link>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, marginBottom: 8 }}>Your Profile</h1>
          <p style={{ color: '#71717a', fontSize: 15, marginBottom: 32 }}>Update your delivery details and contact info.</p>

          <div className="glass" style={{ padding: 32, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Avatar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 8 }}>
              <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'linear-gradient(135deg,#6366f1,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>
                {user.name[0].toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{user.name}</div>
                <div style={{ color: '#71717a', fontSize: 14 }}>{user.email}</div>
              </div>
            </div>

            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><User size={14} /> Full Name</label>
              <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Phone size={14} /> Phone</label>
              <input className="input-field" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><Building size={14} /> City</label>
              <select className="input-field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
                <option value="">Select city...</option>
                {cities.map((c) => <option key={c.name} value={c.name}>{c.name}, {c.state}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}><MapPin size={14} /> Home Address</label>
              <textarea className="input-field" rows={3} value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={{ resize: 'vertical' }} />
            </div>

            <motion.button className="btn-primary" onClick={handleSave} disabled={saving} whileHover={{ scale: 1.02 }} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Save size={16} /> {saving ? 'Saving...' : 'Save Changes'}
            </motion.button>

            <button onClick={() => { logout(); router.push('/'); }} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 12, padding: '12px 24px', color: '#f87171', cursor: 'pointer', fontWeight: 600 }}>
              Logout
            </button>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
