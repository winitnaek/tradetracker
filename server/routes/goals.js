const router = require('express').Router();
const Goal = require('../models/Goal');
router.get('/current', async (req, res) => {
  let goal = await Goal.findOne({ userId: req.user.id, effectiveDate: { $lte: new Date() } }).sort({ effectiveDate: -1 });
  if (!goal) goal = await Goal.create({ userId: req.user.id, dailyProfitTarget: 50, effectiveDate: new Date() });
  res.json({ success: true, data: goal });
});
router.get('/history', async (req, res) => res.json({ success: true, data: await Goal.find({ userId: req.user.id }).sort({ effectiveDate: -1 }) }));
router.post('/', async (req, res) => {
  const goal = await Goal.create({ userId: req.user.id, dailyProfitTarget: req.body.dailyProfitTarget, effectiveDate: req.body.effectiveDate || new Date() });
  res.status(201).json({ success: true, data: goal });
});
module.exports = router;

