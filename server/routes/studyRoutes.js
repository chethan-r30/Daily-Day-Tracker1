const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/studyController');
const { protect } = require('../middleware/auth');

router.use(protect);
router.get('/subjects', ctrl.getSubjects);
router.post('/subjects', ctrl.createSubject);
router.put('/subjects/:id', ctrl.updateSubject);
router.delete('/subjects/:id', ctrl.deleteSubject);
router.get('/history', ctrl.getStudyHistory);       // ← MUST be before /logs/:date
router.get('/logs/:date', ctrl.getStudyLogs);
router.put('/logs/:logId', ctrl.updateStudyLog);

module.exports = router;