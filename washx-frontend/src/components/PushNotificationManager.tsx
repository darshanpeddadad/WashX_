'use client';
import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bell, Download, X } from 'lucide-react';
import { requestNotificationPermission, onForegroundMessage } from '@/lib/firebase';
import api from '@/lib/api';
import toast from 'react-hot-toast';
import { useAuth } from '@/context/AuthContext';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function PushNotificationManager() {
  const { user } = useAuth();
  const [showNotificationPrompt, setShowNotificationPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default');

  useEffect(() => {
    // Check Notification API support
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermissionState(Notification.permission);
      if (Notification.permission === 'default' && user) {
        // Show after 3 seconds of user interaction
        const timer = setTimeout(() => setShowNotificationPrompt(true), 3000);
        return () => clearTimeout(timer);
      }
    }

    // PWA Install prompt listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallPrompt(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, [user]);

  // Foreground FCM message listener
  useEffect(() => {
    const unsubscribe = onForegroundMessage((payload) => {
      const title = payload.notification?.title || 'WashX Update';
      const body = payload.notification?.body || '';
      toast(
        (t) => (
          <div onClick={() => toast.dismiss(t.id)} style={{ cursor: 'pointer' }}>
            <div style={{ fontWeight: 700, fontSize: 14 }}>{title}</div>
            <div style={{ fontSize: 12, color: '#a1a1aa', marginTop: 2 }}>{body}</div>
          </div>
        ),
        { icon: '🧺', duration: 6000 }
      );
    });

    return () => {
      if (typeof unsubscribe === 'function') unsubscribe();
    };
  }, []);

  const handleEnableNotifications = async () => {
    setShowNotificationPrompt(false);
    try {
      const token = await requestNotificationPermission();
      if (token) {
        setPermissionState('granted');
        if (user) {
          await api.post('/auth/fcm-token', { token });
          toast.success('Live order updates enabled! 🔔');
        }
      } else {
        toast('Push notifications not enabled', { icon: 'ℹ️' });
      }
    } catch {
      toast.error('Could not activate push notifications');
    }
  };

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      toast.success('WashX installed! 🎉');
    }
    setDeferredPrompt(null);
    setShowInstallPrompt(false);
  };

  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 99, display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 360 }}>
      {/* PWA Install Banner */}
      <AnimatePresence>
        {showInstallPrompt && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="glass"
            style={{
              padding: '14px 18px',
              border: '1px solid rgba(99,102,241,0.3)',
              background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(6,182,212,0.1))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg,#6366f1,#06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                🧺
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Install WashX App</div>
                <div style={{ fontSize: 11, color: '#a1a1aa' }}>Add to home screen for faster access</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <button
                onClick={handleInstallApp}
                style={{
                  padding: '6px 12px',
                  borderRadius: 8,
                  background: '#6366f1',
                  color: 'white',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <Download size={13} /> Install
              </button>
              <button
                onClick={() => setShowInstallPrompt(false)}
                style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: 4 }}
              >
                <X size={14} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Push Notification Opt-in Prompt */}
      <AnimatePresence>
        {showNotificationPrompt && permissionState === 'default' && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="glass"
            style={{
              padding: '16px 20px',
              border: '1px solid rgba(139,92,246,0.3)',
              background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(99,102,241,0.1))',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Bell size={16} color="#a78bfa" />
                <span style={{ fontWeight: 700, fontSize: 14 }}>Enable Live Notifications</span>
              </div>
              <button
                onClick={() => setShowNotificationPrompt(false)}
                style={{ background: 'none', border: 'none', color: '#71717a', cursor: 'pointer', padding: 2 }}
              >
                <X size={14} />
              </button>
            </div>
            <p style={{ fontSize: 12, color: '#a1a1aa', marginBottom: 12, lineHeight: 1.4 }}>
              Get instant updates when your clothes are picked up, washed, and out for delivery!
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleEnableNotifications}
                style={{
                  flex: 1,
                  padding: '7px 12px',
                  borderRadius: 8,
                  background: 'linear-gradient(135deg,#7c3aed,#6366f1)',
                  color: 'white',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Turn On
              </button>
              <button
                onClick={() => setShowNotificationPrompt(false)}
                style={{
                  padding: '7px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.06)',
                  color: '#a1a1aa',
                  border: '1px solid rgba(255,255,255,0.1)',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Not Now
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
