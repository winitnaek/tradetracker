const router=require('express').Router();
const UserSettings=require('../models/UserSettings');
router.get('/',async(req,res)=>{const settings=await UserSettings.findOneAndUpdate({userId:req.user.id},{$setOnInsert:{darkMode:false,lastProvider:'Robinhood',defaultDashboardPeriod:'30D'}},{upsert:true,new:true});res.json({success:true,data:settings})});
router.put('/',async(req,res)=>{const allowed={};if(typeof req.body.darkMode==='boolean')allowed.darkMode=req.body.darkMode;if(['7D','30D','MONTH','3M','1Y'].includes(req.body.defaultDashboardPeriod))allowed.defaultDashboardPeriod=req.body.defaultDashboardPeriod;if(req.body.lastProvider)allowed.lastProvider=String(req.body.lastProvider).trim();const settings=await UserSettings.findOneAndUpdate({userId:req.user.id},{$set:allowed},{upsert:true,new:true,runValidators:true});res.json({success:true,data:settings})});
module.exports=router;
