const router=require('express').Router();
const mongoose=require('mongoose');
const Trade=require('../models/Trade');
const objectId=req=>mongoose.Types.ObjectId.createFromHexString(req.user.id);
function match(req,closed=true){const query={userId:objectId(req)};if(closed)query.status='CLOSED';if(req.query.provider)query.provider=req.query.provider;if(req.query.symbol)query.symbol=String(req.query.symbol).toUpperCase();if(req.query.from||req.query.to){query.sellDate={};if(req.query.from)query.sellDate.$gte=new Date(`${req.query.from}T00:00:00.000Z`);if(req.query.to)query.sellDate.$lte=new Date(`${req.query.to}T23:59:59.999Z`)}return query}
router.get('/profit',async(req,res)=>{
 const query=match(req),[summary,daily,providers,symbols]=await Promise.all([
  Trade.aggregate([{$match:query},{$group:{_id:null,totalProfit:{$sum:'$realizedProfit'},totalTrades:{$sum:1},wins:{$sum:{$cond:[{$gt:['$realizedProfit',0]},1,0]}},losses:{$sum:{$cond:[{$lt:['$realizedProfit',0]},1,0]}},averageProfit:{$avg:'$realizedProfit'},largestWin:{$max:'$realizedProfit'},largestLoss:{$min:'$realizedProfit'}}}]),
  Trade.aggregate([{$match:query},{$group:{_id:{$dateToString:{format:'%Y-%m-%d',date:'$sellDate',timezone:'UTC'}},profit:{$sum:'$realizedProfit'},trades:{$sum:1}}},{$sort:{_id:1}}]),
  Trade.aggregate([{$match:query},{$group:{_id:'$provider',profit:{$sum:'$realizedProfit'},trades:{$sum:1}}},{$sort:{profit:-1}}]),
  Trade.aggregate([{$match:query},{$group:{_id:'$symbol',profit:{$sum:'$realizedProfit'},trades:{$sum:1}}},{$sort:{profit:-1}}])
 ]);
 const stats=summary[0]||{totalProfit:0,totalTrades:0,wins:0,losses:0,averageProfit:0,largestWin:0,largestLoss:0};stats.winRate=stats.totalTrades?stats.wins/stats.totalTrades*100:0;
 res.json({success:true,data:{summary:stats,daily:daily.map(x=>({date:x._id,profit:x.profit,trades:x.trades})),providers:providers.map(x=>({name:x._id,profit:x.profit,trades:x.trades})),symbols:symbols.map(x=>({name:x._id,profit:x.profit,trades:x.trades}))}});
});
router.get('/calendar',async(req,res)=>{
 const month=/^\d{4}-\d{2}$/.test(req.query.month||'')?req.query.month:new Date().toISOString().slice(0,7),start=new Date(`${month}-01T00:00:00.000Z`),end=new Date(Date.UTC(start.getUTCFullYear(),start.getUTCMonth()+1,0,23,59,59,999));
 const days=await Trade.aggregate([{$match:{userId:objectId(req),status:'CLOSED',sellDate:{$gte:start,$lte:end}}},{$group:{_id:{$dateToString:{format:'%Y-%m-%d',date:'$sellDate',timezone:'UTC'}},profit:{$sum:'$realizedProfit'},trades:{$push:{_id:'$_id',symbol:'$symbol',provider:'$provider',realizedProfit:'$realizedProfit'}}}},{$sort:{_id:1}}]);
 res.json({success:true,data:days.map(day=>({date:day._id,profit:day.profit,trades:day.trades}))});
});
router.get('/stats',async(req,res)=>{
 const query={userId:objectId(req),status:'CLOSED'},trades=await Trade.find({userId:req.user.id,status:'CLOSED'}).lean();
 const [days,symbols,providers]=await Promise.all([
  Trade.aggregate([{$match:query},{$group:{_id:{$dateToString:{format:'%Y-%m-%d',date:'$sellDate',timezone:'UTC'}},profit:{$sum:'$realizedProfit'}}},{$sort:{profit:-1}}]),
  Trade.aggregate([{$match:query},{$group:{_id:'$symbol',profit:{$sum:'$realizedProfit'},trades:{$sum:1}}},{$sort:{profit:-1}}]),
  Trade.aggregate([{$match:query},{$group:{_id:'$provider',profit:{$sum:'$realizedProfit'}}},{$sort:{profit:-1}}])
 ]);
 const wins=trades.filter(t=>t.realizedProfit>0),losses=trades.filter(t=>t.realizedProfit<0),sum=list=>list.reduce((n,t)=>n+t.realizedProfit,0);
 res.json({success:true,data:{totalProfit:sum(trades),closedTrades:trades.length,wins:wins.length,losses:losses.length,winRate:trades.length?wins.length/trades.length*100:0,averageDailyProfit:days.length?days.reduce((n,d)=>n+d.profit,0)/days.length:0,averageWin:wins.length?sum(wins)/wins.length:0,averageLoss:losses.length?sum(losses)/losses.length:0,largestWin:wins.length?Math.max(...wins.map(t=>t.realizedProfit)):0,largestLoss:losses.length?Math.min(...losses.map(t=>t.realizedProfit)):0,bestDay:days[0]||null,worstDay:days.length?[...days].sort((a,b)=>a.profit-b.profit)[0]:null,mostTradedSymbol:[...symbols].sort((a,b)=>b.trades-a.trades)[0]||null,bestSymbol:symbols[0]||null,bestProvider:providers[0]||null}});
});
module.exports=router;
