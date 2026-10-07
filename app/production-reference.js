/* Owner-authorized production copies, separated from original customer references. */
(() => {
const A=K406,K=A.cakes,S=A.staff,E=A.escape;
K.productionCopies=new Map();
const reset=K.reset;K.reset=()=>{K.productionCopies.clear();return reset();};
K.productionCopy=q=>{const copy=K.productionCopies.get(q?.id);return copy?.quotation_id===q?.id?copy:null;};
K.approveProductionCopy=(q,notes,images)=>{
 if(!A.session.ownerAllowed())return 'Owner access required.';
 if(!q||!K.state.quotations.includes(q)||!['accepted','issued'].includes(q.status))return 'Select a current or accepted quotation.';
 if(!notes.trim()||notes.length>2000)return 'Enter production instructions (up to 2,000 characters).';
 if(!images.length||images.some(url=>!q.snapshot.images.some(i=>i?.url===url)))return 'Choose a reviewed reference from this quotation.';
 K.productionCopies.set(q.id,{quotation_id:q.id,notes:notes.trim(),images:[...images],reviewed_by_admin_id:A.session.actor().id,reviewed_at:Date.now()});return '';
};
K.openProductionCopy=id=>{
 if(!A.session.ownerAllowed())return;
 const q=K.state.quotations.find(q=>q.id===id);
 if(!q)return;
 const copy=K.productionCopy(q);
 A.owner.open('Approve production instructions',`<form data-production-copy="${E(q.id)}" class="staff-form"><p>Quotation ${E(q.id)}. Review the references and enter instructions safe for staff. Exclude customer names, contact information, and addresses.</p><div class="field"><label for="production-instructions">Approved instructions</label><textarea id="production-instructions" name="notes" required maxlength="2000">${E(copy?.notes||'')}</textarea></div><div class="staff-specs">${q.snapshot.images.filter(i=>i?.status==='ready').map((i,n)=>`<label><img src="${E(i.url)}" alt="Reference ${n+1}"><input type="checkbox" name="reference" value="${E(i.url)}" ${copy?.images.includes(i.url)?'checked':''}> Reviewed for staff use</label>`).join('')}</div><label><input type="checkbox" name="reviewed" required> I reviewed the selected images and text for customer-identifying content.</label><p class="staff-error field-error" role="alert"></p><button class="btn primary">Approve production copy</button></form>`);
};
document.addEventListener('submit',e=>{
 const form=e.target;if(!form.dataset.productionCopy)return;e.preventDefault();
 const data=new FormData(form),q=K.state.quotations.find(q=>q.id===form.dataset.productionCopy);
 const error=Number(form.dataset.generation)!==A.session.generation?'This session changed. Reopen the form.':A.owner.saveError?'The production copy could not be saved.':!data.has('reviewed')?'Confirm the content review.':K.approveProductionCopy(q,String(data.get('notes')||''),data.getAll('reference'));
 if(error){form.querySelector('.staff-error').textContent=error;return;}
 A.owner.drafts.delete(A.owner.draftKey(form));A.closeModal(true);A.toast('Production copy approved for this quotation.');A.owner.render();
});
})();
