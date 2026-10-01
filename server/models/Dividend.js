const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  symbol: { type: String, required: true, uppercase: true, trim: true, maxlength: 30 },
  provider: { type: String, required: true, trim: true, maxlength: 100 },
  paymentDate: { type: Date, required: true },
  amount: { type: Number, required: true, min: 0.01 },
  paymentType: { type: String, enum: ['Cash', 'Reinvested'], default: 'Cash' },
  frequency: { type: String, enum: ['Monthly', 'Quarterly', 'Semiannual', 'Annual', 'Irregular'], default: 'Irregular' },
  notes: { type: String, maxlength: 1000, default: '' }
}, { timestamps: true });
schema.index({ userId: 1, paymentDate: -1 });
module.exports = mongoose.model('Dividend', schema, process.env.DIVIDENDS_COLLECTION || 'dividends');
