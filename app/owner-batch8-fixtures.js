/* Extend the existing example loader without creating records during navigation. */
(() => {
const A=K406,M=A.marketing,R=A.reviews,seed=A.owner.seed;
A.owner.seed=()=>{
 if(!A.session.ownerAllowed())return;seed();if(M.examplesLoaded)return;M.examplesLoaded=true;
 const available=A.products.filter(p=>p.active!==false&&p.available),p=available[0];if(!p)return;
 const draft=M.add('New Product','example-activation:'+p.id,p,p.name+' is available. '+p.description);
 M.evaluate(true);
 for(const product of available){const slots=M.slots(product);if(slots.length){M.add('Subscription Availability','example:'+product.id+':'+slots[0].date,product,'Enjoy '+product.name+' over four prepaid weekly fulfillments starting '+slots[0].date+'.');break;}}
 const incomplete=M.add('New Product','example-image-failure',p,p.name+' is ready for your next bakery treat.');
 if(incomplete)Object.assign(incomplete,{status:'incomplete',imageFailed:true});
 const approved=M.add('New Product','example-prior-activation:'+p.id,p,p.name+' from Kitchen406.');if(approved)M.finalize(approved,'approved');
 const rejected=M.add('New Product','example-earlier-activation:'+p.id,p,p.name+' promotional preview.');if(rejected)M.finalize(rejected,'rejected');
 M.add('New Product',draft.eventKey.split(':').slice(1).join(':'),p,draft.caption);
 const items=available.slice(0,2).map(product=>A.commerce.line(product.id,product.variants[0].id,1));
 const date=A.schedule.add(A.schedule.today(),-2),id='B8-COMPLETED-0';
 if(!A.operations.find(id))A.commerce.state.orders.push({id,fixture:true,customer_id:A.account.id(),contact:A.account.contact(),type:'standard',items,fulfillment:{date,method:'pickup'},fee:0,total:A.commerce.subtotal(items),paid:true,payment:'confirmed',status:'completed',created:date+'T02:00:00Z',paidAt:date+'T03:00:00Z',activity:[],attempts:[]});
 M.evaluate(true);
 for(const o of A.operations.orders().filter(o=>o.id===id))for(const item of o.items){
 if(!item||R.records.some(r=>r.key===o.id+':'+item.key))continue;const customer=A.operations.customer(o.customer_id),index=R.records.length;
 R.records.push({id:'REVIEW-'+(index+1),key:o.id+':'+item.key,orderId:o.id,productId:item.productId,product:item.name,variant:item.variant,customer:customer?customer.first_name+' '+customer.last_name:'Customer',rating:index===1?2:5,comment:index===1?'The texture was not what I expected.':'Enjoyed this purchase.',images:index===0?[A.products.find(p=>p.id===item.productId)?.image].filter(Boolean):[],created:new Date().toISOString(),hidden:false,history:[],version:0});
 }
 A.owner.render();
};
const reset=A.commerce.reset;A.commerce.reset=()=>{M.drafts.length=0;M.occasions.length=0;M.events.clear();M.examplesLoaded=false;R.records.length=0;reset();M.initialized=false;M.evaluate();M.initialized=true;};
})();
