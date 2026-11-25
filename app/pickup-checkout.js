/* SQLite-backed standard checkout. */
(() => {
const A=K406,C=A.commerce,S=C.state,D=A.schedule;
const P=A.pickup={capacity:[]};
const api=(action,input)=>A.authUI.api('ordering/'+action,input);
const attempts=new WeakMap();
let busy=false,calendarRequest=0,ordersRequest=0;
let operationsGeneration=-1,operationsRequest=0,operationOrders=[];
P.operationalOrders=()=>A.session.operational()&&operationsGeneration===A.session.generation?operationOrders:[];
P.refreshOperations=async()=>{
 if(!A.session.operational())return;
 const generation=A.session.generation,request=++operationsRequest;
 const {orders}=await api('operations');
 if(request!==operationsRequest||generation!==A.session.generation||!A.session.operational())return;
 operationsGeneration=generation;operationOrders=orders;
 A.owner.render();A.staff.render();
};
P.fulfill=async(id,action,button)=>{
 if(button)button.disabled=true;
 try{
  await api('fulfillment',{id,action});
  if(action==='preparing')await A.inventory.refresh();
  await P.refreshOperations();
  return '';
 }catch(error){return present(error);}
 finally{if(button)button.disabled=false;}
};
P.courier=async(id,action,outcome,key,expectedStatus)=>{
 try{
  await api('courier',{id,action,outcome,key,expectedStatus});
  await P.refreshOperations();
  return '';
 }catch(error){return present(error);}
};

P.applyBlocks=rows=>{
 D.config.blocked=rows.map(row=>row.date);
 A.capacity.blocks.clear();
 for(const row of rows)A.capacity.blocks.set(row.date,row);
};
P.calendar=async()=>{
 const request=++calendarRequest, generation=A.session.generation;
 const data=await api('calendar');
 const owner=A.session.ownerAllowed()?await api('owner-calendar'):null;
 if(request!==calendarRequest||generation!==A.session.generation)return;
 P.capacity=data.capacity;
 P.applyBlocks(owner?.blocked||data.blocked);
 D.config.standardUnits=data.units;
 D.config.standardVarieties=data.varieties;
};
function merge(order){
 const previous=S.orders.find(line=>line.id===order.id);
 if(previous)Object.assign(previous,order);
 else S.orders.unshift(order);
 return previous||order;
}
P.refresh=async()=>{
 const request=++ordersRequest,customer=A.account.id();
 const {orders}=await api('orders');
 if(request!==ordersRequest||!A.account.allowed()||customer!==A.account.id())return;
 for(const order of orders)merge(order);
};
const present=error=>error instanceof TypeError||error instanceof SyntaxError?'Checkout is unavailable. Please try again.':error.message;
async function submit(items,date,key,replaceId,delivery){
 const {order}=await api(delivery?'delivery':'pickup',{
  key,date,replaceId,...delivery,items:items.map(item=>({
   variantId:item.key,quantity:item.quantity,unitPriceCents:Math.round(item.price*100)
  }))
 });
 return order;
}
P.create=async button=>{
 if(busy||!A.account.allowed())return null;
 const customer=A.account.id(),draft=S.draft,revision=S.revision;
 const delivery=draft.method==='delivery'?{
  addressId:C.address()?.address_id,feeCents:Math.round(C.fee()*100),checkoutQuote:C.deliveryRoute.checkoutQuote()
 }:undefined;
 if(delivery&&!delivery.checkoutQuote){
  C.checkout.message='Refresh the courier quotation before paying.';
  return null;
 }
 let attempt=attempts.get(draft);
 if(attempt?.customer!==customer||attempt.revision!==revision||attempt.feeCents!==delivery?.feeCents){
  attempt={customer,revision,feeCents:delivery?.feeCents,key:crypto.randomUUID()};
  attempts.set(draft,attempt);
 }
 busy=true;button.disabled=true;
 try{
  const previous=S.orders.find(order=>order.id===S.activeId&&order.persistedPickup&&!order.paid);
  const order=await submit(S.cart,draft.date,attempt.key,previous?.id,delivery);
  if(customer!==A.account.id()||!A.account.allowed())return null;
  const saved=merge(order);
  if(saved.checkoutClosed||saved.payment==='cancelled'){
   attempts.delete(draft);
   throw Error('This checkout has closed. Try again to create a new hold.');
  }
  saved.cartRevision=revision;
  S.activeId=saved.id;
  void P.refresh().catch(()=>{});
  return saved;
 }catch(error){
  if(customer===A.account.id()){
   C.checkout.message=present(error);
   if(error.message.includes('selling price changed')){
    await A.productAdmin.loadCatalog().catch(()=>{});
    C.refreshCheckoutPrices();
   }
   await P.calendar().catch(()=>{});
  }
  return null;
 }finally{busy=false;button.disabled=false;}
};
P.payment=async(action,order,button)=>{
 if(busy||!A.account.owns(order))return false;
 const customer=A.account.id();
 busy=true;if(button)button.disabled=true;
 try{
  if(action==='check-payment')await P.refresh();
  else if(action==='retry-payment'){
   let delivery;
   if(order.fulfillment.method==='delivery'){
    const address=A.addresses.find(order.address?.address_id);
    if(!address)throw Error('The delivery address was removed. Choose a saved address in checkout.');
    if(['add_line_1','add_line_2','barangay','city','postal_code','landmark'].some(field=>address[field]!==order.address[field])){
     throw Error('The delivery address changed. Return to checkout to review the new address.');
    }
    const route=[address.add_line_1,address.barangay,address.city,address.postal_code,'Philippines'].filter(Boolean).join(', ');
    const response=await fetch('/api/courier-quotation',{
     method:'POST',headers:{'Content-Type':'application/json'},
     body:JSON.stringify({address:route,dates:[order.fulfillment.date]})
    });
    const quote=await response.json();
    if(!response.ok||quote.status!=='ok')throw Error('The courier quotation is unavailable. Return to checkout to review the address and date.');
    const feeCents=Math.round(quote.quotations[0].fee*100);
    if(feeCents!==Math.round(order.fee*100))throw Error('The courier fee changed. Return to checkout to review the new fee.');
    delivery={addressId:address.address_id,feeCents,checkoutQuote:quote.checkoutQuote};
   }
   const key=order.retryKey??=crypto.randomUUID();
   const next=await submit(order.items,order.fulfillment.date,key,undefined,delivery);
   if(customer!==A.account.id()||!A.account.allowed())return false;
   const saved=merge(next);
   saved.cartRevision=order.cartRevision;
   S.activeId=saved.id;
   location.hash='#/payment/'+saved.id;
  }else{
   const {order:saved}=await api('payment',{id:order.id,action:action==='cancel'?'cancel':'confirm'});
   if(customer!==A.account.id()||!A.account.allowed())return false;
   const wasPaid=order.paid;
   merge(saved);
   if(!wasPaid&&order.paid&&order.cartRevision===S.revision){
    for(const item of order.items){
     const line=S.cart.find(row=>row.key===item.key);
     if(line)line.quantity=Math.max(0,line.quantity-item.quantity);
    }
    S.cart=S.cart.filter(line=>line.quantity>0);
    S.revision++;
   }
  }
  if(customer===A.account.id()){order.paymentCheckMessage='';C.render();}
  return true;
 }catch(error){
  if(customer===A.account.id()){order.paymentCheckMessage=present(error);A.toast(order.paymentCheckMessage);C.render();}
  return false;
 }finally{busy=false;if(button)button.disabled=false;}
};
const show=C.show;
C.show=parts=>{
 show(parts);
 if(!A.account.allowed())return;
 if(parts[0]==='checkout')void P.calendar().then(()=>C.render()).catch(()=>{});
 if(['orders','payment','confirmation'].includes(parts[0])){
  void P.refresh().then(()=>C.render()).catch(error=>A.toast(present(error)));
 }
};
const showOwner=A.owner.show;
// Returning from the native file picker focuses the browser before the form
// receives the file. Refreshing operations would replace that form.
const editingProduct=()=>A.owner.parts[1]==='products'&&Boolean(A.owner.parts[2]);
A.owner.show=parts=>{
 showOwner(parts);
 if(A.session.ownerAllowed()&&!editingProduct())void P.refreshOperations().catch(error=>A.toast(present(error)));
 if(parts[1]==='capacity'&&A.session.ownerAllowed()){
  void P.calendar().then(()=>A.owner.render()).catch(error=>A.toast(present(error)));
 }
};
const showStaff=A.staff.show;
A.staff.show=parts=>{
 showStaff(parts);
 if(A.staff.allowed())void P.refreshOperations().catch(error=>A.toast(present(error)));
};
window.addEventListener('focus',()=>{
 if(A.route==='checkout'&&A.account.allowed())void P.calendar().then(()=>C.render()).catch(()=>{});
 if(A.session.operational()&&(A.route==='staff'||A.route==='owner'&&!editingProduct()))void P.refreshOperations().catch(error=>A.toast(present(error)));
});
setInterval(()=>{
 const order=C.currentOrder();
 if(A.route==='payment'&&order?.persistedPickup&&order.payment==='waiting'&&Date.now()>=order.deadline){
  void P.payment('check-payment',order);
 }
},5000);
})();
