const mongoose = require('mongoose');

const workoutLogSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },
  name: { type: String, required: true },
  reps: { type: Number, required: true },
  durationMinutes: { type: Number, required: true },
  caloriesBurned: { type: Number },
  proteinSuggested: { type: Number },
  aiSuggestion: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);