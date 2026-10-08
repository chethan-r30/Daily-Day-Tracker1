const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true, trim: true },
  targetMinutesPerDay: { type: Number, default: 60 },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

const studyLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  subject: { type: mongoose.Schema.Types.ObjectId, ref: 'Subject', required: true },
  subjectName: { type: String, required: true },
  date: { type: String, required: true },
  topic: { type: String, default: '' },
  minutesStudied: { type: Number, default: 0 }
}, { timestamps: true });

studyLogSchema.index({ user: 1, date: 1, subject: 1 }, { unique: true });

module.exports = {
  Subject: mongoose.model('Subject', subjectSchema),
  StudyLog: mongoose.model('StudyLog', studyLogSchema)
};