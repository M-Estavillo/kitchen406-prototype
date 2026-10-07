/* Checkout audit state is independent of ingredient transfers and consumption. */
(() => {
const A=K406,C=A.commerce,B=A.subscriptions,K=A.cakes;
const H=A.checkoutHolds={records:new Map(),serial:0};
H.get=attempt=>{const hold=H.records.get(attempt?.hold_id);if(hold?.status==='active'&&hold.expires_at<=Date.now()){hold.status='expired';hold.expired_at=Date.now();}return hold;};
H.ensure=o=>{const attempt=o.attempts?.at(-1);if(!attempt)return null;let hold=H.get(attempt);if(hold)return hold;
 const id='CHECKOUT-'+(++H.serial),at=Date.now();hold={id,order_id:o.id,status:'active',created_at:at,expires_at:o.deadline||at+600000};H.records.set(id,hold);
 Object.assign(attempt,{hold_id:id,created_at:attempt.created_at||at,amount:attempt.amount??o.total??o.snapshot?.total,reference:attempt.reference||o.reference||id});return H.get(attempt);
};
H.active=o=>H.get(o.attempts?.at(-1))?.status==='active';
H.finish=(o,state)=>{if(!o)return;const attempt=o.attempts?.at(-1),hold=H.get(attempt);if(!attempt)return;
 if(o.paid){attempt.state='confirmed';attempt.paid_at??=Date.now();if(hold?.status==='active'){hold.status=o.payment==='resolution'?'released':'confirmed';hold[hold.status+'_at']=Date.now();}return;}
 if(['failed','expired','revalidation','cancelled'].includes(state)){if(['waiting','detected','delayed'].includes(attempt.state)||state!=='cancelled')attempt.state=state;if(hold?.status==='active'){hold.status=state==='expired'?'expired':'released';hold[hold.status+'_at']=Date.now();}}
};
for(const [object,name] of [[C,'setPayment'],[B,'pay'],[K,'pay']]){const original=object[name];object[name]=(o,state)=>{const result=original(o,state);H.finish(o,o?.paid?'confirmed':o?.payment||state);return result;};}
for(const object of [B,K]){const original=object.cancel;object.cancel=o=>{const result=original(o);if(result)H.finish(o,'cancelled');return result;};}
const status=C.setStatus;C.setStatus=(o,next)=>{status(o,next);if(next==='cancelled'&&!o?.paid){o.payment='cancelled';H.finish(o,'cancelled');}};
const change=B.change;B.change=()=>{const p=B.pending(),result=change();if(result&&p&&!p.paid)H.finish(p,p.payment);return result;};
const reset=C.reset;C.reset=()=>{reset();H.records.clear();H.serial=0;};
})();
