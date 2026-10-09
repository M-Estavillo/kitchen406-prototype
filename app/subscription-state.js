/* In-memory subscription commitments; no live payment or courier calls. */
(() => {
const A=K406,C=A.commerce,D=A.schedule;
const blank=()=>({productId:null,variant:'standard',quantity:1,scheduleId:'friday',start:'',addressId:'home',method:'delivery',quote:'ok',revision:0});
const B=A.subscriptions={routes:['subscriptions','subscription','my-subscriptions'],state:{draft:blank(),purchases:[],records:[],serial:2000},mock:{page:'normal',catalog:'normal',schedule:'normal',review:'normal',price:'normal',defer:'normal'},addressUI:{form:null,editing:null,mapBusy:false},schedules:[{id:'friday',label:'Weekly Friday',day:5},{id:'saturday',label:'Weekly Saturday',day:6},{id:'tuesday',label:'Weekly Tuesday',day:2}],parts:[],message:'',filter:'all',query:'',sort:'newest'};
const S=B.state;
B.active=()=>B.routes.includes(A.route);
B.address=()=>C.state.addresses.find(a=>a.address_id===S.draft.addressId&&a.status==='active');
B.product=()=>A.products.find(p=>p.id===S.draft.productId);
B.variant=()=>A.variant(S.draft.productId,S.draft.variant);
B.availableSchedules=(productId=S.draft.productId)=>{const active=B.schedules.filter(s=>s.status!=='inactive');const specific=active.filter(s=>Number(s.product_id)===Number(productId));return specific.length?specific:active.filter(s=>!s.product_id);};
B.schedule=()=>B.availableSchedules().find(x=>x.id===S.draft.scheduleId);
B.dates=(d=S.draft)=>d.start?Array.from({length:4},(_,i)=>D.add(d.start,i*7)):[];
B.offering=id=>B.mock.catalog==='full'?'full':B.mock.catalog==='unavailable'?'unavailable':B.mock.catalog==='available'?'available':Number(id)===2?'full':Number(id)===5?'unavailable':'available';
B.starts=()=>{const schedule=B.schedule();if(!schedule)return [];const dates=[];for(let i=1;i<70;i++){const date=D.add(D.today(),i);if(D.day(date)===schedule.day&&!D.subscription(S.draft.productId,S.draft.quantity,Array.from({length:4},(_,n)=>D.add(date,n*7)),(B.pending()?.paid?null:B.pending()?.id)))dates.push(date);}return dates;};
B.pending=()=>S.purchases.find(p=>p.id===S.draft.purchaseId);
B.locked=()=>S.purchases.some(p=>['detected','delayed'].includes(p.payment));
B.change=()=>{if(B.locked()){A.toast('Payment verification is pending. Check its status before changing your subscription.');return false;}const p=B.pending();if(p&&!p.paid&&p.payment!=='cancelled'){p.payment='revalidation';D.release(p.id);}S.draft.revision++;B.message='';return true;};
B.begin=(id,variant=null,quantity=1)=>{if(!B.change())return false;const p=A.products.find(p=>p.id===Number(id));variant ||= p?.variants.find(v=>!['inactive','unavailable'].includes(v.status))?.id||'standard';if(!p?.subscription||(A.catalogState&&!A.catalogState.eligible(id,variant))||B.offering(p.id)!=='available')return false;S.draft={...blank(),productId:p.id,variant:A.variant(id,variant)?variant:'standard',quantity:Math.min(D.config.subscriptionUnits,Math.max(1,quantity)),addressId:C.state.addresses.find(a=>a.is_default&&a.status==='active')?.address_id||C.state.addresses.find(a=>a.status==='active')?.address_id||''};if(!B.schedule())S.draft.scheduleId=B.availableSchedules()[0]?.id||'';S.draft.start=B.starts()[0]||'';B.deliveryRoute?.reset();B.addressUI.form=null;B.mock.review='normal';B.mock.price='normal';return true;};
B.configReason=()=>{if(A.catalogState&&!A.catalogState.eligible(S.draft.productId,S.draft.variant))return 'This catalog product or variant is not available.';if(!B.product()?.subscription||!B.variant())return 'Choose a subscription product and variant.';if(B.offering(S.draft.productId)!=='available')return 'This product is currently unavailable for subscription enrollment.';if(B.mock.schedule!=='normal')return 'Choose an available schedule.';if(!B.schedule()||!S.draft.start||D.day(S.draft.start)!==B.schedule().day)return 'Select a schedule and first delivery date.';return D.subscription(S.draft.productId,S.draft.quantity,B.dates(),(B.pending()?.paid?null:B.pending()?.id));};
B.totals=(unit=B.variant()?.price||0,quantity=S.draft.quantity,fee=A.quoteFee())=>({unit,quantity,fee,products:unit*quantity*4,delivery:fee*4,total:unit*quantity*4+fee*4});
B.ready=()=>!B.configReason()&&C.addressValid(B.address())&&B.deliveryRoute?.eligible()&&S.draft.quote==='ok'&&!B.addressUI.form;
B.snapshot=()=>({productId:S.draft.productId,variantId:S.draft.variant,name:B.product().name,image:B.product().image,variant:B.variant().label,quantity:S.draft.quantity,scheduleId:S.draft.scheduleId,schedule:B.schedule().label,scheduleSnapshot:C.copy(B.schedule()),dates:B.dates(),address:C.copy(B.address()),...B.totals()});
B.createPurchase=()=>{
 if(A.auth!=='signedin'||!B.ready()||B.mock.review!=='normal'||B.mock.price!=='normal'||B.locked())return null;
 const old=B.pending();if(old&&!old.paid&&old.payment==='waiting'&&old.revision===S.draft.revision&&old.deadline>Date.now())return old;
 if(old&&!old.paid)B.cancel(old);
 const p={id:'SUB-PAY-'+(++S.serial),snapshot:B.snapshot(),revision:S.draft.revision,payment:'waiting',paid:false,created:Date.now(),deadline:Date.now()+600000,attempts:[{state:'waiting',at:new Date().toLocaleString()}]};
 const reason=D.reserve(p.id,p.snapshot.productId,p.snapshot.quantity,p.snapshot.dates,false,p.deadline);if(reason){B.message=reason;return null;}
 S.purchases.unshift(p);S.draft.purchaseId=p.id;return p;
};
B.cancel=p=>{if(!p||p.paid||['detected','delayed'].includes(p.payment))return false;p.payment='cancelled';D.release(p.id);return true;};
B.retry=p=>{if(!p||p.paid||!['failed','expired'].includes(p.payment))return false;const reason=D.reserve(p.id,p.snapshot.productId,p.snapshot.quantity,p.snapshot.dates,false,Date.now()+600000);if(reason){p.payment='revalidation';B.message=reason;return false;}p.deadline=Date.now()+600000;p.payment='waiting';p.attempts.push({state:'waiting',at:new Date().toLocaleString()});return true;};
B.pay=(p,state)=>{
 if(!p||p.paid||p.payment==='cancelled')return;
 p.payment=state;if(p.attempts.length)p.attempts.at(-1).state=state;
 if(['failed','expired','revalidation'].includes(state))D.release(p.id);
 if(state!=='confirmed')return;
 p.paid=true;p.paidAt=new Date().toLocaleString();
 const snap=p.snapshot,reason=D.reserve(p.id,snap.productId,snap.quantity,snap.dates,true);
 if(reason){p.payment='resolution';p.resolution=reason;return;}
 const record={id:'SUB-'+(++S.serial),purchaseId:p.id,snapshot:C.copy(snap),status:'active',created:p.created,deferments:[],deliveries:[]};
 snap.dates.forEach((date,i)=>{
  const id=record.id+'-D'+(i+1),orderId='K406-'+(++C.state.serial);
  record.deliveries.push({id,cycle:i+1,date,originalDate:date,status:'pending',orderId});
  C.state.orders.unshift({id:orderId,type:'subscription',subscriptionId:record.id,deliveryId:id,prepaid:true,items:[{...C.line(snap.productId,snap.variantId,snap.quantity),price:snap.unit}],fulfillment:{method:'delivery',date},address:C.copy(snap.address),fee:snap.fee,total:snap.unit*snap.quantity+snap.fee,paid:true,paidAt:p.paidAt,status:'confirmed',payment:'confirmed',created:p.created,reference:p.id,attempts:[],activity:[{text:'Included in prepaid subscription '+record.id,at:p.paidAt}]});
 });
 p.subscriptionId=record.id;S.records.unshift(record);return record;
};
B.sync=record=>{record.deliveries.forEach(d=>{const order=(A.inventory?.allOrders()||C.state.orders).find(o=>o.id===d.orderId);d.status=order?.status==='completed'?'fulfilled':record.deferments.some(change=>change.deliveryId===d.id)?'deferred':'pending';});if(record.status!=='cancelled')record.status=record.deliveries.every(d=>d.status==='fulfilled')?'completed':'active';return record;};
B.next=record=>record.deliveries.filter(d=>d.status!=='fulfilled').sort((a,b)=>a.date.localeCompare(b.date))[0];
B.deferTarget=(record,delivery,option)=>{
 if(option==='day')return D.add(delivery.date,1);
 let date=D.add(delivery.date,7);
 if(record.deliveries.some(d=>d.id!==delivery.id&&d.date===date))date=D.add(record.deliveries.map(d=>d.date).sort().at(-1),7);
 for(let i=0;i<26;i++,date=D.add(date,7)){if(!record.deliveries.some(d=>d.id!==delivery.id&&d.date===date)&&!B.replacementReason(record,delivery,date))return date;}
 return '';
};
B.replacementReason=(record,delivery,date)=>{
 if(!date)return 'No available weekly date found.';
 const reason=D.base(date,record.snapshot.productId,{replacement:true});if(reason)return reason;
 const old=D.allocations.filter(a=>a.owner===record.purchaseId),other=old.filter(a=>a.cycle!==delivery.cycle&&D.week(a.date)===D.week(date)).reduce((n,a)=>n+a.quantity,0);
 if(D.used(record.snapshot.productId,date,record.purchaseId)+other+record.snapshot.quantity>D.config.subscriptionUnits)return 'Subscription capacity reached';
 return '';
};
B.deferReason=(record,delivery,option)=>{
 if(!record||!delivery||!record.deliveries.includes(delivery))return 'Delivery not found.';
 if(!['day','week'].includes(option))return 'Choose next day or next week.';
 const order=(A.inventory?.allOrders()||C.state.orders).find(o=>o.id===delivery.orderId);
 if(record.deferments.length||B.mock.defer==='used')return 'Your one deferment has already been used.';
 if(record.status!=='active'||delivery.status==='fulfilled'||order?.status!=='confirmed')return 'This delivery can no longer be deferred.';
 if(Date.parse(D.config.clock)>=D.cutoff(delivery.date,record.snapshot.productId,'subscription'))return 'The cutoff for changing this delivery has passed.';
 if(['loading','error'].includes(B.mock.defer))return B.mock.defer==='loading'?'Checking replacement availability…':'Unable to check availability. Please try again.';
 if(B.mock.defer==='both'||B.mock.defer===option)return 'This replacement date is unavailable.';
 return B.replacementReason(record,delivery,B.deferTarget(record,delivery,option));
};
B.defer=(record,delivery,option)=>{
 if(A.auth!=='signedin'||A.account&&(!A.account.allowed()||record?.customer_id&&!A.account.owns(record)))return 'Sign in with the subscription customer account.';
 const reason=B.deferReason(record,delivery,option);if(reason)return reason;
 const date=B.deferTarget(record,delivery,option),oldDate=delivery.date;
 const allocation=D.allocations.find(a=>a.owner===record.purchaseId&&a.cycle===delivery.cycle);
 if(!allocation)return 'The original reservation could not be found.';
 record.deferments.push({deliveryId:delivery.id,option,originalDate:oldDate,newDate:date,originalAllocation:{...allocation},at:new Date().toLocaleString()});
 const replacement={...allocation,id:D.nextAllocationId(),date};if(A.capacity)A.capacity.history.push({...allocation,status:'released',released_at:Date.now()});D.allocations.splice(D.allocations.indexOf(allocation),1,replacement);Object.assign(record.deferments.at(-1),{original_allocation_id:allocation.id,replacement_allocation_id:replacement.id});delivery.date=date;delivery.status='deferred';
 const order=(A.inventory?.allOrders()||C.state.orders).find(o=>o.id===delivery.orderId);order.fulfillment.date=date;order.activity.unshift({text:'Delivery deferred from '+oldDate+' to '+date,at:new Date().toLocaleString()});return '';
};
B.reset=()=>{A.resetProductData?.();B.deferOption='day';B.confirmation=null;S.draft=blank();S.purchases=[];S.records=[];B.addressUI.form=null;B.deliveryRoute?.reset();D.reset();Object.keys(B.mock).forEach(k=>B.mock[k]='normal');B.message='';B.query='';B.filter='all';B.category='all';};
})();
