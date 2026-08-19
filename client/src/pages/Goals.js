import { useEffect,useState } from 'react';
import api from '../api/client';
export default function Goals(){
 const [goal,setGoal]=useState(50),[history,setHistory]=useState([]),[saved,setSaved]=useState(false),[error,setError]=useState('');
 const load=()=>Promise.all([api.get('/goals/current'),api.get('/goals/history')]).then(([current,all])=>{setGoal(current.data.data.dailyProfitTarget);setHistory(all.data.data)});
 useEffect(()=>{load().catch(err=>setError(err.message))},[]);
 async function save(event){event.preventDefault();setError('');try{await api.post('/goals',{dailyProfitTarget:Number(goal),effectiveDate:new Date()});setSaved(true);await load();window.dispatchEvent(new Event('goals-changed'))}catch(err){setError(err.message)}}
 return <><div className={'page-heading'}><div><h1>Goals</h1><p>Set the daily realized-profit target you want to track</p></div></div>{error&&<div className={'alert alert-danger'}>{error}</div>}<div className={'goals-grid'}>
  <form className={'card-panel goal-editor'} onSubmit={save}><div className={'goal-icon'}><i className={'bi bi-bullseye'}/></div><h2>Daily Profit Goal</h2><p>This is a tracking target, not a guarantee.</p><label>Goal amount</label><div className={'money-input'}><span>$</span><input required type={'number'} min={0} step={0.01} value={goal} onChange={event=>{setGoal(event.target.value);setSaved(false)}}/></div><button className={'btn btn-primary'}>Save New Goal</button>{saved&&<span className={'saved'}>Goal saved</span>}</form>
  <section className={'card-panel'}><h2>Goal History</h2><div className={'history-list'}>{history.map((item,index)=><div key={item._id}><span>{new Date(item.effectiveDate).toLocaleDateString()} {index===0&&<em>Current</em>}</span><strong>$ {Number(item.dailyProfitTarget).toFixed(2)}</strong></div>)}</div></section>
 </div></>;
}
