(() => {
const A=K406,K=A.cakes,V=A.ownerUI,E=A.escape,P=A.pricing,I=A.inventory;
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
 if(id==='options')return A.ownerPages.cakeOptions();
 if(id)return r?cakeRequestDetails(r):V.panel('Request not found','<p>This request is unavailable.</p>',V.link('cake-requests','Back to requests'));
 const filters=A.owner.filters;
 const status=V.select('type','Status',[['all','All statuses'],...Object.entries(cakeStatuses)],filters.type);
 const list=V.filtered(K.state.requests,null,r=>r.snapshot.date,r=>r.status);
 return V.intro('Custom Cake Requests','Review requests and quotations.',`<div class="owner-cake-tools">${V.button('pricing-settings','Costing settings')}${V.link('cake-requests/options','Cake Options')}</div>`)+
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
A.ownerPages.quotation=()=>{const r=K.state.requests.find(r=>r.id===A.owner.parts[2]);if(!r)return V.panel('Request not found','<p>Select a cake request first.</p>');const qid=A.owner.parts[4],q=K.versions(r).find(q=>q.id===qid);if(qid&&!q)return V.panel('Quotation not found','<p>This version does not belong to the selected request.</p>');if(q)return V.intro(q.id+' · Version '+q.version,'Issued snapshot · '+q.status,V.link('cake-requests/'+r.id,'Back to request'))+`<div class="staff-stack">${V.panel('Quoted design',specs(q.snapshot)+`<p>${E(q.owner_notes||'')}</p>`)}${V.panel('Fulfillment and price',`<p>${V.date(q.snapshot.date)} · ${E(q.snapshot.method||'delivery')}</p><p>Cake price ${K.money(q.total-q.delivery_fee)} · Delivery ${K.money(q.delivery_fee)}</p><p class="owner-total">${K.money(q.total)}</p><p>Expires ${E(V.stamp(q.expires_at))}</p><p>Full QR Ph payment is required before production confirmation.</p>`)}${V.panel('Customer notification',`<p>Delivery outcome: ${E(q.notification_status||'Not recorded')}</p>${V.table(['Attempt','Time','Email','SMS'],A.ownerCakes.notificationAttempts.filter(a=>a.quotation_id===q.id).map(a=>`<tr><td>${E(a.id)}</td><td>${E(V.stamp(a.created_at))}</td><td>${V.badge(a.channels.email)}</td><td>${V.badge(a.channels.sms)}</td></tr>`))}`,q.notification_status==='failed'?V.button('retry-notification','Retry notification',`data-id="${E(q.id)}"`):'')}${V.panel('Staff production copy',K.productionCopy(q)?`<p>${E(K.productionCopy(q).notes)}</p>`:'<p>No approved production copy.</p>',['issued','accepted'].includes(q.status)?V.button('production-copy','Review production copy',`data-id="${E(q.id)}"`):'')}</div>`;
 return cakeRequestDetails(r);
};
function appendAddon(form,id='',quantity='',key=crypto.randomUUID()){
 const choices=[['','Choose material'],...I.items.filter(item=>!item.archivedAt||item.id===id).map(item=>[item.id,item.name+' · '+item.unit])];
 const row=document.createElement('div');
 row.className='owner-costing-material';
 row.dataset.quoteAddon='';
 row.innerHTML=V.select('material-'+key,'Material',choices,id,'required')+
  V.field('quantity-'+key,'Quantity',quantity,'number','required min="0.001" step="0.001"')+
  V.button('quote-remove-material','Remove');
 form.querySelector('[data-quote-addons]').append(row);
}
document.addEventListener('click',e=>{
 const button=e.target.closest('[data-owner]');
 const form=button?.form;
 if(form?.dataset.ownerForm!=='quotation')return;
 if(button.dataset.owner==='quote-add-material')appendAddon(form);
 else if(button.dataset.owner==='quote-remove-material')button.closest('[data-quote-addon]').remove();
 else return;
 A.ownerCakeUI.preview(form);
 A.owner.capture(form);
});
document.addEventListener('input',e=>{
 if(e.target.name==='final-price'&&e.target.form?.dataset.ownerForm==='quotation')e.target.form.elements['price-override'].value='true';
});
A.ownerCakeUI={open(id){
 const r=K.state.requests.find(r=>r.id===id);
 if(!r||A.ownerCakes.locked(r)||r.status==='rejected'){A.toast('This request cannot receive a new quotation.');return;}
 const prior=K.versions(r)[0],s=prior?.snapshot||r.snapshot,address=s.address||r.snapshot.address||{};
 const quantities='<fieldset class="owner-quote-addons"><legend>Inventory add-ons</legend><div data-quote-addons></div>'+V.button('quote-add-material','Add material')+'</fieldset>';
 const method=V.select('method','Agreed fulfillment method',[['pickup','Bakery pickup'],['delivery','Owner delivery']],s.method||'delivery');
 const addressFields=V.field('street','Address line 1',address.add_line_1)+V.field('street2','Address line 2',address.add_line_2)+V.field('city','City',address.city)+V.field('postal','Postal code',address.postal_code)+V.field('barangay','Barangay',address.barangay)+V.field('landmark','Landmark or instructions',address.landmark);
 const body=`<p>${E(s.options.map(o=>o.name).join(' · '))}</p><input type="hidden" name="price-override" value="${!!prior}">
 <input type="hidden" name="costing-version" value="${P.settings.version}">`+quantities+V.field('date','Fulfillment date',s.date,'date','required')+method+'<fieldset data-quote-delivery><legend>Owner delivery</legend>'+addressFields+V.field('fee','Delivery fee (PHP)',(prior?.delivery_fee??0)/100,'number','min="0" step="0.01" required')+'</fieldset>'+
 V.field('final-price','Final cake price (₱)',prior?(prior.total-prior.delivery_fee)/100:'','number','required min="0.01" step="0.01"')+
 '<div class="field owner-quotation-notes"><label for="owner-notes">Owner design notes</label><textarea name="notes" id="owner-notes" maxlength="2000" rows="3">'+E(prior?.owner_notes||'')+'</textarea></div><section class="owner-quote-breakdown" aria-labelledby="owner-breakdown-title"><h3 id="owner-breakdown-title">Quoted price breakdown</h3><dl aria-live="polite" id="owner-quote-breakdown"></dl><p class="muted" data-pricing-status></p></section>'+V.error()+'<div class="owner-cake-modal-actions">'+V.button('cancel-cake-modal','Cancel')+'<button class="btn primary" type="submit">Issue quotation</button></div>';
 A.owner.open(prior?'Revise quotation':'Create quotation','<div class="owner-quotation"><h3>Quotation details</h3><form data-owner-form="quotation" class="staff-form" data-id="'+E(r.id)+'" data-version="'+(r.version||0)+'">'+body+'</form></div>');
 const form=A.$('owner-dialog-body').querySelector('form');
 const draft=A.owner.drafts.get(A.owner.draftKey(form));
 if(draft){
  const values=new Map(draft.values);
  for(const [name,id] of values){
   if(!name.startsWith('material-'))continue;
   const key=name.slice('material-'.length);
   appendAddon(form,id,values.get('quantity-'+key),key);
  }
 }else for(const [id,quantity] of Object.entries(K.materials([],s.addons)||{}))appendAddon(form,id,quantity);
 A.ownerCakeUI.preview(form);
},input(form){
 const data=new FormData(form),get=name=>String(data.get(name)??'').trim(),money=name=>Math.round(Number(get(name))*100);
 const method=get('method');
 return {date:get('date'),method,pricingVersion:Number(get('costing-version')),
  addonRows:[...form.querySelectorAll('[data-quote-addon]')].map(row=>({id:row.querySelector('select').value,quantity:row.querySelector('input').valueAsNumber})),
  address:method==='delivery'?{label:'Agreed delivery address',add_line_1:get('street'),add_line_2:get('street2'),city:get('city'),postal_code:get('postal'),barangay:get('barangay'),landmark:get('landmark')}:null,
  finalPrice:money('final-price'),fee:method==='delivery'?money('fee'):0,notes:get('notes')};
},preview(form){
 const input=A.ownerCakeUI.input(form);
 const prior=K.versions(K.state.requests.find(r=>r.id===form.dataset.id))[0];
 const options=(prior?.snapshot||K.state.requests.find(r=>r.id===form.dataset.id).snapshot).options;
 const toggle=form.querySelector('[data-quote-delivery]');
 toggle.hidden=toggle.disabled=input.method!=='delivery';
 const cost=A.ownerCakes.quoteMaterials(options,input.addonRows)?.pricing;
 const final=form.elements['final-price'];
 if(form.elements['price-override'].value!=='true')final.value=cost?.suggested>0?cost.suggested.toFixed(2):'';
 const cents=value=>Math.round(value*100);
 const rows=cost?[
  ['Materials',cents(cost.materials)],['Estimated labor',cents(cost.labor)],['Utility cost',cents(cost.overhead)],
  ['Estimated cost',cents(cost.total)],['Markup',cents(cost.markupAmount)],['Recommended cake price',cents(cost.suggested)],
  ['Delivery fee',input.fee],['Quote total',cents(final.valueAsNumber)+input.fee]
 ]:[['Recommended cake price',NaN]];
 form.querySelector('#owner-quote-breakdown').innerHTML=rows.map(([label,amount])=>'<div><dt>'+label+'</dt><dd>'+(Number.isFinite(amount)&&amount>=0?K.money(amount):'&mdash;')+'</dd></div>').join('');
 form.querySelector('button[type=submit]').disabled=!cost;
 form.querySelector('[data-pricing-status]').textContent=!cost?'Check cake materials, add-ons, recipe times and costing rates.':
  final.valueAsNumber<cost.total?'Final price is below estimated cost.':'';
},openRejection(id,version){
 const categories=A.ownerCakes.rejectionCategories.map(category=>[category,category]);
 A.owner.open('Reject cake request',`<form class="staff-form owner-cake-reject" data-owner-form="cake-reject" data-id="${E(id)}" data-version="${version}">
 <p class="muted">Rejecting ${E(id)} closes its open offers. The customer can see the reason and notes.</p>
 ${V.select('category','Reason category',[['','Choose a reason'],...categories],'','required')}
 <div class="field"><label for="owner-rejection-notes">Notes (optional)</label><textarea name="notes" id="owner-rejection-notes" rows="3" maxlength="600"></textarea></div>
 ${V.error()}<div class="owner-cake-modal-actions">${V.button('cancel-cake-modal','Cancel')}<button class="btn primary" type="submit">Reject request</button></div></form>`);
}};
})();
