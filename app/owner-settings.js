/* Owner profile uses the same actor and password hash as mock sign-in. */
(() => {
const A=K406,V=A.ownerUI,E=A.escape,P=A.account,O=A.owner;
const S=A.ownerSettings={verification:null,busy:false};
A.ownerPages.settings=()=>{const p=A.session.owner;return V.intro('Settings','Manage your profile and account security.')+'<div class="owner-account-settings">'+V.panel('Profile Information',`<dl class="owner-detail-facts"><div><dt>Name</dt><dd>${E(p.first_name+' '+p.last_name)}</dd></div><div><dt>Email</dt><dd>${E(p.email)}</dd></div><div><dt>Contact number</dt><dd>${E(p.mobile_number||'Not provided')}</dd></div><div><dt>Role</dt><dd>Owner/Admin</dd></div></dl>`,V.button('settings-profile','Edit profile'))+'<div class="owner-section">'+V.panel('Account Security','<p>Update your sign-in credentials.</p>','<div class="staff-actions">'+V.button('settings-password','Change password')+V.button('settings-email','Change email')+'</div>')+'</div></div>';};
const form=(kind,body)=>`<form data-settings-form="${kind}" data-generation="${A.session.generation}" class="staff-form">${body}${V.error()}<div class="staff-actions">${V.button('discard-modal','Cancel')}<button class="btn primary">Save changes</button></div></form>`;
// Settings inputs are discarded on dismissal and are only applied on save.
document.addEventListener('click',e=>{if(!A.session.ownerAllowed())return;const action=e.target.closest('[data-owner]')?.dataset.owner,p=A.session.owner;
 if(action==='settings-profile')O.open('Edit profile',form('profile',V.field('first_name','First name',p.first_name,'text','required')+V.field('last_name','Last name',p.last_name,'text','required')+V.field('mobile_number','Contact number',p.mobile_number||'','tel','required')));
 if(action==='settings-password')O.open('Change password',form('password',V.field('current','Current password','','password','required')+V.field('next','New password','','password','required minlength="8"')+'<p>At least eight characters with letters and numbers.</p>'+V.field('confirm','Confirm password','','password','required')));
 if(action==='settings-email'){S.verification=null;O.open('Change email',form('email',V.field('email','New email','','email','required')+V.field('current','Current password','','password','required')));}
});
document.addEventListener('submit',async e=>{
 const f=e.target,kind=f.dataset.settingsForm;if(!kind)return;e.preventDefault();if(S.busy||!A.session.ownerAllowed())return;
 const data=Object.fromEntries(new FormData(f)),p=A.session.owner,generation=A.session.generation;let error='';S.busy=true;
 try{
 if(kind==='profile'){const mobile=P.mobile(data.mobile_number);if(!data.first_name.trim()||!data.last_name.trim()||!mobile)error='Enter your name and a valid Philippine mobile number.';else if(!O.saveError)Object.assign(p,{first_name:data.first_name.trim(),last_name:data.last_name.trim(),mobile_number:mobile});}
 else if(kind==='verify'){const v=S.verification;if(!v||v.generation!==generation||Date.now()>v.expires||data.code!==v.code)error='The verification code is invalid or expired.';else if(A.ownerAccounts.duplicate(v.email,p.id))error='Email is already in use.';else if(!O.saveError){p.email=v.email;p.email_verified_at=new Date().toISOString();S.verification=null;}}
 else{
 const hash=await P.hash(data.current),expected=p.hash||await P.hash('Kitchen406!');
 if(!f.isConnected||generation!==A.session.generation||!A.session.ownerAllowed())return;
 if(hash!==expected)error='Current password is incorrect.';
 else if(kind==='password'){if(!P.passwordValid(data.next))error='Use at least eight characters with letters and numbers.';else if(data.next!==data.confirm)error='Passwords do not match.';else if(data.next===data.current)error='Choose a different password.';else{const next=await P.hash(data.next);if(!f.isConnected||generation!==A.session.generation)return;if(!O.saveError){p.hash=next;p.password_changed_at=new Date().toISOString();}}}
 else if(kind==='email'){const email=data.email.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(email)||email===p.email||A.ownerAccounts.duplicate(email,p.id))error='Enter a different, unused valid email.';else if(!O.saveError){S.verification={email,code:String(++P.codeSerial),expires:Date.now()+600000,generation};O.open('Verify new email',form('verify',`<p>Enter the code for ${E(email)}.</p><p>Preview code: ${S.verification.code}</p>`+V.field('code','Verification code','','text','required')));return;}}
 }
 if(O.saveError)error='Changes could not be saved. Please retry.';
 if(error)f.querySelector('.owner-error').textContent=error;else{A.closeModal(true);O.render();A.shell.sync();A.toast('Account updated.');}
 }finally{S.busy=false;}
});
})();
