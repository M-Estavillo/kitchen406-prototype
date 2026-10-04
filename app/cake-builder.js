(() => {
const A=K406,K=A.cakes,S=K.state,T=A.cakeData,C=A.commerce,U=C.ui,V=A.phase4,E=A.escape;
const B=K.builder={busy:false,uploadError:'',tokens:[0,0,0]};
B.landing=()=>`<section class="cake-hero"><div><h1 class="hero-title">Something worth<br>celebrating.</h1><p>Choose your cake, share your inspiration, and let Kitchen406 bring the details together. Every request is reviewed by the bakery before a final quotation.</p><div class="commerce-actions">${V.button('cake-start','Request a custom cake',false,'',true)}${U.link('cake-requests','My cake requests')}</div></div><img src="assets/celebration-cake.jpg" alt="A handcrafted celebration cake"></section><div class="cake-how">${[['01','Make it yours','Choose cake options and add your reference photos.'],['02','Bakery review','We review the design, requested date, and ingredients.'],['03','Review your quotation','Check the final design, delivery details, and total.'],['04','Accept and pay','Full payment confirms the order after availability checks.']].map(([n,title,copy])=>`<article><span>${n}</span><h2>${title}</h2><p>${copy}</p></article>`).join('')}</div>`;
B.summary=()=>{
 const d=S.draft,estimate=K.estimate();
 return U.panel('Your cake request',`<p>${d.date?U.date(d.date):'Choose a requested date'}</p><p class="muted">${E(K.windows(d.date)[d.window]||'Choose a delivery window')}</p><dl class="cake-summary">${T.categories.map(type=>`<div><dt>${E(type)}</dt><dd>${E(K.selected().find(o=>o.type===type)?.name||'Not selected')}</dd></div>`).join('')}</dl><dl class="commerce-totals"><div><dt>Cake options</dt><dd>${K.money(estimate.base)}</dd></div><div><dt>Add-ons</dt><dd>${K.money(estimate.extra)}</dd></div><div class="grand-total"><dt>Preliminary estimate</dt><dd>${estimate.complete?K.money(estimate.total):'—'}</dd></div></dl><p class="muted">${estimate.complete?'The owner confirms the final price, design charges, and delivery fee after review.':'Complete all five cake selections to view your preliminary estimate.'}</p>`);
};
B.calendar=()=>{
 const start=new Date(Date.UTC(K.year,K.month,1)),days=new Date(Date.UTC(K.year,K.month+1,0)).getUTCDate();
 return `<div class="calendar-heading">${V.button('cake-month','‹',false,'data-delta="-1" aria-label="Previous month"')}<h3>${start.toLocaleDateString('en-PH',{month:'long',year:'numeric',timeZone:'UTC'})}</h3>${V.button('cake-month','›',false,'data-delta="1" aria-label="Next month"')}</div><div class="calendar-grid">${['Su','Mo','Tu','We','Th','Fr','Sa'].map(d=>`<span class="muted">${d}</span>`).join('')}${'<span></span>'.repeat(start.getUTCDay())}${Array.from({length:days},(_,i)=>{const date=`${K.year}-${String(K.month+1).padStart(2,'0')}-${String(i+1).padStart(2,'0')}`,reason=K.dateReason(date);return `<button type="button" data-p4="cake-date" data-value="${date}" ${reason?'disabled':''} aria-pressed="${S.draft.date===date}" aria-label="${U.date(date)} ${E(reason||'Available')}">${i+1}<small>${reason?reason.includes('Weekly')?'Week full':reason.includes('blocked')?'Blocked':reason.includes('Past')?'Past':reason.includes('Lead')?'Lead time':'Full':'Open'}</small></button>`;}).join('')}</div><p class="muted">Dates respect lead time, cutoff, blocked dates, and the separate custom cake limit.</p>`;
};
B.details=()=>{
 const d=S.draft,addresses=A.addresses.active(),windows=K.windows(d.date);
 return U.columns(U.panel('Requested date',U.alert('Selecting a date or submitting a request does not reserve a production slot.')+B.calendar())+
 U.panel('Preferred delivery window',`<p class="muted">Personally delivered by the bakery owners. Your preferred time is confirmed in the quotation.</p><div class="field"><label for="cake-window">Delivery window</label><select id="cake-window"><option value="">Choose a window</option>${Object.entries(windows).map(([id,label])=>`<option value="${id}" ${d.window===id?'selected':''}>${E(label)}</option>`).join('')}</select></div>`)+
 U.panel('Delivery address',addresses.length?addresses.map(a=>`<div class="address-choice ${d.addressId===a.address_id?'selected':''}"><label><input type="radio" name="cake-address" value="${E(a.address_id)}" ${d.addressId===a.address_id?'checked':''}><strong>${E(a.label)}</strong>${U.address(a)}<p>${K.serviceable(a)?'Within owner delivery area':'Outside owner delivery area'}</p></label>${V.button('address-edit','Edit',false,`data-id="${E(a.address_id)}"`)}</div>`).join(''):'<p>No saved delivery addresses. Add one to continue.</p>',V.button('address-add','+ Add address'))+
 (K.addressUI.form?C.checkout.addressForm(K.addressUI).replace('data-commerce="address-cancel"','data-p4="address-cancel"'):'')+
 U.panel('Contact for this request',`<p>${E(A.account.name())} · ${E(A.account.current.mobile_number)}</p><p class="muted">Your contact details will be saved with the submitted request.</p>${U.link('account/profile','Edit profile')}`),
 B.summary()+U.panel('Owner-managed delivery','<p>The bakery reviews delivery feasibility and includes its delivery fee in the final quotation.</p>')+(K.fulfillmentReason()?U.alert(K.fulfillmentReason(),true):'')+V.button('cake-next','Continue to cake options',!!K.fulfillmentReason()||!!K.addressUI.form,'data-step="options"',true)+V.button('cake-cancel','Cancel request'));
};
B.options=()=>{
 if(K.mock.options!=='normal')return U.empty(K.mock.options==='loading'?'Loading cake options…':'Cake options could not be loaded','Your selections are preserved.',V.button('cake-retry','Try again'));
 return U.columns(T.categories.map(type=>U.panel('Cake '+type,`<p class="muted">Choose one · Required</p><div class="cake-options">${T.options.filter(o=>o.type===type).map(o=>`<button class="cake-option" type="button" data-p4="cake-option" data-type="${type}" data-id="${o.id}" aria-pressed="${S.draft.selections[type]===o.id}" ${o.available?'':'disabled'}><span class="cake-option-mark" aria-hidden="true">${type==='shape'?(o.id==='heart'?'♡':'○'):type==='size'?o.name.slice(0,1)+'″':type==='color'?'◉':'✧'}</span><strong>${E(o.name)}</strong><span>${E(o.description)}</span><b>${o.price?K.money(o.price):'Included · '+K.money(0)}</b>${o.available?'':'<small>Unavailable</small>'}</button>`).join('')}</div>`)).join(''),
 B.summary()+(K.optionsReason()?U.alert(K.optionsReason()):'')+V.button('cake-next','Continue to references',!!K.optionsReason(),'data-step="references"',true)+U.link('custom-cakes/request/details','Back to request details'));
};
B.photos=(images,editable=false)=>`<div class="cake-photos">${images.map((item,index)=>editable?`<section class="cake-photo-slot"><h3>${index===0?'Primary reference · Required':'Additional reference · Optional'}</h3>${item?`<button type="button" class="cake-image-button" data-p4="cake-enlarge" data-url="${E(item.url)}" data-name="${E(item.name)}"><img src="${E(item.url)}" alt="${E(item.name)}"></button><p>${E(item.name)}</p><p class="muted">${item.status==='loading'?'Checking image…':(item.size/1024/1024).toFixed(1)+' MB'}</p>`:'<div class="cake-photo-empty"><span class="material-symbols-outlined" aria-hidden="true">add_photo_alternate</span><p>Share your design inspiration</p></div>'}<label class="btn" for="cake-file-${index}">${item?'Replace image':'Choose image'}</label><input class="cake-file" id="cake-file-${index}" type="file" accept="image/jpeg,image/png,image/webp" data-image-slot="${index}">${item?V.button('cake-image-remove','Remove',false,`data-slot="${index}"`):''}</section>`:item?`<button type="button" class="cake-image-button" data-p4="cake-enlarge" data-url="${E(item.url)}" data-name="${E(item.name)}"><img src="${E(item.url)}" alt="${index===0?'Primary reference: ':'Additional reference: '}${E(item.name)}"><span>${E(item.name)}</span></button>`:'').join('')}</div>`;
B.references=()=>U.panel('Reference images',`<p>One primary photo is required. Add up to two more for decorations, colors, or lettering.</p><p class="muted">JPG, PNG, or WebP · Maximum 10 MB each · ${S.draft.images.filter(Boolean).length} of 3 added</p>${B.uploadError?U.alert(B.uploadError,true):''}${B.photos(S.draft.images,true)}<p class="muted">Reference photos guide the design; they do not change your selected cake options.</p>`)+
 U.panel('Design notes',`<div class="field"><label for="cake-notes">Optional instructions for the bakery</label><textarea id="cake-notes" maxlength="600" rows="5" placeholder="Tell us which details to follow from your photos…">${E(S.draft.notes)}</textarea><p class="muted"><span id="cake-note-count">${S.draft.notes.length}</span> / 600 characters</p></div>`)+
 (K.referencesReason()?U.alert(K.referencesReason()):'')+`<div class="commerce-actions">${U.link('custom-cakes/request/options','Back to cake options')}${V.button('cake-next','Continue to review',!!K.referencesReason(),'data-step="review"',true)}</div>`;
B.configuration=(snapshot,showPrices=true)=>`<dl class="cake-specifications">${snapshot.options.map(o=>`<div><dt>${E(o.type)}</dt><dd>${E(o.name)}</dd>${showPrices?'<small>'+K.money(o.price)+'</small>':''}</div>`).join('')}</dl>${snapshot.addons.length?'<h3>Selected add-ons</h3>'+snapshot.addons.map(a=>`<p>${E(a.name)} × ${a.quantity} · ${showPrices?K.money(a.price*a.quantity):'Included in quotation'}</p>`).join(''):'<p class="muted">No add-ons selected.</p>'}`;
B.fulfillment=snapshot=>`<dl class="profile-details"><div><dt>Requested date</dt><dd>${U.date(snapshot.date)}</dd></div><div><dt>Preferred window</dt><dd>${E(snapshot.windowLabel)}</dd></div></dl><h3>Owner-managed delivery</h3><p>${E(snapshot.contact.name)} · ${E(snapshot.contact.mobile_number)}</p>${U.address(snapshot.address)}`;
B.review=()=>{
 const estimate=K.estimate(),snap={options:K.selected(),addons:K.extras(),address:K.address(),contact:A.account.contact(),date:S.draft.date,windowLabel:K.windows(S.draft.date)[S.draft.window]};
 if(S.draft.reviewedPrice===null)S.draft.reviewedPrice=estimate.total;
 return U.columns(U.panel('Cake configuration',B.configuration(snap),U.link('custom-cakes/request/options','Edit options'))+
 U.panel('Reference images & notes',B.photos(S.draft.images)+`<p class="cake-notes">${E(S.draft.notes||'No additional design notes.')}</p>`,U.link('custom-cakes/request/references','Edit references'))+
 U.panel('Requested fulfillment',B.fulfillment(snap),U.link('custom-cakes/request/details','Edit fulfillment')),
 B.summary()+(S.draft.reviewedPrice!==estimate.total?U.alert('The estimate changed. Review the new amount before submitting.',true)+V.button('cake-price-accept','Accept updated estimate'):'')+
 U.panel('What happens next?','<ol class="payment-instructions"><li>The owner reviews your design, date, and ingredients.</li><li>You receive a final quotation with the delivery fee.</li><li>Accept and pay through QR Ph to confirm your order.</li></ol><p class="muted">No payment is collected when you submit a request.</p>')+V.button('cake-submit',B.busy?'Submitting…':'Submit cake request',B.busy||S.draft.reviewedPrice!==estimate.total,'',true)+U.link('custom-cakes/request/references','Back to references'));
};
B.view=step=>{
 if(S.draft.submittedId)return U.page('Request submitted','Your request is awaiting owner review.',U.empty('Your cake request is saved','Follow the request for quotations and updates.',U.link('cake-requests/'+S.draft.submittedId,'View request',true)+V.button('cake-start','Start another request')));
 let reason='',back='details';if(step!=='details')reason=K.fulfillmentReason();if(!reason&&['references','review'].includes(step)){reason=K.optionsReason();back='options';}if(!reason&&step==='review'){reason=K.referencesReason();back='references';}
 const content=reason?U.empty('Complete the earlier step',reason,U.link('custom-cakes/request/'+back,'Review '+back,true)):B[step]?B[step]():U.empty('Step not found','Return to your request.',U.link('custom-cakes/request/details','Request details'));
 return U.page(({details:'Let’s plan your custom cake.',options:'Customize your cake.',references:'Reference Images & Notes',review:'Review your cake request'})[step]||'Custom cake request','Made to order, reviewed by the bakery.'+(step==='details'?' Your date is subject to confirmation.':''),(K.message?U.alert(K.message,true):'')+content);
};
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-p4]');if(!el||el.disabled)return;const action=el.dataset.p4;
 if(action==='cake-start'){if(S.draft.submittedId)K.resetDraft();location.hash='#/custom-cakes/request/details';return;}
 if(action==='cake-enlarge'){V.open('Reference image',`<img class="reference-enlarged" src="${E(el.dataset.url)}" alt="${E(el.dataset.name)}"><p>${E(el.dataset.name)}</p>${V.button('close','Close preview')}`,'image');return;}
 if(!A.account.allowed())return;
 if(action==='cake-month'){const date=new Date(Date.UTC(K.year,K.month+Number(el.dataset.delta),1));K.year=date.getUTCFullYear();K.month=date.getUTCMonth();}
 if(action==='cake-date'){S.draft.date=el.dataset.value;if(!K.windows(S.draft.date)[S.draft.window])S.draft.window='';}
 if(action==='cake-option'){S.draft.selections[el.dataset.type]=el.dataset.id;S.draft.reviewedPrice=null;}
 if(action==='cake-addon'){const id=el.dataset.id;S.draft.addons[id]=Math.max(0,Math.min(20,(S.draft.addons[id]||0)+Number(el.dataset.delta)));S.draft.reviewedPrice=null;}
 if(action==='cake-image-remove'){const i=Number(el.dataset.slot);B.tokens[i]++;if(S.draft.images[i]?.url.startsWith('blob:'))URL.revokeObjectURL(S.draft.images[i].url);S.draft.images[i]=null;}
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
document.addEventListener('change',async e=>{
 if(e.target.id==='cake-window'){S.draft.window=e.target.value;V.render();}
 if(e.target.name==='cake-address'){S.draft.addressId=e.target.value;V.render();}
 if(!e.target.matches('[data-image-slot]'))return;
 const index=Number(e.target.dataset.imageSlot),file=e.target.files[0];if(!file)return;
 if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>10*1024*1024||file.size===0){B.uploadError='Choose a JPG, PNG, or WebP image up to 10 MB.';V.render();return;}
 const draft=S.draft,token=++B.tokens[index],old=draft.images[index],url=URL.createObjectURL(file);B.uploadError='';draft.images[index]={name:file.name,size:file.size,type:file.type,url,status:'loading'};V.render();
 try{
  const img=new Image();img.src=url;await img.decode();if(K.mock.upload==='error')throw Error('Simulated upload failure');
  if(S.draft!==draft||token!==B.tokens[index]){URL.revokeObjectURL(url);return;}
  draft.images[index].status='ready';if(old?.url.startsWith('blob:'))URL.revokeObjectURL(old.url);
 }catch{if(S.draft===draft&&token===B.tokens[index]){draft.images[index]=old;B.uploadError='This image could not be read. Please choose it again or try another image.';}URL.revokeObjectURL(url);}
 V.render();
});
})();
