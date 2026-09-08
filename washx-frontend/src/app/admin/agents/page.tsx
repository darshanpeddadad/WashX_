'use client';
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAdmin } from '@/context/AdminContext';
import AdminShell from '@/components/AdminShell';
import toast from 'react-hot-toast';
import { UserPlus, X, Edit2, Check, Phone, MapPin, Building } from 'lucide-react';

interface Agent {
  id: string; name: string; email: string; phone: string;
  role: string; city: string; isActive: boolean; createdAt: string;
}

const CITIES = ['Mumbai', 'Delhi', 'Bengaluru', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Jaipur', 'Lucknow', 'Ahmedabad', 'Surat', 'Kochi', 'Chandigarh', 'Indore', 'Bhopal'];
const ROLES = [{ value: 'PICKUP', label: 'Pickup Only' }, { value: 'DELIVERY', label: 'Delivery Only' }, { value: 'BOTH', label: 'Both' }];

const EMPTY_FORM = { name: '', email: '', phone: '', city: '', role: 'BOTH', password: '' };

export default function AdminAgentsPage() {
  const { apiCall } = useAdmin();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<Agent>>({});

  const fetchAgents = useCallback(async () => {
    setLoading(true);
    try {
      const data = await apiCall('GET', '/admin/agents') as Agent[];
      setAgents(data);
    } catch { toast.error('Failed to load agents'); }
    finally { setLoading(false); }
  }, [apiCall]);

  useEffect(() => { fetchAgents(); }, [fetchAgents]);

  const createAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone || !form.city || !form.password) { toast.error('Fill all fields'); return; }
    setSaving(true);
    try {
      await apiCall('POST', '/admin/agents', form);
      toast.success(`Agent ${form.name} created! 🛵`);
      setForm(EMPTY_FORM);
      setShowForm(false);
      fetchAgents();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Create failed';
      toast.error(msg);
    } finally { setSaving(false); }
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      await apiCall('PUT', `/admin/agents/${id}`, editForm);
      toast.success('Agent updated');
      setEditingId(null);
      fetchAgents();
    } catch { toast.error('Update failed'); }
    finally { setSaving(false); }
  };

  const toggleActive = async (agent: Agent) => {
    try {
      await apiCall('PUT', `/admin/agents/${agent.id}`, { ...agent, isActive: !agent.isActive });
      toast.success(agent.isActive ? 'Agent deactivated' : 'Agent activated');
      fetchAgents();
    } catch { toast.error('Failed'); }
  };

  return (
    <AdminShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>🛵 Agents</h1>
          <p style={{ color: '#71717a', fontSize: 14 }}>{agents.length} agents across India</p>
        </div>
        <motion.button whileHover={{ scale: 1.03 }} onClick={() => setShowForm(!showForm)} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', border: 'none', borderRadius: 12, color: 'white', fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 16px rgba(124,58,237,0.4)' }}>
          <UserPlus size={16} /> Add Agent
        </motion.button>
      </div>

      {/* Add agent form */}
      <AnimatePresence>
        {showForm && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="glass" style={{ padding: 28, marginBottom: 24, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontSize: 16, fontWeight: 700 }}>Create New Agent</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a' }}><X size={18} /></button>
            </div>
            <form onSubmit={createAgent} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
              <div>
                <label style={{ fontSize: 12, color: '#71717a', display: 'block', marginBottom: 6 }}>Full Name *</label>
                <input className="input-field" placeholder="Rajesh Kumar" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#71717a', display: 'block', marginBottom: 6 }}>Email *</label>
                <input type="email" className="input-field" placeholder="rajesh@washx.in" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#71717a', display: 'block', marginBottom: 6 }}>Phone *</label>
                <input className="input-field" placeholder="9876543210" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#71717a', display: 'block', marginBottom: 6 }}>City *</label>
                <select className="input-field" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}>
                  <option value="">Select city...</option>
                  {CITIES.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#71717a', display: 'block', marginBottom: 6 }}>Role *</label>
                <select className="input-field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 12, color: '#71717a', display: 'block', marginBottom: 6 }}>Password *</label>
                <input type="password" className="input-field" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10, gridColumn: 'span 2' }}>
                <motion.button type="submit" disabled={saving} whileHover={{ scale: 1.02 }} style={{ padding: '11px 24px', background: 'linear-gradient(135deg,#7c3aed,#5b21b6)', border: 'none', borderRadius: 10, color: 'white', fontWeight: 700, cursor: 'pointer' }}>
                  {saving ? 'Creating...' : 'Create Agent'}
                </motion.button>
                <button type="button" onClick={() => { setForm(EMPTY_FORM); setShowForm(false); }} style={{ padding: '11px 24px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#a1a1aa', cursor: 'pointer' }}>
                  Cancel
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Agents list */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {[1, 2, 3, 4].map((i) => <div key={i} className="glass shimmer" style={{ height: 140, borderRadius: 14 }} />)}
        </div>
      ) : agents.length === 0 ? (
        <div className="glass" style={{ padding: 48, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🛵</div>
          <p style={{ fontWeight: 700, marginBottom: 8 }}>No agents yet</p>
          <p style={{ color: '#71717a', fontSize: 14 }}>Click "Add Agent" to onboard your first delivery partner.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 14 }}>
          {agents.map((agent) => (
            <motion.div key={agent.id} layout className="glass" style={{ padding: 20, opacity: agent.isActive ? 1 : 0.55, borderLeft: `3px solid ${agent.isActive ? '#10b981' : '#3f3f46'}` }}>
              {editingId === agent.id ? (
                /* Edit mode */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input className="input-field" style={{ fontSize: 13 }} defaultValue={agent.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  <input className="input-field" style={{ fontSize: 13 }} defaultValue={agent.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                  <select className="input-field" style={{ fontSize: 13 }} defaultValue={agent.city} onChange={(e) => setEditForm({ ...editForm, city: e.target.value })}>
                    {CITIES.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <select className="input-field" style={{ fontSize: 13 }} defaultValue={agent.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}>
                    {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => saveEdit(agent.id)} disabled={saving} style={{ flex: 1, padding: '8px', background: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: '#10b981', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13, fontWeight: 600 }}>
                      <Check size={14} /> Save
                    </button>
                    <button onClick={() => setEditingId(null)} style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#a1a1aa', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 13 }}>
                      <X size={14} /> Cancel
                    </button>
                  </div>
                </div>
              ) : (
                /* View mode */
                <>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg,#06b6d4,#0891b2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>🛵</div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 15 }}>{agent.name}</div>
                        <div style={{ fontSize: 11, color: '#71717a' }}>{agent.email}</div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setEditingId(agent.id); setEditForm({ name: agent.name, phone: agent.phone, city: agent.city, role: agent.role }); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#71717a', padding: 4 }}><Edit2 size={14} /></button>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5, fontSize: 13, color: '#71717a', marginBottom: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Phone size={12} /> {agent.phone}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={12} /> {agent.city}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Building size={12} /> {ROLES.find(r => r.value === agent.role)?.label || agent.role}</div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 12, padding: '3px 10px', borderRadius: 999, background: agent.isActive ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.1)', color: agent.isActive ? '#10b981' : '#f87171', border: `1px solid ${agent.isActive ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.2)'}`, fontWeight: 600 }}>
                      {agent.isActive ? '● Active' : '○ Inactive'}
                    </span>
                    <button onClick={() => toggleActive(agent)} style={{ fontSize: 12, padding: '5px 12px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8, color: '#71717a', cursor: 'pointer' }}>
                      {agent.isActive ? 'Deactivate' : 'Activate'}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </AdminShell>
  );
}
