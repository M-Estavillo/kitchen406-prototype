/* Bridges the customer increment to the existing commerce and auth shell. */
(() => {
const A=K406,C=A.commerce,P=A.account,K=A.cakes,V=A.phase4,U=C.ui,E=A.escape,N=A.notifications;
const menu=document.createElement('div');menu.id='account-menu';menu.className='account-menu';menu.hidden=true;menu.innerHTML=V.links.map(([path,,label])=>`<a href="#/${path}">${label}</a>`).join('')+V.button('sign-out','Sign Out');A.$('header-auth-user').append(menu);
document.addEventListener('click',e=>{if(e.target.closest('#account-menu a')||e.target.closest('[data-p4="sign-out"]')){menu.hidden=true;A.$('account-menu-toggle').setAttribute('aria-expanded','false');}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!menu.hidden){menu.hidden=true;A.$('account-menu-toggle').setAttribute('aria-expanded','false');A.$('account-menu-toggle').focus();}});
setInterval(()=>{if(K.expire()){V.render();C.render();}},1000);

const reset=C.reset;C.reset=()=>{K.reset();N.reset();P.reset();reset();};
C.notifyStatus=(o,status)=>{
 const pickupReady=status==='ready'&&o.fulfillment?.method==='pickup'&&['standard','subscription'].includes(o.type);
 const title=pickupReady?'Ready for pickup':status==='cancelled'&&o.cancellationReason?'Pickup cancelled':'Order status updated';
 const message=pickupReady?'Order '+o.id+' is ready for bakery pickup on '+o.fulfillment.date+'. Please arrive by 7:00 p.m. Manila time.':status==='cancelled'&&o.cancellationReason?'Order '+o.id+' was cancelled. '+o.cancellationReason+'.':o.id+' is now '+status.replaceAll('-',' ')+'.';
 N.emit('status-'+o.id+'-'+status,'orders',title,message,'orders/'+o.id,o.customer_id||P.id());
};
const setStatus=C.setStatus;C.setStatus=(o,status,options)=>{
 const old=o?.status;setStatus(o,status);
 if(!o||old===status)return;
 if(o.quotationId&&status==='cancelled')K.release(o.id);
 if(!options?.deferNotification)C.notifyStatus(o,status);
};
const createOrder=C.createOrder;C.createOrder=()=>{if(!P.allowed())return null;const o=createOrder();if(o){o.customer_id=P.id();o.contact||=P.contact();}return o;};
const setPayment=C.setPayment;C.setPayment=(o,state)=>{const paid=o?.paid;setPayment(o,state);if(o&&!o.quotationId&&!paid&&o.paid&&o.status==='confirmed')N.emit('confirmed-'+o.id,'orders','Order confirmed','Your order '+o.id+' is confirmed.','orders/'+o.id,o.customer_id||P.id());};
const B=A.subscriptions,pay=B.pay,defer=B.applyDefer;
const createPurchase=B.createPurchase;B.createPurchase=()=>{if(!P.allowed())return null;const p=createPurchase();if(p)p.customer_id??=P.id();return p;};
B.pay=(p,state)=>{const r=pay(p,state);if(r){p.customer_id??=P.id();r.customer_id=p.customer_id;N.emit('subscription-'+r.id,'subscriptions','Subscription confirmed','Your four prepaid deliveries are now scheduled.','subscriptions/'+r.id,r.customer_id);N.emit('reminder-'+r.id,'subscriptions','Upcoming subscription delivery','Your first delivery is scheduled for '+r.deliveries[0].date+'.','subscriptions/'+r.id,r.customer_id);}return r;};
B.applyDefer=(r,d,...args)=>{const error=defer(r,d,...args);if(!error)N.emit('defer-'+r.id,'subscriptions','Delivery schedule deferred','Your selected delivery has moved to '+d.date+'.','subscriptions/'+r.id,r.customer_id);return error;};

K.paymentView=o=>{
 const q=K.quote(o.quotationId);if(!q||!P.owns(o))return U.empty('Order not found','This purchase is not available for your account.',U.link('cake-requests','My cake requests'));
 const state=C.paymentViewState(o),locked=['detected','delayed','grace'].includes(state)||o.reconciliationRequired;
 const messages={waiting:'Waiting for payment. Use the demo payment control below.',detected:'Payment detected. Verification is pending; do not pay again.',delayed:'Still verifying your payment. Retry is locked.',confirmed:'Full payment confirmed in this preview.',failed:'Payment unsuccessful. Your quotation is saved.',grace:'The QR session is closed. The reservation is held while payment is checked.',expired:'The payment and reservation window ended. Retry checkout to recheck your agreed date.',revalidation:K.message||'Availability or quotation changed. Contact the bakery for a revised offer.',resolution:'Payment recorded. Fulfillment needs owner assistance. Do not pay again.',cancelled:'This unpaid purchase was cancelled.'};
 let actions='';if(state==='waiting')actions=U.button('simulate-payment','Simulate successful payment');
 if(locked)actions=U.button('check-payment','Check payment status');
 if(!locked&&['failed','expired','revalidation'].includes(state)&&!K.quoteReason(q))actions=U.button('retry-payment','Retry payment');
 if(o.paid)actions=U.link(o.refundEligible||o.status==='payment-resolution'?'orders/'+o.id:'confirmation/'+o.id,o.refundEligible||o.status==='payment-resolution'?'View payment issue':'Continue to confirmation',true);
 return U.page('Pay for your custom cake','Quotation version '+q.version+' · '+o.requestId,U.columns(U.panel('Amount to pay',`<p class="payment-amount">${C.money(o.total)}</p><div class="demo-qr"><span class="material-symbols-outlined" aria-hidden="true">qr_code_2</span><strong>${state==='grace'?'QR session closed':'QR Ph demo'}</strong><span>Non-payable preview</span></div><p>Reference: ${E(o.reference)}</p>${state==='waiting'?'<p>Session expires in <strong id="payment-clock">'+C.paymentTime(o.deadline)+'</strong></p>':''}`)+`<div class="cake-payment-feedback"><p class="cake-payment-status ${['failed','expired','revalidation','resolution','cancelled'].includes(state)?'is-error':''}" role="status">${E(o.refundEligible?o.resolution:o.paymentCheckMessage||messages[state]||'Payment unavailable')}</p><div class="commerce-actions">${actions}${U.link(K.quotePath(q),'Back to quotation')}</div></div>`,U.summary(o)+U.panel(o.fulfillment.method==='pickup'?'Bakery pickup':'Owner-managed delivery',U.fulfillment(o))));
};
K.paymentAction=(action,o)=>{
 if(!P.owns(o))return;
 if(action==='simulate-payment'&&C.qrOpen(o)){K.pay(o,'detected');setTimeout(()=>{if(K.orders.includes(o)&&o.payment==='detected'){A.checkoutHolds.simulate(o,'confirmed',K.pay);C.render();}},900);}
 if(action==='check-payment')A.checkoutHolds.check(o);
 if(action==='retry-payment')K.retry(o);
 if(action==='cancel-order'&&C.unpaid(o)){A.$('cancel-order-reference').textContent=o.id;A.$('confirm-order-cancel').dataset.id=o.id;A.openModal('order-cancel-modal');}
 C.render();
};
})();
