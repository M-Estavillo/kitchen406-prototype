/* Explicit developer fixtures only. No records are added by normal owner navigation. */
(() => {
const A=K406,C=A.commerce,D=A.schedule,I=A.inventory,B=A.subscriptions,K=A.cakes;
A.owner.seed=()=>{
 if(!A.session.ownerAllowed())return;
 if(A.operations.orders().some(o=>o.id==='OWNER-DEMO-PICKUP')){A.toast('Owner examples are already loaded.');return;}
 const customer=A.account.id(),address=C.copy(C.state.addresses.find(a=>a.status==='active')||{}),contact=A.account.contact();
 let date=D.add(D.today(),10);for(let n=0;n<60&&D.base(date,1);n++)date=D.add(date,1);
 function order(id,method,paid=true){const items=[C.line(1,'standard',1)],o={id,fixture:true,customer_id:customer,contact:C.copy(contact),type:'standard',items,fulfillment:{date,method},address:method==='pickup'?null:C.copy(address),fee:method==='pickup'?0:100,total:C.subtotal(items)+(method==='pickup'?0:100),paid,payment:paid?'confirmed':'waiting',status:paid?'confirmed':'pending-payment',created:Date.now(),paidAt:paid?new Date().toLocaleString():null,deadline:Date.now()+600000,reference:'DEMO-QR-'+id,attempts:[{state:paid?'confirmed':'waiting',at:Date.now()}],activity:[]};C.state.orders.push(o);return o;}
 const pickup=order('OWNER-DEMO-PICKUP','pickup'),courier=order('OWNER-DEMO-COURIER','delivery'),pending=order('OWNER-DEMO-PENDING','pickup',false),issue=order('OWNER-DEMO-RESOLUTION','delivery');
 for(const o of [pickup,courier,pending]){const error=I.reserve(o,o.paid);if(error){o.materialIssue=error;if(!o.paid){o.payment='revalidation';o.status='payment-failed';}}}
 for(const o of [pickup,courier])if(!o.materialIssue){A.fulfillment.transition(o.id,'preparing',0,'fixture-prepare-'+o.id);A.fulfillment.transition(o.id,'ready',1,'fixture-ready-'+o.id);}
 Object.assign(issue,{payment:'resolution',status:'payment-resolution',resolution:'Payment arrived after the temporary checkout hold expired. Resource recovery requires owner review.'});I.plan(issue);
 const product=A.products.find(p=>p.id===4),variant=A.variant(4,'standard'),schedule=B.availableSchedules(4)[0];
 if(schedule){let start=D.add(date,7);while(D.day(start)!==schedule.day)start=D.add(start,1);const dates=Array.from({length:4},(_,n)=>D.add(start,n*7)),snapshot={productId:product.id,variantId:variant.id,name:product.name,image:product.image,variant:variant.label,quantity:1,scheduleId:schedule.id,schedule:schedule.label,scheduleSnapshot:C.copy(schedule),dates,address:C.copy(address),unit:variant.price,fee:100,products:variant.price*4,delivery:400,total:variant.price*4+400};
 if(!D.subscription(product.id,1,dates)){B.syncSerial();const p={id:'SUB-PAY-'+(++B.state.serial),customer_id:customer,fixture:true,snapshot,revision:0,payment:'waiting',paid:false,created:Date.now(),deadline:Date.now()+600000,attempts:[{state:'waiting',at:Date.now()}]};B.state.purchases.push(p);B.pay(p,'confirmed');}}
 const T=A.cakeData,selection={shape:'round',flavor:'chocolate',size:'eight',color:'cream',icing:'buttercream'},options=T.categories.map(type=>T.options.find(o=>o.type===type&&o.id===selection[type])).filter(Boolean),addons=[];
 let cakeDate=D.add(date,7);for(let n=0;n<60&&K.dateReason(cakeDate);n++)cakeDate=D.add(cakeDate,1);
 const snapshot={options:C.copy(options),addons,images:[{url:'assets/celebration-cake.jpg',name:'Cake reference',status:'ready'}],notes:'Cream finish with botanical decoration. Review the proposed design.',address:C.copy(address),contact:C.copy(contact),date:cakeDate,window:'morning',windowLabel:K.windows(cakeDate).morning,method:'pickup'};
 const request={id:'CAKE-'+(++K.state.serial),fixture:true,customer_id:customer,status:'pending_review',created_at:Date.now(),estimated_price:options.reduce((n,o)=>n+o.price,0),accepted_quotation_id:null,snapshot};K.state.requests.unshift(request);
 A.operations.changed();A.toast('Shared owner examples loaded. Cake requests remain available for your review.');
};
document.addEventListener('click',e=>{if(e.target.closest('[data-owner="seed"]'))A.owner.seed();});
})();
