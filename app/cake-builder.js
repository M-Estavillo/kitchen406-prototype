(() => {
const A=K406,K=A.cakes,S=K.state,T=A.cakeData,C=A.commerce,U=C.ui,V=A.phase4,E=A.escape;
const B=K.builder={busy:false,uploadError:'',tokens:[0,0,0]};
const cakeReviews=[
 {name:'Mika S.',photo:'Pink buttercream cake with cherries',quote:'The vintage piping was lovely, and the cake tasted as good as it looked. It was the highlight of our birthday table.'},
 {name:'Paolo R.',photo:'Ivory buttercream cake with lavender flowers',quote:'The little lavender flowers matched our celebration perfectly. The bakery made the whole process easy, from the first sketch to pickup.'},
 {name:'Jenna L.',photo:'Chocolate cake with curls and gold accents',quote:'The chocolate cake was rich without being too sweet. Everyone asked for another slice, and the gold details looked beautiful in photos.'},
 {name:'Ana M.',photo:'Lemon yellow cake with piped daisies',quote:'The daisies were even prettier in person. The lemon cake was light and fresh, and our guests loved it.'},
 {name:'Luis D.',photo:'Pale blue cake with clouds and white stars',quote:'The clouds and stars were perfect for our baby shower. The cake was ready right on time and tasted wonderful.'}
];
function reviewCards(){
 return cakeReviews.map((review,index)=>{
  return `<article class="cake-review-card">
   <div class="cake-review-photo cake-review-photo-${index}" role="img" aria-label="${E(review.photo)}"></div>
   <div class="cake-review-copy"><div class="cake-review-person"><span class="cake-review-avatar" aria-hidden="true"><span class="material-symbols-outlined">person</span></span><h3>${E(review.name)}</h3></div>
   <blockquote>${E(review.quote)}</blockquote></div>
  </article>`;
 }).join('');
}
function cakeReviewSection(){
 return `<section id="cake-reviews" class="cake-reviews" aria-labelledby="cake-reviews-title" tabindex="-1">
  <h2 id="cake-reviews-title">Custom cake reviews</h2><p>Sample reviews and cake photos for this preview.</p>
  <div class="cake-review-stage">${reviewCards()}</div>
  <div class="cake-review-cta">${V.button('cake-start','Create my custom cake',false,'',true)}</div>
 </section>`;
}
B.landing=()=>`<section class="cake-hero"><div><h1 class="hero-title">Something worth<br>celebrating.</h1><p>Choose your cake, share your inspiration, and let Kitchen406 bring the details together. Every request is reviewed by the bakery before a final quotation.</p><div class="commerce-actions">${V.button('cake-start','Request a custom cake',false,'',true)}<a class="btn" href="#cake-reviews">See cake reviews</a></div></div><img src="assets/custom-cake.png" alt="A handcrafted celebration cake"></section><div class="cake-how">${[['01','Make it yours','Choose cake options and add your reference photos.'],['02','Bakery review','We review the design, requested date, and ingredients.'],['03','Review your quotation','Check the final design, delivery details, and total.'],['04','Accept and pay','Full payment confirms the order after availability checks.']].map(([n,title,copy])=>`<article><span>${n}</span><h2>${title}</h2><p>${copy}</p></article>`).join('')}</div>${cakeReviewSection()}`;
B.summary=()=>{
 const d=S.draft,estimate=K.estimate();
 return U.panel('Your cake request',`<dl class="cake-summary"><div><dt>Requested Date</dt><dd>${d.date?U.date(d.date):'Choose a requested date'}</dd></div>${T.categories.map(type=>`<div><dt>${E(type)}</dt><dd>${E(K.selected().find(o=>o.type===type)?.name||'Not selected')}</dd></div>`).join('')}</dl><dl class="commerce-totals"><div><dt>Cake options</dt><dd>${K.money(estimate.base)}</dd></div><div class="grand-total"><dt>Preliminary estimate</dt><dd>${estimate.complete?K.money(estimate.total):'—'}</dd></div></dl><p class="muted">The owner confirms the final price, design charges, and delivery fee after review.</p>`);
};
B.calendar=()=>{
 const start=new Date(Date.UTC(K.year,K.month,1)),days=new Date(Date.UTC(K.year,K.month+1,0)).getUTCDate();
 return `<p class="muted cake-calendar-note">Dates respect lead time, cutoff, blocked dates, and custom cake availability.</p><div class="calendar-heading">${V.button('cake-month','‹',false,'data-delta="-1" aria-label="Previous month"')}<h3>${start.toLocaleDateString('en-PH',{month:'long',year:'numeric',timeZone:'UTC'})}</h3>${V.button('cake-month','›',false,'data-delta="1" aria-label="Next month"')}</div><div class="calendar-grid">${['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=>`<span class="muted">${d}</span>`).join('')}${'<span></span>'.repeat(start.getUTCDay())}${Array.from({length:days},(_,i)=>{const date=`${K.year}-${String(K.month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`,reason=K.requestDateReason(date);return `<button type="button" data-p4="cake-date" data-value="${date}" ${reason?'disabled':''} aria-pressed="${S.draft.date===date}" aria-label="${U.date(date)} ${E(reason||'Available')}">${i+1}<small>${reason?reason.includes('Weekly')?'Week full':reason.includes('blocked')?'Blocked':reason.includes('Past')?'Past':reason.includes('Lead')?'Lead time':'Full':'Open'}</small></button>`;}).join('')}</div>`;
};
B.skeleton=(label,rows=4)=>`<div role="status" aria-label="${E(label)}"><div aria-hidden="true">${Array.from({length:rows},()=>'<div class="cake-loading-row"><div class="cart-loading-block cart-loading-title"></div><div class="cart-loading-block cart-loading-detail"></div></div>').join('')}</div></div>`;
B.loading=()=>U.page('Custom cake request','',U.columns(U.panel('Cake request',B.skeleton('Loading cake request',5)),U.panel('Details',B.skeleton('Loading details',3))));
B.details=()=>{
 const d=S.draft,addresses=A.addresses.active(),dateReason=K.availabilityReason()||(d.date?K.dateReason(d.date):'');
 const dateBody=K.mock.availability==='loading'?B.skeleton('Checking cake availability',5):B.calendar();
 const addressBody=d.method==='delivery'?U.panel('Delivery address',addresses.length?addresses.map(a=>`<div class="address-choice cake-address-choice ${d.addressId===a.address_id?'selected':''}"><label><input type="radio" name="cake-address" value="${E(a.address_id)}" ${d.addressId===a.address_id?'checked':''}><strong>${E(a.label)}</strong>${U.address(a)}<p>${K.serviceable(a)?'Within delivery area':'Outside delivery area'}</p></label>${V.button('address-edit','Edit',false,`data-id="${E(a.address_id)}"`)}</div>`).join(''):'<p>No saved delivery addresses. Add one to continue.</p>',V.button('address-add','+ Add address'))+(K.addressUI.form?C.checkout.addressForm(K.addressUI).replace('data-commerce="address-cancel"','data-p4="address-cancel"'):''):'';
 const fulfillmentInfo=d.method==='pickup'?U.panel('Bakery pickup','<p>Kitchen406, Banilad, Metro Cebu</p><p class="muted">Collect your cake on your requested date. No delivery fee.</p>'):d.method==='delivery'?U.panel('Delivery area',`<p>Delivery is available within supported areas of Metro Cebu: ${E(T.config.cities.join(', '))}.</p><p class="muted">Choose an address within these areas. Delivery availability and the final delivery fee are confirmed in your quotation.</p>`):'';
 return U.columns(U.panel('Requested date',dateBody+(dateReason&&K.mock.availability!=='loading'?`<div class="cake-availability-status"><p role="status">${E(dateReason)}</p>${K.mock.availability==='error'?V.button('cake-retry','Try again'):''}</div>`:''))+addressBody,
 U.panel('Fulfillment method',`<div class="fulfillment-choices">${['pickup','delivery'].map(method=>V.button('cake-method',method==='pickup'?'Pickup':'Delivery',false,`data-value="${method}" aria-pressed="${d.method===method}"`)).join('')}</div>`)+fulfillmentInfo+
 (K.fulfillmentReason()&&!dateReason?`<p class="muted" role="status">${E(K.fulfillmentReason())}</p>`:'')+
 `<div class="cake-step-actions">${V.button('cake-next','Continue to cake options',!!K.fulfillmentReason()||!!K.addressUI.form,'data-step="options"',true)}${V.button('cake-cancel','Cancel request')}</div>`);
};
B.options=()=>{
 if(K.mock.options==='loading')return B.loading();
 if(K.mock.options!=='normal')return U.empty(K.mock.options==='loading'?'Loading cake options…':'Cake options could not be loaded','Your selections are preserved.',V.button('cake-retry','Try again'));
 return U.columns(T.categories.map(type=>U.panel('Cake '+type,`<p class="muted">Choose one · Required</p><div class="cake-options">${T.options.filter(o=>o.type===type).map(o=>`<button class="cake-option" type="button" data-p4="cake-option" data-type="${type}" data-id="${o.id}" aria-pressed="${S.draft.selections[type]===o.id}" ${o.available?'':'disabled'}><strong>${E(o.name)}</strong>${o.description?`<span>${E(o.description)}</span>`:''}<b>${o.price?K.money(o.price):'Included · '+K.money(0)}</b>${o.available?'':'<small>Unavailable</small>'}</button>`).join('')}</div>`,S.draft.selections[type]?'':'<span class="cake-required">Required*</span>')).join(''),
 B.summary()+(K.optionsReason()?U.alert(K.optionsReason()):'')+V.button('cake-next','Continue to references',!!K.optionsReason(),'data-step="references"',true)+U.link('custom-cakes/request/details','Back to fulfillment'));
};
B.photos=(images,editable=false)=>`<div class="cake-photos ${editable?'cake-reference-previews':''}">${images.map((item,index)=>item?`<section class="cake-reference-photo"><button type="button" class="cake-image-button" data-p4="cake-enlarge" data-url="${E(item.url)}" data-name="${E(item.name)}" aria-label="${E('Preview '+item.name)}"><img src="${E(item.url)}" alt="${E(item.name)}"></button><p class="cake-reference-name">${E(item.name)}</p>${editable?`<p class="muted" role="status">${item.status==='loading'?'Checking image?':item.size?(item.size/1024/1024).toFixed(1)+' MB':'Sample image'}</p><div class="cake-photo-actions"><button type="button" class="cake-photo-icon" data-p4="cake-image-add" data-slot="${index}" title="Replace image" aria-label="Replace ${E(item.name)}"><span class="material-symbols-outlined" aria-hidden="true">edit</span></button><button type="button" class="cake-photo-icon" data-p4="cake-image-remove" data-slot="${index}" aria-label="${E('Remove '+item.name)}" title="Remove image"><span class="material-symbols-outlined" aria-hidden="true">delete</span></button></div>`:''}</section>`:'').join('')}</div>`;
B.references=()=>{
 const slot=S.draft.images.findIndex(image=>!image),reason=B.uploadError||K.referencesReason();
 return U.columns(U.panel('Reference images',`<p class="muted">Choose up to 3 sample reference images.</p><button type="button" class="cake-reference-upload ${S.draft.images.some(Boolean)?'is-compact':''}" data-p4="cake-image-add" data-slot="${slot}" ${slot<0?'hidden disabled':''}><span class="material-symbols-outlined" aria-hidden="true">add_photo_alternate</span><span>${S.draft.images.some(Boolean)?'Add another image':'Add reference image'}</span></button>${B.photos(S.draft.images,true)}<p class="muted">Reference photos guide the design; they do not change your selected cake options.</p>`)+
 U.panel('Design notes',`<div class="field"><label for="cake-notes">Optional instructions for the bakery</label><textarea id="cake-notes" maxlength="600" rows="7" placeholder="Tell us which details to follow from your photos?">${E(S.draft.notes)}</textarea><p class="muted"><span id="cake-note-count">${S.draft.notes.length}</span> / 600 characters</p></div>`),
 B.summary()+`<div class="cake-reference-navigation">`+(reason?`<p class="cake-reference-error" role="alert">${E(reason)}</p>`:'')+`<div class="cake-step-actions">${V.button('cake-next','Continue to Review',!!K.referencesReason(),'data-step="review"',true)}${U.link('custom-cakes/request/options','Back to cake options')}</div></div>`);
};
B.configuration=(snapshot,showPrices=true)=>`<dl class="cake-specifications">${snapshot.options.map(o=>`<div><dt>${E(o.type)}</dt><dd>${E(o.name)}</dd>${showPrices?'<small>'+K.money(o.price)+'</small>':''}</div>`).join('')}</dl>${snapshot.addons.length?'<h3>Selected add-ons</h3>'+snapshot.addons.map(a=>`<p>${E(a.name)} × ${a.quantity} · ${showPrices?K.money(a.price*a.quantity):'Included in quotation'}</p>`).join(''):'<p class="muted">No add-ons selected.</p>'}`;
B.fulfillment=snapshot=>`<dl class="profile-details"><div><dt>Requested date</dt><dd>${U.date(snapshot.date)}</dd></div></dl><h3>${snapshot.method==='pickup'?'Bakery pickup':'Delivery'}</h3><p>${E(snapshot.contact.name)} · ${E(snapshot.contact.mobile_number)}</p>${snapshot.method==='pickup'?'<p>Collect your cake at the bakery on the confirmed date.</p>':U.address(snapshot.address)}`;
B.review=()=>{
 const estimate=K.estimate(),snap={options:K.selected(),addons:K.extras(),method:S.draft.method,address:S.draft.method==='pickup'?null:K.address(),contact:A.account.contact(),date:S.draft.date};
 if(S.draft.reviewedPrice===null)S.draft.reviewedPrice=estimate.total;
 return U.columns(U.panel('Cake configuration',`<div class="cake-review-configuration">${B.configuration(snap)}</div>`,U.link('custom-cakes/request/options','Edit options'))+
 U.panel('Reference images & notes',B.photos(S.draft.images)+`<p class="cake-notes">${E(S.draft.notes||'No additional design notes.')}</p>`,U.link('custom-cakes/request/references','Edit references'))+
 U.panel('Requested fulfillment',B.fulfillment(snap),U.link('custom-cakes/request/details','Edit fulfillment')),
 B.summary()+(S.draft.reviewedPrice!==estimate.total?U.alert('The estimate changed. Review the new amount before submitting.',true)+V.button('cake-price-accept','Accept updated estimate'):'')+
 U.panel('What happens next?','<ol class="payment-instructions"><li>The owner reviews your design, date, and ingredients.</li><li>You receive a final quotation with the delivery fee.</li><li>Accept and pay through QR Ph to confirm your order.</li></ol><p class="muted cake-payment-note">No payment is collected when you submit a request.</p>')+(K.message?`<p class="cake-submit-error" role="alert">${E(K.message)}</p>`:'')+`<div class="cake-step-actions">`+V.button('cake-submit',B.busy?'Submitting…':'Submit cake request',B.busy||S.draft.reviewedPrice!==estimate.total,'',true)+U.link('custom-cakes/request/references','Back to references')+'</div>');
};
B.view=step=>{
 if(S.draft.submittedId)return U.page('Request submitted','Your request is awaiting owner review.',U.empty('Your cake request is saved','Follow the request for quotations and updates.',U.link('cake-requests/'+S.draft.submittedId,'View request',true)+V.button('cake-start','Start another request')));
 let reason='',back='details';if(['options','references','review'].includes(step))reason=K.fulfillmentReason();if(!reason&&['references','review'].includes(step)){reason=K.optionsReason();back='options';}if(!reason&&step==='review'){reason=K.referencesReason();back='references';}
 const content=reason?U.empty('Complete the earlier step',reason,U.link('custom-cakes/request/'+back,'Review '+back,true)):B[step]?B[step]():U.empty('Step not found','Return to your request.',U.link('custom-cakes/request/details','Date and fulfillment'));
 return U.page(({details:'Let’s plan your custom cake.',options:'Customize your cake.',references:'Reference Images & Notes',review:'Review your cake request'})[step]||'Custom cake request','Made to order, reviewed by the bakery.'+(step==='details'?' Your date is subject to confirmation.':''),(K.message&&(step!=='review'||reason)?U.alert(K.message,true):'')+content);
};
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-p4]');if(!el||el.disabled)return;const action=el.dataset.p4;
 if(action==='cake-start'){if(S.draft.submittedId)K.resetDraft();location.hash='#/custom-cakes/request/details';return;}
 if(action==='cake-enlarge'){V.open('Reference image',`<img class="reference-enlarged" src="${E(el.dataset.url)}" alt="${E(el.dataset.name)}"><p>${E(el.dataset.name)}</p>${V.button('close','Close preview')}`,'image');return;}
 if(!A.account.allowed())return;
 if(action==='cake-month'){const date=new Date(Date.UTC(K.year,K.month+Number(el.dataset.delta),1));K.year=date.getUTCFullYear();K.month=date.getUTCMonth();}
 if(action==='cake-method'&&['pickup','delivery'].includes(el.dataset.value)){S.draft.method=el.dataset.value;K.addressUI.form=null;K.addressUI.editing=null;}
 if(action==='cake-date'){if(K.requestDateReason(el.dataset.value))return;S.draft.date=el.dataset.value;}
 if(action==='cake-option'){S.draft.selections[el.dataset.type]=el.dataset.id;S.draft.reviewedPrice=null;}
 if(action==='cake-addon'){const id=el.dataset.id;S.draft.addons[id]=Math.max(0,Math.min(20,(S.draft.addons[id]||0)+Number(el.dataset.delta)));S.draft.reviewedPrice=null;}
 if(action==='cake-image-add'){
  const index=Number(el.dataset.slot);if(index<0||index>2)return;
  const old=S.draft.images[index];if(old?.url.startsWith('blob:'))URL.revokeObjectURL(old.url);
  S.draft.images[index]={url:'assets/custom-cake.png',name:'Cake reference '+(index+1),size:0,status:'ready'};
  B.uploadError='';K.mock.upload='normal';
 }
 if(action==='cake-image-remove'){const i=Number(el.dataset.slot);B.tokens[i]++;if(S.draft.images[i]?.url.startsWith('blob:'))URL.revokeObjectURL(S.draft.images[i].url);S.draft.images[i]=null;B.uploadError='';}
 if(action==='cake-retry'){K.mock.options='normal';K.mock.availability='normal';}
 if(action==='cake-next'){location.hash='#/custom-cakes/request/'+el.dataset.step;return;}
 if(action==='cake-price-accept')S.draft.reviewedPrice=K.estimate().total;
 if(action==='cake-cancel'){V.open('Discard this draft?','<p>Your unsent cake selections and reference images will be removed.</p><div class="commerce-actions">'+V.button('close','Keep editing')+V.button('cake-discard','Discard draft',false,'',true)+'</div>','discard');return;}
 if(action==='cake-discard'){B.tokens=B.tokens.map(x=>x+1);K.resetDraft();A.closeModal();location.hash='#/custom-cakes';return;}
 if(action==='cake-submit'){
  if(B.busy)return;B.busy=true;V.render();const draft=S.draft,customer=A.account.id();
  setTimeout(()=>{B.busy=false;if(S.draft!==draft||customer!==A.account.id()||!A.account.allowed())return;const r=K.submit();if(r){location.hash='#/cake-requests/'+r.id;A.toast('Cake request submitted. Awaiting owner review.');}else V.render();},350);return;
 }
 if(action.startsWith('cake-')){V.render();A.inspector();}
});
document.addEventListener('input',e=>{if(e.target.id==='cake-notes'){S.draft.notes=e.target.value;A.$('cake-note-count').textContent=S.draft.notes.length;}});
document.addEventListener('change',e=>{
 if(e.target.name==='cake-address'){S.draft.addressId=e.target.value;V.render();}
});
})();
