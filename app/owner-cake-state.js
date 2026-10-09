/* Owner review commands preserve the original request and every issued version. */
(() => {
const A=K406,K=A.cakes,C=A.commerce;
const Q=A.ownerCakes={results:new Map(),notificationOutcome:'success',notificationAttempts:[],alerts:new Map()};
Q.notify=q=>{if(!A.session.ownerAllowed())return 'Owner access required.';if(!q||!K.state.quotations.includes(q))return 'Quotation not found.';q.notification_status=Q.notificationOutcome==='failure'?'failed':'sent';const at=Date.now(),attempt={id:'QUOTE-NOTIFY-'+(Q.notificationAttempts.length+1),quotation_id:q.id,status:q.notification_status,created_at:at,channels:{email:q.notification_status,sms:q.notification_status}};Q.notificationAttempts.push(attempt);let alert=Q.alerts.get(q.id);if(q.notification_status==='failed'){if(!alert){alert={id:'QUOTE-ALERT-'+q.id,notification_type:'notification_send_failed',recipient_role:'admin',related_entity_type:'custom_cake_request',related_entity_id:q.requestId,path:'cake-requests/'+q.requestId+'/quotation/'+q.id};Q.alerts.set(q.id,alert);}Object.assign(alert,{resolved_at:null,attempt_id:attempt.id,updated_at:at});}else if(alert)alert.resolved_at=at;A.notifications.emit('quote-'+q.id,'cakes','Quotation ready for review','Version '+q.version+' is ready for review.','cake-requests/'+q.requestId+'/quotations/'+q.id,q.customer_id,{email:q.notification_status,sms:q.notification_status});return q.notification_status==='failed'?'Notification delivery failed. The quotation remains issued.':'';};
Q.locked=r=>K.orders.some(o=>o.requestId===r.id&&(o.paid||['waiting','detected','delayed'].includes(o.payment)))||K.versions(r).some(q=>q.status==='accepted');
Q.reject=(id,version)=>{if(!A.session.ownerAllowed())return 'Owner access required.';const r=K.state.requests.find(r=>r.id===id);if(!r)return 'Request not found.';if((r.version||0)!==version)return 'Request changed. Review it again.';if(Q.locked(r)||['rejected','expired'].includes(r.status))return 'This request cannot be rejected.';r.status='rejected';r.version=(r.version||0)+1;K.versions(r).filter(q=>q.status==='issued').forEach(q=>q.status='rejected');A.notifications.emit('rejected-'+id,'cakes','Cake request declined','The bakery cannot accommodate this request.','cake-requests/'+id,r.customer_id);return '';};
Q.issue=(id,input,version,key)=>{
 if(!A.session.ownerAllowed())return 'Owner access required.';if(!key)return 'Operation identifier required.';if(Q.results.has(key))return Q.results.get(key)===id?'':'Operation belongs to another request.';
 const r=K.state.requests.find(r=>r.id===id);if(!r)return 'Request not found.';if((r.version||0)!==version)return 'Request changed. Reopen the quotation.';
 if(Q.locked(r)||['rejected','expired'].includes(r.status))return 'This request has locked or unavailable content.';
 const reason=K.dateReason(input.date);if(reason)return reason;
 if(!K.windows(input.date)[input.window]||!['pickup','delivery'].includes(input.method))return 'Choose a valid fulfillment method and window.';
 if(![input.complexity,input.fee].every(n=>Number.isFinite(n)&&n>=0&&Number.isSafeInteger(n)))return 'Charges must be nonnegative currency amounts.';
 if(!Number.isFinite(input.expiry)||input.expiry<=Date.now())return 'Choose a future expiry.';
 if(input.method==='delivery'&&!K.serviceable(r.snapshot.address))return 'The submitted delivery address is not serviceable.';
 const snapshot=C.copy(r.snapshot);Object.assign(snapshot,{date:input.date,window:input.window,windowLabel:K.windows(input.date)[input.window],method:input.method,address:input.method==='pickup'?null:snapshot.address});
 const materials=K.materials(snapshot.options,snapshot.addons),materialReason=K.materialReason(materials);if(materialReason)return materialReason;
 const versions=K.versions(r),v=(versions[0]?.version||0)+1;
 const q={id:'QUOTE-'+(++K.state.serial),requestId:id,customer_id:r.customer_id,created_by_admin_id:A.session.actor().id,version:v,status:'issued',issued_at:Date.now(),expires_at:input.expiry,snapshot,options_total:snapshot.options.reduce((n,x)=>n+x.price,0),addons_total:snapshot.addons.reduce((n,x)=>n+x.price*x.quantity,0),complexity_charge:input.complexity,delivery_fee:input.method==='pickup'?0:input.fee,owner_notes:input.notes.trim().slice(0,2000),materials};
 q.total=q.options_total+q.addons_total+q.complexity_charge+q.delivery_fee;
 versions.filter(q=>q.status==='issued').forEach(q=>q.status='superseded');K.state.quotations.unshift(q);r.status='quoted';r.version=(r.version||0)+1;r.accepted_quotation_id=null;Q.results.set(key,id);
 Q.notify(q);return '';
};
})();
