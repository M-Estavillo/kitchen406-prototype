/* One staff registry backs owner management and mock sign-in. Customer records are read-only. */
(() => {
const A=K406,V=A.ownerUI,E=A.escape,S=A.staff,P=A.account;
const initial={...S.account,role:'staff',version:0};
S.accounts=[S.account];Object.assign(S.account,{role:'staff',version:0});
const M=A.ownerAccounts={query:'',status:'all',sort:'name',page:1,results:new Map(),pending:new Set(),views:new Map(),section:'staff'};
M.find=id=>S.accounts.find(s=>s.id===id);
M.duplicate=(email,id)=>[A.session.owner,...S.accounts,...P.records].some(s=>(!id||s.id!==id)&&s.email.toLowerCase()===email.toLowerCase());
M.save=async(data,id,version,key,generation=A.session.generation,stillOpen=()=>true)=>{
 if(!A.session.ownerAllowed())return 'Owner access required.';
 if(M.results.has(key))return '';
 if(M.pending.has(key))return 'This account is already being saved.';
 const record=id?M.find(id):null;
 if(id&&(!record||record.version!==version))return 'Account changed. Reopen the editor.';
 const first_name=data.first_name.trim(),last_name=data.last_name.trim(),email=data.email.trim().toLowerCase();
 if(!first_name||!last_name)return 'First and last name are required.';
 if(!/^\S+@\S+\.\S+$/.test(email))return 'Enter a valid email address.';
 if(M.duplicate(email,id))return 'This email is already in use.';
 if(!id&&!P.passwordValid(data.password))return 'Use at least 8 characters with letters and numbers for the initial password.';
 if(A.owner.saveError)return 'The account could not be saved. Please retry.';
 M.pending.add(key);
 try{
  const hash=id?null:await P.hash(data.password);
  if(!A.session.ownerAllowed()||generation!==A.session.generation||!stillOpen())return 'The session changed. Reopen the editor.';
  if(M.results.has(key))return '';
  if(id&&record.version!==version)return 'Account changed. Reopen the editor.';
  if(M.duplicate(email,id))return 'This email is already in use.';
  if(A.owner.saveError)return 'The account could not be saved. Please retry.';
  const now=new Date().toISOString(),actor=A.session.actor();
  if(record){Object.assign(record,{first_name,last_name,email,updated_at:now,version:record.version+1});}
  else S.accounts.push({id:'staff-'+crypto.randomUUID(),first_name,last_name,email,hash,role:'staff',status:'active',setup:true,version:0,created_at:now,created_by_admin_id:actor.id,created_by_name:actor.name});
  M.results.set(key,true);return '';
 }catch{return 'The account could not be saved. Please retry.';}finally{M.pending.delete(key);}
};
M.statusChange=(id,status,version,key)=>{
 if(!A.session.ownerAllowed())return 'Owner access required.';
 if(M.results.has(key))return '';
 const r=M.find(id);if(!r||r.version!==version)return 'Account changed. Reopen the confirmation.';
 if(!['active','inactive'].includes(status))return 'Invalid account status.';
 if(A.owner.saveError)return 'The status could not be saved. Please retry.';
 r.status=status;r.version++;r.updated_at=new Date().toISOString();
 (r.history??=[]).push({status,at:r.updated_at,actor:A.session.actor()});M.results.set(key,true);
 if(S.account===r){S.generation++;S.render?.();}return '';
};
const name=r=>r.first_name+' '+r.last_name,link=(path,label)=>V.link('accounts/'+path,label);

const filters=customer=>`<form class="staff-toolbar" data-account-filter>${V.field('account-query','Search name or email',M.query,'search')}${V.select('account-status','Status',[['all','All statuses'],['active','Active'],['inactive','Inactive'],...(customer?[...new Set(P.records.map(r=>r.status).filter(s=>s&&!['active','inactive'].includes(s)))].map(s=>[s,s.replaceAll('_',' ')]):[])],M.status)}${V.select('account-sort','Sort',[['name','Name A–Z'],['newest','Newest first'],['oldest','Oldest first']],M.sort)}${V.button('account-clear','Clear filters')}</form>`;
function listing(records,render){
 const query=M.query.trim().toLowerCase(),rows=records.filter(r=>(name(r)+' '+r.email).toLowerCase().includes(query)&&(M.status==='all'||r.status===M.status)).sort((a,b)=>M.sort==='name'?name(a).localeCompare(name(b)):String(a.created_at||'').localeCompare(String(b.created_at||''))*(M.sort==='oldest'?1:-1));
 const pages=Math.max(1,Math.ceil(rows.length/10));M.page=Math.min(M.page,pages);
 return render(rows.slice((M.page-1)*10,M.page*10))+`<div class="staff-pager">${V.button('account-prev','Previous',M.page===1?'disabled':'')}<span>Page ${M.page} of ${pages} · ${rows.length} results</span>${V.button('account-next','Next',M.page===pages?'disabled':'')}</div>`;
}
const staffActions=r=>V.button('account-edit','Edit',`data-id="${E(r.id)}"`)+V.button('account-status',r.status==='active'?'Deactivate':'Activate',`data-id="${E(r.id)}"`);
M.customerData=id=>{
 if(!A.session.ownerAllowed())return null;
 const customer=P.records.find(r=>r.customer_id===id);if(!customer)return null;
 const orders=A.operations.list().filter(o=>o.customer_id===id),purchases=A.operations.purchases().filter(p=>p.customer_id===id),ids=new Set(purchases.map(p=>p.id));
 return {customer,orders,subscriptions:A.subscriptions.allRecords().filter(r=>ids.has(r.purchaseId)),requests:A.cakes.state.requests.filter(r=>r.customer_id===id),addresses:(id===P.id()?A.commerce.state.addresses:P.buckets.get(id)?.commerce.addresses||[]).filter(a=>a.customer_id===id)};
};
A.ownerPages.accounts=()=>{
 if(!A.session.ownerAllowed())return V.panel('Owner access required','');
 const [, ,section='staff',id]=A.owner.parts,customer=section==='customers';
 if(section==='customers'){location.replace('#/owner/accounts/staff');return '';}
 if(section!=='staff')return V.panel('Page not found','');
 if(M.section!==section){M.views.set(M.section,{query:M.query,status:M.status,sort:M.sort,page:M.page});Object.assign(M,M.views.get(section)||{query:'',status:'all',sort:'name',page:1});M.section=section;}
 let body='';
 if(id){
  const r=M.find(id);if(!r)return V.panel('Staff account not found','',link('staff','Back to staff'));
  body=V.intro(name(r),'Predefined Staff role',link('staff','Back to staff'))+V.panel('Staff account',`<p>${E(r.email)}</p><p>${V.badge(r.status)} · Created: ${V.date(V.businessDate(r.created_at))}</p><p>Created by: ${E(r.created_by_name||r.created_by_admin_id||'Not recorded')}</p><p>Staff can access permitted operational functions. Financial analytics and account administration are owner-only.</p><div class="staff-actions">${staffActions(r)}</div>`)+V.panel('Status history',(r.history||[]).map(h=>`<p>${V.badge(h.status)} · ${E(V.stamp(h.at))} · ${E(h.actor.name)}</p>`).join('')||'<p>No status changes recorded.</p>');
 }else{
  body=V.intro('Accounts','',V.button('account-edit','Create staff account','',true))+filters(false)+listing(S.accounts,staffCards);
 }
 return `<div class="${customer?'owner-customer-accounts':'owner-staff-accounts'}"><div class="staff-stack">${body}</div></div>`;
};
function staffCards(rows){return rows.length?`<div class="owner-staff-list">${rows.map(r=>`<article class="owner-staff-card"><div class="owner-staff-avatar" aria-hidden="true">${E((r.first_name?.[0]||'')+(r.last_name?.[0]||''))}</div><div class="owner-staff-copy"><div class="owner-commitment-heading"><a href="#/owner/accounts/staff/${encodeURIComponent(r.id)}"><strong>${E(name(r))}</strong></a>${V.badge(r.status)}</div><p>${E(r.email)}</p><span>Created ${V.date(V.businessDate(r.created_at))}</span></div><div class="owner-staff-actions">${staffActions(r)}</div></article>`).join('')}</div>`:'<p class="owner-orders-empty muted">No staff accounts match these filters.</p>';}

document.addEventListener('click',e=>{
 const button=e.target.closest('[data-owner]');if(!button||button.disabled||!A.session.ownerAllowed())return;
 const action=button.dataset.owner,id=button.dataset.id,r=M.find(id);
 if(action==='account-clear'){Object.assign(M,{query:'',status:'all',sort:'name',page:1});A.owner.render();}
 if(action==='account-prev'||action==='account-next'){M.page+=action==='account-next'?1:-1;A.owner.render();}
 if(action==='account-edit'){
  if(id&&!r)return;
  A.owner.open(r?'Edit staff account':'Create staff account',`<form class="staff-form" data-account-form data-id="${E(id||'')}" data-version="${r?.version||0}">${V.field('first_name','First name',r?.first_name||'','text','required')}${V.field('last_name','Last name',r?.last_name||'','text','required')}${V.field('email','Email',r?.email||'','email','required')}${r?'':V.field('password','Initial password','','password','required minlength="8" autocomplete="new-password"')+'<p>Use at least 8 characters with letters and numbers. Credentials are local to this preview.</p>'}${V.error()}<div class="owner-settings-actions">${V.button('cancel-stock','Cancel')}<button class="btn primary" type="submit">Save account</button></div></form>`);
 }
 if(action==='account-status'&&r)A.owner.open(r.status==='active'?'Deactivate staff account':'Activate staff account',`<div class="owner-staff-confirm"><p>${E(name(r))} · ${r.status==='active'?'This prevents staff access. Historical activity is retained.':'This restores access to the predefined Staff role.'}</p>${V.error()}<div class="owner-settings-actions">${V.button('account-confirm-status','Confirm',`data-id="${E(id)}" data-version="${r.version}" data-status="${r.status==='active'?'inactive':'active'}"`,true)}${V.button('cancel-stock','Cancel')}</div></div>`);
 if(action==='account-confirm-status'){
  const error=M.statusChange(id,button.dataset.status,Number(button.dataset.version),A.owner.formKey);
  if(error){A.$('owner-dialog-body').querySelector('.owner-error').textContent=error;return;}
  A.closeModal(true);A.operations.changed();A.toast('Staff status updated.');
 }
});
function updateAccountFilters(e){
 const form=e.target.closest('[data-account-filter]');if(!form||!A.session.ownerAllowed())return;
 const name=e.target.name,start=e.target.selectionStart,end=e.target.selectionEnd;
 Object.assign(M,{query:form.elements['account-query'].value,status:form.elements['account-status'].value,sort:form.elements['account-sort'].value,page:1});A.owner.render();
 const control=document.querySelector(`[data-account-filter] [name="${name}"]`);control?.focus();if(name==='account-query'&&start!==null)control?.setSelectionRange(start,end);
}
document.addEventListener('input',e=>{if(e.target.name==='account-query')updateAccountFilters(e);});
document.addEventListener('change',e=>{if(['account-status','account-sort'].includes(e.target.name))updateAccountFilters(e);});
document.addEventListener('input',e=>{const f=e.target.closest('[data-account-form]');if(f)f.dataset.dirty='true';});
document.addEventListener('submit',async e=>{
 const f=e.target;if(!f.matches('[data-account-form],[data-account-filter]'))return;e.preventDefault();if(!A.session.ownerAllowed())return;
 if(f.matches('[data-account-filter]')){Object.assign(M,{query:f.elements['account-query'].value,status:f.elements['account-status'].value,sort:f.elements['account-sort'].value,page:1});A.owner.render();return;}
 if(f.dataset.busy==='true')return;f.dataset.busy='true';const button=f.querySelector('[type=submit]');button.disabled=true;
 const key=f.dataset.operation,generation=Number(f.dataset.generation),data=Object.fromEntries(new FormData(f));
 const error=await M.save(data,f.dataset.id,Number(f.dataset.version),key,generation,()=>f.isConnected&&A.modal==='owner-modal');
 if(!f.isConnected)return;f.dataset.busy='false';button.disabled=false;
 if(error){f.querySelector('.owner-error').textContent=error;return;}
 A.closeModal(true);A.operations.changed();A.toast('Staff account saved.');
});
const reset=A.commerce.reset;A.commerce.reset=()=>{reset();S.account={...initial};S.accounts=[S.account];M.results.clear();M.pending.clear();M.views.clear();M.section='staff';Object.assign(M,{query:'',status:'all',sort:'name',page:1});};
})();
