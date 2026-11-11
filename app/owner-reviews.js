/* Shared feedback preserves purchase snapshots and moderation history. */
(() => {
const A=K406,V=A.ownerUI,E=A.escape,O=A.owner;
const R=A.reviews={records:[]};
R.capture=()=>{
 const s=A.product.state,key=s.reviewKey,order=A.operations.orders().find(o=>(o.items||[]).some(i=>o.id+':'+i.key===key)),item=order?.items.find(i=>order.id+':'+i.key===key);
 if(!A.account.owns(order)||!A.commerce.orders.reviewable(order)||!item||R.records.some(r=>r.key===key))return false;
 R.records.push({id:crypto.randomUUID(),key,orderId:order.id,productId:item.productId,product:item.name,variant:item.variant,customer:A.account.name(),rating:s.rating,comment:A.$('reviewCommentInput').value,images:s.photos.filter(Boolean).map(()=>item.image).filter(Boolean),created:new Date().toISOString(),hidden:false,history:[],version:0});
 return true;
};
R.public=()=>{
 const node=A.$('reviewsPopulatedState');if(!node)return;const id=A.product.state.id,product=A.products.find(p=>p.id===id),rows=R.records.filter(r=>r.productId===id&&!r.hidden);
 const samples={
  1:['The chocolate filling is generous and the loaf is wonderfully soft.','Delicious toasted with coffee the next morning.'],
  2:['A crisp crust with a lovely chewy centre.','The tangy flavour makes excellent toast.'],
  3:['Flaky, buttery layers with just the right amount of cardamom.','The caramelised edges were my favourite part.'],
  4:['Soft and fluffy, perfect for sandwiches.','Beautiful thick slices and a gentle milky flavour.']
 };
 if(!R.records.some(r=>r.productId===id)&&samples[id])rows.push(...samples[id].map((comment,index)=>({customer:index?'Paolo R.':'Mika S.',rating:index?4:5,product:product.name,variant:product.variants[0].label,comment,images:index?[]:[product.image]})));
 node.innerHTML=rows.map(r=>`<article class="commerce-card"><strong>${E(r.customer)}</strong><p>${r.rating} / 5 · ${E(r.product)} · ${E(r.variant||'')}</p><p>${E(r.comment)}</p>${r.images.map(src=>`<a href="${E(src)}" target="_blank" rel="noopener"><img class="owner-marketing-thumb" src="${E(src)}" alt="Customer review photo"></a>`).join('')}</article>`).join('')||'<p>No reviews yet.</p>';
 A.$('review-summary').textContent=rows.length?`${(rows.reduce((n,r)=>n+r.rating,0)/rows.length).toFixed(1)} / 5 · ${rows.length} reviews`:'No reviews yet.';
 return rows.length;
};


const reasons=['Spam','Abusive language','Off-topic content','Sexual content','Other'];
function detail(r){O.open('Review details',`<div class="owner-review-detail"><section class="owner-review-feedback" aria-label="Customer feedback"><div class="owner-review-feedback-heading"><div><strong class="owner-review-customer">${E(r.customer)}</strong><p class="owner-review-submitted">Submitted ${E(V.stamp(r.created))}</p></div><div class="owner-review-score" aria-label="${r.rating} out of 5 stars"><span aria-hidden="true">${'&#9733;'.repeat(r.rating)}<span class="owner-review-empty-stars">${'&#9733;'.repeat(5-r.rating)}</span></span><strong>${r.rating}<small> / 5</small></strong></div></div><p class="owner-caption owner-review-comment">${E(r.comment||'No written comment.')}</p></section><div class="owner-review-supporting">${r.images.length?`<div class="owner-review-images">${r.images.map(src=>`<a href="${E(src)}" target="_blank" rel="noopener"><img src="${E(src)}" alt="Customer review photo"></a>`).join('')}</div>`:''}<dl class="owner-review-context"><div><dt>Product</dt><dd>${E(r.product)}${r.variant?`<span>${E(r.variant)}</span>`:''}</dd></div><div><dt>Purchase</dt><dd><a href="#/owner/orders/${E(r.orderId)}">${E(r.orderId)}</a></dd></div></dl></div><form data-review-form="${E(r.id)}" data-version="${r.version}" class="staff-form"><div class="owner-review-visibility"><div><strong>Public visibility</strong><p class="muted">Visible reviews appear on the product page.</p></div><label class="owner-review-switch"><input type="checkbox" role="switch" name="visible" aria-label="Review visible" ${r.hidden?'':'checked'}><span class="owner-toggle-track" aria-hidden="true"></span><span class="owner-review-switch-label" aria-hidden="true"></span></label></div><div class="owner-review-reason" hidden>${V.select('reason','Reason for hiding',reasons.map(s=>[s,s]),'Spam')}${V.field('notes','Additional details (required for Other)')}</div>${V.error()}<div class="staff-actions">${V.button('discard-modal','Cancel')}<button class="btn primary">Save visibility</button></div></form><details class="owner-review-history" open><summary><span>Moderation history <span class="owner-review-history-count">${r.history.length}</span></span><span class="owner-review-history-chevron" aria-hidden="true">&#8964;</span></summary>${r.history.length?`<p class="owner-review-history-hint">Latest activity first</p><ol class="owner-review-timeline">${r.history.slice().reverse().map(h=>`<li class="${h.action==='Hidden'?'hidden-review':'restored-review'}"><div class="owner-review-event-heading"><strong>${h.action==='Hidden'?'Review hidden':h.action==='Restored'?'Visibility restored':E(h.action)}</strong><time datetime="${E(h.at)}">${E(V.stamp(h.at))}</time></div><p class="owner-review-event-reason">${E(h.reason)}</p><p class="owner-review-event-actor">By ${E(h.actor)}</p></li>`).join('')}</ol>`:'<div class="owner-review-history-empty"><span aria-hidden="true">&#10003;</span><div><strong>No moderation activity</strong><p>Visibility changes and their reasons will appear here.</p></div></div>'}</details></div>`);}
A.ownerPages.reviews=()=>{
 if(O.parts[2]){location.replace('#/owner/reviews');return '';}
 const f=O.filters,ratings=f.ratings||[];
 let rows=R.records.filter(r=>(!f.query||(r.customer+' '+r.product+' '+r.comment).toLowerCase().includes(f.query.toLowerCase()))&&(f.type==='all'||(r.hidden?'hidden':'visible')===f.type)&&(!ratings.length||ratings.includes(r.rating))).sort((a,b)=>a.created.localeCompare(b.created)*(f.sort==='oldest'?1:-1));
 const pills=[['all','All'],['visible','Visible'],['hidden','Hidden']].map(([value,label])=>V.button('review-filter',label,`data-value="${value}" aria-pressed="${f.type===value}"`)).join('');
 return V.intro('Customer Reviews','Feedback from completed purchases.')+`<div class="owner-reviews"><div class="owner-order-tabs" role="group" aria-label="Review visibility">${pills}</div><div class="owner-order-filters owner-review-filters">${V.field('query','Search',f.query,'search','placeholder="Search reviews"')}<div class="field owner-review-ratings"><label id="review-rating-label">Ratings</label><details><summary aria-labelledby="review-rating-label review-rating-value"><span id="review-rating-value">${ratings.length?ratings.slice().sort((a,b)=>b-a).join(', ')+' stars':'All ratings'}</span><span aria-hidden="true">⌄</span></summary><div class="owner-review-rating-options" role="group" aria-label="Filter by ratings">${[5,4,3,2,1].map(n=>`<label><input type="checkbox" data-review-rating="${n}" ${ratings.includes(n)?'checked':''}>${n} ${n===1?'star':'stars'}</label>`).join('')}</div></details></div>${V.select('sort','Sort',[['newest','Newest first'],['oldest','Oldest first']],f.sort)}${V.button('clear-filters','Clear filters')}</div>${V.paged(rows,rs=>rs.length?V.table(['Customer','Product','Rating','Visibility','Action'],rs.map(r=>`<tr><td>${E(r.customer)}</td><td>${E(r.product)}</td><td><span class="owner-review-rating">${r.rating} / 5</span></td><td>${V.badge(r.hidden?'hidden':'visible')}</td><td>${V.button('review-details','View details',`data-id="${E(r.id)}"`)}</td></tr>`)):V.panel('No reviews found','<p>Try different filters or clear filters to see all reviews.</p>'))}</div>`;
};
document.addEventListener('click',e=>{
 if(!A.session.ownerAllowed())return;
 const el=e.target.closest('[data-owner]');
 if(el?.dataset.owner==='review-details'){const r=R.records.find(r=>r.id===el.dataset.id);if(r)detail(r);}
 if(el?.dataset.owner==='review-filter'){O.filters.type=el.dataset.value;O.page=1;O.render();document.querySelector(`[data-owner="review-filter"][data-value="${el.dataset.value}"]`)?.focus();}
 const dropdown=document.querySelector('.owner-review-ratings details');if(dropdown&&!dropdown.contains(e.target))dropdown.open=false;
});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){const dropdown=document.querySelector('.owner-review-ratings details[open]');if(dropdown){dropdown.open=false;dropdown.querySelector('summary').focus();}}});
document.addEventListener('change',e=>{
 if(!A.session.ownerAllowed())return;
 if(e.target.matches('[data-review-rating]')){const n=Number(e.target.dataset.reviewRating),ratings=new Set(O.filters.ratings||[]);if(e.target.checked)ratings.add(n);else ratings.delete(n);O.filters.ratings=[...ratings];O.page=1;O.render();document.querySelector('.owner-review-ratings details').open=true;document.querySelector(`[data-review-rating="${n}"]`).focus();}
 const f=e.target.closest('[data-review-form]');if(f&&e.target.name==='visible'){const r=R.records.find(r=>r.id===f.dataset.reviewForm);f.querySelector('.owner-review-reason').hidden=e.target.checked||r?.hidden;}
});
document.addEventListener('submit',e=>{
 const f=e.target;if(!f.dataset.reviewForm)return;e.preventDefault();if(!A.session.ownerAllowed())return;
 const r=R.records.find(r=>r.id===f.dataset.reviewForm),data=Object.fromEntries(new FormData(f)),hidden=!f.elements.visible.checked;let error='';
 if(!r||r.version!==Number(f.dataset.version))error='Review changed. Reopen this dialog.';
 else if(O.saveError)error='Changes could not be saved. Please retry.';
 else if(hidden&&!r.hidden&&(!reasons.includes(data.reason)||data.reason==='Other'&&!data.notes.trim()))error='Specify a moderation reason.';
 if(error){f.querySelector('.owner-error').textContent=error;return;}
 if(hidden!==r.hidden){r.hidden=hidden;r.version++;r.history.push({action:hidden?'Hidden':'Restored',reason:hidden?data.reason+(data.notes?': '+data.notes.trim():''):'Visibility restored',actor:A.session.actor().name,at:new Date().toISOString()});A.toast('Review visibility updated.');}
 A.closeModal(true);O.render();
});
})();
