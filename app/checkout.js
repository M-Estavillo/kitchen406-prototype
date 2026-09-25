(() => {
const A=K406,C=A.commerce,S=C.state,M=C.mock,U=C.ui,E=A.escape;
const F=C.checkout={month:9,editing:null,form:null,message:''};
F.cart=()=>U.page('Your bag','Review your items before choosing fulfillment details.',S.cart.length&&M.page!=='empty'?U.columns(
 U.panel('Items in your bag',U.items(S.cart,true))+(S.removed?U.alert('Item removed. Your other selections are saved.')+U.button('undo','Undo removal'):''),
 U.summary()+(!C.cartValid()?U.alert('Resolve unavailable items or quantity limits before continuing.',true):'')+U.button('checkout','Continue to checkout',!C.cartValid())+U.link('shop','Continue shopping')):U.empty('Your bag is empty','Browse the shop and add your favorite bakes.')+(S.removed?U.button('undo','Undo removal'):''),'cart');
F.calendar=()=>{
 if(M.calendar!=='normal')return U.alert(M.calendar==='loading'?'Loading available dates…':'We could not load the calendar.',M.calendar==='error')+U.button('calendar-retry','Retry calendar');
 const first=new Date(2026,F.month,1),days=new Date(2026,F.month+1,0).getDate();
 return `<div class="calendar-heading">${U.button('month-prev','‹',F.month===9,'aria-label="Previous month"')}<h3>${first.toLocaleDateString('en-PH',{month:'long',year:'numeric'})}</h3>${U.button('month-next','›',F.month===11,'aria-label="Next month"')}</div><div class="calendar-grid">${['Su','Mo','Tu','We','Th','Fr','Sa'].map(x=>`<span class="muted">${x}</span>`).join('')}${'<span></span>'.repeat(first.getDay())}${Array.from({length:days},(_,i)=>{const date=`2026-${String(F.month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`,reason=C.dateReason(date);return `<button type="button" data-date="${date}" ${reason?'disabled':''} aria-label="${U.date(date)}${reason?' '+reason:''}" aria-pressed="${S.draft.date===date}">${i+1}<small>${reason||'Open'}</small></button>`;}).join('')}</div>`;
};
F.fulfillment=()=>U.page('Choose your fulfillment','Pick a fulfillment method and an available date for your order.',U.columns(
 U.panel('How would you like to receive your order?',`<div class="fulfillment-choices">${[['pickup','storefront','Bakery pickup','Collect directly from Kitchen406. Free.'],['delivery','local_shipping','Courier delivery','Delivery fee calculated after address selection.']].map(([v,icon,title,desc])=>`<button class="fulfillment-choice" data-method="${v}" aria-pressed="${S.draft.method===v}"><span class="material-symbols-outlined">${icon}</span><strong>${title}</strong><span>${desc}</span></button>`).join('')}</div>`)+
 U.panel('Select your fulfillment date',F.calendar())+
 (F.message?U.alert(F.message,true):'')+(M.validation!=='normal'?U.alert({checking:'Checking availability…',conflict:'This date is no longer available. Choose another date.',error:'We could not verify fulfillment. Your selections are saved.'}[M.validation],true)+U.button('fulfillment-retry','Retry availability'):''),U.summary(null,false)+U.button('fulfillment-next',S.draft.method==='pickup'?'Continue to review':'Continue to delivery details',!C.fulfillmentReady())+U.link('cart','Back to bag')),'checkout/fulfillment');
F.mapPanel=editable=>`<div class="address-map-section">${editable?'<div class="field"><p id="address-search-label">Search for your address</p><div id="address-place-search" aria-labelledby="address-search-label"></div></div>':''}<div id="address-map" class="address-google-map" aria-label="Delivery location map"></div><p id="address-map-status" class="muted" role="status">Loading map...</p></div>`;
F.addressForm=()=>{
 const a=F.form||{};
 return U.panel(F.editing?'Edit delivery address':'Add a delivery address',`<form id="delivery-address-form" class="auth-form">${F.mapPanel(true)}${U.field('label','Save address as',a.label)}${U.field('add_line_1','Address line 1',a.add_line_1)}${U.field('add_line_2','Address line 2 (unit, floor, building)',a.add_line_2,false)}<div class="name-row">${U.field('city','City',a.city)}${U.field('postal_code','Postal code',a.postal_code)}</div>${U.field('landmark','Landmark',a.landmark,false)}<label class="address-default"><input type="checkbox" name="is_default" ${a.is_default?'checked':''}> Set as default address</label><p class="field-error" id="address-error" role="alert"></p><div class="commerce-actions">${U.button('address-cancel','Cancel')}<button class="btn primary" type="submit" ${!F.mapBusy&&C.addressValid(a)?'':'disabled'}>Save address</button></div></form>`);
};
F.address=()=>{
 const a=C.address(),d=S.draft;
 return U.page('Delivery details','Choose a saved address or add a new one.',U.columns(
 d.method==='pickup'?U.panel('Pick up your order',U.fulfillment())+U.button('switch-delivery','Switch back to delivery'):
 U.panel('Choose a delivery address',S.addresses.length?S.addresses.map(addr=>`<div class="address-choice ${addr.address_id===d.addressId?'selected':''}"><label><input type="radio" name="delivery-address" value="${E(addr.address_id)}" ${addr.address_id===d.addressId?'checked':''}><strong>${E(addr.label)}</strong>${U.address(addr)}</label>${U.button('address-edit','Edit',false,`data-id="${E(addr.address_id)}"`)}</div>`).join(''):'<p>No saved addresses yet. Add an address to continue.</p>',U.button('address-add','Add new address'))+
 (F.form?F.addressForm():'')+
 (a&&!F.form?U.panel('Your delivery location',F.mapPanel(false)+U.alert(C.deliveryRoute.message(),['outside','unreachable','error','unconfigured'].includes(C.deliveryRoute.status()))+(['error','unreachable'].includes(C.deliveryRoute.status())?U.button('service-retry','Retry distance check'):'')):'') ,U.summary()+U.button('address-next','Continue to review',!C.ready()||!!F.form)+U.link('checkout/fulfillment','Back to fulfillment')),'checkout/address');
};
F.review=()=>U.page('Review your order','Check your items and fulfillment details before proceeding to payment.',U.columns(
 U.panel('Order items',U.items(S.cart),U.link('cart','Edit cart'))+U.panel('Fulfillment details',U.fulfillment(null,false),U.link('checkout/fulfillment','Edit'))+
 (S.draft.method==='delivery'?U.panel('Delivery address',U.address(C.address()),U.link('checkout/address','Edit address')):'')+
 U.panel('Payment method','<p><span class="material-symbols-outlined">qr_code_2</span> QR Ph · Bank / e-wallet transfer</p>'),
 U.summary()+(M.review!=='normal'?U.alert({stock:'Requested quantity is no longer available. Edit your bag.',capacity:'Selected date is full. Choose another fulfillment date.',error:'We could not verify this order. Your selections are saved.',checking:'Checking stock and schedule…'}[M.review],true)+U.button('review-retry','Retry verification'):'')+(M.price==='updated'?U.alert('Demo price update: first item increases by ₱20 per unit. Review and accept the new total before payment.')+U.button('accept-price','Accept updated price'):'')+U.button('pay','Proceed to payment',!C.ready()||M.review!=='normal'||M.price==='updated')+U.link(S.draft.method==='pickup'?'checkout/fulfillment':'checkout/address','Back to '+(S.draft.method==='pickup'?'fulfillment':'delivery details'))),'checkout/review');
F.action=(action,el)=>{
 const index=Number(el.dataset.index),item=S.cart[index];
 if(['increase','decrease','remove','undo','switch-pickup','switch-delivery','accept-price'].includes(action)&&!C.change())return;
 if(action==='increase'&&item)item.quantity=Math.min(item.max,item.quantity+1);
 if(action==='decrease'&&item){item.quantity=Math.max(1,item.quantity-1);if(S.cart.every(i=>i.quantity<=i.max))M.stock='normal';}
 if(action==='remove'&&item){S.removed={item:C.copy(item),index};S.cart.splice(index,1);if(S.cart.every(i=>i.available&&i.quantity<=i.max))M.stock='normal';}
 if(action==='undo'&&S.removed){const old=S.cart.find(i=>i.key===S.removed.item.key);if(old)old.quantity=Math.min(old.max,old.quantity+S.removed.item.quantity);else S.cart.splice(S.removed.index,0,S.removed.item);S.removed=null;}
 if(action==='checkout'){if(C.cartValid())location.hash='#/checkout/fulfillment';}
 if(action==='month-prev')F.month=Math.max(9,F.month-1);
 if(action==='month-next')F.month=Math.min(11,F.month+1);
 if(action==='calendar-retry')M.calendar='normal';
 if(action==='fulfillment-retry')M.validation='normal';
 if(action==='fulfillment-next'){
  F.message=!S.draft.method?'Please select a fulfillment method.':!C.dateValid()?'Please select an available fulfillment date.':'';
  if(C.fulfillmentReady())location.hash=S.draft.method==='pickup'?'#/checkout/review':'#/checkout/address';
 }
 if(action==='switch-pickup'){S.draft.method='pickup';F.form=null;location.hash='#/checkout/review';}
 if(action==='switch-delivery'){S.draft.method='delivery';}
 if(action==='address-add'){F.editing=null;F.mapBusy=false;F.form={is_default:S.addresses.length===0};}
 if(action==='address-edit'){F.editing=el.dataset.id;F.mapBusy=false;F.form=C.copy(S.addresses.find(a=>a.address_id===F.editing));}
 if(action==='address-cancel'){F.form=null;F.editing=null;}
 if(action==='service-retry')void C.deliveryRoute.check(true);
 if(action==='quote-retry')S.draft.quote='ok';
 if(action==='address-next'&&C.ready()&&!F.form)location.hash='#/checkout/review';
 if(action==='review-retry')M.review='normal';
 if(action==='accept-price'&&S.cart[0]){S.cart[0].price+=20;M.price='normal';A.toast('Updated demo price accepted.');}
 if(action==='pay'){const order=C.createOrder();if(order)location.hash='#/payment/'+order.id;}
 C.sync();C.render();A.inspector();
};
document.addEventListener('submit',e=>{
 if(e.target.id!=='delivery-address-form')return;e.preventDefault();
 const data=Object.fromEntries(new FormData(e.target));Object.keys(data).forEach(k=>data[k]=data[k].trim());
 Object.assign(data,{latitude:F.form?.latitude,longitude:F.form?.longitude,is_default:e.target.elements.is_default.checked});
 if(F.mapBusy||!C.addressValid(data)){A.$('address-error').textContent='Select your location on the map and complete all required address fields.';return;}
 if(!C.change())return;
 const old=S.addresses.find(a=>a.address_id===F.editing),now=new Date().toISOString();
 Object.assign(data,{address_id:F.editing||'address-'+Date.now(),customer_id:old?.customer_id||'preview-customer',created_at:old?.created_at||now,updated_at:now,status:'active',add_line_2:data.add_line_2||null,landmark:data.landmark||null});
 if(data.is_default)S.addresses.forEach(a=>{if(a.is_default){a.is_default=false;a.updated_at=now;}});
 const i=S.addresses.findIndex(a=>a.address_id===data.address_id);if(i>=0)S.addresses[i]=data;else S.addresses.push(data);
 S.draft.addressId=data.address_id;S.draft.quote='ok';F.form=null;F.editing=null;C.render();
});
document.addEventListener('input',e=>{
 const form=e.target.closest('#delivery-address-form');
 if(form&&F.form&&e.target.name){F.form[e.target.name]=e.target.type==='checkbox'?e.target.checked:e.target.value;form.querySelector('[type=submit]').disabled=F.mapBusy||!C.addressValid(F.form);}
});
document.addEventListener('change',e=>{
 if(e.target.name==='delivery-address'){if(!C.change())return;S.draft.addressId=e.target.value;S.draft.quote='ok';C.render();}

});
})();
