/* In-memory subscription commitments; no live payment or courier calls. */
(() => {
const A=K406,C=A.commerce,D=A.schedule;
const blank=()=>({productId:null,variant:'standard',quantity:1,scheduleId:'friday',start:'',addressId:'',method:'delivery',quote:'ok',revision:0});
const weekdays=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
// Keep the shared schedule IDs available for historical enrollment snapshots.
const legacySchedules=[5,6,2].map(day=>({id:weekdays[day].toLowerCase(),label:'Weekly '+weekdays[day],day,fulfillment_day:day,preparation_day:(day+6)%7,status:'active'}));
const defaultSchedule=legacySchedules[0];
const schedules=A.products.filter(p=>p.subscription).map(p=>({...defaultSchedule,id:defaultSchedule.id+'-'+p.id,legacy_schedule_id:defaultSchedule.id,product_id:p.id}));
const B=A.subscriptions={routes:['subscriptions','subscription','my-subscriptions'],state:{draft:blank(),purchases:[],records:[],serial:2000},mock:{page:'normal',catalog:'normal',schedule:'normal',review:'normal',price:'normal',defer:'normal'},addressUI:{form:null,editing:null,mapBusy:false},schedules,parts:[],message:'',filter:'all',query:'',sort:'newest'};
const S=B.state;
B.weekdays=weekdays;
B.scheduleById=id=>B.schedules.find(s=>s.id===id)||legacySchedules.find(s=>s.id===id);
B.active=()=>B.routes.includes(A.route);
B.address=()=>C.state.addresses.find(a=>a.address_id===S.draft.addressId&&a.status==='active');
B.product=()=>A.products.find(p=>p.id===S.draft.productId);
B.variant=()=>A.variant(S.draft.productId,S.draft.variant);
B.availableSchedules=(productId=S.draft.productId)=>{
 const rows=B.schedules.filter(s=>s.product_id===Number(productId));
 const configured=rows.filter(s=>s.inventoryVersion);
 if(!rows.length&&A.products.some(p=>p.id===Number(productId)&&p.subscription)){
  return [{...defaultSchedule,id:'friday-'+productId,product_id:Number(productId)}];
 }
 return (configured.length?configured:rows).filter(s=>s.status!=='inactive');
};
B.schedule=()=>B.availableSchedules()[0];
B.dates=(d=S.draft)=>d.start?Array.from({length:4},(_,i)=>D.add(d.start,i*7)):[];
B.offering=id=>B.offeringSettings?.[id]===false?'unavailable':B.offeringSettings?.[id]===true?'available':B.mock.catalog==='full'?'full':B.mock.catalog==='unavailable'?'unavailable':B.mock.catalog==='available'?'available':Number(id)===2?'full':Number(id)===5?'unavailable':'available';
B.enrollmentReason=(productId,quantity,dates,schedule,exclude)=>{
 if(!dates.length||!Number.isInteger(schedule?.preparation_day))return 'The bakery schedule is unavailable.';
 if(D.now()>=D.enrollmentCutoff(dates[0],productId,schedule.preparation_day))return 'Enrollment for this cycle has closed. Return to the subscription catalog to start with a later cycle.';
 return D.subscription(productId,quantity,dates,exclude);
};
B.starts=()=>{
 const schedule=B.schedule();
 if(!schedule)return [];
 const starts=[],today=D.today(),pending=B.pending(),exclude=pending?.paid?null:pending?.id;
 for(let i=1;i<70;i++){
  const date=D.add(today,i);
  if(D.day(date)===schedule.day&&!B.enrollmentReason(S.draft.productId,S.draft.quantity,B.dates({start:date}),schedule,exclude))starts.push(date);
 }
 return starts;
};
B.pending=()=>S.purchases.find(p=>p.id===S.draft.purchaseId);
B.locked=()=>S.purchases.some(p=>['detected','delayed'].includes(p.payment)||C.confirmationWindow(p));
B.change=()=>{if(B.locked()){A.toast('Payment verification is pending. Check its status before changing your subscription.');return false;}const p=B.pending();if(p&&!p.persistedSubscription&&!p.paid&&p.payment!=='cancelled'){p.payment='revalidation';D.release(p.id);}S.draft.revision++;B.message='';return true;};
B.begin=(id,variant,quantity=1)=>{if(!B.change())return false;const p=A.products.find(p=>p.id===Number(id));variant??=p?.variants.find(v=>v.active!==false)?.id;if(!p?.subscription||B.offering(p.id)!=='available'||A.variant(id,variant)?.active===false)return false;S.draft={...blank(),productId:p.id,variant:A.variant(id,variant)?variant:'standard',quantity:Math.min(D.subscriptionLimit(id),Math.max(1,quantity)),addressId:C.state.addresses.find(a=>a.is_default&&a.status==='active')?.address_id||C.state.addresses.find(a=>a.status==='active')?.address_id||''};S.draft.scheduleId=B.availableSchedules()[0]?.id||'';S.draft.start=B.starts()[0]||'';B.deliveryRoute?.reset();B.addressUI.form=null;B.mock.review='normal';B.mock.price='normal';return true;};
B.configReason=()=>{if(!B.product()?.subscription||!B.variant())return 'Choose a subscription product and variant.';if(B.offering(S.draft.productId)!=='available')return 'This product is currently unavailable for subscription enrollment.';if(B.mock.schedule!=='normal')return 'The bakery schedule is currently unavailable.';const schedule=B.schedule();if(!schedule||!S.draft.start||D.day(S.draft.start)!==schedule.day)return 'The bakery schedule or first delivery date is unavailable.';return B.enrollmentReason(S.draft.productId,S.draft.quantity,B.dates(),schedule,B.pending()?.paid?null:B.pending()?.id);};
B.totals=(unit=(B.variant()?.price||0)+(B.mock.price==='updated'?20:0),quantity=S.draft.quantity,fee=0)=>{
 const quotations=S.draft.method==='delivery'?B.deliveryRoute?.quotations?.()||[]:[];
 const fees=quotations.length?quotations.map(quote=>quote.fee):null;
 const delivery=fees?fees.reduce((cents,amount)=>cents+Math.round(amount*100),0)/100:fee*4;
 const products=unit*quantity*4;
 return {method:S.draft.method,unit,quantity,fee,fees,quotations,delivery,products,total:Math.round((products+delivery)*100)/100};
};
B.ready=()=>!B.configReason()&&(S.draft.method==='pickup'||S.draft.method==='delivery'&&C.addressValid(B.address())&&B.deliveryRoute?.eligible()&&(B.deliveryRoute?.provider?.()||S.draft.quote==='ok')&&!B.addressUI.form);
B.setMethod=method=>{if(!['delivery','pickup'].includes(method)||method===S.draft.method||!B.change())return false;S.draft.method=method;B.addressUI.form=null;B.addressUI.editing=null;B.deliveryRoute?.reset();return true;};
B.snapshot=()=>({productId:S.draft.productId,variantId:S.draft.variant,name:B.product().name,image:B.product().image,variant:B.variant().label,quantity:S.draft.quantity,scheduleId:B.schedule().id,schedule:B.schedule().label,scheduleSnapshot:C.copy(B.schedule()),dates:B.dates(),address:S.draft.method==='pickup'?null:C.copy(B.address()),courierDestination:C.copy(B.deliveryRoute?.destination?.()||null),...B.totals()});
B.reserveAttempt=(candidate,previous)=>{
 const snap=candidate.snapshot,exclude=previous?[candidate.id,previous.id]:candidate.id;
 const schedule=B.availableSchedules(snap.productId).find(s=>s.id===snap.scheduleId);
 const variant=A.variant(snap.productId,snap.variantId);
 if(!variant||variant.active===false||B.offering(snap.productId)!=='available')return 'The subscription product or variant is unavailable.';
 if(!schedule||snap.dates.length!==4||snap.dates.some((date,index)=>!D.valid(date)||D.day(date)!==schedule.day||date!==D.add(snap.dates[0],index*7)))return 'Review the subscription schedule before continuing.';
 const reason=B.enrollmentReason(snap.productId,snap.quantity,snap.dates,snap.scheduleSnapshot||schedule,exclude);
 if(reason)return reason;
 const before=D.allocations,serial=D.allocationSerial,historyLength=A.capacity?.history.length;
 const allocations=before.filter(a=>a.owner===candidate.id).map(a=>[a,{...a}]);
 const capacityError=D.reserve(candidate.id,snap.productId,snap.quantity,snap.dates,false,C.holdUntil(candidate),exclude);
 if(capacityError)return capacityError;
 const materialError=B.reserveIngredients?.(candidate,exclude);
 if(materialError){
  D.allocations=before;D.allocationSerial=serial;
  for(const [allocation,saved] of allocations)Object.assign(allocation,saved);
  if(A.capacity)A.capacity.history.length=historyLength;
  return materialError;
 }
 return '';
};
B.createPurchase=()=>{
 if(A.auth!=='signedin'||!B.ready()||B.mock.review!=='normal'||B.locked())return null;
 const snapshot=B.snapshot(),old=B.pending();
 if(snapshot.method==='delivery'&&B.deliveryRoute?.provider?.()&&snapshot.quotations.length!==snapshot.dates.length)return null;
 if(old?.reconciliationRequired){B.message=old.paymentCheckMessage;return null;}
 if(old&&!old.paid&&old.payment==='waiting'&&old.revision===S.draft.revision&&C.holdUntil(old)>Date.now()&&old.snapshot.unit===snapshot.unit&&old.snapshot.fee===snapshot.fee&&JSON.stringify(old.snapshot.fees||null)===JSON.stringify(snapshot.fees||null)&&JSON.stringify(old.snapshot.quotations||[])===JSON.stringify(snapshot.quotations))return old;
 const p={id:'SUB-PAY-'+(++S.serial),snapshot,revision:S.draft.revision,payment:'waiting',paid:false,created:Date.now(),attempts:[]};
 C.beginAttempt(p,p.created);
 const reason=B.reserveAttempt(p,old&&!old.paid?old:null);
 if(reason){B.message=reason;return null;}
 if(old&&!old.paid)B.cancel(old);
 S.purchases.unshift(p);S.draft.purchaseId=p.id;B.message='';return p;
};
B.cancel=p=>{if(!p||p.paid||['detected','delayed'].includes(p.payment))return false;p.payment='cancelled';D.release(p.id);return true;};
B.retry=p=>{
 if(!p||p.paid||p.reconciliationRequired||!['failed','expired'].includes(p.payment))return false;
 const candidate={...p,attempts:[...p.attempts]};C.beginAttempt(candidate);
 const reason=B.reserveAttempt(candidate);
 if(reason){B.message=reason;return false;}
 Object.assign(p,candidate,{payment:'waiting',status:'pending-payment',checkoutClosed:false,refundIfPaid:false,paymentCheckMessage:''});B.message='';return true;
};
B.pay=(p,state)=>{
 if(!p||p.paid||p.payment==='cancelled'&&state!=='confirmed')return;
 if(state!=='confirmed'){
  p.payment=state;
  if(p.attempts.length)p.attempts.at(-1).state=state;
  if(['failed','expired','revalidation'].includes(state))D.release(p.id);
  return;
 }
 const bucket=p.customer_id&&A.account?.id()!==p.customer_id?A.account?.buckets.get(p.customer_id):null;
 const subscriptions=bucket?.subscription||S,commerce=bucket?.commerce||C.state;
 if(subscriptions.records.some(record=>record.purchaseId===p.id))return;
 const snap=p.snapshot,paidAt=new Date().toLocaleString();
 const resolve=reason=>{
  D.release(p.id);p.paid=true;p.paidAt=paidAt;p.payment='resolution';p.resolution=reason;
 };
 const held=D.heldSubscription(p.id,snap.productId,snap.quantity,snap.dates);
 const schedule=snap.scheduleSnapshot||B.scheduleById(snap.scheduleId);
 const capacityIssue=held.length?'':B.enrollmentReason(snap.productId,snap.quantity,snap.dates,schedule,p.id);
 if(capacityIssue){resolve(capacityIssue);return;}
 const subscriptionSerial=Math.max(S.serial,subscriptions.serial),orderSerial=Math.max(C.state.serial,commerce.serial);
 const record={id:'SUB-'+(subscriptionSerial+1),purchaseId:p.id,customer_id:p.customer_id,snapshot:C.copy(snap),status:'active',completedCount:0,remainingCount:4,created:p.created,deferments:[],deliveries:[]};
 const productCents=Math.round((snap.products??snap.unit*snap.quantity*4)*100);
 const orders=snap.dates.map((date,index)=>{
  const cycle=index+1,id=record.id+'-D'+cycle,orderId='K406-'+(orderSerial+cycle);
  const productAmount=(Math.round(productCents*cycle/4)-Math.round(productCents*index/4))/100;
  const preparationDay=snap.scheduleSnapshot?.preparation_day;
  const preparationDate=Number.isInteger(preparationDay)?D.add(date,-((D.day(date)-preparationDay+7)%7)):null;
  const fee=snap.fees?.[index]??snap.fee;
  record.deliveries.push({id,cycle,date,originalDate:date,preparationDate,status:'pending',orderId});
  return {id:orderId,type:'subscription',subscriptionId:record.id,deliveryId:id,prepaid:true,customer_id:p.customer_id,
   items:[{key:snap.productId+':'+snap.variantId,productId:snap.productId,name:snap.name,image:snap.image,variant:snap.variant,quantity:snap.quantity,price:snap.unit,productAmount}],
   fulfillment:{method:snap.method||'delivery',date,preparationDate},address:C.copy(snap.address),fee,total:Math.round((productAmount+fee)*100)/100,courierQuotation:C.copy(snap.quotations?.[index]||null),courierDestination:C.copy(snap.courierDestination||null),
   paid:true,paidAt,status:'confirmed',payment:'confirmed',created:p.created,reference:p.id,attempts:[],activity:[{text:'Included in prepaid subscription '+record.id,at:paidAt}]};
 });
 let resources;
 try{resources=B.prepareActivation?.(p,orders);}catch(error){
  console.error('Subscription activation could not be staged',p.id,error);
  p.payment='detected';return;
 }
 if(resources?.error){resolve(resources.error);return;}
 const previousAllocations=D.allocations,historySize=A.capacity?.history.length,allocationSerial=D.allocationSerial;
 try{
  if(!held.length){
   const error=D.reserve(p.id,snap.productId,snap.quantity,snap.dates,true);
   if(error){resolve(error);return;}
  }
  const allocations=D.heldSubscription(p.id,snap.productId,snap.quantity,snap.dates);
  record.deliveries.forEach(d=>{d.capacityAllocationId=allocations.find(a=>a.cycle===d.cycle)?.id;});
  resources?.commit();
  held.forEach(a=>{a.confirmed=true;});
 }catch(error){
  D.allocations=previousAllocations;D.allocationSerial=allocationSerial;
  if(A.capacity)A.capacity.history.length=historySize;
  console.error('Subscription activation could not be saved',p.id,error);
  p.payment='detected';return;
 }
 S.serial=subscriptions.serial=subscriptionSerial+1;C.state.serial=commerce.serial=orderSerial+orders.length;
 commerce.orders.unshift(...orders.slice().reverse());subscriptions.records.unshift(record);
 p.paid=true;p.paidAt=paidAt;p.status='confirmed';p.payment='confirmed';p.subscriptionId=record.id;
 if(p.attempts.length)p.attempts.at(-1).state='confirmed';
 return record;
};
B.progressPlan=(record,change)=>{
 const invalid=()=>({error:'Subscription progress could not be verified. Check the linked fulfillments and retry.'});
 if(!record||!['active','completed'].includes(record.status)||record.deliveries?.length!==4||record.deliveries.some(d=>!d?.id||!d.orderId)||new Set(record.deliveries.map(d=>d.id)).size!==4||new Set(record.deliveries.map(d=>d.orderId)).size!==4)return invalid();
 const paidPurchase=p=>p.id===record.purchaseId&&p.paid&&p.subscriptionId===record.id;
 if(!S.purchases.some(paidPurchase)&&![...(A.account?.buckets?.values()||[])].some(bucket=>bucket.subscription?.purchases?.some(paidPurchase)))return invalid();
 if(change&&!record.deliveries.some(d=>d.orderId===change.id))return invalid();
 const orders=A.inventory?.allOrders()||C.state.orders;
 const updates=[];
 for(const delivery of record.deliveries){
  const order=orders.find(o=>o.id===delivery.orderId);
  if(!order?.paid||order.type!=='subscription'||order.subscriptionId!==record.id||order.deliveryId!==delivery.id||order.reference!==record.purchaseId)return invalid();
  const status=change?.id===order.id?change.status:A.staff?.orderStatus(order)||order.status;
  const completedAt=change?.id===order.id?change.completedAt:order.completedAt;
  if(status==='completed'&&!Number.isFinite(completedAt))return invalid();
  updates.push({delivery,status:({confirmed:'scheduled','ready-pickup':'ready','ready-delivery':'ready',completed:'fulfilled'})[status]||status,completedAt:status==='completed'?completedAt:null});
 }
 const completedCount=updates.filter(update=>update.status==='fulfilled').length;
 const previous={status:record.status,completedCount:record.completedCount,remainingCount:record.remainingCount};
 const previousDeliveries=updates.map(({delivery})=>[delivery,delivery.status,delivery.fulfilled_at]);
 return {completedCount,rollback(){
  for(const [key,value] of Object.entries(previous)){if(value===undefined)delete record[key];else record[key]=value;}
  for(const [delivery,status,at] of previousDeliveries){
   delivery.status=status;
   if(at===undefined)delete delivery.fulfilled_at;else delivery.fulfilled_at=at;
  }
 },commit(){
  const previouslyCompleted=record.status==='completed';
  for(const {delivery,status,completedAt} of updates){
   delivery.status=status;
   if(completedAt!==null)delivery.fulfilled_at=completedAt;
   else delete delivery.fulfilled_at;
  }
  Object.assign(record,{completedCount,remainingCount:4-completedCount,status:completedCount===4?'completed':'active'});
  if(!previouslyCompleted&&record.status==='completed')A.notifications?.emit('subscription-completed-'+record.id,'subscriptions','Subscription completed','All four fulfillments in this subscription are complete.','subscriptions/'+record.id,record.customer_id);
 }};
};
B.progressForOrder=(order,status,completedAt)=>{
 if(order.type!=='subscription')return {};
 const record=B.allRecords().find(r=>r.id===order.subscriptionId);
 const plan=B.progressPlan(record,{id:order.id,status,completedAt});
 if(plan.error)console.warn(plan.error,order.id);
 return plan;
};
B.sync=record=>{B.progressPlan(record).commit?.();return record;};
B.reviewable=record=>!!record&&A.account?.owns(record)&&record.status==='completed'&&B.progressPlan(record).completedCount===4;
B.next=record=>record.deliveries.filter(d=>!['fulfilled','cancelled'].includes(d.status)).sort((a,b)=>a.date.localeCompare(b.date))[0];
B.deferTarget=(record,delivery,option)=>option==='day'?D.add(delivery.date,1):D.add(record.deliveries.map(d=>d.date).sort().at(-1),7);
B.replacementReason=(record,delivery,date)=>{
 const reason=D.base(date,record.snapshot.productId,{replacement:true});if(reason)return reason;
 const old=D.allocations.filter(a=>a.owner===record.purchaseId),other=old.filter(a=>a.cycle!==delivery.cycle&&D.week(a.date)===D.week(date)).reduce((n,a)=>n+a.quantity,0);
 if(D.used(record.snapshot.productId,date,record.purchaseId)+other+record.snapshot.quantity>D.subscriptionLimit(record.snapshot.productId))return 'Subscription capacity reached';
 return '';
};
B.deferEligibility=(record,delivery)=>{
 if(!record||!delivery||!record.deliveries.includes(delivery))return 'Delivery not found.';
 const order=(record.persistedSubscription?C.state.orders:A.inventory?.allOrders()||C.state.orders).find(o=>o.id===delivery.orderId);
 if(record.deferments.length||B.mock.defer==='used')return 'Your one deferment has already been used.';
 if(record.status!=='active'||delivery.status==='fulfilled'||delivery.date<=D.today()||order?.status!=='confirmed')return 'This delivery can no longer be deferred.';
 const preparation=delivery.preparationDate||order.fulfillment.preparationDate||B.preparationDate?.(order);
 if(!D.valid(preparation))return 'The preparation date could not be verified.';
 if(D.today()>=preparation)return 'The preparation date has arrived.';
 return '';
};
B.deferReason=(record,delivery,option)=>{
 const eligibility=B.deferEligibility(record,delivery);if(eligibility)return eligibility;
 if(!['day','week'].includes(option))return 'Choose one of the available replacement dates.';
 if(['loading','error'].includes(B.mock.defer))return B.mock.defer==='loading'?'Checking replacement availability…':'Unable to check availability. Please try again.';
 if(B.mock.defer==='unavailable'||B.mock.defer===option)return 'This replacement date is unavailable.';
 return B.replacementReason(record,delivery,B.deferTarget(record,delivery,option));
};
B.applyDefer=(record,delivery,option,notes='')=>{
 if(!A.session?.ownerAllowed()&&(A.auth!=='signedin'||!A.account.allowed()||!A.account.owns(record)))return 'Subscription account access required.';
 const reason=B.deferReason(record,delivery,option);if(reason)return reason;
 const date=B.deferTarget(record,delivery,option),oldDate=delivery.date;
 const allocationIndex=D.allocations.findIndex(a=>a.owner===record.purchaseId&&a.cycle===delivery.cycle&&a.date===oldDate&&a.confirmed);
 const allocation=D.allocations[allocationIndex];
 if(!allocation||delivery.capacityAllocationId&&delivery.capacityAllocationId!==allocation.id)return 'The original reservation could not be verified.';
 const order=(A.inventory?.allOrders()||C.state.orders).find(o=>o.id===delivery.orderId);
 if(!order||order.subscriptionId!==record.id||order.deliveryId!==delivery.id||order.fulfillment.date!==oldDate)return 'The fulfillment changed. Review the schedule before retrying.';
 const schedule=record.snapshot.scheduleSnapshot||B.scheduleById(record.snapshot.scheduleId);
 const preparationDay=schedule?.preparation_day;
 if(!Number.isInteger(preparationDay))return 'The replacement preparation date could not be verified.';
 const preparationDate=D.add(date,-((D.day(date)-preparationDay+7)%7));
 const reserveAt=delivery.cycle===1?order.reserveAt:D.add(preparationDate,-1);
 const requirementRows=[...(A.inventory?.requirementRows?.values()||[])].filter(row=>row.order_id===order.id);
 const now=Date.now();
 const request={id:'DEFER-'+crypto.randomUUID(),subscriptionId:record.id,deliveryId:delivery.id,originalDate:oldDate,target:date,option,notes,status:'applied',created:now};
 if(B.mock.defer==='save-error')return 'The deferment could not be saved. Your schedule and allowance are unchanged. Please retry.';

 // All validation is complete. Save the related in-memory records before notifying other views.
 const replacement={...allocation,id:D.nextAllocationId(),date};
 const history={deliveryId:delivery.id,option,originalDate:oldDate,newDate:date,originalPreparationDate:delivery.preparationDate||order.fulfillment.preparationDate,newPreparationDate:preparationDate,originalAllocation:{...allocation},at:new Date(now).toLocaleString(),original_allocation_id:allocation.id,replacement_allocation_id:replacement.id};
 if(A.capacity)A.capacity.history.push({...allocation,status:'released',released_at:now});
 D.allocations[allocationIndex]=replacement;
 Object.assign(delivery,{date,preparationDate,capacityAllocationId:replacement.id,status:'deferred'});
 Object.assign(order.fulfillment,{date,preparationDate});
 if(reserveAt!==undefined)order.reserveAt=reserveAt;
 if(order.materialReservationIssue&&order.materialReservationIssue.due!==reserveAt){
  delete order.materialReservationIssue;delete order.materialIssue;
 }
 for(const row of requirementRows)Object.assign(row,{fulfillment_date:date,reserve_at:reserveAt??row.reserve_at});
 order.activity.unshift({text:'Delivery deferred from '+oldDate+' to '+date,at:history.at});
 record.deferments.push(history);B.requests.push(request);
 return '';
};
B.requests=[];B.offeringSettings={};
B.defer=(record,delivery,option,notes='')=>{
 if(A.auth!=='signedin'||A.account&&(!A.account.allowed()||record?.customer_id&&!A.account.owns(record)))return 'Sign in with the subscription customer account.';
 const error=B.applyDefer(record,delivery,option,notes);
 if(!error)A.operations.changed();
 return error;
};
B.reviewRequest=()=> 'Deferment history is read-only; eligible changes are applied automatically.';
B.reset=()=>{B.requests=[];B.offeringSettings={};A.resetProductData?.();B.deferOption='day';B.confirmation=null;S.draft=blank();S.purchases=[];S.records=[];B.addressUI.form=null;B.deliveryRoute?.reset();D.reset();Object.keys(B.mock).forEach(k=>B.mock[k]='normal');B.message='';B.query='';B.filter='all';B.category='all';};
})();
