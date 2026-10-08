const jwt = require('jsonwebtoken');
const User = require('../models/User');

const generateToken = (id) => jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '30d' });

exports.register = async (req, res) => {
  try {
    console.log('register invoked', req.body);
    const { name, email, password, gender } = req.body;
    const normalizedEmail = email?.toLowerCase();
    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }
    if (await User.findOne({ email: normalizedEmail })) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const user = await User.create({ name, email: normalizedEmail, password, gender });
    res.status(201).json({ _id: user._id, name: user.name, email: user.email, gender: user.gender, token: generateToken(user._id) });
  } catch (err) {
    console.error('auth register error', err.stack || err);
    if (err.code === 11000) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    res.status(500).json({ message: err.message });
    console.log('Registration error:', err);
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = email?.toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ message: 'Invalid email or password' });
    res.json({ _id: user._id, name: user.name, email: user.email, height: user.height, weight: user.weight, gender: user.gender, token: generateToken(user._id) });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getProfile = async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  res.json(user);
};

exports.updateProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { height, weight, name, gender } = req.body;
    if (height) user.height = height;
    if (weight) user.weight = weight;
    if (name) user.name = name;
    if (gender) user.gender = gender;
    await user.save();
    res.json({ _id: user._id, name: user.name, email: user.email, height: user.height, weight: user.weight, gender: user.gender });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};