/* Capacity facade: one counting path per pool, stable subscription allocation history. */
(() => {
const A=K406,D=A.schedule,B=A.subscriptions,K=A.cakes;
const Q=A.capacity={blocks:new Map(),version:0,history:[],serial:0};
Q.active=a=>a.status?!['released','expired'].includes(a.status)&&(a.confirmed||a.deadline>Date.now()):a.confirmed||a.deadline>Date.now();
Q.allocations=()=>{
 const standard=A.operations.orders().filter(o=>o.type==='standard'&&!['cancelled','payment-resolution'].includes(o.status)&&(o.paid||['waiting','detected','delayed'].includes(o.payment)&&o.deadline>Date.now())).flatMap(o=>o.items.map((i,n)=>({id:o.id+':standard:'+n,orderId:o.id,pool:'standard',productId:i.productId,date:o.fulfillment.date,quantity:i.quantity,status:o.paid?'confirmed':'held'})));
 const subscriptions=D.allocations.filter(Q.active).map(a=>({...a,id:a.id,orderId:B.allRecords().find(r=>r.purchaseId===a.owner)?.deliveries.find(d=>d.cycle===a.cycle)?.orderId||a.owner,pool:'subscription',status:a.confirmed?'confirmed':'held'}));
 const cakes=K.activeHolds().filter(h=>!['cancelled','payment-resolution'].includes(A.operations.find(h.orderId)?.status)).map(h=>({id:h.id,orderId:h.orderId,pool:'cake',date:h.date,quantity:1,status:h.status}));
 return [...standard,...subscriptions,...cakes];
};
Q.summary=date=>{const all=Q.allocations(),daily=all.filter(a=>a.date===date),weekly=all.filter(a=>D.week(a.date)===D.week(date));const standard=new Map(),subscriptions=new Map();daily.filter(a=>a.pool==='standard').forEach(a=>standard.set(a.productId,(standard.get(a.productId)||0)+a.quantity));weekly.filter(a=>a.pool==='subscription').forEach(a=>subscriptions.set(a.productId,(subscriptions.get(a.productId)||0)+a.quantity));return {daily,weekly,standard,subscriptions,cakeDay:daily.filter(a=>a.pool==='cake').length,cakeWeek:weekly.filter(a=>a.pool==='cake').length};};
Q.block=(date,reason,remove=false)=>{if(!A.session.ownerAllowed())return 'Owner access required.';if(!D.valid(date))return 'Choose a valid date.';if(remove){D.config.blocked=D.config.blocked.filter(d=>d!==date);Q.blocks.delete(date);}else{if(!D.config.blocked.includes(date))D.config.blocked.push(date);Q.blocks.set(date,{date,reason:reason.trim(),actor:A.session.actor().id,at:Date.now()});}Q.version++;return '';};
Q.save=(input,version)=>{
 if(!A.session.ownerAllowed())return 'Owner access required.';if(version!==Q.version)return 'Settings changed. Reload before saving.';
 for(const key of ['standardUnits','standardVarieties','subscriptionUnits','maxPerWeek','maxPerDay'])if(!Number.isInteger(input[key])||input[key]<1)return 'Capacity limits must be positive whole numbers.';
 for(const type of ['standard','subscription','cake']){const rule=input[type];if(!rule||!Number.isFinite(rule.value)||rule.value<0||!['hours','days'].includes(rule.unit)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(rule.cutoff))return 'Enter valid lead times and cutoff times for every pool.';}
 // Capture commitments before any mutable schedule/configuration is changed.
 B.allRecords().forEach(r=>{r.snapshot.scheduleSnapshot||=A.commerce.copy(B.schedules.find(s=>s.id===r.snapshot.scheduleId)||{});});
 Object.assign(D.config,{standardUnits:input.standardUnits,standardVarieties:input.standardVarieties,subscriptionUnits:input.subscriptionUnits,timing:{standard:input.standard,subscription:input.subscription,cake:input.cake}});
 Object.assign(A.cakeData.config,{maxPerWeek:input.maxPerWeek,maxPerDay:input.maxPerDay});Q.version++;return '';
};
Q.saveSchedule=(input,version)=>{if(!A.session.ownerAllowed())return 'Owner access required.';if(version!==Q.version)return 'Settings changed. Reload before saving.';if(!input.label.trim()||![input.preparation_day,input.day].every(n=>Number.isInteger(n)&&n>=0&&n<=6)||input.product_id&&!A.products.some(p=>p.id===input.product_id&&p.subscription)||!['active','inactive'].includes(input.status))return 'Enter a label, valid weekdays, product scope and status.';B.allRecords().forEach(r=>{r.snapshot.scheduleSnapshot||=A.commerce.copy(B.schedules.find(s=>s.id===r.snapshot.scheduleId)||{});});let s=B.schedules.find(s=>s.id===input.id);if(!s){s={id:'schedule-'+crypto.randomUUID()};B.schedules.push(s);}Object.assign(s,input,{id:s.id,fulfillment_day:input.day,created_by_admin_id:A.session.actor().id});Q.version++;return '';};
Q.reset=()=>{Q.blocks.clear();Q.history=[];Q.version=0;Q.serial=0;};
})();
