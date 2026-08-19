import { Button, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
const money=value=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(value||0);
const date=value=>value?new Date(value).toLocaleDateString():'—';
export default function ViewTradeModal({trade,toggle,onEdit}){
 if(!trade)return null;
 const rows=[
  ['Provider',trade.provider],['Symbol',trade.symbol],['Status',trade.status],['Shares',trade.quantity],
  ['Buy Price',money(trade.buyPrice)],['Buy Date',date(trade.buyDate)],['Buy Fees',money(trade.buyFees)],
  ['Sell Price',trade.status==='CLOSED'?money(trade.sellPrice):'—'],['Sell Date',date(trade.sellDate)],['Sell Fees',trade.status==='CLOSED'?money(trade.sellFees):'—'],
  ['Realized Profit',trade.status==='CLOSED'?money(trade.realizedProfit):'Open']
 ];
 return <Modal isOpen toggle={toggle} centered><ModalHeader toggle={toggle}>{trade.symbol} trade</ModalHeader><ModalBody>
  <dl className={'trade-details'}>{rows.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
  {trade.notes&&<div className={'trade-notes'}><strong>Notes</strong><p>{trade.notes}</p></div>}
 </ModalBody><ModalFooter><Button color={'light'} onClick={toggle}>Close</Button><Button color={'primary'} onClick={()=>onEdit(trade)}>Edit Trade</Button></ModalFooter></Modal>
}
