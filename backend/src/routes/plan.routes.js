const express = require('express');
const router = express.Router();
const planController = require('../controllers/plan.controller');
const authenticate = require('../middleware/auth');
const requireRole = require('../middleware/requireRole');

router.use(authenticate);

// Plans
router.post('/', requireRole(['owner', 'manager']), planController.createPlan);
router.get('/', requireRole(['owner', 'manager', 'receptionist']), planController.getPlans);
router.put('/:id', requireRole(['owner', 'manager']), planController.updatePlan);
router.delete('/:id', requireRole(['owner']), planController.deletePlan);

// Memberships
router.post('/membership', requireRole(['owner', 'manager', 'receptionist']), planController.assignMembership);
router.get('/membership', requireRole(['owner', 'manager', 'receptionist']), planController.getMemberships);

module.exports = router;
