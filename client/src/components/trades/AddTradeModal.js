import { useEffect, useState } from 'react';
import { Alert,Button,Col,Form,FormGroup,Input,Label,Modal,ModalBody,ModalFooter,ModalHeader,Row } from 'reactstrap';
import api from '../../api/client';

const providers=['Robinhood','Fidelity','Webull','Charles Schwab','E*TRADE','Interactive Brokers','Merrill Edge','Vanguard','Other'];
const today=()=>new Date().toISOString().slice(0,10);
const dateValue=value=>value ? String(value).slice(0,10) : today();
function fresh(trade){
 const knownProvider=!trade||providers.includes(trade.provider);
 return {
  provider:trade?(knownProvider?trade.provider:'Other'):(localStorage.getItem('tt-provider')||'Robinhood'),
  customProvider:trade&&!knownProvider?trade.provider:'',
  symbol:trade?.symbol||'',quantity:trade?.quantity??'',buyPrice:trade?.buyPrice??'',buyDate:dateValue(trade?.buyDate),buyFees:trade?.buyFees??'0',
  isClosed:trade?trade.status==='CLOSED':true,sellPrice:trade?.sellPrice??'',sellDate:dateValue(trade?.sellDate),sellFees:trade?.sellFees??'0',notes:trade?.notes||''
 };
}

export default function AddTradeModal({isOpen,toggle,onSaved,trade=null}){
 const [form,setForm]=useState(()=>fresh(trade)),[error,setError]=useState(''),[saving,setSaving]=useState(false);
 useEffect(()=>{if(isOpen){setForm(fresh(trade));setError('')}},[isOpen,trade]);
 const set=(key,value)=>setForm(current=>({...current,[key]:value}));
 async function submit(event){
  event.preventDefault();
  if(form.provider==='Other'&&!form.customProvider.trim()){setError('Enter the custom trading provider name.');return}
  if(form.isClosed&&form.sellDate<form.buyDate){setError('Sell date cannot be before buy date.');return}
  setSaving(true);setError('');
  try{
   if(trade)await api.put(`/trades/${trade._id}`,form);else await api.post('/trades',form);
   localStorage.setItem('tt-provider',form.provider);
   onSaved();
  }catch(err){setError(err.message)}finally{setSaving(false)}
 }
 return <Modal isOpen={isOpen} toggle={toggle} centered size={'lg'}><Form onSubmit={submit}>
  <ModalHeader toggle={toggle}>{trade?'Edit trade':'Record a trade'}</ModalHeader><ModalBody>
   {error&&<Alert color={'danger'}>{error}</Alert>}
   <FormGroup tag={'fieldset'}><Label>Trade status</Label><div className={'trade-status-options'}>
    <Label check><Input type={'radio'} name={'tradeStatus'} checked={form.isClosed} onChange={()=>set('isClosed',true)}/><span><strong>Completed trade</strong><small>Record both the buy and sale now; dashboard profit updates immediately.</small></span></Label>
    <Label check><Input type={'radio'} name={'tradeStatus'} checked={!form.isClosed} onChange={()=>set('isClosed',false)}/><span><strong>Open purchase</strong><small>Record the buy now and close it later.</small></span></Label>
   </div></FormGroup>
   <h2 className={'trade-form-heading'}>Buy details</h2><Row>
    <Col md={6}><FormGroup><Label>Trading Provider</Label><Input required type={'select'} value={form.provider} onChange={e=>set('provider',e.target.value)}>{providers.map(p=><option key={p}>{p}</option>)}</Input></FormGroup></Col>
    <Col md={6}><FormGroup><Label>Symbol</Label><Input required autoFocus placeholder={'AAPL'} value={form.symbol} onChange={e=>set('symbol',e.target.value.toUpperCase())}/></FormGroup></Col>
    {form.provider==='Other'&&<Col md={12}><FormGroup><Label>Custom Provider</Label><Input required placeholder={'Provider name'} value={form.customProvider} onChange={e=>set('customProvider',e.target.value)}/></FormGroup></Col>}
    <Col md={6}><FormGroup><Label>Number of Shares</Label><Input required type={'number'} min={0.000001} step={'any'} value={form.quantity} onChange={e=>set('quantity',e.target.value)}/></FormGroup></Col>
    <Col md={6}><FormGroup><Label>Buy Price</Label><Input required type={'number'} min={0.000001} step={'any'} value={form.buyPrice} onChange={e=>set('buyPrice',e.target.value)}/></FormGroup></Col>
    <Col md={6}><FormGroup><Label>Buy Date</Label><Input required type={'date'} value={form.buyDate} onChange={e=>set('buyDate',e.target.value)}/></FormGroup></Col>
    <Col md={6}><FormGroup><Label>Buy Fees</Label><Input required type={'number'} min={0} step={0.01} value={form.buyFees} onChange={e=>set('buyFees',e.target.value)}/></FormGroup></Col>
   </Row>
   {form.isClosed&&<div className={'sale-fields'}><h2 className={'trade-form-heading'}>Sale details</h2><Row>
    <Col md={4}><FormGroup><Label>Sell Price</Label><Input required type={'number'} min={0.000001} step={'any'} value={form.sellPrice} onChange={e=>set('sellPrice',e.target.value)}/></FormGroup></Col>
    <Col md={4}><FormGroup><Label>Sell Date</Label><Input required type={'date'} min={form.buyDate} value={form.sellDate} onChange={e=>set('sellDate',e.target.value)}/></FormGroup></Col>
    <Col md={4}><FormGroup><Label>Sell Fees</Label><Input required type={'number'} min={0} step={0.01} value={form.sellFees} onChange={e=>set('sellFees',e.target.value)}/></FormGroup></Col>
   </Row></div>}
   <FormGroup><Label>Notes <span className={'text-muted'}>(optional)</span></Label><Input type={'textarea'} rows={2} maxLength={1000} value={form.notes} onChange={e=>set('notes',e.target.value)}/></FormGroup>
  </ModalBody><ModalFooter><Button color={'light'} type={'button'} onClick={toggle}>Cancel</Button><Button color={'primary'} disabled={saving}>{saving?'Saving…':(trade?'Save Changes':'Record Trade')}</Button></ModalFooter>
 </Form></Modal>
}
