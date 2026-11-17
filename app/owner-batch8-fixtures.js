/* Extend the existing example loader without creating records during navigation. */
(() => {
const A=K406,R=A.reviews,seed=A.owner.seed;
A.owner.seed=()=>{
 if(!A.session.ownerAllowed())return;seed();if(R.examplesLoaded)return;R.examplesLoaded=true;
 const available=A.products.filter(p=>p.active!==false&&p.available),p=available[0];if(!p)return;
 const items=available.slice(0,2).map(product=>A.commerce.line(product.id,product.variants[0].id,1));
 const date=A.schedule.add(A.schedule.today(),-2),id='B8-COMPLETED-0';
 if(!A.operations.find(id))A.commerce.state.orders.push({id,fixture:true,customer_id:A.account.id(),contact:A.account.contact(),type:'standard',items,fulfillment:{date,method:'pickup'},fee:0,total:A.commerce.subtotal(items),paid:true,payment:'confirmed',status:'completed',created:date+'T02:00:00Z',paidAt:date+'T03:00:00Z',activity:[],attempts:[]});
 for(const o of A.operations.orders().filter(o=>o.id===id))for(const item of o.items){
 if(!item||R.records.some(r=>r.key===o.id+':'+item.key))continue;const customer=A.operations.customer(o.customer_id),index=R.records.length;
 R.records.push({id:'REVIEW-'+(index+1),key:o.id+':'+item.key,orderId:o.id,productId:item.productId,product:item.name,variant:item.variant,customer:customer?customer.first_name+' '+customer.last_name:'Customer',rating:index===1?2:5,comment:index===1?'The texture was not what I expected.':'Enjoyed this purchase.',images:index===0?[A.products.find(p=>p.id===item.productId)?.image].filter(Boolean):[],created:new Date().toISOString(),hidden:false,history:[],version:0});
 }
 // Completed demo sales give every product distinct quantities and reporting dates.
 const today=A.ownerUI.businessDate(Date.now());
 A.products.forEach((product,index)=>{
  const variant=product.variants[0];
  if(!variant)return;
  for(const offset of [0,3,8]){
   const saleDate=A.schedule.add(today,-offset),saleId='ANALYTICS-DEMO-'+product.id+'-'+offset;
   if(A.operations.find(saleId))continue;
   const items=[A.commerce.line(product.id,variant.id,1+(index+offset)%5)];
   const fee=index%2?100:0;
   A.commerce.state.orders.push({id:saleId,fixture:true,customer_id:A.account.id(),contact:A.account.contact(),type:'standard',items,fulfillment:{date:saleDate,method:fee?'delivery':'pickup'},fee,total:A.commerce.subtotal(items)+fee,paid:true,payment:'confirmed',status:'completed',created:saleDate+'T02:00:00Z',paidAt:saleDate+'T03:00:00Z',activity:[],attempts:[]});
  }
 });
 A.owner.render();
};
const reset=A.commerce.reset;A.commerce.reset=()=>{R.examplesLoaded=false;R.records.length=0;reset();};
})();
