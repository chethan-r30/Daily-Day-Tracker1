const { Activity, DailyActivityLog } = require('../models/Activity');

exports.getActivities = async (req, res) => {
  try {
    const activities = await Activity.find({ user: req.user._id, isActive: true });
    res.json(activities);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.createActivity = async (req, res) => {
  try {
    const activity = await Activity.create({ user: req.user._id, name: req.body.name });
    res.status(201).json(activity);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateActivity = async (req, res) => {
  try {
    const activity = await Activity.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name: req.body.name },
      { new: true }
    );
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    await DailyActivityLog.updateMany({ activity: req.params.id }, { activityName: req.body.name });
    res.json(activity);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteActivity = async (req, res) => {
  try {
    await Activity.findOneAndUpdate({ _id: req.params.id, user: req.user._id }, { isActive: false });
    res.json({ message: 'Activity removed' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getDailyLogs = async (req, res) => {
  try {
    const { date } = req.params;
    const activities = await Activity.find({ user: req.user._id, isActive: true });
    const logs = await DailyActivityLog.find({ user: req.user._id, date });
    const logMap = {};
    logs.forEach(l => { logMap[l.activity.toString()] = l; });
    const result = await Promise.all(activities.map(async (a) => {
      if (!logMap[a._id.toString()]) {
        const newLog = await DailyActivityLog.create({
          user: req.user._id, activity: a._id, activityName: a.name, date, completed: false
        });
        return newLog;
      }
      return logMap[a._id.toString()];
    }));
    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.toggleActivityLog = async (req, res) => {
  try {
    const log = await DailyActivityLog.findByIdAndUpdate(
      req.params.logId,
      { completed: req.body.completed, note: req.body.note },
      { new: true }
    );
    res.json(log);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getHistoryLogs = async (req, res) => {
  try {
    const logs = await DailyActivityLog.find({ user: req.user._id }).sort({ date: -1 }).limit(60);
    res.json(logs);
  } catch (err) { res.status(500).json({ message: err.message }); }
};