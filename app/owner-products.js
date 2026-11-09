/* Catalog maintenance reuses the sellable product and variant records. */
(() => {
const A=K406,I=A.inventory,P=A.pricing,V=A.ownerUI,E=A.escape;
const categories=[...new Map(A.products.map(p=>[p.category,p.categoryLabel])).entries()];
const categoryBaseline=categories.map(([id,name])=>({id,name,status:'active'}));
const categoryRecords=A.productCategories=categoryBaseline.map(c=>({...c}));
const images=[['assets/product-placeholder.svg','No image'],...[...new Map(A.products.map(p=>[p.image,p.name])).entries()]];
const baseline=A.products.map(p=>({...JSON.parse(JSON.stringify(p)),available:I.catalogEnabled.get(p.id)!==false}));
const G=A.productAdmin={version:0};
G.attach=p=>Object.defineProperty(p,'available',{configurable:true,enumerable:true,get:()=>I.productAvailable(p.id),set:value=>I.catalogEnabled.set(p.id,value)});
G.display=p=>{const variants=p.variants.filter(v=>v.active!==false);p.price=(variants.length>1?'From ':'')+A.commerce.money(variants.length?Math.min(...variants.map(v=>v.price)):0);p.variant=variants.length===1?variants[0].label:variants.length+' variants';};
G.changed=()=>{A.activeProduct=null;A.catalog.refresh();A.operations.changed();};
A.resetProductData=()=>{A.products.splice(0,A.products.length,...baseline.map(p=>JSON.parse(JSON.stringify(p))));for(const p of A.products){I.catalogEnabled.set(p.id,p.available);G.attach(p);}G.version=0;categoryRecords.splice(0,categoryRecords.length,...categoryBaseline.map(c=>({...c})));categories.splice(0,categories.length,...categoryRecords.map(c=>[c.id,c.name]));};
const setPrice=P.setPrice;P.setPrice=(...args)=>{const error=setPrice(...args);if(!error){G.display(A.products.find(p=>p.id===args[0]));G.changed();}return error;};
// Availability is evaluated live; purchased item snapshots are never rewritten.
const line=A.commerce.line;A.commerce.line=(id,variant='standard',quantity=1)=>({...line(id,variant,quantity),available:I.productAvailable(id,variant)});
const valid=A.commerce.cartValid;A.commerce.cartValid=()=>valid()&&A.commerce.state.cart.every(item=>I.productAvailable(item.productId,item.key.split(':')[1],A.commerce.state.activeId));
const config=A.subscriptions.configReason;A.subscriptions.configReason=()=>{const d=A.subscriptions.state.draft;return A.variant(d.productId,d.variant)?.active===false?'This variant is inactive.':config();};
const status=p=>p.active===false?'inactive':I.catalogEnabled.get(p.id)===false?'unavailable':p.available?'available':'stock';
function detail(p){const selected=A.owner.parts[3]||p.variants[0]?.id,v=p.variants.find(v=>v.id===selected);if(!v)return V.panel('Variant not found','<p>This variant is unavailable.</p>',V.link('products/'+p.id,'Back to product'));const bom=I.recipe(p.id,v.id),cost=P.cost(p.id,v.id);
return V.intro(p.name,p.categoryLabel,V.link('products','All products')+' '+V.link('products/'+p.id+'/edit','Edit product'))+`<div class="staff-stack">${V.panel('Product overview',`<img src="${E(p.image||'assets/product-placeholder.svg')}" alt="${E(p.name)}" width="120" height="90" style="object-fit:cover">${(p.images||[]).filter(url=>url!==p.image).map((url,index)=>`<img class="owner-product-extra-image" src="${E(url)}" alt="${E(p.name)} image ${index+2}" width="64" height="48">`).join('')}<p>${E(p.description)}</p><p>${V.badge(status(p))} · ${p.subscription?'Subscription eligible':'Not subscription eligible'}</p>`,V.button('product-toggle',p.active===false?'Activate product':'Deactivate product',`data-id="${p.id}"`)+(p.subscription?V.link('subscriptions/offerings','Subscription offerings'):''))}${V.panel('Variants and final selling prices',V.table(['Variant','Status','Final price','Actions'],p.variants.map(x=>`<tr><td>${V.link('products/'+p.id+'/'+encodeURIComponent(x.id),x.label)}</td><td>${V.badge(x.active===false?'inactive':'active')}</td><td>${V.money(x.price)}</td><td>${V.button('variant-edit','Edit',`data-id="${p.id}" data-variant="${E(x.id)}"`)} ${V.button('price','Set final price',`data-id="${p.id}" data-variant="${E(x.id)}"`)}</td></tr>`)),V.button('variant-edit','Add variant',`data-id="${p.id}"`))}${V.panel('Recipe · '+v.label,bom?V.table(['Ingredient','Quantity / unit','Unit cost','Material cost'],Object.entries(bom).map(([id,q])=>{const i=I.item(id);return `<tr><td>${V.link('inventory/'+id,i?.name||id)}</td><td>${q} ${E(i?.unit||'')}</td><td>${V.money(i?.cost)}</td><td>${V.money(Number.isFinite(i?.cost)?q*i.cost:undefined)}</td></tr>`;})):'<p>Recipe not configured. Add materials before offering this variant for purchase.</p>',V.button('recipe','Edit recipe',`data-id="${p.id}" data-variant="${E(v.id)}"`))}${V.panel('Estimated costing · '+v.label,cost?`<p>Ingredients: ${V.money(cost.ingredients)}</p><p>Packaging: ${V.money(cost.packaging)}</p><p>Utility overhead: ${V.money(cost.overhead)}</p><p>Estimated production cost: ${V.money(cost.total)}</p><p>Markup: ${P.markup}% · Suggested selling price: ${V.money(cost.suggested)}</p><p>Final selling price: ${V.money(v.price)}</p><p>Estimated margin: ${cost.margin==null?'Not available':cost.margin.toFixed(1)+'%'}</p>`:'<p role="status">Cost estimate unavailable. Configure a valid recipe and recorded costs for every material. Missing costs are not zero.</p>',V.button('pricing-settings','Costing settings')+' '+V.button('price','Set final price',`data-id="${p.id}" data-variant="${E(v.id)}"`))}</div>`;}
A.ownerPages.products=()=>{const id=A.owner.parts[2];if(id==='new')return productEditor();if(id){const p=A.products.find(p=>p.id===Number(id));return p?(A.owner.parts[3]==='edit'?productEditor(p):detail(p)):V.panel('Product not found','<p>This reference is unavailable.</p>',V.link('products','All products'));}
 const f=A.owner.filters;let list=A.products.filter(p=>(!f.query||[p.name,p.description,...p.variants.map(v=>v.label)].join(' ').toLowerCase().includes(f.query.toLowerCase()))&&(!f.category||f.category==='all'||p.category===f.category)&&(!f.type||f.type==='all'||status(p)===f.type));list.sort((a,b)=>f.sort==='name'?a.name.localeCompare(b.name):f.sort==='oldest'?a.id-b.id:b.id-a.id);
 const filters=`<div class="owner-order-filters owner-product-filters">
  ${V.field('query','Search',f.query,'search','placeholder="Search products"')}
  ${V.select('category','Category',[['all','All categories'],...categories],f.category||'all')}
  ${V.select('type','Availability',[['all','All statuses'],['available','Available'],['stock','Ingredient shortage / missing recipe'],['unavailable','Temporarily unavailable'],['inactive','Deactivated']],f.type||'all')}
  ${V.select('sort','Sort',[['newest','Newest first'],['oldest','Oldest first'],['name','Name A–Z']],f.sort||'newest')}
  ${V.button('clear-filters','Clear filters')}
 </div>`;
 return V.intro('Products','Catalog, variants, recipes and owner-controlled selling prices.')+`<div class="owner-product-tools">${V.link('products/new','Add product')}${V.button('categories','Edit categories')}${V.button('pricing-settings','Costing settings')}</div>`+filters+V.paged(list,productCards,false,12);
};
function productCards(products){
 if(!products.length)return '<p class="muted owner-orders-empty">No products match these filters.</p>';
 const availabilityLabels={available:'Available',stock:'Ingredient shortage / missing recipe',unavailable:'Temporarily unavailable',inactive:'Unavailable'};
 return `<div class="owner-product-grid">${products.map(p=>{
  const active=p.active!==false,availability=status(p);
  return `<article class="product-card owner-product-card">
   <img src="${E(p.image||'assets/product-placeholder.svg')}" alt="" loading="lazy">
   <div class="owner-product-card-body">
    <h2><a href="#/owner/products/${p.id}">${E(p.name)}</a></h2>
    <span class="order-badge${availability==='available'?'':' attention'}">${E(availabilityLabels[availability])}</span>
    <div class="owner-product-card-actions">
     ${V.link('products/'+p.id+'/edit','Edit')}
     ${V.button('product-toggle',active?'Active':'Deactivated',`data-id="${p.id}" role="switch" aria-checked="${active}" aria-label="${E(p.name)} activation"`)}
    </div>
   </div>
  </article>`;
 }).join('')}</div>`;
}
function openCategories(){
 A.owner.open('Edit categories',`<div class="owner-category-list">${categoryRecords.map(c=>`<div><span>${E(c.name)}</span>${V.badge(c.status)}${V.button('category-edit','Edit',`data-id="${E(c.id)}" aria-label="Edit ${E(c.name)}"`)}</div>`).join('')}</div><div class="owner-category-actions">${V.button('category-edit','Add category')}${V.button('discard-modal','Cancel')}</div>`);
}
function productSwitch(name,label,checked){
 return `<div class="owner-product-switch"><label for="owner-${name}">${label}</label><input id="owner-${name}" name="${name}" type="checkbox" role="switch" value="true" ${checked?'checked':''}></div>`;
}
function variantChoices(p){
 const existing=(p?.variants||[]).map(v=>({key:'saved:'+v.id,label:v.label,variant:v}));
 const labels=new Set(['Standard',...A.products.flatMap(product=>product.variants.map(v=>v.label))]);
 for(const v of existing)labels.delete(v.label);
 return [...existing,...[...labels].map(label=>({key:'new:'+encodeURIComponent(label),label}))];
}
function recommendedPrice(label,cost,overhead){
 const rows=[['Ingredients',cost?V.money(cost.ingredients):'—'],['Packaging',cost?V.money(cost.packaging):'—'],
  ['Utility overhead',V.money(overhead)],['Production cost',cost?V.money(cost.total):'—'],
  ['Markup ('+P.markup+'%)',cost?V.money(cost.suggested-cost.total):'—'],['Recommended price',cost?V.money(cost.suggested):'Unavailable']];
 return `<h4>${E(label)}</h4><dl>${rows.map(([name,value])=>`<div><dt>${E(name)}</dt><dd>${E(value)}</dd></div>`).join('')}</dl>`;
}
function materialRows(value){
 try{const rows=JSON.parse(value);return Array.isArray(rows)?rows:[];}catch{return [];}
}
function materialRecipe(rows){
 const recipe={};
 for(const row of rows){
  const id=row?.id,quantity=Number(row?.quantity);
  if(!I.item(id)||Object.hasOwn(recipe,id)||!Number.isFinite(quantity)||quantity<=0)return null;
  recipe[id]=quantity;
 }
 return recipe;
}
function materialCells(row){
 const item=I.item(row.id),quantity=Number(row.quantity),cost=item?.cost;
 return [item?.unit||'—',V.money(cost),V.money(Number.isFinite(cost)&&quantity>0?cost*quantity:undefined)];
}
function renderMaterials(section){
 const rows=materialRows(section.querySelector('input[type=hidden]').value);
 section.querySelector('.owner-material-table').innerHTML=V.table(['Material','Quantity','Unit','Unit cost','Material cost','Actions'],rows.map((row,index)=>{
  const choices=[['','Choose a material'],...I.items.map(i=>[i.id,i.name])];
  const [unit,cost,total]=materialCells(row);
  return `<tr data-material-row="${index}"><td><select data-material-field="id" aria-label="Material ${index+1}">${choices.map(([id,label])=>`<option value="${E(id)}" ${row.id===id?'selected':''}>${E(label)}</option>`).join('')}</select></td><td><input type="number" min="0.001" step="any" value="${E(row.quantity)}" data-material-field="quantity" aria-label="Quantity ${index+1}"></td><td data-material-unit>${E(unit)}</td><td data-material-cost>${E(cost)}</td><td data-material-total>${E(total)}</td><td>${V.button('product-remove-material','Remove')}</td></tr>`;
 }));
}
function refreshRecommendation(form,section){
 const key=section.dataset.productVariant;
 const costPanel=[...form.querySelectorAll('.owner-product-cost [data-product-variant]')].find(panel=>panel.dataset.productVariant===key);
 const recipe=materialRecipe(materialRows(section.querySelector('input[type=hidden]').value));
 const overhead=Number(section.dataset.overhead);
 costPanel.innerHTML=recommendedPrice(section.dataset.variantLabel,P.breakdown(recipe,overhead),overhead);
}
function syncVariantFields(form){
 const selected=new Set([...form.querySelectorAll('[name=variants]:checked')].map(input=>input.value));
 form.querySelector('.owner-variant-count').textContent=selected.size+' selected';
 form.querySelector('.owner-product-prices').classList.toggle('has-multiple-prices',selected.size>1);
 form.querySelectorAll('[data-product-variant]').forEach(row=>{
  row.hidden=!selected.has(row.dataset.productVariant);
  if(row.closest('.owner-product-prices'))row.querySelector('input').disabled=row.hidden;
  if(row.matches('.owner-product-materials-variant'))row.querySelectorAll('[data-material-field]').forEach(input=>input.disabled=row.hidden);
 });
 form.querySelector('.owner-product-cost-empty').hidden=selected.size>0;
 form.querySelector('.owner-materials-empty').hidden=selected.size>0;
}
function productEditor(p){
 const fresh=!p,cover=p?.image||images[0][0];
 const choices=images.some(([url])=>url===cover)?images:[[cover,'Current uploaded image'],...images];
 const variants=variantChoices(p);
 const variantPicker=`<div class="field owner-variant-field"><label id="owner-variants-label">Variants</label><details class="owner-variant-picker"><summary aria-labelledby="owner-variants-label owner-variant-count"><span id="owner-variant-count" class="owner-variant-count"></span></summary><div class="owner-variant-options" role="group" aria-label="Variants">${variants.map(({key,label,variant})=>`<label><input type="checkbox" name="variants" value="${E(key)}" ${variant?variant.active===false?'':'checked':fresh&&label==='Standard'?'checked':''}>${E(label)}</label>`).join('')}</div></details></div>`;
 const prices=`<div class="owner-product-prices">${variants.map(({key,label,variant})=>`<div data-product-variant="${E(key)}">${V.field('price-'+key,'Selling Price',variant?.price??'','number','required min="0.01" step="0.01" aria-describedby="owner-price-variant-'+E(key)+'"')}<small id="owner-price-variant-${E(key)}" class="owner-price-variant">${E(label)}</small></div>`).join('')}</div>`;
 const recommendation=`<section class="owner-product-cost"><h3>Recommended Selling Price</h3><p class="muted owner-product-cost-empty">Select a variant to see its cost breakdown.</p>${variants.map(choice=>`<div data-product-variant="${E(choice.key)}"></div>`).join('')}</section>`;
 const fields=V.field('name','Product name',p?.name||'','text','required maxlength="120"')+
  `<div class="field owner-product-description"><div><label for="owner-description">Description</label><small>Max 1,000 characters</small></div><textarea id="owner-description" name="description" required maxlength="1000" rows="3">${E(p?.description||'')}</textarea></div>`+
  `<div class="owner-product-settings">${V.select('category','Category',categories.filter(([id])=>id===p?.category||categoryRecords.find(c=>c.id===id)?.status==='active'),p?.category||'')}${variantPicker}</div>`+
  `<div class="owner-product-price-row">${prices}<div class="owner-product-switches">${productSwitch('active','Active',p?.active!==false)}${productSwitch('subscription','Subscription-eligible',!!p?.subscription)}</div></div>`;
 const imageSection=`<div class="owner-product-image-section">
  <div class="owner-product-cover"><img src="${E(cover)}" alt="" width="52" height="52">${V.select('image','Cover image',choices,cover)}</div>
 </div>`;
 const materials=V.panel('Recipe',`<p class="muted owner-materials-empty">Select a variant to add materials.</p>${variants.map(({key,label,variant})=>{
  const recipe=variant?I.recipe(p.id,variant.id):null;
  const rows=Object.entries(recipe||{}).map(([id,quantity])=>({id,quantity}));
  const overhead=variant?(P.overheads.get(p.id+':'+variant.id)??P.overhead):P.overhead;
  return `<section class="owner-product-materials-variant" data-product-variant="${E(key)}" data-variant-label="${E(label)}" data-overhead="${overhead}"><input type="hidden" name="bom-${E(key)}" value="${E(JSON.stringify(rows))}"><div class="owner-material-heading"><h3>${E(label)}</h3>${V.button('product-add-material','Add material')}</div><div class="owner-material-table"></div></section>`;
 }).join('')}`);
 const form=V.form('product',`<div class="owner-product-editor-columns">${V.panel('Product details',`<div class="owner-product-form-fields">${fields}</div>`)}<div class="owner-product-editor-side">${recommendation}${V.panel('Product images',imageSection)}</div></div>${materials}<input type="hidden" name="pricing-version" value="${P.version}">${V.button('product-cancel','Cancel')}`,`data-id="${p?.id||''}" data-version="${G.version}"`,'Save product');
 return `<div class="owner-product-editor">${V.button('product-cancel','Back to products')}${form}</div>`;
}
G.initEditor=form=>{
 form.querySelectorAll('.owner-product-materials-variant').forEach(section=>{renderMaterials(section);refreshRecommendation(form,section);});
 syncVariantFields(form);
};
document.addEventListener('input',e=>{
 const field=e.target,form=field.form,section=field.closest('.owner-product-materials-variant');
 if(form?.dataset.ownerForm!=='product'||!section||!field.dataset.materialField)return;
 const row=field.closest('[data-material-row]'),input=section.querySelector('input[type=hidden]'),rows=materialRows(input.value);
 const material=rows[Number(row.dataset.materialRow)];
 material[field.dataset.materialField]=field.value;
 input.value=JSON.stringify(rows);
 const [unit,cost,total]=materialCells(material);
 row.querySelector('[data-material-unit]').textContent=unit;
 row.querySelector('[data-material-cost]').textContent=cost;
 row.querySelector('[data-material-total]').textContent=total;
 refreshRecommendation(form,section);
});
document.addEventListener('change',e=>{
 const form=e.target.form;if(form?.dataset.ownerForm!=='product')return;
 if(e.target.id==='owner-image')form.querySelector('.owner-product-cover img').src=e.target.value;
 if(e.target.name==='variants'){syncVariantFields(form);A.owner.capture(form);}
});
document.addEventListener('click',e=>{const el=e.target.closest('[data-owner]');if(!el||!A.session.ownerAllowed())return;const action=el.dataset.owner,p=A.products.find(p=>p.id===Number(el.dataset.id));
 if(action==='categories')openCategories();
 if(action==='category-edit'){const c=categoryRecords.find(c=>c.id===el.dataset.id);A.owner.open(c?'Edit category':'Add category',V.form('category',V.field('name','Category name',c?.name||'','text','required maxlength="80"')+V.select('status','Status',[['active','Active'],['inactive','Inactive']],c?.status||'active')+'<p>Inactive categories cannot be assigned to new products. Existing product relationships remain intact.</p>'+V.button('discard-modal','Cancel'),`data-id="${E(c?.id||'')}" data-version="${G.version}"`,'Confirm save'));}
 if(action==='product-cancel'){
  const form=el.closest('.owner-product-editor').querySelector('form');
  A.owner.drafts.delete(A.owner.draftKey(form));location.hash='#/owner/products';
 }
 if(action==='product-add-material'||action==='product-remove-material'){
  const section=el.closest('.owner-product-materials-variant'),form=el.closest('form');
  const input=section.querySelector('input[type=hidden]'),rows=materialRows(input.value);
  if(action==='product-add-material')rows.push({id:'',quantity:''});else rows.splice(Number(el.closest('[data-material-row]').dataset.materialRow),1);
  input.value=JSON.stringify(rows);renderMaterials(section);refreshRecommendation(form,section);A.owner.capture(form);
  if(action==='product-add-material')section.querySelector('tr:last-child select')?.focus();else section.querySelector('[data-owner=product-add-material]').focus();
 }
 if(action==='variant-edit'&&p){const v=p.variants.find(v=>v.id===el.dataset.variant);A.owner.open(v?'Edit variant':'Add variant',V.form('variant',V.field('label','Variant label',v?.label||'','text','required maxlength="100"')+(!v?V.field('price','Final selling price (PHP)','','number','required min="0.01" step="0.01"'):'<p>Use Set final price to change its selling price.</p>')+V.select('active','Status',[['true','Active'],['false','Inactive']],String(v?.active!==false))+'<p>Existing commitments remain intact. New variants need their own recipe.</p>'+V.button('discard-modal','Cancel'),`data-id="${p.id}" data-variant="${E(v?.id||'')}" data-version="${G.version}"`,'Confirm save'));}
 if(action==='product-toggle'&&p)A.owner.open(p.active===false?'Activate product':'Deactivate product',`<p>${E(p.name)}: existing orders and subscriptions remain unchanged. Ingredient and scheduling checks still apply.</p>${V.error()}${V.button('product-confirm-toggle','Confirm',`data-id="${p.id}" data-version="${G.version}"`)}${V.button('discard-modal','Cancel')}`);
 if(action==='product-confirm-toggle'&&p){const error=A.owner.saveError?'Changes could not be saved.':Number(el.dataset.version)!==G.version?'Product changed. Reopen this dialog.':'';if(error){document.querySelector('#owner-modal .owner-error').textContent=error;return;}p.active=p.active===false;G.version++;A.closeModal(true);G.changed();A.toast('Product status updated.');}
});
document.addEventListener('submit',e=>{const form=e.target.closest('[data-owner-form]');if(!form||!['product','variant','category'].includes(form.dataset.ownerForm))return;e.preventDefault();e.stopImmediatePropagation();if(!A.session.ownerAllowed())return;const data=new FormData(form),get=k=>String(data.get(k)||'').trim(),id=Number(form.dataset.id),p=A.products.find(p=>p.id===id);let error=A.owner.saveError?'Changes could not be saved.':Number(form.dataset.version)!==G.version?'Product changed. Reopen the form.':'';
 const price=Number(get('price')),label=get('label');if(!error&&form.dataset.ownerForm==='category'){const c=categoryRecords.find(c=>c.id===form.dataset.id);if(!get('name')||categoryRecords.some(x=>x!==c&&x.name.toLowerCase()===get('name').toLowerCase())||!['active','inactive'].includes(get('status')))error='Use a unique category name and valid status.';else{const target=c||{id:'category-'+crypto.randomUUID()};Object.assign(target,{name:get('name'),status:get('status')});if(!c)categoryRecords.push(target);categories.splice(0,categories.length,...categoryRecords.map(c=>[c.id,c.name]));A.products.filter(p=>p.category===target.id).forEach(p=>p.categoryLabel=target.name);}}
 else if(!error&&form.dataset.ownerForm==='product'){
  const keys=data.getAll('variants');
  const selected=variantChoices(p).filter(choice=>keys.includes(choice.key)).map(choice=>({...choice,price:Number(get('price-'+choice.key))}));
  const category=categoryRecords.find(c=>c.id===get('category')&&(c.status==='active'||p?.category===c.id));
  const cover=get('image');
  for(const choice of selected)choice.recipe=materialRecipe(materialRows(get('bom-'+choice.key)));
  if(Number(get('pricing-version'))!==P.version)error='Pricing or recipes changed. Cancel and reopen the product.';
  else if(!get('name')||!get('description')||!category||(!images.some(([url])=>url===cover)&&p?.image!==cover))error='Enter a product name, description, category and valid image selection.';
  else if(!selected.length||selected.length!==keys.length)error='Select at least one valid variant.';
  else if(selected.some(v=>!v.recipe))error='Use each material once per variant and enter a positive quantity.';
  else if(selected.some(v=>!Number.isFinite(v.price)||v.price<0.01))error='Enter a positive selling price for each selected variant.';
  else{
   const target=p||{id:Math.max(0,...A.products.map(p=>p.id))+1,variants:[]};
   const retained=new Set(selected.map(v=>v.variant));
   for(const variant of target.variants)variant.active=retained.has(variant);
   for(const choice of selected){
    const variant=choice.variant||{id:target.variants.length?'variant-'+crypto.randomUUID():'standard',label:choice.label,customRecipe:true};
    Object.assign(variant,{price:Math.round(choice.price*100)/100,active:true});
    if(!choice.variant)target.variants.push(variant);
    const recipeKey=target.id+':'+variant.id;
    const original=choice.variant?I.recipe(target.id,variant.id):null;
    if(JSON.stringify(original||{})!==JSON.stringify(choice.recipe)){
     if(Object.keys(choice.recipe).length)P.recipes.set(recipeKey,choice.recipe);
     else{P.recipes.delete(recipeKey);variant.customRecipe=true;}
    }
   }
   Object.assign(target,{name:get('name'),description:get('description'),category:category.id,categoryLabel:category.name,image:cover,active:get('active')==='true',subscription:get('subscription')==='true'});
   if(!p){I.catalogEnabled.set(target.id,true);A.products.push(target);G.attach(target);}
   G.display(target);
  }
 }
 else if(!error){const v=p?.variants.find(v=>v.id===form.dataset.variant);if(!p||!label||p.variants.some(x=>x!==v&&x.label.toLowerCase()===label.toLowerCase())||!v&&(!Number.isFinite(price)||price<=0))error='Use a unique variant label and a positive final price.';else if(v)Object.assign(v,{label,active:get('active')==='true'});else p.variants.push({id:'variant-'+crypto.randomUUID(),label,price:Math.round(price*100)/100,active:get('active')==='true',customRecipe:true});if(!error)G.display(p);}
 if(error){form.querySelector('.owner-error').textContent=error;return;}G.version++;P.version++;A.owner.drafts.delete(A.owner.draftKey(form));if(form.dataset.ownerForm==='product')location.hash='#/owner/products';else A.closeModal(true);G.changed();if(form.dataset.ownerForm==='category')openCategories();A.toast('Catalog changes saved.');
});
})();
