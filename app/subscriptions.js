(() => {
const A=K406,B=A.subscriptions,C=A.commerce,U=C.ui,V=B.ui,E=A.escape,S=B.state,D=A.schedule;
B.deliveryRoute=C.createDeliveryRoute({address:B.address,draft:()=>S.draft,refresh:()=>{if(B.active()&&A.auth==='signedin'&&!B.addressUI.form)B.render();}});
const purchase=()=>S.purchases.find(p=>p.id===B.parts[2]);
const record=()=>{const r=S.records.find(r=>r.id===B.parts[1]);return r?B.sync(r):null;};
const count=r=>r.deliveries.filter(d=>d.status==='fulfilled').length;
B.catalog=()=>{
 const mode=B.mock.catalog,products=A.products.filter(p=>p.subscription&&(!B.category||B.category==='all'||p.category===B.category));
 const cards=products.map(p=>{const availability=B.offering(p.id),unit=p.variants[0].price;return `<article class="subscription-card"><img src="${E(p.image)}" alt="${E(p.name)}"><div class="subscription-card-content">${V.badge(availability==='full'?'Subscription slots full':availability==='unavailable'?'Temporarily unavailable':'Available for subscription',availability!=='available')}<h2>${E(p.name)}</h2><p class="muted">${E(p.description)}</p><p class="muted">${E(p.variant)}</p><div class="subscription-card-price"><span>${C.money(unit)} per delivery</span><strong>${C.money(unit*4)}</strong><p class="muted">Product subtotal for 4 deliveries.<br>Delivery fees calculated during setup.</p></div>${V.button('begin',availability==='available'?'Set Up Subscription →':availability==='full'?'Subscription Slots Full':'Temporarily Unavailable',availability!=='available',`data-id="${p.id}"`,true)}${U.link('product/'+p.id,'Buy Once in Shop →')}</div></article>`;}).join('');
 const faqs=[['Can I buy these products once?','Yes. Buy Once uses the regular cart and standard checkout. Subscription enrollment is a separate four-delivery prepaid commitment.'],['Does a subscription renew automatically?','No. After four deliveries, you can choose to enroll in a new subscription at current prices and availability.'],['What do I pay upfront?','The product price multiplied by your quantity and four deliveries, plus all four courier fees.'],['Why might a subscription be unavailable?','Subscription schedules, weekly capacity, blocked dates, and ingredient availability are checked separately from standard-order availability.'],['Can I defer a delivery?','One delivery can be deferred once per subscription, before its change cutoff. Choose Next Day or Next Week, subject to availability. If Next Week overlaps another delivery, we look for the next available weekly date after the cycle.']];
 return `<section class="subscription-hero"><p class="eyebrow">Kitchen406 · Four-week prepaid subscriptions</p><h1>Fresh bakes,<br>week after week.</h1><p>Choose a product for four scheduled weekly deliveries. Prefer a one-time purchase? You can also buy these products through the regular Shop. One upfront payment, with no automatic renewal.</p><div class="commerce-actions"><a class="btn primary" href="#subscription-products">Browse Subscription Products ↓</a>${U.link('shop','Buy Once in Shop →')}${U.link('my-subscriptions','My Subscriptions')}</div></section><h2 class="subscription-section-title" id="subscription-products">Products available for subscription</h2><p class="muted">Standard-order availability and subscription availability are checked separately.</p><div class="commerce-actions order-tabs">${['all','breads','pastries'].map(category=>V.button('category',category==='all'?'All products':category[0].toUpperCase()+category.slice(1),false,`data-value="${category}" aria-pressed="${(B.category||'all')===category}"`)).join('')}</div>${mode==='empty'?U.empty('No subscriptions currently available','You can still browse the Shop for one-time purchases.'):mode==='loading'?'<div class="commerce-skeleton" role="status">Loading subscription products…</div>':mode==='error'?U.empty('Unable to load subscription products','Please try again.',V.button('catalog-retry','Try again')):`<div class="subscription-catalog">${cards}</div>`}<section class="subscription-terms">${[['calendar_today','Four weekly deliveries','Choose your quantity, schedule, and start date.'],['payments','Paid upfront','Your payment includes the products and four delivery fees.'],['shopping_bag','Also available Buy Once','Use the regular Shop for a single fulfillment date.'],['event_busy','No automatic renewal','Your subscription completes after four deliveries.']].map(([icon,title,text])=>`<div><span class="material-symbols-outlined" aria-hidden="true">${icon}</span><h3>${title}</h3><p>${text}</p></div>`).join('')}</section><section class="subscription-faq"><h2>Before you subscribe</h2>${faqs.map(([q,a])=>`<details><summary>${q}</summary><p>${a}</p></details>`).join('')}</section>`;
};
B.list=()=>{
 const pending=(B.mock.page==='empty'?[]:S.purchases).filter(p=>!p.subscriptionId&&p.payment!=='cancelled'),all=(B.mock.page==='empty'?[]:S.records).map(B.sync),shown=all.filter(r=>(B.filter==='all'||r.status===B.filter)&&[r.id,r.snapshot.name].join(' ').toLowerCase().includes(B.query.toLowerCase()));
 shown.sort((a,b)=>B.sort==='oldest'?a.created-b.created:B.sort==='next'?(B.next(a)?.date||'9999').localeCompare(B.next(b)?.date||'9999'):b.created-a.created);
 const pendingUI=pending.length?U.panel('Pending enrollment — action required',pending.map(p=>`<div class="subscription-pending"><div class="order-meta"><strong>${E(p.snapshot.name)}</strong>${V.badge(p.payment==='resolution'?'Payment needs assistance':p.paid?'Paid':'Payment required',true)}</div><p>${E(p.snapshot.variant)} · ${p.snapshot.quantity} per delivery</p><p>${C.money(p.snapshot.products)} products + ${C.money(p.snapshot.delivery)} delivery = <strong>${C.money(p.snapshot.total)}</strong></p><p class="muted">${p.paid?'Payment recorded. Do not pay again.':'An unpaid setup is not an active subscription.'}</p><div class="commerce-actions">${U.link('subscription/payment/'+p.id,p.paid||['detected','delayed'].includes(p.payment)?'Check payment status':'Continue payment',true)}${!p.paid&&!['detected','delayed'].includes(p.payment)?V.button('cancel-setup','Cancel setup',false,`data-id="${p.id}"`):''}</div></div>`).join('')):'';
 const controls=U.panel('Your subscriptions',`<div class="commerce-actions order-tabs">${['all','active','completed'].map(f=>V.button('filter',f[0].toUpperCase()+f.slice(1)+' ('+(f==='all'?all.length:all.filter(r=>r.status===f).length)+')',false,`data-value="${f}" aria-pressed="${B.filter===f}"`)).join('')}</div><div class="order-filters"><div class="field"><label for="subscription-search">Search subscriptions</label><input id="subscription-search" value="${E(B.query)}" placeholder="Reference or product"></div><div class="field"><label for="subscription-sort">Sort</label><select id="subscription-sort">${[['newest','Newest first'],['oldest','Oldest first'],['next','Next delivery']].map(([v,l])=>`<option value="${v}" ${B.sort===v?'selected':''}>${l}</option>`).join('')}</select></div></div>`);
 const cards=shown.map(r=>{const next=B.next(r);return U.panel(E(r.id),`<div class="subscription-list-card"><div>${V.product(r.snapshot)}<p>${r.snapshot.quantity} per delivery · ${C.money(r.snapshot.total)} paid in full</p><progress class="subscription-progress" max="4" value="${count(r)}" aria-label="${count(r)} of 4 deliveries completed"></progress><p class="muted">${count(r)} of 4 deliveries completed</p></div><div><p class="eyebrow">${next?'Next scheduled delivery':'Cycle complete'}</p><h3>${next?U.date(next.date):'All four deliveries completed'}</h3><p class="muted">${next?'Delivery '+next.cycle+' of 4':'Does not automatically renew'}</p><div class="commerce-actions">${U.link('subscriptions/'+r.id,'View Details →',true)}</div></div></div>`,V.badge(r.status));}).join('');
 return U.page('My Subscriptions','View your prepaid commitments and track each scheduled delivery.',`<div class="commerce-actions">${U.link('subscriptions','Explore subscriptions')}</div><div class="subscription-list">${pendingUI}${controls}${cards||U.empty(all.length?'No matching subscriptions':'No subscriptions yet',all.length?'Try another search or filter.':'Your activated subscriptions will appear here.',all.length?V.button('clear-filters','Clear filters'):U.link('subscriptions','Explore subscriptions',true))}</div>`);
};
B.details=r=>{
 if(!r)return U.empty('Subscription not found','This reference is unavailable in the current demo session.',U.link('my-subscriptions','My subscriptions'));
 const p=S.purchases.find(p=>p.id===r.purchaseId),next=B.next(r);
 return U.page('Subscription Details',r.id,`<div class="commerce-actions">${U.link('my-subscriptions','← My subscriptions')}${V.badge(r.status)}<span>${count(r)} of 4 deliveries completed</span></div>`+U.columns(
 U.panel(r.snapshot.name,V.product(r.snapshot)+`<p>${E(r.snapshot.schedule)} · ${r.snapshot.quantity} per delivery</p><progress class="subscription-progress" max="4" value="${count(r)}" aria-label="Subscription progress"></progress>`)+
 (next?U.panel('Next scheduled delivery',`<h3>${U.date(next.date)}</h3><p>Delivery ${next.cycle} of 4 · 9:00 AM–1:00 PM</p>${U.address(r.snapshot.address)}<div class="commerce-actions">${!B.deferReason(r,next,'day')||!B.deferReason(r,next,'week')?U.link('subscriptions/'+r.id+'/defer/'+next.id,'Defer this delivery →'):''}</div>`):U.panel('Subscription completed','<p>All four deliveries are complete. Start another cycle at current prices and availability.</p>'+V.button('again','Subscribe Again',false,`data-id="${r.id}"`,true)))+
 U.panel('Delivery schedule',`<ol class="subscription-dates">${r.deliveries.map(d=>`<li><span class="delivery-number">${d.cycle}</span><div><strong>${U.date(d.date)}</strong><p class="muted">Delivery ${d.cycle} of 4 · ${d.status==='fulfilled'?'Delivered':d.status==='deferred'?'Deferred':d===next?'Upcoming':'Scheduled'}</p>${d.date!==d.originalDate?`<p class="muted">Originally ${U.date(d.originalDate)}</p>`:''}${U.link('orders/'+d.orderId,'View Order →')}</div></li>`).join('')}</ol>`),
 U.panel('Delivery information',U.address(r.snapshot.address)+'<p class="muted">Courier delivery · 9:00 AM–1:00 PM</p>')+
 U.panel('Payment & pricing',V.badge('Paid in full')+V.totals(r.snapshot,true)+`<p class="muted">QR Ph · ${E(r.purchaseId)}<br>${E(p?.paidAt||'')}<br>Does not automatically renew.</p>`)+
 U.panel('Deferment',r.deferments.length?r.deferments.map(d=>`<p>Deferment used · ${d.option==='day'?'Next Day':'Next Week'}</p><p>${U.date(d.originalDate)} → ${U.date(d.newDate)}</p>`).join(''):'<p>One deferment available. Replacement availability and cutoff rules apply.</p>')));
};
B.deferView=r=>{
 const d=r?.deliveries.find(d=>d.id===B.parts[3]);if(!r||!d)return U.empty('Delivery not found','Return to your subscription.',U.link('my-subscriptions','My subscriptions'));
 const option=B.deferOption||'day',target=B.deferTarget(r,d,option),reason=B.deferReason(r,d,option),dates=r.deliveries.map(x=>x.id===d.id&&target?target:x.date);
 return U.page('Defer Delivery','Choose a replacement for this delivery. The remaining deliveries keep their dates.',`<div class="commerce-actions">${U.link('subscriptions/'+r.id,'← Subscription details')}${V.badge(r.deferments.length?'Deferment used':'1 deferment available')}</div>`+U.columns(
 U.panel('Current scheduled delivery',V.product(r.snapshot)+`<p>Delivery ${d.cycle} of 4 · <strong>${U.date(d.date)}</strong></p>${U.address(r.snapshot.address)}`)+
 U.panel('Choose a new delivery schedule',`<div class="subscription-defer-options subscription-options">${['day','week'].map(opt=>{const error=B.deferReason(r,d,opt),date=B.deferTarget(r,d,opt);return `<button class="btn" data-sub="defer-option" data-value="${opt}" aria-pressed="${option===opt}" ${error?'disabled':''}><span>Move to next ${opt}</span><strong>${date?U.date(date):'Unavailable'}</strong><small>${E(error||(opt==='week'?'If the next week overlaps, use the next available weekly date after the cycle.':'Move this delivery one day forward.'))}</small></button>`;}).join('')}</div>${['error','loading'].includes(B.mock.defer)?V.button('defer-retry','Retry availability'):''}`)+
 U.panel('Updated schedule preview',V.dates(dates)),U.panel('Confirm your change',`<p>Original: ${U.date(d.date)}</p><p>Replacement: ${target?U.date(target):'Unavailable'}</p><p class="muted">Four prepaid deliveries remain. This uses your one permitted deferment.</p>${reason?U.alert(reason,true):''}<div class="commerce-actions">${V.button('defer-confirm','Confirm deferment',!!reason,'',true)}${U.link('subscriptions/'+r.id,'Keep original delivery')}</div>`)));
};
B.render=()=>{
 if(!B.active())return;
 let html='',publicPage=A.route==='subscriptions'&&!B.parts[1];
 const step=B.parts[1];
 if(publicPage)html=B.catalog();
 else if(A.auth!=='signedin')html=U.page('Sign in to continue','Your subscription selections will remain here.',U.empty('Your Kitchen406 account','Sign in to set up and manage your four deliveries.',U.link('sign-in','Sign in',true)+U.link('register','Create account')));
 else if(B.mock.page==='loading')html='<div class="commerce-skeleton" role="status">Loading subscription details…</div>'+V.button('page-retry','Return to normal preview');
 else if(B.mock.page==='error')html=U.empty('Unable to load subscriptions','Your selections are saved.',V.button('page-retry','Try again'));
 else if(A.route==='my-subscriptions')html=B.list();
 else if(A.route==='subscriptions')html=B.parts[2]==='defer'?B.deferView(record()):B.details(record());
 else if(step==='payment')html=V.payment(purchase());
 else if(!B.product())html=U.empty('Choose a subscription product','Your setup is unavailable after reloading the demo.',U.link('subscriptions','Browse subscriptions',true));
 else if(B.locked()){const p=S.purchases.find(p=>['detected','delayed'].includes(p.payment));html=U.empty('Payment verification is pending','Check this payment before changing your setup.',U.link('subscription/payment/'+p.id,'Check payment status',true));}
 else if(step==='configure')html=V.config();
 else if(B.configReason())html=U.empty('Review your configuration',B.configReason(),U.link('subscription/configure','Edit configuration',true));
 else if(step==='address'){if(!B.addressUI.form)void B.deliveryRoute.check();html=V.address();}
 else if(step==='review'){void B.deliveryRoute.check();html=B.ready()?V.review():U.empty('Complete delivery details','Choose an address and verify the delivery quotation before review.',U.link('subscription/address','Delivery details',true));}
 else html=U.empty('Subscription step not found','Return to your saved setup.',U.link('subscription/configure','Configuration'));
 A.$('subscription-view').innerHTML=(B.message?U.alert(B.message):'')+html;C.addressMap.mount();
};
B.show=parts=>{B.parts=parts;B.message='';B.render();};
B.inspector=select=>{
 let html=select('mock-sub-page','Page state',['normal','loading','error',...(A.route==='my-subscriptions'?['empty']:[])],B.mock.page);
 if(A.route==='subscriptions'&&!B.parts[1])html+=select('mock-sub-catalog','Subscription offerings',['normal','available','full','unavailable','empty','loading','error'],B.mock.catalog);
 if(A.route==='subscription'){
  if(B.parts[1]==='configure')html+=select('mock-sub-schedule','Schedules',['normal','loading','error','unavailable'],B.mock.schedule);
  if(B.parts[1]==='address')html+=select('mock-sub-quote','Courier quotation',['ok','loading','failed'],S.draft.quote);
  if(B.parts[1]==='review')html+=select('mock-sub-review','Availability',['normal','checking','capacity','stock','error'],B.mock.review)+select('mock-sub-price','Price',['normal','updated'],B.mock.price);
  if(B.parts[1]==='payment')html+=select('mock-sub-payment','Payment simulation',['waiting','detected','delayed','failed','expired','revalidation','confirmed'],purchase()?.payment||'waiting');
 }
 if(B.parts[2]==='defer')html+=select('mock-sub-defer','Deferment availability',['normal','day','week','both','used','loading','error'],B.mock.defer);
 return html+'<div class="mock-actions">'+V.button('samples','Load sample subscriptions')+V.button('reset-states','Reset screen states')+'</div><p class="muted">Demo clock: '+E(D.config.clock)+'. Payments and courier fees are simulated. Reset preview clears all subscriptions.</p>';
};
B.samples=()=>{
 if(S.records.some(r=>r.fixture))return;
 [4,1,1].forEach((id,index)=>{const product=A.products.find(p=>p.id===id),start=index===2?'2026-09-04':index===1?'2026-10-20':'2026-10-16',dates=Array.from({length:4},(_,n)=>D.add(start,n*7));const p={id:'SUB-PAY-'+(++S.serial),snapshot:{productId:id,variantId:'standard',name:product.name,image:product.image,variant:product.variants[0].label,quantity:1,scheduleId:index===1?'tuesday':'friday',schedule:index===1?'Weekly Tuesday':'Weekly Friday',dates,address:C.copy(C.state.addresses[0]),...B.totals(product.variants[0].price,1)},revision:0,payment:'waiting',created:Date.now()-index*86400000,deadline:Date.now()+600000,attempts:[{state:'waiting',at:'Sample'}]};
  if(!p.snapshot.address)return;
  S.purchases.push(p);const clock=D.config.clock;D.config.clock='2026-09-01T12:00:00+08:00';const r=B.pay(p,'confirmed');D.config.clock=clock;
  if(r){r.fixture=true;r.deliveries.slice(0,index===2?4:index===1?1:2).forEach(d=>C.setStatus(C.state.orders.find(o=>o.id===d.orderId),'completed'));B.sync(r);}
 });
};
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-sub]');if(!el||el.disabled)return;
 const action=el.dataset.sub,d=S.draft;
 if(action==='begin'){if(B.begin(el.dataset.id)){location.hash='#/subscription/configure';}return;}
 if(['variant','quantity','schedule'].includes(action)&&B.change()){
  if(action==='variant')d.variant=el.dataset.value;
  if(action==='quantity')d.quantity=Math.max(1,Math.min(10,d.quantity+Number(el.dataset.delta)));
  if(action==='schedule')d.scheduleId=el.dataset.value;
  if(!B.starts().includes(d.start))d.start=B.starts()[0]||'';
 }
 if(action==='address-next'&&!B.configReason())location.hash='#/subscription/address';
 if(action==='review-next'&&B.ready())location.hash='#/subscription/review';
 if(action==='pay'){const p=B.createPurchase();if(p)location.hash='#/subscription/payment/'+p.id;}
 if(action==='address-add'&&B.change()){B.addressUI.editing=null;B.addressUI.form={is_default:!C.state.addresses.length};}
 if(action==='address-edit'&&B.change()){B.addressUI.editing=el.dataset.id;B.addressUI.form=C.copy(C.state.addresses.find(a=>a.address_id===el.dataset.id));}
 if(action==='address-cancel'){B.addressUI.form=null;B.addressUI.editing=null;}
 if(action==='route-retry')void B.deliveryRoute.check(true);
 if(action==='quote-retry')d.quote='ok';
 if(action==='schedule-retry')B.mock.schedule='normal';
 if(action==='review-retry')B.mock.review='normal';
 if(action==='accept-price'&&B.change()){B.variant().price+=20;B.product().price='₱'+B.product().variants[0].price;B.mock.price='normal';}
 if(action==='simulate-payment'&&purchase()?.payment==='waiting'){const p=purchase();B.pay(p,'detected');setTimeout(()=>{if(S.purchases.includes(p)&&p.payment==='detected'){B.pay(p,'confirmed');B.render();A.inspector();}},900);}
 if(action==='check-payment'&&['detected','delayed'].includes(purchase()?.payment))B.pay(purchase(),'confirmed');
 if(action==='retry-payment')B.retry(purchase());
 if(action==='cancel-setup'){const p=S.purchases.find(p=>p.id===el.dataset.id);if(B.cancel(p))B.message='Unpaid setup cancelled.';}
 if(action==='resume'){
  const p=S.purchases.find(p=>p.id===el.dataset.id);if(p&&!p.paid&&B.change()){
   const snap=p.snapshot;S.draft={...blankDraft(snap),purchaseId:p.id,revision:p.revision+1};p.payment='revalidation';D.release(p.id);B.deliveryRoute.reset();location.hash='#/subscription/review';
  }
 }
 if(action==='again'){const r=S.records.find(r=>r.id===el.dataset.id);if(r&&B.begin(r.snapshot.productId,r.snapshot.variantId,r.snapshot.quantity))location.hash='#/subscription/configure';}
 if(action==='category')B.category=el.dataset.value;
 if(action==='filter')B.filter=el.dataset.value;
 if(action==='clear-filters'){B.query='';B.filter='all';}
 if(action==='defer-option')B.deferOption=el.dataset.value;
 if(action==='defer-confirm'){
  const r=record(),delivery=r?.deliveries.find(d=>d.id===B.parts[3]),option=B.deferOption||'day',reason=B.deferReason(r,delivery,option);
  if(reason)B.message=reason;
  else{B.confirmation={recordId:r.id,deliveryId:delivery.id,option,target:B.deferTarget(r,delivery,option)};A.$('subscription-confirm-body').textContent=U.date(delivery.date)+' → '+U.date(B.confirmation.target)+'. This uses your one deferment.';A.openModal('subscription-confirm-modal');}
 }
 if(action==='defer-apply'){
  const confirmation=B.confirmation,r=S.records.find(r=>r.id===confirmation?.recordId),delivery=r?.deliveries.find(d=>d.id===confirmation?.deliveryId);
  const reason=!r||!delivery?'Delivery not found.':B.deferTarget(r,delivery,confirmation.option)!==confirmation.target?'Availability changed. Review the replacement date again.':B.defer(r,delivery,confirmation.option);
  A.closeModal();B.message=reason||'Delivery deferred. Your updated schedule is shown below.';
  if(!reason){location.hash='#/subscriptions/'+r.id;A.toast('Delivery deferred to '+U.date(delivery.date));}
 }
 if(action==='defer-retry')B.mock.defer='normal';
 if(action==='catalog-retry')B.mock.catalog='normal';
 if(action==='page-retry')B.mock.page='normal';
 if(action==='samples')B.samples();
 if(action==='reset-states'){Object.keys(B.mock).forEach(k=>B.mock[k]='normal');d.quote='ok';B.message='';}
 B.render();A.inspector();
});
function blankDraft(snap){return {productId:snap.productId,variant:snap.variantId,quantity:snap.quantity,scheduleId:snap.scheduleId,start:snap.dates[0],addressId:snap.address.address_id,method:'delivery',quote:'ok'};}
document.addEventListener('change',e=>{
 const id=e.target.id;
 if(id.startsWith('mock-sub-')){
  const key=id.slice(9),value=e.target.value;
  if(key==='payment')B.pay(purchase(),value);else if(key==='quote')S.draft.quote=value;else B.mock[key]=value;
 }else if(id==='subscription-start'&&B.change())S.draft.start=e.target.value;
 else if(e.target.name==='subscription-address'&&B.change()){S.draft.addressId=e.target.value;B.deliveryRoute.reset();}
 else if(id==='subscription-sort')B.sort=e.target.value;
 else return;
 B.render();A.inspector();
});
document.addEventListener('input',e=>{if(e.target.id==='subscription-search'){const pos=e.target.selectionStart;B.query=e.target.value;B.render();const input=A.$('subscription-search');input.focus();input.setSelectionRange(pos,pos);}});
setInterval(()=>{
 let changed=false;S.purchases.forEach(p=>{if(p.payment==='waiting'&&p.deadline<=Date.now()){B.pay(p,'expired');changed=true;}});
 if(changed){B.render();A.inspector();}
 const clock=A.$('subscription-payment-clock'),p=purchase();if(clock&&p){const seconds=Math.max(0,Math.ceil((p.deadline-Date.now())/1000));clock.textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}
},1000);
const modal=document.createElement('div');modal.id='subscription-confirm-modal';modal.className='overlay hidden';modal.hidden=true;modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true');modal.setAttribute('aria-labelledby','subscription-confirm-title');modal.innerHTML='<div class="dialog-card"><button class="dialog-close" data-close-modal aria-label="Close confirmation">×</button><h2 id="subscription-confirm-title">Confirm this delivery change?</h2><p id="subscription-confirm-body"></p><div class="commerce-actions"><button class="btn" data-close-modal>Go Back</button>'+V.button('defer-apply','Confirm Deferment',false,'',true)+'</div></div>';document.body.append(modal);
})();
