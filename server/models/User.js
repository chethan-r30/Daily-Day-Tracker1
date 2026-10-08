const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true, minlength: 6 },
  height: { type: Number },
  weight: { type: Number },
  gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' }  // ← ADD THIS
}, { timestamps: true });

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return;
  try {
    this.password = await bcrypt.hash(this.password, 12);
  } catch (error) {
    throw new Error(`Password hashing failed: ${error.message}`);
  }
});

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);