const mongoose = require('mongoose');
const tradeSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  provider: { type: String, required: true, trim: true },
  symbol: { type: String, required: true, uppercase: true, trim: true },
  quantity: { type: Number, required: true, min: 0.000001 },
  buyPrice: { type: Number, required: true, min: 0.000001 },
  buyDate: { type: Date, required: true }, sellPrice: { type: Number, min: 0.000001 }, sellDate: Date,
  buyFees: { type: Number, default: 0, min: 0 }, sellFees: { type: Number, default: 0, min: 0 },
  realizedProfit: Number, status: { type: String, enum: ['OPEN', 'CLOSED'], default: 'OPEN', index: true },
  notes: { type: String, maxlength: 1000 }
}, { timestamps: true });
tradeSchema.index({ userId: 1, sellDate: -1 });
module.exports = mongoose.model(
  'Trade',
  tradeSchema,
  process.env.TRADES_COLLECTION || 'trades'
);

