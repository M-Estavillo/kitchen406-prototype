/* Connect staff operations to the existing customer domain records. */
(() => {
const A=K406,C=A.commerce,I=A.inventory,S=A.staff,K=A.cakes,B=A.subscriptions;
// Keep owner catalog flags distinct from ingredient-derived availability.
I.catalogEnabled=new Map(A.products.map(p=>[p.id,p.available]));
I.productAvailable=(id,variant,exclude)=>{const p=A.products.find(p=>p.id===Number(id));return !!p&&p.active!==false&&I.catalogEnabled.get(p.id)!==false&&(variant?[variant]:p.variants.map(v=>v.id)).some(v=>A.variant(p.id,v)?.active!==false&&!I.reason(I.recipe(p.id,v),exclude));};
for(const p of A.products)Object.defineProperty(p,'available',{configurable:true,enumerable:true,get:()=>I.productAvailable(p.id),set:value=>I.catalogEnabled.set(p.id,value)});
const originalAuth=A.setAuth;A.setAuth=function(value){if(A.session)A.session.generation++;if(value==='guest'){A.closeModal(true);A.owner?.drafts.clear();S.generation++;S.role='customer';}originalAuth.call(A,value);A.shell.sync();A.owner?.render();};
// An order's customer is always explicit when staff trigger customer notifications.
const emit=A.notifications.emit;A.notifications.emit=(key,category,title,message,path,customer,channels)=>{
 if(S.role!=='customer'&&!customer)return null;return emit(key,category,title,message,path,customer,channels);
};
// Legacy ready labels are accepted at the boundary; courier progress has its own record.
C.recordHistory=(o,next)=>{const history=S.history.get(o.id)||[];if(history[0]?.status===next)return;history.unshift({history_id:o.id+':'+(history.length+1),order_id:o.id,status:next,actor:A.session?.actor()?.name||'System',changed_by_account_id:A.session?.actor()?.id||null,changed_at:Date.now(),at:Date.now()});S.history.set(o.id,history);};
const status=C.setStatus;C.setStatus=(o,next,options)=>{if(!o)return;if(next==='cancelled'&&!options?.preserveMaterials)I.release(o.id);if(next==='in-transit'){o.delivery={...o.delivery,order_id:o.id,status:'in_transit'};next='ready';}if(['ready-pickup','ready-delivery'].includes(next))next='ready';status(o,next,options);C.recordHistory(o,S.orderStatus(o));};
C.orderRecord=o=>({order_id:o.id,customer_id:o.customer_id,type:({standard:'standard_purchase',subscription:'subscription_fulfillment',cake:'custom_cake_purchase'})[o.type],status:({'pending-payment':'pending_payment','payment-failed':'pending_payment','payment-resolution':'payment_resolution_required'})[o.status]||S.orderStatus(o),fulfillment_date:o.fulfillment.date,fulfillment_method:o.fulfillment.method});
C.reserveStandard=(o,previous)=>I.reserve(o,false,false,previous?[o.id,previous]:o.id);
const create=C.createOrder;C.createOrder=()=>{C.state.serial=Math.max(C.state.serial,...I.allOrders().map(o=>Number(o.id.match(/^K406-(\d+)$/)?.[1])||0));return create();};
C.retryPayment=o=>{
 if(!o||!A.account.owns(o)||o.paid||o.reconciliationRequired||!['failed','expired'].includes(o.payment))return;
 if(o.revision!==C.state.revision){C.setPayment(o,'revalidation');return;}
 const issue=o.items.map(item=>C.lineIssue(item,item.quantity,o.id)).find(Boolean)||A.schedule.standard(o.fulfillment.date,o.items.map(item=>({...item,available:true})),'normal',o.id);
 if(issue){o.resolution=issue;return;}
 const candidate={...o,attempts:[...o.attempts]};C.beginAttempt(candidate);
 const error=C.reserveStandard(candidate);
 if(error){o.resolution=error;return;}
 Object.assign(o,candidate,{resolution:'',status:'pending-payment',checkoutClosed:false,refundIfPaid:false,paymentCheckMessage:''});C.setPayment(o,'waiting');
};
const payment=C.setPayment;C.setPayment=(o,state)=>{
 if(!o||o.paid||o.status==='cancelled'&&state!=='confirmed')return;
 if(state==='waiting'&&!o.paid&&!o.quotationId&&!A.checkoutHolds?.active(o)){const capacity=A.schedule.standard(o.fulfillment.date,o.items,'normal',o.id),error=capacity||I.reserve(o);if(error){I.release(o.id);o.payment='revalidation';o.status='payment-failed';o.resolution=error;return;}}
 if(state==='confirmed'&&!o.paid&&!o.quotationId){const error=(!A.checkoutHolds?.active(o)&&A.schedule.standard(o.fulfillment.date,o.items,'normal',o.id))||I.reserve(o,true);if(error){o.paid=true;o.payment='resolution';o.status='payment-resolution';o.resolution=error;I.release(o.id);return;}}
 payment(o,state);if(['failed','expired','revalidation','cancelled'].includes(state))I.release(o.id);
 if(o.paid&&o.status==='confirmed'){S.emit('new:'+o.id,'orders',o.id+' is ready for preparation.','staff/production/'+o.id);}
};
// Cake inventory and other product reservations now draw from the same physical stock.
for(const id of Object.keys(A.cakeData.stock))Object.defineProperty(A.cakeData.stock,id,{configurable:true,enumerable:true,get:()=>I.item(id).stock,set:value=>{I.item(id).stock=value;}});
K.materialReason=(m,exclude)=>I.reason(m,exclude);
K.reserveIngredients=o=>I.reserve(o,false,false);
K.commitIngredients=o=>I.reserve(o,true,false);
const cakeRelease=K.release;K.release=id=>{cakeRelease(id);I.release(id);};
const cakePay=K.pay;K.pay=(o,state)=>{const alreadyPaid=o?.paid;cakePay(o,state);if(!alreadyPaid&&o?.paid&&o.status==='confirmed'){C.recordHistory(o,'confirmed');I.notify();S.emit('new:'+o.id,'orders',o.id+' is ready for preparation.','staff/production/'+o.id);}};
// Capacity remains reserved for four dates. Material holds cover the next unprepared delivery.
B.syncSerial=()=>{B.state.serial=Math.max(B.state.serial,...Array.from(A.account.buckets.values()).map(b=>b.subscription?.serial||0));};
B.materialOrder=p=>({id:p.id,type:'subscription',total:p.snapshot.total,deadline:p.deadline,holdDeadline:p.holdDeadline,attempts:p.attempts,items:[C.line(p.snapshot.productId,p.snapshot.variantId,p.snapshot.quantity)],fulfillment:{date:p.snapshot.dates[0]},reserveAt:A.schedule.today()});
B.materialReason=(snapshot,exclude)=>I.reason(I.materials(B.materialOrder({id:exclude||'draft',snapshot})),exclude);
const offering=B.offering;B.offering=id=>{const result=offering(id);return result==='available'&&!I.productAvailable(id,undefined,B.pending()?.id)?'unavailable':result;};
const configReason=B.configReason;B.configReason=()=>configReason()||B.materialReason({productId:B.state.draft.productId,variantId:B.state.draft.variant,quantity:B.state.draft.quantity,dates:B.dates()},B.pending()?.id);
B.reserveIngredients=(p,exclude)=>I.reserve(B.materialOrder(p),false,false,exclude);
const createPurchase=B.createPurchase;B.createPurchase=()=>{B.syncSerial();return createPurchase();};
const cancel=B.cancel;B.cancel=p=>{const result=cancel(p);if(result)I.release(p.id);return result;};
const change=B.change;B.change=()=>{const pending=B.pending(),result=change();if(result&&pending&&!pending.paid)I.release(pending.id);return result;};
B.allRecords=()=>[...new Map([...Array.from(A.account.buckets.values()).flatMap(b=>(b.subscription?.records||[]).filter(r=>!r.persistedSubscription)),...B.state.records.filter(r=>!r.persistedSubscription||A.account.allowed()),...(B.persistence?.records()||[])].map(r=>[r.id,r])).values()];
// Demonstration schedule defaults; the owner will maintain these in production.
B.preparationDate=o=>{const r=B.allRecords().find(r=>r.id===o.subscriptionId),schedule=r?.snapshot.scheduleSnapshot||B.scheduleById(r?.snapshot.scheduleId);if(!schedule||!Number.isInteger(schedule.preparation_day))return null;const days=(A.schedule.day(o.fulfillment.date)-schedule.preparation_day+7)%7;return A.schedule.add(o.fulfillment.date,-days);};
B.prepareActivation=(p,orders)=>{
 const first=orders[0],existing=I.reservations.get(p.id);
 const held=existing&&I.active(existing);
 const materialOrder=B.materialOrder(p);
 const firstMaterials=held?existing.materials:I.requirements.get(p.id)||I.materials(materialOrder);
 const error=held?'':I.reason(firstMaterials,p.id);
 if(error)return {error};
 const materials=orders.map((order,index)=>index?I.materials(order):firstMaterials);
 return {commit(){
  const orderIds=new Set(orders.map(order=>order.id));
  const originalRequirements=I.requirements.get(p.id);
  const originalHold=existing&&{...existing};
  const originalRows=existing?.rows.map(row=>[row,{...row}])||[];
  const historySize=I.reservationHistory.length,holdSerial=I.holdSerial;
  try{
   if(!held){const issue=I.reserve(materialOrder,true,false);if(issue)throw Error(issue);}
   const reservation=I.reservations.get(p.id);
   orders.forEach((order,index)=>{
    if(!index)order.reserveAt=A.schedule.today();
    else if(order.fulfillment.preparationDate)order.reserveAt=A.schedule.add(order.fulfillment.preparationDate,-1);
    I.plan(order,materials[index]);
   });
   I.reservations.delete(p.id);
   I.reservations.set(first.id,reservation);
   reservation.orderId=first.id;reservation.purchaseId=p.id;reservation.status='confirmed';
   first.ingredientHoldId=reservation.holdId;
   reservation.rows.forEach(row=>{
    const ingredientId=I.requirementRows.get(row.requirement_id)?.inventory_id;
    if(ingredientId)row.requirement_id=first.id+':'+ingredientId;
    row.status='confirmed';
   });
  }catch(error){
   for(const id of orderIds)I.requirements.delete(id);
   for(const [id,row] of I.requirementRows)if(orderIds.has(row.order_id)||!originalRequirements&&row.order_id===p.id)I.requirementRows.delete(id);
   if(!originalRequirements)I.requirements.delete(p.id);
   I.reservations.delete(first.id);
   if(existing){Object.assign(existing,originalHold);I.reservations.set(p.id,existing);}
   else I.reservations.delete(p.id);
   for(const [row,original] of originalRows)Object.assign(row,original);
   I.reservationHistory.length=historySize;I.holdSerial=holdSerial;
   throw error;
  }
 }};
};
const retryDelayMs=5000;
function reservationDetails(record,delivery,order){
 if(record.status!=='active'||!order?.paid||order.type!=='subscription'||order.subscriptionId!==record.id||
  order.deliveryId!==delivery.id||order.reference!==record.purchaseId||S.orderStatus(order)!=='confirmed'||
  order.fulfillment.date!==delivery.date)return null;
 const preparation=delivery.preparationDate||order.fulfillment.preparationDate||B.preparationDate(order);
 return A.schedule.valid(preparation)?{due:A.schedule.add(preparation,-1)}:null;
}
function reservationIssue(order,due,kind,message,shortages=[]){
 const prior=order.materialReservationIssue;
 order.materialReservationIssue={kind,message,shortages,due,at:prior?.kind===kind&&prior.due===due?prior.at:Date.now(),
  retryAt:kind==='technical'?Date.now()+retryDelayMs:null};
 order.materialIssue=message;
 return message;
}
function missingMaterials(order,materials){
 return Object.entries(materials).flatMap(([id,quantity])=>{
  const ingredient=I.item(id),available=I.available(id,order.id),missing=quantity-available;
  return missing>1e-8?[{id,name:ingredient.name,unit:ingredient.unit,quantity:Number(missing.toFixed(6))}]:[];
 });
}
function reserveScheduled(order,due){
 if(I.reservations.get(order.id)?.status==='confirmed'){
  if(order.materialReservationIssue){delete order.materialReservationIssue;delete order.materialIssue;}
  return '';
 }
 const materials=I.requirements.get(order.id)||I.materials(order);
 if(!materials||!Object.keys(materials).length||Object.entries(materials).some(([id,q])=>!I.item(id)||!Number.isFinite(q)||q<0)){
  return reservationIssue(order,due,'configuration','Ingredient reservation needs a valid recipe. Review the recipe before retrying.');
 }
 const shortage=missingMaterials(order,materials);
 const recordShortage=items=>reservationIssue(order,due,'shortage','Ingredients are short for this fulfillment. '+items.map(item=>item.name+' '+item.quantity+' '+item.unit).join(', ')+'.',items);
 if(shortage.length)return recordShortage(shortage);
 const previous=I.reservations.get(order.id),priorHold=previous&&{...previous};
 const priorRows=previous?.rows.map(row=>[row,{...row}])||[];
 const priorPlan=I.requirements.get(order.id),historyLength=I.reservationHistory.length,serial=I.holdSerial;
 try{
  if(B.reservationSaveError)throw Error('Simulated ingredient reservation save failure');
  const error=I.reserve(order,true,false);
  if(error){
   const changed=missingMaterials(order,materials);
   if(changed.length)return recordShortage(changed);
   throw Error(error);
  }
  if(I.reservations.get(order.id)?.status!=='confirmed')throw Error('No confirmed reservation was saved');
 }catch(error){
  if(previous){Object.assign(previous,priorHold);I.reservations.set(order.id,previous);}
  else I.reservations.delete(order.id);
  for(const [row,values] of priorRows)Object.assign(row,values);
  if(!priorPlan){
   I.requirements.delete(order.id);
   for(const [id,row] of I.requirementRows)if(row.order_id===order.id)I.requirementRows.delete(id);
  }
  I.reservationHistory.length=historyLength;I.holdSerial=serial;
  console.error('Scheduled ingredient reservation failed',order.id,error);
  return reservationIssue(order,due,'technical','Ingredient reservation could not be saved. The system will retry.');
 }
 delete order.materialReservationIssue;delete order.materialIssue;
 I.notify();
 return '';
}
B.reserveNext=(record,ingredientId)=>{
 const today=A.schedule.today(),orders=I.allOrders();
 let updated=false;
 for(const delivery of record.deliveries){
  if(delivery.cycle===1)continue;
  const order=orders.find(o=>o.id===delivery.orderId),details=reservationDetails(record,delivery,order);
  if(!details||details.due>today||I.reservations.get(order.id)?.status==='confirmed')continue;
  const issue=order.materialReservationIssue;
  if(issue?.due===details.due){
   if(ingredientId){if(issue.kind!=='shortage'||!issue.shortages.some(item=>item.id===ingredientId))continue;}
   else if(issue.kind!=='technical'||Date.now()<issue.retryAt)continue;
  }else if(ingredientId)continue;
  reserveScheduled(order,details.due);
  updated=true;
 }
 return updated;
};
B.retryIngredientShortages=id=>{for(const record of B.allRecords())if(!record.persistedSubscription)B.reserveNext(record,id);};
const pay=B.pay;B.pay=(p,state)=>{
 if(!p||p.paid||p.payment==='cancelled'&&state!=='confirmed')return;
 C.state.serial=Math.max(C.state.serial,...I.allOrders().map(o=>Number(o.id.match(/^K406-(\d+)$/)?.[1])||0));
 B.syncSerial();const record=pay(p,state);
 if(['failed','expired','revalidation'].includes(state)||p.payment==='resolution')I.release(p.id);
 if(record){
  for(const d of record.deliveries){const o=I.allOrders().find(o=>o.id===d.orderId);o.customer_id=record.customer_id||A.account.id();d.status='scheduled';C.recordHistory(o,'confirmed');S.emit('new:'+o.id,'orders',o.id+' is scheduled for '+d.date+'.','staff/production/'+o.id);}
  I.notify();
 }
 return record;
};
const defer=B.applyDefer;B.applyDefer=(r,d,...args)=>{const error=defer(r,d,...args);if(!error)S.emit('defer:'+d.orderId+':'+d.date,'orders',d.orderId+' moved from '+d.originalDate+' to '+d.date+'.','staff/production/'+d.orderId);return error;};
// The demo scheduler scans due records. Only a relevant restock retries a recorded shortage.
let availabilitySignature='';setInterval(()=>{
 const pickupsChanged=A.fulfillment.checkPickupCutoffs();
 if(pickupsChanged&&A.route==='orders')C.render();
 let updated=pickupsChanged;
 for(const record of B.allRecords())if(!record.persistedSubscription&&B.reserveNext(record))updated=true;
 if(updated){S.render?.();A.owner?.render();A.shell?.sync();}
 const signature=I.items.map(i=>I.available(i.id)).join(',');
 if(signature===availabilitySignature)return;
 availabilitySignature=signature;I.notify();
 if(A.route==='shop')A.catalog.refresh();
 if(A.route==='product')window.updatePricing();
},1000);
const reset=C.reset;C.reset=()=>{reset();I.reset();S.events=[];S.history.clear();S.versions.clear();S.results.clear();S.stockWarnings.clear();S.stockEpisodes.clear();S.role='customer';};
// Cake holds continue to count capacity after ingredient consumption. Material status lives in I.
document.addEventListener('change',e=>{if(e.target.id==='mock-commerce-courier'){const o=C.currentOrder();if(o&&o.fulfillment.method==='delivery'&&o.type!=='cake'){o.delivery={order_id:o.id,status:({prebooking:'pending',transit:'in_transit'})[e.target.value]||e.target.value};C.render();}}if(e.target.id==='mock-staff-mode'){S.mode=e.target.value;S.render();}if(e.target.id==='mock-staff-save')S.saveError=e.target.value==='error';});
})();
