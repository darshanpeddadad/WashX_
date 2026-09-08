'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAdmin } from '@/context/AdminContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Shield, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function AdminLoginPage() {
  const { login } = useAdmin();
  const router = useRouter();
  const [key, setKey] = useState('');
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!key.trim()) { toast.error('Enter your admin key'); return; }
    setLoading(true);
    try {
      await login(key.trim());
      toast.success('Access granted 🔐');
      router.push('/admin/dashboard');
    } catch {
      toast.error('Invalid admin key');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'absolute', top: '20%', right: '20%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(239,68,68,0.08) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="glass" style={{ width: '100%', maxWidth: 420, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', boxShadow: '0 0 30px rgba(124,58,237,0.4)' }}>
            <Shield size={26} color="white" />
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>WashX Admin</h1>
          <p style={{ color: '#71717a', fontSize: 14 }}>Internal dashboard — authorized access only</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: 8 }}>Admin Key</label>
            <div style={{ position: 'relative' }}>
              <input
                type={show ? 'text' : 'password'}
                className="input-field"
                style={{ paddingRight: 48 }}
                placeholder="Enter your admin key"
                value={key}
                onChange={(e) => setKey(e.target.value)}
              />
              <button type="button" onClick={() => setShow(!show)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#71717a' }}>
                {show ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            style={{ padding: '13px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', color: 'white', border: 'none', fontWeight: 700, fontSize: 15, cursor: loading ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(124,58,237,0.4)' }}
          >
            {loading ? 'Verifying...' : (<>Access Dashboard <ArrowRight size={16} /></>)}
          </motion.button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 12, color: '#3f3f46' }}>
          Default key (dev): <code style={{ color: '#7c3aed' }}>washx_admin_secure_key_2024</code>
        </p>
      </motion.div>
    </div>
  );
}
