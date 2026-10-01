import { useEffect, useState } from 'react';
import { Alert, Button, Form, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import api from '../../api/client';
export const today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
const fresh = payment => ({ symbol: payment?.symbol || '', provider: payment?.provider || '', paymentDate: payment?.paymentDate?.slice(0,10) || today(), amount: payment?.amount ?? '', paymentType: payment?.paymentType || 'Cash', frequency: payment?.frequency || 'Irregular', notes: payment?.notes || '' });
export default function DividendModal({ isOpen, toggle, onSaved, payment }) {
  const [form,setForm]=useState(fresh(payment)), [error,setError]=useState(''), [saving,setSaving]=useState(false);
  useEffect(()=>{if(isOpen){setForm(fresh(payment));setError('');}},[isOpen,payment]);
  const set=(key,value)=>setForm(current=>({...current,[key]:value}));
  async function submit(event) {
    event.preventDefault();setSaving(true);setError('');
    try { if(payment) await api.put(`/dividends/${payment._id}`,form); else await api.post('/dividends',form); window.dispatchEvent(new Event('dividends-changed'));onSaved(); }
    catch(err){setError(err.message);}finally{setSaving(false);}
  }
  return <Modal isOpen={isOpen} toggle={saving?undefined:toggle} centered><Form onSubmit={submit}><ModalHeader toggle={saving?undefined:toggle}>{payment?'Edit Dividend':'Add Dividend'}</ModalHeader><ModalBody>
    <p className="text-muted">Record received income. Cash and reinvested dividends count toward total profit.</p>
    {error&&<Alert color="danger">{error}</Alert>}
    <FormGroup><Label for="div-symbol">Symbol</Label><Input id="div-symbol" required autoFocus maxLength={30} value={form.symbol} placeholder="SCHD" onChange={e=>set('symbol',e.target.value.toUpperCase())}/></FormGroup>
    <FormGroup><Label for="div-provider">Provider / Account</Label><Input id="div-provider" required maxLength={100} value={form.provider} placeholder="Fidelity" onChange={e=>set('provider',e.target.value)}/></FormGroup>
    <div className="dividend-form-grid"><FormGroup><Label for="div-date">Payment date</Label><Input id="div-date" required type="date" max={today()} value={form.paymentDate} onChange={e=>set('paymentDate',e.target.value)}/></FormGroup><FormGroup><Label for="div-amount">Amount received ($)</Label><Input id="div-amount" required type="number" min="0.01" step="0.01" value={form.amount} onChange={e=>set('amount',e.target.value)}/></FormGroup></div>
    <div className="dividend-form-grid"><FormGroup><Label for="div-type">Payment type</Label><Input id="div-type" type="select" value={form.paymentType} onChange={e=>set('paymentType',e.target.value)}><option>Cash</option><option>Reinvested</option></Input></FormGroup><FormGroup><Label for="div-frequency">Payment frequency</Label><Input id="div-frequency" type="select" value={form.frequency} onChange={e=>set('frequency',e.target.value)}>{['Irregular','Monthly','Quarterly','Semiannual','Annual'].map(f=><option key={f}>{f}</option>)}</Input></FormGroup></div>
    <FormGroup><Label for="div-notes">Notes (optional)</Label><Input id="div-notes" type="textarea" maxLength={1000} value={form.notes} onChange={e=>set('notes',e.target.value)}/></FormGroup><small className="text-muted">Frequency describes the payment schedule; it does not create payments. Record reinvestment purchases separately.</small>
  </ModalBody><ModalFooter><Button type="button" color="light" disabled={saving} onClick={toggle}>Cancel</Button><Button type="submit" color="primary" disabled={saving}>{saving?'Saving…':'Save Dividend'}</Button></ModalFooter></Form></Modal>;
}
