const mongoose = require('mongoose');

const timetableSettingsSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  wakeUpTime: { type: String, required: true }, // "06:00"
  sleepTime: { type: String, required: true },  // "22:00"
}, { timestamps: true });

const periodSchema = new mongoose.Schema({
  day: { type: String, required: true }, // "Monday"
  hour: { type: String, required: true }, // "06:00"
  task: { type: String, default: '' },
});

const timetableSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  periods: [periodSchema]
}, { timestamps: true });

const dailyLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true }, // YYYY-MM-DD
  day: { type: String, required: true },  // "Monday"
  hour: { type: String, required: true }, // "06:00"
  task: { type: String, default: '' },
  completed: { type: Boolean, default: false },
  missedReason: { type: String, default: '' },
}, { timestamps: true });

dailyLogSchema.index({ user: 1, date: 1, hour: 1 }, { unique: true });

module.exports = {
  TimetableSettings: mongoose.model('TimetableSettings', timetableSettingsSchema),
  Timetable: mongoose.model('Timetable', timetableSchema),
  TimetableDailyLog: mongoose.model('TimetableDailyLog', dailyLogSchema)
};
