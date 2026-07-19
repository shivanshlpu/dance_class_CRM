const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const Payment = require('../models/Payment');
const Membership = require('../models/Membership');

/**
 * GET /api/dashboard — Dashboard stats with real data
 */
const getDashboardStats = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Run all queries in parallel
    const [
      totalStudents,
      activeStudents,
      newAdmissions,
      todayAttendance,
      monthlyRevenue,
      expiringMemberships,
      recentStudents,
    ] = await Promise.all([
      // Total students (not left)
      Student.countDocuments({ status: { $ne: 'left' } }),

      // Active students
      Student.countDocuments({ status: 'active' }),

      // New admissions this month
      Student.countDocuments({
        joiningDate: { $gte: startOfMonth },
      }),

      // Today's attendance
      Attendance.aggregate([
        { $match: { date: { $gte: today, $lt: tomorrow } } },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
          },
        },
      ]),

      // Monthly revenue
      Payment.aggregate([
        { $match: { date: { $gte: startOfMonth }, type: 'fee' } },
        { $group: { _id: null, total: { $sum: '$amount' } } },
      ]),

      // Memberships expiring in next 7 days
      Membership.countDocuments({
        status: 'active',
        endDate: {
          $gte: today,
          $lte: new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000),
        },
      }),

      // Recent 5 students
      Student.find()
        .sort({ createdAt: -1 })
        .limit(5)
        .select('fullName mobile joiningDate danceStyle status photo')
        .lean(),
    ]);

    // Process attendance stats
    const attendanceStats = { present: 0, absent: 0, late: 0 };
    todayAttendance.forEach(({ _id, count }) => {
      attendanceStats[_id] = count;
    });
    const totalPresent = attendanceStats.present + attendanceStats.late;

    res.json({
      totalStudents,
      activeStudents,
      newAdmissions,
      todayAttendance: totalPresent,
      attendanceBreakdown: attendanceStats,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      expiringMemberships,
      recentStudents,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getDashboardStats };
