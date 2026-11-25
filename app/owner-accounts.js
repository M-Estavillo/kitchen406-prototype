/* Admin staff management backed by the local account API. */
(() => {
const A=K406,V=A.ownerUI,E=A.escape,S=A.staff,P=A.account;
S.accounts=[];
const M=A.ownerAccounts={query:'',status:'all',sort:'name',page:1,views:new Map(),section:'staff'};
M.find=id=>S.accounts.find(s=>s.id===id);
const messages={
 'account-exists':'This email is already in use.',
 'invalid-staff':'Enter valid names, an email, and a password of 8–128 characters with a letter and a number.',
 'sign-in-required':'Your session expired. Sign in again.',
 'access-denied':'Owner access required.',
 'staff-changed':'The account changed. Reopen the confirmation.',
 'staff-not-found':'The staff account could not be found.',
 'staff-not-pending':'Only Pending staff accounts can be edited.',
 'invalid-staff-name':'Enter a first and last name of up to 80 characters each.',
 'invalid-email':'Enter a valid email address.',
 'same-email':'Enter a different email address.',
 'staff-setup-complete':'The staff member has already changed their password.',
 'temporary-password-unavailable':'This account has no saved temporary password.'
};
async function save(action,input,generation=A.session.generation){
 if(!A.session.ownerAllowed()||generation!==A.session.generation)return {error:'Owner access required.'};
 if(A.owner.saveError)return {error:'The change could not be saved. Please retry.'};
 try{
  const result=await A.authUI.api(action,input);
  if(generation===A.session.generation)M.load();
  return result;
 }catch(error){
  if(['staff-changed','staff-not-pending'].includes(error.message)&&generation===A.session.generation)M.load();
  return {error:messages[error.message]||'The change could not be saved. Please retry.'};
 }
}
M.load=async()=>{
 const generation=A.session.generation,request={};
 M.request=request;
 M.loading=true;
 M.loadError='';
 const current=()=>generation===A.session.generation&&M.request===request;
 try{
  const {staff}=await A.authUI.api('staff');
  if(current())S.accounts=staff;
 }catch(error){
  if(current())M.loadError=messages[error.message]||'The staff accounts could not be loaded.';
 }finally{
  if(current()){
   M.loading=false;
   if(A.route==='owner'&&A.owner.parts[1]==='accounts')A.owner.render();
  }
 }
};
const show=A.owner.show;
A.owner.show=parts=>{
 if(parts[1]==='accounts'&&parts[2]==='staff'&&parts[3]){
  location.replace('#/owner/accounts/staff');
  return;
 }
 if(parts[1]==='accounts'&&parts[2]!=='customers'&&A.session.ownerAllowed())M.load();
 show(parts);
};
const name=r=>r.first_name+' '+r.last_name;

const staffStatus=r=>r.status!=='active'?'inactive':r.is_temp_pass_changed?'active':'pending';
const filters=()=>`<form class="staff-toolbar" data-account-filter>${V.field('account-query','Search name or email',M.query,'search')}${V.select('account-status','Status',[['all','All statuses'],['active','Active'],['inactive','Inactive'],['pending','Pending']],M.status)}${V.select('account-sort','Sort',[['name','Name A–Z'],['newest','Newest first'],['oldest','Oldest first']],M.sort)}${V.button('account-clear','Clear filters')}</form>`;
function listing(records,render){
 const query=M.query.trim().toLowerCase(),rows=records.filter(r=>(name(r)+' '+r.email).toLowerCase().includes(query)&&(M.status==='all'||staffStatus(r)===M.status)).sort((a,b)=>M.sort==='name'?name(a).localeCompare(name(b)):String(a.created_at||'').localeCompare(String(b.created_at||''))*(M.sort==='oldest'?1:-1));
 const pages=Math.max(1,Math.ceil(rows.length/10));M.page=Math.min(M.page,pages);
 return render(rows.slice((M.page-1)*10,M.page*10))+`<div class="staff-pager">${V.button('account-prev','Previous',M.page===1?'disabled':'')}<span>Page ${M.page} of ${pages} · ${rows.length} results</span>${V.button('account-next','Next',M.page===pages?'disabled':'')}</div>`;
}
function staffManageDialog(staff){
 const status=staffStatus(staff),enabled=staff.status==='active',accessAction=enabled?'Deactivate':'Activate';
 const attrs=`data-id="${E(staff.id)}"`;
 const initials=E((staff.first_name?.[0]||'')+(staff.last_name?.[0]||''));
 const staffName=E(name(staff)),email=E(staff.email);
 const row=(icon,label,value,action='')=>`<div class="owner-staff-manage-row">
  <span class="material-symbols-outlined" aria-hidden="true">${icon}</span>
  <div><strong>${label}</strong><p>${value}</p></div>${action}
 </div>`;
 const security=status==='pending'&&staff.is_temp_pass_changed===0?`<section aria-labelledby="staff-manage-security">
  <h3 id="staff-manage-security">Security</h3>
  <div class="owner-staff-manage-group">${row('lock','Temporary password',
   staff.can_reveal_password?'View the initial account password.':'Generate a password to replace the original.',
   staff.can_reveal_password?V.button('account-reveal-password','View',attrs+' aria-label="View temporary password"'):
    V.button('account-replace-password','Replace',attrs+' aria-label="Generate replacement password"'))}</div>
 </section>`:'';
 return `<div class="owner-staff-manage">
  <p class="owner-staff-manage-intro">Update account details and access.</p>
  <div class="owner-staff-manage-profile">
   <span class="owner-staff-manage-avatar" aria-hidden="true">${initials}</span>
   <div><div class="owner-staff-manage-identity"><strong>${staffName}</strong>
    <span class="owner-staff-manage-status" data-status="${status}">${status}</span></div><p>${email}</p></div>
  </div>
  <section aria-labelledby="staff-manage-details">
   <h3 id="staff-manage-details">Account details</h3>
   <div class="owner-staff-manage-group">
    ${row('person','Full name',staffName,status==='pending'?V.button('account-edit-name','Edit',attrs+' aria-label="Edit name"'):'')}
    ${row('mail','Email address',email,status==='pending'?V.button('account-change-email','Change',attrs+' aria-label="Change email"'):'')}
   </div>
  </section>
  ${security}
  <section class="owner-staff-manage-access" data-destructive="${enabled}" aria-labelledby="staff-manage-access">
   <div><h3 id="staff-manage-access">${accessAction} account</h3>
    <p>${enabled?'Prevent this staff member from accessing Kitchen406.':'Restore this staff member’s access to Kitchen406.'}</p></div>
   ${V.button('account-status',accessAction,attrs)}
  </section>
  <footer class="owner-staff-manage-footer">${V.button('cancel-stock','Done','',true)}</footer>
 </div>`;
}
const staffDialogIcon=icon=>`<span class="material-symbols-outlined" aria-hidden="true">${icon}</span>`;
function setPasswordVisibility(dialog,visible){
 dialog.querySelector('input').type=visible?'text':'password';
 const toggle=dialog.querySelector('[data-owner="account-toggle-password"]');
 toggle.setAttribute('aria-label',visible?'Hide temporary password':'Show temporary password');
 toggle.querySelector('span').textContent=visible?'visibility_off':'visibility';
}
function showTemporaryPassword(id,password){
 A.owner.open('Temporary password',`<div class="owner-staff-subdialog" data-staff-secret>
  <div class="owner-staff-subdialog-content">
   <p class="owner-staff-subdialog-intro">Use this password for the initial sign-in.</p>
   <div class="owner-staff-password-field">
    ${V.field('staff-secret','Temporary password','','password','readonly autocomplete="off"')}
    <button type="button" data-owner="account-toggle-password" aria-label="Show temporary password" aria-controls="owner-staff-secret">${staffDialogIcon('visibility')}</button>
   </div>
   <button type="button" class="btn owner-staff-copy-password" data-owner="account-copy-revealed" data-id="${E(id)}">${staffDialogIcon('content_copy')}Copy password</button>
   <p class="owner-staff-password-note">${staffDialogIcon('verified_user')}Share only with the intended staff member.</p>
  </div>
  <footer class="owner-staff-subdialog-footer">${V.button('cancel-stock','Done','',true)}</footer>
 </div>`);
 document.querySelector('[data-staff-secret] input').value=password;
}
M.customerData=id=>{
 if(!A.session.ownerAllowed())return null;
 const customer=P.records.find(r=>r.customer_id===id);if(!customer)return null;
 const orders=A.operations.orders().filter(o=>o.customer_id===id),purchases=A.operations.purchases().filter(p=>p.customer_id===id),ids=new Set(purchases.map(p=>p.id));
 return {customer,orders,subscriptions:A.subscriptions.allRecords().filter(r=>ids.has(r.purchaseId)),requests:A.cakes.state.requests.filter(r=>r.customer_id===id),addresses:(id===P.id()?A.commerce.state.addresses:P.buckets.get(id)?.commerce.addresses||[]).filter(a=>a.customer_id===id)};
};
A.ownerPages.accounts=()=>{
 if(!A.session.ownerAllowed())return V.panel('Owner access required','');
 const [, ,section='staff']=A.owner.parts;
 if(section==='customers'){location.replace('#/owner/accounts/staff');return '';}
 if(section!=='staff')return V.panel('Page not found','');
 if(M.section!==section){M.views.set(M.section,{query:M.query,status:M.status,sort:M.sort,page:M.page});Object.assign(M,M.views.get(section)||{query:'',status:'all',sort:'name',page:1});M.section=section;}
 if(M.loading)return V.panel('Accounts','<p role="status">Loading staff accounts…</p>');
 if(M.loadError)return V.panel('Accounts','<p role="alert">'+E(M.loadError)+'</p>'+V.button('account-retry','Retry'));
 const body=V.intro('Accounts','',V.button('account-edit','Create staff account','',true))+filters()+listing(S.accounts,staffCards);
 return `<div class="owner-staff-accounts"><div class="staff-stack">${body}</div></div>`;
};
function staffCards(rows){return rows.length?`<div class="owner-staff-list">${rows.map(r=>`<article class="owner-staff-card"><div class="owner-staff-avatar" aria-hidden="true">${E((r.first_name?.[0]||'')+(r.last_name?.[0]||''))}</div><div class="owner-staff-copy"><div class="owner-commitment-heading"><strong>${E(name(r))}</strong>${V.badge(staffStatus(r))}</div><p>${E(r.email)}</p><span>Created ${V.date(V.businessDate(r.created_at))}</span></div><div class="owner-staff-actions">${V.button('account-manage','Edit',`data-id="${E(r.id)}" aria-label="Edit ${E(name(r))}"`)}</div></article>`).join('')}</div>`:'<p class="owner-orders-empty muted">No staff accounts match these filters.</p>';}

async function handleTemporaryPassword(action,button,id){
 const generation=A.session.generation;
 const current=()=>generation===A.session.generation&&button.isConnected;
 const replace=action==='account-confirm-replacement';
 const copy=action==='account-copy-revealed';
 button.disabled=true;
 try{
  const {password}=await A.authUI.api('staff/temporary-password'+(replace?'/replace':''),{id});
  if(!current())return;
  if(!copy){
   if(replace)M.load();
   showTemporaryPassword(id,password);
   return;
  }
  try{
   await navigator.clipboard.writeText(password);
   if(current())A.toast('Temporary password copied.');
  }catch{
   if(!current())return;
   const dialog=button.closest('[data-staff-secret]');
   setPasswordVisibility(dialog,true);
   dialog.querySelector('input').select();
   A.toast('Copy the selected password manually.');
  }
 }catch(error){
  if(!current())return;
  if(copy||replace)A.closeModal(true);
  M.load();
  A.toast(messages[error.message]||'The temporary password could not be retrieved.');
 }finally{
  if(current())button.disabled=false;
 }
}

document.addEventListener('click',async e=>{
 const button=e.target.closest('[data-owner]');if(!button||button.disabled||!A.session.ownerAllowed())return;
 const action=button.dataset.owner,id=button.dataset.id,r=M.find(id);
 if(action==='account-toggle-password'){
  const dialog=button.closest('[data-staff-secret]');
  if(dialog)setPasswordVisibility(dialog,dialog.querySelector('input').type==='password');
  return;
 }
 if(action==='account-manage'&&r){
  A.owner.open('Manage staff account',staffManageDialog(r));
  return;
 }
 if(r&&staffStatus(r)==='pending'&&(action==='account-edit-name'||action==='account-change-email')){
  const changingEmail=action==='account-change-email',title=changingEmail?'Change email':'Edit name';
  const fields=changingEmail?`<p class="owner-staff-current-email" aria-label="Current sign-in email">${E(r.email)}</p>
   ${V.field('email','New sign-in email','','email','required maxlength="254" placeholder="Enter new email address"')}
   <p class="owner-staff-email-note">${staffDialogIcon('info')}<span>Changing the email generates a new temporary password and sends updated credentials to the new address.</span></p>`:
   V.field('first_name','First name',r.first_name,'text','required maxlength="80"')+V.field('last_name','Last name',r.last_name,'text','required maxlength="80"');
  A.owner.open(title,`<form class="owner-staff-subdialog" data-staff-edit="${changingEmail?'email':'name'}" data-id="${E(r.id)}" data-version="${r.version}">
   <div class="owner-staff-subdialog-content">
    <p class="owner-staff-subdialog-intro">${changingEmail?'Update the staff member’s sign-in email.':'Update this staff member’s name.'}</p>
    ${fields}${V.error()}
   </div>
   <footer class="owner-staff-subdialog-footer">${V.button('cancel-stock','Cancel')}<button class="btn primary" type="submit">${changingEmail?'Confirm change':'Save name'}</button></footer>
  </form>`);
  return;
 }
 if(action==='account-replace-password'&&r){
  A.owner.open('Generate replacement password',`<div class="staff-stack" data-staff-secret><p>This account was created before temporary passwords could be retrieved. Generating a replacement invalidates the old password. Share the new password with ${E(name(r))}.</p><div class="owner-settings-actions">${V.button('cancel-stock','Cancel')}${V.button('account-confirm-replacement','Generate replacement',`data-id="${E(id)}"`,true)}</div></div>`);
  return;
 }
 if(['account-reveal-password','account-confirm-replacement','account-copy-revealed'].includes(action)){
  await handleTemporaryPassword(action,button,id);
  return;
 }
 if(action==='account-retry'){M.load();A.owner.render();}
 if(action==='account-clear'){Object.assign(M,{query:'',status:'all',sort:'name',page:1});A.owner.render();}
 if(action==='account-prev'||action==='account-next'){M.page+=action==='account-next'?1:-1;A.owner.render();}
 if(action==='account-edit'){
  A.owner.open('Create staff account',`<form class="staff-form" data-account-form>${V.field('first_name','First name','','text','required maxlength="80"')}${V.field('last_name','Last name','','text','required maxlength="80"')}${V.field('email','Email','','email','required maxlength="254"')}${V.field('password','Temporary password','','password','required minlength="8" maxlength="128" autocomplete="new-password"')}<div class="owner-settings-actions">${V.button('account-generate-password','Generate password')}${V.button('account-copy-password','Copy password')}</div><p>Use at least 8 characters with letters and numbers. The welcome email includes the sign-in email and temporary password, which staff must replace at first sign-in.</p><p data-account-password-status aria-live="polite"></p>${V.error()}<div class="owner-settings-actions">${V.button('cancel-stock','Cancel')}<button class="btn primary" type="submit">Save account</button></div></form>`);
 }
 if(action==='account-generate-password'||action==='account-copy-password'){
  const form=button.closest('[data-account-form]');
  if(!form)return;
  const password=form.elements.password,status=form.querySelector('[data-account-password-status]');
  if(action==='account-generate-password'){
   if(form.dataset.busy==='true'||form.dataset.saved==='true')return;
   const bytes=crypto.getRandomValues(new Uint8Array(16));
   password.type='text';
   password.value='K7-'+Array.from(bytes,byte=>byte.toString(16).padStart(2,'0')).join('');
   form.dataset.dirty='true';
   status.textContent='Temporary password generated.';
  }else if(!password.value)status.textContent='Enter or generate a password first.';
  else{
   try{
    await navigator.clipboard.writeText(password.value);
    status.textContent='Temporary password copied.';
   }catch{
    password.type='text';
    password.select();
    status.textContent='Copy the selected password manually.';
   }
  }
 }
 if(action==='account-status'&&r)A.owner.open(r.status==='active'?'Deactivate staff account':'Activate staff account',`<div class="owner-staff-confirm"><p>${E(name(r))} · ${r.status==='active'?'This prevents staff access. Historical activity is retained.':'This restores access to the predefined Staff role.'}</p>${V.error()}<div class="owner-settings-actions">${V.button('account-confirm-status','Confirm',`data-id="${E(id)}" data-version="${r.version}" data-status="${r.status==='active'?'inactive':'active'}"`,true)}${V.button('cancel-stock','Cancel')}</div></div>`);
 if(action==='account-confirm-status'){
  button.disabled=true;
  const {error}=await save('staff/status',{id,status:button.dataset.status,version:Number(button.dataset.version)});
  if(!button.isConnected||A.$('owner-modal').hidden)return;
  button.disabled=false;
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
document.addEventListener('input',e=>{const f=e.target.closest('[data-account-form],[data-staff-edit]');if(f)f.dataset.dirty='true';});
document.addEventListener('submit',async e=>{
 const f=e.target;if(!f.matches('[data-account-form],[data-account-filter],[data-staff-edit]'))return;e.preventDefault();if(!A.session.ownerAllowed())return;
 if(f.matches('[data-account-filter]')){Object.assign(M,{query:f.elements['account-query'].value,status:f.elements['account-status'].value,sort:f.elements['account-sort'].value,page:1});A.owner.render();return;}
 if(f.dataset.busy==='true'||f.dataset.saved==='true')return;
 f.dataset.busy='true';
 if(f.dataset.staffEdit){
  const button=f.querySelector('[type=submit]');
  button.disabled=true;
  const data={...Object.fromEntries(new FormData(f)),id:f.dataset.id,version:Number(f.dataset.version)};
  const {error,emailDelivery}=await save('staff/'+f.dataset.staffEdit,data,Number(f.dataset.generation));
  if(!f.isConnected||A.$('owner-modal').hidden)return;
  f.dataset.busy='false';button.disabled=false;
  if(error){f.querySelector('.owner-error').textContent=error;return;}
  A.closeModal(true);
  const message=f.dataset.staffEdit==='name'?'Staff name updated.':'Email updated and a new temporary password generated.';
  const delivery=emailDelivery?.status==='outbox'?' Message saved in .data/outbox.':
   emailDelivery?.status==='failed'?' Delivery could not be confirmed. Copy the new password from the staff entry.':'';
  A.toast(message+delivery);
  return;
 }
 const button=f.querySelector('[type=submit]'),password=f.elements.password;
 const generate=f.querySelector('[data-owner="account-generate-password"]');
 button.disabled=true;generate.disabled=true;password.readOnly=true;
 const data=Object.fromEntries(new FormData(f));
 const {error,emailDelivery}=await save('staff',data,Number(f.dataset.generation));
 if(!f.isConnected||A.$('owner-modal').hidden)return;
 f.dataset.busy='false';
 const feedback=f.querySelector('.owner-error');
 if(error){
  button.disabled=false;generate.disabled=false;password.readOnly=false;
  feedback.textContent=error;
  return;
 }
 f.dataset.saved='true';f.dataset.dirty='false';
 if(emailDelivery?.status==='failed'){
  feedback.textContent='Staff account saved. The welcome email could not be confirmed. Copy the temporary password to share it with the staff member.';
  for(const input of f.querySelectorAll('input'))input.readOnly=true;
  button.hidden=true;
  f.querySelector('[data-owner="cancel-stock"]').textContent='Done';
  return;
 }
 password.value='';
 A.closeModal(true);
 A.operations.changed();
 A.toast(emailDelivery?.status==='submitted'?'Staff account saved. Welcome email submitted.':
  emailDelivery?.status==='outbox'?'Staff account saved. Welcome email saved in .data/outbox.':'Staff account saved.');
});
const reset=A.commerce.reset;A.commerce.reset=()=>{reset();S.account=null;S.accounts=[];M.request=null;M.loading=false;M.loadError='';M.views.clear();M.section='staff';Object.assign(M,{query:'',status:'all',sort:'name',page:1});};
})();
