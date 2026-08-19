import { useCallback,useEffect,useMemo,useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../api/client';
import { TradeRows } from './Dashboard';
import AddTradeModal from '../components/trades/AddTradeModal';
import CloseTradeModal from '../components/trades/CloseTradeModal';
import ViewTradeModal from '../components/trades/ViewTradeModal';

export default function Trades(){
 const {openAddTrade}=useOutletContext();
 const [trades,setTrades]=useState([]),[tab,setTab]=useState('All'),[search,setSearch]=useState('');
 const [closing,setClosing]=useState(null),[editing,setEditing]=useState(null),[viewing,setViewing]=useState(null),[error,setError]=useState('');
 const load=useCallback(()=>api.get('/trades').then(r=>setTrades(r.data.data)).catch(err=>setError(err.message)),[]);
 useEffect(()=>{load();window.addEventListener('trades-changed',load);return()=>window.removeEventListener('trades-changed',load)},[load]);
 const changed=()=>{load();window.dispatchEvent(new Event('trades-changed'))};
 const filtered=useMemo(()=>trades.filter(trade=>{const term=search.toLowerCase();const matches=!term||trade.symbol.toLowerCase().includes(term)||trade.provider.toLowerCase().includes(term);return matches&&(tab==='All'||tab==='Open'&&trade.status==='OPEN'||tab==='Closed'&&trade.status==='CLOSED'||tab==='Winning'&&trade.realizedProfit>0||tab==='Losing'&&trade.realizedProfit<0)}),[trades,search,tab]);
 async function remove(id){if(!window.confirm('Delete this trade? This cannot be undone.'))return;setError('');try{await api.delete(`/trades/${id}`);changed()}catch(err){setError(err.message)}}
 return <>
  <div className={'page-heading'}><div><h1>Trades</h1><p>Record and review your manual trades</p></div><button className={'btn btn-primary'} onClick={openAddTrade}>+ Add Trade</button></div>
  {error&&<div className={'alert alert-danger'}>{error}</div>}
  <section className={'card-panel'}><div className={'trade-tools'}><div className={'search'}><i className={'bi bi-search'}/><input placeholder={'Search symbol or provider'} value={search} onChange={e=>setSearch(e.target.value)}/></div><div className={'tabs'}>{['All','Open','Closed','Winning','Losing'].map(item=><button className={tab===item?'active':''} onClick={()=>setTab(item)} key={item}>{item}</button>)}</div></div>
   <TradeRows trades={filtered} actions={trade=><>
    <button className={'btn btn-sm btn-outline-secondary'} onClick={()=>setViewing(trade)} aria-label={'View trade'}><i className={'bi bi-eye'}/></button>
    <button className={'btn btn-sm btn-outline-primary'} onClick={()=>setEditing(trade)} aria-label={'Edit trade'}><i className={'bi bi-pencil'}/></button>
    {trade.status==='OPEN'&&<button className={'btn btn-sm btn-success'} onClick={()=>setClosing(trade)}>Close</button>}
    <button className={'btn btn-sm btn-outline-danger'} onClick={()=>remove(trade._id)} aria-label={'Delete trade'}><i className={'bi bi-trash'}/></button>
   </>}/>
  </section>
  {closing&&<CloseTradeModal trade={closing} toggle={()=>setClosing(null)} onSaved={()=>{setClosing(null);changed()}}/>}
  {editing&&<AddTradeModal isOpen trade={editing} toggle={()=>setEditing(null)} onSaved={()=>{setEditing(null);changed()}}/>}
  {viewing&&<ViewTradeModal trade={viewing} toggle={()=>setViewing(null)} onEdit={trade=>{setViewing(null);setEditing(trade)}}/>}
 </>;
}
