/* Catalog maintenance reuses the sellable product and variant records. */
(() => {
const A=K406,I=A.inventory,P=A.pricing,V=A.ownerUI,E=A.escape;
const categories=[['breads','Breads'],['pastries','Pastries'],['pantry','Pantry']];
const categoryBaseline=categories.map(([id,name])=>({id,name,status:'active',version:null}));
const categoryRecords=A.productCategories=categoryBaseline.map(c=>({...c}));
const placeholderCover='assets/product-placeholder.svg';
const coverError='Choose a JPEG, PNG, or WebP image up to 2 MB.';
const coverReads=new WeakMap();
async function loadCover(file){
 if(!file.size||file.size>2*1024*1024)throw Error(coverError);
 const bytes=new Uint8Array(await file.slice(0,12).arrayBuffer());
 const matches=(signature,offset=0)=>signature.every((byte,index)=>bytes[index+offset]===byte);
 let type;
 if(matches([0xff,0xd8,0xff]))type='image/jpeg';
 else if(matches([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))type='image/png';
 else if(matches([0x52,0x49,0x46,0x46])&&matches([0x57,0x45,0x42,0x50],8))type='image/webp';
 if(!type)throw Error(coverError);
 try{
  const url=await new Promise((resolve,reject)=>{
   const reader=new FileReader();
   reader.onload=()=>resolve(reader.result);
   reader.onerror=()=>reject(reader.error);
   reader.readAsDataURL(file.slice(0,file.size,type));
  });
  const image=new Image();
  image.src=url;
  await image.decode();
  return url;
 }catch{throw Error('This image could not be opened. Choose another file.');}
}
function readCover(file){
 if(!coverReads.has(file))coverReads.set(file,loadCover(file));
 return coverReads.get(file);
}
function showCover(form, url, file){
 const card=form.querySelector('.owner-product-image-section');
 const hasCover=url!==placeholderCover;
 card.querySelector('[data-cover-drop]').hidden=hasCover;
 const cover=card.querySelector('.owner-product-cover');
 cover.hidden=!hasCover;
 cover.querySelector('img').src=hasCover?url:placeholderCover;
 cover.querySelector('[data-cover-name]').textContent=file?.name||
  (url.startsWith('assets/')?url.split('/').pop():'Saved cover photo');
 cover.querySelector('[data-cover-size]').textContent=file
  ? (file.size>=1024*1024?`${(file.size/(1024*1024)).toFixed(1)} MB`:`${Math.max(1,Math.round(file.size/1024))} KB`):'';
}
async function previewCover(form){
 const upload=form.elements['cover-upload'],file=upload.files[0];
 const error=form.querySelector('[data-cover-error]');
 error.textContent='';
 if(file){
  try{
   const url=await readCover(file);
   if(upload.files[0]!==file)return;
   showCover(form,url,file);
   return;
  }catch(problem){
   if(upload.files[0]!==file)return;
   error.textContent=problem.message||coverError;
  }
 }
 showCover(form,form.elements.image.value);
}
const baseline=A.products.map(p=>({...JSON.parse(JSON.stringify(p)),available:I.catalogEnabled.get(p.id)!==false}));
const G=A.productAdmin={version:0};
G.attach=p=>Object.defineProperty(p,'available',{configurable:true,enumerable:true,get:()=>I.productAvailable(p.id),set:value=>I.catalogEnabled.set(p.id,value)});
G.display=p=>{const variants=p.variants.filter(v=>v.active!==false);p.price=(variants.length>1?'From ':'')+A.commerce.money(variants.length?Math.min(...variants.map(v=>v.price)):0);p.variant=variants.length===1?variants[0].label:variants.length+' variants';};
G.inventoryProduct=p=>({id:p.id,name:p.name,description:p.description,image:p.image||'assets/product-placeholder.svg',
 category:categoryRecords.find(c=>c.id===p.category)||{id:p.category,name:p.categoryLabel,status:'active'},
 subscription:Boolean(p.subscription),active:p.active!==false});
G.inventoryVariant=(productId,v)=>({variant:v.id,variantName:v.label,price:v.price,active:v.active!==false,
 overhead:P.overheads.get(productId+':'+v.id)??null,rows:null});
G.syncInventoryCatalog=(products,savedCategories,variants)=>{
 const savedIds=new Set(savedCategories.map(row=>row.category_id));
 for(let i=categoryRecords.length-1;i>=0;i--){
  if(!savedIds.has(categoryRecords[i].id))categoryRecords.splice(i,1);
 }
 for(const row of savedCategories){
  const category=categoryRecords.find(c=>c.id===row.category_id);
  const fields={id:row.category_id,name:row.category_name,status:row.status,version:row.updated_at};
  if(category)Object.assign(category,fields);
  else categoryRecords.push(fields);
 }
 categories.splice(0,categories.length,...categoryRecords.map(c=>[c.id,c.name]));
 for(const row of products){
  let p=A.products.find(p=>p.id===row.product_id);
  if(p?.inventoryVersion===row.updated_at)continue;
  if(!p){
   p={id:row.product_id,variants:[]};
   A.products.push(p);
   G.attach(p);
  }
  Object.assign(p,{name:row.name,description:row.description,category:row.category_id,
   categoryLabel:categoryRecords.find(c=>c.id===row.category_id)?.name,image:row.img_url,
   subscription:Boolean(row.subscription_eligible),active:row.status==='active',inventoryVersion:row.updated_at});
  p.variants=variants.filter(v=>v.product_id===p.id).map(v=>({id:v.variant_key,label:v.size,price:v.final_price,
   active:v.status==='available',customRecipe:true}));
  G.display(p);
 }
 for(const p of A.products){
  const category=categoryRecords.find(c=>c.id===p.category);
  if(category)p.categoryLabel=category.name;
 }
};
G.loadCatalog=async()=>{
 const {products,categories,variants,schedules=[],availability}=await A.authUI.api('catalog');
 if(I.databaseAccount)return;
 G.syncInventoryCatalog(products,categories,variants);
 A.capacity.syncSchedules(schedules);
 if(availability)I.syncCustomerAvailability(availability);
 A.catalog.refresh();
 if(A.route==='product')A.product.refreshAvailability();
 if(A.route==='subscriptions')A.subscriptions.render();
};
G.changed=()=>{A.activeProduct=null;A.catalog.refresh();A.operations.changed();};
A.resetProductData=()=>{A.products.splice(0,A.products.length,...baseline.map(p=>JSON.parse(JSON.stringify(p))));for(const p of A.products){I.catalogEnabled.set(p.id,p.available);G.attach(p);}G.version=0;categoryRecords.splice(0,categoryRecords.length,...categoryBaseline.map(c=>({...c})));categories.splice(0,categories.length,...categoryRecords.map(c=>[c.id,c.name]));A.catalog.refresh();};
const setPrice=P.setPrice;P.setPrice=(...args)=>{const error=setPrice(...args);if(!error){G.display(A.products.find(p=>p.id===args[0]));G.changed();}return error;};
// Availability is evaluated live; purchased item snapshots are never rewritten.
const line=A.commerce.line;A.commerce.line=(id,variant='standard',quantity=1)=>({...line(id,variant,quantity),available:I.productAvailable(id,variant)});
const config=A.subscriptions.configReason;A.subscriptions.configReason=()=>{const d=A.subscriptions.state.draft;return A.variant(d.productId,d.variant)?.active===false?'This variant is inactive.':config();};
const status=p=>p.active===false?'inactive':I.catalogEnabled.get(p.id)===false?'unavailable':p.available?'available':'stock';
function openCategories(){
 const rows=categoryRecords.map(c=>{
  const visibility=c.status==='active'?'Hide':'Show';
  const assigned=A.products.some(p=>p.category===c.id);
  const attrs=`data-id="${E(c.id)}"`;
  return `<div><strong>${E(c.name)}${c.status==='inactive'?'<small>Hidden from Shop</small>':''}</strong><div class="owner-category-row-actions">
  ${V.button('category-edit','Edit',`${attrs} aria-label="Edit ${E(c.name)}"`)}
  ${V.button('category-visibility',visibility,`${attrs} aria-label="${visibility} ${E(c.name)}"`)}
  ${V.button('category-remove','Remove',`${attrs} aria-label="Remove ${E(c.name)}" ${assigned?'disabled title="This category has assigned products"':''}`)}
  </div></div>`;
 }).join('');
 A.owner.open('Manage categories',`<section class="owner-category-manager"><p>Only categories with no assigned products can be removed.</p><h3>Categories (${categoryRecords.length})</h3><div class="owner-category-list">${rows||'<p>No categories yet.</p>'}</div>
 ${V.button('category-edit','Add category','data-category-add')}
 <div class="owner-category-actions">${V.button('discard-modal','Done','',true)}</div></section>`);
}

function openCategoryEditor(category, action){
 const removing=action==='category-remove';
 const visibility=action==='category-visibility';
 const hiding=category?.status==='active';
 const title=removing?'Remove category':visibility?(hiding?'Hide category':'Show category'):category?'Edit category':'Add category';
 const fields=removing?`<p>Remove <strong>${E(category.name)}</strong> from the catalog?</p>`:visibility
  ? `<p>${hiding?'Hide':'Show'} <strong>${E(category.name)}</strong> on the Shop page?${hiding?' Products in this category will still appear under All Products.':''}</p>
     <input type="hidden" name="name" value="${E(category.name)}"><input type="hidden" name="status" value="${hiding?'inactive':'active'}">`
  : V.field('name','Category name',category?.name||'','text','required maxlength="80"')+
    `<input type="hidden" name="status" value="${category?.status||'active'}">`;
 A.owner.open(title,V.form('category',fields+V.button('categories','Cancel'),
  `data-id="${E(category?.id||'')}" data-category-version="${E(category?.version||'')}" data-version="${G.version}" ${removing?'data-remove-category':''}`,
  removing||visibility?title:'Save category'));
}

async function saveCategory(form, name, status){
 const category=categoryRecords.find(c=>c.id===form.dataset.id);
 const removing=form.hasAttribute('data-remove-category');
 if(form.dataset.id&&!category)return 'Category changed. Reopen the form.';
 if(removing&&A.products.some(p=>p.category===category.id))return 'Reassign all products in this category before removing it.';
 if(!removing&&(!name||name.length>80||categoryRecords.some(c=>c!==category&&c.name.toLowerCase()===name.toLowerCase()))){
  return 'Use a unique category name of up to 80 characters.';
 }
 if(!removing&&!['active','inactive'].includes(status))return 'Choose a valid category status.';
 const id=category?.id||'category-'+form.dataset.operation;
 if(I.databaseAccount){
  form.dataset.saving='true';
  const submit=form.querySelector('[type=submit]');
  submit.disabled=true;
  const error=await I.save(removing?'category/remove':'category',{id,name,status,version:form.dataset.categoryVersion||null,key:form.dataset.operation});
  delete form.dataset.saving;
  submit.disabled=false;
  return error==='not-found'?'Category management is unavailable on the running server. Restart the local server and reload the page.':error;
 }
 if(removing)categoryRecords.splice(categoryRecords.indexOf(category),1);
 else if(category)Object.assign(category,{name,status});
 else categoryRecords.push({id,name,status,version:null});
 categories.splice(0,categories.length,...categoryRecords.map(c=>[c.id,c.name]));
 for(const p of A.products)if(p.category===id)p.categoryLabel=name;
 return '';
}
A.ownerPages.products=()=>{const id=A.owner.parts[2];if(id==='new')return productEditor();if(id){const p=A.products.find(p=>p.id===Number(id));const [, , , action, variantId, extra]=A.owner.parts;return p&&action==='edit'&&!extra&&(!variantId||p.variants.some(v=>v.id===variantId))?productEditor(p,variantId):V.panel('Product not found','<p>This reference is unavailable.</p>',V.link('products','All products'));}
 if(!categoryRecords.some(category=>category.id===A.owner.filters.category))A.owner.filters.category='all';
 const f=A.owner.filters;let list=A.products.filter(p=>(!f.query||[p.name,p.description,...p.variants.map(v=>v.label)].join(' ').toLowerCase().includes(f.query.toLowerCase()))&&(!f.category||f.category==='all'||p.category===f.category)&&(!f.type||f.type==='all'||status(p)===f.type));list.sort((a,b)=>f.sort==='name'?a.name.localeCompare(b.name):f.sort==='oldest'?a.id-b.id:b.id-a.id);
 if(f['product-type']==='subscription')list=list.filter(p=>p.subscription);
 if(f['product-type']==='standard')list=list.filter(p=>!p.subscription);
 const filters=`<div class="owner-order-filters owner-product-filters">
  ${V.field('query','Search',f.query,'search','placeholder="Search products"')}
  ${V.select('category','Category',[['all','All categories'],...categories],f.category||'all')}
  ${V.select('product-type','Product type',[['all','All products'],['subscription','Subscription products'],['standard','Standard products']],f['product-type']||'all')}
  ${V.select('type','Availability',[['all','All statuses'],['available','Available'],['stock','Ingredient shortage / missing recipe'],['unavailable','Temporarily unavailable'],['inactive','Deactivated']],f.type||'all')}
  ${V.select('sort','Sort',[['newest','Newest first'],['oldest','Oldest first'],['name','Name A–Z']],f.sort||'newest')}
  ${V.button('clear-filters','Clear filters')}
 </div>`;
 return V.intro('Products','Catalog, variants, recipes and owner-controlled selling prices.')+`<div class="owner-product-tools">${V.link('products/new','Add product')}${V.button('categories','Manage categories')}${V.button('pricing-settings','Costing settings')}</div>`+filters+V.paged(list,productCards,false,12);
};
function productCards(products){
 if(!products.length)return '<p class="muted owner-orders-empty">No products match these filters.</p>';
 const availabilityLabels={available:'Available',stock:'Ingredient shortage / missing recipe',unavailable:'Temporarily unavailable',inactive:'Unavailable'};
 return `<div class="owner-product-grid">${products.map(p=>{
  const active=p.active!==false,availability=status(p);
  const schedule=p.subscription&&A.subscriptions.availableSchedules(p.id)[0];
  return `<article class="product-card owner-product-card">
   <img src="${E(p.image||'assets/product-placeholder.svg')}" alt="" loading="lazy">
   <div class="owner-product-card-body">
    <h2><a href="#/owner/products/${p.id}/edit">${E(p.name)}</a></h2>
    <span class="order-badge${availability==='available'?'':' attention'}">${E(availabilityLabels[availability])}</span>
    ${p.subscription?`<p class="muted">${schedule?'Prep '+E(A.subscriptions.weekdays[schedule.preparation_day])+' · Fulfill '+E(A.subscriptions.weekdays[schedule.day]):'Subscription schedule inactive'}</p>`:''}
    <div class="owner-product-card-actions">
     ${V.link('products/'+p.id+'/edit','Edit')}
     ${V.button('product-toggle',active?'Active':'Deactivated',`data-id="${p.id}" role="switch" aria-checked="${active}" aria-label="${E(p.name)} activation"`)}
    </div>
   </div>
  </article>`;
 }).join('')}</div>`;
}
function productSwitch(name,label,checked){
 return `<div class="owner-product-switch"><label for="owner-${name}">${label}</label><input id="owner-${name}" name="${name}" type="checkbox" role="switch" value="true" ${checked?'checked':''}></div>`;
}
function variantChoices(p,selectedId){
 const packs=[{id:'pack-6',label:'6-pack'},{id:'pack-12',label:'12-pack'}];
 const variants=p?.variants||[];
 const choices=packs.map(pack=>{
  const variant=variants.find(v=>v.label.toLowerCase()===pack.label);
  return {...pack,variant,key:variant?'saved:'+variant.id:'new:'+pack.id};
 });
 const legacy=variants.filter(v=>(v.active!==false||v.id===selectedId)&&!choices.some(choice=>choice.variant===v));
 return [...choices,...legacy.map(variant=>({key:'saved:'+variant.id,label:variant.label,variant}))];
}
function recommendedPrice(label,cost,overhead){
 const rows=[['Ingredients',cost?V.money(cost.ingredients):'—'],['Packaging',cost?V.money(cost.packaging):'—'],
  ['Utility overhead',V.money(overhead)],
  ['Markup ('+P.markup+'%)',cost?V.money(cost.suggested-cost.total):'—'],['Profit per unit',cost?V.money(cost.suggested-cost.total):'—'],['Recommended price',cost?V.money(cost.suggested):'Unavailable']];
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
 return [item?.unit||'—',V.unitMoney(cost),V.money(Number.isFinite(cost)&&quantity>0?cost*quantity:undefined)];
}
function renderMaterials(section){
 const rows=materialRows(section.querySelector('input[type=hidden]').value);
 section.querySelector('.owner-material-table').innerHTML=V.table(['Material','Quantity','Unit','Unit cost','Material cost','Actions'],rows.map((row,index)=>{
  const choices=[['','Choose a material'],...I.items.filter(i=>!i.archivedAt||i.id===row.id).map(i=>[i.id,i.name+(i.archivedAt?' — Archived':'')])];
  const [unit,cost,total]=materialCells(row);
  const remove='<button type="button" class="btn owner-edit-remove" data-owner="product-remove-material" aria-label="Remove material"><span class="material-symbols-outlined" aria-hidden="true">delete</span></button>';
  return `<tr data-material-row="${index}"><td><select data-material-field="id" aria-label="Material ${index+1}">${choices.map(([id,label])=>`<option value="${E(id)}" ${row.id===id?'selected':''}>${E(label)}</option>`).join('')}</select></td><td><input type="number" min="0.001" step="any" value="${E(row.quantity)}" data-material-field="quantity" aria-label="Quantity ${index+1}"></td><td data-material-unit>${E(unit)}</td><td data-material-cost>${E(cost)}</td><td data-material-total>${E(total)}</td><td>${remove}</td></tr>`;
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
 for(const card of form.querySelectorAll('[data-edit-pack]')){
  const body=card.querySelector('fieldset');
  body.hidden=body.disabled=!selected.has(card.dataset.editPack);
 }
}
function productEditor(p,variantId){
 const fresh=!p,cover=p?.image||placeholderCover;
 const schedules=A.subscriptions.schedules.filter(schedule=>schedule.product_id===p?.id);
 const schedule=A.subscriptions.availableSchedules(p?.id)[0]||schedules.find(entry=>entry.inventoryVersion)||schedules[0];
 const days=[['','Select a day'],...A.subscriptions.weekdays.map((day,index)=>[index,day])];
 const variants=variantChoices(p,variantId);
 const name=V.field('name','Product name',p?.name||'','text','required maxlength="120"');
 const description=`<div class="field owner-product-description"><div><label for="owner-description">Description</label><small>Max 1,000 characters</small></div><textarea id="owner-description" name="description" required maxlength="1000" rows="3">${E(p?.description||'')}</textarea></div>`;
 const category=V.select('category','Category',categories.filter(([id])=>id===p?.category||categoryRecords.find(c=>c.id===id)?.status==='active'),p?.category||'');
 const switches=`<div class="owner-product-switches">${productSwitch('active','Active',p?.active!==false)}${productSwitch('subscription','Subscription-eligible',!!p?.subscription)}</div>`;
 const scheduleFields=`<fieldset class="owner-product-schedule" data-product-schedule ${p?.subscription?'':'hidden disabled'}><legend>Weekly subscription schedule</legend>
   <div>${V.select('preparation_day','Preparation day',days,schedule?.preparation_day??'','required')}
   ${V.select('delivery_day','Delivery day',days,schedule?.day??'','required')}</div>
   <p data-schedule-preview aria-live="polite"></p><p class="muted">Existing payment holds and paid subscriptions keep their dates.</p></fieldset>`;
 const imageSection=`<div class="owner-product-image-section">
  <p class="muted">Add a cover photo for this product.</p>
  <input type="hidden" name="image" value="${E(cover)}">
  <input type="file" id="owner-cover-upload" name="cover-upload" accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp" hidden>
  <button type="button" class="owner-cover-drop" data-cover-drop data-cover-pick ${cover===placeholderCover?'':'hidden'}>
   <span class="material-symbols-outlined" aria-hidden="true">add_photo_alternate</span>
   <strong>Click to upload or drag and drop</strong>
   <small>JPEG, PNG or WebP · Max 2 MB</small>
  </button>
  <div class="owner-product-cover" ${cover===placeholderCover?'hidden':''}>
   <div class="owner-cover-preview"><img src="${E(cover)}" alt="Cover preview"><span>Cover image</span></div>
   <strong data-cover-name></strong><small class="muted" data-cover-size></small>
   <div class="owner-cover-actions"><button type="button" class="btn" data-cover-pick><span class="material-symbols-outlined" aria-hidden="true">upload</span>Replace image</button>
   <button type="button" class="btn" data-cover-remove><span class="material-symbols-outlined" aria-hidden="true">delete</span>Remove</button></div>
   <p class="muted">Uploading a new photo replaces the current cover.</p>
  </div>
  <p class="owner-cover-error" data-cover-error role="alert"></p>
 </div>`;
 const recipeFields=({key,label,variant})=>{
  const recipe=variant?I.recipe(p.id,variant.id):null;
  const rows=Object.entries(recipe||{}).map(([id,quantity])=>({id,quantity}));
  const overhead=variant?(P.overheads.get(p.id+':'+variant.id)??P.overhead):P.overhead;
  return `<section class="owner-product-materials-variant" data-product-variant="${E(key)}" data-variant-label="${E(label)}" data-overhead="${overhead}"><input type="hidden" name="bom-${E(key)}" value="${E(JSON.stringify(rows))}"><div class="owner-material-heading"><h3>Recipe</h3>${V.button('product-add-material','+ Add material')}</div><div class="owner-material-table"></div></section>`;
 };
 const stateFields=`<input type="hidden" name="schedule-id" value="${E(schedule?.id||'')}"><input type="hidden" name="schedule-version" value="${A.capacity.version}"><input type="hidden" name="schedule-inventory-version" value="${E(schedule?.inventoryVersion||'')}"><input type="hidden" name="pricing-version" value="${P.version}">`;
 const cards=variants.map(choice=>{
  const {id,key,label,variant}=choice;
  const enabled=variant?variant.active!==false:fresh&&id==='pack-6';
  return `<article class="owner-edit-pack" data-edit-pack="${E(key)}" ${variant && variant.id===variantId?'data-variant-target tabindex="-1"':''}>
   <label class="owner-edit-pack-choice"><input type="checkbox" name="variants" value="${E(key)}" ${enabled?'checked':''}> <span>${E(label)}</span></label>
   <fieldset aria-label="${E(label)} pricing and recipe" ${enabled?'':'hidden disabled'}>
    <div class="owner-edit-pack-prices"><div class="owner-edit-pack-price">${V.field('price-'+key,'Selling price',variant?.price??'','number','required min="0.01" step="0.01"')}</div>
    <section class="owner-product-cost"><h3>Recommended selling price</h3><div data-product-variant="${E(key)}"></div></section></div>
    ${recipeFields(choice)}
   </fieldset>
  </article>`;
 }).join('');
 const details=`<div class="owner-edit-shared-fields"><div>${name}${category}</div><div>${description}${switches}</div>${scheduleFields}</div>`;
 return `<div class="owner-product-editor owner-edit-product">
  <form class="staff-form owner-edit-product-form" data-owner-form="product" data-id="${p?.id||''}" data-version="${G.version}">
   ${stateFields}<div class="owner-edit-toolbar">${V.button('product-cancel','← Back to products')}
    ${fresh?'':V.button('product-edit-start','Edit','',true)}
    <div data-product-edit-actions ${fresh?'':'hidden'}>${V.button(fresh?'product-cancel':'product-edit-cancel','Cancel')}<button type="submit" class="btn primary">Save product</button></div>
   </div>
   ${V.error()}<fieldset class="owner-edit-product-fields" data-product-edit-fields aria-label="Product details and pack sizes" ${fresh?'':'disabled'}>
    <div class="owner-edit-summary">${V.panel('Product details',details)}${V.panel('Product image',imageSection)}</div>
    <section class="commerce-card owner-edit-pack-sizes"><header><h2>Pack sizes</h2><p>Enable one or both pack sizes. Each has its own price and recipe.</p></header><div class="owner-edit-pack-grid">${cards}</div></section>
   </fieldset>
  </form></div>`;
}
function syncProductSchedule(form){
 const fields=form.querySelector('[data-product-schedule]');
 fields.hidden=fields.disabled=!form.elements.subscription.checked;
 const day=name=>form.elements[name].value===''?NaN:Number(form.elements[name].value);
 fields.querySelector('[data-schedule-preview]').textContent=A.capacity.schedulePreview(Number(form.dataset.id),
  day('preparation_day'),day('delivery_day'));
}
G.initEditor=form=>{
 syncProductSchedule(form);
 const savedCover=A.owner.drafts.get(A.owner.draftKey(form))?.values.find(([name])=>name==='cover-upload')?.[1];
 if(savedCover instanceof File&&savedCover.size){
  const transfer=new DataTransfer();
  transfer.items.add(savedCover);
  form.elements['cover-upload'].files=transfer.files;
 }
 previewCover(form);
 const card=form.querySelector('.owner-product-image-section');
 const input=form.elements['cover-upload'];
 card.addEventListener('click',e=>{
  if(input.matches(':disabled'))return;
  if(e.target.closest('[data-cover-pick]'))input.click();
  if(e.target.closest('[data-cover-remove]')){
   input.value='';
   form.elements.image.value=placeholderCover;
   previewCover(form);
   A.owner.capture(form);
   card.querySelector('[data-cover-drop]').focus();
  }
 });
 card.addEventListener('dragover',e=>{
  if(input.matches(':disabled')||!e.dataTransfer.types.includes('Files'))return;
  e.preventDefault();
  card.classList.add('is-dragging');
 });
 card.addEventListener('dragleave',e=>{
  if(!card.contains(e.relatedTarget))card.classList.remove('is-dragging');
 });
 card.addEventListener('drop',e=>{
  e.preventDefault();
  card.classList.remove('is-dragging');
  if(input.matches(':disabled')||!e.dataTransfer.files.length)return;
  if(e.dataTransfer.files.length!==1){
   card.querySelector('[data-cover-error]').textContent='Drop one cover photo at a time.';
   return;
  }
  input.files=e.dataTransfer.files;
  input.dispatchEvent(new Event('change',{bubbles:true}));
 });
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
function confirmActivation(product,form=null){
 const active=form?!form.elements.active.checked:product.active===false;
 const label=active?'Activate':'Deactivate',version=G.version,generation=A.session.generation;
 A.owner.open(label+' product',`<div class="owner-order-confirm"><p>${label} <strong>${E(form?.elements.name.value||product?.name||'this product')}</strong>?</p>${V.error()}<div class="owner-order-confirm-actions">${V.button('discard-modal','Cancel')}${V.button('product-confirm-activation',label,'',true)}</div></div>`);
 const confirm=A.$('owner-dialog-body').querySelector('[data-owner=product-confirm-activation]'),key=crypto.randomUUID();
 confirm.addEventListener('click',async()=>{
  if(!A.session.ownerAllowed()||generation!==A.session.generation)return;
  const error=A.owner.saveError?'Changes could not be saved. Please retry.':version!==G.version?'Product changed. Reopen this dialog.':'';
  if(error){A.$('owner-dialog-body').querySelector('.owner-error').textContent=error;return;}
  if(form){if(!form.isConnected)return;form.elements.active.checked=active;A.owner.capture(form);A.closeModal(true);}
  else{
   if(active&&product.variants.some(variant=>variant.active!==false&&!Object.keys(I.recipe(product.id,variant.id)||{}).length)){
    A.$('owner-dialog-body').querySelector('.owner-error').textContent='Add a recipe for every active variant before activating this product.';
    return;
   }
   if(I.databaseAccount){
    const payload={...G.inventoryProduct(product),active};
    confirm.disabled=true;
    const issue=await I.saveRecipes(payload,product.variants.map(v=>G.inventoryVariant(product.id,v)),key);
    confirm.disabled=false;
    if(generation!==A.session.generation||!confirm.isConnected)return;
    if(issue){A.$('owner-dialog-body').querySelector('.owner-error').textContent=issue;return;}
   }else product.active=active;
   G.version++;A.closeModal(true);G.changed();A.toast('Product status updated.');
  }
 });
}
document.addEventListener('input',e=>{
 const form=e.target.form;
 if(form?.dataset.ownerForm!=='product'||e.target.name!=='active'||!A.session.ownerAllowed())return;
 e.target.checked=!e.target.checked;
 A.owner.capture(form);
 confirmActivation(A.products.find(p=>p.id===Number(form.dataset.id)),form);
});
document.addEventListener('change',e=>{
 const form=e.target.form;if(form?.dataset.ownerForm!=='product')return;
 if(['subscription','preparation_day','delivery_day'].includes(e.target.name))syncProductSchedule(form);
 if(e.target.id==='owner-cover-upload'){
  previewCover(form).then(()=>{if(form.isConnected)A.owner.capture(form);});
 }
 if(e.target.name==='variants'){syncVariantFields(form);A.owner.capture(form);}
});
document.addEventListener('click',e=>{const el=e.target.closest('[data-owner]');if(!el||!A.session.ownerAllowed())return;const action=el.dataset.owner,p=A.products.find(p=>p.id===Number(el.dataset.id));
 if(action==='categories'){A.owner.discardModalDraft();openCategories();}
 if(['category-edit','category-visibility','category-remove'].includes(action)&&!el.disabled){
  const category=categoryRecords.find(c=>c.id===el.dataset.id);
  if(category||action==='category-edit'&&!el.dataset.id)openCategoryEditor(category,action);
 }
 if(action==='product-cancel'){
  const form=el.closest('.owner-product-editor').querySelector('form');
  A.owner.drafts.delete(A.owner.draftKey(form));location.hash='#/owner/products';
 }
 if(action==='product-edit-start'){
  const form=el.form;
  form.querySelector('[data-product-edit-fields]').disabled=false;
  form.querySelector('[data-product-edit-actions]').hidden=false;
  el.hidden=true;
  form.elements.name.focus();
 }
 if(action==='product-edit-cancel'&&!el.form.dataset.saving){
  A.owner.drafts.delete(A.owner.draftKey(el.form));
  A.owner.render();
  document.querySelector('[data-owner=product-edit-start]')?.focus();
 }
 if(action==='product-add-material'||action==='product-remove-material'){
  const section=el.closest('.owner-product-materials-variant'),form=el.closest('form');
  const input=section.querySelector('input[type=hidden]'),rows=materialRows(input.value);
  if(action==='product-add-material')rows.push({id:'',quantity:''});else rows.splice(Number(el.closest('[data-material-row]').dataset.materialRow),1);
  input.value=JSON.stringify(rows);renderMaterials(section);refreshRecommendation(form,section);A.owner.capture(form);
  if(action==='product-add-material')section.querySelector('tr:last-child select')?.focus();else section.querySelector('[data-owner=product-add-material]').focus();
 }
 if(action==='variant-add'&&p)location.hash='#/owner/products/'+p.id+'/edit';
 if(action==='variant-edit'&&p){
  const variant=p.variants.find(entry=>entry.id===el.dataset.variant);
  if(!variant)return;
  A.owner.open('Edit variant',V.form('variant',
   V.field('label','Variant',variant.label,'text','readonly')+
   V.select('active','Status',[['true','Active'],['false','Inactive']],String(variant.active!==false))+
   V.button('discard-modal','Cancel'),
   `data-id="${p.id}" data-variant="${E(variant.id)}" data-version="${G.version}"`,'Confirm save'));
 }
 if(action==='product-toggle'&&p)confirmActivation(p);
});
document.addEventListener('submit',async e=>{const form=e.target.closest('[data-owner-form]');if(!form||!['product','variant','category'].includes(form.dataset.ownerForm))return;e.preventDefault();e.stopImmediatePropagation();if(!A.session.ownerAllowed()||form.dataset.saving||form.querySelector('[data-product-edit-fields]')?.disabled)return;const data=new FormData(form),get=k=>String(data.get(k)||'').trim(),id=Number(form.dataset.id),p=A.products.find(p=>p.id===id);let error=A.owner.saveError?'Changes could not be saved.':Number(form.dataset.version)!==G.version?'Product changed. Reopen the form.':'';
 const label=get('label');
 if(!error&&form.dataset.ownerForm==='category'){
  error=await saveCategory(form,get('name'),get('status'));
  if(!form.isConnected||Number(form.dataset.generation)!==A.session.generation||A.modal!=='owner-modal'){
   if(!error)G.changed();
   return;
  }
 }
 else if(!error&&form.dataset.ownerForm==='product'){
  const keys=data.getAll('variants');
  const selected=variantChoices(p).filter(choice=>keys.includes(choice.key)).map(choice=>({...choice,price:Number(get('price-'+choice.key))}));
  const category=categoryRecords.find(c=>c.id===get('category')&&(c.status==='active'||p?.category===c.id));
  const cover=get('image');
  const coverFile=form.elements['cover-upload'].files[0];
  let coverUpload;
  const eligible=get('subscription')==='true';
  const targetId=p?.id??Math.max(0,...A.products.map(p=>p.id))+1;
  const schedule=eligible?{id:get('schedule-id'),product_id:targetId,status:'active',
   preparation_day:get('preparation_day')===''?NaN:Number(get('preparation_day')),
   day:get('delivery_day')===''?NaN:Number(get('delivery_day'))}:null;
  const scheduleVersion=Number(get('schedule-version'));
  for(const choice of selected)choice.recipe=materialRecipe(materialRows(get('bom-'+choice.key)));
  if(Number(get('pricing-version'))!==P.version)error='Pricing or recipes changed. Cancel and reopen the product.';
  else if(!get('name')||!get('description')||!category||(cover!==placeholderCover&&p?.image!==cover))error='Enter a product name, description, category and valid image selection.';
  else if(!selected.length||selected.length!==keys.length)error='Select at least one valid variant.';
  else if(selected.some(v=>!v.recipe)){
   const invalid=selected.find(v=>!v.recipe);
   error='Use each material once and enter a positive quantity for '+invalid.label+'.';
  }
  else if(selected.some(v=>!Object.keys(v.recipe).length)){
   const missing=selected.find(v=>!Object.keys(v.recipe).length);
   error='Add at least one recipe material for '+missing.label+' before saving.';
   form.querySelector(`.owner-product-materials-variant[data-product-variant="${CSS.escape(missing.key)}"] [data-owner=product-add-material]`)?.focus();
  }
  else if(selected.some(v=>!Number.isFinite(v.price)||v.price<0.01))error='Enter a positive selling price for each selected variant.';
  else if(schedule)error=A.capacity.scheduleError(schedule,scheduleVersion,true);
  if(!error&&coverFile){
   const generation=A.session.generation,submit=form.querySelector('button[type=submit]');
   form.dataset.saving='true';
   submit.disabled=true;
   try{coverUpload=await readCover(coverFile);}
   catch(problem){error=problem.message||coverError;}
   finally{delete form.dataset.saving;submit.disabled=false;}
   if(generation!==A.session.generation||!form.isConnected||form.elements['cover-upload'].files[0]!==coverFile)return;
  }
  if(!error&&I.databaseAccount){
   const savedSchedule=schedule?{...schedule,id:schedule.id||'schedule-'+form.dataset.operation,
    inventoryVersion:get('schedule-inventory-version')||null}:undefined;
   if(!error){
    const product={id:targetId,name:get('name'),description:get('description'),category,image:cover,active:get('active')==='true',subscription:eligible};
    const variants=selected.map(choice=>({
     variant:choice.variant?.id||choice.id,
     variantName:choice.label,price:Math.round(choice.price*100)/100,active:true,
     overhead:choice.variant?P.overheads.get(targetId+':'+choice.variant.id)??null:null,
     rows:Object.entries(choice.recipe).map(([id,quantity])=>({id,quantity}))
    }));
    for(const variant of p?.variants||[]){
     if(variants.some(v=>v.variant===variant.id))continue;
     variants.push({variant:variant.id,variantName:variant.label,price:variant.price,active:false,
      overhead:P.overheads.get(targetId+':'+variant.id)??null,rows:null});
    }
    const generation=A.session.generation,wasEligible=p?.subscription;
    const submit=form.querySelector('button[type=submit]');
    form.dataset.saving='true';
    if(submit)submit.disabled=true;
    try{error=await I.saveRecipes(product,variants,form.dataset.operation,coverUpload,savedSchedule);}
    finally{delete form.dataset.saving;if(submit)submit.disabled=false;}
    if(generation!==A.session.generation||!form.isConnected)return;
    if(!error){
     if(wasEligible&&!eligible)A.capacity.deactivateProductSchedules(targetId);
    }
   }
  }else if(!error){
   if(p?.subscription&&!eligible)A.capacity.deactivateProductSchedules(p.id);
   const target=p||{id:targetId,variants:[]};
   const retained=new Set(selected.map(v=>v.variant));
   for(const variant of target.variants)variant.active=retained.has(variant);
   for(const choice of selected){
    const variant=choice.variant||{id:choice.id,label:choice.label,customRecipe:true};
    Object.assign(variant,{price:Math.round(choice.price*100)/100,active:true});
    if(!choice.variant)target.variants.push(variant);
    const recipeKey=target.id+':'+variant.id;
    const original=choice.variant?I.recipe(target.id,variant.id):null;
    if(JSON.stringify(original||{})!==JSON.stringify(choice.recipe)){
     if(Object.keys(choice.recipe).length)P.recipes.set(recipeKey,choice.recipe);
     else{P.recipes.delete(recipeKey);variant.customRecipe=true;}
    }
   }
   Object.assign(target,{name:get('name'),description:get('description'),category:category.id,categoryLabel:category.name,image:coverUpload||cover,active:get('active')==='true',subscription:eligible});
   if(!p){I.catalogEnabled.set(target.id,true);A.products.push(target);G.attach(target);}
   if(schedule)A.capacity.saveSchedule(schedule,scheduleVersion);
   G.display(target);
  }
 }
 else if(!error){
  const v=p?.variants.find(v=>v.id===form.dataset.variant);
  if(!v||label!==v.label)error='Choose an existing variant to edit.';
  else{
   const variant={...v,active:get('active')==='true'};
   if(variant.active&&!Object.keys(I.recipe(p.id,variant.id)||{}).length)error='Add at least one recipe material before activating this variant.';
   else if(I.databaseAccount){
    const generation=A.session.generation,submit=form.querySelector('button[type=submit]');
    form.dataset.saving='true';
    if(submit)submit.disabled=true;
    try{error=await I.saveRecipes(G.inventoryProduct(p),[G.inventoryVariant(p.id,variant)],form.dataset.operation);}
    finally{delete form.dataset.saving;if(submit)submit.disabled=false;}
    if(generation!==A.session.generation||!form.isConnected||A.$('owner-modal').hidden)return;
   }else Object.assign(v,variant);
   if(!error)G.display(p);
  }
 }
 if(error){form.querySelector('.owner-error').textContent=error;return;}G.version++;P.version++;A.owner.drafts.delete(A.owner.draftKey(form));if(form.dataset.ownerForm==='product')location.hash='#/owner/products';else A.closeModal(true);G.changed();if(form.dataset.ownerForm==='category')openCategories();A.toast('Catalog changes saved.');
});
})();
