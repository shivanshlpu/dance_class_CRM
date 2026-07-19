const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema(
  {
    photo: {
      type: String,
      default: null,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
      maxlength: 100,
    },
    fatherName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    motherName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    age: {
      type: Number,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other'],
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      index: true,
    },
    altMobile: {
      type: String,
      trim: true,
    },
    whatsappNumber: {
      type: String,
      trim: true,
      index: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
    emergencyContact: {
      name: String,
      phone: String,
      relation: String,
    },
    joiningDate: {
      type: Date,
      default: Date.now,
    },
    batch: {
      type: String,
      trim: true,
    },
    danceStyle: {
      type: String,
      trim: true,
    },
    trainer: {
      type: String,
      trim: true,
    },
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
    },
    notes: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive', 'left'],
      default: 'active',
    },
  },
  {
    timestamps: true,
  }
);

// Text index for search
studentSchema.index({ fullName: 'text', mobile: 'text', email: 'text' });

const Student = mongoose.model('Student', studentSchema);

module.exports = Student;
