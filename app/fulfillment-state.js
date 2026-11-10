/* Shared operational transitions; staff callers retain their stricter entry guard. */
(() => {
const A=K406,S=A.staff,I=A.inventory,C=A.commerce,F=A.fulfillment={};
F.transition=(id,target,version,key)=>{
 if(!A.session.operational())return 'Operational access required.';if(!key)return 'An operation identifier is required.';if(A.session.ownerAllowed()?A.owner?.saveError:S.saveError)return 'The update could not be saved. Retry.';
 if(S.results.has(key))return S.results.get(key).id===id&&S.results.get(key).target===target?'':'This operation belongs to another update.';
 const o=S.orders().find(o=>o.id===id);if(!o)return 'Order not found.';
 if((S.versions.get(id)||0)!==version)return 'This order changed. Review its current status.';
 const status=S.orderStatus(o);if(!(status==='confirmed'&&target==='preparing'||status==='preparing'&&target==='ready'||status==='ready'&&target==='completed'&&(o.fulfillment.method==='pickup'||A.session.ownerAllowed()&&o.type==='cake')))return 'This transition is not allowed.';
 if(target==='preparing'){const error=I.consume(o,A.session.actor().name);if(error)return error;}
 const actual=target==='ready'?(o.fulfillment.method==='pickup'?'ready-pickup':'ready-delivery'):target;
 C.setStatus(o,actual);S.versions.set(id,version+1);S.results.set(key,{id,target});
 if(target==='completed')o.completedAt=Date.now();
 for(const record of [...A.subscriptions.state.records,...[...A.account.buckets.values()].flatMap(b=>b.subscription?.records||[])]){const d=record.deliveries.find(d=>d.orderId===id);if(d){d.status=target==='completed'?'fulfilled':target;record.status=record.deliveries.every(d=>d.status==='fulfilled')?'completed':'active';}}
 if(target==='preparing'){const record=A.subscriptions.allRecords().find(r=>r.deliveries.some(d=>d.orderId===id));if(record)A.subscriptions.reserveNext(record);}
 S.emit('order:'+id+':'+target,'orders',id+' is '+target+'.','staff/production/'+id);S.changed();return '';
};
// Operational corrections reverse one operational step, never courier progress.
F.previous=o=>o?.paid&&!['pending','booked','in_transit','delivered','unknown'].includes(o.delivery?.status)?({preparing:'confirmed',ready:'preparing',completed:'ready'})[S.orderStatus(o)]:null;
F.revert=(id,version,key)=>{
 if(!A.session.operational())return 'Operational access required.';
 if(!key)return 'An operation identifier is required.';
 if(A.session.ownerAllowed()?A.owner.saveError:S.saveError)return 'The update could not be saved. Retry.';
 if(S.results.has(key))return S.results.get(key).id===id&&S.results.get(key).revert?'':'This operation belongs to another update.';
 const o=S.orders().find(o=>o.id===id),target=F.previous(o);
 if(!o||!target)return 'This order cannot be reverted while courier fulfillment is active.';
 if((S.versions.get(id)||0)!==version)return 'This order changed. Review its current status.';
 if(target==='confirmed'){
  const reservation=I.reservations.get(id);
  if(reservation?.status==='consumed'){
   for(const [ingredient,quantity] of Object.entries(reservation.materials))I.move(ingredient,quantity,'consumption_reversal',A.session.actor().name,id,'correction','Preparation status reverted',key+':'+ingredient);
   reservation.status='confirmed';reservation.rows.forEach(row=>{row.status='confirmed';delete row.consumed_at;});I.operations.delete('consume:'+id);I.notify();
  }
 }
 C.setStatus(o,target);delete o.completedAt;S.versions.set(id,version+1);S.results.set(key,{id,target,revert:true});
 const entry=S.history.get(id)?.[0];if(entry)entry.reason=A.session.actor().name+' reverted an accidental status change';
 for(const record of A.subscriptions.allRecords()){const d=record.deliveries.find(d=>d.orderId===id);if(d){d.status=target;record.status='active';}}
 S.changed();return '';
};
})();
