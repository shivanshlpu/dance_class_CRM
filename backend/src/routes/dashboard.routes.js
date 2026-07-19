const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboard.controller');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.use(authenticate);

router.get('/',
  requireRole(['owner', 'manager', 'receptionist']),
  dashboardController.getDashboardStats
);

module.exports = router;
