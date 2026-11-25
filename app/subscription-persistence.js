/* SQLite projections for the existing subscription checkout and workspaces. */
(() => {
const A=K406,B=A.subscriptions,C=A.commerce,D=A.schedule,S=B.state;
const api=(action,input)=>A.authUI.api('subscriptions'+(action?'/'+action:''),input);
const attempts=new WeakMap();
let operations=null,customerRequest=0,operationsRequest=0;

function merge(rows,saved){
 return [...rows.filter(row=>!row.persistedSubscription),...saved];
}
function project(data,operational){
 if(operational)operations={generation:A.session.generation,...data};
 else {
  S.purchases=merge(S.purchases,data.purchases);
  S.records=merge(S.records,data.records);
  C.state.orders=merge(C.state.orders,data.orders);
 }
 D.allocations=[...D.allocations.filter(row=>!String(row.id).startsWith('SUB-ALLOC-')),...data.allocations];
 D.config.subscriptionUnits=data.settings.units;
 D.config.timing.subscription={value:data.settings.value,unit:data.settings.unit,cutoff:data.settings.cutoff};
 D.config.blocked=data.blocked;
 B.requests=[...B.requests.filter(row=>!row.persistedSubscription),...data.requests.map(row=>({...row,persistedSubscription:true}))];
}

const P=B.persistence={busy:false};
const currentOperations=()=>A.session.operational()&&operations?.generation===A.session.generation?operations:null;
P.orders=()=>currentOperations()?.orders||[];
P.records=()=>currentOperations()?.records||[];
P.purchases=()=>currentOperations()?.purchases||[];
P.refresh=async()=>{
 const operational=A.session.operational(),generation=A.session.generation;
 if(!operational&&!A.account.allowed())return;
 const request=operational?++operationsRequest:++customerRequest;
 const data=await api(operational?'operations':'');
 if(generation!==A.session.generation||request!==(operational?operationsRequest:customerRequest))return;
 project(data,operational);
};
P.run=async(action,input,button,operational=false)=>{
 if(P.busy)return {error:'An update is already in progress.'};
 const generation=A.session.generation;
 P.busy=true;if(button)button.disabled=true;
 if(operational)operationsRequest++;else customerRequest++;
 try{
  const data=await api(action,input);
  if(generation!==A.session.generation)return {error:'Your session changed. Reopen this page.'};
  if(operational)operationsRequest++;else customerRequest++;
  project(data,operational);
  return data;
 }catch(error){return {error:error instanceof TypeError?'Subscription service is unavailable. Try again.':error.message};}
 finally{P.busy=false;if(button)button.disabled=false;}
};
P.create=async button=>{
 if(!B.ready()||B.mock.review!=='normal')return;
 const draft=S.draft,snapshot=B.snapshot();
 let attempt=attempts.get(draft);
 const input={variantId:snapshot.productId+':'+snapshot.variantId,quantity:snapshot.quantity,
  unitPriceCents:Math.round(snapshot.unit*100),start:snapshot.dates[0],method:snapshot.method,scheduleId:snapshot.scheduleId,
  preparationDay:snapshot.scheduleSnapshot.preparation_day,fulfillmentDay:snapshot.scheduleSnapshot.fulfillment_day,
  address:snapshot.address,fees:snapshot.fees?.map(fee=>Math.round(fee*100))};
 const signature=JSON.stringify(input);
 const pending=B.pending();
 if(attempt?.revision!==draft.revision||attempt.signature!==signature||['expired','cancelled'].includes(pending?.payment)){
  attempt={revision:draft.revision,signature,key:crypto.randomUUID()};
  attempts.set(draft,attempt);
 }
 const result=await P.run('checkout',{...input,key:attempt.key,checkoutQuote:B.deliveryRoute.checkoutQuote(),
  replaceId:pending?.payment==='waiting'?pending.id:undefined},button);
 if(result.error){
  B.message=result.error;
  if(result.error==='This subscription schedule has changed.'){
   try{
    await Promise.all([A.productAdmin.loadCatalog(),P.refresh()]);
    if(S.draft!==draft||A.route!=='subscription'||B.parts[1]!=='review')return;
    const schedule=B.schedule(),starts=B.starts();
    draft.scheduleId=schedule?.id||'';
    if(!starts.includes(draft.start))draft.start=starts[0]||'';
    draft.revision++;
    draft.scheduleNotice='The bakery changed this schedule. Review the updated dates before paying.';
    B.deliveryRoute.reset();
    location.hash='#/subscription/configure';
   }catch{B.message='The schedule changed. Reload to get the latest dates.';}
   return;
  }
  if(result.error.includes('selling price changed'))await A.productAdmin.loadCatalog().catch(()=>{});
  await P.refresh().catch(()=>{});
  return;
 }
 draft.purchaseId=result.id;
 location.hash='#/subscription/payment/'+result.id;
};
P.fulfill=async(id,action,button)=>{
 const result=await P.run('fulfillment',{id,action},button,true);
 if(result.error)return result.error;
 if(action==='preparing')await A.inventory.refresh().catch(()=>{});
 A.owner.render();A.staff.render();
 return '';
};
P.courier=async(id,action,outcome,key,expectedStatus)=>{
 const result=await P.run('courier',{id,action,outcome,key,expectedStatus},null,true);
 if(result.error)return result.error;
 A.owner.render();A.staff.render();
 return '';
};
const refreshOperations=A.pickup.refreshOperations;
A.pickup.refreshOperations=async()=>Promise.all([refreshOperations(),P.refresh().then(()=>{
 if(A.session.operational()){A.owner.render();A.staff.render();}
})]);
const show=B.show;
B.show=parts=>{
 show(parts);
 if(A.account.allowed())void P.refresh().then(()=>{if(B.active())B.render();}).catch(error=>A.toast(error.message));
};
const showCommerce=C.show;
C.show=parts=>{
 showCommerce(parts);
 if(parts[0]==='orders'&&A.account.allowed())void P.refresh().then(()=>{if(A.route==='orders')C.render();}).catch(error=>A.toast(error.message));
};
const reviewable=B.reviewable;
B.reviewable=record=>record?.persistedSubscription?A.account.owns(record)&&record.status==='completed':reviewable(record);
})();
