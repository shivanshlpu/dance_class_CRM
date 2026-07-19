import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlinePlus, HiOutlinePencil, HiOutlineTrash,
  HiOutlineUserAdd, HiOutlineClock,
} from 'react-icons/hi';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './Membership.css';

export default function Membership() {
  const [tab, setTab] = useState('plans');
  const [plans, setPlans] = useState([]);
  const [memberships, setMemberships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planForm, setPlanForm] = useState({ name: '', price: '', durationDays: '', benefits: '' });
  const [assignForm, setAssignForm] = useState({ studentId: '', planId: '' });
  const [students, setStudents] = useState([]);

  const fetchPlans = async () => {
    try {
      const { data } = await api.get('/plans');
      setPlans(data.plans);
    } catch { toast.error('Failed to load plans'); }
  };

  const fetchMemberships = async () => {
    try {
      const { data } = await api.get('/plans/membership');
      setMemberships(data.memberships);
    } catch { toast.error('Failed to load memberships'); }
  };

  const fetchStudents = async () => {
    try {
      const { data } = await api.get('/students', { params: { limit: 500 } });
      setStudents(data.students);
    } catch {}
  };

  useEffect(() => {
    Promise.all([fetchPlans(), fetchMemberships(), fetchStudents()])
      .finally(() => setLoading(false));
  }, []);

  // Plan CRUD
  const handleSavePlan = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...planForm,
        price: Number(planForm.price),
        durationDays: Number(planForm.durationDays),
        benefits: planForm.benefits.split(',').map(b => b.trim()).filter(Boolean),
      };

      if (editingPlan) {
        await api.put(`/api/plans/${editingPlan._id}`, payload);
        toast.success('Plan updated');
      } else {
        await api.post('/plans', payload);
        toast.success('Plan created');
      }
      setShowPlanForm(false);
      setEditingPlan(null);
      setPlanForm({ name: '', price: '', durationDays: '', benefits: '' });
      fetchPlans();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save plan');
    }
  };

  const handleDeletePlan = async (id) => {
    if (!window.confirm('Deactivate this plan?')) return;
    try {
      await api.delete(`/api/plans/${id}`);
      toast.success('Plan deactivated');
      fetchPlans();
    } catch { toast.error('Failed to delete plan'); }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    try {
      await api.post('/plans/membership', assignForm);
      toast.success('Membership assigned!');
      setShowAssignForm(false);
      setAssignForm({ studentId: '', planId: '' });
      fetchMemberships();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to assign');
    }
  };

  const openEditPlan = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      name: plan.name,
      price: plan.price.toString(),
      durationDays: plan.durationDays.toString(),
      benefits: (plan.benefits || []).join(', '),
    });
    setShowPlanForm(true);
  };

  return (
    <div className="membership-page">
      <div className="page-header">
        <h1 className="page-title">Membership</h1>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={() => { setPlanForm({ name: '', price: '', durationDays: '', benefits: '' }); setEditingPlan(null); setShowPlanForm(true); }}>
            <HiOutlinePlus /> New Plan
          </button>
          <button className="btn btn-primary" onClick={() => setShowAssignForm(true)}>
            <HiOutlineUserAdd /> Assign Plan
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button className={`tab ${tab === 'plans' ? 'tab-active' : ''}`} onClick={() => setTab('plans')}>Plans</button>
        <button className={`tab ${tab === 'memberships' ? 'tab-active' : ''}`} onClick={() => setTab('memberships')}>Active Memberships</button>
      </div>

      {/* Plans Tab */}
      {tab === 'plans' && (
        <div className="plans-grid">
          {plans.map((plan, i) => (
            <motion.div key={plan._id} className="plan-card glass-card"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}>
              <div className="plan-card-top">
                <h3 className="plan-name">{plan.name}</h3>
                <div className="plan-price">
                  <span className="plan-currency">₹</span>
                  <span className="plan-amount">{plan.price.toLocaleString()}</span>
                </div>
                <span className="plan-duration">
                  <HiOutlineClock /> {plan.durationDays} days
                </span>
              </div>
              {plan.benefits?.length > 0 && (
                <ul className="plan-benefits">
                  {plan.benefits.map((b, j) => (
                    <li key={j}>{b}</li>
                  ))}
                </ul>
              )}
              <div className="plan-card-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => openEditPlan(plan)}>
                  <HiOutlinePencil /> Edit
                </button>
                <button className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}
                  onClick={() => handleDeletePlan(plan._id)}>
                  <HiOutlineTrash />
                </button>
              </div>
            </motion.div>
          ))}
          {plans.length === 0 && !loading && (
            <div className="glass-card empty-state">
              <span className="empty-icon">📋</span>
              <h3>No plans yet</h3>
              <p>Create your first membership plan</p>
            </div>
          )}
        </div>
      )}

      {/* Memberships Tab */}
      {tab === 'memberships' && (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Student</th>
                <th>Plan</th>
                <th>Start</th>
                <th>End</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {memberships.map(m => (
                <tr key={m._id}>
                  <td style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
                    {m.studentId?.fullName || '—'}
                  </td>
                  <td>{m.planId?.name || '—'}</td>
                  <td>{new Date(m.startDate).toLocaleDateString('en-IN')}</td>
                  <td>{new Date(m.endDate).toLocaleDateString('en-IN')}</td>
                  <td>
                    <span className={`badge badge-${m.status === 'active' ? 'success' : m.status === 'expired' ? 'error' : 'warning'}`}>
                      {m.status}
                    </span>
                  </td>
                </tr>
              ))}
              {memberships.length === 0 && (
                <tr><td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: 40 }}>No memberships assigned yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Plan Form Modal */}
      <AnimatePresence>
        {showPlanForm && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPlanForm(false)}>
            <motion.div className="modal-content glass-card" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <h2 className="modal-title">{editingPlan ? 'Edit Plan' : 'Create Plan'}</h2>
              <form onSubmit={handleSavePlan} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                  <label>Plan Name *</label>
                  <input className="input" value={planForm.name} onChange={e => setPlanForm(p => ({ ...p, name: e.target.value }))} required placeholder="e.g., Monthly Basic" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div className="input-group">
                    <label>Price (₹) *</label>
                    <input className="input" type="number" value={planForm.price} onChange={e => setPlanForm(p => ({ ...p, price: e.target.value }))} required min="0" />
                  </div>
                  <div className="input-group">
                    <label>Duration (days) *</label>
                    <input className="input" type="number" value={planForm.durationDays} onChange={e => setPlanForm(p => ({ ...p, durationDays: e.target.value }))} required min="1" />
                  </div>
                </div>
                <div className="input-group">
                  <label>Benefits (comma separated)</label>
                  <input className="input" value={planForm.benefits} onChange={e => setPlanForm(p => ({ ...p, benefits: e.target.value }))} placeholder="Access to all classes, Locker facility" />
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowPlanForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">{editingPlan ? 'Update' : 'Create'}</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Assign Membership Modal */}
      <AnimatePresence>
        {showAssignForm && (
          <motion.div className="modal-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAssignForm(false)}>
            <motion.div className="modal-content glass-card" initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }} onClick={e => e.stopPropagation()} style={{ maxWidth: 480 }}>
              <h2 className="modal-title">Assign Membership</h2>
              <form onSubmit={handleAssign} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="input-group">
                  <label>Student *</label>
                  <select className="input" value={assignForm.studentId} onChange={e => setAssignForm(a => ({ ...a, studentId: e.target.value }))} required>
                    <option value="">Select Student</option>
                    {students.map(s => (
                      <option key={s._id} value={s._id}>{s.fullName} — {s.mobile}</option>
                    ))}
                  </select>
                </div>
                <div className="input-group">
                  <label>Plan *</label>
                  <select className="input" value={assignForm.planId} onChange={e => setAssignForm(a => ({ ...a, planId: e.target.value }))} required>
                    <option value="">Select Plan</option>
                    {plans.map(p => (
                      <option key={p._id} value={p._id}>{p.name} — ₹{p.price} / {p.durationDays} days</option>
                    ))}
                  </select>
                </div>
                <div className="modal-footer">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowAssignForm(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary">Assign</button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
