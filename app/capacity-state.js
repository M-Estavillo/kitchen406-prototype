/* Capacity facade: one counting path per pool, stable subscription allocation history. */
(() => {
const A=K406,D=A.schedule,B=A.subscriptions,K=A.cakes;
const Q=A.capacity={blocks:new Map(),version:0,history:[],serial:0};
Q.active=a=>a.status?!['released','expired'].includes(a.status)&&(a.confirmed||(A.checkoutHolds?.retained(a.owner,a.deadline)??a.deadline>Date.now())):a.confirmed||(A.checkoutHolds?.retained(a.owner,a.deadline)??a.deadline>Date.now());
Q.allocations=()=>{
 const standard=A.operations.orders().filter(o=>o.type==='standard'&&!['cancelled','payment-resolution'].includes(o.status)&&(o.paid||['waiting','detected','delayed'].includes(o.payment)&&(A.checkoutHolds?.retained(o.id,A.commerce.holdUntil(o))??A.commerce.holdUntil(o)>Date.now()))).flatMap(o=>o.items.map((i,n)=>({id:o.id+':standard:'+n,orderId:o.id,pool:'standard',productId:i.productId,date:o.fulfillment.date,quantity:i.quantity,status:o.paid?'confirmed':'held'})));
 const subscriptions=D.allocations.filter(Q.active).map(a=>({...a,id:a.id,orderId:B.allRecords().find(r=>r.purchaseId===a.owner)?.deliveries.find(d=>d.cycle===a.cycle)?.orderId||a.owner,pool:'subscription',status:a.confirmed?'confirmed':'held'}));
 const cakes=K.activeHolds().filter(h=>!['cancelled','payment-resolution'].includes(A.operations.find(h.orderId)?.status)).map(h=>({id:h.id,orderId:h.orderId,pool:'cake',date:h.date,quantity:1,status:h.status}));
 return [...standard,...subscriptions,...cakes];
};
Q.summary=date=>{const all=Q.allocations(),daily=all.filter(a=>a.date===date),weekly=all.filter(a=>D.week(a.date)===D.week(date));const standard=new Map(),subscriptions=new Map();daily.filter(a=>a.pool==='standard').forEach(a=>standard.set(a.productId,(standard.get(a.productId)||0)+a.quantity));weekly.filter(a=>a.pool==='subscription').forEach(a=>subscriptions.set(a.productId,(subscriptions.get(a.productId)||0)+a.quantity));return {daily,weekly,standard,subscriptions,cakeDay:daily.filter(a=>a.pool==='cake').length,cakeWeek:weekly.filter(a=>a.pool==='cake').length};};
Q.block=async(date,reason,remove=false)=>{
 if(!A.session.ownerAllowed())return 'Owner access required.';
 if(!D.valid(date))return 'Choose a valid date.';
 try{
  const {blocked}=await A.authUI.api('ordering/blocked-date',{date,reason:reason.trim(),remove});
  A.pickup.applyBlocks(blocked);Q.version++;return '';
 }catch(error){return error.message;}
};
Q.save=async(input,version)=>{
 if(!A.session.ownerAllowed())return 'Owner access required.';if(version!==Q.version)return 'Settings changed. Reload before saving.';
 for(const key of ['standardUnits','standardVarieties','subscriptionUnits','maxPerWeek','maxPerDay'])if(!Number.isInteger(input[key])||input[key]<1)return 'Capacity limits must be positive whole numbers.';
 for(const type of ['subscription','cake']){const rule=input[type];if(!rule||!Number.isFinite(rule.value)||rule.value<0||!['hours','days'].includes(rule.unit)||!/^([01]\d|2[0-3]):[0-5]\d$/.test(rule.cutoff))return 'Enter valid lead times and cutoff times.';}
 if(input.maxPerDay>input.maxPerWeek)return 'Daily cake capacity cannot exceed weekly cake capacity.';
 try{
  await A.authUI.api('ordering/capacity',{units:input.standardUnits,varieties:input.standardVarieties,
   subscription:{units:input.subscriptionUnits,...input.subscription}});
 }catch(error){return error.message;}
 // Capture commitments before any mutable schedule/configuration is changed.
 B.allRecords().forEach(r=>{r.snapshot.scheduleSnapshot||=A.commerce.copy(B.scheduleById(r.snapshot.scheduleId)||{});});
 Object.assign(D.config,{standardUnits:input.standardUnits,standardVarieties:input.standardVarieties,subscriptionUnits:input.subscriptionUnits,timing:{subscription:input.subscription,cake:input.cake}});
 Object.assign(A.cakeData.config,{maxPerWeek:input.maxPerWeek,maxPerDay:input.maxPerDay});Q.version++;return '';
};
function preserveSchedule(schedule){
 for(const record of B.allRecords().filter(r=>r.snapshot.scheduleId===schedule.id)){
  record.snapshot.scheduleSnapshot||=A.commerce.copy(schedule);
 }
}
Q.syncSchedules=rows=>{
 for(const row of rows){
  const existing=B.schedules.find(schedule=>schedule.id===row.schedule_id);
  if(existing?.inventoryVersion===row.updated_at&&existing.status===row.status)continue;
  if(existing)preserveSchedule(existing);
  const schedule={id:row.schedule_id,product_id:row.product_id,preparation_day:row.preparation_day,
   day:row.fulfillment_day,fulfillment_day:row.fulfillment_day,status:row.status,
   label:'Weekly '+B.weekdays[row.fulfillment_day],created_by_admin_id:row.created_by_admin_id,inventoryVersion:row.updated_at};
  if(existing)Object.assign(existing,schedule);
  else B.schedules.push(schedule);
  Q.version++;
 }
};
Q.deactivateProductSchedules=productId=>{
 if(!A.session.ownerAllowed())return;
 const schedules=B.availableSchedules(productId);
 if(!schedules.length)return;
 for(const schedule of schedules){
  preserveSchedule(schedule);
  schedule.status='inactive';
 }
 Q.version++;
};
Q.scheduleError=({id,product_id,preparation_day,day,status},version,eligible)=>{
 if(!A.session.ownerAllowed())return 'Owner access required.';
 if(version!==Q.version)return 'Settings changed. Reload before saving.';
 if(!(eligible??A.products.some(p=>p.id===product_id&&p.subscription))||
  ![preparation_day,day].every(n=>Number.isInteger(n)&&n>=0&&n<=6)||
  !['active','inactive'].includes(status))return 'Choose a subscription product, valid weekdays, and a status.';
 const current=B.schedules.find(s=>s.id===id)||B.availableSchedules(product_id).find(s=>s.id===id);
 if(id&&!current)return 'This offering is unavailable. Reopen the list.';
 if(preparation_day===day&&!(status==='inactive'&&current?.preparation_day===preparation_day&&current.day===day)){
  return 'Preparation and fulfillment must fall on different weekdays.';
 }
 return '';
};
Q.schedulePreview=(productId,preparation,fulfillment)=>{
 if(![preparation,fulfillment].every(day=>Number.isInteger(day)&&day>=0&&day<=6))return 'Choose two weekdays to preview the schedule.';
 const current=B.availableSchedules(productId)[0];
 const existing=current?'Current: '+B.weekdays[current.preparation_day]+' preparation, '+B.weekdays[current.day]+' fulfillment. ':'';
 const gap=(fulfillment-preparation+7)%7;
 return existing+(gap?
  'Proposed: '+B.weekdays[preparation]+' preparation, '+B.weekdays[fulfillment]+' fulfillment ('+gap+' day'+(gap===1?'':'s')+' later).':
  'Choose different weekdays for preparation and fulfillment.');
};
Q.saveSchedule=({id,product_id,preparation_day,day,status},version)=>{
 const error=Q.scheduleError({id,product_id,preparation_day,day,status},version);
 if(error)return error;
 let schedule=B.schedules.find(s=>s.id===id);
 if(schedule){
  preserveSchedule(schedule);
 }else{
  schedule={id:'schedule-'+crypto.randomUUID()};
  B.schedules.push(schedule);
 }
 Object.assign(schedule,{product_id,preparation_day,day,fulfillment_day:day,status,label:'Weekly '+B.weekdays[day],created_by_admin_id:A.session.actor().id});
 Q.version++;
 return '';
};
Q.reset=()=>{Q.blocks.clear();Q.history=[];Q.version=0;Q.serial=0;};
})();
