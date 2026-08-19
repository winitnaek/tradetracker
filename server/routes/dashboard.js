const router = require('express').Router();
const mongoose = require('mongoose');
const Trade = require('../models/Trade');
const Goal = require('../models/Goal');
const { dateKey, dayBounds } = require('../utils/dates');
function trendStart(period, selected, dayStart) {
  if (period === '7D') return new Date(dayStart.getTime() - 6 * 86400000);
  if (period === '1Y') return new Date(dayStart.getTime() - 364 * 86400000);
  if (period === 'MONTH') return new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth(), 1));
  if (period === '3M') return new Date(Date.UTC(selected.getUTCFullYear(), selected.getUTCMonth() - 3, selected.getUTCDate() + 1));
  return new Date(dayStart.getTime() - 29 * 86400000);
}
function completeTrend(rows, start, end) {
  const totals = new Map(rows.map(row => [row._id, row.profit])); const result = [];
  for (let cursor = new Date(start); cursor <= end; cursor.setUTCDate(cursor.getUTCDate() + 1)) {
    const key = cursor.toISOString().slice(0, 10); result.push({ date: key, profit: totals.get(key) || 0 });
  }
  return result;
}
router.get('/', async (req, res) => {
  const selectedKey = req.query.date || dateKey();
  const period = ['7D', '30D', 'MONTH', '3M', '1Y'].includes(req.query.period) ? req.query.period : '30D';
  const selectedDate = new Date(`${selectedKey}T12:00:00.000Z`); const { start, end } = dayBounds(selectedKey);
  const rangeStart = trendStart(period, selectedDate, start); const userId = mongoose.Types.ObjectId.createFromHexString(req.user.id);
  const [goalDoc, todayTrades, recentTrades, trendRows, totalProfitRows] = await Promise.all([
    Goal.findOne({ userId: req.user.id, effectiveDate: { $lte: end } }).sort({ effectiveDate: -1 }),
    Trade.find({ userId: req.user.id, status: 'CLOSED', sellDate: { $gte: start, $lte: end } }),
    Trade.find({ userId: req.user.id }).sort({ updatedAt: -1 }).limit(6),
    Trade.aggregate([{ $match: { userId, status: 'CLOSED', sellDate: { $gte: rangeStart, $lte: end } } }, { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$sellDate', timezone: 'UTC' } }, profit: { $sum: '$realizedProfit' } } }, { $sort: { _id: 1 } }]),
    Trade.aggregate([{ $match: { userId, status: 'CLOSED' } }, { $group: { _id: null, totalProfit: { $sum: '$realizedProfit' } } }])
  ]);
  const goal = goalDoc?.dailyProfitTarget ?? 50; const profit = todayTrades.reduce((sum, trade) => sum + trade.realizedProfit, 0);
  const providers = Object.values(todayTrades.reduce((map, trade) => { map[trade.provider] ||= { name: trade.provider, value: 0 }; map[trade.provider].value += trade.realizedProfit; return map; }, {})).map(provider => ({ ...provider, chartValue: Math.abs(provider.value) }));
  res.json({ success: true, data: { selectedDate: selectedKey, period, goal, profit, totalProfit: totalProfitRows[0]?.totalProfit || 0, remaining: Math.max(goal - profit, 0), targetPercentage: goal > 0 ? profit / goal * 100 : 0, tradesToday: todayTrades.length, wins: todayTrades.filter(trade => trade.realizedProfit > 0).length, losses: todayTrades.filter(trade => trade.realizedProfit < 0).length, providers, recentTrades, trend: completeTrend(trendRows, rangeStart, end) } });
});
module.exports = router;
