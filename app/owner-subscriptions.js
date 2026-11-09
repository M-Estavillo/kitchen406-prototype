/* Owner subscription views share customer records, schedules and allocation state. */
(() => {
const A=K406,B=A.subscriptions,V=A.ownerUI,E=A.escape;
const name=r=>{const c=A.operations.customer(r.customer_id);return c?c.first_name+' '+c.last_name:r.customer_id||'Customer not recorded';};
const nav=()=>`<nav class="owner-subscription-tabs" aria-label="Subscription sections">${[['','Records'],['schedules','Offerings'],['requests','Deferment history']].map(([p,l])=>`<a href="#/owner/subscriptions${p?'/'+p:''}" ${(!A.owner.parts[2]&&!p)||A.owner.parts[2]===p?'aria-current="page"':''}>${l}</a>`).join('')}</nav>`;
const intro=(title,body)=>V.intro(title,body)+nav();

function offerings(){
 const products=new Map(A.products.map(p=>[p.id,p.name]));
 const rows=B.schedules.map(s=>`<tr><td>${E(products.get(s.product_id)||'Product unavailable')}</td>
  <td>${B.weekdays[s.preparation_day]||'Not set'}</td><td>${B.weekdays[s.day]||'Not set'}</td>
  <td>${V.badge(s.status||'active')}</td><td>${V.button('schedule','Edit',`data-id="${E(s.id)}"`)}</td></tr>`);
 return intro('Offerings','Edits apply to future enrollments. Existing dates and allocations are preserved.')+
  V.panel('Subscription Offerings',`<div class="owner-weekly-schedules">${V.table(['Product','Preparation','Fulfillment','Status','Action'],rows)}</div>`,V.button('schedule','Add offering'));
}

function renderSubscriptions(){
 const page=A.owner.parts[2];
 if(page==='schedules')return offerings();
 if(page==='requests')return requests();
 if(page){const r=B.allRecords().find(r=>r.id===page);if(!r)return intro('Subscription not found','This reference is unavailable.');B.sync(r);const p=A.operations.purchases().find(p=>p.id===r.purchaseId),s=r.snapshot;
 const facts=rows=>`<dl class="owner-detail-facts">${rows.map(([label,value])=>`<div><dt>${E(label)}</dt><dd>${E(value)}</dd></div>`).join('')}</dl>`;
 const address=s.address?[s.address.add_line_1,s.address.add_line_2,s.address.barangay,s.address.city,s.address.postal_code].filter(Boolean).join(', '):'';
 return V.intro(r.id,name(r))+`<div class="owner-cake-back">${V.link('subscriptions','Back to subscriptions')}</div><div class="owner-subscription-detail-grid">${V.panel('Enrollment overview',facts([['Product',s.name],['Variant',s.variant],['Weekly quantity',s.quantity],['Schedule',s.schedule],['Fulfillment',s.method==='pickup'?'Bakery pickup':'Delivery'],...(address?[['Address',address]]:[])]),V.badge(r.status))}${V.panel('Payment & progress',facts([['Prepaid total',V.money(s.total)],['Enrolled',V.stamp(r.created)],['Paid',V.stamp(p?.paidAt)],['Fulfillments completed',r.deliveries.filter(d=>d.status==='fulfilled').length+'/4'],['Deferments used',r.deferments.length+'/1']]),V.link('orders/'+r.purchaseId,'View payment'))}</div>${V.panel('Four weekly fulfillments',`<ol class="owner-subscription-schedule">${r.deliveries.map(d=>`<li><strong class="owner-subscription-cycle">${d.cycle}</strong><div><time>${V.date(d.date)}</time><p>${d.date!==d.originalDate?'Deferred from '+V.date(d.originalDate):'Original schedule'}</p></div>${V.badge(d.status)}${V.link('orders/'+d.orderId,'View order')}</li>`).join('')}</ol>`)}${V.panel('Deferment history',r.deferments.map(d=>`<div class="owner-subscription-history"><span>${V.date(d.originalDate)}</span><span aria-hidden="true">→</span><strong>${V.date(d.newDate)}</strong></div>`).join('')||'<p class="muted">No deferments recorded.</p>',V.link('subscriptions/requests','View history'))}`;

 }
 let list=V.filtered(B.allRecords().map(r=>B.sync(r)),r=>[r.id,name(r),r.snapshot.name,r.snapshot.variant].join(' '),r=>V.businessDate(r.created),r=>r.status);
 return intro('Subscriptions','Four prepaid weekly fulfillments. No automatic renewal.')+V.compactFilters('Search subscriptions or customers',V.select('type','Status',[['all','All statuses'],['active','Active'],['completed','Completed'],['cancelled','Cancelled']],A.owner.filters.type),'owner-subscription-filters')+V.paged(list,subscriptionCards,false);
};
A.ownerPages.subscriptions=()=>`<div class="owner-subscriptions">${renderSubscriptions()}</div>`;
function subscriptionCards(rows){
 if(!rows.length)return '<p class="owner-orders-empty muted">No subscriptions match these filters.</p>';
 return `<div class="owner-subscription-list">${rows.map(r=>{const done=r.deliveries.filter(d=>d.status==='fulfilled').length,p=A.products.find(p=>p.id===r.snapshot.productId);return `<article class="owner-subscription-card"><img src="${E(p?.image||'assets/product-placeholder.svg')}" alt="" loading="lazy"><div class="owner-subscription-copy"><div class="owner-commitment-heading"><strong>${E(r.id)}</strong>${V.badge(r.status)}</div><p>${E(name(r))}</p><p class="muted">${E(r.snapshot.name)} · ${E(r.snapshot.variant)} · ${r.snapshot.quantity} per week</p></div><div class="owner-subscription-progress"><span>${done}/4 fulfilled</span><progress value="${done}" max="4" aria-label="Fulfillments completed"></progress><p>Next: ${B.next(r)?V.date(B.next(r).date):'No upcoming fulfillment'}</p></div><div class="owner-subscription-total"><strong>${V.money(r.snapshot.total)}</strong><span>Prepaid total</span>${V.link('subscriptions/'+encodeURIComponent(r.id),'View details')}</div></article>`;}).join('')}</div>`;
}

function requests(){const list=V.filtered(B.requests,r=>{const record=B.allRecords().find(s=>s.id===r.subscriptionId);return r.subscriptionId+' '+(record?name(record):'')+' '+r.notes;},r=>V.businessDate(r.created),r=>r.status);return intro('Deferment history','A read-only log of fulfillment date changes.')+V.compactFilters('Search requests or customers',V.select('type','Status',[['all','All statuses'],['applied','Applied'],['pending','Pending (legacy)'],['approved','Approved (legacy)'],['rejected','Rejected (legacy)']],A.owner.filters.type),'owner-subscription-filters')+V.paged(list,rows=>rows.length?`<div class="owner-defer-list">${rows.map(r=>{const record=B.allRecords().find(s=>s.id===r.subscriptionId),d=record?.deliveries.find(d=>d.id===r.deliveryId);return `<article class="owner-defer-card"><div class="owner-defer-card-copy"><div class="owner-commitment-heading"><strong>${E(r.subscriptionId)}</strong>${V.badge(r.status)}</div><p>${E(record?name(record):'Customer unavailable')}</p></div><div class="owner-defer-card-actions">${d?.orderId?V.link('orders/'+encodeURIComponent(d.orderId),'View order'):''}${V.button('defer-details','View details',`data-id="${E(r.id)}"`)}</div></article>`;}).join('')}</div>`:'<p class="owner-orders-empty muted">No deferment requests match these filters.</p>',false);}
function deferDetails(id){
 const r=B.requests.find(r=>r.id===id);if(!r)return;
 const record=B.allRecords().find(s=>s.id===r.subscriptionId),d=record?.deliveries.find(d=>d.id===r.deliveryId);
 A.owner.open('Deferment details',`<div class="owner-defer-details"><div class="owner-defer-detail-heading"><strong>${E(r.subscriptionId)}</strong>${V.badge(r.status)}</div><p class="muted">${E(record?name(record):'Customer unavailable')} &middot; Cycle ${d?.cycle||'—'}</p><p class="muted">Recorded ${E(V.stamp(r.created))}</p><dl class="owner-defer-dates"><div><dt>Original fulfillment</dt><dd>${V.date(r.originalDate)}</dd></div><div><dt>${['applied','approved'].includes(r.status)?'Rescheduled fulfillment':'Requested fulfillment'}</dt><dd>${V.date(r.target)}</dd></div></dl><section class="owner-defer-notes"><h3>Customer notes</h3><p>${E(r.notes||'No notes provided.')}</p></section></div>`);
}
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-owner=defer-details]');
 if(el&&!el.disabled&&A.session.ownerAllowed())deferDetails(el.dataset.id);
});
})();
