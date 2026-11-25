(() => {
const A=K406,P=A.account,R=A.addresses,C=A.commerce,U=C.ui,V=A.phase4,E=A.escape;
P.profileLoading=()=>V.accountPage('My Profile','View and manage your personal and account information.',`<div class="profile-loading" role="status" aria-label="Loading profile"><div aria-hidden="true">${Array.from({length:4},(_,i)=>`<section class="commerce-card"><div class="cart-loading-block cart-loading-title"></div>${i===1?`<div class="profile-details">${Array.from({length:4},()=>'<div><div class="cart-loading-block cart-loading-detail"></div><div class="cart-loading-block cart-loading-title"></div></div>').join('')}</div>`:'<div class="cart-loading-block cart-loading-detail"></div><div class="cart-loading-block cart-loading-detail"></div>'}</section>`).join('')}</div></div>`);
P.profileAccount=()=>A.session.ownerAllowed()?A.session.owner:A.staff.allowed()?A.staff.account:P.allowed()?P.current:null;
P.profileRoute=()=>({owner:'#/owner/settings',staff:'#/staff/account'}[A.session.workspace()]||'#/account/profile');
P.passwordRoute=()=>'#/'+(A.session.workspace()||'account')+'/change-password';
function renderProfile(){
 const workspace=A.session.workspace();
 if(workspace)A[workspace].render();
 else P.render();
}
P.profileContent=p=>{
 const customer=p.role==='customer';
 const mobileField=customer?V.field('mobile_number','Mobile number',p.mobile_number,'tel','required autocomplete="tel"'):'';
 const form=`<form id="profile-form" class="auth-form"><div class="name-row">${V.field('first_name','First name',p.first_name,'text','required maxlength="80" autocomplete="given-name"')}${V.field('last_name','Last name',p.last_name,'text','required maxlength="80" autocomplete="family-name"')}</div>${mobileField}${V.formError()}<div class="commerce-actions"><button class="btn primary">Save changes</button>${V.button('profile-cancel','Cancel')}</div></form>`;
 const mobileDetails=customer?`<div><dt>Mobile number</dt><dd>${E(p.mobile_number)}</dd></div>`:'';
 return '<div class="customer-profile">'+U.panel(E(p.first_name+' '+p.last_name),`<p>${E(p.email)} ${p.email_verified_at?V.badge('Verified'):''}</p>`+
  (customer?`<p class="muted">Customer since ${E(p.created_at.slice(0,4))} · Metro Cebu</p>`:''))+
  U.panel('Personal information',P.editing?form:`<dl class="profile-details"><div><dt>First name</dt><dd>${E(p.first_name)}</dd></div><div><dt>Last name</dt><dd>${E(p.last_name)}</dd></div>${mobileDetails}</dl>`+
   (customer?'<p class="muted">Used for order and delivery updates.</p>':''),P.editing?'':V.button('profile-edit','Edit profile'))+
  U.panel('Email address',`<p>${E(p.email)}</p><p class="muted">Used for sign-in, verification, and password recovery${customer?', and order updates':''}.</p>`,V.button('email-change','Change email'))+
  U.panel('Password & security',`<p>Manage your password and account security.</p><p class="muted">${p.password_changed_at?'Last changed '+new Date(p.password_changed_at).toLocaleString():'No password change recorded.'}</p>`,U.link(P.passwordRoute().slice(2),'Change password'))+
  (customer?U.link('account/addresses','Manage saved addresses'):'')+'</div>';
};
P.profile=()=>V.accountPage('My Profile','View and manage your personal and account information.',P.profileContent(P.current));
const emailErrors={
 'invalid-email':'Enter a valid email address.',
 'same-email':'Enter a different email address.',
 'incorrect-password':'The current password is incorrect.',
 'account-exists':'This email address is already in use.',
 'try-later':'Wait 30 seconds before requesting a code for a different address.',
 'invalid-code':'This code is incorrect, expired, or already used. Request a new code if needed.',
 'sign-in-required':'Sign in again to change your email address.'
};
function openEmailChange(email=''){
 const {openForm,formField,primaryButton}=A.authUI;
 openForm({
  id:'email-change-form',
  title:'Change email address',
  subtitle:'Enter a new address for your Kitchen406 account.',
  body:formField('email','New email address',{type:'email',autocomplete:'email',max:254,value:email,attributes:'required'})+
   formField('password','Current password',{type:'password',autocomplete:'current-password',attributes:'required'})+
   V.formError()+primaryButton('Request verification code')
 });
}
function showEmailVerification(email,{challengeId,resendAt,verificationEmail=email}){
 const {openForm,formField,primaryButton,codeOutbox,resendButton}=A.authUI;
 const verifyCurrent=verificationEmail!==email;
 openForm({
  id:'email-change-verify-form',
  title:verifyCurrent?'Verify your current email address':'Verify your new email address',
  subtitle:verifyCurrent?'Enter the 6-digit code sent to '+verificationEmail+' to switch your sign-in email to '+email+'.':'Enter the 6-digit code for '+email+'.',
  body:codeOutbox(challengeId)+
   '<input type="hidden" name="challengeId" value="'+E(challengeId)+'">'+
   formField('code','Verification code',{autocomplete:'one-time-code',max:6,attributes:'required'})+
   V.formError()+primaryButton('Verify and change email')+
   resendButton('Request another code',resendAt,'data-p4="email-change" data-email="'+E(email)+'"')
 });
}
P.addressesLoading=()=>V.accountPage('Saved Addresses','Manage the addresses you use for Kitchen406 deliveries.',`<div role="status" aria-label="Loading saved addresses"><div aria-hidden="true"><div class="saved-address-toolbar"><div class="cart-loading-block saved-address-loading-button"></div></div><div class="address-book saved-address-book">${Array.from({length:2},()=>`<section class="commerce-card"><div class="cart-loading-block cart-loading-title"></div><div class="cart-loading-block cart-loading-detail"></div><div class="cart-loading-block cart-loading-detail"></div><div class="cart-loading-block saved-address-loading-button"></div></section>`).join('')}</div></div></div>`);
P.addressesView=()=>{
 const list=P.mock.page==='empty'?[]:R.active();
 return V.accountPage('Saved Addresses','Manage the addresses you use for Kitchen406 deliveries.',`<div class="saved-address-toolbar">${V.button('address-add','+ Add new address',false,'',true)}</div>`+
 (P.editor.form?`<div class="saved-address-editor">${C.checkout.addressForm(P.editor).replace('data-commerce="address-cancel"','data-p4="address-cancel"')}</div>`:'')+
 (list.length?`<div class="address-book saved-address-book">${list.map(a=>U.panel(E(a.label),`<div class="saved-address-details${a.landmark?' has-landmark':''}">${U.address({...a,is_default:false})}<div class="commerce-actions">${!a.is_default?V.button('address-default','Set as default',false,`data-id="${E(a.address_id)}"`):''}${[['address-edit','edit','Edit'],['address-remove','delete','Remove']].map(([action,icon,label])=>`<button type="button" class="saved-address-icon" data-p4="${action}" data-id="${E(a.address_id)}" aria-label="${label} ${E(a.label)} address" title="${label} address"><span class="material-symbols-outlined" aria-hidden="true">${icon}</span></button>`).join('')}</div></div>`,a.is_default?V.badge('Default address'):'')).join('')}</div>`:U.empty('No saved addresses yet','Save a delivery location to make future orders easier.',V.button('address-add','Add your first address'))));
};
document.addEventListener('click',async e=>{
 const el=e.target.closest('[data-p4]');if(!el||el.disabled)return;const action=el.dataset.p4;
 if(['email-change','profile-edit','profile-cancel'].includes(action)){
  if(!P.profileAccount())return;
  if(action==='email-change')openEmailChange(el.dataset.email);
  else{P.editing=action==='profile-edit';renderProfile();}
  return;
 }
 if(!P.allowed()&&action!=='sign-out')return;
 if(['address-add','address-edit','address-cancel'].includes(action)&&['account','custom-cakes'].includes(A.route)){
  const F=C.addressContext().editor;F.mapBusy=false;F.editing=action==='address-edit'?el.dataset.id:null;F.form=action==='address-cancel'?null:action==='address-edit'?C.copy(R.find(el.dataset.id)):{is_default:!R.active().length};V.render();
 }
 if(action==='address-default'){const result=await R.setDefault(el.dataset.id);P.render();A.toast(result.error||'Default address updated.');}
 if(action==='address-remove')V.open('Remove this address?',`<p>It will no longer be available for new orders. Existing purchases keep their delivery details.</p><div class="commerce-actions">${V.button('close','Keep address')}${V.button('address-archive','Remove address',false,`data-id="${E(el.dataset.id)}"`,true)}</div>`,'archive');
 if(action==='address-archive'){const result=await R.archive(el.dataset.id);if(!result.error){A.closeModal();P.render();}A.toast(result.error||'Address removed.');}
});
document.addEventListener('submit',async e=>{
 if(!['profile-form','email-change-form','email-change-verify-form'].includes(e.target.id))return;
 e.preventDefault();const profile=P.profileAccount();if(!profile)return;const form=e.target,data=Object.fromEntries(new FormData(form)),button=form.querySelector('button:not([type=button])');if(button.disabled)return;button.disabled=true;
 let error='';
 try{
  if(form.id==='email-change-form'){
   const challenge=await A.authUI.requestEmailChange(data);
   if(P.profileAccount()===profile&&form.isConnected&&A.modal==='auth-modal')showEmailVerification(data.email.trim().toLowerCase(),challenge);
  }else if(form.id==='email-change-verify-form'){
   const {account}=await A.authUI.verifyEmailChange(data);
   if(P.profileAccount()===profile&&profile.account_id===account.account_id){
    Object.assign(profile,account);
    A.email=account.email;
    if(form.isConnected&&A.modal==='auth-modal')A.closeModal();
    renderProfile();
    A.shell.sync();
    A.toast('Email address updated.');
   }
  }else{
   if(profile.role==='customer')error=await P.saveProfile(data);
   else{
    const saved=await A.authUI.saveProfile(data);
    if(P.profileAccount()===profile&&profile.account_id===saved.account_id)Object.assign(profile,saved);
   }
   if(P.profileAccount()===profile&&form.isConnected&&!error){
    P.editing=false;renderProfile();A.shell.sync();A.toast('Profile details updated.');
   }
  }
 }catch(failure){error=emailErrors[failure.message]||'This change could not be completed. Please retry.';}
 if(form.isConnected){button.disabled=false;if(error)V.error(error);}
});
})();
