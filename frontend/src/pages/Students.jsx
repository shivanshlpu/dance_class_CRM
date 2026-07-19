import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  HiOutlineSearch, HiOutlinePlus, HiOutlineFilter,
  HiOutlinePencil, HiOutlineTrash, HiOutlinePhone,
  HiOutlineX,
} from 'react-icons/hi';
import api from '../lib/api';
import toast from 'react-hot-toast';
import StudentForm from './StudentForm';
import './Students.css';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, total: 0, pages: 1 });
  const [statusFilter, setStatusFilter] = useState('');

  const fetchStudents = async (page = 1) => {
    setLoading(true);
    try {
      const { data } = await api.get('/students', {
        params: { page, search, status: statusFilter, limit: 20 },
      });
      setStudents(data.students);
      setPagination(data.pagination);
    } catch (error) {
      toast.error('Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => fetchStudents(), 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to remove this student?')) return;
    try {
      await api.delete(`/students/${id}`);
      toast.success('Student removed');
      fetchStudents(pagination.page);
    } catch (error) {
      toast.error('Failed to remove student');
    }
  };

  const handleFormSuccess = () => {
    setShowForm(false);
    setEditingStudent(null);
    fetchStudents(pagination.page);
  };

  return (
    <div className="students-page">
      <div className="page-header">
        <h1 className="page-title">Students</h1>
        <button
          className="btn btn-primary"
          onClick={() => { setEditingStudent(null); setShowForm(true); }}
        >
          <HiOutlinePlus /> Add Student
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="students-toolbar">
        <div className="search-bar">
          <HiOutlineSearch className="search-icon" />
          <input
            type="text"
            className="input search-input"
            placeholder="Search by name, phone, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="search-clear" onClick={() => setSearch('')}>
              <HiOutlineX />
            </button>
          )}
        </div>
        <div className="filter-group">
          <HiOutlineFilter className="filter-icon" />
          <select
            className="input filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="left">Left</option>
          </select>
        </div>
      </div>

      {/* Stats */}
      <div className="students-stats">
        <span className="stat-pill">
          Total: <strong>{pagination.total}</strong>
        </span>
      </div>

      {/* Student Cards Grid */}
      {loading ? (
        <div className="students-grid">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="student-card skeleton-card">
              <div className="skeleton" style={{ width: 48, height: 48, borderRadius: 12 }} />
              <div>
                <div className="skeleton" style={{ width: 140, height: 16, marginBottom: 8 }} />
                <div className="skeleton" style={{ width: 100, height: 12 }} />
              </div>
            </div>
          ))}
        </div>
      ) : students.length === 0 ? (
        <motion.div
          className="glass-card empty-state"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="empty-icon">👤</span>
          <h3>No students found</h3>
          <p>{search ? 'Try a different search term' : 'Add your first student to get started'}</p>
          {!search && (
            <button
              className="btn btn-primary"
              onClick={() => setShowForm(true)}
            >
              <HiOutlinePlus /> Add Student
            </button>
          )}
        </motion.div>
      ) : (
        <div className="students-grid">
          {students.map((student, index) => (
            <motion.div
              key={student._id}
              className="student-card glass-card"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <div className="student-card-header">
                <div className="student-avatar">
                  {student.photo ? (
                    <img src={`http://localhost:5000${student.photo}`} alt={student.fullName} />
                  ) : (
                    <span>{student.fullName?.charAt(0)?.toUpperCase()}</span>
                  )}
                </div>
                <div className="student-info">
                  <h3 className="student-name">{student.fullName}</h3>
                  <span className="student-meta">
                    <HiOutlinePhone /> {student.mobile}
                  </span>
                </div>
                <span className={`badge badge-${student.status === 'active' ? 'success' : student.status === 'inactive' ? 'warning' : 'error'}`}>
                  {student.status}
                </span>
              </div>

              <div className="student-card-details">
                {student.danceStyle && (
                  <span className="detail-chip">{student.danceStyle}</span>
                )}
                {student.batch && (
                  <span className="detail-chip">{student.batch}</span>
                )}
                {student.joiningDate && (
                  <span className="detail-chip">
                    Joined {new Date(student.joiningDate).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                  </span>
                )}
              </div>

              <div className="student-card-actions">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => { setEditingStudent(student); setShowForm(true); }}
                >
                  <HiOutlinePencil /> Edit
                </button>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => handleDelete(student._id)}
                  style={{ color: 'var(--error)' }}
                >
                  <HiOutlineTrash /> Remove
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            className="btn btn-secondary btn-sm"
            disabled={pagination.page <= 1}
            onClick={() => fetchStudents(pagination.page - 1)}
          >
            Previous
          </button>
          <span className="pagination-info">
            Page {pagination.page} of {pagination.pages}
          </span>
          <button
            className="btn btn-secondary btn-sm"
            disabled={pagination.page >= pagination.pages}
            onClick={() => fetchStudents(pagination.page + 1)}
          >
            Next
          </button>
        </div>
      )}

      {/* Student Form Modal */}
      <AnimatePresence>
        {showForm && (
          <StudentForm
            student={editingStudent}
            onClose={() => { setShowForm(false); setEditingStudent(null); }}
            onSuccess={handleFormSuccess}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
