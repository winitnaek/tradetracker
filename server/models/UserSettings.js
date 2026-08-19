const mongoose = require('mongoose');
const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  darkMode: { type: Boolean, default: false }, lastProvider: { type: String, default: 'Robinhood' },
  defaultDashboardPeriod: { type: String, default: '7D' }
}, { timestamps: true });
module.exports = mongoose.model(
  'UserSettings',
  schema,
  process.env.SETTINGS_COLLECTION || 'usersettings'
);

