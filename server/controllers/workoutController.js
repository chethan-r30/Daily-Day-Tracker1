const WorkoutLog = require('../models/Workout');
const User = require('../models/User');
const OpenAI = require('openai');

const CALORIES_MAP = {
  default: 5, running: 10, push: 8, squat: 7,
  plank: 4, cycling: 9, swimming: 11, yoga: 3, walk: 4
};

function estimateCalories(name, durationMinutes, reps, weight = 70) {
  const key = Object.keys(CALORIES_MAP).find(k => name.toLowerCase().includes(k)) || 'default';
  return Math.round(CALORIES_MAP[key] * durationMinutes * (weight / 70));
}

function estimateProtein(caloriesBurned) {
  return Math.round((caloriesBurned * 0.15) / 4);
}

exports.getWorkouts = async (req, res) => {
  try {
    const logs = await WorkoutLog.find({ user: req.user._id, date: req.params.date });
    res.json(logs);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.addWorkout = async (req, res) => {
  try {
    const { name, reps, durationMinutes, date } = req.body;
    const user = await User.findById(req.user._id);
    const weight = user.weight || 70;
    const caloriesBurned = estimateCalories(name, durationMinutes, reps, weight);
    const proteinSuggested = estimateProtein(caloriesBurned);
    let aiSuggestion = '';
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: `I did ${name} for ${durationMinutes} minutes, ${reps} reps. Weight: ${weight}kg. Burned ~${caloriesBurned} cal. Give 2 short tips and protein advice in 3 sentences max.` }],
        max_tokens: 150
      });
      aiSuggestion = completion.choices[0].message.content;
    } catch (e) {
      aiSuggestion = `Great effort! You burned ~${caloriesBurned} calories. Consume ${proteinSuggested}g protein post-workout. Stay hydrated!`;
    }
    const workout = await WorkoutLog.create({ user: req.user._id, date, name, reps, durationMinutes, caloriesBurned, proteinSuggested, aiSuggestion });
    res.status(201).json(workout);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.updateWorkout = async (req, res) => {
  try {
    const { name, reps, durationMinutes } = req.body;
    const user = await User.findById(req.user._id);
    const weight = user.weight || 70;
    const caloriesBurned = estimateCalories(name, durationMinutes, reps, weight);
    const proteinSuggested = estimateProtein(caloriesBurned);
    let aiSuggestion = '';
    try {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: `I did ${name} for ${durationMinutes} min, ${reps} reps. Weight: ${weight}kg. ~${caloriesBurned} cal. 2 tips + protein in 3 sentences.` }],
        max_tokens: 150
      });
      aiSuggestion = completion.choices[0].message.content;
    } catch (e) {
      aiSuggestion = `You burned ~${caloriesBurned} cal. Aim for ${proteinSuggested}g protein post-workout.`;
    }
    const workout = await WorkoutLog.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id },
      { name, reps, durationMinutes, caloriesBurned, proteinSuggested, aiSuggestion },
      { new: true }
    );
    res.json(workout);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.deleteWorkout = async (req, res) => {
  try {
    await WorkoutLog.findOneAndDelete({ _id: req.params.id, user: req.user._id });
    res.json({ message: 'Workout deleted' });
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getWorkoutHistory = async (req, res) => {
  try {
    const logs = await WorkoutLog.find({ user: req.user._id }).sort({ date: -1 }).limit(60);
    res.json(logs);
  } catch (err) { res.status(500).json({ message: err.message }); }
};

exports.getBMISuggestion = async (req, res) => {
  try {
    const { height, weight, gender, age } = req.body;

    // Validate inputs: height in cm and weight in kg are required and must be positive numbers
    const parsedHeight = parseFloat(height);
    const parsedWeight = parseFloat(weight);
    const parsedAge = age ? parseInt(age, 10) : 25; // default age fallback for body-fat estimate
    if (!parsedHeight || parsedHeight <= 0 || !parsedWeight || parsedWeight <= 0) {
      return res.status(400).json({ message: 'Invalid height or weight. Provide height (cm) and weight (kg) as positive numbers.' });
    }

    const heightM = parsedHeight / 100;
    const bmi = parseFloat((parsedWeight / (heightM * heightM)).toFixed(1));

    // Body fat % estimate using gender-adjusted Deurenberg formula
    let bodyFatPct = null;
    let bodyFatCategory = '';
    const g = (gender || '').toLowerCase();
    if (g === 'male') {
      bodyFatPct = parseFloat((1.20 * bmi + 0.23 * parsedAge - 16.2).toFixed(1));
    } else if (g === 'female') {
      bodyFatPct = parseFloat((1.20 * bmi + 0.23 * parsedAge - 5.4).toFixed(1));
    }

    // Gender-specific BMI categories
    let category = '';
    let advice = '';
    let workoutPlan = [];
    let idealWeightRange = '';

    if (gender === 'female') {
      // Women have slightly higher healthy body fat, same BMI scale but different advice
      if (bmi < 18.5) {
        category = 'Underweight';
        advice = 'Women need adequate nutrition for hormonal health. Focus on strength training and nutrient-dense foods like iron, calcium, and protein.';
        workoutPlan = [
          'Strength training 3x/week — squats, deadlifts, hip thrusts',
          'Eat 300-500 cal surplus with iron-rich & protein-dense foods',
          'Include healthy fats: avocado, nuts, olive oil',
          'Limit excessive cardio — preserve muscle and hormonal balance',
          'Sleep 7-9 hours for recovery and hormone regulation'
        ];
      } else if (bmi <= 24.9) {
        category = 'Normal Weight';
        advice = 'Great shape! Maintain with a mix of strength and cardio. Focus on bone density and core strength.';
        workoutPlan = [
          'Cardio 3x/week — dancing, cycling, swimming, or running',
          'Strength training 2-3x/week — glutes, core, upper body',
          'Calcium & Vitamin D intake for bone health',
          'Yoga or pilates 1-2x/week for flexibility',
          'Maintain protein intake: 0.8-1g per kg of body weight'
        ];
      } else if (bmi <= 29.9) {
        category = 'Overweight';
        advice = 'Focus on consistent cardio and moderate calorie deficit. Avoid crash dieting — hormonal imbalance can worsen weight gain in women.';
        workoutPlan = [
          'Cardio 4-5x/week — brisk walking, Zumba, cycling',
          'Strength training 2x/week to boost metabolism',
          '300-400 cal/day deficit — no crash dieting',
          'Cut sugar and refined carbs; increase fiber intake',
          'Track meals — women often underestimate portions'
        ];
      } else {
        category = 'Obese';
        advice = 'Start slow and build consistency. Low-impact workouts protect joints. Consult a gynecologist — obesity affects hormonal health in women significantly.';
        workoutPlan = [
          'Low-impact cardio: walking, water aerobics, cycling',
          'Increase activity gradually — add 10 min/week',
          'Focus on whole foods, vegetables, lean protein',
          'Consult a doctor + nutritionist for a safe plan',
          'Prioritize sleep — poor sleep increases cortisol and weight'
        ];
      }

      // Ideal weight range for women (BMI 18.5–24.9)
      const minW = Math.round(18.5 * heightM * heightM);
      const maxW = Math.round(24.9 * heightM * heightM);
      idealWeightRange = `${minW} – ${maxW} kg`;

      // Body fat categories for women
      if (bodyFatPct !== null) {
        if (bodyFatPct < 14) bodyFatCategory = 'Essential Fat (Very Low)';
        else if (bodyFatPct < 21) bodyFatCategory = 'Athletic';
        else if (bodyFatPct < 25) bodyFatCategory = 'Fitness';
        else if (bodyFatPct < 32) bodyFatCategory = 'Acceptable';
        else bodyFatCategory = 'Obese Range';
      }

    } else {
      // Male (and other)
      if (bmi < 18.5) {
        category = 'Underweight';
        advice = 'Focus on compound strength movements and a calorie surplus to build lean muscle mass.';
        workoutPlan = [
          'Strength training 4x/week — bench, squat, deadlift, rows',
          'Eat 400-600 cal surplus with high protein (1.6g/kg)',
          'Limit cardio to 1-2x/week — preserve calories for muscle',
          'Creatine supplementation can help with muscle gain',
          'Sleep 8 hours — testosterone peaks during deep sleep'
        ];
      } else if (bmi <= 24.9) {
        category = 'Normal Weight';
        advice = 'You\'re in the healthy range. Focus on building strength and maintaining cardiovascular fitness.';
        workoutPlan = [
          'Strength training 3-4x/week — progressive overload',
          'Cardio 2-3x/week — running, cycling, swimming',
          'Protein intake: 1.2-1.6g per kg of body weight',
          'Core training 2x/week — planks, deadbugs, ab wheel',
          'Stay active daily — aim for 10,000 steps'
        ];
      } else if (bmi <= 29.9) {
        category = 'Overweight';
        advice = 'Focus on cardio and a moderate calorie deficit. High BMI in men increases risk of heart disease and low testosterone.';
        workoutPlan = [
          'Cardio 4-5x/week — running, cycling, HIIT',
          'Strength training 2-3x/week to preserve muscle',
          '400-500 cal/day deficit',
          'Cut alcohol and processed foods — major fat contributors in men',
          'Monitor blood pressure and cholesterol regularly'
        ];
      } else {
        category = 'Obese';
        advice = 'Start with low-impact activity and a clean diet. High obesity in men greatly increases cardiac risk. See a doctor.';
        workoutPlan = [
          'Start with 30-min walks daily — build to 60 min',
          'Low-impact strength: resistance bands, machines (not free weights yet)',
          'Eat lean protein + vegetables at every meal',
          'Avoid sugary drinks completely — switch to water',
          'Medical checkup: blood sugar, cholesterol, blood pressure'
        ];
      }

      const minW = Math.round(18.5 * heightM * heightM);
      const maxW = Math.round(24.9 * heightM * heightM);
      idealWeightRange = `${minW} – ${maxW} kg`;

      if (bodyFatPct !== null) {
        if (bodyFatPct < 6) bodyFatCategory = 'Essential Fat (Very Low)';
        else if (bodyFatPct < 14) bodyFatCategory = 'Athletic';
        else if (bodyFatPct < 18) bodyFatCategory = 'Fitness';
        else if (bodyFatPct < 25) bodyFatCategory = 'Acceptable';
        else bodyFatCategory = 'Obese Range';
      }
    }

    res.json({
      bmi,
      category,
      gender,
      targetBMI: '18.5 – 24.9',
      idealWeightRange,
      bodyFatPct,
      bodyFatCategory,
      advice,
      workoutPlan
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};