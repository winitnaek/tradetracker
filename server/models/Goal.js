const mongoose = require('mongoose');
const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  dailyProfitTarget: { type: Number, default: 50, min: 0 },
  effectiveDate: { type: Date, required: true }
}, { timestamps: true });
goalSchema.index({ userId: 1, effectiveDate: -1 });
module.exports = mongoose.model(
  'Goal',
  goalSchema,
  process.env.GOALS_COLLECTION || 'goals'
);


