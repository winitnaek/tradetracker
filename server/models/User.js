const mongoose = require('mongoose');
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  displayName: { type: String, trim: true },
  authProvider: { type: String, enum: ['google', 'local'], required: true },
  googleId: { type: String, sparse: true, unique: true },
  passwordHash: { type: String, select: false }
}, { timestamps: true });
module.exports = mongoose.model(
  'User',
  userSchema,
  process.env.USERS_COLLECTION || 'users'
);

