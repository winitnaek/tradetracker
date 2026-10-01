import { NavLink, Outlet } from 'react-router-dom';
import { useCallback,useEffect,useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useTheme } from '../../contexts/ThemeContext';
import api from '../../api/client';
import AddTradeModal from '../trades/AddTradeModal';
import DividendModal from '../dividends/DividendModal';
const links=[['/','grid','Dashboard'],['/trades','arrow-left-right','Trades'],['/dividends','cash-coin','Dividends'],['/providers','bank','Providers'],['/goals','bullseye','Goals'],['/reports','bar-chart','Reports'],['/calendar','calendar3','Calendar'],['/stats','graph-up','Stats'],['/settings','gear','Settings']];
const money=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value||0);

export default function AppLayout(){
 const [addDividend,setAddDividend]=useState(false);
 const {user,logout}=useAuth();const {dark,setDark}=useTheme();const [add,setAdd]=useState(false),[more,setMore]=useState(false),[goal,setGoal]=useState(50);
 const loadGoal=useCallback(()=>api.get('/goals/current').then(response=>setGoal(response.data.data.dailyProfitTarget)).catch(()=>{}),[]);
 useEffect(()=>{loadGoal();window.addEventListener('goals-changed',loadGoal);return()=>window.removeEventListener('goals-changed',loadGoal)},[loadGoal]);
 useEffect(()=>{if(!more)return undefined;const close=event=>{if(event.key==='Escape')setMore(false)};window.addEventListener('keydown',close);return()=>window.removeEventListener('keydown',close)},[more]);
 return <div className={'app-shell'}>
  <aside className={'sidebar'}><div className={'brand'}><span className={'brand-mark'}><i className={'bi bi-graph-up-arrow'}/></span><span className={'brand-copy'}><strong>TradeTracker</strong><small>Track your trades. Measure your progress.</small></span></div>
   <nav>{links.map(([to,icon,label])=><NavLink key={to} to={to} end={to==='/'}><i className={`bi bi-${icon}`}/><span>{label}</span></NavLink>)}</nav>
   <div className={'sidebar-bottom'}><div className={'goal-mini'}><small>DAILY GOAL</small><strong>{money(goal)}</strong><span>Minimum Daily Profit</span><NavLink to={'/goals'}>Edit</NavLink></div><button className={'theme-button'} onClick={()=>setDark(!dark)}><i className={`bi bi-${dark?'sun':'moon'}`}/> {dark?'Light':'Dark'} Mode</button></div>
  </aside>
  <main><header className={'topbar'}><div className={'mobile-brand'}><span><strong>TradeTracker</strong><small>Track your trades. Measure your progress.</small></span></div><div className={'topbar-actions'}><button className={'icon-button'} aria-label={'Notifications'}><i className={'bi bi-bell'}/></button><div className={'avatar'}>{(user?.displayName||user?.email||'U')[0].toUpperCase()}</div><div className={'user-copy'}><strong>{user?.displayName||'Trader'}</strong><button onClick={logout}>Sign out</button></div></div></header><div className={'page-content'}><Outlet context={{openAddTrade:()=>setAdd(true),openAddDividend:()=>setAddDividend(true)}}/></div></main>
  <nav className={'mobile-nav'}>{links.slice(0,2).map(([to,icon,label])=><NavLink key={to} to={to} end={to==='/'}><i className={`bi bi-${icon}`}/>{label}</NavLink>)}<button className={'mobile-add'} onClick={()=>setAdd(true)}><i className={'bi bi-plus-lg'}/><span>Add</span></button><NavLink to={'/goals'}><i className={'bi bi-bullseye'}/>Goals</NavLink><button className={more?'active':''} aria-expanded={more} aria-controls={'mobile-more-menu'} onClick={()=>setMore(!more)}><i className={'bi bi-three-dots'}/>More</button></nav>
  {more&&<><button className={'mobile-more-backdrop'} aria-label={'Close menu'} onClick={()=>setMore(false)}/><section className={'mobile-more-sheet'} id={'mobile-more-menu'} role={'dialog'} aria-modal={'true'} aria-label={'More navigation'}><div className={'mobile-more-handle'}/><header><div className={'avatar'}>{(user?.displayName||user?.email||'U')[0].toUpperCase()}</div><span><strong>{user?.displayName||'Trader'}</strong><small>{user?.email}</small></span><button aria-label={'Close menu'} onClick={()=>setMore(false)}><i className={'bi bi-x-lg'}/></button></header><nav>{links.slice(2).map(([to,icon,label])=><NavLink key={to} to={to} onClick={()=>setMore(false)}><i className={`bi bi-${icon}`}/><span>{label}</span><i className={'bi bi-chevron-right'}/></NavLink>)}</nav><button className={'mobile-signout'} onClick={()=>{setMore(false);logout()}}><i className={'bi bi-box-arrow-right'}/>Sign Out</button></section></>}
  <DividendModal isOpen={addDividend} toggle={()=>setAddDividend(false)} onSaved={()=>setAddDividend(false)}/>
  <AddTradeModal isOpen={add} toggle={()=>setAdd(false)} onSaved={()=>{setAdd(false);window.dispatchEvent(new Event('trades-changed'))}}/>
 </div>;
}
