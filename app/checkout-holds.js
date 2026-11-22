/* Checkout audit state is independent of ingredient transfers and consumption. */
(() => {
const A=K406,C=A.commerce,B=A.subscriptions,K=A.cakes;
const H=A.checkoutHolds={records:new Map(),current:new Map(),serial:0};
H.get=attempt=>H.records.get(attempt?.hold_id);
H.ensure=o=>{const attempt=o.attempts?.at(-1);if(!attempt)return null;let hold=H.get(attempt);if(hold)return hold;
 const id='CHECKOUT-'+(++H.serial),at=Date.now();hold={id,order_id:o.id,status:'active',created_at:at,expires_at:C.holdUntil(o)||at+C.checkoutHoldMs};H.records.set(id,hold);H.current.set(o.id,hold);
 Object.assign(attempt,{hold_id:id,created_at:attempt.created_at||at,amount:attempt.amount??o.total??o.snapshot?.total,reference:attempt.reference||o.reference||id});return H.get(attempt);
};
H.active=o=>H.get(o.attempts?.at(-1))?.status==='active';
H.retained=(id,deadline)=>H.current.has(id)?H.current.get(id).status==='active':deadline>Date.now();
const cancelCheckedPurchase=purchase=>{
 if(purchase.snapshot)B.cancel(purchase);
 else if(purchase.quotationId)K.cancel(purchase);
 else C.setStatus(purchase,'cancelled');
};
H.refund=(purchase,attempt)=>{
 purchase.paid=true;purchase.paidAt??=new Date().toLocaleString();purchase.status='cancelled';purchase.payment='resolution';
 purchase.refundEligible=true;purchase.reconciliationRequired=false;
 purchase.resolution='Payment was verified, but the purchase remains cancelled. Contact the bakery about a refund handled outside Kitchen406.';
 if(attempt){attempt.state='confirmed';attempt.paid_at??=Date.now();}
 const path=purchase.snapshot?'subscription/payment/':'payment/';
 A.notifications?.emit('refund-eligible-'+purchase.id,'payments','Payment eligible for an external refund',purchase.resolution,path+purchase.id,purchase.customer_id);
};
H.check=(purchase,mode='status',settle)=>{
 if(!purchase||purchase.paid)return false;
 const attempt=purchase.attempts?.at(-1);
 if(!attempt)return false;
 settle??=purchase.snapshot?B.pay:purchase.quotationId?K.pay:C.setPayment;
 const simulated=attempt.verification_outcome||(purchase.payment==='waiting'?'not-paid':'unresolved');
 const verified=simulated==='confirmed'&&!!attempt.reference&&(attempt.verified_reference??attempt.reference)===attempt.reference&&
  (attempt.verified_amount??attempt.amount??purchase.total??purchase.snapshot?.total)===(purchase.total??purchase.snapshot?.total);
 const outcome=simulated==='confirmed'&&!verified?'mismatch':simulated;
 attempt.checked_at=Date.now();attempt.lookup_outcome=outcome;
 if(mode==='expiry')attempt.final_checked_at=attempt.checked_at;
 purchase.paymentCheckMessage='';
 if(verified){
  purchase.reconciliationRequired=false;
  attempt.verified_at??=attempt.checked_at;
  try{settle(purchase,'confirmed');}
  catch(error){
   console.error('Verified payment needs confirmation retry',purchase.id,error);
   if(!purchase.paid){
    purchase.payment='detected';
    purchase.paymentCheckMessage='Payment was verified. Check the same attempt again to complete confirmation.';
   }
  }
  return true;
 }
 const lookupFailed=['lookup-error','mismatch'].includes(outcome);
 if(mode==='expiry'){
  settle(purchase,outcome==='failed'?'failed':'expired');
  purchase.status='cancelled';purchase.checkoutClosed=true;
  purchase.reconciliationRequired=lookupFailed;
  if(lookupFailed){
   purchase.reconciliationRequired=true;purchase.refundIfPaid=true;
   purchase.paymentCheckMessage='Payment could not be verified before the hold ended. The bakery needs to reconcile this attempt. Do not pay again.';
   A.staff?.emit('payment-lookup:'+purchase.id,'payments',purchase.id+' needs payment reconciliation.','owner/orders');
  }
  return true;
 }
 if(lookupFailed){
  purchase.paymentCheckMessage='Payment status could not be verified. Check this attempt again before paying or cancelling.';
  purchase.reconciliationRequired=true;
  if(['waiting','detected'].includes(purchase.payment))settle(purchase,'delayed');
  return true;
 }
 if(['failed','expired','not-paid'].includes(outcome)){
  purchase.reconciliationRequired=false;
  if(outcome==='not-paid'){
   if(['detected','delayed'].includes(purchase.payment))settle(purchase,'waiting');
  }else if(!['failed','expired','cancelled'].includes(purchase.payment))settle(purchase,outcome);
  if(mode==='cancel')cancelCheckedPurchase(purchase);
  return true;
 }
 if(mode==='cancel')purchase.reconciliationRequired=true;
 purchase.paymentCheckMessage='Payment is still unresolved. Check this same attempt again.';
 return true;
};
H.simulate=(purchase,state,settle)=>{
 if(state==='confirmed'&&purchase?.attempts?.length){
  purchase.attempts.at(-1).verification_outcome='confirmed';
  return H.check(purchase,'status',settle);
 }
 return settle(purchase,state);
};
H.advance=(purchase,settle)=>{
 if(!purchase||purchase.paid||purchase.status==='cancelled'||!['waiting','detected','delayed'].includes(purchase.payment))return false;
 const attempt=purchase.attempts?.at(-1),now=Date.now();
 if(now>=C.holdUntil(purchase)){
  if(attempt?.final_checked_at&&attempt.verified_at)return false;
  return H.check(purchase,'expiry',settle);
 }
 if(now>=purchase.deadline&&attempt&&!attempt.qr_closed_at){attempt.qr_closed_at=now;return true;}
 return false;
};
H.finish=(o,state)=>{if(!o)return;const attempt=o.attempts?.at(-1),hold=H.get(attempt);if(!attempt)return;
 if(o.paid){attempt.state='confirmed';attempt.paid_at??=Date.now();if(hold?.status==='active'){hold.status=o.payment==='resolution'?'released':'confirmed';hold[hold.status+'_at']=Date.now();}return;}
 if(['failed','expired','revalidation','cancelled'].includes(state)){if(['waiting','detected','delayed'].includes(attempt.state)||state!=='cancelled')attempt.state=state;if(hold?.status==='active'){hold.status=state==='expired'?'expired':'released';hold[hold.status+'_at']=Date.now();}}
};
for(const [object,name] of [[C,'setPayment'],[B,'pay'],[K,'pay']]){
 const original=object[name];
 object[name]=(o,state)=>{
  if(!o||o.paid)return;
  if(object===C&&o.quotationId)return K.pay(o,state);
  if(state==='confirmed'&&o.refundIfPaid){H.refund(o,o.attempts?.at(-1));return;}
  const result=original(o,state);
  if(o.paid&&o.payment==='resolution')H.refund(o,o.attempts?.at(-1));
  H.finish(o,o.paid?'confirmed':o.payment||state);
  return result;
 };
}
for(const object of [B,K]){const original=object.cancel;object.cancel=o=>{const result=original(o);if(result)H.finish(o,'cancelled');return result;};}
const status=C.setStatus;C.setStatus=(o,next)=>{status(o,next);if(next==='cancelled'&&!o?.paid){o.payment='cancelled';H.finish(o,'cancelled');}};
const change=B.change;B.change=()=>{const p=B.pending(),result=change();if(result&&p&&!p.paid)H.finish(p,p.payment);return result;};
const reset=C.reset;C.reset=()=>{reset();H.records.clear();H.current.clear();H.serial=0;};
setInterval(()=>{
 if(!A.operations)return;
 const orders=A.operations.orders(),purchases=A.operations.purchases();
 let changed=false;
 for(const order of orders)if(H.advance(order,C.setPayment)&&C.currentOrder()===order)changed=true;
 for(const purchase of purchases)if(H.advance(purchase,B.pay)&&B.state.purchases.includes(purchase))changed=true;
 if(changed){C.render();if(B.active())B.render();A.inspector?.();}
},1000);
})();
