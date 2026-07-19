import { useState } from 'react';
import { motion } from 'framer-motion';
import { HiOutlineX, HiOutlinePhotograph } from 'react-icons/hi';
import api from '../lib/api';
import toast from 'react-hot-toast';
import './StudentForm.css';

const initialFormData = {
  fullName: '', fatherName: '', motherName: '', age: '', joiningDate: new Date().toISOString().split('T')[0], gender: '',
  mobile: '', altMobile: '', whatsappNumber: '', email: '', address: '',
  batch: '', danceStyle: '', trainer: '', notes: '',
  emergencyContact: { name: '', phone: '', relation: '' },
};

export default function StudentForm({ student, onClose, onSuccess }) {
  const isEdit = !!student;
  const [formData, setFormData] = useState(
    student
      ? { ...initialFormData, ...student, joiningDate: student.joiningDate ? student.joiningDate.split('T')[0] : '' }
      : initialFormData
  );
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(student?.photo ? `http://localhost:5000${student.photo}` : null);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('emergency_')) {
      const field = name.replace('emergency_', '');
      setFormData(prev => ({
        ...prev,
        emergencyContact: { ...prev.emergencyContact, [field]: value },
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Photo must be under 5MB');
        return;
      }
      setPhoto(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.fullName.trim()) errs.fullName = 'Name is required';
    if (!formData.mobile.trim()) errs.mobile = 'Mobile is required';
    else if (!/^\d{10}$/.test(formData.mobile.replace(/\D/g, '')))
      errs.mobile = 'Enter a valid 10-digit mobile number';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        if (key === 'emergencyContact') {
          fd.append(key, JSON.stringify(val));
        } else if (val) {
          fd.append(key, val);
        }
      });
      if (photo) fd.append('photo', photo);

      if (isEdit) {
        await api.put(`/api/students/${student._id}`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Student updated!');
      } else {
        await api.post('/students', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Student registered!');
      }
      onSuccess();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save student');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="modal-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="modal-content glass-card"
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 40, scale: 0.95 }}
        transition={{ duration: 0.3 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h2 className="modal-title">
            {isEdit ? 'Edit Student' : 'Register New Student'}
          </h2>
          <button className="btn btn-ghost" onClick={onClose}>
            <HiOutlineX />
          </button>
        </div>

        <form className="student-form" onSubmit={handleSubmit}>
          {/* Photo Upload */}
          <div className="photo-upload">
            <label htmlFor="photo-input" className="photo-label">
              {photoPreview ? (
                <img src={photoPreview} alt="Preview" className="photo-preview" />
              ) : (
                <div className="photo-placeholder">
                  <HiOutlinePhotograph />
                  <span>Upload Photo</span>
                </div>
              )}
            </label>
            <input
              id="photo-input"
              type="file"
              accept="image/*"
              onChange={handlePhotoChange}
              hidden
            />
          </div>

          {/* Form Grid */}
          <div className="form-grid">
            <div className="input-group">
              <label>Full Name *</label>
              <input className={`input ${errors.fullName ? 'input-error' : ''}`}
                name="fullName" value={formData.fullName} onChange={handleChange}
                placeholder="Student full name" />
              {errors.fullName && <span className="error-text">{errors.fullName}</span>}
            </div>

            <div className="input-group">
              <label>Mobile *</label>
              <input className={`input ${errors.mobile ? 'input-error' : ''}`}
                name="mobile" value={formData.mobile} onChange={handleChange}
                placeholder="10-digit mobile" />
              {errors.mobile && <span className="error-text">{errors.mobile}</span>}
            </div>

            <div className="input-group">
              <label>WhatsApp Number</label>
              <input className="input" name="whatsappNumber"
                value={formData.whatsappNumber} onChange={handleChange}
                placeholder="WhatsApp number" />
            </div>

            <div className="input-group">
              <label>Email</label>
              <input className="input" name="email" type="email"
                value={formData.email} onChange={handleChange}
                placeholder="Email address" />
            </div>

            <div className="input-group">
              <label>Father's Name</label>
              <input className="input" name="fatherName"
                value={formData.fatherName} onChange={handleChange} />
            </div>

            <div className="input-group">
              <label>Mother's Name</label>
              <input className="input" name="motherName"
                value={formData.motherName} onChange={handleChange} />
            </div>

            <div className="input-group">
              <label>Age</label>
              <input className="input" name="age" type="number"
                value={formData.age} onChange={handleChange} placeholder="e.g., 22" />
            </div>

            <div className="input-group">
              <label>Starting Date</label>
              <input className="input" name="joiningDate" type="date"
                value={formData.joiningDate} onChange={handleChange} />
            </div>

            <div className="input-group">
              <label>Gender</label>
              <select className="input" name="gender"
                value={formData.gender} onChange={handleChange}>
                <option value="">Select</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="input-group">
              <label>Dance Style</label>
              <input className="input" name="danceStyle"
                value={formData.danceStyle} onChange={handleChange}
                placeholder="e.g., Hip Hop, Contemporary" />
            </div>

            <div className="input-group">
              <label>Class Timing / Batch</label>
              <select className="input" name="batch"
                value={formData.batch} onChange={handleChange}>
                <option value="">Select Timing</option>
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

            <div className="input-group">
              <label>Trainer</label>
              <input className="input" name="trainer"
                value={formData.trainer} onChange={handleChange}
                placeholder="Trainer name" />
            </div>

            <div className="input-group">
              <label>Alt Mobile</label>
              <input className="input" name="altMobile"
                value={formData.altMobile} onChange={handleChange} />
            </div>
          </div>

          <div className="input-group" style={{ marginTop: 12 }}>
            <label>Address</label>
            <textarea className="input" name="address" rows={2}
              value={formData.address} onChange={handleChange}
              placeholder="Full address" />
          </div>

          <div className="input-group" style={{ marginTop: 12 }}>
            <label>Notes</label>
            <textarea className="input" name="notes" rows={2}
              value={formData.notes} onChange={handleChange}
              placeholder="Any additional notes..." />
          </div>

          {/* Emergency Contact */}
          <h4 className="form-section-title">Emergency Contact</h4>
          <div className="form-grid form-grid-3">
            <div className="input-group">
              <label>Name</label>
              <input className="input" name="emergency_name"
                value={formData.emergencyContact?.name || ''} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Phone</label>
              <input className="input" name="emergency_phone"
                value={formData.emergencyContact?.phone || ''} onChange={handleChange} />
            </div>
            <div className="input-group">
              <label>Relation</label>
              <input className="input" name="emergency_relation"
                value={formData.emergencyContact?.relation || ''} onChange={handleChange} />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Student' : 'Register Student'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
