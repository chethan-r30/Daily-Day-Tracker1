const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/timetableController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/settings', ctrl.getSettings);          // ← specific routes first
router.post('/settings', ctrl.saveSettings);
router.get('/history', ctrl.getHistory);            // ← before /:id
router.post('/ai-suggestion', ctrl.getAISuggestion);
router.get('/daily/:date', ctrl.getDailyLog);
router.put('/daily/:logId', ctrl.updateDailyLog);
router.put('/cell', ctrl.updateCell);
router.get('/', ctrl.getTimetable);                 // ← general routes last

module.exports = router;