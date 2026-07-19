const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const { parse } = require('json2csv');
const moment = require('moment');

/**
 * GET /api/reports/summary
 * Returns summary stats: total students, new this month, and daily attendance over the last 7 days.
 */
const getSummary = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments({ status: 'active' });
    
    const startOfMonth = moment().startOf('month').toDate();
    const newAdmissions = await Student.countDocuments({
      createdAt: { $gte: startOfMonth }
    });

    // Calculate monthly revenue from Payment model
    const revenueData = await Payment.aggregate([
      { $match: { date: { $gte: startOfMonth }, type: 'fee' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const monthlyIncome = revenueData[0]?.total || 0;

    // Get attendance trend for the last 7 days
    const last7Days = moment().subtract(7, 'days').startOf('day').toDate();
    const attendanceData = await Attendance.aggregate([
      {
        $match: {
          date: { $gte: last7Days },
          status: 'present'
        }
      },
      {
        $group: {
          _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const formattedAttendance = attendanceData.map(item => ({
      date: item._id,
      present: item.count
    }));

    res.json({
      totalStudents,
      newAdmissions,
      monthlyIncome,
      attendanceTrend: formattedAttendance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/reports/export/students
 * Downloads all students as CSV
 */
const exportStudents = async (req, res) => {
  try {
    const students = await Student.find().populate('planId').lean();
    
    const fields = ['fullName', 'email', 'mobile', 'whatsappNumber', 'batch', 'status', 'createdAt'];
    const csv = parse(students, { fields });
    
    res.header('Content-Type', 'text/csv');
    res.attachment(`students_export_${moment().format('YYYY-MM-DD')}.csv`);
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/reports/export/attendance
 * Downloads attendance for the current month as CSV
 */
const exportAttendance = async (req, res) => {
  try {
    const startOfMonth = moment().startOf('month').toDate();
    const attendance = await Attendance.find({ date: { $gte: startOfMonth } })
      .populate('studentId', 'fullName mobile')
      .lean();
    
    const data = attendance.map(a => ({
      date: moment(a.date).format('YYYY-MM-DD'),
      studentName: a.studentId ? a.studentId.fullName : 'Unknown',
      studentMobile: a.studentId ? a.studentId.mobile : 'Unknown',
      status: a.status,
      method: a.method
    }));

    const fields = ['date', 'studentName', 'studentMobile', 'status', 'method'];
    const csv = parse(data, { fields });
    
    res.header('Content-Type', 'text/csv');
    res.attachment(`attendance_export_${moment().format('YYYY-MM')}.csv`);
    return res.send(csv);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getSummary,
  exportStudents,
  exportAttendance
};
