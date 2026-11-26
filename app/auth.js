/* Frontend for the local account API. */
(() => {
const A=K406,$=A.$,esc=A.escape;
const S={view:'sign-in',mode:'default',values:{},errors:{},generation:0};
const titles={'sign-in':'Welcome back',register:'Create your account',verify:'Verify your email',forgot:'Forgot your password?',reset:'Reset your password','staff-setup':'Set your staff password','change-password':'Want to change your password?'};
const link=(route,label)=>'<a href="#/'+route+'">'+label+'</a>';
const busy=()=>S.mode==='loading';
const disabled=()=>busy()?' disabled':'';

async function api(action,input){
 const response=await fetch('/api/auth/'+action,input===undefined?undefined:{
  method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)
 });
 const data=await response.json();
 if(!response.ok)throw Error(data.error);
 return data;
}
function applyAccount(account){
 A.email=account.email;
 if(account.role==='staff'&&!account.is_temp_pass_changed){
  clearAuthSession();
  A.email=account.email;
  S.staffSetup=true;
  return;
 }
 S.staffSetup=false;
 A.notifications.bind(account);
 A.session.invalidate();
 A.staff.account=null;
 A.session.owner=null;
 A.inventory.useDatabase(['staff','admin'].includes(account.role)?account:null);
 if(account.role==='staff'){
  A.staff.role='staff';
  A.staff.account={...account,id:account.staff_id,setup:true};
  A.setAuth('signedin');
  if(A.staff.allowed())A.inventory.refresh();
  A.shell.sync();
  return;
 }
 if(account.role==='admin'){
  A.staff.role='admin';
  A.session.owner={...account,id:account.admin_id,setup:true};
  A.setAuth('signedin');
  if(A.session.ownerAllowed())A.inventory.refresh();
  A.shell.sync();
  return;
 }
 A.staff.role='customer';
 A.session.owner=null;
 const cached=A.account.records.find(record=>record.account_id===account.account_id);
 if(cached)Object.assign(cached,account);
 else A.account.records.push(account);
 A.setAuth('signedin');
 A.shell.sync();
 A.productAdmin.loadCatalog().catch(()=>{});
}
const challengeKey=view=>'k406-'+view;
function setChallenge(view,email,data){
 sessionStorage.setItem(challengeKey(view),JSON.stringify({...data,email}));
}
function challenge(view){
 try{
  const pending=JSON.parse(sessionStorage.getItem(challengeKey(view)));
  return pending;
 }catch{return null;}
}
function remember(){
 document.querySelectorAll('#auth-form input[name]').forEach(el=>{S.values[el.name]=el.value;});
}

function formField(name,label,{type='text',autocomplete='',max=128,value='',error='',attributes=''}={}){
 const password=type==='password',id='auth-'+name;
 const toggle=password?'<button type="button" data-eye="'+name+'" aria-label="Show '+esc(label.toLowerCase())+'"><span class="material-symbols-outlined">visibility</span></button>':'';
 return '<div class="field"><label for="'+id+'">'+esc(label)+'</label><div class="'+(password?'password-wrap':'')+'"><input id="'+id+'" name="'+name+'" type="'+type+'" autocomplete="'+autocomplete+'" maxlength="'+max+'" value="'+(password?'':esc(value))+'" aria-describedby="error-'+name+'" '+(error?'aria-invalid="true"':'')+' '+attributes+(name==='code'?' inputmode="numeric" pattern="[0-9]{6}"':'')+'>'+toggle+'</div><p class="field-error" id="error-'+name+'">'+esc(error)+'</p></div>';
}
function field(name,label,type='text',autocomplete='',max=128){
 return formField(name,label,{type,autocomplete,max,value:S.values[name],error:S.errors[name],attributes:disabled()});
}
const primaryButton=(label,attributes='')=>'<button class="btn primary wide"'+attributes+'>'+esc(label)+'</button>';
function updateResendButton(button){
 const seconds=Math.max(0,Math.ceil((Number(button.dataset.resendAt)-Date.now())/1000));
 if(!Number.isFinite(seconds))return;
 button.disabled=seconds>0||button.dataset.busy==='true';
 const label=button.dataset.resendLabel;
 button.textContent=seconds>0?label+' in '+seconds+'s':label;
}
function updateResendButtons(){
 if(A.modal==='auth-modal')$('auth-card-content').querySelectorAll('[data-resend-at]').forEach(updateResendButton);
}
function resendButton(label,resendAt,attributes='',loading=false){
 const until=Number(resendAt)||0;
 const seconds=Math.max(0,Math.ceil((until-Date.now())/1000));
 return '<button class="text-link" type="button" data-resend-at="'+until+'" data-resend-label="'+esc(label)+'" data-busy="'+loading+'" '+attributes+
  (seconds>0||loading?' disabled':'')+'>'+esc(seconds>0?label+' in '+seconds+'s':label)+'</button>';
}
setInterval(updateResendButtons,250);
const codeOutbox=id=>'<p class="muted auth-outbox">Open <code>.data/outbox/'+esc(id)+'.txt</code> for the code.</p>';
function renderForm({id,title,subtitle,body,footer='',feedback='',attributes=''}){
 $('auth-card-content').innerHTML='<h2 id="auth-title">'+esc(title)+'</h2><p>'+esc(subtitle)+'</p>'+feedback+
  '<form id="'+id+'" class="auth-form" '+attributes+'>'+body+'</form>'+(footer?'<div class="auth-links">'+footer+'</div>':'');
}
function openForm(options){
 renderForm(options);
 A.openModal('auth-modal');
 requestAnimationFrame(()=>{if(A.modal==='auth-modal')$(options.id)?.querySelector('input:not([type=hidden])')?.focus();});
}
function feedback(){
 const messages={
  loading:'Please wait…',
  error:'Unable to reach the local account service. Start the local server and try again.',
  'server-error':'The account service could not complete this request. Please try again.',
  'invalid-credentials':'Sign in failed. Check your email and password.',
  'verification-required':'Verify your email before signing in. '+link('verify','Verify email'),
  'account-exists':'An account already uses this email. '+link('sign-in','Sign in')+' or '+link('verify','Request a verification code')+'.',
  'invalid-code':'This code is incorrect, expired, or already used. Check the code or request a new one.',
  'invalid-email':'Enter a valid email address.',
  'recovery-account-not-found':'No active customer account was found for that email address.',
  'sign-in-required':'Your session expired. '+link('sign-in','Sign in again')+' to continue.',
  'invalid-registration':'Check your contact information and password.',
  'invalid-password':'Use 8–128 characters with at least one letter and one number.',
  'try-later':'Too many sign-in attempts. Try again in a minute.',
  'same-password':S.view==='staff-setup'?'Choose a password different from your temporary password.':'Choose a password different from your current password.',
  'incorrect-password':'The current password is incorrect.',
  'password-mismatch':'The new passwords do not match.',
  'staff-setup-complete':'Password setup is already complete. Sign in with your new password.',
  resent:'If a new code was needed, it is in the local outbox.',
  success:S.view==='verify'?'Email verified. You can now sign in.':'Password updated. Sign in with your new password.'
 };
 return messages[S.mode]?'<div class="alert '+(['success','resent'].includes(S.mode)?'success':busy()?'':'error')+'" role="status">'+messages[S.mode]+'</div>':'';
}

function render(){
 const done=S.mode==='success',view=S.view;
 const pending=challenge(view);
 let subtitle='',body='';
 const email=()=>field('email','Email','email','email',254);
 const password=()=>field('password','New password','password','new-password')+field('confirm','Confirm password','password','new-password');
 const submit=label=>primaryButton(label,disabled());
 const resend=resendButton('Resend code',(pending?.resendAt??(pending?.expiresAt-570000)),'data-auth-action="resend"',busy());
 const outbox=pending?codeOutbox(pending.challengeId):'';
 if(view==='sign-in'){
  subtitle=A.context==='header'?'Sign in to your Kitchen406 account.':'Sign in to continue.';
  body=email()+field('password','Password','password','current-password')+'<div class="text-right">'+link('forgot','Forgot password?')+'</div>'+submit('Sign in');
 }else if(view==='staff-setup'){
  subtitle='Replace the temporary password before opening the staff workspace.';
  body=password()+submit('Set password');
 }else if(view==='register'){
  subtitle='Create an account to order, subscribe, and track your purchases.';
  body='<div class="name-row">'+field('firstName','First name','text','given-name',80)+field('lastName','Last name','text','family-name',80)+'</div>'+email()+field('mobile','Mobile number (+63)','tel','tel-national',25)+password()+submit('Create account');
 }else if(view==='verify'){
  if(done)body='<a class="btn primary wide" href="#/sign-in">Sign in</a>';
  else if(pending){
   subtitle='Enter the 6-digit code for '+pending.email+'.';
   body=outbox+field('code','Verification code','text','one-time-code',6)+submit('Verify email')+resend+' <button class="text-link" type="button" data-auth-action="different-email"'+disabled()+'>Use a different email</button>';
  }else{
   subtitle='Enter your email to request a verification code.';
   body=email()+submit('Request code');
  }
 }else if(view==='change-password'){
  body=field('currentPassword','Current password','password','current-password')+
   field('password','New password','password','new-password')+
   field('confirm','Confirm new password','password','new-password')+submit('Change password');
 }else if(view==='forgot'){
  subtitle='Enter your email address to request a password reset code.';
  body=email()+submit('Request reset code');
 }else if(done){
  body='<a class="btn primary wide" href="#/sign-in">Sign in</a>';
 }else if(pending){
  subtitle='Enter the reset code for '+pending.email+'.';
  body=outbox+field('code','Reset code','text','one-time-code',6)+password()+submit('Reset password')+resend+' '+link('forgot','Use a different email');
 }else{
  body='<a class="btn primary wide" href="#/forgot">Request a reset code</a>';
 }
 const footer=view==='sign-in'?'New to Kitchen406? '+link('register','Create an account'):['reset','change-password'].includes(view)?'':link('sign-in','Back to Sign In');
 renderForm({id:'auth-form',title:titles[view],subtitle,body,footer,feedback:feedback(),attributes:'novalidate'});
 $('auth-form').addEventListener('submit',submitForm);
}
function show(view){
 S.generation++;
 S.view=view;
 S.mode='default';
 S.errors={};
 S.values={email:A.email};
 render();
 A.openModal('auth-modal');
}
function close(returnRoute=A.returnRoute){
 if(!$('auth-form')){A.closeModal();return;}
 S.generation++;
 S.values={};
 A.closeModal();
 location.hash=returnRoute||'#/shop';
}
function validate(action,values){
 const errors={};
 if(['sign-in','register','verification-code','forgot'].includes(action)&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email?.trim()||''))errors.email='Enter a valid email address.';
 if(action==='register'){
  if(!values.firstName?.trim())errors.firstName='First name is required.';
  if(!values.lastName?.trim())errors.lastName='Last name is required.';
  if(!A.account.mobile(values.mobile))errors.mobile='Enter a valid Philippine mobile number.';
 }
 if(action==='sign-in'&&!values.password)errors.password='Password is required.';
 if(action==='change-password'&&!values.currentPassword)errors.currentPassword='Enter your current password.';
 if(['register','reset','staff-setup','change-password'].includes(action)){
  if(!A.account.passwordValid(values.password)||values.password.length>128)errors.password='Use 8–128 characters with a letter and a number.';
  if(!values.confirm||values.confirm!==values.password)errors.confirm='Passwords do not match.';
 }
 if(['verify','reset'].includes(action)&&!/^\d{6}$/.test(values.code||''))errors.code='Enter the 6-digit code.';
 S.errors=errors;
 return !Object.keys(errors).length;
}

async function submitForm(event){
 event.preventDefault();
 if(busy()||S.mode==='success')return;
 remember();
 const view=S.view,pending=challenge(view);
 const action=view==='verify'&&!pending?'verification-code':view;
 if(!validate(action,S.values)){
  S.mode='default';
  render();
  $('auth-form').querySelector('[aria-invalid=true]')?.focus();
  return;
 }
 const input=action==='change-password'?{currentPassword:S.values.currentPassword,password:S.values.password,confirm:S.values.confirm}:{...S.values,challengeId:pending?.challengeId};
 if(action!=='change-password')delete input.confirm;
 delete S.values.currentPassword;
 delete S.values.password;
 delete S.values.confirm;
 await perform(action,input);
}
async function perform(action,input,resend=false){
 const generation=++S.generation;
 S.mode='loading';
 S.errors={};
 render();
 try{
  const result=await api(action==='staff-setup'?'staff/setup':action,input);
  if(action==='reset'||action==='change-password'){
   const email=result.email||challenge('reset')?.email||'';
   if(action==='reset')sessionStorage.removeItem(challengeKey('reset'));
   clearAuthSession();
   A.email=email;
   A.toast('Password updated. Sign in with your new password.');
   location.replace('#/sign-in');
   return;
  }
  if(generation!==S.generation)return;
  if(action==='sign-in'||action==='staff-setup'){
   applyAccount(result.account);
   if(S.staffSetup){close('#/staff-setup');return;}
   const role=result.account.role;
   close(role==='staff'?'#/staff':role==='admin'?(A.returnRoute.startsWith('#/owner')?A.returnRoute:'#/owner'):undefined);
   A.toast(action==='staff-setup'?'Password set.':'Signed in.');
   return;
  }
  if(['register','verification-code','forgot'].includes(action)){
   const next=action==='forgot'?'reset':'verify';
   A.email=result.email||input.email.trim().toLowerCase();
   setChallenge(next,A.email,result);
   S.values={email:A.email};
   if(S.view!==next){location.hash='#/'+next;return;}
   S.mode=resend?'resent':'default';
  }else{
   sessionStorage.removeItem(challengeKey(S.view));
   S.mode='success';
   S.values={};
  }
 }catch(error){
  if(generation!==S.generation)return;
  S.mode=error.message;
  if(!['server-error','invalid-credentials','verification-required','account-exists','invalid-code','invalid-email','invalid-registration','invalid-password','try-later','sign-in-required','recovery-account-not-found','same-password','incorrect-password','password-mismatch','staff-setup-complete'].includes(S.mode))S.mode='error';
 }
 render();
}

$('auth-modal').addEventListener('click',e=>{
 const eye=e.target.closest('[data-eye]');
 if(eye){
  const input=$('auth-'+eye.dataset.eye);
  input.type=input.type==='password'?'text':'password';
  eye.setAttribute('aria-label',input.type==='password'?'Show password':'Hide password');
  eye.querySelector('span').textContent=input.type==='password'?'visibility':'visibility_off';
 }
 if(e.target.closest('[data-auth-action="different-email"]')&&!busy()){
  sessionStorage.removeItem('k406-verify');
  show('verify');
 }
 const resend=e.target.closest('[data-auth-action="resend"]');
 if(resend&&!resend.disabled&&!busy()){
  const pending=challenge(S.view);
  if(pending)perform(S.view==='verify'?'verification-code':'forgot',{email:pending.email},true);
 }
 if(e.target===$('auth-modal')||e.target.closest('[data-auth-close]'))close();
});

function clearAuthSession(){
 A.notifications.bind(null);
 A.closeModal();
 A.session.invalidate();
 A.session.owner=null;
 A.account.editing=false;
 A.staff.account=null;
 A.inventory.useDatabase(null);
 S.staffSetup=false;
 A.staff.role='customer';
 A.email='';
 A.setAuth('guest');
 A.shell.sync();
}

A.authUI={
 show,close,state:S,remember,formField,primaryButton,codeOutbox,resendButton,openForm,api,
 requestEmailChange:input=>api('email-change',input),
 verifyEmailChange:input=>api('email-change/verify',input),
 async saveProfile(input){return (await api('profile',input)).account;},
 async restore(){
  const {account}=await api('session');
  if(account)applyAccount(account);
  if(S.staffSetup)history.replaceState(history.state,'','#/staff-setup');
 },
 async signOut(){
  const workspace=A.session.workspace();
  try{await api('sign-out',{});}catch{A.toast('Could not sign out. Please try again.');return;}
  clearAuthSession();
  if(workspace){
   A.productAdmin.loadCatalog().catch(()=>{});
   A[workspace].render();
   location.hash='#/sign-in';
  }
  A.toast('Signed out.');
 }
};
})();
