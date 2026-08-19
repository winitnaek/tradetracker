const router=require('express').Router();
const mongoose=require('mongoose');
const Trade=require('../models/Trade');
const userObjectId=req=>mongoose.Types.ObjectId.createFromHexString(req.user.id);
router.get('/',async(req,res)=>{
 const now=new Date(),today=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate())),month=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1));
 const data=await Trade.aggregate([{$match:{userId:userObjectId(req)}},{$group:{_id:'$provider',trades:{$sum:1},closed:{$sum:{$cond:[{$eq:['$status','CLOSED']},1,0]}},wins:{$sum:{$cond:[{$gt:['$realizedProfit',0]},1,0]}},losses:{$sum:{$cond:[{$lt:['$realizedProfit',0]},1,0]}},totalProfit:{$sum:{$ifNull:['$realizedProfit',0]}},todayProfit:{$sum:{$cond:[{$and:[{$eq:['$status','CLOSED']},{$gte:['$sellDate',today]}]},'$realizedProfit',0]}},monthProfit:{$sum:{$cond:[{$and:[{$eq:['$status','CLOSED']},{$gte:['$sellDate',month]}]},'$realizedProfit',0]}}}},{$sort:{totalProfit:-1}}]);
 res.json({success:true,data:data.map(item=>({provider:item._id,...item,winRate:item.closed?item.wins/item.closed*100:0}))});
});
router.get('/:providerName',async(req,res)=>{
 const provider=req.params.providerName,userId=userObjectId(req),now=new Date(),today=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),now.getUTCDate())),week=new Date(today.getTime()-6*86400000),month=new Date(Date.UTC(now.getUTCFullYear(),now.getUTCMonth(),1));
 const [trades,summary,trend]=await Promise.all([
  Trade.find({userId:req.user.id,provider}).sort({buyDate:-1}).limit(20),
  Trade.aggregate([{$match:{userId,provider,status:'CLOSED'}},{$group:{_id:null,totalProfit:{$sum:'$realizedProfit'},closed:{$sum:1},wins:{$sum:{$cond:[{$gt:['$realizedProfit',0]},1,0]}},losses:{$sum:{$cond:[{$lt:['$realizedProfit',0]},1,0]}},averageProfit:{$avg:'$realizedProfit'},todayProfit:{$sum:{$cond:[{$gte:['$sellDate',today]},'$realizedProfit',0]}},weekProfit:{$sum:{$cond:[{$gte:['$sellDate',week]},'$realizedProfit',0]}},monthProfit:{$sum:{$cond:[{$gte:['$sellDate',month]},'$realizedProfit',0]}}}}]),
  Trade.aggregate([{$match:{userId,provider,status:'CLOSED',sellDate:{$gte:new Date(today.getTime()-29*86400000)}}},{$group:{_id:{$dateToString:{format:'%Y-%m-%d',date:'$sellDate',timezone:'UTC'}},profit:{$sum:'$realizedProfit'}}},{$sort:{_id:1}}])
 ]);
 if(!trades.length)return res.status(404).json({success:false,message:'Provider not found.'});
 const stats=summary[0]||{totalProfit:0,closed:0,wins:0,losses:0,averageProfit:0,todayProfit:0,weekProfit:0,monthProfit:0};
 res.json({success:true,data:{provider,stats:{...stats,winRate:stats.closed?stats.wins/stats.closed*100:0},trades,trend:trend.map(row=>({date:row._id,profit:row.profit}))}});
});
module.exports=router;
