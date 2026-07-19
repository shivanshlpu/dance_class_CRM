const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.use(authenticate);

// Reports dashboard needs manager/owner access
router.get('/summary', requireRole(['owner', 'manager']), reportController.getSummary);
router.get('/export/students', requireRole(['owner', 'manager']), reportController.exportStudents);
router.get('/export/attendance', requireRole(['owner', 'manager']), reportController.exportAttendance);

module.exports = router;
