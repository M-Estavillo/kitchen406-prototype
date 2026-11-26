(() => {
const A=K406,I=A.inventory,P=A.pricing,V=A.ownerUI,E=A.escape;
const number=n=>Number(n).toLocaleString('en-PH',{maximumFractionDigits:3});
const unitCost=(cost,unit)=>Number.isFinite(cost)?E(V.money(cost)+' / '+unit):'—';
const stockBadge=i=>`<span class="order-badge owner-stock-${I.available(i.id)<=0?'out':I.available(i.id)<=i.threshold?'low':'available'}">${E(I.status(i))}</span>`;
const activity=i=>Math.max(0,...I.movements.filter(m=>m.ingredientId===i.id).map(m=>m.at));
const units=[['g','Grams (g)'],['ml','Milliliters (ml)'],['pcs','Pieces (pcs)']];
const materialTypes=[['ingredient','Ingredient'],['packaging','Packaging']];
const movementTypes=[['all','All types'],['restock','Restock'],['adjustment','Adjustment'],['consumption','Consumption'],['consumption_reversal','Consumption reversal']];
const historyFilters=new Map();
function ingredientDetails(i,readOnly=false){
 const detailLink=(path,label)=>readOnly?`<a class="btn" href="#/staff/${E(path)}">${E(label)}</a>`:V.link(path,label);
 const facts=[['Type',(i.category||(i.id==='box'?'packaging':'ingredient'))==='packaging'?'Packaging':'Ingredient'],['Unit',E(i.unit)],['On hand',number(i.stock)],['Reserved',number(I.reserved(i.id))],
  ['Available',number(I.available(i.id))],['Reorder threshold',number(i.threshold)],['Unit cost',unitCost(i.cost,i.unit)]];
 const attrs=`data-id="${E(i.id)}"`;
 const canArchive=!i.stock&&!I.activeReservations(i.id).length;
 const lifecycle=i.archivedAt?V.button('ingredient-restore','Restore material',attrs):
  V.button('ingredient-archive','Archive material',attrs+(canArchive?'':' disabled'));
 const actions=readOnly?'':`<div class="staff-actions">
  ${V.button('cost','Edit details',attrs,true)}
  ${i.archivedAt?'':V.button('stock','Restock',attrs+' data-type="restock"')+V.button('stock','Adjust stock',attrs+' data-type="adjustment"')}
  ${I.databaseAccount?lifecycle:''}
  ${I.databaseAccount&&!i.stock&&!I.unitLocked(i.id)?V.button('ingredient-remove','Remove material',attrs):''}
 </div>${I.databaseAccount&&!i.archivedAt&&!canArchive?'<p class="muted">Clear physical stock and active reservations before archiving.</p>':''}`;
 const details=`<section class="commerce-card"><div class="owner-ingredient-name"><h2>${E(i.name)}</h2>${i.archivedAt?V.badge('Archived'):stockBadge(i)}</div>
  <dl class="owner-ingredient-facts">${facts.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl>${actions}</section>`;
 const filter=historyFilters.get(i.id)||{type:'all',from:'',to:''};
 const movements=I.movements.filter(m=>{
  if(m.ingredientId!==i.id||filter.type!=='all'&&m.type!==filter.type)return false;
  const date=V.businessDate(m.at);
  return (!filter.from||date>=filter.from)&&(!filter.to||date<=filter.to);
 });
 const historyControls=`<form class="staff-toolbar" data-movement-filter="${E(i.id)}">
  ${V.select('movement-type','Movement type',movementTypes,filter.type)}
  ${V.field('movement-from','From',filter.from,'date')}${V.field('movement-to','To',filter.to,'date')}
  <button type="submit" class="btn">Apply filters</button><button type="reset" class="btn">Clear filters</button>
  ${V.error()}
 </form>`;
 const history=V.panel('Movement history',historyControls+(movements.length?V.table(['Time','Type','Before','Change','After','Unit cost snapshot','Actor','Source','Reason / notes'],movements.map(m=>{
  const owner=A.session.owner;
  const actor=owner&&(m.performed_by_account_id===(m.persisted?owner.account_id:owner.id)||(!m.performed_by_account_id&&m.actor===owner.first_name+' '+owner.last_name))?'Owner':m.actor||'System';
  const source=m.orderId?detailLink((readOnly?'production/':'orders/')+encodeURIComponent(m.orderId),m.orderId):'—';
  const type=m.type.replaceAll('_',' ')+(I.databaseAccount&&!m.persisted?' (preview)':'');
  return `<tr><td>${E(V.stamp(m.at))}</td><td>${E(type)}</td><td>${number(m.before)}</td><td>${m.delta>0?'+':''}${number(m.delta)}</td><td>${number(m.after)}</td><td>${unitCost(m.unit_cost_snapshot,m.unit_cost_snapshot_unit??i.unit)}</td><td>${E(actor)}</td><td>${source}</td><td>${E([m.reason,m.notes].filter(Boolean).join(' · ')||'—')}</td></tr>`;
 })): '<p class="muted">No stock movements match these filters.</p>'));
 const orders=I.activeReservations(i.id);
 const reservations=V.panel('Active reservations',orders.length?'<p class="muted">Reservations from this browser session.</p>'+V.table(['Order','Reserved quantity','Status','Hold expiry'],orders.map(r=>{
  const order=A.operations.find(r.orderId);
  const source=order?detailLink((readOnly?'production/':'orders/')+encodeURIComponent(r.orderId),r.orderId):E(r.orderId);
  return `<tr><td>${source}</td><td>${number(r.materials[i.id])} ${E(i.unit)}</td><td>${E(r.status)}</td><td>${r.status==='held'?E(V.stamp(r.expires)):'—'}</td></tr>`;
 })): '<p class="muted">No active reservations in this session.</p>');
 const recipes=[...P.recipes].filter(([,bom])=>Object.hasOwn(bom,i.id)).map(([key,bom])=>{
  const [productId,variantId]=key.split(':');
  const product=A.products.find(p=>p.id===Number(productId)),variant=A.variant(productId,variantId),saved=I.recipeVariants.get(key);
  const name=(product?.name||saved?.product_name||productId)+' · '+(variant?.label||saved?.variant_name||variantId);
  const label=product&&variant?V.link('products/'+productId+'/edit/'+encodeURIComponent(variantId),name):E(name);
  return `<tr><td>${label}</td><td>${number(bom[i.id])} ${E(i.unit)}</td></tr>`;
 });
 const usage=readOnly?'':V.panel('Used in recipes',recipes.length?V.table(['Product variant','Quantity per unit'],recipes):'<p class="muted">No product recipes use this material.</p>');
 return `<div class="owner-ingredient-detail"><div>${detailLink('inventory','Back to inventory')}</div>${details}${reservations}${usage}${history}</div>`;
}
A.inventoryDetails=ingredientDetails;
A.ownerPages.inventory=()=>{
 const intro=actions=>V.intro('Inventory','Base ingredients, packaging, reservations, and owner costs.',actions);
 if(I.databaseAccount&&I.loadState!=='ready'){
  return intro(I.loadState==='error'?V.button('inventory-retry','Retry'):'')+
   '<p role="status">'+(I.loadState==='error'?'Inventory could not be loaded.':'Loading inventory…')+'</p>';
 }
 const selected=I.item(A.owner.parts[2]);
 if(selected)return ingredientDetails(selected);
 if(A.owner.parts[2])return V.panel('Material not found','<p>This inventory record is unavailable.</p>',V.link('inventory','Back to inventory'));
 const f=A.owner.filters;
 const visible=I.items.filter(i=>f.lifecycle==='all'||Boolean(i.archivedAt)===(f.lifecycle==='archived'));
 const items=V.filtered(visible,i=>i.name,i=>activity(i)?V.businessDate(activity(i)):'',i=>(i.category||(i.id==='box'?'packaging':'ingredient'))==='packaging'?'packaging':'ingredients')
  .filter(i=>(!f.stock||f.stock==='all'||(f.stock==='alerts'?I.status(i)!=='Available':I.status(i)===f.stock))&&(!(f.from||f.to)||activity(i)));
 const pills=[['all','All'],['ingredients','Ingredients'],['packaging','Packaging']].map(([type,label])=>
  V.button('inventory-type',label,`data-type="${type}" aria-pressed="${f.type===type}"`)).join('');
 const stock=V.select('stock','Stock status',[['all','All stock'],['alerts','Stock alerts'],...['Available','Low stock','Out of stock'].map(s=>[s,s])],f.stock||'all')+
  V.select('lifecycle','Materials',[['active','Active'],['archived','Archived'],['all','All materials']],f.lifecycle||'active');
 const table=items.length?V.paged(items,page=>V.table(['Ingredient','Unit','Physical','Reserved','Available','Threshold','Status','Actions'],page.map(i=>{
  const status=I.status(i),tone=status==='Available'?'available':status==='Low stock'?'low':'out';
  const name=E(i.name);
  const actions=V.link('inventory/'+encodeURIComponent(i.id),'Edit');
  return `<tr><td>${name}</td><td>${E(i.unit)}</td><td>${number(i.stock)}</td><td>${number(I.reserved(i.id))}</td><td>${number(I.available(i.id))}</td><td>${number(i.threshold)}</td><td>${i.archivedAt?V.badge('Archived'):`<span class="order-badge staff-stock-status ${tone}">${E(status)}</span>`}</td><td><div class="staff-inventory-actions">${actions}</div></td></tr>`;
 })),false):'<p>No inventory records match these filters.</p>';
 return intro(V.button('ingredient-add','Add New Ingredient','',true))+
  `<div class="owner-order-tabs" role="group" aria-label="Inventory category">${pills}</div>`+
  V.compactFilters('Search inventory',stock,'owner-inventory-filters')+
  `<div class="staff-inventory-table owner-inventory-table"><section class="commerce-card">${table}</section></div>`;
};
document.addEventListener('submit',e=>{
 const id=e.target.dataset.movementFilter;
 if(!id)return;
 e.preventDefault();
 const data=new FormData(e.target),from=data.get('movement-from'),to=data.get('movement-to');
 if(from&&to&&from>to){e.target.querySelector('.owner-error').textContent='The end date must be on or after the start date.';return;}
 historyFilters.set(id,{from,to,type:data.get('movement-type')});
 A.operations.changed();
});
document.addEventListener('reset',e=>{
 const id=e.target.dataset.movementFilter;
 if(!id)return;
 e.preventDefault();
 historyFilters.delete(id);
 A.operations.changed();
});
document.addEventListener('click',e=>{
 if(e.target.closest('[data-owner=inventory-retry]')&&A.session.ownerAllowed()){I.refresh();A.owner.render();return;}
 if(!e.target.closest('[data-owner=ingredient-add]')||!A.session.ownerAllowed())return;
 A.owner.open('Add new ingredient',`<form class="staff-form" data-owner-form="ingredient-add">
 ${V.field('name','Ingredient name','','text','required maxlength="120"')}
 <div class="owner-ingredient-form-row">${V.field('stock','Stock','','number','required min="0" step="0.001"')}${V.select('unit','Unit',units,'g')}</div>
 <div class="owner-ingredient-form-row">${V.field('totalCost','Total cost (PHP)','','number','required min="0" step="0.01"')}${V.field('threshold','Reorder threshold','','number','required min="0" step="0.001"')}</div>
 <fieldset class="owner-ingredient-category"><legend>Type</legend><label><input type="radio" name="category" value="ingredient" checked> Ingredient</label><label><input type="radio" name="category" value="packaging"> Packaging</label></fieldset>
 ${V.error()}<div class="owner-settings-actions">${V.button('discard-modal','Cancel')}<button type="submit" class="btn primary">Add ingredient</button></div></form>`);
});
A.ownerInventory={units,
 openArchive(id,restore){
  const item=I.item(id);
  if(!I.databaseAccount||!item||(!restore&&(item.stock||I.activeReservations(id).length)))return;
  const label=restore?'Restore material':'Archive material';
  A.owner.open(label,V.form(restore?'ingredient-restore':'ingredient-archive',
   `<p>${restore?'Restore':'Archive'} <strong>${E(item.name)}</strong>?</p>`+
   (restore?'':'<p>Movement history and existing recipe references will be kept.</p>')+V.button('discard-modal','Cancel'),
   `data-id="${E(id)}" data-version="${E(item.version)}"`,label));
 },
 openRemove(id){
  const item=I.item(id);
  if(!I.databaseAccount||!item||item.stock||I.unitLocked(id))return;
  A.owner.open('Remove material',V.form('ingredient-remove',
   `<p>Permanently remove <strong>${E(item.name)}</strong> from inventory?</p>`+V.button('discard-modal','Cancel'),
   `data-id="${E(id)}" data-version="${E(item.version)}"`,'Remove material'));
 },
 openStock(id,type){
  const i=I.item(id);if(!i||i.archivedAt)return;
  const restock=type==='restock',step=i.unit==='pcs'?'1':'0.001';
  const details=restock?V.field('totalCost','Total cost (PHP)','','number','required min="0" step="0.01"'):
   V.select('reason','Reason',['spoilage','damage','miscount','theft','correction','other'].map(s=>[s,s]),'miscount');
  A.owner.open(restock?'Record restock':'Record physical count',V.form('stock',
   `<p>${E(i.name)} · ${number(i.stock)} ${E(i.unit)} on hand</p>`+
   V.field('quantity',restock?'Quantity added':'Actual physical count',restock?'':i.stock,'number',`required min="${restock?step:'0'}" step="${step}"`)+
   V.select('unit','Unit',I.stockUnits(i.unit).map(unit=>[unit,unit]),i.unit)+details+
   V.field('notes','Notes','','text','maxlength="500"')+V.button('cancel-stock','Cancel'),
   `data-id="${E(id)}" data-type="${type}" data-stock="${i.stock}" data-unit="${E(i.unit)}" data-version="${E(i.version||'')}"`,restock?'Confirm restock':'Adjust'));
  const form=document.querySelector('#owner-modal [data-owner-form=stock]');
  const actions=document.createElement('div');
  actions.className='owner-stock-dialog-actions';
  actions.append(form.querySelector('[data-owner=cancel-stock]'),form.querySelector('button[type=submit]'));
  form.append(actions);
 },
 openCost(id){
  const i=I.item(id);if(!i)return;
  const locked=I.unitLocked(id);
  A.owner.open('Edit ingredient',V.form('cost',
   V.field('name','Ingredient name',i.name,'text','required maxlength="120"')+
   (locked?`<p class="muted">Base unit: ${E(i.unit)}. The unit is locked because this material is already in use.</p><input type="hidden" name="unit" value="${E(i.unit)}">`:V.select('unit','Unit',units,i.unit))+
   V.select('category','Type',materialTypes,i.category||(i.id==='box'?'packaging':'ingredient'))+
   V.field('threshold','Reorder threshold',i.threshold,'number','min="0" step="0.001" required')+V.button('discard-modal','Cancel'),
   `data-id="${E(id)}" data-version="${E(I.databaseAccount?i.version:P.version)}"`));
 },
 row(id='',quantity=''){return `<div class="owner-bom-row">${V.select('ingredient-'+crypto.randomUUID(),'Ingredient',[['','Choose ingredient'],...I.items.filter(i=>!i.archivedAt||i.id===id).map(i=>[i.id,i.name+' ('+i.unit+')'+(i.archivedAt?' — Archived':'')])],id,'data-bom-id')}${V.field('quantity-'+crypto.randomUUID(),'Base-unit quantity',quantity,'number','data-bom-quantity required min="0.001" step="0.001"')}${V.button('remove-bom','Remove')}</div>`;},
 openRecipe(id,variant){if(!A.variant(id,variant))return;const bom=I.recipe(id,variant)||{};A.owner.open('Edit variant recipe',V.form('recipe',`<p>${E(A.products.find(p=>p.id===id).name)} · ${E(A.variant(id,variant).label)}</p><div id="owner-bom">${Object.entries(bom).map(([i,q])=>this.row(i,q)).join('')}</div>${V.button('add-bom','Add ingredient')}<p class="muted">Changes apply to new requirements; committed orders retain their material snapshots.</p>`,`data-id="${id}" data-variant="${E(variant)}" data-version="${P.version}"`));}
};
})();
