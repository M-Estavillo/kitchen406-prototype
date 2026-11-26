/* Owner workspace lifecycle and delegated controls. */
(() => {
const A=K406,V=A.ownerUI,E=A.escape,I=A.inventory,P=A.pricing,Q=A.capacity;
const links=[
 ['','Dashboard'],
 ['orders','Orders'],
 ['cake-requests','Cake Requests'],
 ['subscriptions','Subscriptions'],
 ['capacity','Production Calendar'],
 ['products','Products'],
 ['inventory','Inventory'],
 ['analytics','Sales Analytics'],
 ['reviews','Customer Reviews'],
 ['accounts','Accounts'],
 ['notifications','Notifications'],
 ['settings','Settings']
];
const blank=()=>({query:'',type:'all',from:'',to:'',sort:'newest'});
const O=A.owner={parts:[],page:1,filters:blank(),status:'all',date:A.schedule.today(),calendarMode:'week',mode:'normal',saveError:false,generation:0,formKey:null,filterCache:new Map(),drafts:new Map()};
O.draftKey=form=>[form.dataset.ownerForm||'production-copy',form.dataset.id||form.dataset.productionCopy||'',form.dataset.variant||''].join(':');
O.capture=form=>{if(!form||['filter','stock','recipe','schedule'].includes(form.dataset.ownerForm))return;O.drafts.set(O.draftKey(form),{version:form.dataset.version,values:[...new FormData(form)]});};
O.restore=form=>{const draft=O.drafts.get(O.draftKey(form));if(!draft)return;const stale=draft.version!==form.dataset.version;if(stale&&draft.version!==undefined)form.dataset.version=draft.version;for(const [name,value] of draft.values){const control=form.elements.namedItem(name);if(control&&typeof value==='string'&&control.type!=='checkbox')control.value=value;}if(form.dataset.ownerForm==='product'){for(const control of form.querySelectorAll('input[type=checkbox]'))control.checked=draft.values.some(([name,value])=>name===control.name&&value===control.value);const cover=form.elements.namedItem('image');if(cover?.value)form.querySelector('.owner-product-cover img').src=cover.value;}form.insertAdjacentHTML('afterbegin',`<p class="staff-note">${stale?'Saved data changed while you were editing. Your draft is retained; discard it to reload current values.':'Your unsaved draft has been restored.'}</p>`);};
O.discardModalDraft=()=>{const form=A.$('owner-dialog-body')?.querySelector('form');if(form)O.drafts.delete(O.draftKey(form));};
O.show=parts=>{if(parts[1]==='orders'&&parts[3]==='delivery'){location.replace('#/owner/orders/'+parts[2]);return;}if(parts[1]==='cake-requests'&&parts[3]==='quotation'&&!parts[4]){O.pendingQuotation=decodeURIComponent(parts[2]);location.replace('#/owner/cake-requests/'+parts[2]);return;}if(parts[1]==='products'&&parts[2]==='categories'){location.replace('#/owner/products');return;}if(parts[1]==='recipes'){location.replace('#/owner/products'+(parts[2]?'/'+parts.slice(2).join('/'):''));return;}if(parts[1]==='scheduling'&&parts[2]==='subscriptions'||parts[1]==='subscriptions'&&['schedules','offerings'].includes(parts[2])){location.replace('#/owner/products');return;}if(parts[1]==='scheduling'&&!parts[2]){location.replace('#/owner/capacity/settings');return;}if(['payments','deliveries'].includes(parts[1])){location.replace('#/owner/orders/'+(parts[2]||parts[1]));return;}const previous=(O.parts[1]==='orders'&&['payments','deliveries'].includes(O.parts[2])||O.parts[1]==='subscriptions'&&['requests'].includes(O.parts[2]))?O.parts[1]+'/'+O.parts[2]:O.parts[1]||'',next=(parts[1]==='orders'&&['payments','deliveries'].includes(parts[2])||parts[1]==='subscriptions'&&['requests'].includes(parts[2]))?parts[1]+'/'+parts[2]:parts[1]||'';if(previous!==next){O.filterCache.set(previous,{filters:{...O.filters},page:O.page,status:O.status});const cached=O.filterCache.get(next);O.filters=cached?.filters||blank();O.page=cached?.page||1;O.status=cached?.status||'all';}O.parts=parts.map(p=>{try{return decodeURIComponent(p);}catch{return p;}});O.generation++;O.render();};
O.open=(title,body)=>{O.formKey=crypto.randomUUID();A.$('owner-dialog-title').textContent=title;A.$('owner-dialog-body').innerHTML=body;const form=A.$('owner-dialog-body').querySelector('form');if(form){form.dataset.generation=A.session.generation;form.dataset.operation=O.formKey;O.restore(form);}A.openModal('owner-modal');};
O.render=()=>{
 if(A.route!=='owner')return;const root=A.$('owner-view');if(!root)return;
 if(!A.session.ownerAllowed()){root.innerHTML=V.intro('Owner access required','Sign in with an active owner account.')+V.panel('Restricted workspace','<p>Owner preview access is available through the State Inspector.</p><a class="btn" href="#/sign-in">Sign in</a> <a class="btn" href="#/shop">Back to shop</a>');return;}
 const page=O.parts[1]||'',pages=A.ownerPages;let render=({'':pages.dashboard,orders:O.parts[2]==='payments'?pages.payments:O.parts[2]==='deliveries'?pages.deliveries:O.parts[2]?pages.detail:pages.orders,payments:pages.payments,deliveries:pages.deliveries,inventory:pages.inventory,products:pages.products,'cake-requests':O.parts[3]==='quotation'?pages.quotation:pages.cakes,subscriptions:pages.subscriptions,capacity:O.parts[2]==='settings'?pages.scheduling:pages.capacity,scheduling:pages.scheduling,notifications:pages.notifications,analytics:pages.analytics,accounts:pages.accounts,reviews:pages.reviews,settings:pages.settings})[page];
 const body=O.mode==='loading'&&render?V.loading(page,links.find(([path])=>path===page)?.[1]||'Owner workspace',Boolean(O.parts[2])):O.mode==='error'?V.panel('Unable to load','<p>Records could not be loaded.</p>',V.button('retry','Retry')):O.mode==='empty'?V.panel('No records','<p>No operational records in this preview state.</p>',V.button('retry','Restore records')):render?render():V.panel('Page not found','<p>This owner page does not exist.</p>',V.link('','Dashboard'));
 root.innerHTML=V.workspace(links,page,body);
 A.shell?.sync();
 root.querySelectorAll('form[data-owner-form]').forEach(form=>{form.dataset.generation=A.session.generation;form.dataset.operation=crypto.randomUUID();O.restore(form);if(form.dataset.ownerForm==='product')A.productAdmin.initEditor(form);});
 if(O.pendingQuotation&&O.mode==='normal'){const id=O.pendingQuotation;O.pendingQuotation=null;A.ownerCakeUI.open(id);}
};
document.addEventListener('change',e=>{if(['owner-calendar-type','owner-calendar-status'].includes(e.target.id)&&A.session.ownerAllowed()){O[e.target.id==='owner-calendar-type'?'calendarType':'calendarStatus']=e.target.value;O.render();}if(e.target.id==='owner-notificationFilter'&&A.session.ownerAllowed()){O.notificationFilter=e.target.value;O.render();}});
function confirmAction(title,body,action,attrs,fields=''){O.open(title,`<div class="owner-order-confirm"><p>${E(body)}</p>${fields}${V.error()}<div class="owner-order-confirm-actions">${V.button('discard-modal','Cancel')}${V.button(action,title,attrs,true)}</div></div>`);}
function result(error,close=true){if(error){const node=document.querySelector('#owner-modal:not([hidden]) .owner-error');if(node)node.textContent=error;else A.toast(error);return false;}if(close)A.closeModal(true);A.operations.changed();A.toast('Changes saved.');return true;}
document.addEventListener('click',async e=>{
 const el=e.target.closest('[data-owner]');if(!el||el.disabled)return;const action=el.dataset.owner,id=el.dataset.id;
 if(action==='enter'){A.session.enter();return;}if(action==='signout'){A.session.signout();return;}
 if(!A.session.ownerAllowed())return;
 if(action==='discard-modal'){A.closeModal();return;}
 if(action==='read-all'||action==='notification-view'){
  const events=O.notifications(),event=events.find(n=>n.id===id);
  if(action==='notification-view'&&!event)return;
  if(O.saveError){A.toast('Read status could not be saved. Please retry.');return;}
  const N=A.notifications;
  const saved=event&&N.saved.includes(event);
  if((action==='read-all'||saved&&!event.read)&&!await N.acknowledge(saved?event.id:undefined))return;
  (action==='read-all'?events:[event]).filter(n=>!N.saved.some(row=>row.id===n.id)).forEach(n=>O.notificationReads.add(n.id));
  O.render();A.shell.sync();if(event?.path)location.hash='#/owner/'+event.path;return;
 }
 if(action==='retry-notifications'){A.notifications.refresh();return;}
 if(action==='retry-outbox'){
  try{await A.authUI.api('notifications/retry',{id});A.toast('Notification queued for retry.');await A.notifications.refresh();}
  catch{A.toast('Could not retry this notification.');}
  return;
 }
 if(action==='cancel-stock'){A.closeModal();return;}
 if(action==='retry'){O.mode='normal';O.render();return;}
 if(action==='previous'||action==='next'){O.page+=action==='next'?1:-1;O.render();return;}
 if(action==='clear-filters'){O.filters=blank();O.status='all';O.page=1;O.render();return;}
 if(action==='inventory-type'){O.filters.type=el.dataset.type;O.page=1;O.render();document.querySelector('[data-owner=inventory-type][aria-pressed=true]')?.focus();return;}
 if(action==='status'){O.status=el.dataset.status;O.page=1;O.render();return;}
 if(action==='record-arrival'){
  const order=A.operations.find(id);
  const error=order?.persistedSubscription?await A.subscriptions.persistence.fulfill(id,'arrival',el):order?.persistedPickup?await A.pickup.fulfill(id,'arrival',el):A.fulfillment.recordArrival(id,Number(el.dataset.version));
  A.toast(error||'Arrival recorded.');return;
 }
 if(action==='transition'&&el.dataset.target==='completed'){
  const order=A.operations.record(id);
  if(order?.type==='cake'&&order.fulfillment.method==='delivery'){
   const manilaNow=new Date(Date.now()+8*60*60*1000).toISOString().slice(0,19);
   confirmAction('Confirm handoff','Confirm that the cake was handed over and record when it happened.','confirm-transition',`data-id="${E(id)}" data-target="completed" data-version="${el.dataset.version}"`,`<label for="owner-handoff-time">Actual handoff time (Manila)</label><input id="owner-handoff-time" type="datetime-local" step="1" value="${manilaNow}" required><button type="button" class="btn" data-owner="refresh-handoff" hidden>Refresh order</button>`);
   return;
  }
 }
 if(action==='transition'){confirmAction(el.textContent,el.dataset.target==='preparing'?'Starting preparation records the reserved materials as used.':el.dataset.target==='completed'?'Confirm the order has been handed over.':'Confirm that this order is prepared and ready for handoff.','confirm-transition',`data-id="${E(id)}" data-target="${el.dataset.target}" data-version="${el.dataset.version}"`,A.fulfillment.productionReview(A.operations.record(id),el.dataset.target,'owner'));return;}
 if(action==='edit-allocation'){const o=A.operations.record(id);if(A.earnings.editable(o))confirmAction('Save Allocation','Review the preparing owners for each product line.','confirm-allocation',`data-id="${E(id)}" data-version="${el.dataset.version}"`,A.earnings.editor(o));return;}
 if(action==='confirm-allocation'){result(A.fulfillment.editAllocation(id,Number(el.dataset.version),O.formKey));return;}
 if(action==='revert-status'){const o=A.operations.record(id),target=A.fulfillment.previous(o);if(!target)return;confirmAction('Revert status','Return this order to '+target+'?'+(target==='confirmed'?' Consumed ingredients will be restored to reserved stock.':''),'confirm-revert',`data-id="${E(id)}" data-version="${el.dataset.version}"`);return;}
 if(action==='confirm-revert'){result(A.fulfillment.revert(id,Number(el.dataset.version),O.formKey));return;}
 if(action==='refresh-production'){result(A.fulfillment.refreshProduction(A.$('owner-dialog-body'),el,'owner'));return;}
 if(action==='refresh-handoff'){
  const confirm=A.$('owner-dialog-body').querySelector('[data-owner="confirm-transition"]');
  const order=A.operations.record(confirm.dataset.id);
  if(!order?.paid||order.type!=='cake'||order.fulfillment.method!=='delivery'||A.operations.status(order)!=='ready'){
   result('This order is no longer eligible for handoff confirmation. Close this dialog and review the order.');
   return;
  }
  A.operations.changed();
  confirm.dataset.version=A.staff.versions.get(order.id)||0;
  el.hidden=true;
  result('Order refreshed. Review the handoff time and confirm again.');
  return;
 }
 if(action==='confirm-transition'){
  const input=A.$('owner-handoff-time');
  if(input&&!input.reportValidity())return;
  const handoffAt=input?Date.parse(input.value+'+08:00'):undefined;
  const error=A.operations.find(id)?.persistedSubscription?await A.subscriptions.persistence.fulfill(id,el.dataset.target,el):A.operations.find(id)?.persistedPickup?await A.pickup.fulfill(id,el.dataset.target,el):
   A.fulfillment.transition(id,el.dataset.target,Number(el.dataset.version),O.formKey,handoffAt);
  if(error&&!input)A.fulfillment.productionConflict(A.$('owner-dialog-body'),el);
  if(error&&input&&Number(el.dataset.version)!==(A.staff.versions.get(id)||0)){
   A.$('owner-dialog-body').querySelector('[data-owner="refresh-handoff"]').hidden=false;
  }
  result(error);
  return;
 }
 if(action==='book'){A.deliveryTracking.book(id,Number(el.dataset.version));return;}

 if(action==='stock'){A.ownerInventory.openStock(id,el.dataset.type);return;}
 if(action==='cost'){A.ownerInventory.openCost(id);return;}
 if(action==='ingredient-remove'){A.ownerInventory.openRemove(id);return;}
 if(action==='ingredient-archive'||action==='ingredient-restore'){A.ownerInventory.openArchive(id,action==='ingredient-restore');return;}
 if(action==='recipe'){A.ownerInventory.openRecipe(Number(id),el.dataset.variant);return;}
 if(action==='add-bom'){A.$('owner-bom').insertAdjacentHTML('beforeend',A.ownerInventory.row());return;}
 if(action==='remove-bom'){el.closest('.owner-bom-row').remove();return;}
 if(action==='price'){O.open('Update selling price',V.form('price',V.field('price','New selling price (PHP)',A.variant(Number(id),el.dataset.variant).price,'number','required min="0.01" step="0.01"')+'<p>Existing purchases and quotations retain their saved prices.</p>',`data-id="${E(id)}" data-variant="${E(el.dataset.variant)}" data-version="${P.version}"`,'Confirm selling price'));return;}
 if(action==='pricing-settings'){A.ownerPricing.openRates();return;}
 if(action==='create-quotation'){A.ownerCakeUI.open(id);return;}
 if(action==='cancel-cake-modal'){A.closeModal();return;}
 if(action==='reject-request'){A.ownerCakeUI.openRejection(id,Number(el.dataset.version));return;}
 if(action==='production-copy'){A.cakes.openProductionCopy(id);return;}
 if(action==='retry-notification'){const q=A.cakes.state.quotations.find(q=>q.id===id);result(A.ownerCakes.notify(q),false);return;}
 if(action==='discard'){O.drafts.delete(O.draftKey(el.closest('form')));O.render();A.toast('Saved values restored.');return;}
 if(action==='block-date'){A.ownerScheduleUI.block();return;}
 if(action==='unblock'){O.open('Unblock date',`<div class="owner-unblock-dialog"><p>Allow new bookings for <strong>${V.date(el.dataset.date)}</strong>?</p><p class="muted">Capacity limits and booking rules will still apply.</p>${V.error()}<div class="owner-settings-actions">${V.button('cancel-cake-modal','Cancel')}${V.button('confirm-unblock','Unblock date',`data-date="${E(el.dataset.date)}"`,true)}</div></div>`);return;}
 if(action==='confirm-unblock'){result(O.saveError?'The change could not be saved.':await Q.block(el.dataset.date,'',true));return;}
 if(action==='calendar-mode')O.calendarMode=el.dataset.mode;
 if(action==='calendar-date'){O.date=el.dataset.date;O.drafts.delete('block::');}
 if(action==='calendar-today')O.date=A.schedule.today();
 if(action==='calendar-next'||action==='calendar-prev'){const delta=action==='calendar-next'?1:-1;if(O.calendarMode==='month'){const d=new Date(O.date.slice(0,7)+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+delta);O.date=d.toISOString().slice(0,10);}else O.date=A.schedule.add(O.date,delta*(O.calendarMode==='week'?7:1));}
 if(action.startsWith('calendar-'))O.render();
});
document.addEventListener('change',e=>{
 if(e.target.id==='mock-owner-mode'){O.mode=e.target.value;O.render();}
 if(e.target.id==='mock-owner-save')O.saveError=e.target.value==='error';
 if(e.target.id==='mock-owner-courier')A.deliveries.outcome=e.target.value;
 if(e.target.id==='mock-owner-notification')A.ownerCakes.notificationOutcome=e.target.value;
 if(e.target.hasAttribute('data-owner-date')&&A.schedule.valid(e.target.value)){O.date=e.target.value;O.render();}
});
document.addEventListener('input',e=>{const form=e.target.closest('[data-owner-form], [data-production-copy]');if(!form)return;O.capture(form);if(form.dataset.ownerForm==='quotation')A.ownerCakeUI.preview(form);});
document.addEventListener('submit',async e=>{
 const form=e.target,kind=form.dataset.ownerForm;if(!kind)return;e.preventDefault();if(!A.session.ownerAllowed())return;
 const data=new FormData(form),get=name=>String(data.get(name)||''),num=name=>get(name).trim()===''?NaN:Number(get(name));let error='';
 if(kind==='filter'){if(get('from')&&get('to')&&get('from')>get('to'))error='The end date must be on or after the start date.';else{O.filters={...Object.fromEntries(data),query:get('query'),type:get('type')||'all',from:get('from'),to:get('to'),sort:get('sort')};O.page=1;O.render();return;}}
 else if(Number(form.dataset.generation)!==A.session.generation)error='This session changed. Reopen the form.';
 else if(O.saveError)error='The change could not be saved. Your entries are retained; retry.';
 else if(I.databaseAccount&&['ingredient-add','ingredient-remove','ingredient-archive','ingredient-restore','stock','cost','recipe','price'].includes(kind)){
  if(form.dataset.saving)return;
  const id=form.dataset.id,key=form.dataset.operation,version=form.dataset.version;
  const details={name:get('name'),unit:get('unit'),threshold:num('threshold'),category:get('category')};
  const action=kind.startsWith('ingredient-')?kind.slice('ingredient-'.length):kind==='cost'?'edit':kind;
  const input=action==='add'?{...details,stock:num('stock'),totalCost:num('totalCost'),key}:
   action==='edit'?{...details,id,key,version}:['remove','archive','restore'].includes(action)?{id,key,version}:
   {id,key,version,type:form.dataset.type,quantity:num('quantity'),unit:get('unit'),totalCost:num('totalCost'),reason:get('reason'),notes:get('notes')};
  const submit=form.querySelector('button[type=submit]');
  form.dataset.saving='true';
  if(submit)submit.disabled=true;
  try{
   if(action==='recipe'||action==='price'){
    const G=A.productAdmin,product=A.products.find(p=>p.id===Number(id)),variant=A.variant(id,form.dataset.variant);
    const rows=[...form.querySelectorAll('.owner-bom-row')].map(row=>({id:row.querySelector('[data-bom-id]').value,quantity:Number(row.querySelector('[data-bom-quantity]').value)}));
    if(Number(version)!==P.version||!product||!variant)error='Pricing changed. Reopen the editor.';
    else if(action==='price'&&(!Number.isFinite(num('price'))||num('price')<=0))error='Enter a positive selling price.';
    else{
     const record=G.inventoryVariant(product.id,variant);
     if(action==='price')record.price=Math.round(num('price')*100)/100;
     else record.rows=rows;
     error=await I.saveRecipes(G.inventoryProduct(product),[record],key);
    }
   }else error=await I.save(action,input);
  }
  finally{delete form.dataset.saving;if(submit)submit.disabled=false;}
  if(form.dataset.generation!==String(A.session.generation)||!form.isConnected||A.$('owner-modal').hidden){
   if(!error&&A.session.operational())A.operations.changed();
   return;
  }
 }
 else if(kind==='stock'){
  const i=I.item(form.dataset.id);
  if(!i||Number(form.dataset.stock)!==i.stock||form.dataset.unit!==i.unit)error='Stock changed. Reopen the stock form.';
  else error=I.change({id:i.id,type:form.dataset.type,quantity:num('quantity'),unit:get('unit'),totalCost:num('totalCost'),reason:get('reason'),notes:get('notes'),key:form.dataset.operation});
 }
 else if(kind==='ingredient-add')error=I.add({category:get('category'),name:get('name'),unit:get('unit'),stock:num('stock'),totalCost:num('totalCost'),threshold:num('threshold'),key:form.dataset.operation});
 else if(kind==='cake-reject')error=A.ownerCakes.reject(form.dataset.id,Number(form.dataset.version),get('category'),get('notes'));
 else if(kind==='cost'){
  const item=I.item(form.dataset.id),name=get('name').trim(),unit=get('unit'),threshold=num('threshold');
  if(Number(form.dataset.version)!==P.version)error='Ingredient details changed. Reopen the form.';
  else if(!item||!name||name.length>120||!A.ownerInventory.units.some(([value])=>value===unit))error='Enter an ingredient name and select a valid unit.';
  else if(!Number.isFinite(threshold)||threshold<0)error='Enter a nonnegative reorder threshold.';
  else if(unit!==item.unit&&I.unitLocked(item.id))error='The unit is locked because this material is already in use.';
  else{Object.assign(item,{name,unit,threshold,category:get('category')||item.category});P.version++;}
 }
 else if(kind==='recipe')error=P.save({id:Number(form.dataset.id),variant:form.dataset.variant,version:Number(form.dataset.version),overhead:P.overheads.get(form.dataset.id+':'+form.dataset.variant)??null,rows:[...form.querySelectorAll('.owner-bom-row')].map(row=>({id:row.querySelector('[data-bom-id]').value,quantity:Number(row.querySelector('[data-bom-quantity]').value)}))});
 else if(kind==='price')error=P.setPrice(Number(form.dataset.id),form.dataset.variant,num('price'),Number(form.dataset.version));
 else if(['pricing-settings','cake-price-option','cake-price-time'].includes(kind)){
  if(form.dataset.saving)return;
  form.dataset.saving='true';
  try{error=await A.ownerPricing.save(form);}
  finally{delete form.dataset.saving;}
  if(!form.isConnected||Number(form.dataset.generation)!==A.session.generation)return;
 }
 else if(kind==='quotation')error=A.ownerCakes.issue(form.dataset.id,A.ownerCakeUI.input(form),Number(form.dataset.version),form.dataset.operation);
 else if(kind==='block'){const categories=['Bakery closure','Holiday','Maintenance','Staff availability','Other'];error=!categories.includes(get('category'))||!get('reason').trim()?'Choose a reason category and enter reason details.':await Q.block(get('date'),get('category')+': '+get('reason'));}
 else if(kind==='settings'){const input=Object.fromEntries(['standardUnits','standardVarieties','subscriptionUnits','maxPerWeek','maxPerDay'].map(key=>[key,num(key)]));for(const type of ['subscription','cake'])input[type]={value:num(type+'-value'),unit:get(type+'-unit'),cutoff:get(type+'-cutoff')};if(!form.elements.namedItem('subscriptionUnits')){input.subscriptionUnits=A.schedule.config.subscriptionUnits;}if(!form.elements.namedItem('subscription-value')){input.subscription=A.schedule.config.timing?.subscription||{value:A.schedule.config.leadDays,unit:'days',cutoff:String(A.schedule.config.cutoffHour).padStart(2,'0')+':00'};}error=await Q.save(input,Number(form.dataset.version));}
 else if(kind!=='filter')error='Unsupported action.';
 if(error){form.querySelector('.owner-error').textContent=error;return;}
 O.drafts.delete(O.draftKey(form));A.closeModal(true);
 if(kind==='quotation')location.hash='#/owner/cake-requests/'+encodeURIComponent(form.dataset.id);
 if(kind==='ingredient-remove')location.hash='#/owner/inventory';
 A.operations.changed();A.toast(kind==='ingredient-remove'?'Material removed.':'Changes saved.');
});
const reset=A.commerce.reset;const schedules=A.commerce.copy(A.subscriptions.schedules),cakeConfig=A.commerce.copy(A.cakeData.config);
A.commerce.reset=()=>{A.session.invalidate();reset();P.reset();Q.reset();A.deliveries.results.clear();A.deliveries.serial=0;A.ownerCakes.results.clear();A.ownerCakes.notificationAttempts=[];A.ownerCakes.alerts.clear();A.ownerCakes.notificationOutcome='success';A.subscriptions.schedules=A.commerce.copy(schedules);Object.assign(A.cakeData.config,A.commerce.copy(cakeConfig));Object.assign(O,{filters:blank(),page:1,status:'all',mode:'normal',saveError:false,date:A.schedule.today(),calendarType:'all',calendarStatus:'all'});O.filterCache.clear();};
})();

/* Owner inbox is independent of staff/customer read state. */
(() => {
const A=K406,O=A.owner,V=A.ownerUI,E=A.escape;
O.notificationReads=new Set();O.notificationFilter='all';O.notificationTimes=new Map();
O.notifications=()=>{
 const stored=A.notifications.account?.role==='admin';
 const events=stored?[...A.notifications.saved]:[],add=(id,type,message,path,at)=>{if(!O.notificationTimes.has(id))O.notificationTimes.set(id,at||Date.now());events.push({id,type,message,path,at:O.notificationTimes.get(id),read:O.notificationReads.has(id)});};
 for(const o of A.operations.list()){
  if(stored&&o.type!=='cake')continue;
  const status=A.operations.status(o);
  const reservation=o.materialReservationIssue;
  if(reservation?.kind==='shortage'&&status==='confirmed')add('shortage:'+o.id+':'+reservation.at,'inventory',o.id+' · '+reservation.message,'orders/'+encodeURIComponent(o.id),reservation.at);
  if(status==='payment-resolution')add('payment:'+o.id,'payments',o.id+' · Payment requires review.','orders/'+o.id,o.created);
  else if(o.paid&&!['completed','cancelled'].includes(status))add('order:'+o.id+':'+status,'orders',o.id+' · '+status.replaceAll('-',' '),'orders/'+encodeURIComponent(o.id),o.created);
 }
 if(!stored)for(const i of A.inventory.items)if(!i.archivedAt&&A.inventory.available(i.id)<=i.threshold)add('stock:'+i.id,'inventory',i.name+' · '+A.inventory.available(i.id)+' '+i.unit+' available.','inventory/'+encodeURIComponent(i.id));
 for(const r of A.cakes.state.requests)if(r.status==='pending_review')add('cake:'+r.id+':'+r.status,'cakes',r.id+' · Cake request awaiting review.','cake-requests/'+encodeURIComponent(r.id),r.created);
 for(const alert of A.ownerCakes.alerts.values())if(!alert.resolved_at)add('quote:'+alert.id+':'+alert.attempt_id,'cakes','Quotation notification failed · '+alert.related_entity_id,alert.path,alert.updated_at);
 return events.sort((a,b)=>b.at-a.at);
};
A.ownerPages.notifications=()=>{
 const all=O.notifications(),events=all.filter(n=>O.notificationFilter==='all'||O.notificationFilter==='unread'&&!n.read||n.type===O.notificationFilter),unread=all.filter(n=>!n.read).length;
 const feedback=A.notifications.feedback(V.button('retry-notifications','Retry'));
 const readIcon='<span class="staff-notification-read" role="img" aria-label="Read"><svg width="20" height="14" viewBox="0 0 24 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m2 8 4 4L16 2M11 10l2 2L23 2"/></svg></span>';
 return V.intro('Notifications','Orders, payments, inventory, and cake updates for your bakery.')+`<div class="staff-notification-toolbar"><div class="staff-notification-controls">${V.select('notificationFilter','Filter',[['all','All'],['unread','Unread'],['orders','Orders'],['payments','Payments'],['inventory','Inventory'],['cakes','Custom cakes'],['delivery','Notification delivery']],O.notificationFilter)}${V.button('read-all','Mark all as read',unread?'':'disabled',true)}</div></div>`+V.panel('Operational updates',`<div class="staff-notification-list">${feedback}${events.map(n=>`<article class="staff-notification ${n.read?'':'unread'}"><div class="staff-notification-copy"><strong>${E(n.message)}</strong><div class="staff-notification-meta"><time datetime="${new Date(n.at).toISOString()}">${V.stamp(n.at)}</time>${n.read?readIcon:''}</div></div><div class="staff-notification-actions">${n.path?V.button('notification-view','View details',`data-id="${E(n.id)}"`,true):!n.read?V.button('notification-view','Mark as read',`data-id="${E(n.id)}"`,true):''}${n.retry_id?V.button('retry-outbox','Retry delivery',`data-id="${E(n.retry_id)}"`,true):''}</div></article>`).join('')||(feedback?'':'<p class="muted">No matching updates.</p>')}</div>`,`<span class="staff-unread-count" aria-live="polite">${unread} unread</span>`);
};
V.workspace=(links,current,body)=>{
 const navigation=links.map(([path,title])=>`<a href="#/owner${path?'/'+E(path):''}" ${current===path?'aria-current="page"':''}>${E(title)}</a>`).join('');
 return `<div class="staff-layout"><aside class="staff-nav"><strong>${E(A.session.owner.first_name+' '+A.session.owner.last_name)}</strong><p class="muted">Bakery Owner</p><nav aria-label="Owner workspace">${navigation}</nav></aside><div class="staff-main">${body}</div></div>`;
};
})();
