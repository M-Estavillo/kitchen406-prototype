(() => {
const A=K406,I=A.inventory,P=A.pricing,V=A.ownerUI,E=A.escape;
const number=n=>Number(n).toLocaleString('en-PH',{maximumFractionDigits:3});
const unitCost=(cost,unit)=>Number.isFinite(cost)?E(V.unitMoney(cost)+' / '+unit):'—';
const stockBadge=i=>`<span class="order-badge owner-stock-${I.available(i.id)<=0?'out':I.available(i.id)<=i.threshold?'low':'available'}">${E(I.status(i))}</span>`;
const activity=i=>Math.max(0,...I.movements.filter(m=>m.ingredientId===i.id).map(m=>m.at));
const units=[['g','Grams (g)'],['ml','Milliliters (ml)'],['pcs','Pieces (pcs)']];
function ingredientDetails(i){
 const facts=[['Unit',E(i.unit)],['On hand',number(i.stock)],['Reserved',number(I.reserved(i.id))],
  ['Available',number(I.available(i.id))],['Reorder threshold',number(i.threshold)],['Unit cost',unitCost(i.cost,i.unit)]];
 const details=`<section class="commerce-card"><div class="owner-ingredient-name"><h2>${E(i.name)}</h2>${stockBadge(i)}${V.button('cost','Edit',`data-id="${E(i.id)}"`)}</div>
  <dl class="owner-ingredient-facts">${facts.map(([label,value])=>`<div><dt>${label}</dt><dd>${value}</dd></div>`).join('')}</dl></section>`;
 const movements=I.movements.filter(m=>m.ingredientId===i.id);
 const history=V.panel('Movement history',movements.length?V.table(['Time','Type','Before','Change','After','Unit cost snapshot','Actor','Source'],movements.map(m=>{
  const owner=A.session.owner;
  const actor=m.performed_by_account_id===owner.id||(!m.performed_by_account_id&&m.actor===owner.first_name+' '+owner.last_name)?'Owner':m.actor||'System';
  const source=m.orderId?V.link('orders/'+encodeURIComponent(m.orderId),m.orderId):'—';
  return `<tr><td>${E(V.stamp(m.at))}</td><td>${E(m.type.replaceAll('_',' '))}</td><td>${number(m.before)}</td><td>${m.delta>0?'+':''}${number(m.delta)}</td><td>${number(m.after)}</td><td>${unitCost(m.unit_cost_snapshot,m.unit_cost_snapshot_unit??i.unit)}</td><td>${E(actor)}</td><td>${source}</td></tr>`;
 })): '<p class="muted">No stock movements recorded.</p>');
 return `<div class="owner-ingredient-detail"><div>${V.link('inventory','Back to inventory')}</div>${details}${history}</div>`;
}
A.ownerPages.inventory=()=>{
 const selected=I.item(A.owner.parts[2]);
 if(selected)return ingredientDetails(selected);
 const f=A.owner.filters;
 const items=V.filtered(I.items,i=>i.name,i=>activity(i)?V.businessDate(activity(i)):'',i=>i.id==='box'?'packaging':'ingredients')
  .filter(i=>(!f.stock||f.stock==='all'||(f.stock==='alerts'?I.status(i)!=='Available':I.status(i)===f.stock))&&(!(f.from||f.to)||activity(i)));
 const pills=[['all','All'],['ingredients','Ingredients'],['packaging','Packaging']].map(([type,label])=>
  V.button('inventory-type',label,`data-type="${type}" aria-pressed="${f.type===type}"`)).join('');
 const stock=V.select('stock','Stock status',[['all','All stock'],['alerts','Stock alerts'],...['Available','Low stock','Out of stock'].map(s=>[s,s])],f.stock||'all');
 const table=items.length?V.paged(items,page=>V.table(['Ingredient','Unit','Physical','Reserved','Available','Threshold','Status','Actions'],page.map(i=>{
  const status=I.status(i),tone=status==='Available'?'available':status==='Low stock'?'low':'out';
  const id=E(i.id),name=E(i.name);
  const actions=V.link('inventory/'+encodeURIComponent(i.id),'Details')+
   V.button('stock','Restock',`data-id="${id}" data-type="restock" aria-label="Restock ${name}"`)+
   V.button('stock','Adjust',`data-id="${id}" data-type="adjustment" aria-label="Adjust ${name}"`);
  return `<tr><td>${name}</td><td>${E(i.unit)}</td><td>${number(i.stock)}</td><td>${number(I.reserved(i.id))}</td><td>${number(I.available(i.id))}</td><td>${number(i.threshold)}</td><td><span class="order-badge staff-stock-status ${tone}">${E(status)}</span></td><td><div class="staff-inventory-actions">${actions}</div></td></tr>`;
 })),false):'<p>No inventory records match these filters.</p>';
 return V.intro('Inventory','Base ingredients, packaging, reservations, and owner costs.')+
  `<div class="owner-order-tabs" role="group" aria-label="Inventory category">${pills}</div>`+
  V.compactFilters('Search inventory',stock,'owner-inventory-filters')+
  `<div class="staff-inventory-table owner-inventory-table"><section class="commerce-card">${table}</section></div>`;
};
A.ownerInventory={units,
 openStock(id,type){
  const i=I.item(id);if(!i)return;
  const restock=type==='restock',step=i.unit==='pcs'?'1':'0.001';
  const details=restock?V.field('totalCost','Total cost (PHP)','','number','required min="0" step="0.01"'):
   V.select('reason','Reason',['spoilage','damage','miscount','theft','correction','other'].map(s=>[s,s]),'miscount');
  A.owner.open(restock?'Record restock':'Record physical count',V.form('stock',
   `<p>${E(i.name)} · ${number(i.stock)} ${E(i.unit)} on hand</p>`+
   V.field('quantity',restock?'Quantity added':'Actual physical count',restock?'':i.stock,'number',`required min="${restock?step:'0'}" step="${step}"`)+
   V.select('unit','Unit',I.stockUnits(i.unit).map(unit=>[unit,unit]),i.unit)+details+
   V.field('notes','Notes')+V.button('cancel-stock','Cancel'),
   `data-id="${E(id)}" data-type="${type}" data-stock="${i.stock}" data-unit="${E(i.unit)}"`,restock?'Confirm restock':'Adjust'));
  const form=document.querySelector('#owner-modal [data-owner-form=stock]');
  const actions=document.createElement('div');
  actions.className='owner-stock-dialog-actions';
  actions.append(form.querySelector('[data-owner=cancel-stock]'),form.querySelector('button[type=submit]'));
  form.append(actions);
 },
 openCost(id){
  const i=I.item(id);if(!i)return;
  A.owner.open('Edit ingredient',V.form('cost',
   V.field('name','Ingredient name',i.name,'text','required maxlength="120"')+
   V.select('unit','Unit',units,i.unit)+
   V.field('threshold','Reorder threshold',i.threshold,'number','min="0" step="0.001" required')+
   '<p class="muted">Changing the unit keeps existing stock and recipe quantities at their current numeric values.</p>'+V.button('discard-modal','Cancel'),
   `data-id="${E(id)}" data-version="${P.version}"`));
 },
 row(id='',quantity=''){return `<div class="owner-bom-row">${V.select('ingredient-'+crypto.randomUUID(),'Ingredient',[['','Choose ingredient'],...I.items.map(i=>[i.id,i.name+' ('+i.unit+')'])],id,'data-bom-id')}${V.field('quantity-'+crypto.randomUUID(),'Base-unit quantity',quantity,'number','data-bom-quantity required min="0.001" step="0.001"')}${V.button('remove-bom','Remove')}</div>`;},
 openRecipe(id,variant){if(!A.variant(id,variant))return;const bom=I.recipe(id,variant)||{};A.owner.open('Edit variant recipe',V.form('recipe',`<p>${E(A.products.find(p=>p.id===id).name)} · ${E(A.variant(id,variant).label)}</p><div id="owner-bom">${Object.entries(bom).map(([i,q])=>this.row(i,q)).join('')}</div>${V.button('add-bom','Add ingredient')}${V.select('overhead-mode','Utility overhead',[['default','Use default overhead'],['custom','Custom overhead']],P.overheads.has(id+':'+variant)?'custom':'default')}${V.field('overhead','Custom utility overhead (PHP)',P.overheads.get(id+':'+variant)??P.overhead,'number',`min="0" step="0.01" ${P.overheads.has(id+':'+variant)?'required':'disabled'}`)}<p class="muted">Changes apply to new requirements; committed orders retain their material snapshots.</p>`,`data-id="${id}" data-variant="${E(variant)}" data-version="${P.version}"`));}
};
})();
