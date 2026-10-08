const { Subject, StudyLog } = require('../models/Study');

exports.getSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ user: req.user._id, isActive: true });
    res.json(subjects);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createSubject = async (req, res) => {
  try {
    const subject = await Subject.create({ user: req.user._id, name: req.body.name, targetMinutesPerDay: req.body.targetMinutesPerDay || 60 });
    res.status(201).json(subject);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateSubject = async (req, res) => {
  try {
    const subject = await Subject.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name: req.body.name, targetMinutesPerDay: req.body.targetMinutesPerDay },
      { new: true }
    );
    if (!subject) return res.status(404).json({ message: 'Subject not found' });
    await StudyLog.updateMany({ subject: req.params.id }, { subjectName: req.body.name });
    res.json(subject);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteSubject = async (req, res) => {
  try {
    await Subject.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isActive: false });
    res.json({ message: 'Subject removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getStudyLogs = async (req, res) => {
  try {
    const { date } = req.params;
    const subjects = await Subject.find({ user: req.user._id, isActive: true });
    const logs = await StudyLog.find({ user: req.user._id, date });
    const logMap = {};
    logs.forEach(l => { logMap[l.subject.toString()] = l; });
    const result = await Promise.all(subjects.map(async (s) => {
      if (!logMap[s._id.toString()]) {
        const newLog = await StudyLog.create({ user: req.user._id, subject: s._id, subjectName: s.name, date, topic: '', minutesStudied: 0 });
        return { ...newLog.toObject(), targetMinutesPerDay: s.targetMinutesPerDay };
      }
      return { ...logMap[s._id.toString()].toObject(), targetMinutesPerDay: s.targetMinutesPerDay };
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateStudyLog = async (req, res) => {
  try {
    const log = await StudyLog.findByIdAndUpdate(
      req.params.logId,
      { topic: req.body.topic, minutesStudied: req.body.minutesStudied },
      { new: true }
    );
    res.json(log);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getStudyHistory = async (req, res) => {
  try {
    const logs = await StudyLog.find({ user: req.user._id }).sort({ date: -1 }).limit(100);
    res.json(logs);
  } catch (err) { res.status(500).json({ message: err.message }); }
};