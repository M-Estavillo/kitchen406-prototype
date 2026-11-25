/* Custom requests, versioned quotations, and simulated resource holds. */
(() => {
const A=K406,C=A.commerce,D=A.schedule,P=A.account,T=A.cakeData;
const K=A.cakes={state:{draft:null,requests:[],quotations:[],serial:4000},orders:[],holds:[],addressUI:{form:null,editing:null,mapBusy:false},mock:{page:'normal',availability:'normal',options:'normal',upload:'normal',submit:'normal',accept:'normal'},message:'',month:Number(D.today().slice(5,7))-1,year:Number(D.today().slice(0,4))};
const S=K.state;
K.blank=()=>({method:'',date:'',addressId:A.addresses?.active().find(a=>a.is_default)?.address_id||'',selections:{},addons:{},images:[null,null,null],notes:'',reviewedPrice:null,submittedId:null});S.draft=K.blank();
K.money=cents=>C.money(cents/100);
K.address=()=>A.addresses.find(S.draft.addressId);
K.request=id=>P.allowed()?(S.requests.find(r=>r.id===id&&r.customer_id===P.id())||null):null;
K.quote=id=>P.allowed()?(S.quotations.find(q=>q.id===id&&q.customer_id===P.id())||null):null;
K.list=()=>P.allowed()?S.requests.filter(r=>r.customer_id===P.id()):[];
K.versions=r=>S.quotations.filter(q=>q.requestId===r.id).sort((a,b)=>b.version-a.version);
K.selected=(draft=S.draft)=>T.categories.map(type=>T.options.find(o=>o.id===draft.selections[type]&&o.type===type)).filter(Boolean);
K.extras=(draft=S.draft)=>T.addons.filter(a=>draft.addons[a.id]>0).map(a=>({...a,quantity:draft.addons[a.id]}));
K.estimate=(draft=S.draft)=>{const options=K.selected(draft),addons=K.extras(draft),base=options.reduce((s,o)=>s+o.price,0),extra=addons.reduce((s,o)=>s+o.price*o.quantity,0);return {base,extra,total:base+extra,complete:options.length===5};};
K.serviceable=a=>C.addressValid(a);
K.offerValidityMs=48*60*60*1000;
K.activeHolds=()=>K.holds.filter(h=>h.status==='confirmed'||h.status==='held'&&(A.checkoutHolds?.retained(h.orderId,h.expires_at)??h.expires_at>Date.now()));
K.dateReason=(date,exclude)=>{
 if(!D.valid(date)||date<=D.today())return 'Past / same day';
 if(D.config.blocked.includes(date))return 'Owner blocked';
 const held=K.activeHolds().filter(h=>h.orderId!==exclude);
 if(held.filter(h=>D.week(h.date)===D.week(date)).length>=T.config.maxPerWeek)return 'Weekly capacity reached';
 if(held.filter(h=>h.date===date).length>=T.config.maxPerDay)return 'Date fully booked';
 return '';
};
K.requestLeadReason=date=>{
 if(!D.valid(date)||date<D.add(D.today(),7))return 'Choose a date at least seven calendar days after submission.';
 if(D.config.timing?.cake&&D.now()>=D.cutoff(date,null,'cake'))return 'The configured submission cutoff has passed for this date.';
 return '';
};
K.availabilityTarget=()=>{
 const mode=K.mock.availability;
 if(K.availabilityPreview?.mode!==mode){
  let date=S.draft.date;
  if(!D.valid(date)){date=D.add(D.today(),7);for(let i=0;i<365&&(K.requestLeadReason(date)||K.dateReason(date));i++)date=D.add(date,1);}
  K.availabilityPreview={mode,date};
 }
 return K.availabilityPreview.date;
};
K.requestDateReason=date=>{
 const target=K.availabilityTarget(),mode=K.mock.availability;
 if(mode==='loading')return 'Checking availability...';
 if(mode==='error')return 'Availability could not be checked. Please retry.';
 const reason=K.requestLeadReason(date)||K.dateReason(date);if(reason)return reason;
 if(mode==='capacity'&&D.week(date)===D.week(target))return 'Weekly capacity reached';
 if(mode==='blocked'&&date===target)return 'Date blocked';
 return '';
};
K.availabilityReason=()=>{
 const target=K.availabilityTarget();
 return K.mock.availability==='normal'?'':K.requestDateReason(S.draft.date||target);
};
K.fulfillmentReason=()=>{
 const d=S.draft;return K.availabilityReason()||(!d.date?'Choose a requested date.':K.requestLeadReason(d.date)||K.dateReason(d.date))||(!['pickup','delivery'].includes(d.method)?'Choose pickup or delivery.':'')||(d.method==='delivery'&&!K.serviceable(K.address())?'Select a complete address for the owner to review.':'');
};
K.optionsReason=()=>{
 if(K.mock.options!=='normal')return K.mock.options==='loading'?'Loading cake options…':'Cake options are unavailable. Please retry.';
 if(K.selected().length!==5)return 'Choose one option in each required category.';
 if(K.selected().some(o=>!o.available))return 'A selected option is no longer available. Choose another option.';
 if(Object.entries(S.draft.addons).some(([id,q])=>!Number.isInteger(q)||q<0||q>20||!T.addons.some(a=>a.id===id&&a.available)))return 'Choose available add-ons with quantities from 0 to 20.';
 return '';
};
K.referenceTypes=['image/jpeg','image/png','image/webp'];
K.referenceMaxBytes=5*1024*1024;
K.referencesReason=()=>S.draft.imageCheck?'Wait for the image check to finish.':K.mock.upload==='error'?'This image could not be read. Retry or continue without it.':S.draft.images.some(i=>i&&i.status!=='ready')?'Wait for image validation or remove failed images.':S.draft.images.filter(Boolean).length>3?'Use up to three reference images.':S.draft.notes.length>600?'Keep design notes within 600 characters.':'';
K.materials=(options,addons)=>{
 const totals={};for(const item of [...options,...addons]){if(!item.ingredients)return null;for(const [id,quantity] of Object.entries(item.ingredients))totals[id]=(totals[id]||0)+quantity*(item.quantity||1);}return totals;
};
K.materialReason=(materials,exclude)=>{
 if(!materials)return 'The owner needs to complete the ingredient review.';
 for(const [id,quantity] of Object.entries(materials)){
  const reserved=K.activeHolds().filter(h=>h.orderId!==exclude).reduce((s,h)=>s+(h.materials[id]||0),0);
  if(!Number.isFinite(quantity)||quantity<0||!Number.isFinite(T.stock[id])||T.stock[id]-reserved<quantity)return 'Required ingredients are unavailable.';
 }return '';
};
K.submit=()=>{
 if(!P.allowed()){K.message='Sign in to submit your request.';return null;}
 if(S.draft.submittedId)return K.request(S.draft.submittedId);
 const reason=K.fulfillmentReason()||K.optionsReason()||K.referencesReason();if(reason){K.message=reason;return null;}
 const estimate=K.estimate();if(S.draft.reviewedPrice!==estimate.total){K.message='Your estimate changed. Review and accept the current estimate before submitting.';return null;}
 if(K.mock.submit==='error'){K.message='Your request could not be submitted. Your draft is saved; please retry.';return null;}
 const id='CAKE-'+(++S.serial),r={id,customer_id:P.id(),status:'pending_review',created_at:Date.now(),submitted_on:D.today(),estimated_price:estimate.total,accepted_quotation_id:null,snapshot:C.copy({options:K.selected(),addons:K.extras(),images:S.draft.images,notes:S.draft.notes,method:S.draft.method,address:S.draft.method==='pickup'?null:K.address(),contact:P.contact(),date:S.draft.date})};
 S.requests.unshift(r);S.draft.submittedId=id;A.notifications.emit('request-'+id,'cakes','Cake request submitted','The bakery will review your design and requested date.','cake-requests/'+id);return r;
};
K.issue=(r,revised=false)=>{
 if(!r||!P.owns(r)||r.status==='rejected'||K.orders.some(o=>o.requestId===r.id&&(o.paid||['detected','delayed'].includes(o.payment))))return null;
 const versions=K.versions(r),version=(versions[0]?.version||0)+1;
 if(versions.some(q=>q.status==='accepted'))return null;
 versions.filter(q=>q.status==='issued').forEach(q=>{q.status='superseded';});
 const snapshot=C.copy(r.snapshot),base=snapshot.options.reduce((s,o)=>s+o.price,0),extras=snapshot.addons.reduce((s,o)=>s+o.price*o.quantity,0);
 const issuedAt=Date.now(),q={id:'QUOTE-'+(++S.serial),requestId:r.id,customer_id:r.customer_id,version,status:'issued',issued_at:issuedAt,expires_at:issuedAt+K.offerValidityMs,snapshot,options_total:base+(revised?25000:10000),addons_total:extras+(extras&&revised?5000:0),complexity_charge:40000,delivery_fee:snapshot.method==='pickup'?0:20000,owner_notes:revised?'Revised proposal with botanical decoration and hand lettering.':'Design reviewed. Decoration and lettering are included in the quotation.',materials:K.materials(snapshot.options,snapshot.addons)};
 if(revised){const color=q.snapshot.options.find(o=>o.type==='color');color.name='Sage green & soft cream';q.materials.tint=(q.materials.tint||0)+2;}
 q.total=q.options_total+q.addons_total+q.complexity_charge+q.delivery_fee;S.quotations.unshift(q);r.status='quoted';r.accepted_quotation_id=null;
 A.notifications.emit('quote-'+q.id,'cakes','Quotation ready for review','Version '+version+' is ready. Review its design, price, and fulfillment details.','cake-requests/'+r.id+'/quotations/'+q.id,r.customer_id,{email:'sent'});return q;
};
K.quoteReason=q=>{
 if(!q||!S.quotations.includes(q)||!P.owns(q))return 'Quotation not found.';
 const r=K.request(q.requestId);if(!r||r.status==='rejected')return 'This request is no longer available.';
 if(K.versions(r).some(v=>v.version>q.version&&['issued','accepted'].includes(v.status)))return 'A newer quotation is available. Review the current version in quotation history.';
 if(!['issued','accepted'].includes(q.status))return 'This quotation is '+q.status+'.';
 if(q.status==='issued'&&q.expires_at<=Date.now())return 'This quotation has expired. Please contact the bakery.';
 return '';
};
K.reserve=(o,q)=>{
 const reason=K.quoteReason(q)||K.dateReason(q.snapshot.date,o.id)||K.materialReason(q.materials,o.id);if(reason)return reason;
 const candidate={...o,attempts:[...o.attempts]};C.beginAttempt(candidate);
 const hold={id:'HOLD-'+(++S.serial),orderId:o.id,date:q.snapshot.date,materials:C.copy(q.materials),status:'held',expires_at:C.holdUntil(candidate)};
 candidate.holdId=hold.id;candidate.attempts.at(-1).holdId=hold.id;
 const error=K.reserveIngredients?.(candidate);if(error)return error;
 K.holds.filter(h=>h.orderId===o.id&&h.status==='held').forEach(h=>{h.status='released';});
 K.holds.push(hold);Object.assign(o,candidate);return '';

};
K.release=id=>K.holds.filter(h=>h.orderId===id&&h.status==='held').forEach(h=>h.status='released');
K.recordAcceptance=q=>{
 const reason=K.quoteReason(q);if(reason){K.message=reason;return false;}
 const r=K.request(q.requestId);
 if(q.status==='accepted'){
  if(r.accepted_quotation_id===q.id)return true;
  K.message='This version is no longer the accepted quotation.';return false;
 }
 if(K.mock.accept==='error'){K.message='Acceptance could not be saved. Review the quotation and retry.';return false;}
 q.status='accepted';q.accepted_at=Date.now();
 r.status='accepted';r.accepted_quotation_id=q.id;r.version=(r.version||0)+1;K.message='';
 return true;
};
K.checkout=q=>{
 const reason=K.quoteReason(q);if(reason){K.message=reason;return null;}
 if(q.status!=='accepted'||K.request(q.requestId).accepted_quotation_id!==q.id){K.message='Accept the current quotation before starting checkout.';return null;}
 let o=K.orders.find(o=>o.quotationId===q.id);if(o){if(o.paid||['waiting','detected','delayed'].includes(o.payment))return o;K.message='Resume or retry your existing payment from the order.';return o;}
 const snap=C.copy(q.snapshot),id='K406-CAKE-'+(++S.serial);
 o={id,customer_id:P.id(),type:'cake',domainType:'custom_cake_purchase',quotationId:q.id,requestId:q.requestId,items:[{key:'quotation:'+q.id,quotation_id:q.id,productId:0,name:'Custom celebration cake',variant:snap.options.map(x=>x.name).join(' · '),price:(q.total-q.delivery_fee)/100,quantity:1,image:snap.images[0]?.url||'assets/custom-cake.png'}],fulfillment:{method:snap.method||'delivery',date:snap.date},address:snap.address,contact:snap.contact,fee:q.delivery_fee/100,total:q.total/100,status:'pending-payment',payment:'waiting',created:Date.now(),reference:'DEMO-QR-'+S.serial,attempts:[],activity:[{text:'Quotation accepted · awaiting payment',at:new Date().toLocaleString()}]};
 const failure=K.reserve(o,q);if(failure){K.message='Quotation accepted. Checkout could not start. '+failure+' Try again or contact the bakery.';return null;}
 K.orders.push(o);C.state.orders.unshift(o);K.message='';return o;
};
K.accept=q=>K.recordAcceptance(q)?K.checkout(q):null;
K.decline=(q,note='')=>{const reason=K.quoteReason(q);if(reason)return reason;if(q.status!=='issued')return 'Only an unanswered quotation can be declined.';q.status='rejected';q.customer_response_note=note.slice(0,600);q.responded_at=Date.now();K.request(q.requestId).status='pending_review';A.notifications.emit('decline-'+q.id,'cakes','Quotation declined','Your response has been saved for the bakery.','cake-requests/'+q.requestId);return '';};
K.retry=o=>{
 if(!o||o.paid||!P.owns(o)||o.reconciliationRequired||!['failed','expired','revalidation'].includes(o.payment))return false;
 const q=K.quote(o.quotationId),reason=K.reserve(o,q);if(reason){K.message=reason;o.payment='revalidation';return false;}o.payment='waiting';o.status='pending-payment';o.checkoutClosed=false;o.refundIfPaid=false;o.paymentCheckMessage='';K.message='';return true;
};
K.cancel=o=>{if(!o||o.paid||['detected','delayed'].includes(o.payment))return false;K.release(o.id);o.status='cancelled';o.payment='cancelled';return true;};
K.expire=()=>{
 let changed=false;
 for(const q of S.quotations){
  if(q.status!=='issued'||q.expires_at>Date.now())continue;
  q.status='expired';changed=true;
  const r=S.requests.find(r=>r.id===q.requestId);if(r&&K.versions(r)[0]===q)r.status='expired';
 }return changed;
};
K.pay=(o,state)=>{
 if(!o||o.paid||o.status==='cancelled'&&state!=='confirmed')return;
 o.payment=state;if(o.attempts.length)o.attempts.at(-1).state=state;
 if(['failed','expired','revalidation'].includes(state)){K.release(o.id);o.status='payment-failed';return;}
 if(state!=='confirmed'){o.status='pending-payment';return;}
 const q=S.quotations.find(q=>q.id===o.quotationId);
 const held=K.activeHolds().find(h=>h.id===o.holdId);
 const reason=(!q||q.status!=='accepted'?'Quotation requires owner review.':held?'':K.dateReason(o.fulfillment.date,o.id)||K.materialReason(q.materials,o.id))||K.commitIngredients?.(o);

 o.paid=true;o.paidAt=new Date().toLocaleString();
 if(reason){K.release(o.id);o.status='payment-resolution';o.payment='resolution';o.resolution=reason;}
 else{
  if(held)held.status='confirmed';
  else {const restored={id:'HOLD-'+(++S.serial),orderId:o.id,date:o.fulfillment.date,materials:C.copy(q.materials),status:'confirmed',restored_from:o.holdId};K.holds.push(restored);o.holdId=restored.id;}
  o.status='confirmed';
 }
 o.activity.unshift({text:reason?'Payment recorded · owner assistance required':'Full payment confirmed',at:o.paidAt});
 if(!reason||!A.checkoutHolds)A.notifications.emit('cake-paid-'+o.id,'orders',reason?'Payment needs assistance':'Cake order confirmed',reason?'Your payment is recorded. Please contact the bakery; do not pay again.':'Your cake order is confirmed for '+o.fulfillment.date+'.','orders/'+o.id,o.customer_id);
};
K.resetDraft=()=>{K.availabilityPreview=null;const d=S.draft;d.imageCheck=null;if(!d.submittedId)d.images.forEach(i=>{if(i?.url?.startsWith('blob:'))URL.revokeObjectURL(i.url);});S.draft=K.blank();K.message='';};
K.reset=()=>{for(const r of S.requests)r.snapshot.images.forEach(i=>{if(i?.url?.startsWith('blob:'))URL.revokeObjectURL(i.url);});K.resetDraft();S.requests=[];S.quotations=[];K.orders=[];K.holds=[];K.addressUI.form=null;Object.keys(K.mock).forEach(k=>K.mock[k]='normal');};
})();
