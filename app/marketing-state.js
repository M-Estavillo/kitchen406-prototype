/* Owner marketing records and deterministic qualifying event evaluation. */
(() => {
const A=K406;
const M=A.marketing={drafts:[],occasions:[],events:new Map(),imageFailure:false,initialized:false};
M.add=(category,event,product,caption,occasion=null)=>{
 const key=category+':'+event;if(M.drafts.some(d=>d.eventKey===key))return null;
 const d={id:'DRAFT-'+(M.drafts.length+1),category,eventKey:key,productId:product?.id,related:occasion?.name||product?.name||'',caption,image:product?.image||'assets/custom-cake.png',status:'pending',created:new Date().toISOString(),edited:false,regenerations:0,version:0};M.drafts.push(d);return d;
};
M.slots=p=>{
 if(!p.subscription||p.active===false||!p.available||A.subscriptions.offering(p.id)!=='available')return [];
 return A.subscriptions.availableSchedules(p.id).flatMap(s=>{for(let i=1;i<70;i++){const date=A.schedule.add(A.schedule.today(),i);if(A.schedule.day(date)===s.day&&!A.schedule.subscription(p.id,1,Array.from({length:4},(_,n)=>A.schedule.add(date,n*7))))return [{schedule:s.id,date}];}return [];});
};
M.evaluate=(weekly=false)=>{
 for(const p of A.products){const available=p.active!==false&&p.available,previous=M.events.get('product:'+p.id);if(available&&(previous===false||M.initialized&&previous===undefined))M.add('New Product','activation:'+p.id+':'+(p.marketingActivation=(p.marketingActivation||0)+1),p,p.name+' is now available. '+p.description);M.events.set('product:'+p.id,available);
 const slots=M.slots(p),signature=JSON.stringify(slots),old=M.events.get('slots:'+p.id);if(slots.length&&old!==undefined&&old!==signature)M.add('Subscription Availability',p.id+':'+signature,p,'Weekly '+p.name+' subscriptions are available from '+slots[0].date+'. Four prepaid weekly fulfillments.');M.events.set('slots:'+p.id,signature);}
 if(!weekly)return;
 const today=A.schedule.today(),from=A.schedule.add(today,-7),totals=new Map();
 for(const o of A.operations.orders()){const date=A.ownerUI.businessDate(o.paidAt);if(!o.paid||o.type==='subscription'||o.status==='cancelled'||date<from||date>=today)continue;for(const i of o.items||[])totals.set(i.productId,(totals.get(i.productId)||0)+i.quantity);}
 const best=[...totals].sort((a,b)=>b[1]-a[1]||a[0]-b[0])[0],p=A.products.find(p=>p.id===best?.[0]);if(p&&p.active!==false&&p.available)M.add('Product Highlight',A.schedule.add(today,-((A.schedule.day(today)+6)%7)),p,p.name+' was our most purchased product over the previous seven days. '+p.description);
 // Upcoming occasion window is deliberately supplied by documented scenarios.
};
M.finalize=(d,status)=>{if(!A.session.ownerAllowed()||!d||d.status!=='pending'||!['approved','rejected'].includes(status))return 'This draft cannot be reviewed again.';Object.assign(d,{status,reviewer:A.session.actor().name,reviewed:new Date().toISOString(),version:d.version+1});return '';};
M.evaluate();M.initialized=true;const changed=A.operations.changed;A.operations.changed=()=>{M.evaluate();changed();};
})();

