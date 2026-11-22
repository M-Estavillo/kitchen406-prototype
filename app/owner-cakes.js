(() => {
const A=K406,K=A.cakes,V=A.ownerUI,E=A.escape;
const specs=s=>`<div class="staff-specs">${(s.options||[]).map(x=>`<p><strong>${E(x.type)}</strong><br>${E(x.name)}</p>`).join('')}</div>${(s.addons||[]).map(x=>`<p>${E(x.name)} × ${x.quantity}</p>`).join('')}<p>${E(s.notes||'')}</p><div class="staff-specs">${(s.images||[]).filter(i=>i?.url).map((i,n)=>`<img src="${E(i.url)}" alt="Customer reference ${n+1}">`).join('')}</div>`;
const cakeStatuses={pending_review:'Pending review',quoted:'Quotation ready',accepted:'Quotation accepted',rejected:'Rejected',expired:'Expired'};
const cakeStatus=r=>`<span class="order-badge owner-cake-status" data-status="${E(r.status)}">${E(cakeStatuses[r.status]||r.status)}</span>`;
function cakeRequestDetails(r){
 const s=r.snapshot,versions=K.versions(r),path='cake-requests/'+encodeURIComponent(r.id);
 const reason=K.dateReason(s.date)||K.materialReason(K.materials(s.options,s.addons));
 const closed=r.status==='rejected',locked=A.ownerCakes.locked(r);
 const order=K.orders.find(o=>o.requestId===r.id&&o.paid)||K.orders.find(o=>o.quotationId===r.accepted_quotation_id);
 const facts=entries=>`<dl class="owner-detail-facts">${entries.map(([label,value])=>`<div><dt>${E(label)}</dt><dd>${E(value)}</dd></div>`).join('')}</dl>`;
 const contact=s.contact||{},address=s.address||{};
 const fulfillment=[['Requested date',V.date(s.date)],['Method',s.method==='pickup'?'Bakery pickup':'Owner delivery']];
 if(s.method==='delivery')fulfillment.push(['Delivery address',[address.add_line_1,address.add_line_2,address.barangay,address.city,address.postal_code].filter(Boolean).join(', ')||'Not recorded']);
 const photos=(s.images||[]).filter(image=>image?.url).map((image,index)=>`<img src="${E(image.url)}" alt="Customer reference ${index+1}">`).join('');
 const actions=closed||locked?'':V.button('create-quotation','Create quotation',`data-id="${E(r.id)}"`,true)+V.button('reject-request','Reject request',`data-id="${E(r.id)}" data-version="${r.version||0}"`);
 const review=closed?'This request is closed.':locked?'The accepted quotation or payment activity locks further offers.':reason||'The requested date and materials are currently available. Review the design before issuing a quotation.';
 const reviewPanel=r.status==='rejected'?V.panel('Rejection reason',K.rejectionSummary(r),cakeStatus(r)):V.panel('Review',`<p>${E(review)}</p>${actions?`<div class="owner-cake-review-actions">${actions}</div>`:''}`,cakeStatus(r));
 return V.intro('Cake Request '+r.id,'Submitted '+V.stamp(r.created_at))+
  `<div class="owner-cake-detail"><div class="owner-cake-back">${V.link('cake-requests','Back to requests')}</div><div class="owner-cake-detail-columns"><div class="owner-detail-column">${V.panel('Selected cake options',K.optionsSummary(s))}${V.panel('Reference images & notes',(photos?`<div class="owner-cake-reference-images">${photos}</div>`:'<p class="muted">No reference images.</p>')+`<p>${E(s.notes||'No additional notes.')}</p>`)}${V.panel('Requested fulfillment',facts(fulfillment))}</div><div class="owner-detail-column">${V.panel('Customer details',facts([['Name',contact.name||'Not recorded'],...(contact.email?[['Email',contact.email]]:[]),...(contact.mobile_number?[['Phone',contact.mobile_number]]:[])]))}${reviewPanel}${V.panel('Preliminary estimate',`<p>${K.money(r.estimated_price)}</p><p class="muted">The final quotation includes any design and delivery charges.</p>`)}${V.panel('Quotation history',versions.length?`<div class="owner-cake-quote-list">${versions.map(q=>`<a href="#/owner/${E(path+'/quotation/'+encodeURIComponent(q.id))}"><strong>Version ${q.version}</strong>${V.badge(q.status)}<span>${K.money(q.total)}</span></a>`).join('')}</div>`:'<p class="muted">No quotations issued.</p>')}${order?V.link('orders/'+encodeURIComponent(order.id),order.paid?'View cake order':'View pending purchase'):''}</div></div></div>`;
}
A.ownerPages.cakes=()=>{
 const id=A.owner.parts[2],r=K.state.requests.find(r=>r.id===id);
 if(id)return r?cakeRequestDetails(r):V.panel('Request not found','<p>This request is unavailable.</p>',V.link('cake-requests','Back to requests'));
 const filters=A.owner.filters;
 const status=V.select('type','Status',[['all','All statuses'],...Object.entries(cakeStatuses)],filters.type);
 const list=V.filtered(K.state.requests,null,r=>r.snapshot.date,r=>r.status);
 return V.intro('Custom Cake Requests','Review original designs, feasibility, and quotation history.')+
  V.compactFilters(null,status,'owner-cake-filters')+V.paged(list,cakeRequestCards,false);
};
function cakeRequestCards(requests){
 if(!requests.length)return '<p class="muted owner-orders-empty">No cake requests match these filters.</p>';
 return `<div class="owner-cake-list">${requests.map(r=>{
  const snapshot=r.snapshot,thumbnail=snapshot.images?.find(image=>image?.url)?.url||'assets/custom-cake.png';
  const design=(snapshot.options||[]).filter(option=>['shape','flavor','size'].includes(option.type)).map(option=>option.name).join(' · ');
  return `<article class="owner-cake-card"><img src="${E(thumbnail)}" alt="" loading="lazy"><div class="owner-cake-card-copy"><div class="owner-commitment-heading"><strong>${E(r.id)}</strong>${cakeStatus(r)}</div><p>${E(snapshot.contact?.name||'Customer not recorded')}</p>${design?`<p class="muted">${E(design)}</p>`:''}</div><div class="owner-cake-card-meta"><p>${V.date(snapshot.date)}</p><p class="muted">Estimate · ${K.money(r.estimated_price)}</p>${V.link('cake-requests/'+encodeURIComponent(r.id),'View details')}</div></article>`;
 }).join('')}</div>`;
}
A.ownerPages.quotation=()=>{const r=K.state.requests.find(r=>r.id===A.owner.parts[2]);if(!r)return V.panel('Request not found','<p>Select a cake request first.</p>');const qid=A.owner.parts[4],q=K.versions(r).find(q=>q.id===qid);if(qid&&!q)return V.panel('Quotation not found','<p>This version does not belong to the selected request.</p>');if(q)return V.intro(q.id+' · Version '+q.version,'Issued snapshot · '+q.status,V.link('cake-requests/'+r.id,'Back to request'))+`<div class="staff-stack">${V.panel('Quoted design',specs(q.snapshot)+`<p>${E(q.owner_notes||'')}</p>`)}${V.panel('Fulfillment and price',`<p>${V.date(q.snapshot.date)} · ${E(q.snapshot.method||'delivery')}</p><p>Selections ${K.money(q.options_total+q.addons_total)} + complexity ${K.money(q.complexity_charge)} + delivery ${K.money(q.delivery_fee)}</p><p class="owner-total">${K.money(q.total)}</p><p>Expires ${E(V.stamp(q.expires_at))}</p><p>Full QR Ph payment is required before production confirmation.</p>`)}${V.panel('Customer notification',`<p>Delivery outcome: ${E(q.notification_status||'Not recorded')}</p>${V.table(['Attempt','Time','Email','SMS'],A.ownerCakes.notificationAttempts.filter(a=>a.quotation_id===q.id).map(a=>`<tr><td>${E(a.id)}</td><td>${E(V.stamp(a.created_at))}</td><td>${V.badge(a.channels.email)}</td><td>${V.badge(a.channels.sms)}</td></tr>`))}`,q.notification_status==='failed'?V.button('retry-notification','Retry notification',`data-id="${E(q.id)}"`):'')}${V.panel('Staff production copy',K.productionCopy(q)?`<p>${E(K.productionCopy(q).notes)}</p>`:'<p>No approved production copy.</p>',['issued','accepted'].includes(q.status)?V.button('production-copy','Review production copy',`data-id="${E(q.id)}"`):'')}</div>`;
 return cakeRequestDetails(r);
};
A.ownerCakeUI={open(id){
 const r=K.state.requests.find(r=>r.id===id);
 if(!r||A.ownerCakes.locked(r)||r.status==='rejected'){A.toast('This request cannot receive a new quotation.');return;}
 const T=A.cakeData,prior=K.versions(r)[0],s=prior?.snapshot||r.snapshot,address=s.address||r.snapshot.address||{};
 const options=T.categories.map(type=>V.select('option-'+type,type[0].toUpperCase()+type.slice(1),T.options.filter(o=>o.type===type&&o.available).map(o=>[o.id,o.name+' ('+K.money(o.price)+')']),s.options.find(o=>o.type===type)?.id)).join('');
 const quantities=T.addons.filter(a=>a.available).map(a=>V.field('qty-'+a.id,a.name+' quantity',s.addons.find(x=>x.id===a.id)?.quantity||0,'number','min="0" max="20" step="1" required')).join('');
 const method=V.select('method','Agreed fulfillment method',[['pickup','Bakery pickup'],['delivery','Owner delivery']],s.method||'delivery');
 const addressFields=V.field('street','Address line 1',address.add_line_1)+V.field('street2','Address line 2',address.add_line_2)+V.field('city','City',address.city)+V.field('postal','Postal code',address.postal_code)+V.field('barangay','Barangay',address.barangay)+V.field('landmark','Landmark or instructions',address.landmark);
 const body=options+quantities+V.field('date','Fulfillment date',s.date,'date','required')+method+'<fieldset data-quote-delivery><legend>Owner delivery</legend>'+addressFields+V.field('fee','Delivery fee (PHP)',(prior?.delivery_fee??0)/100,'number','min="0" step="0.01" required')+'</fieldset>'+
 V.field('addons','Add-ons charge (PHP)',(prior?.addons_total??s.addons.reduce((n,x)=>n+x.price*x.quantity,0))/100,'number','min="0" step="0.01" required')+
 V.field('complexity','Complexity charge (PHP)',(prior?.complexity_charge??0)/100,'number','min="0" step="0.01" required')+
 '<div class="field owner-quotation-notes"><label for="owner-notes">Owner design notes</label><textarea name="notes" id="owner-notes" maxlength="2000" rows="3">'+E(prior?.owner_notes||'')+'</textarea></div><section class="owner-quote-breakdown" aria-labelledby="owner-breakdown-title"><h3 id="owner-breakdown-title">Quoted price breakdown</h3><dl aria-live="polite" id="owner-quote-breakdown"></dl></section>'+V.error()+'<div class="owner-cake-modal-actions">'+V.button('cancel-cake-modal','Cancel')+'<button class="btn primary" type="submit">Issue quotation</button></div>';
 A.owner.open(prior?'Revise quotation':'Create quotation','<div class="owner-quotation"><h3>Quotation details</h3><form data-owner-form="quotation" class="staff-form" data-id="'+E(r.id)+'" data-version="'+(r.version||0)+'">'+body+'</form></div>');
 A.ownerCakeUI.preview(A.$('owner-dialog-body').querySelector('form'));
},input(form){
 const data=new FormData(form),get=name=>String(data.get(name)??'').trim(),money=name=>Math.round(Number(get(name))*100);
 const T=A.cakeData,method=get('method');
 return {date:get('date'),method,options:Object.fromEntries(T.categories.map(type=>[type,get('option-'+type)])),
  addonQuantities:Object.fromEntries(T.addons.filter(a=>a.available).map(a=>[a.id,Number(get('qty-'+a.id))])),
  address:method==='delivery'?{label:'Agreed delivery address',add_line_1:get('street'),add_line_2:get('street2'),city:get('city'),postal_code:get('postal'),barangay:get('barangay'),landmark:get('landmark')}:null,
  complexity:money('complexity'),addons:money('addons'),fee:method==='delivery'?money('fee'):0,notes:get('notes')};
},preview(form){
 const input=A.ownerCakeUI.input(form),T=A.cakeData;
 form.querySelector('[data-quote-delivery]').hidden=input.method!=='delivery';
 const selections=T.options.filter(o=>o.id===input.options[o.type]).reduce((n,o)=>n+o.price,0);
 const rows=[['Selections',selections],['Add-ons',input.addons],['Complexity charge',input.complexity],['Delivery fee',input.fee],['Total',selections+input.addons+input.complexity+input.fee]];
 form.querySelector('#owner-quote-breakdown').innerHTML=rows.map(([label,amount])=>'<div><dt>'+label+'</dt><dd>'+(Number.isFinite(amount)&&amount>=0?K.money(amount):'&mdash;')+'</dd></div>').join('');
},openRejection(id,version){
 const categories=A.ownerCakes.rejectionCategories.map(category=>[category,category]);
 A.owner.open('Reject cake request',`<form class="staff-form owner-cake-reject" data-owner-form="cake-reject" data-id="${E(id)}" data-version="${version}">
 <p class="muted">Rejecting ${E(id)} closes its open offers. The customer can see the reason and notes.</p>
 ${V.select('category','Reason category',[['','Choose a reason'],...categories],'','required')}
 <div class="field"><label for="owner-rejection-notes">Notes (optional)</label><textarea name="notes" id="owner-rejection-notes" rows="3" maxlength="600"></textarea></div>
 ${V.error()}<div class="owner-cake-modal-actions">${V.button('cancel-cake-modal','Cancel')}<button class="btn primary" type="submit">Reject request</button></div></form>`);
}};
})();
