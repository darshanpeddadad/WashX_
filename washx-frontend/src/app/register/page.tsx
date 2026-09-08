'use client';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import toast from 'react-hot-toast';
import api from '@/lib/api';
import { ArrowRight, Eye, EyeOff } from 'lucide-react';

interface RegisterForm {
  name: string; email: string; phone: string;
  password: string; confirmPassword: string;
  city: string; address: string;
}

export default function RegisterPage() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [cities, setCities] = useState<{ name: string; state: string }[]>([]);
  const { register, handleSubmit, watch, formState: { errors } } = useForm<RegisterForm>();

  useEffect(() => {
    api.get('/cities').then((r) => setCities(r.data)).catch(() => {});
  }, []);

  const onSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    setLoading(true);
    try {
      await registerUser({ name: data.name, email: data.email, phone: data.phone, password: data.password, city: data.city, address: data.address });
      toast.success('Welcome to WashX! 🎉');
      router.push('/dashboard');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Registration failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24, background: '#09090b', position: 'relative', overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: '10%', right: '15%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(6,182,212,0.1) 0%, transparent 70%)', filter: 'blur(60px)', pointerEvents: 'none' }} />

      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="glass" style={{ width: '100%', maxWidth: 500, padding: 40 }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🧺</div>
              <span style={{ fontSize: 24, fontWeight: 800, background: 'linear-gradient(135deg,#6366f1,#06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>WashX</span>
            </div>
          </Link>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 8 }}>Create your account</h1>
          <p style={{ color: '#71717a', fontSize: 14 }}>Start fresh. Laundry done right, every time.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: 8 }}>Full Name</label>
              <input placeholder="Rahul Sharma" className="input-field" {...register('name', { required: 'Required' })} />
              {errors.name && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.name.message}</p>}
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: 8 }}>Phone</label>
              <input placeholder="+91 98765 43210" className="input-field" {...register('phone', { required: 'Required', pattern: { value: /^[6-9]\d{9}$/, message: 'Invalid phone' } })} />
              {errors.phone && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.phone.message}</p>}
            </div>
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: 8 }}>Email Address</label>
            <input type="email" placeholder="you@example.com" className="input-field" {...register('email', { required: 'Required' })} />
            {errors.email && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.email.message}</p>}
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: 8 }}>Your City</label>
            <select className="input-field" {...register('city', { required: 'Required' })}>
              <option value="">Select your city...</option>
              {cities.map((c) => <option key={c.name} value={c.name}>{c.name}, {c.state}</option>)}
            </select>
            {errors.city && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.city.message}</p>}
          </div>

          <div>
            <label style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: 8 }}>Home Address</label>
            <input placeholder="Flat 4B, Lotus Apartments, MG Road..." className="input-field" {...register('address')} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: 8 }}>Password</label>
              <div style={{ position: 'relative' }}>
                <input type={showPass ? 'text' : 'password'} placeholder="Min 8 chars" className="input-field" style={{ paddingRight: 44 }} {...register('password', { required: 'Required', minLength: { value: 8, message: 'Min 8 chars' } })} />
                <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#71717a' }}>
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
              {errors.password && <p style={{ color: '#ef4444', fontSize: 12, marginTop: 4 }}>{errors.password.message}</p>}
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#a1a1aa', display: 'block', marginBottom: 8 }}>Confirm Password</label>
              <input type="password" placeholder="Repeat password" className="input-field" {...register('confirmPassword', { required: 'Required' })} />
            </div>
          </div>

          <motion.button
            type="submit"
            className="btn-primary"
            disabled={loading}
            whileHover={{ scale: loading ? 1 : 1.02 }}
            whileTap={{ scale: loading ? 1 : 0.98 }}
            style={{ marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          >
            {loading ? 'Creating account...' : (<>Create Account <ArrowRight size={16} /></>)}
          </motion.button>
        </form>

        <p style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: '#71717a' }}>
          Already have an account?{' '}
          <Link href="/login" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Login here</Link>
        </p>
      </motion.div>
    </div>
  );
}
