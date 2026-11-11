/* Explicit developer fixtures only. No records are added by normal owner navigation. */
(() => {
const A=K406,C=A.commerce,D=A.schedule,I=A.inventory,B=A.subscriptions,K=A.cakes;

function seedFridayBatch(product,variant,address,customer){
 const schedule=B.availableSchedules(product.id).find(s=>s.day===5);
 if(!schedule||!C.addressValid(address))return;
 const today=D.today(),batchSize=3;
 let friday=D.add(today,(5-D.day(today)+7)%7||7);
 for(let week=0;week<10;week++,friday=D.add(friday,7)){
  const dates=Array.from({length:4},(_,cycle)=>D.add(friday,cycle*7));
  if(D.subscription(product.id,batchSize,dates))continue;
  const fee=A.quoteFee(),snapshot={
   productId:product.id,variantId:variant.id,name:product.name,image:product.image,variant:variant.label,
   quantity:1,scheduleId:schedule.id,schedule:schedule.label,scheduleSnapshot:C.copy(schedule),dates,
   method:'delivery',address,unit:variant.price,fee,products:variant.price*4,delivery:fee*4,total:(variant.price+fee)*4
  };
  B.syncSerial();
  for(let index=0;index<batchSize;index++){
   const now=Date.now(),purchase={
    id:'SUB-PAY-'+(++B.state.serial),customer_id:customer,fixture:true,snapshot:C.copy(snapshot),
    revision:0,payment:'waiting',paid:false,created:now,deadline:now+C.paymentSessionMs,
    attempts:[{state:'waiting',at:now}]
   };
   B.state.purchases.push(purchase);
   const record=B.pay(purchase,'confirmed');
   if(!record)continue;
   record.fixture=true;
   for(const {orderId} of record.deliveries)A.operations.find(orderId).fixture=true;
  }
  return;
 }
}

A.owner.seed=()=>{
 if(!A.session.ownerAllowed())return;
 if(A.operations.orders().some(o=>o.id==='OWNER-DEMO-PICKUP')){A.toast('Owner examples are already loaded.');return;}
 if(!A.staff.accounts.some(s=>s.id==='staff-demo-inactive'))A.staff.accounts.push({id:'staff-demo-inactive',first_name:'Rina',last_name:'Santos',email:'rina@kitchen406.example',role:'staff',status:'inactive',setup:true,version:0,created_at:new Date().toISOString(),created_by_admin_id:A.session.owner.id,created_by_name:A.session.actor().name});
 if(!A.account.records.some(p=>p.customer_id==='owner-demo-customer'))A.account.records.push({account_id:'owner-demo-account',customer_id:'owner-demo-customer',first_name:'Mika',last_name:'Santos',email:'mika@example.com',status:'active',created_at:new Date().toISOString()});
 const customer=A.account.id(),address=C.copy(C.state.addresses.find(a=>a.status==='active')||{}),contact=A.account.contact();
 let date=D.add(D.today(),10);for(let n=0;n<60&&D.base(date,1);n++)date=D.add(date,1);
 function order(id,method,paid=true,items=[C.line(1,'standard',1)],fulfillmentDate=date){const o={id,fixture:true,customer_id:customer,contact:C.copy(contact),type:'standard',items,fulfillment:{date:fulfillmentDate,method},address:method==='pickup'?null:C.copy(address),fee:method==='pickup'?0:100,total:C.subtotal(items)+(method==='pickup'?0:100),paid,payment:paid?'confirmed':'waiting',status:paid?'confirmed':'pending-payment',created:Date.now(),paidAt:paid?new Date().toLocaleString():null,deadline:Date.now()+C.paymentSessionMs,reference:'DEMO-QR-'+id,attempts:[{state:paid?'confirmed':'waiting',at:Date.now()}],activity:[]};C.state.orders.push(o);return o;}
 // Two existing commitments are due on the prototype clock's today, independent of checkout lead times.
 const pickup=order('OWNER-DEMO-PICKUP','pickup',true,[C.line(1,'standard',1)],D.today()),courier=order('OWNER-DEMO-COURIER','delivery',true,[C.line(4,'standard',2),C.line(1,'standard',1)],D.today()),pending=order('OWNER-DEMO-PENDING','pickup',false),issue=order('OWNER-DEMO-RESOLUTION','delivery');
 const preparing=order('OWNER-DEMO-PREPARING','delivery',true,[C.line(4,'standard',1)],D.add(date,1));
 for(const o of [pickup,courier,pending,preparing]){const error=I.reserve(o,o.paid);if(error){o.materialIssue=error;if(!o.paid){o.payment='revalidation';o.status='payment-failed';}}}
 // Keep today's pickup confirmed so the dashboard demonstrates Start preparation.
 for(const o of [courier])if(!o.materialIssue){A.fulfillment.transition(o.id,'preparing',0,'fixture-prepare-'+o.id);A.fulfillment.transition(o.id,'ready',1,'fixture-ready-'+o.id);}
 if(!preparing.materialIssue)A.fulfillment.transition(preparing.id,'preparing',0,'fixture-prepare-'+preparing.id);
 Object.assign(issue,{payment:'resolution',status:'payment-resolution',resolution:'Payment arrived after the temporary checkout hold expired. Resource recovery requires owner review.'});I.plan(issue);
 // Historical checkout examples use explicit audit timestamps, without changing customer checkout.
 for(const [id,state,late] of [['OWNER-DEMO-FAILED','failed',false],['OWNER-DEMO-EXPIRED','expired',false],['OWNER-DEMO-LATE','confirmed',true]]){
  const o=order(id,'pickup',false),created=Date.now()-3600000,holdId='OWNER-HOLD-'+id;
  Object.assign(o,{created,deadline:created+30*60000,paid:late,payment:late?'resolution':state,status:late?'cancelled':'payment-failed',paidAt:late?created+35*60000:null,resolution:late?'Payment verified after reservation release. Order remains cancelled; review externally for refund eligibility. No refund has been processed.':''});
  o.attempts=[{state,at:created,created_at:created,expires_at:created+30*60000,paid_at:late?created+35*60000:undefined,amount:o.total,reference:o.reference,hold_id:holdId}];
  A.checkoutHolds.records.set(holdId,{id:holdId,order_id:id,status:'released',created_at:created,expires_at:created+32*60000,released_at:created+32*60000});
 }
 const product=A.products.find(p=>p.id===4),variant=A.variant(4,'standard'),schedule=B.availableSchedules(4)[0];
 if(schedule){let start=D.add(date,7);while(D.day(start)!==schedule.day)start=D.add(start,1);const dates=Array.from({length:4},(_,n)=>D.add(start,n*7)),snapshot={productId:product.id,variantId:variant.id,name:product.name,image:product.image,variant:variant.label,quantity:1,scheduleId:schedule.id,schedule:schedule.label,scheduleSnapshot:C.copy(schedule),dates,address:C.copy(address),unit:variant.price,fee:100,products:variant.price*4,delivery:400,total:variant.price*4+400};
 if(!D.subscription(product.id,1,dates)){B.syncSerial();const p={id:'SUB-PAY-'+(++B.state.serial),customer_id:customer,fixture:true,snapshot,revision:0,payment:'waiting',paid:false,created:Date.now(),deadline:Date.now()+C.paymentSessionMs,attempts:[{state:'waiting',at:Date.now()}]};B.state.purchases.push(p);B.pay(p,'confirmed');const record=B.allRecords().find(r=>r.purchaseId===p.id),delivery=record?.deliveries[0],option=delivery&&['day','week'].find(option=>!B.deferReason(record,delivery,option));if(record)record.fixture=true;if(option){const originalDate=delivery.date,target=B.deferTarget(record,delivery,option);if(!B.applyDefer(record,delivery,option))B.requests.push({id:'OWNER-DEMO-DEFERMENT',fixture:true,subscriptionId:record.id,deliveryId:delivery.id,originalDate,target,option,notes:'Please move this delivery; I will be away on the original date.',status:'applied',created:Date.now()});}}}
 seedFridayBatch(product,variant,address,customer);
 const T=A.cakeData;
 const cakeExamples=[
  {status:'pending_review'},
  {status:'quoted'},
  {status:'rejected',rejection:{category:'Design not feasible',notes:'The requested sugar arch is too fragile to support safely.'}},
  {status:'expired'},
  ...['pending-payment','payment-failed','payment-resolution','confirmed','preparing','ready','completed','cancelled'].map(orderStatus=>({status:'accepted',orderStatus}))
 ].map(example=>({name:contact.name||'Demo customer',shape:'round',flavor:'vanilla',size:'six',color:'cream',method:'pickup',notes:'Sample cake demonstrating '+(example.orderStatus||example.status)+'.',...example}));
 const cakeRequests=[];
 let cakeDate=D.add(date,7);
 for(const example of cakeExamples){
  for(let n=0;n<60&&K.dateReason(cakeDate);n++)cakeDate=D.add(cakeDate,1);
  const selection={...example,icing:'buttercream'};
  const options=T.categories.map(type=>T.options.find(option=>option.type===type&&option.id===selection[type])).filter(Boolean);
  const addons=example.decoration?[{...T.addons.find(addon=>addon.id==='decoration'),quantity:1}]:[];
  const snapshot=C.copy({options,addons,images:[{url:'assets/custom-cake.png',name:'Cake reference',status:'ready'}],notes:example.notes,address:example.method==='delivery'?address:null,contact:{...contact,name:example.name},date:cakeDate,method:example.method});
  const estimated_price=options.reduce((total,option)=>total+option.price,0)+addons.reduce((total,addon)=>total+addon.price*addon.quantity,0);
  const request={id:'CAKE-'+(++K.state.serial),fixture:true,customer_id:customer,status:example.status,created_at:Date.now(),estimated_price,accepted_quotation_id:null,snapshot};
  if(example.rejection)request.rejection=example.rejection;
  cakeRequests.push(request);
  cakeDate=D.add(cakeDate,7);
 }
 K.state.requests.unshift(...cakeRequests);
 const role=A.staff.role;
 try{
  A.staff.role='customer';
  cakeRequests.forEach((request,index)=>{
   const example=cakeExamples[index];
   if(['pending_review','rejected'].includes(example.status))return;
   const quote=K.issue(request);
   if(!quote)throw Error('Unable to create sample cake quotation.');
   if(example.status==='expired'){quote.expires_at=Date.now()-1000;K.expire();return;}
   if(!example.orderStatus)return;
   const purchase=K.accept(quote);
   if(!purchase)throw Error('Unable to accept sample cake quotation: '+K.message);
   purchase.fixture=true;
   if(example.orderStatus==='cancelled'){K.cancel(purchase);return;}
   if(example.orderStatus==='payment-failed'){K.pay(purchase,'failed');return;}
   if(example.orderStatus==='pending-payment')return;
   K.pay(purchase,'confirmed');
   if(example.orderStatus==='payment-resolution'){
    I.release(purchase.id);
    Object.assign(purchase,{status:'payment-resolution',payment:'resolution',resolution:'Sample payment requiring owner review.'});
    return;
   }
   if(['preparing','ready','completed'].includes(example.orderStatus)){
    const error=I.consume(purchase,'Demo fixture');
    if(error)throw Error(error);
    C.setStatus(purchase,example.orderStatus);
    if(example.orderStatus==='completed')purchase.completedAt=Date.now();
   }
  });
 }finally{A.staff.role=role;}

 B.samples();
 A.operations.changed();A.toast('Shared owner examples loaded. Cake requests remain available for your review.');
};
document.addEventListener('click',e=>{if(e.target.closest('[data-owner="seed"]'))A.owner.seed();});
})();
