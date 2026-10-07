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
})();
