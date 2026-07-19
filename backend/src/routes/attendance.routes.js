const express = require('express');
const router = express.Router();
const attendanceController = require('../controllers/attendance.controller');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.use(authenticate);

router.post('/',
  requireRole(['owner', 'manager', 'receptionist', 'trainer']),
  attendanceController.markAttendance
);

router.post('/bulk',
  requireRole(['owner', 'manager', 'receptionist', 'trainer']),
  attendanceController.bulkMarkAttendance
);

router.get('/',
  requireRole(['owner', 'manager', 'receptionist', 'trainer']),
  attendanceController.getAttendanceByDate
);

module.exports = router;
