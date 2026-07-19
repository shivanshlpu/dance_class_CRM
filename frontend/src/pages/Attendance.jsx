import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HiOutlineCalendar, HiOutlineCheck, HiOutlineX,
  HiOutlineClock, HiOutlineSearch,
} from 'react-icons/hi';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './Attendance.css';

export default function Attendance() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [stats, setStats] = useState({ total: 0, present: 0, absent: 0, late: 0, unmarked: 0 });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [batchFilter, setBatchFilter] = useState('');
  const [saving, setSaving] = useState(null);

  const fetchAttendance = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/attendance', { params: { date } });
      setStudents(data.students);
      setStats(data.stats);
    } catch (error) {
      toast.error('Failed to load attendance');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAttendance();
  }, [date]);

  const handleMark = async (studentId, status) => {
    setSaving(studentId);
    try {
      await api.post('/attendance', { studentId, status });
      // Update local state
      setStudents(prev =>
        prev.map(s =>
          s._id === studentId
            ? { ...s, attendance: { status, method: 'manual' } }
            : s
        )
      );
      // Update stats
      setStats(prev => {
        const newStats = { ...prev };
        const oldStudent = students.find(s => s._id === studentId);
        const oldStatus = oldStudent?.attendance?.status;

        if (oldStatus) newStats[oldStatus]--;
        else newStats.unmarked--;

        newStats[status]++;
        return newStats;
      });
    } catch (error) {
      toast.error('Failed to mark attendance');
    } finally {
      setSaving(null);
    }
  };

  const handleMarkAll = async (status) => {
    const unmarked = students.filter(s => !s.attendance);
    if (unmarked.length === 0) {
      toast('All students already marked');
      return;
    }

    try {
      const records = unmarked.map(s => ({ studentId: s._id, status }));
      await api.post('/attendance/bulk', { records, date });
      toast.success(`Marked ${unmarked.length} students as ${status}`);
      fetchAttendance();
    } catch (error) {
      toast.error('Failed to mark all');
    }
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = s.fullName?.toLowerCase().includes(search.toLowerCase()) || s.mobile?.includes(search);
    const matchesBatch = batchFilter === '' || s.batch === batchFilter;
    return matchesSearch && matchesBatch;
  });

  const attendancePercent = stats.total > 0
    ? Math.round(((stats.present + stats.late) / stats.total) * 100)
    : 0;

  return (
    <div className="attendance-page">
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <div className="attendance-date-picker">
          <HiOutlineCalendar />
          <input
            type="date"
            className="input date-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {/* Stats Bar */}
      <div className="attendance-stats-bar">
        <motion.div className="att-stat" initial={{ scale: 0.9 }} animate={{ scale: 1 }}>
          <span className="att-stat-value">{stats.total}</span>
          <span className="att-stat-label">Total</span>
        </motion.div>
        <motion.div className="att-stat att-stat-present" initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: 0.05 }}>
          <span className="att-stat-value">{stats.present}</span>
          <span className="att-stat-label">Present</span>
        </motion.div>
        <motion.div className="att-stat att-stat-absent" initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: 0.1 }}>
          <span className="att-stat-value">{stats.absent + stats.unmarked}</span>
          <span className="att-stat-label">Absent</span>
        </motion.div>
        <motion.div className="att-stat att-stat-late" initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: 0.15 }}>
          <span className="att-stat-value">{stats.late}</span>
          <span className="att-stat-label">Late</span>
        </motion.div>
        <motion.div className="att-stat att-stat-percent" initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }}>
          <span className="att-stat-value">{attendancePercent}%</span>
          <span className="att-stat-label">Rate</span>
        </motion.div>
      </div>

      {/* Toolbar */}
      <div className="attendance-toolbar">
        <div className="search-bar" style={{ flex: 1, display: 'flex', gap: '10px', background: 'transparent', padding: 0 }}>
          <div style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
            <HiOutlineSearch className="search-icon" style={{ position: 'absolute', left: 16 }} />
            <input
              type="text"
              className="input search-input"
              style={{ paddingLeft: 44, width: '100%', border: '1px solid var(--border)', background: 'var(--bg-glass)' }}
              placeholder="Search student..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select 
            className="input" 
            style={{ width: '200px', border: '1px solid var(--border)', background: 'var(--bg-glass)' }}
            value={batchFilter}
            onChange={(e) => setBatchFilter(e.target.value)}
          >
            <option value="">All Timings</option>
            <option value="Morning 6 AM - 7 AM">Morning 6 AM - 7 AM</option>
            <option value="Morning 7 AM - 8 AM">Morning 7 AM - 8 AM</option>
            <option value="Morning 8 AM - 9 AM">Morning 8 AM - 9 AM</option>
            <option value="Evening 4 PM - 5 PM">Evening 4 PM - 5 PM</option>
            <option value="Evening 5 PM - 6 PM">Evening 5 PM - 6 PM</option>
            <option value="Evening 6 PM - 7 PM">Evening 6 PM - 7 PM</option>
            <option value="Evening 7 PM - 8 PM">Evening 7 PM - 8 PM</option>
            <option value="Weekend Special">Weekend Special</option>
          </select>
        </div>
        <div className="mark-all-btns">
          <button className="btn btn-sm btn-secondary" onClick={() => handleMarkAll('present')}>
            <HiOutlineCheck /> Mark All Present
          </button>
          <button className="btn btn-sm btn-secondary" onClick={() => handleMarkAll('absent')}>
            <HiOutlineX /> Mark All Absent
          </button>
        </div>
      </div>

      {/* Student List */}
      {loading ? (
        <div className="attendance-list">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="att-row skeleton-row">
              <div className="skeleton" style={{ width: 40, height: 40, borderRadius: 10 }} />
              <div style={{ flex: 1 }}>
                <div className="skeleton" style={{ width: 140, height: 14, marginBottom: 6 }} />
                <div className="skeleton" style={{ width: 90, height: 10 }} />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="attendance-list">
          {filteredStudents.map((student, index) => {
            const status = student.attendance?.status;
            return (
              <motion.div
                key={student._id}
                className={`att-row ${status ? `att-row-${status}` : ''}`}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.02 }}
              >
                <div className="att-student">
                  <div className="student-avatar" style={{ width: 40, height: 40, borderRadius: 10, fontSize: 14 }}>
                    {student.photo ? (
                      <img src={`http://localhost:5000${student.photo}`} alt="" />
                    ) : (
                      <span>{student.fullName?.charAt(0)?.toUpperCase()}</span>
                    )}
                  </div>
                  <div className="att-student-info">
                    <span className="att-student-name">{student.fullName}</span>
                    <span className="att-student-meta">
                      {student.batch || 'No batch'} • {student.mobile}
                    </span>
                  </div>
                </div>

                <div className="att-actions">
                  <button
                    className={`att-btn att-btn-present ${status === 'present' ? 'active' : ''}`}
                    onClick={() => handleMark(student._id, 'present')}
                    disabled={saving === student._id}
                    title="Present"
                  >
                    <HiOutlineCheck />
                  </button>
                  <button
                    className={`att-btn att-btn-late ${status === 'late' ? 'active' : ''}`}
                    onClick={() => handleMark(student._id, 'late')}
                    disabled={saving === student._id}
                    title="Late"
                  >
                    <HiOutlineClock />
                  </button>
                  <button
                    className={`att-btn att-btn-absent ${(!status || status === 'absent') ? 'active' : ''}`}
                    onClick={() => handleMark(student._id, 'absent')}
                    disabled={saving === student._id}
                    title="Absent"
                  >
                    <HiOutlineX />
                  </button>
                </div>
              </motion.div>
            );
          })}
          {filteredStudents.length === 0 && (
            <div className="glass-card empty-state">
              <span className="empty-icon">📋</span>
              <h3>No students found</h3>
              <p>{students.length === 0 ? 'Register students first' : 'No matches for your search'}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
