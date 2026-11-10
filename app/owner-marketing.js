/* Marketing review pages reuse owner layouts and dialogs. */
(() => {
const A=K406,V=A.ownerUI,E=A.escape,O=A.owner,M=A.marketing;
const categories=['New Product','Product Highlight','Subscription Availability','Seasonal Occasions'];
const button=(action,label,id)=>V.button('marketing-'+action,label,`data-id="${E(id||'')}"`);
const image=d=>`<a href="${E(d.image)}" target="_blank" rel="noopener"><img class="owner-marketing-image" src="${E(d.image)}" alt="${E(d.related)} promotional preview"></a>`;
A.ownerPages.marketing=()=>{
 const id=O.parts[2];if(id==='occasions'){location.replace('#/owner/marketing');return '';}
 if(id){const d=M.drafts.find(d=>d.id===id);if(!d)return V.panel('Draft not found','',V.link('marketing','Back to drafts'));const p=A.products.find(p=>p.id===d.productId),warning=p&&(p.active===false||!p.available||d.category==='Subscription Availability'&&!M.slots(p).length);
 return V.intro(d.id,d.category,V.link('marketing','Back to drafts'))+V.panel(d.related,`${warning?'<p class="staff-note">This offering is currently unavailable. Check the caption before approval.</p>':''}${image(d)}<p class="owner-caption">${E(d.caption)}</p><p>${V.badge(d.status)} &middot; ${E(V.stamp(d.created))}</p><p>Trigger: ${E(d.eventKey)}</p><p>Caption edited: ${d.edited?'Yes':'No'} &middot; Image regenerations: ${d.regenerations}</p><p>Reviewed by: ${E(d.reviewer||'Pending review')}</p><div class="staff-actions">${d.status==='pending'?button('edit','Edit caption',id)+button('image','Regenerate image',id)+button('approve','Approve',id)+button('reject','Reject',id):d.status==='approved'?button('copy','Copy caption',id):''}</div>${d.status==='approved'?'<p>Publication to Facebook is manual. Copy the caption and open the image to save it.</p>':''}`);
 }
 // Search is intentionally absent on this owner screen, including cached queries.
 let rows=V.filtered(M.drafts,null,d=>V.businessDate(d.created),d=>d.status,{dateRange:false});if(O.filters.category&&O.filters.category!=='all')rows=rows.filter(d=>d.category===O.filters.category);
 const filters=V.compactFilters('',V.select('type','Status',[['all','All statuses'],['pending','Pending'],['approved','Approved'],['rejected','Rejected']],O.filters.type)+V.select('category','Category',[['all','All categories'],...categories.map(c=>[c,c])],O.filters.category||'all'),'owner-marketing-filters',{dateRange:false});
 return V.intro('Marketing Drafts','Review promotional content before manual publication.')+filters.replace(/<button([^>]*data-owner="clear-filters"[\s\S]*?)<\/button>/, '<div class="owner-marketing-filter-actions"><button$1</button>'+V.button('marketing-occasions','Seasonal occasions','',true)+'</div>')+V.paged(rows,rs=>rs.length?`<div class="owner-marketing-grid">${rs.map(card).join('')}</div>`:V.panel('No drafts found','<p>Try a different filter or clear filters to see all marketing drafts.</p>'),true,2);

};
function actions(d){return d.status==='pending'?V.button('marketing-approve','Approve',`data-id="${E(d.id)}"`,true)+button('edit','Edit',d.id)+button('reject','Reject',d.id):d.status==='approved'?button('copy','Copy caption',d.id)+button('download','Download image',d.id):'';}
function card(d){return `<article class="owner-marketing-card" aria-label="${E(d.related)} draft"><div class="owner-marketing-card-heading"><span class="order-badge owner-marketing-status ${E(d.status)}">${d.status==='pending'?'Pending review':d.status==='approved'?'Approved':'Rejected'}</span><span class="owner-marketing-category">${E(d.category)}</span></div><h2>${E(d.related)}</h2><p class="owner-marketing-meta">${E(d.id)} &middot; Generated ${E(V.date(V.businessDate(d.created)))}</p><div class="owner-marketing-caption"><span>Caption${d.status==='pending'?' &middot; editable via Edit':''}</span><p>${E(d.caption)}</p></div><img class="owner-marketing-card-image" src="${E(d.image)}" alt="${E(d.related)} promotional image"><div class="owner-marketing-card-actions">${actions(d)}</div></article>`;}
function occasions(){O.open('Seasonal occasions',`<div class="owner-marketing-occasions"><p class="muted">Manage occasions used for seasonal marketing drafts.</p><div class="owner-marketing-occasion-list">${M.occasions.length?M.occasions.map(r=>`<article><div><div class="owner-marketing-occasion-heading"><strong>${E(r.name)}</strong>${V.badge(r.active?'active':'inactive')}</div><p>${V.date(r.start)} &ndash; ${V.date(r.end)}</p></div>${button('occasion','Edit',r.id)}</article>`).join(''):'<p class="staff-note">No occasions yet. Add an occasion and its date range to get started.</p>'}</div><div class="staff-actions">${V.button('discard-modal','Close')}${V.button('marketing-occasion','Add occasion','',true)}</div></div>`);}
function form(kind,id,body,version=0){return `<form data-marketing-form="${kind}" data-id="${E(id)}" data-version="${version}" class="staff-form">${body}${V.error()}<div class="staff-actions">${V.button(kind==='occasion'?'marketing-occasion-cancel':'discard-modal','Cancel')}<button class="btn primary">${kind==='caption'?'Save caption':kind==='occasion'?'Save occasion':kind==='approved'?'Approve post':'Reject post'}</button></div></form>`;}
// Marketing edits are temporary until saved; dismissal always discards them.
document.addEventListener('click',async e=>{
 const el=e.target.closest('[data-owner]');if(!el||!A.session.ownerAllowed())return;const action=el.dataset.owner,d=M.drafts.find(d=>d.id===el.dataset.id);
 if(action==='marketing-weekly'){M.evaluate(true);O.render();A.toast('Weekly marketing evaluated.');return;}
 if(action==='marketing-failure'){M.imageFailure=!M.imageFailure;A.toast(M.imageFailure?'Image failure enabled.':'Image success enabled.');return;}
 if(action==='marketing-occasions'){occasions();return;}
 if(action==='marketing-occasion-cancel'){occasions();return;}
 if(action==='marketing-occasion'){const r=M.occasions.find(r=>r.id===el.dataset.id);O.open(r?'Edit occasion':'Add occasion',form('occasion',r?.id||'',V.field('name','Occasion name',r?.name||'','text','required')+V.field('start','Start date',r?.start||'','date','required')+V.field('end','End date',r?.end||'','date','required')+`<div class="field owner-marketing-status-field"><span>Status</span><label class="owner-schedule-toggle"><input type="checkbox" role="switch" name="active" value="true" aria-label="Occasion active" ${r?.active!==false?'checked':''}><span class="owner-toggle-track" aria-hidden="true"></span><span class="owner-toggle-label" aria-hidden="true"></span></label></div>`,r?.version||0));return;}
 if(!d)return;
 if(action==='marketing-copy'){try{await navigator.clipboard.writeText(d.caption);A.toast('Caption copied.');}catch{A.toast('Clipboard unavailable. Select and copy the caption.');}return;}
 if(action==='marketing-download'&&d.status==='approved'){
  el.disabled=true;
  try{
   // Blob URLs force download for hosted images; local/data assets can download directly.
   let url=d.image,blobUrl=null;
   if(location.protocol!=='file:'&&!url.startsWith('data:')){const response=await fetch(url);if(!response.ok)throw Error('Image unavailable');blobUrl=URL.createObjectURL(await response.blob());url=blobUrl;}
   const link=document.createElement('a');link.href=url;link.download=d.id+(d.image.startsWith('data:image/svg')?'.svg':(d.image.match(/\.(png|jpe?g|webp|svg)(?:[?#]|$)/i)?.[0].split(/[?#]/)[0]||'.png'));document.body.append(link);link.click();link.remove();if(blobUrl)setTimeout(()=>URL.revokeObjectURL(blobUrl),1000);A.toast('Image download started.');
  }catch{A.toast('Image could not be downloaded. Please retry.');}finally{el.disabled=false;}return;
 }
 if(d.status!=='pending')return;
 if(action==='marketing-edit')O.open('Edit caption',form('caption',d.id,`<div class="field"><label for="draft-caption">Caption</label><textarea id="draft-caption" name="caption" required rows="6">${E(d.caption)}</textarea></div>`,d.version));
 if(['marketing-approve','marketing-reject'].includes(action))O.open(action==='marketing-approve'?'Approve post':'Reject post',form(action==='marketing-approve'?'approved':'rejected',d.id,`<p>${action==='marketing-approve'?'Approve':'Reject'} the draft for <strong>${E(d.related)}</strong>?</p><p class="muted">${action==='marketing-approve'?'The caption and image will be ready to copy and download. Publication to Facebook is manual.':'This draft will be marked as rejected and cannot be edited or approved.'}</p>`,d.version));
 if(action==='marketing-image'){
 if(d.busy)return;d.busy=true;el.disabled=true;const generation=A.session.generation,version=d.version;
 await new Promise(r=>setTimeout(r,350));
 if(A.session.ownerAllowed()&&generation===A.session.generation&&d.status==='pending'&&d.version===version){if(M.imageFailure||O.saveError)A.toast('Image regeneration failed. Please retry.');else{const p=A.products.find(p=>p.id===d.productId);const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect width="800" height="600" fill="${d.regenerations%2?'#ead8bf':'#f7ead8'}"/><text x="50" y="250" font-size="32" fill="#653b24">Kitchen406</text><text x="50" y="310" font-size="22" fill="#653b24">${E(p?.name||d.related)}</text><text x="50" y="370" font-size="18">Promotional preview ${d.regenerations+1}</text></svg>`;d.image='data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);d.regenerations++;d.version++;A.toast('Image regenerated.');}O.render();}d.busy=false;
 }
});
document.addEventListener('submit',e=>{
 const f=e.target,kind=f.dataset.marketingForm;if(!kind)return;e.preventDefault();if(!A.session.ownerAllowed())return;const data=Object.fromEntries(new FormData(f)),d=M.drafts.find(d=>d.id===f.dataset.id);let error='';
 if(O.saveError)error='Changes could not be saved. Please retry.';
 else if(kind==='occasion'){const r=M.occasions.find(r=>r.id===f.dataset.id);if(r&&r.version!==Number(f.dataset.version))error='Occasion changed. Reopen the form.';else if(!data.name.trim()||!A.schedule.valid(data.start)||!A.schedule.valid(data.end)||data.start>data.end||M.occasions.some(o=>o!==r&&o.name.toLowerCase()===data.name.trim().toLowerCase()&&o.start===data.start))error='Enter a unique occasion and a valid date range.';else{const target=r||{id:crypto.randomUUID(),version:0};Object.assign(target,{name:data.name.trim(),start:data.start,end:data.end,active:data.active==='true',version:target.version+1});if(!r)M.occasions.push(target);}}
 else if(!d||d.status!=='pending'||d.version!==Number(f.dataset.version)||d.busy)error='Draft changed. Reopen the form.';
 else if(kind==='caption'){if(!data.caption.trim())error='Enter a caption.';else{d.caption=data.caption.trim();d.edited=true;d.version++;}}
 else error=M.finalize(d,kind);
 if(error)f.querySelector('.owner-error').textContent=error;else{A.closeModal(true);O.render();if(kind==='occasion')occasions();A.toast('Changes saved.');}
});
})();
