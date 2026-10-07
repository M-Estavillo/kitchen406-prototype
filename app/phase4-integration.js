/* Bridges the customer increment to the existing commerce and auth shell. */
(() => {
const A=K406,C=A.commerce,P=A.account,K=A.cakes,V=A.phase4,U=C.ui,E=A.escape,N=A.notifications;
const menu=document.createElement('div');menu.id='account-menu';menu.className='account-menu';menu.hidden=true;menu.innerHTML=V.links.map(([path,,label])=>`<a href="#/${path}">${label}</a>`).join('')+V.button('sign-out','Sign Out');A.$('header-auth-user').append(menu);
document.addEventListener('click',e=>{if(e.target.closest('#account-menu a')||e.target.closest('[data-p4="sign-out"]')){menu.hidden=true;A.$('account-menu-toggle').setAttribute('aria-expanded','false');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){menu.hidden=true;A.$('account-menu-toggle').setAttribute('aria-expanded','false');A.$('account-menu-toggle').focus();}});
setInterval(()=>{if(K.expire()){V.render();C.render();A.inspector();}},1000);

const reset=C.reset;C.reset=()=>{K.reset();N.reset();P.reset();reset();};
const setStatus=C.setStatus;C.setStatus=(o,status)=>{const old=o?.status;setStatus(o,status);if(o&&old!==status){if(o.quotationId&&status==='cancelled')K.release(o.id);N.emit('status-'+o.id+'-'+status,'orders','Order status updated',o.id+' is now '+status.replaceAll('-',' ')+'.','orders/'+o.id,o.customer_id||P.id());}};
const createOrder=C.createOrder;C.createOrder=()=>{if(!P.allowed())return null;const o=createOrder();if(o){o.customer_id=P.id();o.contact||=P.contact();}return o;};
const setPayment=C.setPayment;C.setPayment=(o,state)=>{const paid=o?.paid;setPayment(o,state);if(o&&!o.quotationId&&!paid&&o.paid)N.emit('confirmed-'+o.id,'orders','Order confirmed','Your order '+o.id+' is confirmed.','orders/'+o.id,o.customer_id||P.id());};
const B=A.subscriptions,pay=B.pay,defer=B.defer;
const createPurchase=B.createPurchase;B.createPurchase=()=>P.allowed()?createPurchase():null;
B.pay=(p,state)=>{const r=pay(p,state);if(r){r.customer_id=P.id();p.customer_id=P.id();N.emit('subscription-'+r.id,'subscriptions','Subscription confirmed','Your four prepaid deliveries are now scheduled.','subscriptions/'+r.id);N.emit('reminder-'+r.id,'subscriptions','Upcoming subscription delivery','Your first delivery is scheduled for '+r.deliveries[0].date+'.','subscriptions/'+r.id);}return r;};
B.defer=(r,d,option)=>{const error=defer(r,d,option);if(!error)N.emit('defer-'+r.id,'subscriptions','Delivery schedule deferred','Your selected delivery has moved to '+d.date+'.','subscriptions/'+r.id);return error;};
const sync=B.sync;B.sync=r=>{const previous=r.status;const result=sync(r);if(r.status!==previous)N.emit('subscription-status-'+r.id+'-'+r.status,'subscriptions','Subscription '+r.status,'All four deliveries in this subscription are complete.','subscriptions/'+r.id,r.customer_id||P.id());return result;};

K.paymentView=o=>{
 const q=K.quote(o.quotationId);if(!q||!P.owns(o))return U.empty('Order not found','This purchase is not available for your account.',U.link('cake-requests','My cake requests'));
 const state=o.payment,locked=['detected','delayed'].includes(state);
 const messages={waiting:'Waiting for payment. Use the demo payment control below.',detected:'Payment detected. Verification is pending; do not pay again.',delayed:'Still verifying your payment. Retry is locked.',confirmed:'Full payment confirmed in this preview.',failed:'Payment unsuccessful. Your quotation is saved.',expired:'QR session expired. Retry checks quotation validity and availability.',revalidation:K.message||'Availability or quotation changed. Contact the bakery for a revised offer.',resolution:'Payment recorded. Fulfillment needs owner assistance. Do not pay again.',cancelled:'This unpaid purchase was cancelled.'};
 let actions='';if(state==='waiting')actions=U.button('simulate-payment','Simulate successful payment');
 if(locked)actions=U.button('check-payment','Check payment status');
 if(['failed','expired','revalidation'].includes(state)&&!K.quoteReason(q))actions=U.button('retry-payment','Retry payment');
 if(o.paid)actions=U.link(o.status==='payment-resolution'?'orders/'+o.id:'confirmation/'+o.id,o.status==='payment-resolution'?'View payment issue':'Continue to confirmation',true);
 return U.page('Pay for your custom cake','Quotation version '+q.version+' · '+o.requestId,U.columns(U.panel('Amount to pay',`<p class="payment-amount">${C.money(o.total)}</p><div class="demo-qr"><span class="material-symbols-outlined" aria-hidden="true">qr_code_2</span><strong>QR Ph demo</strong><span>Non-payable preview</span></div><p>Reference: ${E(o.reference)}</p>${state==='waiting'?'<p>Session expires in <strong id="payment-clock"></strong></p>':''}`)+U.alert(messages[state]||'Payment unavailable',['failed','expired','revalidation','resolution'].includes(state))+`<div class="commerce-actions">${actions}${U.link(K.quotePath(q),'Back to quotation')}${U.link('orders/'+o.id,'View order')}</div>`,U.summary(o)+U.panel(o.fulfillment.method==='pickup'?'Bakery pickup':'Owner-managed delivery',U.fulfillment(o))));
};
K.paymentAction=(action,o)=>{
 if(!P.owns(o))return;
 if(action==='simulate-payment'&&o.payment==='waiting'){if(o.deadline<=Date.now())K.pay(o,'expired');else{K.pay(o,'detected');setTimeout(()=>{if(K.orders.includes(o)&&o.payment==='detected'){K.pay(o,'confirmed');C.render();A.inspector();}},900);}}
 if(action==='check-payment'&&['detected','delayed'].includes(o.payment))K.pay(o,'confirmed');
 if(action==='retry-payment')K.retry(o);
 if(action==='cancel-order'&&C.unpaid(o)){A.$('cancel-order-reference').textContent=o.id;A.$('confirm-order-cancel').dataset.id=o.id;A.openModal('order-cancel-modal');}
 C.render();A.inspector();
};
K.sampleDraft=()=>{
 K.resetDraft();let date=A.schedule.add(A.schedule.today(),10);for(let i=0;i<90&&K.dateReason(date);i++)date=A.schedule.add(date,1);
 Object.assign(K.state.draft,{date,window:'morning',addressId:A.addresses.active().find(a=>K.serviceable(a))?.address_id||'',selections:{shape:'round',flavor:'chocolate',size:'eight',color:'cream',icing:'buttercream'},addons:{decoration:2},notes:'Soft cream and sage colors with botanical details. Please add Happy Birthday.',images:[{url:'assets/celebration-cake.jpg',name:'cake-reference.jpg',size:240000,type:'image/jpeg',status:'ready'},null,null],reviewedPrice:130000});
};
V.inspector=select=>{
 const account=A.route==='account',mock=account?P.mock:K.mock;
 let html=select('mock-p4-page','Page state',['normal','loading','error','empty'],mock.page);
 if(account){html+=select('mock-p4-save','Save result',['normal','error'],P.mock.save)+select('mock-p4-email','Verification delivery',['normal','error'],P.mock.email);
 html+='<p class="muted">Initial inspector account password: Kitchen406! (demo). A signed-in account uses the password entered at sign-in.</p>';
 if(P.verification)html+='<p class="muted">Current demo code: '+E(P.verification.code)+'</p><div class="mock-actions">'+V.button('qa-otp-expire','Expire code')+V.button('qa-otp-resend','Enable resend')+'</div>';
 html+='<div class="mock-actions">'+V.button('qa-notifications','Load notification examples')+'</div>';
 }else{
 html+=select('mock-p4-availability','Cake availability',['normal','loading','error','capacity','blocked'],K.mock.availability)+select('mock-p4-options','Cake options',['normal','loading','error'],K.mock.options)+select('mock-p4-upload','Image validation',['normal','error'],K.mock.upload)+select('mock-p4-submit','Request submission',['normal','error'],K.mock.submit);
 html+='<div class="mock-actions">'+V.button('qa-cake-fill','Fill request fixture')+V.button('qa-cake-sample','Load quotation example')+V.button('qa-quote-issue','Owner: issue quotation')+V.button('qa-quote-revise','Owner: revise quotation')+V.button('qa-request-reject','Owner: reject request')+V.button('qa-quote-expire','Expire current quotation')+'</div><p class="muted">Cake fixtures: 5-day lead, 4 PM cutoff, 2/week, 1/day, Manila Monday–Sunday weeks. City coverage and recipe quantities are examples; delivery is reviewed by the owner. Quotation validity: 48 hours. Owner actions below simulate Phase 6.</p>';
 }return html+'<div class="mock-actions">'+V.button('qa-reset-states','Reset screen states')+'</div>';
};
document.addEventListener('change',e=>{if(!e.target.id.startsWith('mock-p4-'))return;const key=e.target.id.slice(8);(A.route==='account'?P.mock:K.mock)[key]=e.target.value;V.render();A.inspector();});
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-p4]');if(!el||!el.dataset.p4.startsWith('qa-'))return;
 const action=el.dataset.p4;if(!P.allowed()){A.toast('Sign in to use these fixtures.');return;}
 let r=K.request(V.parts[1])||K.list()[0];
 if(action==='qa-cake-fill'){K.sampleDraft();location.hash='#/custom-cakes/request/details';}
 if(action==='qa-cake-sample'){K.sampleDraft();r=K.submit();if(r){K.issue(r);const q=K.issue(r,true);location.hash='#/'+K.quotePath(q);}else A.toast(K.message);}
 if(action==='qa-quote-issue'||action==='qa-quote-revise'){const q=K.issue(r,action==='qa-quote-revise');if(q)location.hash='#/'+K.quotePath(q);else A.toast('Select an unpaid request without pending payment verification.');}
 if(action==='qa-request-reject'&&r&&!K.orders.some(o=>o.requestId===r.id&&(o.paid||['detected','delayed'].includes(o.payment)))){r.status='rejected';K.versions(r).forEach(q=>{q.status='rejected';const o=K.orders.find(o=>o.quotationId===q.id);if(o)K.cancel(o);});N.emit('rejected-'+r.id,'cakes','Cake request declined','The bakery cannot accommodate this request.','cake-requests/'+r.id);}
 if(action==='qa-quote-expire'&&r){const q=K.versions(r)[0];if(q&&!K.orders.some(o=>o.quotationId===q.id&&o.paid))q.expires_at=Date.now()-1;}
 if(action==='qa-otp-expire'&&P.verification)P.verification.expires_at=Date.now()-1;
 if(action==='qa-otp-resend'&&P.verification)P.verification.resend_at=0;
 if(action==='qa-notifications'){
  C.sampleOrders();const o=C.state.orders[0];if(o)N.emit('sample-order-'+o.id,'orders','Order confirmed','Your sample order is scheduled for '+o.fulfillment.date+'.','orders/'+o.id,P.id(),{email:'sent',sms:'failed'});
  N.emit('sample-security','account','Account security reminder','You can manage your password and verified email from your profile.','account/profile',P.id(),{email:'sent'});
 }
 if(action==='qa-reset-states'){Object.keys(P.mock).forEach(k=>P.mock[k]='normal');Object.keys(K.mock).forEach(k=>K.mock[k]='normal');K.message='';K.builder.uploadError='';}
 V.render();A.inspector();
});
})();
