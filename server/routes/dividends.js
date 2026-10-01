const router = require('express').Router();
const mongoose = require('mongoose');
const Dividend = require('../models/Dividend');
const { dateKey } = require('../utils/dates');
const { validDate, summarize } = require('../utils/dividends');
const asyncRoute = handler => (req, res, next) => Promise.resolve(handler(req, res)).catch(next);
const badRequest = message => { const error = new Error(message); error.status = 400; throw error; };

function clean(body) {
  if (!validDate(body.paymentDate)) badRequest('Enter a valid payment date.');
  if (body.paymentDate > dateKey()) badRequest('Only received dividends can be recorded. Payment date cannot be in the future.');
  if (!['string', 'number'].includes(typeof body.amount) || !/^\d+(\.\d{1,2})?$/.test(String(body.amount)) || !Number.isFinite(Number(body.amount)) || Number(body.amount) < 0.01 || Number(body.amount) > Number.MAX_SAFE_INTEGER / 100) badRequest('Enter a positive amount with no more than two decimal places.');
  if (typeof body.symbol !== 'string' || !body.symbol.trim() || body.symbol.trim().length > 30) badRequest('Enter a symbol (up to 30 characters).');
  if (typeof body.provider !== 'string' || !body.provider.trim() || body.provider.trim().length > 100) badRequest('Enter a provider (up to 100 characters).');
  return { symbol: body.symbol.trim().toUpperCase(), provider: body.provider.trim(), paymentDate: `${body.paymentDate}T00:00:00.000Z`, amount: Number(body.amount), paymentType: body.paymentType || 'Cash', frequency: body.frequency || 'Irregular', notes: body.notes || '' };
}
router.get('/', asyncRoute(async (req, res) => {
  const query = { userId: req.user.id };
  if (req.query.provider) query.provider = req.query.provider;
  if (req.query.symbol) query.symbol = String(req.query.symbol).trim().toUpperCase();
  if (req.query.from || req.query.to) {
    query.paymentDate = {};
    if (req.query.from) { if (!validDate(req.query.from)) badRequest('Invalid start date.'); query.paymentDate.$gte = new Date(`${req.query.from}T00:00:00.000Z`); }
    if (req.query.to) { if (!validDate(req.query.to)) badRequest('Invalid end date.'); query.paymentDate.$lte = new Date(`${req.query.to}T23:59:59.999Z`); }
    if (req.query.from && req.query.to && req.query.from > req.query.to) badRequest('Start date must be before end date.');
  }
  res.json({ success: true, data: await Dividend.find(query).sort({ paymentDate: -1, createdAt: -1 }).lean() });
}));
router.get('/summary', asyncRoute(async (req, res) => {
  const date = req.query.date || dateKey();
  if (!validDate(date)) badRequest('Invalid reporting date.');
  const payments = await Dividend.find({ userId: req.user.id }).lean();
  res.json({ success: true, data: { ...summarize(payments, date), recentPayments: [...payments].sort((a, b) => b.paymentDate - a.paymentDate).slice(0, 5) } });
}));
router.post('/', asyncRoute(async (req, res) => {
  const dividend = await Dividend.create({ ...clean(req.body), userId: req.user.id });
  res.status(201).json({ success: true, data: dividend });
}));
router.param('id', (req, res, next, id) => {
  if (!mongoose.isObjectIdOrHexString(id)) return res.status(400).json({ success: false, message: 'Invalid dividend ID.' });
  next();
});
router.put('/:id', asyncRoute(async (req, res) => {
  const dividend = await Dividend.findOne({ _id: req.params.id, userId: req.user.id });
  if (!dividend) return res.status(404).json({ success: false, message: 'Dividend not found.' });
  dividend.set(clean(req.body));
  await dividend.save();
  res.json({ success: true, data: dividend });
}));
router.delete('/:id', asyncRoute(async (req, res) => {
  const dividend = await Dividend.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!dividend) return res.status(404).json({ success: false, message: 'Dividend not found.' });
  res.json({ success: true });
}));
module.exports = router;
