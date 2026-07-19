const Plan = require('../models/Plan');
const Membership = require('../models/Membership');
const Student = require('../models/Student');
const Settings = require('../models/Settings');
const WhatsappLog = require('../models/WhatsappLog');
const createAuditLog = require('../utils/auditLog');
const { sendWhatsappMessage } = require('../services/whatsapp.service');
const { generateMessage } = require('../services/whatsappTemplate.service');
const { getRandomPoster } = require('../services/poster.service');


// ─── Plan CRUD ─────────────────────────────────────────
const createPlan = async (req, res) => {
  try {
    const plan = await Plan.create(req.body);
    await createAuditLog({
      userId: req.user.userId, action: 'create',
      entity: 'Plan', entityId: plan._id, after: plan.toObject(),
    });
    res.status(201).json({ message: 'Plan created', plan });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const getPlans = async (req, res) => {
  try {
    const plans = await Plan.find({ isActive: true }).sort({ price: 1 }).lean();
    res.json({ plans });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updatePlan = async (req, res) => {
  try {
    const before = await Plan.findById(req.params.id).lean();
    if (!before) return res.status(404).json({ message: 'Plan not found' });

    const plan = await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    await createAuditLog({
      userId: req.user.userId, action: 'update',
      entity: 'Plan', entityId: plan._id, before, after: plan.toObject(),
    });
    res.json({ message: 'Plan updated', plan });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const deletePlan = async (req, res) => {
  try {
    const plan = await Plan.findByIdAndUpdate(req.params.id, { isActive: false }, { new: true });
    if (!plan) return res.status(404).json({ message: 'Plan not found' });
    await createAuditLog({
      userId: req.user.userId, action: 'delete',
      entity: 'Plan', entityId: plan._id,
    });
    res.json({ message: 'Plan deactivated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─── Membership ────────────────────────────────────────
const assignMembership = async (req, res) => {
  try {
    const { studentId, planId, startDate } = req.body;

    const plan = await Plan.findById(planId);
    if (!plan) return res.status(404).json({ message: 'Plan not found' });

    const start = startDate ? new Date(startDate) : new Date();
    const end = new Date(start);
    end.setDate(end.getDate() + plan.durationDays);

    // Deactivate existing active memberships for this student
    await Membership.updateMany(
      { studentId, status: 'active' },
      { status: 'expired' }
    );

    const membership = await Membership.create({
      studentId,
      planId,
      startDate: start,
      endDate: end,
      status: 'active',
    });

    // Update student's planId
    await Student.findByIdAndUpdate(studentId, { planId, status: 'active' });

    await createAuditLog({
      userId: req.user.userId, action: 'create',
      entity: 'Membership', entityId: membership._id, after: membership.toObject(),
    });

    // Fire and forget WhatsApp Renewal/Assignment Message
    (async () => {
      try {
        let settings = await Settings.findOne();
        if (!settings) settings = await Settings.create({});
        
        // Wait for populated student
        const student = await Student.findById(studentId);
        
        if (settings.automations?.welcome && (student.whatsappNumber || student.mobile)) {
          // If this is their first ever membership, we could send a 'welcome' plan message
          // but let's stick to 'renewal' as per requirements
          const messageText = await generateMessage('renewal', { student, membership: { ...membership.toObject(), plan }, settings });
          if (messageText) {
            const posterUrl = await getRandomPoster('renewal');
            
            const log = await WhatsappLog.create({
              studentId: student._id,
              messageType: 'renewal',
              content: messageText,
              status: 'pending'
            });

            sendWhatsappMessage(student.whatsappNumber || student.mobile, messageText, posterUrl)
              .then(async () => {
                log.status = 'sent';
                log.sentAt = new Date();
                await log.save();
              })
              .catch(async (err) => {
                log.status = 'failed';
                log.errorMessage = err.message;
                log.retryCount = 1;
                await log.save();
              });
          }
        }
      } catch (err) {
        console.error(`⚠️ Failed to trigger WhatsApp renewal to studentId ${studentId}:`, err.message);
      }
    })();

    res.status(201).json({ message: 'Membership assigned', membership });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

const getMemberships = async (req, res) => {
  try {
    const { status, studentId, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (studentId) filter.studentId = studentId;

    const [memberships, total] = await Promise.all([
      Membership.find(filter)
        .populate('studentId', 'fullName mobile photo')
        .populate('planId', 'name price durationDays')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(),
      Membership.countDocuments(filter),
    ]);

    res.json({
      memberships,
      pagination: { page: parseInt(page), limit: parseInt(limit), total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createPlan,
  getPlans,
  updatePlan,
  deletePlan,
  assignMembership,
  getMemberships,
};
