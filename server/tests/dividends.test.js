const { test } = require('node:test');
const assert = require('node:assert/strict');
const { validDate, summarize } = require('../utils/dividends');
const Dividend = require('../models/Dividend');

test('calendar dates reject rollover, timestamps, and invalid leap days', () => {
  assert.equal(validDate('2026-02-29'), false);
  assert.equal(validDate('2024-02-29'), true);
  assert.equal(validDate('2026-04-31'), false);
  assert.equal(validDate('2026-10-01T00:00:00Z'), false);
});
test('income uses payment dates, sums cents, and counts reinvestments once', () => {
  const payments = [
    { paymentDate: '2025-12-31', amount: 20, paymentType: 'Cash' },
    { paymentDate: '2026-01-01', amount: 0.1, paymentType: 'Cash' },
    { paymentDate: '2026-01-31', amount: 0.2, paymentType: 'Reinvested' },
    { paymentDate: '2026-04-01', amount: 40, paymentType: 'Reinvested' }
  ];
  const summary = summarize(payments, '2026-01-15');
  assert.equal(summary.total, 60.3);
  assert.equal(summary.month, 0.3);
  assert.equal(summary.quarter, 0.3);
  assert.equal(summary.year, 40.3);
  assert.equal(summary.cash, 20.1);
  assert.equal(summary.reinvested, 40.2);
  assert.equal(summary.monthly[3].amount, 40);
  assert.equal(summary.quarterly[1].amount, 40);
  payments[1].amount = 5;
  assert.equal(summarize(payments, '2026-01-15').total, 65.2);
  payments.splice(1, 1);
  assert.equal(summarize(payments, '2026-01-15').total, 60.2);
  assert.equal(summarize([], '2026-01-15').total, 0);
});
test('dividend API scopes CRUD to the current user and validates received payments', async () => {
  const express = require('express');
  const app = express();app.use(express.json());
  app.use((req,res,next)=>{req.user={id:req.headers['x-test-user']||'111111111111111111111111'};next();});
  app.use('/dividends', require('../routes/dividends'));
  app.use('/dashboard', require('../routes/dashboard'));
  app.use((error,req,res,next)=>res.status(error.status||400).json({message:error.message}));
  const originals = {};
  let records = [];
  const scoped = (record, query) => record.userId.toString() === query.userId && (!query._id || record._id.toString() === query._id);
  const overrides = {
    create: async value => {const doc=new Dividend(value);await doc.validate();records.push(doc);return doc;},
    findOne: async query => {const doc=records.find(r=>scoped(r,query));if(doc)doc.save=async()=>{await doc.validate();return doc;};return doc;},
    findOneAndDelete: async query => {const i=records.findIndex(r=>scoped(r,query));return i<0?null:records.splice(i,1)[0];},
    find: query => ({sort:()=>({lean:async()=>records.filter(r=>scoped(r,query))}),lean:async()=>records.filter(r=>scoped(r,query))}),
    aggregate: async pipeline => [{total:records.filter(r=>r.userId.toString()===pipeline[0].$match.userId.toString()).reduce((n,r)=>n+r.amount,0)}]
  };
  for (const [key,value] of Object.entries(overrides)){originals[key]=Dividend[key];Dividend[key]=value;}
  const Trade=require('../models/Trade'),Goal=require('../models/Goal');
  const oldTradeFind=Trade.find,oldTradeAggregate=Trade.aggregate,oldGoalFind=Goal.findOne;
  Trade.find=query=>query.sellDate?Promise.resolve([]):{sort:()=>({limit:async()=>[]})};
  Trade.aggregate=async pipeline=>pipeline[1].$group.totalProfit?[{totalProfit:100}]:[];
  Goal.findOne=()=>({sort:async()=>({dailyProfitTarget:50})});
  const server=app.listen(0,'127.0.0.1');await new Promise(resolve=>server.once('listening',resolve));
  const url=`http://127.0.0.1:${server.address().port}/dividends`;
  const request=(path='',method='GET',body,user)=>fetch(url+path,{method,headers:{'Content-Type':'application/json',...(user?{'x-test-user':user}:{})},...(body?{body:JSON.stringify(body)}:{})});
  const payment={symbol:'schd',provider:'Fidelity',paymentDate:'2026-01-01',amount:'10.50',paymentType:'Reinvested',frequency:'Quarterly'};
  const dashboard=async()=> (await (await fetch(`http://127.0.0.1:${server.address().port}/dashboard?date=2026-01-01`)).json()).data;
  try {
    const created=await request('','POST',payment);assert.equal(created.status,201);
    const id=(await created.json()).data._id;
    assert.equal((await dashboard()).totalProfit,110.5);
    assert.equal((await request('/'+id,'PUT',{...payment,amount:'25.25'})).status,200);
    const updated=await dashboard();
    assert.equal(updated.totalProfit,125.25);
    assert.equal(updated.tradingProfit,100);
    assert.equal(updated.dividendProfit,25.25);
    assert.equal(updated.profit,0);
    assert.equal(updated.remaining,50);
    assert.equal(updated.tradesToday,0);
    assert.equal((await (await request('/summary?date=2026-01-01')).json()).data.total,25.25);
    const other='222222222222222222222222';
    assert.equal((await request('/'+id,'PUT',payment,other)).status,404);
    assert.equal((await request('/'+id,'DELETE',null,other)).status,404);
    assert.deepEqual((await (await request('','GET',null,other)).json()).data,[]);
    assert.equal((await request('','POST',{...payment,paymentDate:'2099-01-01'})).status,400);
    assert.equal((await request('','POST',{...payment,paymentDate:'2026-02-30'})).status,400);
    assert.equal((await request('','POST',{...payment,amount:'0'})).status,400);
    assert.equal((await request('','POST',{...payment,amount:'10.001'})).status,400);
    assert.equal((await request('','POST',{...payment,paymentType:'invalid'})).status,400);
    assert.equal((await request('/bad-id','DELETE')).status,400);
    assert.equal((await request('/'+id,'DELETE')).status,200);
    assert.equal((await dashboard()).totalProfit,100);
    assert.equal((await (await request('/summary')).json()).data.total,0);
  } finally {for(const [key,value]of Object.entries(originals))Dividend[key]=value;Trade.find=oldTradeFind;Trade.aggregate=oldTradeAggregate;Goal.findOne=oldGoalFind;await new Promise(resolve=>server.close(resolve));}
});
