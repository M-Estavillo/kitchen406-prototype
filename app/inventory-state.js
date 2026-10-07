/* Shared material ledger for this in-memory preview. Quantities are base units. */
(() => {
const A=K406,C=A.commerce;
const I=A.inventory={items:[],requirements:new Map(),requirementRows:new Map(),reservationHistory:[],reservations:new Map(),movements:[],operations:new Set(),changeResults:new Map(),serial:0,holdSerial:0};
const seed=[['flour','Bread flour','g',50000,2000],['butter','Unsalted butter','g',5000,1000],['cocoa','Cocoa','g',5000,500],['vanilla','Vanilla','g',1000,100],['tint','Food coloring','g',100,10],['water','Water','ml',20000,2000],['sugar','Sugar','g',10000,1000],['yeast','Yeast','g',1000,100],['salt','Salt','g',1000,100],['milk','Milk','ml',10000,1000],['box','Packaging','pcs',200,20]];
seed.push(...[['egg','Egg','g'],['cardamom','Cardamom','g'],['ube','Ube','g'],['oil','Olive oil','ml'],['rosemary','Rosemary','g'],['honey','Honey','g'],['herbs','Herbs','g'],['cinnamon','Cinnamon','g'],['banana','Banana','g'],['walnut','Walnuts','g'],['olive','Olives','g'],['almond','Almonds','g'],['garlic','Garlic','g'],['cream','Cream','ml']].map(([id,name,unit])=>[id,name,unit,5000,250]));
I.reset=()=>{I.items=seed.map(([id,name,unit,stock,threshold])=>({id,name,unit,stock,threshold,opening:stock}));I.requirements.clear();I.requirementRows.clear();I.reservationHistory=[];I.reservations.clear();I.movements=[];I.operations.clear();I.changeResults.clear();I.serial=0;I.holdSerial=0;};I.reset();
I.item=id=>I.items.find(i=>i.id===id);
I.allOrders=()=>{const map=new Map();for(const o of [...[...A.account.buckets.values()].flatMap(b=>b.commerce?.orders||[]),...C.state.orders])map.set(o.id,o);return [...map.values()];};
I.recipe=(productId,variant='standard')=>{
 if(!A.variant(productId,variant))return null;
 // Explicit demo recipes, not client-approved production formulations.
 const factor=variant==='large'?950/650:1;
 const recipes={
  1:{flour:400,milk:180,butter:80,cocoa:60,sugar:50,yeast:4,salt:6},
  2:{flour:460,water:330,salt:9},
  3:{flour:150,water:75,butter:100,sugar:80,salt:3,yeast:2,cardamom:2},
  4:{flour:300,milk:180,butter:30,sugar:25,yeast:4,salt:6},
  5:{flour:65,milk:25,butter:40,sugar:15,yeast:1,salt:1,ube:30},
  6:{flour:70,milk:250,egg:60,butter:20,sugar:100,vanilla:2,salt:1},
  7:{flour:300,water:230,oil:35,rosemary:3,salt:6,yeast:3},
  8:{butter:180,honey:18,herbs:2},
  9:{flour:250,milk:140,butter:25,sugar:30,yeast:3,salt:4},
  10:{flour:250,milk:140,butter:70,sugar:80,cinnamon:6,yeast:3,salt:4},
  11:{flour:100,cocoa:60,butter:120,sugar:150,egg:100,salt:2},
  12:{flour:180,butter:100,sugar:70,egg:30,vanilla:2,salt:2},
  13:{flour:250,milk:100,butter:60,egg:60,sugar:25,yeast:3,salt:4},
  14:{flour:200,banana:200,walnut:60,butter:80,egg:100,sugar:90,salt:3},
  15:{flour:440,water:310,olive:90,salt:7},
  16:{flour:65,milk:25,butter:55,sugar:30,egg:20,almond:30,yeast:1,salt:1},
  17:{flour:180,water:125,salt:4,yeast:1},
  18:{flour:300,water:230,oil:35,garlic:30,salt:6,yeast:3},
  19:{flour:45,butter:35,sugar:50,cream:30,egg:10,salt:1},
  20:{butter:198,salt:2}
 };
 if(!recipes[productId])return null;
 const base={...recipes[productId],box:1};
 return Object.fromEntries(Object.entries(base).map(([id,q])=>[id,id==='box'?q:Math.round(q*factor*1000)/1000]));
};
I.materials=o=>{
 if(o.quotationId){const q=A.cakes.state.quotations.find(q=>q.id===o.quotationId);return q?{...q.materials,box:o.items.reduce((n,i)=>n+i.quantity,0)}:null;}
 if(o.type==='cake')return null;
 const out={};for(const line of o.items){const variant=line.key?.split(':')[1]||'standard',bom=I.recipe(line.productId,variant);if(!bom)return null;for(const [id,q] of Object.entries(bom))out[id]=(out[id]||0)+q*line.quantity;}return out;
};
I.active=r=>r.status==='confirmed'||r.status==='held'&&r.expires>Date.now();
I.reserved=(id,exclude)=>[...I.reservations.values()].filter(r=>r.orderId!==exclude&&I.active(r)).reduce((n,r)=>n+(r.materials[id]||0),0);
I.available=(id,exclude)=>I.item(id).stock-I.reserved(id,exclude);
I.status=i=>I.available(i.id)<=0?'Out of stock':I.available(i.id)<=i.threshold?'Low stock':'Available';
I.reason=(materials,exclude)=>!materials?'Recipe requirements are not configured.':Object.entries(materials).some(([id,q])=>!I.item(id)||!Number.isFinite(q)||q<0)?'Invalid ingredient requirements.':Object.entries(materials).find(([id,q])=>I.available(id,exclude)+1e-8<q)?'Insufficient available ingredients. Review inventory before continuing.':'';
I.plan=o=>{if(!I.requirements.has(o.id)){const m=I.materials(o);if(!m)return null;I.requirements.set(o.id,m);for(const [id,quantity] of Object.entries(m))I.requirementRows.set(o.id+':'+id,{requirement_id:o.id+':'+id,order_id:o.id,inventory_id:id,quantity_required:quantity,fulfillment_date:o.fulfillment?.date||null,reserve_at:o.reserveAt||null,created_at:Date.now()});}return I.requirements.get(o.id);};
I.notify=()=>{A.staff?.checkStockAlerts?.();};
I.retime=(o,reserveAt)=>{I.plan(o);for(const row of I.requirementRows.values())if(row.order_id===o.id){row.fulfillment_date=o.fulfillment.date;row.reserve_at=reserveAt;}};
I.closeReservation=(r,status)=>{r.status=status;r.rows?.forEach(row=>{row.status=status;row[status==='consumed'?'consumed_at':'released_at']=Date.now();});};
I.reserve=(o,confirmed=false)=>{
 const existing=I.reservations.get(o.id);if(existing?.status==='consumed')return '';
 const materials=I.plan(o),error=I.reason(materials,o.id);if(error)return error;
 A.checkoutHolds?.ensure(o);
 if(existing&&I.active(existing)){existing.status=confirmed?'confirmed':existing.status;existing.rows.forEach(row=>row.status=existing.status);I.notify();return '';}
 if(existing?.status==='held')I.closeReservation(existing,'expired');
 const holdId='IH-'+(++I.holdSerial),status=confirmed?'confirmed':'held',expires=o.deadline||Date.now()+600000;
 const rows=Object.entries(materials).map(([id,quantity])=>({reservation_id:holdId+':'+id,requirement_id:o.id+':'+id,hold_id:holdId,quantity,status,expires_at:expires,created_at:Date.now()}));
 I.reservationHistory.push(...rows);I.reservations.set(o.id,{orderId:o.id,holdId,materials:{...materials},status,expires,rows});const checkout=A.checkoutHolds?.get(o.attempts?.at(-1));if(checkout){rows.forEach(row=>row.checkout_hold_id=checkout.id);const recovery=checkout.status!=='active'&&checkout.status!=='confirmed';if(recovery)rows.forEach(row=>row.recovery_for_hold_id=checkout.id);}I.notify();return '';
};
I.release=id=>{const r=I.reservations.get(id);if(r&&r.status!=='consumed')I.closeReservation(r,'released');I.notify();};
I.move=(id,delta,type,actor,orderId,reason,notes,key)=>{
 const i=I.item(id),before=i.stock;i.stock=Math.round((before+delta)*1000)/1000;
 I.movements.unshift({id:'MOV-'+(++I.serial),ingredientId:id,delta,type,actor,performed_by_account_id:A.session?.actor()?.id||null,unit_cost_snapshot:Number.isFinite(i.cost)?i.cost:null,reservation_id:I.reservations.get(orderId)?.rows?.find(r=>r.requirement_id===orderId+':'+id)?.reservation_id||null,orderId:orderId||null,reason:reason||'',notes:notes||'',before,after:i.stock,at:Date.now(),key,operation_key:key});
};
I.consume=(o,actor)=>{
 const key='consume:'+o.id;if(I.operations.has(key))return '';
 const m=I.plan(o),error=I.reason(m,o.id);if(error)return error;
 // Validate every line before making any mutation.
 for(const [id,q] of Object.entries(m))if(I.item(id).stock<q)return 'Physical stock is insufficient.';
 const reserved=I.reserve(o,true);if(reserved)return reserved;
 for(const [id,q] of Object.entries(m))I.move(id,-q,'consumption',actor,o.id,'','Preparation started',key+':'+id);
 I.closeReservation(I.reservations.get(o.id),'consumed');I.operations.add(key);I.notify();return '';
};
I.change=({id,quantity,type,reason='',notes='',key})=>{
 if(!A.session?.operational())return 'Operational access required.';
 if(!key)return 'An operation identifier is required.';const signature=JSON.stringify({id,quantity,type,reason,notes});if(I.operations.has(key))return I.changeResults.get(key)===signature?'':'This operation belongs to another movement.';
 const i=I.item(id);if(!i||!Number.isFinite(quantity)||quantity<0||type==='restock'&&quantity<=0||i.unit==='pcs'&&!Number.isInteger(quantity)||Math.abs(quantity*1000-Math.round(quantity*1000))>1e-6)return 'Enter a valid quantity in the ingredient unit (up to 3 decimal places).';
 if(!['restock','adjustment'].includes(type))return 'Unsupported movement.';
 if(type==='adjustment'&&!['spoilage','damage','miscount','theft','correction','other'].includes(reason))return 'Choose an adjustment reason.';
 const delta=type==='restock'?quantity:quantity-i.stock;if(Math.abs(delta)<1e-8)return 'The physical count matches the recorded stock.';
 I.move(id,delta,type,A.session.actor().name,null,reason,notes,key);I.operations.add(key);I.changeResults.set(key,signature);A.staff.changed();return '';
};
})();
