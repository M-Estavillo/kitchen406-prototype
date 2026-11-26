/* Owner review commands preserve the original request and every issued version. */
(() => {
const A=K406,K=A.cakes,C=A.commerce;
const Q=A.ownerCakes={results:new Map(),notificationOutcome:'success',notificationAttempts:[],alerts:new Map()};
Q.notify=q=>{if(!A.session.ownerAllowed())return 'Owner access required.';if(!q||!K.state.quotations.includes(q))return 'Quotation not found.';q.notification_status=Q.notificationOutcome==='failure'?'failed':'sent';const at=Date.now(),attempt={id:'QUOTE-NOTIFY-'+(Q.notificationAttempts.length+1),quotation_id:q.id,status:q.notification_status,created_at:at,channels:{email:q.notification_status,sms:q.notification_status}};Q.notificationAttempts.push(attempt);let alert=Q.alerts.get(q.id);if(q.notification_status==='failed'){if(!alert){alert={id:'QUOTE-ALERT-'+q.id,notification_type:'notification_send_failed',recipient_role:'admin',related_entity_type:'quotation',related_entity_id:q.id,path:'cake-requests/'+q.requestId+'/quotations/'+q.id};Q.alerts.set(q.id,alert);}Object.assign(alert,{resolved_at:null,attempt_id:attempt.id,updated_at:at});}else if(alert)alert.resolved_at=at;A.notifications.emit('quote-'+q.id,'cakes','Quotation ready for review','Version '+q.version+' is ready for review.','cake-requests/'+q.requestId+'/quotations/'+q.id,q.customer_id,{email:q.notification_status,sms:q.notification_status});return q.notification_status==='failed'?'Notification delivery failed. The quotation remains issued.':'';};
Q.locked=r=>K.orders.some(o=>o.requestId===r.id&&(o.paid||['waiting','detected','delayed'].includes(o.payment)))||K.versions(r).some(q=>q.status==='accepted');
Q.rejectionCategories=['Requested date unavailable','Design not feasible','Other'];
Q.quoteMaterials=(options,rows)=>{
 const inventory=A.inventory,seen=new Set();
 const addons=[];
 for(const {id,quantity} of rows){
  const item=inventory.item(id);
  if(!item||item.archivedAt||seen.has(id)||!Number.isFinite(quantity)||quantity<=0||
     Math.abs(quantity*1000-Math.round(quantity*1000))>1e-6||(item.unit==='pcs'&&!Number.isInteger(quantity)))return null;
  seen.add(id);
  addons.push({id,name:item.name,quantity,ingredients:{[id]:1}});
 }
 const materials=K.materials(options,addons);
 const pricing=A.pricing.recommend(materials,A.pricing.cakeTiming(options),true);
 return {addons,materials,pricing};
};
Q.reject=(id,version,category,notes='')=>{
 if(!A.session.ownerAllowed())return 'Owner access required.';
 const r=K.state.requests.find(r=>r.id===id);
 if(!r)return 'Request not found.';
 if((r.version||0)!==version)return 'Request changed. Review it again.';
 if(Q.locked(r)||r.status==='rejected')return 'This request cannot be rejected.';
 if(!Q.rejectionCategories.includes(category))return 'Choose a reason category.';
 notes=notes.trim();
 if(notes.length>600)return 'Use 600 characters or fewer for the notes.';
 r.rejection={category,notes};
 r.status='rejected';r.version=(r.version||0)+1;
 K.versions(r).filter(q=>q.status==='issued').forEach(q=>q.status='rejected');
 A.notifications.emit('rejected-'+id,'cakes','Cake request declined','The bakery cannot accommodate this request.','cake-requests/'+id,r.customer_id);
 return '';
};
Q.issue=(id,input,version,key)=>{
 if(!A.session.ownerAllowed())return 'Owner access required.';if(!key)return 'Operation identifier required.';if(Q.results.has(key))return Q.results.get(key)===id?'':'Operation belongs to another request.';
 const r=K.state.requests.find(r=>r.id===id);if(!r)return 'Request not found.';if((r.version||0)!==version)return 'Request changed. Reopen the quotation.';
 if(Q.locked(r)||r.status==='rejected')return 'This request has locked or unavailable content.';
 const reason=K.dateReason(input.date);if(reason)return reason;
 if(!['pickup','delivery'].includes(input.method))return 'Choose a valid fulfillment method.';
 if(!Number.isSafeInteger(input.fee)||input.fee<0||!Number.isSafeInteger(input.finalPrice)||input.finalPrice<=0)return 'Enter a final cake price and a valid delivery fee.';
 if(input.pricingVersion!==A.pricing.settings.version)return 'Costing settings changed. Reopen the quotation.';
 const address=input.address??r.snapshot.address;
 if(input.method==='delivery'&&!K.serviceable(address))return 'Enter a complete delivery address.';
 const snapshot=C.copy(K.versions(r)[0]?.snapshot||r.snapshot),catalog=A.cakeData;
 if(input.options){
  const options=catalog.categories.map(type=>catalog.options.find(option=>option.type===type&&option.id===input.options[type]&&option.available));
  if(options.some(option=>!option))return 'Choose one available option per cake category.';
  snapshot.options=C.copy(options);
 }
 const priced=Q.quoteMaterials(snapshot.options,input.addonRows||[]);
 if(!priced?.materials)return 'Select valid inventory add-ons and quantities.';
 if(!priced.pricing)return 'Set the cake recipe times, materials and costing rates.';
 const {addons,materials,pricing}=priced;
 snapshot.addons=C.copy(addons);
 Object.assign(snapshot,{date:input.date,method:input.method,address:input.method==='pickup'?null:C.copy(address)});
 const materialReason=K.materialReason(materials);if(materialReason)return materialReason;
 const versions=K.versions(r),v=(versions[0]?.version||0)+1;
 const issuedAt=Date.now(),q={id:'QUOTE-'+(++K.state.serial),requestId:id,customer_id:r.customer_id,created_by_admin_id:A.session.actor().id,version:v,status:'issued',issued_at:issuedAt,expires_at:issuedAt+K.offerValidityMs,snapshot,
  pricing:C.copy(pricing),final_cake_price:input.finalPrice,delivery_fee:input.method==='pickup'?0:input.fee,owner_notes:input.notes.trim().slice(0,2000),materials};
 q.total=q.final_cake_price+q.delivery_fee;
 versions.filter(q=>q.status==='issued').forEach(q=>q.status='superseded');K.state.quotations.unshift(q);r.status='quoted';r.version=(r.version||0)+1;r.accepted_quotation_id=null;Q.results.set(key,id);
 Q.notify(q);return '';
};
})();
