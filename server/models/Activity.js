const mongoose = require('mongoose');

const activitySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const dailyActivityLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  activity: { type: mongoose.Schema.Types.ObjectId, ref: 'Activity', required: true },
  activityName: { type: String, required: true },
  date: { type: String, required: true },
  completed: { type: Boolean, default: false },
  note: { type: String, default: '' }
}, { timestamps: true });

dailyActivityLogSchema.index({ user: 1, date: 1, activity: 1 }, { unique: true });

module.exports = {
  Activity: mongoose.model('Activity', activitySchema),
  DailyActivityLog: mongoose.model('DailyActivityLog', dailyActivityLogSchema)
};