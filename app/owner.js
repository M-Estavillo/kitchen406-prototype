/* Owner workspace lifecycle and delegated controls. */
(() => {
const A=K406,V=A.ownerUI,E=A.escape,I=A.inventory,P=A.pricing,Q=A.capacity;
const links=[['','Dashboard'],['orders','Orders'],['payments','Payments & Issues'],['deliveries','Deliveries'],['inventory','Inventory'],['recipes','Recipes & Costing'],['cake-requests','Custom Cake Requests'],['subscriptions','Subscriptions'],['capacity','Capacity Calendar'],['scheduling','Blocked Dates & Scheduling']].map(([p,l])=>['owner'+(p?'/'+p:''),l]);
const blank=()=>({query:'',type:'all',from:'',to:'',sort:'newest'});
const O=A.owner={parts:[],page:1,filters:blank(),status:'all',date:A.schedule.today(),calendarMode:'week',mode:'normal',saveError:false,generation:0,formKey:null,filterCache:new Map(),drafts:new Map()};
O.draftKey=form=>[form.dataset.ownerForm||'production-copy',form.dataset.id||form.dataset.productionCopy||'',form.dataset.variant||''].join(':');
O.capture=form=>{if(!form||['filter','stock','recipe','p7-password','p7-email','p7-otp','p7-staff'].includes(form.dataset.ownerForm))return;O.drafts.set(O.draftKey(form),{version:form.dataset.version,pricingVersion:form.dataset.pricingVersion,values:[...new FormData(form)],variants:[...form.querySelectorAll('.p7-variant-row')].map(row=>Object.fromEntries(['id','label','price','status'].map(key=>[key,row.querySelector('[name=variant-'+key+']').value])))});};
O.restore=form=>{const draft=O.drafts.get(O.draftKey(form));if(!draft)return;const stale=draft.version!==form.dataset.version||draft.pricingVersion!==form.dataset.pricingVersion;if(stale&&draft.version!==undefined)form.dataset.version=draft.version;if(draft.pricingVersion!==undefined)form.dataset.pricingVersion=draft.pricingVersion;for(const [name,value] of draft.values){const control=form.elements.namedItem(name);if(control&&typeof value==='string'&&control.type!=='checkbox'&&!name.startsWith('variant-'))control.value=value;}if(draft.variants?.length&&form.querySelector('#p7-variants'))form.querySelector('#p7-variants').innerHTML=draft.variants.map(A.ownerCatalog.variantRow).join('');if(form.querySelector('[data-p7-preview]'))form.querySelector('[data-p7-preview]').src=form.elements.image.value;form.dataset.dirty='true';form.insertAdjacentHTML('afterbegin',`<p class="staff-note">${stale?'Saved data changed while you were editing. Your draft is retained; discard it to reload current values.':'Your unsaved draft has been restored.'}</p>`);};
O.confirmDismiss=()=>{const form=A.$('owner-dialog-body')?.querySelector('form');if(form?.dataset.dirty!=='true')return true;if(!A.$('owner-dismiss-warning'))form.insertAdjacentHTML('beforebegin',`<div id="owner-dismiss-warning" class="staff-note" role="alert"><p>Discard these unsaved changes?</p>${V.button('discard-modal','Discard changes')}${V.button('keep-editing','Keep editing')}</div>`);A.$('owner-dismiss-warning').querySelector('button').focus();return false;};
O.show=parts=>{const previous=O.parts[1]||'',next=parts[1]||'';if(previous!==next){O.filterCache.set(previous,{filters:{...O.filters},page:O.page,status:O.status});const cached=O.filterCache.get(next);O.filters=cached?.filters||blank();O.page=cached?.page||1;O.status=cached?.status||'all';}O.parts=parts.map(p=>{try{return decodeURIComponent(p);}catch{return p;}});O.generation++;O.render();};
O.open=(title,body)=>{O.formKey=crypto.randomUUID();A.$('owner-dialog-title').textContent=title;A.$('owner-dialog-body').innerHTML=body;const form=A.$('owner-dialog-body').querySelector('form');if(form){form.dataset.generation=A.session.generation;form.dataset.operation=O.formKey;O.restore(form);}A.openModal('owner-modal');};
O.render=()=>{
 if(A.route!=='owner')return;const root=A.$('owner-view');if(!root)return;
 if(!A.session.ownerAllowed()){root.innerHTML=V.intro('Owner access required','Sign in with an active owner account.')+V.panel('Restricted workspace','<p>Owner preview access is available through the State Inspector.</p><a class="btn" href="#/sign-in">Sign in</a> <a class="btn" href="#/shop">Back to shop</a>');return;}
 const page=O.parts[1]||'',pages=A.ownerPages;let render=({'':pages.dashboard,orders:O.parts[2]?pages.detail:pages.orders,payments:pages.payments,deliveries:pages.deliveries,inventory:pages.inventory,recipes:pages.recipes,'cake-requests':O.parts[3]==='quotation'?pages.quotation:pages.cakes,subscriptions:pages.subscriptions,capacity:pages.capacity,scheduling:pages.scheduling})[page];
 render ||= A.phase7?.pages[page];
 const body=O.mode==='loading'?V.panel('Loading','<p role="status">Loading owner records…</p>'):O.mode==='error'?V.panel('Unable to load','<p>Records could not be loaded.</p>',V.button('retry','Retry')):O.mode==='empty'?V.panel('No records','<p>No operational records in this preview state.</p>',V.button('retry','Restore records')):render?render():V.panel('Page not found','<p>This owner page does not exist.</p>',V.link('','Dashboard'));
 root.innerHTML=A.ui.workspace([...links.map(([p,l])=>[p,l,'Operations']),...(A.phase7?.links||[]).map(([p,l],i)=>['owner/'+p,l,i<4?'Catalog':'Administration'])],'owner'+(page?'/'+page:''),body,'Owner workspace');
 if(window.innerWidth<=760){const active=root.querySelector('.staff-nav [aria-current="page"]');if(active)active.parentElement.scrollLeft=active.offsetLeft-active.parentElement.offsetLeft;}
 root.querySelectorAll('form[data-owner-form]').forEach(form=>{form.dataset.generation=A.session.generation;form.dataset.operation=crypto.randomUUID();O.restore(form);});
 const quotation=root.querySelector('[data-owner-form="quotation"]');if(quotation)A.ownerCakeUI.preview(quotation);
};
function confirmAction(title,body,action,attrs){O.open(title,`<p>${E(body)}</p>${V.error()}${V.button(action,'Confirm',attrs,true)}`);}
function result(error,close=true){if(error){const node=document.querySelector('#owner-modal:not([hidden]) .owner-error');if(node)node.textContent=error;else A.toast(error);return false;}if(close)A.closeModal(true);A.operations.changed();A.toast('Changes saved.');return true;}
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-owner]');if(!el||el.disabled)return;const action=el.dataset.owner,id=el.dataset.id;
 if(action==='enter'){A.session.enter();return;}if(action==='customer'){A.session.leave();return;}if(action==='signout'){A.session.signout();return;}
 if(!A.session.ownerAllowed())return;
 if(action==='discard-modal'){const form=A.$('owner-dialog-body').querySelector('form');if(form)O.drafts.delete(O.draftKey(form));A.closeModal(true);return;}
 if(action==='keep-editing'){A.$('owner-dismiss-warning')?.remove();A.$('owner-dialog-body').querySelector('input,textarea,select')?.focus();return;}
 if(action==='retry'){O.mode='normal';O.render();return;}
 if(action==='previous'||action==='next'){O.page+=action==='next'?1:-1;O.render();return;}
 if(action==='clear-filters'){O.filters=blank();O.status='all';O.page=1;O.render();return;}
 if(action==='status'){O.status=el.dataset.status;O.page=1;O.render();return;}
 if(action==='transition'){confirmAction(el.textContent,el.dataset.target==='preparing'?'Starting preparation records the reserved materials as used.':el.dataset.target==='completed'?'Confirm the order has been handed over.':'Confirm that this order is prepared and ready for handoff.','confirm-transition',`data-id="${E(id)}" data-target="${el.dataset.target}" data-version="${el.dataset.version}"`);return;}
 if(action==='confirm-transition'){if(O.saveError){result('The update could not be saved. Retry.');return;}result(A.fulfillment.transition(id,el.dataset.target,Number(el.dataset.version),O.formKey));return;}
 if(action==='book'){confirmAction('Book courier',id+' · Confirm the checkout destination and fee shown in this order.','confirm-book',`data-id="${E(id)}" data-version="${el.dataset.version}"`);return;}
 if(action==='confirm-book'){result(O.saveError?'Booking could not be saved. Retry.':A.deliveries.book(id,O.formKey,Number(el.dataset.version)));return;}
 if(action==='refresh-delivery'){result(A.deliveries.refresh(id),false);return;}
 if(action==='stock'){A.ownerInventory.openStock(id,el.dataset.type);return;}
 if(action==='cost'){A.ownerInventory.openCost(id);return;}
 if(action==='recipe'){A.ownerInventory.openRecipe(Number(id),el.dataset.variant);return;}
 if(action==='add-bom'){A.$('owner-bom').insertAdjacentHTML('beforeend',A.ownerInventory.row());const form=el.closest('form');if(form)form.dataset.dirty='true';return;}
 if(action==='remove-bom'){const form=el.closest('form');el.closest('.owner-bom-row').remove();if(form)form.dataset.dirty='true';return;}
 if(action==='price'){O.open('Update selling price',V.form('price',V.field('price','New selling price (PHP)',A.variant(Number(id),el.dataset.variant).price,'number','required min="0.01" step="0.01"')+'<p>Existing purchases and quotations retain their saved prices.</p>',`data-id="${E(id)}" data-variant="${E(el.dataset.variant)}" data-version="${P.version}"`,'Confirm selling price'));return;}
 if(action==='pricing-settings'){O.open('Costing settings',V.form('pricing-settings',V.field('markup','Markup (%)',P.markup,'number','required min="0" step="0.01"')+V.field('overhead','Default utility overhead (PHP)',P.overhead,'number','required min="0" step="0.01"'),`data-version="${P.version}"`));return;}
 if(action==='reject-request'){confirmAction('Reject cake request',id+' · This will reject the selected request and its open offers.','confirm-reject',`data-id="${E(id)}" data-version="${el.dataset.version}"`);return;}
 if(action==='confirm-reject'){result(O.saveError?'The request could not be saved.':A.ownerCakes.reject(id,Number(el.dataset.version)));return;}
 if(action==='production-copy'){A.cakes.openProductionCopy(id);return;}
 if(action==='retry-notification'){const q=A.cakes.state.quotations.find(q=>q.id===id);result(A.ownerCakes.notify(q),false);return;}
 if(action==='discard'){O.drafts.delete(O.draftKey(el.closest('form')));O.render();A.toast('Saved values restored.');return;}
 if(action==='unblock'){result(O.saveError?'The change could not be saved.':Q.block(el.dataset.date,'',true),false);return;}
 if(action==='schedule'){A.ownerScheduleUI.open(id);return;}
 if(action==='calendar-mode')O.calendarMode=el.dataset.mode;
 if(action==='calendar-date')O.date=el.dataset.date;
 if(action==='calendar-today')O.date=A.schedule.today();
 if(action==='calendar-next'||action==='calendar-prev'){const delta=action==='calendar-next'?1:-1;if(O.calendarMode==='month'){const d=new Date(O.date.slice(0,7)+'-01T00:00:00Z');d.setUTCMonth(d.getUTCMonth()+delta);O.date=d.toISOString().slice(0,10);}else O.date=A.schedule.add(O.date,delta*(O.calendarMode==='week'?7:1));}
 if(action.startsWith('calendar-'))O.render();
});
document.addEventListener('change',e=>{
 if(e.target.id==='owner-overhead-mode'){const input=e.target.form.elements.overhead;input.disabled=e.target.value==='default';input.required=!input.disabled;}
 if(e.target.id==='mock-owner-mode'){O.mode=e.target.value;O.render();}
 if(e.target.id==='mock-owner-save')O.saveError=e.target.value==='error';
 if(e.target.id==='mock-owner-courier')A.deliveries.outcome=e.target.value;
 if(e.target.id==='mock-owner-notification')A.ownerCakes.notificationOutcome=e.target.value;
 if(e.target.hasAttribute('data-owner-date')&&A.schedule.valid(e.target.value)){O.date=e.target.value;O.render();}
});
document.addEventListener('input',e=>{const form=e.target.closest('[data-owner-form], [data-production-copy]');if(!form)return;form.dataset.dirty='true';O.capture(form);if(form.dataset.ownerForm==='quotation')A.ownerCakeUI.preview(form);if(form.dataset.ownerForm==='stock'){const i=I.item(form.dataset.id),quantity=Number(form.elements.quantity.value)*(['kg','l'].includes(form.elements.unit.value)?1000:1),delta=form.dataset.type==='restock'?quantity:quantity-i.stock;A.$('owner-stock-preview').textContent=`Change: ${delta>0?'+':''}${Math.round(delta*1000)/1000} ${i.unit}. New physical stock: ${Math.round((i.stock+delta)*1000)/1000} ${i.unit}.`;}});
document.addEventListener('submit',e=>{
 const form=e.target,kind=form.dataset.ownerForm;if(!kind)return;e.preventDefault();if(!A.session.ownerAllowed())return;
 if(kind.startsWith('p7-')){A.phase7.submit(form);return;}
 const data=new FormData(form),get=name=>String(data.get(name)||''),num=name=>get(name).trim()===''?NaN:Number(get(name));let error='';
 if(kind==='filter'){if(get('from')&&get('to')&&get('from')>get('to'))error='The end date must be on or after the start date.';else{O.filters={...Object.fromEntries(data),query:get('query'),type:get('type')||'all',from:get('from'),to:get('to'),sort:get('sort')};O.page=1;O.render();return;}}
 else if(Number(form.dataset.generation)!==A.session.generation)error='This session changed. Reopen the form.';
 else if(O.saveError)error='The change could not be saved. Your entries are retained; retry.';
 else if(kind==='stock'){const i=I.item(form.dataset.id);if(!i||Number(form.dataset.stock)!==i.stock)error='Stock changed. Reopen the stock form.';else error=I.change({id:i.id,type:form.dataset.type,quantity:num('quantity')*(['kg','l'].includes(get('unit'))?1000:1),reason:get('reason'),notes:get('notes'),key:form.dataset.operation});}
 else if(kind==='cost'){const i=I.item(form.dataset.id);if(Number(form.dataset.version)!==P.version)error='Costs changed. Reopen the form.';else if(!i||![num('cost'),num('threshold')].every(n=>Number.isFinite(n)&&n>=0))error='Enter nonnegative cost and threshold values.';else{Object.assign(i,{cost:num('cost'),threshold:num('threshold')});P.version++;}}
 else if(kind==='recipe')error=P.save({id:Number(form.dataset.id),variant:form.dataset.variant,version:Number(form.dataset.version),overhead:get('overhead-mode')==='default'?null:num('overhead'),rows:[...form.querySelectorAll('.owner-bom-row')].map(row=>({id:row.querySelector('[data-bom-id]').value,quantity:Number(row.querySelector('[data-bom-quantity]').value)}))});
 else if(kind==='price')error=P.setPrice(Number(form.dataset.id),form.dataset.variant,num('price'),Number(form.dataset.version));
 else if(kind==='pricing-settings'){if(Number(form.dataset.version)!==P.version)error='Settings changed. Reopen the form.';else if(![num('markup'),num('overhead')].every(n=>Number.isFinite(n)&&n>=0))error='Enter nonnegative markup and overhead.';else{P.markup=num('markup');P.overhead=num('overhead');P.version++;}}
 else if(kind==='quotation')error=A.ownerCakes.issue(form.dataset.id,{date:get('date'),window:get('window'),method:get('method'),complexity:Math.round(num('complexity')*100),fee:get('method')==='pickup'?0:Math.round(num('fee')*100),expiry:Date.parse(get('expiry')+':00+08:00'),notes:get('notes')},Number(form.dataset.version),form.dataset.operation);
 else if(kind==='block')error=Q.block(get('date'),get('reason'));
 else if(kind==='settings'){const input=Object.fromEntries(['standardUnits','standardVarieties','subscriptionUnits','maxPerWeek','maxPerDay'].map(key=>[key,num(key)]));for(const type of ['standard','subscription','cake'])input[type]={value:num(type+'-value'),unit:get(type+'-unit'),cutoff:get(type+'-cutoff')};error=Q.save(input,Number(form.dataset.version));}
 else if(kind==='schedule')error=Q.saveSchedule({id:form.dataset.id,label:get('label'),product_id:get('product_id')?num('product_id'):null,preparation_day:num('preparation_day'),day:num('day'),status:get('status')},Number(form.dataset.version));
 else if(kind!=='filter')error='Unsupported action.';
 if(error){form.querySelector('.owner-error').textContent=error;return;}
 O.drafts.delete(O.draftKey(form));A.closeModal(true);if(kind==='quotation')location.hash='#/owner/cake-requests/'+encodeURIComponent(form.dataset.id);A.operations.changed();A.toast('Changes saved.');
});
const reset=A.commerce.reset;const schedules=A.commerce.copy(A.subscriptions.schedules),cakeConfig=A.commerce.copy(A.cakeData.config);
A.commerce.reset=()=>{A.session.invalidate();reset();A.phase7?.reset();P.reset();Q.reset();A.deliveries.results.clear();A.deliveries.serial=0;A.ownerCakes.results.clear();A.ownerCakes.notificationAttempts=[];A.ownerCakes.alerts.clear();A.ownerCakes.notificationOutcome='success';A.subscriptions.schedules=A.commerce.copy(schedules);Object.assign(A.cakeData.config,A.commerce.copy(cakeConfig));Object.assign(O,{filters:blank(),page:1,status:'all',mode:'normal',saveError:false,date:A.schedule.today()});O.filterCache.clear();};
})();
