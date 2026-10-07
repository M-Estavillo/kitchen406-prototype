/* Local courier adapter. Outcomes are selected in developer controls, never sent to a provider. */
(() => {
const A=K406,R=A.operations;
const V=A.deliveries={outcome:'success',results:new Map(),serial:0};
V.reason=o=>!o?'Order not found.':!['standard','subscription'].includes(o.type)||o.fulfillment.method!=='delivery'?'Only standard and subscription deliveries use courier booking.':!o.paid||R.status(o)!=='ready'?'Only paid, Ready fulfillment orders can be booked.':!A.commerce.addressValid(o.address)?'The checkout delivery address is incomplete.':'';
V.book=(id,key,version)=>{
 if(!A.session.ownerAllowed())return 'Owner access required.';if(!key)return 'Operation identifier required.';
 if(V.results.has(key))return V.results.get(key)===id?'':'This operation belongs to another order.';
 const o=R.find(id),reason=V.reason(o);if(reason)return reason;
 if((A.staff.versions.get(id)||0)!==version)return 'Order changed. Review its current state.';
 if(o.delivery&&!['failed','cancelled'].includes(o.delivery.status))return 'An active booking already exists. Refresh its status before retrying.';
 const status=V.outcome==='failure'?'failed':V.outcome==='unknown'?'pending':'booked';
 o.delivery={id:'DEL-'+(++V.serial),order_id:id,lalamove_id:status==='booked'?'DEMO-COURIER-'+V.serial:null,status,fee:o.fee,address:A.commerce.copy(o.address),operation_key:key,created_at:Date.now(),history:[...(o.delivery?.history||[]),{status,at:Date.now(),actor:A.session.actor().id}]};
 V.results.set(key,id);A.staff.versions.set(id,version+1);R.changed();return '';
};
V.refresh=id=>{if(!A.session.ownerAllowed())return 'Owner access required.';const o=R.find(id),d=o?.delivery;if(!d)return 'Booking not found.';if(V.outcome==='failure')return 'Could not retrieve booking status. The previous state is retained.';if(V.outcome==='unknown')return 'Provider outcome is still unknown. Do not submit another booking.';const next=({pending:'booked',booked:'in_transit',in_transit:'delivered'})[d.status];if(!next)return '';d.status=next;d.lalamove_id||='DEMO-COURIER-'+d.id;d.history||=[];d.history.unshift({status:next,at:Date.now(),actor:A.session.actor().id});if(next==='delivered'){d.delivered_at=Date.now();o.completedAt=Date.now();A.commerce.setStatus(o,'completed');const r=A.subscriptions.allRecords().find(r=>r.deliveries.some(x=>x.orderId===id));if(r)A.subscriptions.sync(r);}A.staff.versions.set(id,(A.staff.versions.get(id)||0)+1);A.notifications.emit('courier-'+id+'-'+next,'orders','Delivery status updated',id+' delivery is '+next.replaceAll('_',' ')+'.','orders/'+id,o.customer_id);R.changed();return '';};
})();
