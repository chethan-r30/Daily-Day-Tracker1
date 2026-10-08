const { TimetableSettings, Timetable, TimetableDailyLog } = require('../models/Timetable');
const OpenAI = require('openai');

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

function generateHours(wakeUp, sleep) {
  const hours = [];
  const [wakeH] = wakeUp.split(':').map(Number);
  let [sleepH] = sleep.split(':').map(Number);
  if (sleepH <= wakeH) sleepH += 24; // handle overnight
  for (let h = wakeH; h < sleepH; h++) {
    const actual = h % 24;
    hours.push(`${String(actual).padStart(2, '0')}:00`);
  }
  return hours;
}

// Save wake/sleep settings + auto-generate empty timetable grid
exports.saveSettings = async (req, res) => {
  try {
    const { wakeUpTime, sleepTime } = req.body;
    const hours = generateHours(wakeUpTime, sleepTime);

    await TimetableSettings.findOneAndUpdate(
      { user: req.user._id },
      { wakeUpTime, sleepTime },
      { upsert: true, new: true }
    );

    const existing = await Timetable.findOne({ user: req.user._id });
    const existingMap = {};
    if (existing) {
      existing.periods.forEach(p => { existingMap[`${p.day}_${p.hour}`] = p.task; });
    }

    const periods = [];
    DAYS.forEach(day => {
      hours.forEach(hour => {
        periods.push({ day, hour, task: existingMap[`${day}_${hour}`] || '' });
      });
    });

    await Timetable.findOneAndUpdate(
      { user: req.user._id },
      { periods },
      { upsert: true, new: true }
    );

    res.json({ message: 'Timetable created', wakeUpTime, sleepTime, hours, periods });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getSettings = async (req, res) => {
  try {
    const settings = await TimetableSettings.findOne({ user: req.user._id });
    res.json(settings || null);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getTimetable = async (req, res) => {
  try {
    const timetable = await Timetable.findOne({ user: req.user._id });
    const settings = await TimetableSettings.findOne({ user: req.user._id });
    res.json({ timetable: timetable || null, settings: settings || null });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Update a single cell task
exports.updateCell = async (req, res) => {
  try {
    const { day, hour, task } = req.body;
    await Timetable.findOneAndUpdate(
      { user: req.user._id, 'periods.day': day, 'periods.hour': hour },
      { $set: { 'periods.$.task': task } }
    );
    res.json({ message: 'Cell updated' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Get or create today's daily log
exports.getDailyLog = async (req, res) => {
  try {
    const { date } = req.params;
    const dayName = new Date(date).toLocaleDateString('en-US', { weekday: 'long' });
    const timetable = await Timetable.findOne({ user: req.user._id });
    if (!timetable) return res.json([]);

    const dayPeriods = timetable.periods.filter(p => p.day === dayName);
    const existingLogs = await TimetableDailyLog.find({ user: req.user._id, date });
    const logMap = {};
    existingLogs.forEach(l => { logMap[l.hour] = l; });

    const result = await Promise.all(dayPeriods.map(async (p) => {
      if (!logMap[p.hour]) {
        const newLog = await TimetableDailyLog.create({
          user: req.user._id, date, day: dayName,
          hour: p.hour, task: p.task, completed: false, missedReason: ''
        });
        return newLog;
      }
      if (logMap[p.hour].task !== p.task) {
        logMap[p.hour].task = p.task;
        await logMap[p.hour].save();
      }
      return logMap[p.hour];
    }));

    res.json(result);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// Toggle complete / save missed reason
exports.updateDailyLog = async (req, res) => {
  try {
    const { logId } = req.params;
    const { completed, missedReason } = req.body;
    const log = await TimetableDailyLog.findByIdAndUpdate(
      logId,
      { completed, missedReason: completed ? '' : missedReason },
      { new: true }
    );
    res.json(log);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

// AI suggestion on missed periods
exports.getAISuggestion = async (req, res) => {
  try {
    const { missedPeriods } = req.body;
    if (!missedPeriods || missedPeriods.length === 0)
      return res.json({ suggestion: 'Great job! You completed all your tasks today. Keep it up! 🎉' });

    const summary = missedPeriods.map(p => `- ${p.hour}: "${p.task}" — Reason: ${p.missedReason || 'No reason given'}`).join('\n');

    let suggestion = '';
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `A student missed the following scheduled tasks today:\n${summary}\n\nAnalyze where they are wasting time, what is causing it, and give 3-4 specific, actionable tips to improve their time management. Be direct, motivating, and concise. Max 5 sentences.`
        }],
        max_tokens: 200
      });
      suggestion = completion.choices[0].message.content;
    } catch (e) {
      const reasons = missedPeriods.map(p => p.missedReason).filter(Boolean);
      const commonReason = reasons.length ? reasons[0] : 'distractions';
      suggestion = `You missed ${missedPeriods.length} task(s) today. The pattern suggests time is being lost to ${commonReason}. Try time-blocking strictly and eliminate phone distractions during work periods. Set a 5-minute buffer between tasks to stay on track. Review your schedule tonight and adjust unrealistic time slots.`;
    }

    res.json({ suggestion });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getHistory = async (req, res) => {
  try {
    const logs = await TimetableDailyLog.find({ user: req.user._id }).sort({ date: -1 }).limit(100);
    res.json(logs);
  } catch (err) { res.status(500).json({ message: err.message }); }
};
