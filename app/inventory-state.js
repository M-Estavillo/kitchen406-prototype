/* Shared material ledger for this in-memory preview. Quantities are base units. */
(() => {
const A=K406,C=A.commerce;
const I=A.inventory={items:[],requirements:new Map(),requirementRows:new Map(),reservationHistory:[],reservations:new Map(),movements:[],operations:new Set(),changeResults:new Map(),serial:0,holdSerial:0};
I.reset=()=>{I.items=[];I.requirements.clear();I.requirementRows.clear();I.reservationHistory=[];I.reservations.clear();I.movements=[];I.operations.clear();I.changeResults.clear();I.serial=0;I.holdSerial=0;};I.reset();
I.item=id=>I.items.find(i=>i.id===id);
I.stockUnits=unit=>[unit,...(unit==='g'?['kg']:unit==='ml'?['l']:[])];
I.allOrders=()=>{const map=new Map();for(const o of [...[...A.account.buckets.values()].flatMap(b=>b.commerce?.orders||[]),...C.state.orders])if(!o.persistedPickup&&!o.persistedSubscription)map.set(o.id,o);return [...map.values()];};
I.recipe=()=>null;
I.materials=o=>{
 if(o.quotationId){const q=A.cakes.state.quotations.find(q=>q.id===o.quotationId);return q?{...q.materials,box:o.items.reduce((n,i)=>n+i.quantity,0)}:null;}
 if(o.type==='cake')return null;
 const out={};for(const line of o.items){const variant=line.key?.split(':')[1]||'standard',bom=I.recipe(line.productId,variant);if(!bom)return null;for(const [id,q] of Object.entries(bom))out[id]=(out[id]||0)+q*line.quantity;}return out;
};
I.projectRequirements=date=>{
 const totals=new Map(),missing=[];
 for(const order of I.allOrders()){
  const confirmed=order.paid&&order.status==='confirmed';
  const pending=!order.paid&&order.status==='pending-payment';
  if((!confirmed&&!pending)||I.reservations.get(order.id)?.status==='consumed')continue;
  const preparation=order.type==='subscription'?A.subscriptions.preparationDate(order):order.fulfillment?.date;
  if(preparation!==date)continue;
  const materials=I.materials(order);
  if(!materials||!Object.keys(materials).length||Object.entries(materials).some(([id,q])=>!I.item(id)||!Number.isFinite(q)||q<0)){
   missing.push(order.id);
   continue;
  }
  for(const [id,quantity] of Object.entries(materials)){
   if(!totals.has(id))totals.set(id,{ingredient:I.item(id),confirmed:0,pending:0});
   totals.get(id)[confirmed?'confirmed':'pending']+=quantity;
  }
 }
 return {rows:[...totals.values()].sort((a,b)=>a.ingredient.name.localeCompare(b.ingredient.name)),missing};
};
I.active=r=>r.status==='confirmed'||r.status==='held'&&(A.checkoutHolds?.retained(r.orderId,r.expires)??r.expires>Date.now());
I.reserved=(id,exclude)=>[...I.reservations.values()].filter(r=>!(Array.isArray(exclude)?exclude.includes(r.orderId):r.orderId===exclude)&&I.active(r)).reduce((n,r)=>n+(r.materials[id]||0),0);
I.available=(id,exclude)=>I.item(id).stock-I.reserved(id,exclude);
I.status=i=>I.available(i.id)<=0?'Out of stock':I.available(i.id)<=i.threshold?'Low stock':'Available';
I.reason=(materials,exclude)=>!materials?'Recipe requirements are not configured.':Object.entries(materials).some(([id,q])=>!I.item(id)||!Number.isFinite(q)||q<0)?'Invalid ingredient requirements.':Object.entries(materials).some(([id,q])=>q>0&&I.item(id).archivedAt)?'A required material is archived. Review the recipe before continuing.':Object.entries(materials).find(([id,q])=>I.available(id,exclude)+1e-8<q)?'Insufficient available ingredients. Review inventory before continuing.':'';
I.plan=(o,materials)=>{if(!I.requirements.has(o.id)){const m=materials===undefined?I.materials(o):materials;if(!m)return null;I.requirements.set(o.id,m);for(const [id,quantity] of Object.entries(m))I.requirementRows.set(o.id+':'+id,{requirement_id:o.id+':'+id,order_id:o.id,inventory_id:id,quantity_required:quantity,fulfillment_date:o.fulfillment?.date||null,reserve_at:o.reserveAt||null,created_at:Date.now()});}return I.requirements.get(o.id);};
I.notify=()=>{A.staff?.checkStockAlerts?.();};
I.retime=(o,reserveAt)=>{I.plan(o);for(const row of I.requirementRows.values())if(row.order_id===o.id){row.fulfillment_date=o.fulfillment.date;row.reserve_at=reserveAt;}};
I.closeReservation=(r,status)=>{r.status=status;r.rows?.forEach(row=>{row.status=status;row[status==='consumed'?'consumed_at':'released_at']=Date.now();});};
I.reserve=(o,confirmed=false,notify=true,exclude=o.id)=>{
 const existing=I.reservations.get(o.id);if(existing?.status==='consumed')return '';
 if(existing&&I.active(existing)){existing.status=confirmed?'confirmed':existing.status;existing.rows.forEach(row=>row.status=existing.status);if(notify)I.notify();return '';}
 const materials=I.requirements.get(o.id)||I.materials(o),error=I.reason(materials,exclude);if(error)return error;I.plan(o,materials);
 if(!confirmed)A.checkoutHolds?.ensure(o);
 if(existing?.status==='held')I.closeReservation(existing,'expired');
 const holdId='IH-'+(++I.holdSerial),status=confirmed?'confirmed':'held',expires=C.holdUntil(o)||Date.now()+C.checkoutHoldMs;
 const rows=Object.entries(materials).map(([id,quantity])=>({reservation_id:holdId+':'+id,requirement_id:o.id+':'+id,hold_id:holdId,quantity,status,expires_at:expires,created_at:Date.now()}));
 I.reservationHistory.push(...rows);I.reservations.set(o.id,{orderId:o.id,holdId,materials:{...materials},status,expires,rows});const checkout=A.checkoutHolds?.get(o.attempts?.at(-1));if(checkout){rows.forEach(row=>row.checkout_hold_id=checkout.id);const recovery=checkout.status!=='active'&&checkout.status!=='confirmed';if(recovery)rows.forEach(row=>row.recovery_for_hold_id=checkout.id);}if(notify)I.notify();return '';
};
I.release=id=>{const r=I.reservations.get(id);if(r&&r.status!=='consumed')I.closeReservation(r,'released');I.notify();};
I.move=(id,delta,type,actor,orderId,reason,notes,key,totalCost=null)=>{
 const i=I.item(id),before=i.stock;i.stock=Math.round((before+delta)*1000)/1000;
 I.movements.unshift({id:'MOV-'+(++I.serial),ingredientId:id,delta,type,actor,performed_by_account_id:A.session?.actor()?.id||null,unit_cost_snapshot:Number.isFinite(i.cost)?i.cost:null,unit_cost_snapshot_unit:i.unit,total_cost:totalCost,reservation_id:I.reservations.get(orderId)?.rows?.find(r=>r.requirement_id===orderId+':'+id)?.reservation_id||null,orderId:orderId||null,reason:reason||'',notes:notes||'',before,after:i.stock,at:Date.now(),key,operation_key:key});
};
I.preparationIssue=o=>{
 const materials=I.requirements.get(o.id);
 const reservation=I.reservations.get(o.id);
 if(reservation?.status!=='confirmed')return o.materialIssue||(o.type==='subscription'?'Awaiting a confirmed subscription ingredient reservation. Review material requirements.':'Confirmed ingredient reservation is missing. Review the fulfillment reservation.');
 if(!materials||!Object.keys(materials).length)return 'Recipe requirements are not configured.';
 const error=I.reason(materials,o.id);if(error)return error;
 const lines=Object.entries(materials);
 if(Object.keys(reservation.materials).length!==lines.length||lines.some(([id,quantity])=>reservation.materials[id]!==quantity||!reservation.rows?.some(row=>row.status==='confirmed'&&row.requirement_id===o.id+':'+id&&row.quantity===quantity)))return 'Ingredient reservation is incomplete. Review the fulfillment reservation.';
 return lines.some(([id,quantity])=>I.item(id).stock+1e-8<quantity)?'Physical stock is insufficient.':'';
};
I.consumed=o=>{
 const reservation=I.reservations.get(o.id),key='consume:'+o.id;
 return reservation?.status==='consumed'&&reservation.rows?.length>0&&I.operations.has(key)&&Object.entries(reservation.materials).every(([id,quantity])=>I.movements.some(move=>move.orderId===o.id&&move.ingredientId===id&&move.type==='consumption'&&move.key===key+':'+id&&move.delta===-quantity));
};
I.consumptionRollback=o=>{
 const reservation=I.reservations.get(o.id),key='consume:'+o.id;
 const rows=reservation.rows.map(row=>[row,row.status,row.consumed_at]);
 const stocks=Object.keys(reservation.materials).map(id=>[I.item(id),I.item(id).stock]);
 const {serial}=I, length=I.movements.length;
 return ()=>{
  for(const [item,stock] of stocks)item.stock=stock;
  reservation.status='confirmed';
  for(const [row,status,at] of rows){row.status=status;if(at===undefined)delete row.consumed_at;else row.consumed_at=at;}
  I.movements.splice(0,I.movements.length-length);I.serial=serial;I.operations.delete(key);
 };
};
I.consume=(o,actor,notify=true)=>{
 const key='consume:'+o.id;
 if(I.consumed(o))return '';
 const error=I.preparationIssue(o);if(error)return error;
 const reservation=I.reservations.get(o.id);
 for(const [id,quantity] of Object.entries(reservation.materials))I.move(id,-quantity,'consumption',actor,o.id,'','Preparation started',key+':'+id);
 I.closeReservation(reservation,'consumed');I.operations.add(key);
 if(notify)I.notify();
 return '';
};
I.add=({name,unit,stock,totalCost,threshold,key,category='ingredient'})=>{
 if(!A.session?.ownerAllowed())return 'Owner access required.';
 name=name.trim();
 const signature=JSON.stringify({name,unit,stock,totalCost,threshold,category});
 if(I.operations.has(key))return I.changeResults.get(key)===signature?'':'This operation belongs to another ingredient.';
 if(!key||!name||name.length>120||I.items.some(i=>i.name.toLowerCase()===name.toLowerCase()))return 'Enter a unique ingredient name.';
 if(!['ingredient','packaging'].includes(category))return 'Select Ingredient or Packaging.';
 if(!['g','ml','pcs'].includes(unit))return 'Select a valid unit.';
 if(![stock,totalCost,threshold].every(n=>Number.isFinite(n)&&n>=0))return 'Enter nonnegative stock, cost, and threshold values.';
 if(![stock,threshold].every(n=>Number.isSafeInteger(Math.round(n*1000))&&Math.abs(n*1000-Math.round(n*1000))<1e-6&&(unit!=='pcs'||Number.isInteger(n))))return 'Use whole pieces or up to three decimal places.';
 if(!Number.isSafeInteger(Math.round(totalCost*100))||Math.abs(totalCost*100-Math.round(totalCost*100))>1e-6||stock===0&&totalCost!==0)return 'Use a cost with up to two decimal places. Zero stock must have zero cost.';
 const item={id:'ingredient-'+crypto.randomUUID(),name,unit,category,stock:0,opening:0,threshold,cost:stock?totalCost/stock:0};
 I.items.push(item);
 if(stock)I.move(item.id,stock,'restock',A.session.actor().name,null,'','Opening stock',key,totalCost);
 I.operations.add(key);I.changeResults.set(key,signature);
 if(A.pricing)A.pricing.version++;
 A.staff.changed();
 return '';
};
I.change=({id,quantity,unit,type,totalCost,reason='',notes='',key})=>{
 if(!A.session?.operational())return 'Operational access required.';
 if(!key)return 'An operation identifier is required.';
 const restock=type==='restock';
 const signature=JSON.stringify({id,quantity,unit,type,totalCost:restock?totalCost:null,reason,notes});
 if(I.operations.has(key))return I.changeResults.get(key)===signature?'':'This operation belongs to another movement.';
 const i=I.item(id);
 if(!i||unit!==undefined&&!I.stockUnits(i.unit).includes(unit))return 'Select a valid ingredient unit.';
 if(!Number.isFinite(quantity))return 'Enter a valid quantity.';
 if(unit==='kg'||unit==='l')quantity*=1000;
 const roundedQuantity=Math.round(quantity*1000);
 if(!Number.isSafeInteger(roundedQuantity)||quantity<0||restock&&roundedQuantity===0||i.unit==='pcs'&&!Number.isInteger(quantity)||Math.abs(quantity*1000-roundedQuantity)>1e-6)return 'Enter a valid quantity in the ingredient unit (up to 3 decimal places).';
 quantity=roundedQuantity/1000;
 if(!['restock','adjustment'].includes(type))return 'Unsupported movement.';
 if(type==='adjustment'&&!['spoilage','damage','miscount','theft','correction','other'].includes(reason))return 'Choose an adjustment reason.';
 const delta=restock?quantity:quantity-i.stock;
 if(Math.abs(delta)<1e-8)return 'The physical count matches the recorded stock.';
 if(restock){
  const cents=Math.round(totalCost*100);
  if(!Number.isFinite(totalCost)||totalCost<0||!Number.isSafeInteger(cents)||Math.abs(totalCost*100-cents)>1e-6)return 'Enter a nonnegative total cost with up to two decimal places.';
  totalCost=cents/100;
  i.cost=(i.stock*i.cost+totalCost)/(i.stock+quantity);
  if(A.pricing)A.pricing.version++;
 }
 I.move(id,delta,type,A.session.actor().name,null,reason,notes,key,restock?totalCost:null);
 I.operations.add(key);I.changeResults.set(key,signature);if(restock)A.subscriptions?.retryIngredientShortages?.(id);A.staff.changed();return '';
};
I.databaseAccount=null;
I.loadState='idle';
I.recipeVariants=new Map();
I.recipeVersion=0;
let queue=Promise.resolve();
let customerStock;
I.customerRecipes=new Map();

function stockDeltas(){
 const deltas=new Map();
 for(const movement of I.movements){
  if(!movement.persisted)deltas.set(movement.ingredientId,(deltas.get(movement.ingredientId)||0)+movement.delta);
 }
 return deltas;
}

function applyCustomerStock(){
 if(!customerStock)return;
 const deltas=stockDeltas();
 I.items=customerStock.map(row=>({
  id:row.inventory_id,archivedAt:Boolean(row.archived),
  stock:Math.round((row.stock_on_hand+(deltas.get(row.inventory_id)||0))*1000)/1000
 }));
}

I.syncCustomerAvailability=({stock,requirements})=>{
 customerStock=stock;
 I.customerRecipes.clear();
 for(const row of requirements){
  if(!I.customerRecipes.has(row.variant_id))I.customerRecipes.set(row.variant_id,{});
  I.customerRecipes.get(row.variant_id)[row.inventory_id]=row.quantity_required;
 }
 if(!I.databaseAccount)applyCustomerStock();
};

I.useDatabase=account=>{
 const id=account?.account_id||null;
 if(id===I.databaseAccount)return;
 I.items=[];
 I.movements=I.movements.filter(m=>!m.persisted);
 for(const id of I.recipeVariants.keys()){A.pricing.recipes.delete(id);A.pricing.overheads.delete(id);}
 I.recipeVariants.clear();
 I.recipeVersion=0;
 I.databaseAccount=id;
 if(!id)applyCustomerStock();
 I.loadState=id?'loading':'idle';
 queue=Promise.resolve();
};

function applySnapshot({items,movements,recipes,bom,recipeVersion,products,categories,schedules=[],pricing,productTimings=[]}){
 const local=I.movements.filter(m=>!m.persisted);
 const deltas=stockDeltas();
 I.items=items.map(i=>({
  id:i.inventory_id,name:i.name,category:i.material_type,unit:i.unit,threshold:i.reorder_threshold,
  stock:Math.round((i.stock_on_hand+(deltas.get(i.inventory_id)||0))*1000)/1000,
  cost:i.cost_per_unit,version:i.updated_at,archivedAt:i.archived_at
 }));
 const materialUnits=new Map(I.items.map(i=>[i.id,i.unit]));
 I.movements=[...local,...movements.map(m=>({
  id:m.movement_id,ingredientId:m.inventory_id,type:m.movement_type,delta:m.quantity_change,
  before:m.before,after:m.after,unit_cost_snapshot:m.unit_cost_snapshot,
  unit_cost_snapshot_unit:materialUnits.get(m.inventory_id),performed_by_account_id:m.performed_by_account_id,
  actor:m.actor,orderId:m.order_id,reason:m.reason,notes:m.notes,at:Date.parse(m.occurred_at),persisted:true
 }))].sort((a,b)=>b.at-a.at);
 for(const id of I.recipeVariants.keys()){A.pricing.recipes.delete(id);A.pricing.overheads.delete(id);}
 I.recipeVariants=new Map(recipes.map(v=>[v.variant_id,v]));
 I.recipeVersion=recipeVersion;
 for(const v of recipes){
  if(v.utility_overhead!==null)A.pricing.overheads.set(v.variant_id,v.utility_overhead);
 }
 for(const row of bom){
  if(!A.pricing.recipes.has(row.variant_id))A.pricing.recipes.set(row.variant_id,{});
  A.pricing.recipes.get(row.variant_id)[row.inventory_id]=row.quantity_required;
 }
 A.pricing.applySettings(pricing);
 A.pricing.productTimings=new Map(productTimings.map(t=>[t.product_id,t]));
 A.productAdmin.syncInventoryCatalog(products,categories,recipes);
 A.capacity.syncSchedules(schedules);
 A.pricing.version++;
 I.loadState='ready';
}

function request(action,input){
 const account=I.databaseAccount,generation=A.session.generation;
 const current=()=>I.databaseAccount===account&&A.session.generation===generation;
 const run=async()=>{
  if(!current())return 'This session changed. Reopen the form.';
  try{
   const snapshot=await A.authUI.api('inventory'+(action?'/'+action:''),input);
   if(!current())return 'This session changed. Reopen the form.';
   applySnapshot(snapshot);
   return '';
  }catch(error){
   if(current()&&!action)I.loadState='error';
   if(!current())return 'This session changed. Reopen the form.';
   return error.message==='server-error'||error instanceof TypeError||error instanceof SyntaxError
    ?'Inventory could not be reached. Please try again.':error.message;
  }
 };
 const result=queue.then(run);
 queue=result.catch(()=>{});
 return result;
}

I.refresh=async()=>{
 if(!I.databaseAccount)return;
 if(I.loadState!=='ready')I.loadState='loading';
 const account=I.databaseAccount,generation=A.session.generation;
 await request();
 if(I.databaseAccount===account&&A.session.generation===generation)A.operations.changed();
};
I.unitLocked=id=>I.movements.some(m=>m.ingredientId===id)||
 [...A.pricing.recipes.values(),...I.requirements.values()].some(materials=>Object.hasOwn(materials,id))||
 A.cakes.state.quotations.some(q=>Object.hasOwn(q.materials||{},id))||
 [...A.cakeData.options,...A.cakeData.addons].some(option=>Object.hasOwn(option.ingredients||{},id));
I.activeReservations=id=>[...I.reservations.values()].filter(r=>I.active(r)&&r.materials[id]>0);
I.saveRecipes=async(product,recipes,key,coverUpload,schedule)=>{
 const action=schedule?'recipe/schedule':coverUpload?'recipe/cover':'recipe';
 const error=await I.save(action,{product,recipes,key,recipeVersion:I.recipeVersion,coverUpload,schedule});
 if(schedule&&error==='not-found')return 'Restart the local server and reload the page to enable subscription schedule editing.';
 if(coverUpload&&error==='not-found')return 'Restart the local server and reload the page to enable cover uploads.';
 return error;
};
I.save=async(action,input)=>{
 const item=I.item(input.id);
 if(action==='archive'&&item&&(item.stock||I.activeReservations(item.id).length))return 'Clear physical stock and active reservations before archiving this material.';
 if(action==='remove'&&item&&(item.stock||I.unitLocked(item.id)))return 'Only unused materials with no stock can be removed.';
 if(action==='edit'&&item&&input.unit!==item.unit&&I.unitLocked(item.id))return 'The unit is locked because this material is already in use.';
 if(action==='stock'&&input.type==='adjustment'&&I.movements.some(m=>m.ingredientId===input.id&&!m.persisted))return 'This material has preview production movements. Reload inventory before recording a physical count.';
 const error=await request(action,input);
 if(error==='Inventory changed. Close and reopen the form.'||error==='Recipes changed. Close and reopen the editor.')await I.refresh();
 if(!error&&action==='stock'&&input.type==='restock')A.subscriptions?.retryIngredientShortages?.(input.id);
 return error;
};
})();
