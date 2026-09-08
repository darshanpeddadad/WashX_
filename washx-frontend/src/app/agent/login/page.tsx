'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAgent } from '@/context/AgentContext';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function AgentLoginPage() {
  const { login } = useAgent();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { toast.error('Enter email and password'); return; }
    setLoading(true);
    try {
      await login(email, password);
      toast.success('Welcome back! 🚗');
      router.push('/agent/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#09090b', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ position: 'absolute', top: '25%', left: '25%', width: 350, height: 350, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.12) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ width: '100%', maxWidth: 420, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'linear-gradient(135deg,#06b6d4,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, margin: '0 auto 16px' }}>🛵</div>
          <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 6 }}>WashX Agent Portal</h1>
          <p style={{ color: '#71717a', fontSize: 14 }}>Sign in to manage your deliveries & pickups</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: 8 }}>Email</label>
            <input type="email" className="input-field" placeholder="agent@washx.in" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: 8 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input type={showPass ? 'text' : 'password'} className="input-field" style={{ paddingRight: 44 }} placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#71717a' }}>
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <motion.button
            type="submit"
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            style={{ padding: '13px 24px', borderRadius: 12, background: 'linear-gradient(135deg,#06b6d4,#0891b2)', color: 'white', border: 'none', fontWeight: 700, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 4px 20px rgba(6,182,212,0.4)' }}
          >
            {loading ? 'Signing in...' : (<>Sign In <ArrowRight size={16} /></>)}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
