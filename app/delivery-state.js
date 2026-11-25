/* Local courier adapter. Outcomes are selected in developer controls, never sent to a provider. */
(() => {
const A=K406,R=A.operations;
const V=A.deliveries={outcome:'success',lookupOutcome:'unknown',results:new Map(),serial:0};
V.reason=o=>!o?'Order not found.':!['standard','subscription'].includes(o.type)||o.fulfillment.method!=='delivery'?'Only standard and subscription deliveries use courier booking.':!o.paid||R.status(o)!=='ready'?'Only paid, Ready fulfillment orders can be booked.':!A.commerce.addressValid(o.address)?'The checkout delivery address is incomplete.':o.persistedSubscription||o.persistedPickup?'':A.earnings.required(o);
V.book=(id,key,version,outcome=V.outcome==='one-failure'?'success':V.outcome)=>{
 if(!A.session.ownerAllowed())return 'Admin/Owner access required.';if(!key)return 'Operation identifier required.';
 if(V.results.has(key))return V.results.get(key)===id?'':'This operation belongs to another order.';
 const o=R.find(id),reason=V.reason(o);if(reason)return reason;
 if((A.staff.versions.get(id)||0)!==version)return 'Order changed. Review its current state.';
 if(o.persistedSubscription)return A.subscriptions.persistence.courier(id,'book',outcome,key);
 if(o.persistedPickup)return A.pickup.courier(id,'book',outcome,key);
 if(o.delivery&&!['failed','cancelled'].includes(o.delivery.status))return 'An active booking already exists. View its delivery status before retrying.';
 const at=Date.now();
 const status=({failure:'failed',error:'failed',cancelled:'cancelled',unavailable:'failed',unknown:'pending'})[outcome]||'booked';
 o.delivery={id:'DEL-'+(++V.serial),order_id:id,lalamove_id:status==='booked'?'DEMO-COURIER-'+V.serial:null,status,outcome,fee:o.fee,address:A.commerce.copy(o.address),operation_key:key,created_at:at,history:[...(o.delivery?.history||[]),{attempt_id:'DEL-'+V.serial,status,at,actor:A.session.actor().id}]};
 A.earnings.updateLock(o,o.delivery.created_at);
 V.results.set(key,id);A.staff.versions.set(id,version+1);R.changed();return '';
};
V.reconcile=id=>{
 if(!A.session.ownerAllowed())return 'Admin/Owner access required.';
 const o=R.find(id),attempt=o?.delivery;
 if(!['pending','unknown'].includes(attempt?.status))return 'There is no unresolved booking to check.';
 const outcome=V.lookupOutcome;
 if(o.persistedSubscription)return A.subscriptions.persistence.courier(id,'reconcile',outcome);
 if(o.persistedPickup)return A.pickup.courier(id,'reconcile',outcome);
 if(outcome==='error')return 'Could not retrieve the booking status. The booking remains unresolved.';
 if(outcome==='unknown')return 'The booking is still unresolved. Check it again later.';
 if(A.owner?.saveError)return 'The result could not be saved. The booking remains unresolved.';
 const status=({cancelled:'cancelled',unavailable:'failed'})[outcome]||'booked';
 const at=Date.now();
 attempt.status=status;
 attempt.outcome=outcome;
 if(status==='booked')attempt.lalamove_id||='DEMO-COURIER-'+attempt.id;
 (attempt.history||=[]).push({attempt_id:attempt.id,status,at,actor:A.session.actor().id});
 A.earnings.updateLock(o,at);
 A.staff.versions.set(id,(A.staff.versions.get(id)||0)+1);
 R.changed();
 return '';
};
// Active delivery progression is a separate prototype simulation.
V.refresh=id=>{
 if(!A.session.operational())return 'Operational access required.';
 const o=R.find(id),d=o?.delivery;
 if(!d)return 'Booking not found.';
 if(['pending','unknown'].includes(d.status))return V.reconcile(id);
 if(o.persistedSubscription)return A.subscriptions.persistence.courier(id,'track',V.outcome,undefined,d.status);
 if(o.persistedPickup)return A.pickup.courier(id,'track',V.outcome,undefined,d.status);
 if(V.outcome==='failure')return 'Could not retrieve booking status. The previous state is retained.';
 if(V.outcome==='unknown')return 'Provider outcome is still unknown. Do not submit another booking.';
 const next=({booked:'in_transit',in_transit:'delivered'})[d.status];
 if(!next)return '';
 const completedAt=next==='delivered'?Date.now():null;
 if(completedAt!==null){const error=A.earnings.required(o);if(error)return error;}
 const progress=completedAt===null?{}:A.subscriptions.progressForOrder(o,'completed',completedAt);
 if(progress.error)return progress.error;
 if(completedAt!==null&&(A.session.ownerAllowed()?A.owner?.saveError:A.staff.saveError))return 'The delivery update could not be saved. Retry.';
 d.status=next;
 d.lalamove_id||='DEMO-COURIER-'+d.id;
 (d.history||=[]).unshift({attempt_id:d.id,status:next,at:Date.now(),actor:A.session.actor().id});
 if(next==='delivered'){
  d.delivered_at=completedAt;o.completedAt=completedAt;
  A.commerce.setStatus(o,'completed');
  progress.commit?.();
 }
 A.earnings.updateLock(o,completedAt??Date.now());
 A.staff.versions.set(id,(A.staff.versions.get(id)||0)+1);
 A.notifications.emit('courier-'+id+'-'+next,'orders','Delivery status updated',id+' delivery is '+next.replaceAll('_',' ')+'.','orders/'+id,o.customer_id);
 R.changed();
 return '';
};
})();
