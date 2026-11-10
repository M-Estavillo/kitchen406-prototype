(() => {
const A=K406,P=A.account,R=A.addresses,C=A.commerce,U=C.ui,V=A.phase4,E=A.escape;
P.profileLoading=()=>V.accountPage('My Profile','View and manage your personal and account information.',`<div class="profile-loading" role="status" aria-label="Loading profile"><div aria-hidden="true">${Array.from({length:4},(_,i)=>`<section class="commerce-card"><div class="cart-loading-block cart-loading-title"></div>${i===1?`<div class="profile-details">${Array.from({length:4},()=>'<div><div class="cart-loading-block cart-loading-detail"></div><div class="cart-loading-block cart-loading-title"></div></div>').join('')}</div>`:'<div class="cart-loading-block cart-loading-detail"></div><div class="cart-loading-block cart-loading-detail"></div>'}</section>`).join('')}</div></div>`);
P.profile=()=>{
 const p=P.current;
 const form=`<form id="profile-form" class="auth-form"><div class="name-row">${V.field('first_name','First name',p.first_name,'text','required maxlength="80" autocomplete="given-name"')}${V.field('last_name','Last name',p.last_name,'text','required maxlength="80" autocomplete="family-name"')}</div>${V.field('mobile_number','Mobile number',p.mobile_number,'tel','required autocomplete="tel"')}${V.formError()}<div class="commerce-actions"><button class="btn primary">Save changes</button>${V.button('profile-cancel','Cancel')}</div></form>`;
 return V.accountPage('My Profile','View and manage your personal and account information.',
 U.panel(E(P.name()),`<p>${E(p.email)} ${V.badge('Verified')}</p><p class="muted">Customer since ${E(p.created_at.slice(0,4))} · Metro Cebu</p>`)+
 U.panel('Personal information',P.editing?form:`<dl class="profile-details"><div><dt>First name</dt><dd>${E(p.first_name)}</dd></div><div><dt>Last name</dt><dd>${E(p.last_name)}</dd></div><div><dt>Mobile number</dt><dd>${E(p.mobile_number)}</dd></div></dl><p class="muted">Used for order and delivery updates.</p>`,P.editing?'':V.button('profile-edit','Edit profile'))+
 U.panel('Email address',`<p>${E(p.email)}</p><p class="muted">Used for sign-in, verification, password recovery, and order updates.</p>`,V.button('email-open','Change email'))+
 U.panel('Password & security',`<p>Manage your password and account security.</p><p class="muted">${p.password_changed_at?'Last changed '+new Date(p.password_changed_at).toLocaleString():'No password change recorded in this preview.'}</p>`,V.button('password-open','Change password'))+U.link('account/addresses','Manage saved addresses'));
};
P.emailDialog=(target='')=>V.open('Change email address',`<form id="email-start-form" class="auth-form"><p>Current email: ${E(P.current.email)}</p>${V.field('email','New email address',target,'email','required autocomplete="email"')}${V.field('current','Current password','','password','required autocomplete="current-password"')}<p class="muted">Verify a code sent to the new address before updating your account.</p>${V.formError()}<div class="commerce-actions">${V.button('close','Cancel')}<button class="btn primary">Send verification code</button></div></form>`,'email-start');
P.verifyDialog=()=>{
 const v=P.verification;if(!v)return;
 // Do not call V.open here: the email verification transaction is still active.
 V.dialog='email-verify';A.$('phase4-dialog-title').textContent='Verify your new email';
 A.$('phase4-dialog-body').innerHTML=`<form id="email-verify-form" class="auth-form"><p>Enter the 6-digit code for <strong>${E(v.target_email)}</strong>.</p>${V.field('code','Verification code','','text','required inputmode="numeric" pattern="[0-9]{6}" maxlength="6" autocomplete="one-time-code"')}${V.formError()}<div class="commerce-actions">${V.button('email-resend','Resend code')}${V.button('email-restart','Change email address')}</div><p class="muted">Code expires after 10 minutes. Resend is available after 30 seconds.</p><div class="commerce-actions">${V.button('close','Cancel')}<button class="btn primary">Verify & update email</button></div></form>`;A.$('p4-code').focus();A.inspector();
};
P.passwordDialog=()=>V.open('Change password',`<form id="password-change-form" class="auth-form">${V.field('current','Current password','','password','required autocomplete="current-password"')}<a class="text-link" href="#/forgot" data-p4="forgot-current">Forgot current password?</a>${V.field('next','New password','','password','required minlength="8" autocomplete="new-password"')}<p class="muted">At least 8 characters with letters and numbers.</p>${V.field('confirm','Confirm new password','','password','required autocomplete="new-password"')}<label><input type="checkbox" data-p4-passwords> Show passwords</label>${V.formError()}<div class="commerce-actions">${V.button('close','Cancel')}<button class="btn primary">Save password</button></div></form>`,'password');
P.addressesLoading=()=>V.accountPage('Saved Addresses','Manage the addresses you use for Kitchen406 deliveries.',`<div role="status" aria-label="Loading saved addresses"><div aria-hidden="true"><div class="saved-address-toolbar"><div class="cart-loading-block saved-address-loading-button"></div></div><div class="address-book saved-address-book">${Array.from({length:2},()=>`<section class="commerce-card"><div class="cart-loading-block cart-loading-title"></div><div class="cart-loading-block cart-loading-detail"></div><div class="cart-loading-block cart-loading-detail"></div><div class="cart-loading-block saved-address-loading-button"></div></section>`).join('')}</div></div></div>`);
P.addressesView=()=>{
 const list=P.mock.page==='empty'?[]:R.active();
 return V.accountPage('Saved Addresses','Manage the addresses you use for Kitchen406 deliveries.',`<div class="saved-address-toolbar">${V.button('address-add','+ Add new address',false,'',true)}</div>`+
 (P.editor.form?`<div class="saved-address-editor">${C.checkout.addressForm(P.editor).replace('data-commerce="address-cancel"','data-p4="address-cancel"')}</div>`:'')+
 (list.length?`<div class="address-book saved-address-book">${list.map(a=>U.panel(E(a.label),`<div class="saved-address-details${a.landmark?' has-landmark':''}">${U.address({...a,is_default:false})}<div class="commerce-actions">${!a.is_default?V.button('address-default','Set as default',false,`data-id="${E(a.address_id)}"`):''}${[['address-edit','edit','Edit'],['address-remove','delete','Remove']].map(([action,icon,label])=>`<button type="button" class="saved-address-icon" data-p4="${action}" data-id="${E(a.address_id)}" aria-label="${label} ${E(a.label)} address" title="${label} address"><span class="material-symbols-outlined" aria-hidden="true">${icon}</span></button>`).join('')}</div></div>`,a.is_default?V.badge('Default address'):'')).join('')}</div>`:U.empty('No saved addresses yet','Save a delivery location to make future orders easier.',V.button('address-add','Add your first address'))));
};
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-p4]');if(!el||el.disabled)return;const action=el.dataset.p4;
 if(!P.allowed()&&action!=='sign-out')return;
 if(action==='profile-edit'){P.editing=true;P.render();}
 if(action==='profile-cancel'){P.editing=false;P.render();}
 if(action==='email-open')P.emailDialog();
 if(action==='email-resend'){const error=P.resendEmail();if(error)V.error(error);else{P.verifyDialog();A.toast('New demo code ready. No email was sent.');}}
 if(action==='email-restart'){const target=P.verification?.target_email;P.verification=null;P.emailDialog(target);}
 if(action==='password-open')P.passwordDialog();
 if(action==='forgot-current'){A.email=P.current.email;A.returnRoute='#/account/profile';}
 if(['address-add','address-edit','address-cancel'].includes(action)&&['account','custom-cakes'].includes(A.route)){
  const F=C.addressContext().editor;F.mapBusy=false;F.editing=action==='address-edit'?el.dataset.id:null;F.form=action==='address-cancel'?null:action==='address-edit'?C.copy(R.find(el.dataset.id)):{is_default:!R.active().length};V.render();
 }
 if(action==='address-default'){R.setDefault(el.dataset.id);P.render();A.toast('Default address updated.');}
 if(action==='address-remove')V.open('Remove this address?',`<p>It will no longer be available for new orders. Existing purchases keep their delivery details.</p><div class="commerce-actions">${V.button('close','Keep address')}${V.button('address-archive','Remove address',false,`data-id="${E(el.dataset.id)}"`,true)}</div>`,'archive');
 if(action==='address-archive'){R.archive(el.dataset.id);A.closeModal();P.render();A.toast('Address removed.');}
});
document.addEventListener('change',e=>{if(e.target.matches('[data-p4-passwords]'))e.target.closest('form').querySelectorAll('input:not([type=checkbox])').forEach(input=>input.type=e.target.checked?'text':'password');});
document.addEventListener('submit',async e=>{
 const id=e.target.id;if(!['profile-form','email-start-form','email-verify-form','password-change-form'].includes(id))return;
 e.preventDefault();if(!P.allowed())return;const form=e.target,data=Object.fromEntries(new FormData(form)),button=form.querySelector('button:not([type=button])');if(button.disabled)return;button.disabled=true;
 let error='';
 try{
  if(id==='profile-form'){error=P.saveProfile(data);if(!error){P.editing=false;P.render();A.toast('Profile details updated.');}}
  if(id==='email-start-form'){error=await P.beginEmail(data.email,data.current);if(form.isConnected&&!error)P.verifyDialog();}
  if(id==='email-verify-form'){error=P.verifyEmail(data.code);if(!error){A.closeModal();P.render();A.toast('Email address updated.');}}
  if(id==='password-change-form'){error=await P.changePassword(data.current,data.next,data.confirm);if(form.isConnected&&!error){A.closeModal();P.render();A.toast('Password changed in this preview.');}}
 }catch{error='This change could not be completed. Please retry.';}
 if(form.isConnected){button.disabled=false;if(error)V.error(error);}
});
})();
