/* Custom requests, versioned quotations, and simulated resource holds. */
(() => {
const A=K406,C=A.commerce,D=A.schedule,P=A.account,T=A.cakeData;
const K=A.cakes={state:{draft:null,requests:[],quotations:[],serial:4000},orders:[],holds:[],addressUI:{form:null,editing:null,mapBusy:false},mock:{page:'normal',availability:'normal',options:'normal',upload:'normal',submit:'normal'},message:'',month:9,year:2026};
const S=K.state;
K.blank=()=>({date:'',window:'',addressId:A.addresses?.active().find(a=>a.is_default)?.address_id||'',selections:{},addons:{},images:[null,null,null],notes:'',reviewedPrice:null,submittedId:null});S.draft=K.blank();
K.money=cents=>C.money(cents/100);
K.address=()=>A.addresses.find(S.draft.addressId);
K.request=id=>P.allowed()?(S.requests.find(r=>r.id===id&&r.customer_id===P.id())||null):null;
K.quote=id=>P.allowed()?(S.quotations.find(q=>q.id===id&&q.customer_id===P.id())||null):null;
K.list=()=>P.allowed()?S.requests.filter(r=>r.customer_id===P.id()):[];
K.versions=r=>S.quotations.filter(q=>q.requestId===r.id).sort((a,b)=>b.version-a.version);
K.selected=(draft=S.draft)=>T.categories.map(type=>T.options.find(o=>o.id===draft.selections[type]&&o.type===type)).filter(Boolean);
K.extras=(draft=S.draft)=>T.addons.filter(a=>draft.addons[a.id]>0).map(a=>({...a,quantity:draft.addons[a.id]}));
K.estimate=(draft=S.draft)=>{const options=K.selected(draft),addons=K.extras(draft),base=options.reduce((s,o)=>s+o.price,0),extra=addons.reduce((s,o)=>s+o.price*o.quantity,0);return {base,extra,total:base+extra,complete:options.length===5};};
K.windows=date=>T.config.windowOverrides[date]||T.config.windows;
K.serviceable=a=>C.addressValid(a)&&T.config.cities.includes(a.city);
K.activeHolds=()=>K.holds.filter(h=>h.status==='confirmed'||h.status==='held'&&h.expires_at>Date.now());
K.dateReason=(date,exclude)=>{
 if(!D.valid(date)||date<=D.today())return 'Past / same day';
 if(D.config.blocked.includes(date))return 'Owner blocked';
 if(Date.parse(D.config.clock)>=Date.parse(D.add(date,-T.config.leadDays)+'T'+String(T.config.cutoffHour).padStart(2,'0')+':00:00+08:00'))return 'Lead time / cutoff';
 const held=K.activeHolds().filter(h=>h.orderId!==exclude);
 if(held.filter(h=>D.week(h.date)===D.week(date)).length>=T.config.maxPerWeek)return 'Weekly capacity reached';
 if(held.filter(h=>h.date===date).length>=T.config.maxPerDay)return 'Date fully booked';
 return '';
};
K.fulfillmentReason=()=>{
 if(K.mock.availability!=='normal')return {loading:'Checking availability…',error:'Availability could not be checked. Please retry.',capacity:'Weekly capacity reached.',blocked:'The owner has blocked this date.'}[K.mock.availability];
 const d=S.draft;return K.dateReason(d.date)||(!K.windows(d.date)[d.window]?'Choose a preferred delivery window.':'')||(!K.serviceable(K.address())?'Select an address within the owner delivery area.':'');
};
K.optionsReason=()=>{
 if(K.mock.options!=='normal')return K.mock.options==='loading'?'Loading cake options…':'Cake options are unavailable. Please retry.';
 if(K.selected().length!==5)return 'Choose one option in each required category.';
 if(K.selected().some(o=>!o.available))return 'A selected option is no longer available. Choose another option.';
 if(Object.entries(S.draft.addons).some(([id,q])=>!Number.isInteger(q)||q<0||q>20||!T.addons.some(a=>a.id===id&&a.available)))return 'Choose available add-ons with quantities from 0 to 20.';
 return '';
};
K.referencesReason=()=>!S.draft.images[0]?'Upload a primary reference image.':S.draft.images.some(i=>i&&i.status!=='ready')?'Wait for image validation or retry failed images.':S.draft.notes.length>600?'Keep design notes within 600 characters.':'';
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
 const id='CAKE-'+(++S.serial),r={id,customer_id:P.id(),status:'pending_review',created_at:Date.now(),estimated_price:estimate.total,accepted_quotation_id:null,snapshot:C.copy({options:K.selected(),addons:K.extras(),images:S.draft.images,notes:S.draft.notes,address:K.address(),contact:P.contact(),date:S.draft.date,window:S.draft.window,windowLabel:K.windows(S.draft.date)[S.draft.window]})};
 S.requests.unshift(r);S.draft.submittedId=id;A.notifications.emit('request-'+id,'cakes','Cake request submitted','The bakery will review your design and requested date.','cake-requests/'+id);return r;
};
K.issue=(r,revised=false)=>{
 if(!r||!P.owns(r)||r.status==='rejected'||K.orders.some(o=>o.requestId===r.id&&(o.paid||['detected','delayed'].includes(o.payment))))return null;
 const versions=K.versions(r),version=(versions[0]?.version||0)+1;
 versions.filter(q=>['issued','accepted'].includes(q.status)).forEach(q=>{q.status='superseded';const order=K.orders.find(o=>o.quotationId===q.id);if(order&&!order.paid)K.cancel(order);});
 const snapshot=C.copy(r.snapshot),base=snapshot.options.reduce((s,o)=>s+o.price,0),extras=snapshot.addons.reduce((s,o)=>s+o.price*o.quantity,0);
 const q={id:'QUOTE-'+(++S.serial),requestId:r.id,customer_id:r.customer_id,version,status:'issued',issued_at:Date.now(),expires_at:Date.now()+2*86400000,snapshot,options_total:base+(revised?25000:10000),addons_total:extras+(extras&&revised?5000:0),complexity_charge:40000,delivery_fee:20000,owner_notes:revised?'Revised proposal with botanical decoration and hand lettering.':'Design reviewed. Decoration and lettering are included in the quotation.',materials:K.materials(snapshot.options,snapshot.addons)};
 if(revised){const color=q.snapshot.options.find(o=>o.type==='color');color.name='Sage green & soft cream';q.materials.tint=(q.materials.tint||0)+2;}
 q.total=q.options_total+q.addons_total+q.complexity_charge+q.delivery_fee;S.quotations.unshift(q);r.status='quoted';r.accepted_quotation_id=null;
 A.notifications.emit('quote-'+q.id,'cakes','Quotation ready for review','Version '+version+' is ready. Review its design, price, and fulfillment details.','cake-requests/'+r.id+'/quotations/'+q.id,r.customer_id,{email:'sent'});return q;
};
K.quoteReason=q=>{
 if(!q||!P.owns(q))return 'Quotation not found.';
 const r=K.request(q.requestId);if(!r||['rejected','expired'].includes(r.status))return 'This request is no longer available.';
 if(!['issued','accepted'].includes(q.status))return 'This quotation is '+q.status+'.';
 if(q.expires_at<=Date.now())return 'This quotation has expired. Please contact the bakery.';
 if(K.versions(r).some(v=>v.version>q.version&&['issued','accepted'].includes(v.status)))return 'A newer quotation is available.';
 return '';
};
K.reserve=(o,q)=>{
 const reason=K.quoteReason(q)||K.dateReason(q.snapshot.date,o.id)||K.materialReason(q.materials,o.id);if(reason)return reason;
 K.release(o.id);const expires=Math.min(Date.now()+600000,q.expires_at);
 const hold={id:'HOLD-'+(++S.serial),orderId:o.id,date:q.snapshot.date,materials:C.copy(q.materials),status:'held',expires_at:expires};K.holds.push(hold);o.holdId=hold.id;o.deadline=expires;
 o.attempts.push({holdId:hold.id,state:'waiting',at:new Date().toLocaleString()});return '';
};
K.release=id=>K.holds.filter(h=>h.orderId===id&&h.status==='held').forEach(h=>h.status='released');
K.accept=q=>{
 const reason=K.quoteReason(q);if(reason){K.message=reason;return null;}
 let o=K.orders.find(o=>o.quotationId===q.id);if(o){if(o.paid||['waiting','detected','delayed'].includes(o.payment))return o;K.message='Resume or retry your existing payment from the order.';return o;}
 const snap=C.copy(q.snapshot),id='K406-CAKE-'+(++S.serial);
 o={id,customer_id:P.id(),type:'cake',domainType:'custom_cake_purchase',quotationId:q.id,requestId:q.requestId,items:[{key:'quotation:'+q.id,quotation_id:q.id,productId:0,name:'Custom celebration cake',variant:snap.options.map(x=>x.name).join(' · '),price:(q.total-q.delivery_fee)/100,quantity:1,image:snap.images[0]?.url||'assets/celebration-cake.jpg'}],fulfillment:{method:'delivery',date:snap.date,window:snap.window,windowLabel:snap.windowLabel},address:snap.address,contact:snap.contact,fee:q.delivery_fee/100,total:q.total/100,status:'pending-payment',payment:'waiting',created:Date.now(),reference:'DEMO-QR-'+S.serial,attempts:[],activity:[{text:'Quotation accepted · awaiting payment',at:new Date().toLocaleString()}]};
 const failure=K.reserve(o,q);if(failure){K.message=failure;return null;}
 q.status='accepted';q.accepted_at=Date.now();const r=K.request(q.requestId);r.status='accepted';r.accepted_quotation_id=q.id;K.orders.push(o);C.state.orders.unshift(o);return o;
};
K.decline=(q,note='')=>{const reason=K.quoteReason(q);if(reason)return reason;if(q.status!=='issued')return 'Only an unanswered quotation can be declined.';q.status='rejected';q.customer_response_note=note.slice(0,600);q.responded_at=Date.now();K.request(q.requestId).status='negotiating';A.notifications.emit('decline-'+q.id,'cakes','Quotation declined','Your response has been saved for the bakery.','cake-requests/'+q.requestId);return '';};
K.retry=o=>{
 if(!o||o.paid||!P.owns(o)||!['failed','expired','revalidation'].includes(o.payment))return false;
 const q=K.quote(o.quotationId),reason=K.reserve(o,q);if(reason){K.message=reason;o.payment='revalidation';return false;}o.payment='waiting';o.status='pending-payment';K.message='';return true;
};
K.cancel=o=>{if(!o||o.paid||['detected','delayed'].includes(o.payment))return false;K.release(o.id);o.status='cancelled';o.payment='cancelled';return true;};
K.expire=()=>{
 let changed=false;
 for(const q of S.quotations){
  if(!['issued','accepted'].includes(q.status)||q.expires_at>Date.now())continue;
  const order=K.orders.find(o=>o.quotationId===q.id);if(order&&(order.paid||['detected','delayed'].includes(order.payment)))continue;
  if(order&&order.status!=='cancelled')K.pay(order,'expired');q.status='expired';changed=true;
  const r=S.requests.find(r=>r.id===q.requestId);if(r&&K.versions(r)[0]===q)r.status='expired';
 }return changed;
};
K.pay=(o,state)=>{
 if(!o||o.paid||o.status==='cancelled')return;
 o.payment=state;if(o.attempts.length)o.attempts.at(-1).state=state;
 if(['failed','expired','revalidation'].includes(state)){K.release(o.id);o.status='payment-failed';return;}
 if(state!=='confirmed'){o.status='pending-payment';return;}
 const q=S.quotations.find(q=>q.id===o.quotationId),reason=!q||q.status!=='accepted'||q.expires_at<Date.now()?'Quotation requires owner review.':K.dateReason(o.fulfillment.date,o.id)||K.materialReason(q.materials,o.id);
 o.paid=true;o.paidAt=new Date().toLocaleString();
 if(reason){K.release(o.id);o.status='payment-resolution';o.payment='resolution';o.resolution=reason;}
 else{let hold=K.holds.find(h=>h.id===o.holdId);hold.status='confirmed';o.status='confirmed';}
 o.activity.unshift({text:reason?'Payment recorded · owner assistance required':'Full payment confirmed',at:o.paidAt});
 A.notifications.emit('cake-paid-'+o.id,'orders',reason?'Payment needs assistance':'Cake order confirmed',reason?'Your payment is recorded. Please contact the bakery; do not pay again.':'Your cake order is confirmed for '+o.fulfillment.date+'.','orders/'+o.id,o.customer_id);
};
K.resetDraft=()=>{const d=S.draft;if(!d.submittedId)d.images.forEach(i=>{if(i?.url?.startsWith('blob:'))URL.revokeObjectURL(i.url);});S.draft=K.blank();K.message='';};
K.reset=()=>{for(const r of S.requests)r.snapshot.images.forEach(i=>{if(i?.url?.startsWith('blob:'))URL.revokeObjectURL(i.url);});K.resetDraft();S.requests=[];S.quotations=[];K.orders=[];K.holds=[];K.addressUI.form=null;Object.keys(K.mock).forEach(k=>K.mock[k]='normal');};
})();
