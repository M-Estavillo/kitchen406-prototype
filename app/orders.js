(() => {
const A=K406,C=A.commerce,S=C.state,U=C.ui,E=A.escape;
const O=C.orders={tab:'all',query:'',type:'all',sort:'newest',page:1};
const attention=o=>['pending-payment','payment-failed','payment-resolution'].includes(o.status);
O.payment=()=>{
 const o=C.currentOrder();if(!o)return U.empty('No payment session','Review your bag and checkout details to start a payment.',U.link('cart','View bag'));
 const state=o.payment,locked=['detected','delayed'].includes(state);
 const messages={waiting:'Waiting for payment · Use Simulate payment to try the demo.',detected:'Payment detected — verifying. Retry is locked to prevent duplicate payments.',delayed:'Still checking your payment. Do not pay again.',confirmed:'Payment confirmed in this demo.',failed:'Payment unsuccessful. Your order details are saved.',expired:'QR session expired. Generate a new demo session to continue.',revalidation:'Order revalidation required. Review availability and fulfillment before paying.'};
 let actions='';
 if(state==='waiting')actions=U.button('simulate-payment','Simulate successful payment');
 if(locked)actions=U.button('check-payment','Check demo payment status');
 if(['failed','expired'].includes(state))actions=U.button('retry-payment','Generate new demo QR session');
 if(state==='confirmed')actions=U.link('confirmation/'+o.id,'Continue to order confirmation',true);
 if(state==='revalidation')actions=U.link('checkout/review','Back to order review');
 if(o.status==='cancelled')return U.empty('This order was cancelled','Start again from your bag.',U.link('cart','View bag'));
 return U.page('Pay with QR Ph','Preview the bank and e-wallet payment experience.',U.columns(
 U.panel('Amount to pay',`<p class="payment-amount">${C.money(o.total)}</p><div class="demo-qr"><span class="material-symbols-outlined" aria-hidden="true">qr_code_2</span><strong>${state==='expired'?'Session expired':state==='confirmed'?'Payment confirmed':'QR Ph demo'}</strong><span>Non-payable preview</span></div><p class="center">${state==='waiting'?'Session expires in <strong id="payment-clock"></strong>':E(state.replaceAll('-',' '))}</p><p class="center muted">Reference: ${E(o.reference)}</p>`)+
 U.panel('How payment works','<ol class="payment-instructions"><li>In a live checkout, open a QR Ph-supported bank or e-wallet app.</li><li>Scan the merchant QR and verify the order amount.</li><li>Return while payment is verified. For this prototype, use the simulation control below.</li></ol>')+
 U.alert(messages[state]||'Payment unavailable',['failed','expired','revalidation'].includes(state))+`<div class="commerce-actions">${actions}${!locked&&state!=='confirmed'?U.link('checkout/review','Back to order review'):''}${U.link('orders/'+o.id,'View order')}</div>`,U.summary(o)+U.panel('Fulfillment details',U.fulfillment(o))),'payment');
};
O.timeline=o=>{
 const stages=['Order placed','Payment confirmed','Preparing & proofing',o.fulfillment.method==='pickup'?'Ready for pickup':'Ready for delivery','Completed'];
 const position={'pending-payment':0,'payment-failed':0,confirmed:1,preparing:2,'ready-pickup':3,'ready-delivery':3,'in-transit':3,completed:4,'payment-resolution':1,cancelled:-1}[o.status];
 return `<ol class="order-timeline">${stages.map((text,i)=>`<li class="${i<=position?'done':''}"><span>${i<=position?'✓':i+1}</span><div><strong>${text}</strong><p class="muted">${i<position?'Complete':i===position?'Current status':'Upcoming'}</p></div></li>`).join('')}</ol>`;
};
O.details=(confirmation=false)=>{
 const o=C.currentOrder();if(!o)return U.empty('Order not found','This reference is not available in the current demo session.',U.link('orders','Back to my orders'));
 const title=confirmation?(o.paid&&o.status!=='payment-resolution'?'Order confirmed':o.status==='payment-resolution'?'Payment needs attention':'Payment verification pending'):'Order details';
 const actions=U.link('orders','My orders')+U.link('shop','Continue shopping')+(confirmation?U.link('orders/'+o.id,'View order',true):U.button('copy-order','Copy reference'));
 const paymentText=o.status==='cancelled'?'Cancelled · No payment collected':o.status==='payment-resolution'?'Payment recorded · Resolution required':o.paid?'Paid · QR Ph (demo)':o.payment==='detected'||o.payment==='delayed'?'Verification pending':'Unpaid · QR Ph';
 const pending=C.unpaid(o)?U.link('payment/'+o.id,o.payment==='waiting'?'Continue payment':'Retry payment',true)+U.button('cancel-order','Cancel unpaid order'):['detected','delayed'].includes(o.payment)?U.link('payment/'+o.id,'Check payment status'):'';
 const reviews=o.status==='completed'?U.panel('How was your order?',`<p>Share your experience with the bakery.</p>${o.items.map(i=>A.product.state.submitted.has(i.productId)?`<p>${E(i.name)} · Reviewed ✓</p>`:U.button('review-item','Review '+i.name,false,`data-product="${i.productId}"`)).join('')}`):'';
 const courier={prebooking:'Courier booking has not been arranged yet.',booked:'Demo courier booking confirmed. Rider awaiting collection.',transit:'Your demo courier is on the way. Estimated arrival: 25–35 minutes.',delivered:'Delivery completed in this preview.',failed:'Booking temporarily unavailable. The bakery would arrange an alternative.'};
 return U.page(title,'Track your order from preparation to collection or delivery.',`<div class="order-meta"><div><strong>${E(o.id)}</strong><p class="muted">Placed ${new Date(o.created).toLocaleString()}${o.fixture?' · Sample order':''}</p></div>${U.status(o)}<span>${paymentText}</span></div><div class="commerce-actions">${actions}</div>${o.status==='payment-resolution'?U.alert('Payment was recorded, but fulfillment needs assistance. Do not pay again. Contact the bakery in a live checkout.',true):''}`+U.columns(
 U.panel(confirmation?'What happens next?':'Order progress',O.timeline(o))+U.panel('Items ordered',U.items(o.items))+reviews+
 U.panel('Order activity',`<details open><summary>Activity history</summary>${o.activity.map(a=>`<p>${E(a.text)}<br><small class="muted">${E(a.at)}</small></p>`).join('')}</details>`),
 U.panel('Fulfillment',U.fulfillment(o))+(o.fulfillment.method==='delivery'?U.panel('Courier tracking · demo',`<p>${E(courier[C.mock.courier])}</p>`):'')+
 U.panel('Payment details',`<p>${paymentText}</p><p class="muted">Reference: ${E(o.reference)}</p>${o.paidAt?`<p class="muted">Confirmed: ${E(o.paidAt)}</p>`:''}<details><summary>Payment attempts (${o.attempts.length})</summary>${o.attempts.map((p,i)=>`<p>Attempt ${i+1}: ${E(p.state)} · ${E(p.at)}</p>`).join('')}</details>`)+U.summary(o)+U.panel('Customer actions',`<div class="commerce-stack">${pending}${U.button('contact','Contact bakery team')}${U.button('print','Print demo order summary')}</div>`)));
};
O.list=()=>{
 const all=C.mock.page==='empty'?[]:S.orders.filter(o=>C.mock.dataset==='all'||o.type===C.mock.dataset);
 let filtered=all.filter(o=>(O.tab==='all'||O.tab==='attention'&&attention(o)||O.tab==='completed'&&o.status==='completed'||O.tab==='active'&&!attention(o)&&!['completed','cancelled'].includes(o.status))&&(O.type==='all'||o.type===O.type)&&(!O.query||[o.id,...o.items.map(i=>i.name)].join(' ').toLowerCase().includes(O.query.toLowerCase())));
 filtered.sort((a,b)=>O.sort==='oldest'?a.created-b.created:O.sort==='fulfillment'?a.fulfillment.date.localeCompare(b.fulfillment.date):b.created-a.created);
 const pages=Math.max(1,Math.ceil(filtered.length/5));O.page=Math.min(O.page,pages);
 const controls=U.panel('Your orders',`<div class="commerce-actions order-tabs">${[['all','All orders'],['active','In progress'],['completed','Completed'],['attention','Needs attention']].map(([value,label])=>U.button('orders-tab',label,false,`data-value="${value}" aria-pressed="${O.tab===value}"`)).join('')}</div><div class="order-filters"><div class="field"><label for="orders-search">Search orders or products</label><input id="orders-search" value="${E(O.query)}" placeholder="Order reference or product"></div><div class="field"><label for="orders-type">Order type</label><select id="orders-type">${[['all','All types'],['standard','Standard orders'],['subscription','Subscriptions'],['cake','Custom cakes']].map(([v,l])=>`<option value="${v}" ${O.type===v?'selected':''}>${l}</option>`).join('')}</select></div><div class="field"><label for="orders-sort">Sort</label><select id="orders-sort">${[['newest','Newest first'],['oldest','Oldest first'],['fulfillment','Fulfillment date']].map(([v,l])=>`<option value="${v}" ${O.sort===v?'selected':''}>${l}</option>`).join('')}</select></div></div>`);
 const cards=filtered.slice((O.page-1)*5,O.page*5).map(o=>U.panel(E(o.id),`<p class="muted">${o.fixture?'Sample · ':''}${E(o.type)} order · ${new Date(o.created).toLocaleDateString()}</p>${U.items(o.items)}<div class="order-meta"><span>${o.fulfillment.method==='pickup'?'Bakery pickup':'Courier delivery'} · ${U.date(o.fulfillment.date)}</span><strong>${C.money(o.total)}</strong></div><div class="commerce-actions">${U.link('orders/'+o.id,'View details')}${C.unpaid(o)?U.link('payment/'+o.id,'Pay now (demo)'):''}${o.type==='subscription'?U.button('manage-plan','Manage plan'):''}${o.status==='completed'?U.button('review-order','Leave a review',false,`data-id="${o.id}"`):''}</div>`,U.status(o))).join('');
 return U.page('My orders','Track your bakery orders and scheduled fulfillment.',controls+(cards||U.empty(all.length?'No matching orders':'Your bread box is empty',all.length?'Try another search or clear your filters.':'Orders placed in this demo will appear here.',all.length?U.button('clear-filters','Clear all filters'):U.link('shop','Explore fresh bakes',true)))+`<div class="commerce-actions"><p>Showing ${filtered.length?(O.page-1)*5+1:0}–${Math.min(O.page*5,filtered.length)} of ${filtered.length} orders</p>${U.button('orders-prev','Previous',O.page===1)}<span>Page ${O.page} of ${pages}</span>${U.button('orders-next','Next',O.page===pages)}</div>`);
};
O.action=async(action,el)=>{
 const o=C.currentOrder();
 if(action==='simulate-payment'&&o?.payment==='waiting'){C.setPayment(o,'detected');C.render();const id=o.id;setTimeout(()=>{const live=S.orders.find(x=>x.id===id);if(live?.payment==='detected'){C.setPayment(live,'confirmed');C.render();A.inspector();}},900);}
 if(action==='check-payment'&&['detected','delayed'].includes(o?.payment))C.setPayment(o,'confirmed');
 if(action==='retry-payment'&&C.unpaid(o)){if(!o.fixture&&o.revision!==S.revision){C.setPayment(o,'revalidation');}else{o.deadline=Date.now()+600000;o.attempts.push({state:'waiting',at:new Date().toLocaleString()});C.setPayment(o,'waiting');}}
 if(action==='cancel-order'&&C.unpaid(o)){A.$('cancel-order-reference').textContent=o.id;A.$('confirm-order-cancel').dataset.id=o.id;A.openModal('order-cancel-modal');}
 if(action==='copy-order'&&o){try{await navigator.clipboard.writeText(o.id);A.toast('Order reference copied.');}catch{A.notice('Order reference',o.id);}}
 if(action==='contact')A.notice('Contact Kitchen406 · Demo','Bakery contact details have not been supplied. In the live website, this control will open the bakery support channel. No message was sent.');
 if(action==='print')window.print();
 if(action==='manage-plan')A.notice('Subscription plan · Preview','This sample order represents a prepaid weekly bread plan. Plan management belongs to a later phase.');
 if(action==='review-order'){location.hash='#/orders/'+el.dataset.id;return;}
 if(action==='review-item'&&o?.status==='completed'){
  const id=Number(el.dataset.product);if(!o.items.some(i=>i.productId===id))return;
  if(!A.products.some(p=>p.id===id)){A.notice('Custom cake review · Preview','Custom cake feedback belongs to a later phase.');return;}
  A.product.show(id);A.product.state.elig='eligible';A.product.eligibility();window.openReviewModal();return;
 }
 if(action==='orders-tab'){O.tab=el.dataset.value;O.page=1;}
 if(action==='clear-filters'){O.query='';O.type='all';O.tab='all';O.page=1;}
 if(action==='orders-prev')O.page=Math.max(1,O.page-1);
 if(action==='orders-next')O.page++;
 C.render();A.inspector();
};
document.addEventListener('change',e=>{if(e.target.id==='orders-type'||e.target.id==='orders-sort'){O[e.target.id==='orders-type'?'type':'sort']=e.target.value;O.page=1;C.render();}});
document.addEventListener('input',e=>{if(e.target.id==='orders-search'){const pos=e.target.selectionStart;O.query=e.target.value;O.page=1;C.render();const input=A.$('orders-search');input.focus();input.setSelectionRange(pos,pos);}});
setInterval(()=>{
 S.orders.forEach(o=>{if(o.payment==='waiting'&&o.status!=='cancelled'&&o.deadline<=Date.now()){C.setPayment(o,'expired');if(C.currentOrder()===o)C.render();}});
 const el=A.$('payment-clock'),o=C.currentOrder();if(el&&o){const seconds=Math.max(0,Math.ceil((o.deadline-Date.now())/1000));el.textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');}
},1000);
})();
