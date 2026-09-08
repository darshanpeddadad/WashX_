'use client';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';

interface LoginForm { email: string; password: string; }

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      await login(data.email, data.password);
      toast.success('Welcome back to WashX! 🧺');
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Login failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#09090b', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '20%', left: '20%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass"
        style={{ width: '100%', maxWidth: 440, padding: 40 }}
      >
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 24 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🧺</div>
              <span style={{ fontSize: 24, fontWeight: 800, background: 'linear-gradient(135deg,#6366f1,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>WashX</span>
            </div>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Welcome back</h1>
          <p style={{ color: '#71717a', fontSize: 14 }}>Login to manage your laundry orders</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: 8 }}>Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              className="input-field"
              {...register('email', { required: 'Email required' })}
            />
            {errors.email && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{errors.email.message}</p>}
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: 8 }}>Password</label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="••••••••"
                className="input-field"
                style={{ paddingRight: 44 }}
                {...register('password', { required: 'Password required' })}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#71717a' }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {errors.password && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6 }}>{errors.password.message}</p>}
          </div>

          <motion.button
            type="submit"
            className="btn-primary"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {loading ? 'Logging in...' : (<>Login <ArrowRight size={16} /></>)}
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 24, fontSize: 14, color: '#71717a' }}>
          Don't have an account?{' '}
          <Link href="/register" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Create one free</Link>
        </p>
      </motion.div>
    </div>
  );
}
