const cron = require('node-cron');
const moment = require('moment');
const Student = require('../models/Student');
const Membership = require('../models/Membership');
const Attendance = require('../models/Attendance');
const WhatsappLog = require('../models/WhatsappLog');
const Settings = require('../models/Settings');
const Plan = require('../models/Plan');
const { sendWhatsappMessage } = require('../services/whatsapp.service');
const { generateMessage } = require('../services/whatsappTemplate.service');
const { getRandomPoster } = require('../services/poster.service');

const sendScheduledMessage = async (student, membership, settings, type, category, logType) => {
  // Check if already sent
  const existingLog = await WhatsappLog.findOne({
    studentId: student._id,
    messageType: logType,
    // For expiry, ideally scoped to this membership ID, but we can assume one logType per membership cycle
    // We can filter by recent time (e.g., within last 6 months) if needed, but for simplicity:
  }).sort({ createdAt: -1 });

  if (existingLog && moment().diff(moment(existingLog.createdAt), 'days') < 30) {
    // Already sent recently (within 30 days)
    return;
  }

  const messageText = await generateMessage(type, { student, membership, settings });
  if (!messageText) return;

  const posterUrl = await getRandomPoster(category);
  
  // Log intent
  const log = await WhatsappLog.create({
    studentId: student._id,
    messageType: logType,
    content: messageText,
    status: 'pending'
  });

  try {
    if (student.whatsappNumber || student.mobile) {
      await sendWhatsappMessage(student.whatsappNumber || student.mobile, messageText, posterUrl);
      log.status = 'sent';
      log.sentAt = new Date();
    } else {
      log.status = 'failed';
      log.errorMessage = 'No contact number';
    }
  } catch (error) {
    log.status = 'failed';
    log.errorMessage = error.message;
    log.retryCount = 1;
  }
  await log.save();
};

const checkInactivity = async (settings) => {
  if (!settings.automations?.inactive) return;
  console.log('Running Inactivity Check...');

  // Get all active students with active membership
  const activeMemberships = await Membership.find({ status: 'active' }).populate('studentId');

  const today = moment().startOf('day');

  for (const member of activeMemberships) {
    const student = member.studentId;
    if (!student || student.status !== 'active') continue;

    // Fetch last 15 days attendance for this student
    const recentAttendance = await Attendance.find({
      studentId: student._id,
      date: { $gte: moment().subtract(15, 'days').toDate() }
    }).sort({ date: -1 });

    // Calculate consecutive absences from today downwards
    let consecutiveAbsences = 0;
    for (let i = 0; i < 15; i++) {
      const targetDate = moment().subtract(i, 'days').startOf('day');
      
      // Stop counting absences if we check a date before their membership even started
      if (moment(targetDate).isBefore(moment(member.startDate).startOf('day'))) {
        break;
      }

      const record = recentAttendance.find(a => moment(a.date).isSame(targetDate, 'day'));
      
      // If marked absent or no record exists (assume absent if class happened, but for now strict absence check or no record implies absent)
      if (!record || record.status === 'absent') {
        consecutiveAbsences++;
      } else {
        break; // Found a present/late mark, break sequence
      }
    }

    if (consecutiveAbsences >= 15) {
      await sendScheduledMessage(student, member, settings, 'miss_you_3', 'miss_you', 'miss_you_3');
    } else if (consecutiveAbsences >= 10) {
      await sendScheduledMessage(student, member, settings, 'miss_you_2', 'miss_you', 'miss_you_2');
    } else if (consecutiveAbsences >= 5) {
      await sendScheduledMessage(student, member, settings, 'miss_you_1', 'miss_you', 'miss_you_1');
    }
  }
};

const checkExpiry = async (settings) => {
  if (!settings.automations?.expiry) return;
  console.log('Running Expiry Check...');

  const today = moment().startOf('day');
  
  // Expiry target dates
  const targets = [
    { days: 5, type: 'expiry_5' },
    { days: 3, type: 'expiry_3' },
    { days: 2, type: 'expiry_2' },
    { days: 1, type: 'expiry_1' },
    { days: 0, type: 'expiry_0' }, // Today
  ];

  for (const target of targets) {
    const targetDate = moment(today).add(target.days, 'days');
    
    // Find memberships ending on this target date
    const expiringMemberships = await Membership.find({
      status: 'active',
      endDate: {
        $gte: targetDate.toDate(),
        $lte: moment(targetDate).endOf('day').toDate()
      }
    }).populate('studentId').populate('planId');

    for (const member of expiringMemberships) {
      const student = member.studentId;
      if (!student || student.status !== 'active') continue;
      
      await sendScheduledMessage(
        student, 
        member, 
        settings, 
        target.type, 
        target.days === 0 ? 'expiry' : 'renewal', 
        target.type
      );
    }
  }
};

const initCronJobs = () => {
  // Run every day at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('Executing daily cron jobs...');
    try {
      let settings = await Settings.findOne();
      if (!settings) {
         settings = await Settings.create({});
      }
      
      await checkExpiry(settings);
      await checkInactivity(settings);
    } catch (err) {
      console.error('Error in daily cron jobs:', err);
    }
  });
  
  console.log('Cron jobs initialized.');
};

module.exports = {
  initCronJobs,
  checkInactivity,
  checkExpiry
};
