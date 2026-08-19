const router = require('express').Router();
const Trade = require('../models/Trade');

function cleanTrade(body) {
  return {
    provider: String(body.provider === 'Other' ? body.customProvider : body.provider || '').trim(),
    symbol: String(body.symbol || '').trim().toUpperCase(),
    quantity: body.quantity,
    buyPrice: body.buyPrice,
    buyDate: body.buyDate,
    buyFees: body.buyFees ?? body.fees ?? 0,
    notes: body.notes
  };
}

function applyLifecycle(trade, body) {
  if (!body.isClosed) {
    trade.status = 'OPEN';
    trade.sellPrice = undefined;
    trade.sellDate = undefined;
    trade.sellFees = 0;
    trade.realizedProfit = undefined;
    return;
  }
  if (!body.sellPrice || !body.sellDate) {
    const error = new Error('Sell price and sell date are required for a completed trade.');
    error.status = 400;
    throw error;
  }
  const buyDate = new Date(body.buyDate);
  const sellDate = new Date(body.sellDate);
  if (sellDate < buyDate) {
    const error = new Error('Sell date cannot be before buy date.');
    error.status = 400;
    throw error;
  }
  trade.sellPrice = body.sellPrice;
  trade.sellDate = sellDate;
  trade.sellFees = body.sellFees || 0;
  trade.status = 'CLOSED';
  trade.realizedProfit = (Number(trade.sellPrice) - Number(trade.buyPrice)) * Number(trade.quantity)
    - Number(trade.buyFees || 0) - Number(trade.sellFees || 0);
}

router.get('/', async (req, res) => {
  const query = { userId: req.user.id };
  if (req.query.status) query.status = req.query.status;
  if (req.query.provider) query.provider = req.query.provider;
  if (req.query.symbol) query.symbol = String(req.query.symbol).toUpperCase();
  const trades = await Trade.find(query).sort({ buyDate: -1 });
  res.json({ success: true, data: trades });
});

router.post('/', async (req, res) => {
  const trade = new Trade({ ...cleanTrade(req.body), userId: req.user.id });
  applyLifecycle(trade, req.body);
  await trade.save();
  res.status(201).json({ success: true, data: trade });
});

router.get('/:id', async (req, res) => {
  const trade = await Trade.findOne({ _id: req.params.id, userId: req.user.id });
  if (!trade) return res.status(404).json({ success: false, message: 'Trade not found.' });
  res.json({ success: true, data: trade });
});

router.put('/:id', async (req, res) => {
  const trade = await Trade.findOne({ _id: req.params.id, userId: req.user.id });
  if (!trade) return res.status(404).json({ success: false, message: 'Trade not found.' });
  trade.set(cleanTrade(req.body));
  applyLifecycle(trade, req.body);
  await trade.save();
  res.json({ success: true, data: trade });
});

router.post('/:id/close', async (req, res) => {
  const trade = await Trade.findOne({ _id: req.params.id, userId: req.user.id, status: 'OPEN' });
  if (!trade) return res.status(404).json({ success: false, message: 'Open trade not found.' });
  applyLifecycle(trade, { ...req.body, buyDate: trade.buyDate, isClosed: true });
  await trade.save();
  res.json({ success: true, data: trade });
});

router.delete('/:id', async (req, res) => {
  const trade = await Trade.findOneAndDelete({ _id: req.params.id, userId: req.user.id });
  if (!trade) return res.status(404).json({ success: false, message: 'Trade not found.' });
  res.json({ success: true });
});

module.exports = router;
