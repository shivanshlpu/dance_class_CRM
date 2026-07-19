const Student = require('../models/Student');
const Membership = require('../models/Membership');
const Plan = require('../models/Plan');
const Settings = require('../models/Settings');
const WhatsappLog = require('../models/WhatsappLog');
const { sendWhatsappMessage } = require('../services/whatsapp.service');
const { generateMessage } = require('../services/whatsappTemplate.service');
const { getRandomPoster } = require('../services/poster.service');

const WhatsappSession = require('../models/WhatsappSession');
const Template = require('../models/Template');
const createAuditLog = require('../utils/auditLog');
const path = require('path');
const env = require('../config/env');

/**
 * POST /api/students — Create a new student
 */
const createStudent = async (req, res) => {
  try {
    const studentData = req.body;

    // Handle photo upload
    if (req.file) {
      studentData.photo = `/uploads/students/${req.file.filename}`;
    }

    const student = await Student.create(studentData);

    let createdMembership = null;
    let populatedPlan = null;
    if (studentData.planId) {
      populatedPlan = await Plan.findById(studentData.planId);
      if (populatedPlan) {
        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + populatedPlan.durationDays);

        createdMembership = await Membership.create({
          studentId: student._id,
          planId: populatedPlan._id,
          startDate: start,
          endDate: end,
          status: 'active'
        });
      }
    }

    await createAuditLog({
      userId: req.user.userId,
      action: 'create',
      entity: 'Student',
      entityId: student._id,
      after: student.toObject(),
    });

    // Fire and forget WhatsApp Welcome Message
    (async () => {
      try {
        let settings = await Settings.findOne();
        if (!settings) settings = await Settings.create({});
        
        if (settings.automations?.welcome && (student.whatsappNumber || student.mobile)) {
          const messageText = await generateMessage('welcome', { 
            student, 
            settings,
            membership: createdMembership ? { ...createdMembership.toObject(), planId: populatedPlan } : null
          });
          if (messageText) {
            const posterUrl = await getRandomPoster('welcome');
            
            const log = await WhatsappLog.create({
              studentId: student._id,
              messageType: 'welcome',
              content: messageText,
              status: 'pending'
            });

            sendWhatsappMessage(student.whatsappNumber || student.mobile, messageText, posterUrl)
              .then(async () => {
                log.status = 'sent';
                log.sentAt = new Date();
                await log.save();
                
                await createAuditLog({
                  userId: req.user.userId,
                  action: 'notify',
                  entity: 'Student',
                  entityId: student._id,
                  after: { message: 'WhatsApp Welcome sent' },
                });
              })
              .catch(async (err) => {
                log.status = 'failed';
                log.errorMessage = err.message;
                log.retryCount = 1;
                await log.save();
                
                await createAuditLog({
                  userId: req.user.userId,
                  action: 'notify_failed',
                  entity: 'Student',
                  entityId: student._id,
                  after: { error: 'WhatsApp send failed', details: err.message },
                });
              });
          }
        }
      } catch (err) {
        console.error(`⚠️ Failed to trigger WhatsApp welcome to ${student.fullName}:`, err.message);
      }
    })();

    res.status(201).json({
      message: 'Student registered successfully',
      student,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: 'A student with this information already exists' });
    }
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

/**
 * GET /api/students — List students with search/filter/pagination
 */
const getStudents = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      batch = '',
      danceStyle = '',
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const filter = {};

    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { mobile: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) filter.status = status;
    if (batch) filter.batch = batch;
    if (danceStyle) filter.danceStyle = danceStyle;

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [students, total] = await Promise.all([
      Student.find(filter)
        .sort(sort)
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      Student.countDocuments(filter),
    ]);

    res.json({
      students,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/students/:id — Get single student
 */
const getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id).populate('planId');
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    res.json({ student });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * PUT /api/students/:id — Update student
 */
const updateStudent = async (req, res) => {
  try {
    const before = await Student.findById(req.params.id).lean();
    if (!before) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const updateData = req.body;
    if (req.file) {
      updateData.photo = `/uploads/students/${req.file.filename}`;
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );

    await createAuditLog({
      userId: req.user.userId,
      action: 'update',
      entity: 'Student',
      entityId: student._id,
      before,
      after: student.toObject(),
    });

    res.json({
      message: 'Student updated successfully',
      student,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

/**
 * DELETE /api/students/:id — Soft delete (set status to 'left')
 */
const deleteStudent = async (req, res) => {
  try {
    const before = await Student.findById(req.params.id).lean();
    if (!before) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const student = await Student.findByIdAndUpdate(
      req.params.id,
      { status: 'left' },
      { new: true }
    );

    await createAuditLog({
      userId: req.user.userId,
      action: 'delete',
      entity: 'Student',
      entityId: student._id,
      before,
      after: student.toObject(),
    });

    res.json({ message: 'Student removed successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createStudent,
  getStudents,
  getStudent,
  updateStudent,
  deleteStudent,
};
