const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/activityController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/history', ctrl.getHistoryLogs);       // ← MUST be before /:id
router.get('/logs/:date', ctrl.getDailyLogs);       // ← MUST be before /:id
router.put('/logs/:logId/toggle', ctrl.toggleActivityLog);
router.get('/', ctrl.getActivities);
router.post('/', ctrl.createActivity);
router.put('/:id', ctrl.updateActivity);
router.delete('/:id', ctrl.deleteActivity);

module.exports = router;