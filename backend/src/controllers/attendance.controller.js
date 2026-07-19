const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const createAuditLog = require('../utils/auditLog');

/**
 * POST /api/attendance — Mark attendance for one student
 */
const markAttendance = async (req, res) => {
  try {
    const { studentId, status = 'present', method = 'manual' } = req.body;

    // Normalize date to start of day
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if student exists
    const student = await Student.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Upsert: update if exists, create if not
    const attendance = await Attendance.findOneAndUpdate(
      { studentId, date: today },
      { status, method, markedBy: req.user.userId },
      { upsert: true, new: true, runValidators: true }
    );

    res.status(201).json({
      message: 'Attendance marked successfully',
      attendance,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ message: error.message });
  }
};

/**
 * POST /api/attendance/bulk — Mark attendance for multiple students
 */
const bulkMarkAttendance = async (req, res) => {
  try {
    const { records, date } = req.body;
    // records: [{ studentId, status }]

    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    const operations = records.map((record) => ({
      updateOne: {
        filter: { studentId: record.studentId, date: attendanceDate },
        update: {
          status: record.status || 'present',
          method: 'manual',
          markedBy: req.user.userId,
        },
        upsert: true,
      },
    }));

    const result = await Attendance.bulkWrite(operations);

    res.json({
      message: `Attendance marked for ${records.length} students`,
      modified: result.modifiedCount,
      created: result.upsertedCount,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/attendance?date=YYYY-MM-DD — Get attendance for a date
 */
const getAttendanceByDate = async (req, res) => {
  try {
    const { date } = req.query;
    const attendanceDate = date ? new Date(date) : new Date();
    attendanceDate.setHours(0, 0, 0, 0);

    // Get all active students
    const students = await Student.find({ status: 'active' })
      .select('fullName mobile batch danceStyle photo')
      .sort({ fullName: 1 })
      .lean();

    // Get attendance records for the date
    const attendance = await Attendance.find({ date: attendanceDate }).lean();
    const attendanceMap = {};
    attendance.forEach((a) => {
      attendanceMap[a.studentId.toString()] = a;
    });

    // Merge students with attendance
    const result = students.map((student) => {
      const record = attendanceMap[student._id.toString()];
      return {
        ...student,
        attendance: record
          ? { status: record.status, method: record.method, _id: record._id }
          : null,
      };
    });

    const stats = {
      total: students.length,
      present: attendance.filter((a) => a.status === 'present').length,
      absent: attendance.filter((a) => a.status === 'absent').length,
      late: attendance.filter((a) => a.status === 'late').length,
      unmarked: students.length - attendance.length,
    };

    res.json({
      date: attendanceDate,
      students: result,
      stats,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  markAttendance,
  bulkMarkAttendance,
  getAttendanceByDate,
};
