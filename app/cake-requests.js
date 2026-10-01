(() => {
const A=K406,K=A.cakes,S=K.state,C=A.commerce,U=C.ui,V=A.phase4,E=A.escape,B=K.builder;
K.filter='all';
K.status=r=>({pending_review:'Awaiting owner review',negotiating:'Discussing changes',quoted:'Quotation ready',accepted:'Quotation accepted',rejected:'Request rejected',expired:'Request expired'})[r.status]||r.status;
K.quoteLabel=q=>q.status==='issued'&&q.expires_at<=Date.now()?'Expired':({issued:'Awaiting your response',accepted:'Accepted',superseded:'Superseded',rejected:'Declined by you',expired:'Expired'})[q.status]||q.status;
K.quotePath=q=>'cake-requests/'+q.requestId+'/quotations/'+q.id;
K.requestDetail=r=>{
 if(!r)return U.empty('Request not found','This request is not available for your account in the current session.',U.link('cake-requests','My cake requests'));
 const versions=K.versions(r),current=versions[0],o=K.orders.find(o=>o.requestId===r.id&&o.paid)||K.orders.find(o=>o.quotationId===r.accepted_quotation_id);
 return V.accountPage('Cake Request '+r.id,'Track the bakery review and your quotation.',`<div class="order-meta">${V.badge(K.status(r))}<span>Submitted ${new Date(r.created_at).toLocaleDateString('en-PH')}</span></div>`+U.columns(
 U.panel('Your submitted configuration',B.configuration(r.snapshot))+U.panel('Reference images & notes',B.photos(r.snapshot.images)+`<p class="cake-notes">${E(r.snapshot.notes||'No additional notes.')}</p>`)+U.panel('Requested fulfillment',B.fulfillment(r.snapshot)),
 U.panel('Preliminary estimate',`<p class="payment-amount">${K.money(r.estimated_price)}</p><p class="muted">Submitted estimate. The final quotation includes design charges and delivery.</p>`)+
 (current?U.panel('Your quotations',versions.map(q=>`<a class="quote-history" href="#/${K.quotePath(q)}"><strong>Version ${q.version}</strong><span>${K.quoteLabel(q)}</span><b>${K.money(q.total)}</b></a>`).join('')):U.panel('Awaiting owner review','<p>Your cake request is saved. The bakery will review your design and schedule before issuing a quotation.</p><p class="muted">No payment is required and no slot is reserved yet.</p>'))+
 (o?U.link('orders/'+o.id,o.paid?'View cake order':'View pending purchase',true):'')+U.link('cake-requests','All requests')));
};
K.quotationView=(r,q)=>{
 if(!r||!q||q.requestId!==r.id)return U.empty('Quotation not found','This offer is not available for your account.',U.link('cake-requests','My requests'));
 const reason=K.quoteReason(q),o=K.orders.find(o=>o.quotationId===q.id),paid=o?.paid,locked=o&&['detected','delayed'].includes(o.payment);
 const pricing=`<dl class="commerce-totals"><div><dt>Cake options & design specification</dt><dd>${K.money(q.options_total)}</dd></div><div><dt>Selected add-ons</dt><dd>${K.money(q.addons_total)}</dd></div><div><dt>Custom design & decoration</dt><dd>${K.money(q.complexity_charge)}</dd></div><div><dt>Owner-managed delivery</dt><dd>${K.money(q.delivery_fee)}</dd></div><div class="grand-total"><dt>Total payable</dt><dd>${K.money(q.total)}</dd></div></dl>`;
 let actions='';if(paid)actions=U.alert(o.status==='payment-resolution'?'Payment recorded. The owner needs to resolve fulfillment. Do not pay again.':'Full payment confirmed.')+U.link('orders/'+o.id,'View cake order',true);
 else if(o)actions=U.alert(locked?'Payment verification is pending. Do not pay again.':'Quotation accepted. Your order is confirmed only after full payment.')+U.link('payment/'+o.id,locked?'Check payment status':'Continue payment',true);
 else if(!reason&&q.status==='issued')actions=V.button('quote-accept','Accept quotation',false,`data-id="${q.id}"`,true)+V.button('quote-decline','Decline quotation',false,`data-id="${q.id}"`);
 else actions=U.alert(reason||'This quotation cannot be accepted.',true);
 return U.page('Your Cake Quotation','Request '+r.id+' · Version '+q.version,`<div class="commerce-actions">${U.link('cake-requests/'+r.id,'Back to request')}${V.badge(K.quoteLabel(q))}</div>`+(K.message?U.alert(K.message,true):'')+U.columns(
 U.panel('Your custom cake',B.configuration(q.snapshot,false)+B.photos(q.snapshot.images)+`<h3>Customer design notes</h3><p class="cake-notes">${E(q.snapshot.notes||'No additional notes.')}</p>`)+
 U.panel('Bakery review',`<p>${E(q.owner_notes)}</p>`)+U.panel('Agreed fulfillment',B.fulfillment(q.snapshot))+
 U.panel('Quotation history',K.versions(r).map(version=>`<a class="quote-history" href="#/${K.quotePath(version)}" ${version.id===q.id?'aria-current="page"':''}><strong>Version ${version.version}</strong><span>${K.quoteLabel(version)}</span><b>${K.money(version.total)}</b></a>`).join('')),
 U.panel('Final quotation',U.alert('Your original estimate was '+K.money(r.estimated_price)+'. The quotation reflects the owner’s design review and delivery arrangements.')+pricing)+
 U.panel('Validity & confirmation',`<p>Valid until ${new Date(q.expires_at).toLocaleString('en-PH',{timeZone:'Asia/Manila'})} (Manila).</p><p class="muted">Full QR Ph payment and availability validation confirm your order.</p><div class="commerce-stack">${actions}</div>`)+U.panel('Need adjustments?',`<p>Discuss changes with the bakery using reference ${E(r.id)} before accepting.</p>${U.button('contact','Contact Kitchen406')}`)));
};
K.requestsView=()=>{
 const parts=V.parts;if(parts[1])return parts[2]==='quotations'?K.quotationView(K.request(parts[1]),K.quote(parts[3])):K.requestDetail(K.request(parts[1]));
 const all=K.mock.page==='empty'?[]:K.list(),list=all.filter(r=>K.filter==='all'||r.status===K.filter);
 return V.accountPage('Custom Cake Requests','View your requests, quotations, and next steps.',`<div class="commerce-actions">${V.button('cake-start','+ New cake request',false,'',true)}<label for="cake-filter">Status</label><select id="cake-filter"><option value="all">All requests</option>${['pending_review','negotiating','quoted','accepted','rejected','expired'].map(status=>`<option value="${status}" ${K.filter===status?'selected':''}>${K.status({status})}</option>`).join('')}</select></div>`+(list.length?list.map(r=>U.panel(E(r.id),`<p>${U.date(r.snapshot.date)} · ${E(r.snapshot.windowLabel)}</p><p>Preliminary estimate ${K.money(r.estimated_price)}</p>${V.badge(K.status(r))}<div class="commerce-actions">${U.link('cake-requests/'+r.id,'View request',true)}${K.versions(r)[0]?U.link(K.quotePath(K.versions(r)[0]),'Review quotation'):''}</div>`)).join(''):U.empty('No cake requests here','Start a request or choose another status.',V.button('cake-start','Request a cake'))));
};
document.addEventListener('change',e=>{if(e.target.id==='cake-filter'){K.filter=e.target.value;V.render();}});
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-p4]');if(!el||el.disabled||!A.account.allowed())return;
 const action=el.dataset.p4,q=K.quote(el.dataset.id);
 if(action==='quote-accept'&&q)V.open('Accept cake quotation',`<p>You are accepting Version ${q.version} for ${E(q.requestId)}.</p><p>${U.date(q.snapshot.date)} · ${E(q.snapshot.windowLabel)}</p><p class="payment-amount">${K.money(q.total)}</p><p>Acceptance agrees to the quotation. Your order is confirmed after full QR Ph payment.</p>${V.formError()}<div class="commerce-actions">${V.button('close','Go back')}${V.button('quote-confirm','Confirm acceptance',false,`data-id="${q.id}"`,true)}</div>`,'accept');
 if(action==='quote-confirm'){const o=K.accept(q);if(o){A.closeModal();location.hash='#/payment/'+o.id;}else V.error(K.message);}
 if(action==='quote-decline'&&q)V.open('Decline this quotation?',`<form id="quote-decline-form" data-id="${q.id}" class="auth-form"><p>The bakery can prepare a revised offer if you need changes.</p><div class="field"><label for="quote-reason">Optional notes for the owner</label><textarea id="quote-reason" name="reason" rows="4" maxlength="600"></textarea></div>${V.formError()}<div class="commerce-actions">${V.button('close','Keep reviewing')}<button class="btn primary">Confirm decline</button></div></form>`,'decline');
});
document.addEventListener('submit',e=>{if(e.target.id!=='quote-decline-form')return;e.preventDefault();const error=K.decline(K.quote(e.target.dataset.id),new FormData(e.target).get('reason'));if(error)V.error(error);else{A.closeModal();V.render();A.toast('Your response has been saved.');}});
})();
