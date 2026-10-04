/* Connect staff operations to the existing customer domain records. */
(() => {
const A=K406,C=A.commerce,I=A.inventory,S=A.staff,K=A.cakes,B=A.subscriptions;
// Keep owner catalog flags distinct from ingredient-derived availability.
I.catalogEnabled=new Map(A.products.map(p=>[p.id,p.available]));
I.productAvailable=(id,variant,exclude)=>{const p=A.products.find(p=>p.id===Number(id));return !!p&&I.catalogEnabled.get(p.id)!==false&&(variant?[variant]:p.variants.map(v=>v.id)).some(v=>!I.reason(I.recipe(p.id,v),exclude));};
for(const p of A.products)Object.defineProperty(p,'available',{configurable:true,enumerable:true,get:()=>I.productAvailable(p.id),set:value=>I.catalogEnabled.set(p.id,value)});
// Shared primitives retain the customer helper interfaces and selectors.
C.ui.page=(title,subtitle,body)=>A.ui.pageIntro({title,subtitle})+body;
C.ui.panel=(title,body,action='')=>A.ui.panel({title,bodyHtml:body,actionsHtml:action});
const originalAuth=A.setAuth;A.setAuth=function(value){if(value==='guest'){S.generation++;S.role='customer';}originalAuth.call(A,value);A.shell.sync();};
// An order's customer is always explicit when staff trigger customer notifications.
const emit=A.notifications.emit;A.notifications.emit=(key,category,title,message,path,customer,channels)=>{
 if(S.role==='staff'&&!customer)return null;return emit(key,category,title,message,path,customer,channels);
};
// Legacy ready labels are accepted at the boundary; courier progress has its own record.
C.recordHistory=(o,next)=>{const history=S.history.get(o.id)||[];if(history[0]?.status===next)return;history.unshift({history_id:o.id+':'+(history.length+1),order_id:o.id,status:next,actor:S.allowed()?S.name():'System',changed_by_account_id:S.allowed()?S.account.id:null,changed_at:Date.now(),at:Date.now()});S.history.set(o.id,history);};
const status=C.setStatus;C.setStatus=(o,next)=>{if(!o)return;if(next==='cancelled')I.release(o.id);if(next==='in-transit'){o.delivery={...o.delivery,order_id:o.id,status:'in_transit'};next='ready';}if(['ready-pickup','ready-delivery'].includes(next))next='ready';status(o,next);C.recordHistory(o,S.orderStatus(o));};
C.orderRecord=o=>({order_id:o.id,customer_id:o.customer_id,type:({standard:'standard_purchase',subscription:'subscription_fulfillment',cake:'custom_cake_purchase'})[o.type],status:({'pending-payment':'pending_payment','payment-failed':'pending_payment','payment-resolution':'payment_resolution_required'})[o.status]||S.orderStatus(o),fulfillment_date:o.fulfillment.date,fulfillment_method:o.fulfillment.method});
const create=C.createOrder;C.createOrder=()=>{C.state.serial=Math.max(C.state.serial,...I.allOrders().map(o=>Number(o.id.match(/^K406-(\d+)$/)?.[1])||0));const o=create();if(!o)return o;const error=I.reserve(o);if(error){o.payment='revalidation';o.status='payment-failed';C.checkout.message=error;return null;}return o;};
const payment=C.setPayment;C.setPayment=(o,state)=>{
 if(!o||o.paid||o.status==='cancelled')return;
 if(state==='waiting'&&!o.paid&&!o.quotationId){const capacity=A.schedule.standard(o.fulfillment.date,o.items),error=capacity||I.reserve(o);if(error){I.release(o.id);o.payment='revalidation';o.status='payment-failed';o.resolution=error;return;}}
 if(state==='confirmed'&&!o.paid&&!o.quotationId){const error=I.reserve(o,true);if(error){o.paid=true;o.payment='resolution';o.status='payment-resolution';o.resolution=error;I.release(o.id);return;}}
 payment(o,state);if(['failed','expired','revalidation','cancelled'].includes(state))I.release(o.id);
 if(o.paid&&o.status==='confirmed'){I.reserve(o,true);S.emit('new:'+o.id,'orders',o.id+' is ready for preparation.','staff/production/'+o.id);}
};
const cartValid=C.cartValid;C.cartValid=()=>cartValid()&&!I.reason(I.materials({type:'standard',items:C.state.cart}),C.state.activeId);
const add=C.add;C.add=(id,variant,quantity)=>{const line=C.line(id,variant,quantity),error=I.reason(I.materials({type:'standard',items:[...C.state.cart,line]}),C.state.activeId);if(error){A.toast(error);return;}return add(id,variant,quantity);};
// Cake inventory and other product reservations now draw from the same physical stock.
for(const id of Object.keys(A.cakeData.stock))Object.defineProperty(A.cakeData.stock,id,{configurable:true,enumerable:true,get:()=>I.item(id).stock,set:value=>{I.item(id).stock=value;}});
K.materialReason=(m,exclude)=>I.reason(m,exclude);
const cakeReserve=K.reserve;K.reserve=(o,q)=>{const reason=cakeReserve(o,q);if(reason)return reason;const error=I.reserve(o);if(error){K.holds.filter(h=>h.orderId===o.id&&h.status==='held').forEach(h=>h.status='released');}return error;};
const cakeRelease=K.release;K.release=id=>{cakeRelease(id);I.release(id);};
const cakePay=K.pay;K.pay=(o,state)=>{cakePay(o,state);if(o?.paid&&o.status==='confirmed'){C.recordHistory(o,'confirmed');const error=I.reserve(o,true);if(error){o.status='payment-resolution';o.payment='resolution';o.resolution=error;}else S.emit('new:'+o.id,'orders',o.id+' is ready for preparation.','staff/production/'+o.id);}};
// Capacity remains reserved for four dates. Material holds cover the next unprepared delivery.
B.syncSerial=()=>{B.state.serial=Math.max(B.state.serial,...Array.from(A.account.buckets.values()).map(b=>b.subscription?.serial||0));};
B.materialOrder=p=>({id:p.id,type:'subscription',deadline:p.deadline,attempts:p.attempts,items:[C.line(p.snapshot.productId,p.snapshot.variantId,p.snapshot.quantity)],fulfillment:{date:p.snapshot.dates[0]},reserveAt:A.schedule.today()});
B.materialReason=(snapshot,exclude)=>I.reason(I.materials(B.materialOrder({id:exclude||'draft',snapshot})),exclude);
const offering=B.offering;B.offering=id=>{const result=offering(id);return result==='available'&&!I.productAvailable(id,undefined,B.pending()?.id)?'unavailable':result;};
const configReason=B.configReason;B.configReason=()=>configReason()||B.materialReason({productId:B.state.draft.productId,variantId:B.state.draft.variant,quantity:B.state.draft.quantity,dates:B.dates()},B.pending()?.id);
const createPurchase=B.createPurchase;B.createPurchase=()=>{B.syncSerial();const p=createPurchase();if(!p)return p;const error=I.reserve(B.materialOrder(p));if(error){B.message=error;p.payment='revalidation';A.schedule.release(p.id);return null;}return p;};
const retry=B.retry;B.retry=p=>{if(!p||p.paid||!['failed','expired'].includes(p.payment))return false;const error=B.materialReason(p.snapshot,p.id);if(error){B.message=error;p.payment='revalidation';I.release(p.id);A.schedule.release(p.id);return false;}if(!retry(p))return false;const reason=I.reserve(B.materialOrder(p));if(reason){B.message=reason;p.payment='revalidation';A.schedule.release(p.id);return false;}return true;};
const cancel=B.cancel;B.cancel=p=>{const result=cancel(p);if(result)I.release(p.id);return result;};
const change=B.change;B.change=()=>{const pending=B.pending(),result=change();if(result&&pending&&!pending.paid)I.release(pending.id);return result;};
B.allRecords=()=>[...new Map([...Array.from(A.account.buckets.values()).flatMap(b=>b.subscription?.records||[]),...B.state.records].map(r=>[r.id,r])).values()];
// Demonstration schedule defaults; the owner will maintain these in production.
for(const schedule of B.schedules){schedule.fulfillment_day=schedule.day;schedule.preparation_day=(schedule.day+6)%7;}
B.preparationDate=o=>{const r=B.allRecords().find(r=>r.id===o.subscriptionId),schedule=B.schedules.find(s=>s.id===r?.snapshot.scheduleId);if(!schedule||!Number.isInteger(schedule.preparation_day))return null;const days=(A.schedule.day(o.fulfillment.date)-schedule.preparation_day+7)%7;return A.schedule.add(o.fulfillment.date,-days);};
B.reserveNext=r=>{
 const pending=r.deliveries.map(d=>({d,o:I.allOrders().find(o=>o.id===d.orderId)})).filter(x=>x.o&&S.orderStatus(x.o)==='confirmed').sort((a,b)=>a.d.date.localeCompare(b.d.date));
 const next=pending[0];
 for(const [index,{o}] of pending.entries()){if(o!==next?.o&&I.reservations.get(o.id)?.status==='confirmed')I.release(o.id);I.retime(o,o===next?.o?A.schedule.today():B.preparationDate(pending[index-1].o)||pending[index-1].o.fulfillment.date);}
 if(!next)return '';
 const error=I.reserve(next.o,true);next.o.materialIssue=error;
 if(error)S.emit('shortage:'+next.o.id,'inventory',next.o.id+' needs ingredients before preparation.','staff/production/'+next.o.id);
 return error;
};
const pay=B.pay;B.pay=(p,state)=>{
 if(!p||p.paid||p.payment==='cancelled')return;
 if(state==='confirmed'){
  const error=I.reserve(B.materialOrder(p),true);
  if(error){p.paid=true;p.payment='resolution';p.resolution=error;p.paidAt=new Date().toLocaleString();I.release(p.id);A.schedule.release(p.id);return;}
 }
 C.state.serial=Math.max(C.state.serial,...I.allOrders().map(o=>Number(o.id.match(/^K406-(\d+)$/)?.[1])||0));
 B.syncSerial();const record=pay(p,state);
 if(['failed','expired','revalidation'].includes(state)||p.payment==='resolution')I.release(p.id);
 if(record){
  I.release(p.id);
  for(const d of record.deliveries){const o=C.state.orders.find(o=>o.id===d.orderId);o.customer_id=record.customer_id||A.account.id();d.status='scheduled';I.plan(o);C.recordHistory(o,'confirmed');S.emit('new:'+o.id,'orders',o.id+' is scheduled for '+d.date+'.','staff/production/'+o.id);}
  B.reserveNext(record);
 }
 return record;
};
const sync=B.sync;B.sync=r=>{const result=sync(r);for(const d of r.deliveries){const o=I.allOrders().find(o=>o.id===d.orderId),status=o?S.orderStatus(o):'confirmed';d.status=({confirmed:'scheduled',preparing:'preparing',ready:'ready',completed:'fulfilled',cancelled:'cancelled'})[status]||'scheduled';if(d.status==='fulfilled')d.fulfilled_at=o.completedAt||d.fulfilled_at||Date.now();}return result;};
const defer=B.defer;B.defer=(r,d,option)=>{const error=defer(r,d,option);if(!error){d.status='scheduled';B.reserveNext(r);S.emit('defer:'+d.orderId+':'+d.date,'orders',d.orderId+' moved from '+d.originalDate+' to '+d.date+'.','staff/production/'+d.orderId);}return error;};
const transition=S.transition;S.transition=(...args)=>{const error=transition(...args);if(!error&&args[1]==='preparing'){const r=B.allRecords().find(r=>r.deliveries.some(d=>d.orderId===args[0]));if(r)B.reserveNext(r);}return error;};
// Stock reconciliation retries outstanding next-delivery reservations, never deducting stock.
const stockChanged=S.changed;S.changed=()=>{for(const r of B.allRecords())B.reserveNext(r);stockChanged();};
let availabilitySignature='';setInterval(()=>{const signature=I.items.map(i=>I.available(i.id)).join(',');if(signature===availabilitySignature)return;availabilitySignature=signature;I.notify();if(A.route==='shop')A.catalog.refresh();if(A.route==='product')window.updatePricing();},1000);
const reset=C.reset;C.reset=()=>{reset();I.reset();S.events=[];S.history.clear();S.versions.clear();S.results.clear();S.stockWarnings.clear();S.stockEpisodes.clear();S.role='customer';};
// Cake holds continue to count capacity after ingredient consumption. Material status lives in I.
document.addEventListener('change',e=>{if(e.target.id==='mock-commerce-courier'){const o=C.currentOrder();if(o&&o.fulfillment.method==='delivery'&&o.type!=='cake'){o.delivery={order_id:o.id,status:({prebooking:'pending',transit:'in_transit'})[e.target.value]||e.target.value};C.render();}}if(e.target.id==='mock-staff-mode'){S.mode=e.target.value;S.render();}if(e.target.id==='mock-staff-save')S.saveError=e.target.value==='error';});
})();
