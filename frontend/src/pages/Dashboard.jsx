import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  HiOutlineUserGroup, HiOutlineClipboardCheck,
  HiOutlineCurrencyRupee, HiOutlineUserAdd,
  HiOutlineClock, HiOutlineExclamation,
} from 'react-icons/hi';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const { data } = await api.get('/dashboard');
        setStats(data);
      } catch (error) {
        toast.error('Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statsCards = [
    {
      id: 'total-students',
      label: 'Total Students',
      value: loading ? '—' : stats?.totalStudents || 0,
      icon: HiOutlineUserGroup,
      accent: 'gold',
      description: `${stats?.activeStudents || 0} active`,
    },
    {
      id: 'today-attendance',
      label: "Today's Attendance",
      value: loading ? '—' : stats?.todayAttendance || 0,
      icon: HiOutlineClipboardCheck,
      accent: 'purple',
      description: `of ${stats?.totalStudents || 0} students`,
    },
    {
      id: 'new-admissions',
      label: 'New Admissions',
      value: loading ? '—' : stats?.newAdmissions || 0,
      icon: HiOutlineUserAdd,
      accent: 'success',
      description: 'This month',
    },
    {
      id: 'revenue',
      label: 'Revenue',
      value: loading ? '—' : `₹${(stats?.monthlyRevenue || 0).toLocaleString()}`,
      icon: HiOutlineCurrencyRupee,
      accent: 'gold',
      description: 'This month',
    },
  ];

  return (
    <div className="dashboard">
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <span className="dashboard-date">
          {new Date().toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="stats-grid">
        {statsCards.map((card, index) => (
          <motion.div
            key={card.id}
            className={`stat-card stat-card-${card.accent}`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1, duration: 0.4 }}
          >
            <div className="stat-card-header">
              <span className="stat-card-label">{card.label}</span>
              <div className={`stat-card-icon-wrap stat-icon-${card.accent}`}>
                <card.icon className="stat-card-icon" />
              </div>
            </div>
            <div className="stat-card-value">
              {loading ? <div className="skeleton" style={{ width: 80, height: 32 }} /> : card.value}
            </div>
            <span className="stat-card-desc">{card.description}</span>
          </motion.div>
        ))}
      </div>

      {/* Alert: Expiring Memberships */}
      {stats?.expiringMemberships > 0 && (
        <motion.div
          className="glass-card alert-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <HiOutlineExclamation className="alert-icon" />
          <div>
            <strong>{stats.expiringMemberships}</strong> membership(s) expiring in the next 7 days
          </div>
          <button className="btn btn-sm btn-secondary" onClick={() => navigate('/membership')}>
            View
          </button>
        </motion.div>
      )}

      {/* Bottom Sections */}
      <div className="dashboard-sections">
        {/* Recent Students */}
        <motion.div
          className="glass-card dashboard-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h3 className="section-title">Recent Students</h3>
          {stats?.recentStudents?.length > 0 ? (
            <div className="recent-list">
              {stats.recentStudents.map((s) => (
                <div key={s._id} className="recent-item">
                  <div className="student-avatar" style={{ width: 36, height: 36, borderRadius: 10, fontSize: 13 }}>
                    <span>{s.fullName?.charAt(0)?.toUpperCase()}</span>
                  </div>
                  <div className="recent-info">
                    <span className="recent-name">{s.fullName}</span>
                    <span className="recent-meta">
                      {s.danceStyle || 'N/A'} • {new Date(s.joiningDate).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                  <span className={`badge badge-${s.status === 'active' ? 'success' : 'warning'}`}>{s.status}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="section-empty">No students registered yet</p>
          )}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          className="glass-card dashboard-section"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <h3 className="section-title">Quick Actions</h3>
          <div className="quick-actions">
            <button className="btn btn-primary btn-sm" onClick={() => navigate('/students')}>
              <HiOutlineUserAdd /> New Student
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/attendance')}>
              <HiOutlineClipboardCheck /> Mark Attendance
            </button>
            <button className="btn btn-secondary btn-sm" onClick={() => navigate('/membership')}>
              <HiOutlineClock /> Manage Plans
            </button>
          </div>

          {/* Today's Attendance Breakdown */}
          {stats?.attendanceBreakdown && (
            <div className="attendance-breakdown">
              <h4 style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 10, marginTop: 20 }}>
                Today's Breakdown
              </h4>
              <div className="breakdown-bars">
                <div className="breakdown-item">
                  <span className="breakdown-label">Present</span>
                  <div className="breakdown-bar">
                    <div
                      className="breakdown-fill breakdown-fill-present"
                      style={{ width: `${stats.totalStudents ? (stats.attendanceBreakdown.present / stats.totalStudents) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="breakdown-count">{stats.attendanceBreakdown.present}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Late</span>
                  <div className="breakdown-bar">
                    <div
                      className="breakdown-fill breakdown-fill-late"
                      style={{ width: `${stats.totalStudents ? (stats.attendanceBreakdown.late / stats.totalStudents) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="breakdown-count">{stats.attendanceBreakdown.late}</span>
                </div>
                <div className="breakdown-item">
                  <span className="breakdown-label">Absent</span>
                  <div className="breakdown-bar">
                    <div
                      className="breakdown-fill breakdown-fill-absent"
                      style={{ width: `${stats.totalStudents ? (stats.attendanceBreakdown.absent / stats.totalStudents) * 100 : 0}%` }}
                    />
                  </div>
                  <span className="breakdown-count">{stats.attendanceBreakdown.absent}</span>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
