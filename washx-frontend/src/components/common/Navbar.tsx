'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import ThemeToggle from '@/components/ThemeToggle';
import { Zap, User, LogOut, ArrowRight } from 'lucide-react';

interface NavbarProps {
  showNavLinks?: boolean;
}

export default function Navbar({ showNavLinks = false }: NavbarProps) {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: '14px 24px',
        background: 'var(--nav-bg)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--nav-border)',
        transition: 'background-color 0.25s ease, border-color 0.25s ease',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
              boxShadow: '0 8px 20px -4px rgba(99, 102, 241, 0.4)',
            }}
          >
            🧺
          </div>
          <span
            style={{
              fontSize: 20,
              fontWeight: 800,
              letterSpacing: -0.5,
              background: 'linear-gradient(135deg, #6366f1 0%, #06b6d4 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontFamily: 'var(--font-display, inherit)',
            }}
          >
            WashX
          </span>
        </Link>

        {/* Optional Page Anchors (e.g. Landing Page) */}
        {showNavLinks && (
          <nav
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 28,
            }}
            className="hidden md:flex"
          >
            <a href="#estimator" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>
              Live Estimator
            </a>
            <a href="#process" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>
              Process
            </a>
            <a href="#pricing" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>
              Pricing
            </a>
            <a href="#pass" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>
              Express Pass
            </a>
            <a href="#reviews" style={{ textDecoration: 'none', color: 'var(--text-secondary)', fontSize: 14, fontWeight: 500 }}>
              Reviews
            </a>
          </nav>
        )}

        {/* Right Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ThemeToggle />

          <Link
            href="/subscription"
            style={{
              textDecoration: 'none',
              color: '#38bdf8',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 700,
              padding: '6px 12px',
              borderRadius: 8,
              background: 'rgba(6, 182, 212, 0.1)',
              border: '1px solid rgba(6, 182, 212, 0.25)',
              transition: 'all 0.2s ease',
            }}
          >
            <Zap size={14} />
            <span>Express Pass</span>
          </Link>

          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Link
                href="/dashboard"
                style={{
                  textDecoration: 'none',
                  color: 'var(--text-primary)',
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: 'var(--tag-bg)',
                  border: '1px solid var(--border-subtle)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                Dashboard
              </Link>
              <Link
                href="/profile"
                style={{
                  textDecoration: 'none',
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 13,
                }}
              >
                <User size={15} />
                <span className="hidden sm:inline">{user.name.split(' ')[0]}</span>
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: 13,
                  padding: '4px 8px',
                }}
                title="Log out"
              >
                <LogOut size={15} />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Link
                href="/login"
                style={{
                  textDecoration: 'none',
                  color: 'var(--text-secondary)',
                  fontSize: 13,
                  fontWeight: 600,
                  padding: '7px 14px',
                }}
              >
                Login
              </Link>
              <Link
                href="/book"
                style={{
                  textDecoration: 'none',
                  color: '#ffffff',
                  fontSize: 13,
                  fontWeight: 700,
                  padding: '8px 16px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
                  boxShadow: '0 4px 14px rgba(99, 102, 241, 0.35)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <span>Book Pickup</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
