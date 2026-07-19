const mongoose = require('mongoose');
const env = require('../src/config/env');

const Student = require('../src/models/Student');
const Membership = require('../src/models/Membership');
const Attendance = require('../src/models/Attendance');
const WhatsappLog = require('../src/models/WhatsappLog');

const runClear = async () => {
  try {
    await mongoose.connect(env.mongoUri);
    console.log('Connected to MongoDB');

    // Find test students
    const testStudents = await Student.find({ fullName: { $regex: 'Test Student' } });
    const studentIds = testStudents.map(s => s._id);

    if (studentIds.length > 0) {
      console.log(`Found ${studentIds.length} test students. Deleting...`);
      
      const resMemberships = await Membership.deleteMany({ studentId: { $in: studentIds } });
      console.log(`Deleted ${resMemberships.deletedCount} test memberships.`);
      
      const resAttendance = await Attendance.deleteMany({ studentId: { $in: studentIds } });
      console.log(`Deleted ${resAttendance.deletedCount} test attendance records.`);

      const resLogs = await WhatsappLog.deleteMany({ studentId: { $in: studentIds } });
      console.log(`Deleted ${resLogs.deletedCount} test whatsapp logs.`);

      const resStudents = await Student.deleteMany({ _id: { $in: studentIds } });
      console.log(`Deleted ${resStudents.deletedCount} test students.`);
    } else {
      console.log('No test students found to delete.');
    }

    console.log('✅ Seed data cleanup complete.');
    process.exit(0);
  } catch (error) {
    console.error('Error clearing data:', error);
    process.exit(1);
  }
};

runClear();
