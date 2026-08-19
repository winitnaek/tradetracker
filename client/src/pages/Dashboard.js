import { useCallback,useEffect,useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { PieChart,Pie,Cell,ResponsiveContainer,LineChart,Line,XAxis,YAxis,Tooltip,ReferenceLine,CartesianGrid } from 'recharts';
import api from '../api/client';
const money=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value||0);
const COLORS=['#6457e6','#20b486','#f59e0b','#3b82f6','#ef476f'];
const today=()=>{const now=new Date();return `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`};
const periodLabels={ '7D':'7 Days','30D':'30 Days',MONTH:'This Month','3M':'3 Months','1Y':'1 Year' };

export default function Dashboard(){
 const {openAddTrade}=useOutletContext();const [data,setData]=useState(null),[error,setError]=useState('');
 const [selectedDate,setSelectedDate]=useState(today),[period,setPeriod]=useState(()=>localStorage.getItem('tp-dashboard-period')||'30D');
 const load=useCallback(()=>{setError('');return api.get('/dashboard',{params:{date:selectedDate,period}}).then(r=>setData(r.data.data)).catch(err=>setError(err.message))},[selectedDate,period]);
 useEffect(()=>{load();window.addEventListener('trades-changed',load);window.addEventListener('goals-changed',load);return()=>{window.removeEventListener('trades-changed',load);window.removeEventListener('goals-changed',load)}},[load]);
 if(error)return <div className={'alert alert-danger'}>{error}</div>;
 if(!data)return <div className={'loading'}><span className={'spinner-border'}/> Loading your dashboard…</div>;
 const currentDay=selectedDate===today();
 const cards=[
  [currentDay?'TODAY’S PROFIT':'SELECTED DAY PROFIT',money(data.profit),`Target: ${money(data.goal)}`,'profit'],
  ['REMAINING TO TARGET',money(data.remaining),data.remaining===0?'Target Reached! 🎉':`${money(data.remaining)} Remaining`,'remaining'],
  ['TARGET ACHIEVED',`${data.targetPercentage.toFixed(2)}%`,'Daily Goal Progress','achieved'],
  [currentDay?'TRADES TODAY':'TRADES THAT DAY',data.tradesToday,`${data.wins} Wins / ${data.losses} Loss`,'trades']
 ];
 return <>
  <div className={'page-heading'}><div><h1>Dashboard</h1><p>Track your trades and daily profit goals</p></div><div className={'dashboard-actions'}><InputDate value={selectedDate} max={today()} onChange={setSelectedDate}/><button className={'btn btn-primary'} onClick={openAddTrade}><i className={'bi bi-plus-lg'}/> Add Trade</button></div></div>
  {data.recentTrades.length===0&&<section className={'welcome-card'}><div className={'welcome-icon'}><i className={'bi bi-graph-up-arrow'}/></div><div><h2>Welcome to TradeTracker</h2><p>Your daily goal is {money(data.goal)}. Start by recording your first trade.</p></div><button className={'btn btn-primary'} onClick={openAddTrade}>+ Add Trade</button></section>}
  <div className={'kpi-grid'}>{cards.map(([label,value,sub,type])=><article className={`card-panel kpi ${type}`} key={label}><small>{label}</small><strong>{value}</strong><span>{sub}</span></article>)}</div>
  <div className={'dashboard-grid'}>
   <article className={'card-panel trend-card'}><div className={'card-title'}><h2>Daily Profit Trend</h2><select aria-label={'Chart period'} value={period} onChange={event=>setPeriod(event.target.value)}>{Object.entries(periodLabels).map(([value,label])=><option value={value} key={value}>{label}</option>)}</select></div><div className={'chart'}><ResponsiveContainer><LineChart data={data.trend}><CartesianGrid strokeDasharray={'3 3'} vertical={false}/><XAxis dataKey={'date'} tickFormatter={value=>value.slice(5)}/><YAxis tickFormatter={value=>`$${value}`}/><Tooltip formatter={value=>money(value)}/><ReferenceLine y={data.goal} stroke={'#f59e0b'} strokeDasharray={'5 4'} label={`Goal $${data.goal}`}/><Line type={'monotone'} dataKey={'profit'} stroke={'#6457e6'} strokeWidth={3} dot={{r:3}}/></LineChart></ResponsiveContainer></div></article>
   <article className={'card-panel provider-chart'}><h2>Profit Provider (Today)</h2>{data.providers.length?<><div className={'donut'}><ResponsiveContainer><PieChart><Pie data={data.providers} dataKey={'chartValue'} nameKey={'name'} innerRadius={58} outerRadius={82}>{data.providers.map((provider,index)=><Cell key={provider.name} fill={COLORS[index%COLORS.length]}/>)}</Pie></PieChart></ResponsiveContainer><div><strong>{money(data.profit)}</strong><span>Total</span></div></div><div className={'legend'}>{data.providers.map((provider,index)=><div key={provider.name}><i style={{background:COLORS[index%COLORS.length]}}/><span>{provider.name}</span><strong className={provider.value>=0?'positive':'negative'}>{money(provider.value)}</strong></div>)}</div></>:<div className={'empty-mini'}>Closed trades will appear here.</div>}</article>
  </div>
  <div className={'bottom-grid'}><article className={'card-panel recent'}><div className={'card-title'}><h2>Recent Trades</h2><a href={'/trades'}>View All Trades</a></div><TradeRows trades={data.recentTrades}/></article><article className={'card-panel summary'}><h2>Today’s Summary</h2>{[['Today’s Profit',money(data.profit)],['Target',money(data.goal)],['Remaining',money(data.remaining)],['Target Achieved',`${data.targetPercentage.toFixed(2)}%`],['Status',data.remaining===0?'🎉 Goal Reached!':'In Progress']].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</article></div>
 </>;
}

function InputDate({value,max,onChange}){return <label className={'dashboard-date'}><i className={'bi bi-calendar3'}/><input type={'date'} value={value} max={max} onChange={event=>onChange(event.target.value)}/></label>}
export function TradeRows({trades,actions}){if(!trades.length)return <div className={'empty-mini'}>No trades yet.</div>;return <div className={'trade-list'}><div className={'trade-row trade-header'}><span>Date</span><span>Provider</span><span>Symbol</span><span>Status</span><span>Shares</span><span>Buy Price</span><span>Sell Price</span><span>Profit / Loss</span>{actions&&<span>Actions</span>}</div>{trades.map(trade=><div className={'trade-row'} key={trade._id}><span data-label={'Date'}>{new Date(trade.buyDate).toLocaleDateString()}</span><span data-label={'Provider'}>{trade.provider}</span><strong data-label={'Symbol'}>{trade.symbol}</strong><span data-label={'Status'}><em className={`status ${trade.status.toLowerCase()}`}>{trade.status}</em></span><span data-label={'Shares'}>{trade.quantity}</span><span data-label={'Buy Price'}>{money(trade.buyPrice)}</span><span data-label={'Sell Price'}>{trade.sellPrice?money(trade.sellPrice):'—'}</span><strong data-label={'Profit / Loss'} className={(trade.realizedProfit||0)>=0?'positive':'negative'}>{trade.status==='CLOSED'?money(trade.realizedProfit):'Open'}</strong>{actions&&<span className={'row-actions'}>{actions(trade)}</span>}</div>)}</div>}
