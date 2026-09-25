/* UI-only authentication. No credentials are persisted or sent to a service. */
(() => {
const A=K406,$=A.$,esc=A.escape;
const S={view:'sign-in',mode:'default',values:{},errors:{},attempts:0,deadline:Date.now()+600000,code:'',generation:0,resetValid:false};
const titles={'sign-in':'Welcome back',register:'Create your account',verify:'Verify your email',forgot:'Forgot your password?',reset:'Reset your password'};
const field=(name,label,type='text',autocomplete='')=>'<div class="field"><label for="auth-'+name+'">'+label+'</label><div class="'+(type==='password'?'password-wrap':'')+'"><input id="auth-'+name+'" name="'+name+'" type="'+type+'" autocomplete="'+autocomplete+'" value="'+esc(S.values[name]||'')+'" aria-describedby="error-'+name+'" '+(S.errors[name]?'aria-invalid="true"':'')+(busy()?' disabled':'')+'>'+(type==='password'?'<button type="button" data-eye="'+name+'" aria-label="Show '+label.toLowerCase()+'"><span class="material-symbols-outlined">visibility</span></button>':'')+'</div><p class="field-error" id="error-'+name+'">'+esc(S.errors[name]||'')+'</p></div>';
const busy=()=>['loading','verifying','resending','disabled'].includes(S.mode);
const link=(route,label)=>'<a href="#/'+route+'">'+label+'</a>';
function alertBox(){
 const messages={
 error:'We couldn’t complete this request. Please try again.',servererror:'We couldn’t connect right now. Please try again.',
 autherror:'Sign in failed. Check your email and password and make sure your account is active.',
 accountexists:'An account with this email already exists. '+link('sign-in','Sign in instead')+' or '+link('forgot','reset password')+'.',
 unverified:'Please verify your email before signing in. '+link('verify','Verify email'),
 incorrect:'The code you entered is incorrect. '+Math.max(0,5-S.attempts)+' attempts remaining.',
 expired:S.view==='verify'?'This verification code has expired. Request a new code.':'This password reset link has expired. '+link('forgot','Request a new link'),
 invalid:'This password reset link is invalid. '+link('forgot','Request a new link'),
 max_attempts:'Too many incorrect attempts. Request a fresh code.',
 resend_error:'We couldn’t send a new code right now. Please try again.',
 resend_sent:'Demo: a new verification code is ready. No email was sent.',
 resending:'Sending verification code…',
 success:S.view==='forgot'?'If an account exists for this email, a reset link would be sent. This is a demo; no email was sent.':S.view==='reset'?'Password reset preview complete. No real password was changed.':S.view==='verify'?'Email verified. Please sign in to continue.':'Signed in for this demo.',
 loading:'Please wait…',verifying:'Verifying…',disabled:'This form is disabled in the current preview.',
 verified_notice:'Email verified. Enter your password to sign in.'
 };
 const text=messages[S.mode];
 return text?'<div class="alert '+(['success','resend_sent','verified_notice'].includes(S.mode)?'success':busy()?'':'error')+'" role="status">'+text+'</div>':'';
}
function remember(){
 document.querySelectorAll('#auth-form input[name]').forEach(el=>{S.values[el.name]=el.value;});
 if(/^\S+@\S+\.\S+$/.test((S.values.email||'').trim()))A.email=S.values.email.trim();
}
function render(){
 const view=S.view,done=S.mode==='success',locked=busy()||['expired','max_attempts','invalid'].includes(S.mode);
 let title=titles[view],body='',subtitle='';
 if(view==='sign-in'){
  title=A.context==='header'?'Welcome back':'Sign in to continue';
  subtitle=A.context==='review'?'Sign in to review your completed purchase.':'Sign in to your Kitchen406 account.';
  body=field('email','Email','email','email')+field('password','Password','password','current-password')+'<div class="text-right">'+link('forgot','Forgot password?')+'</div><button class="btn primary wide" '+(busy()?'disabled':'')+'>Sign In</button>';
 }else if(view==='register'){
  subtitle='Create an account to order, subscribe, request custom cakes, and keep track of your Kitchen406 purchases.';
  body='<div class="name-row">'+field('firstName','First name','text','given-name')+field('lastName','Last name','text','family-name')+'</div>'+field('email','Email','email','email')+field('mobile','Mobile number (+63)','tel','tel-national')+field('password','Password','password','new-password')+field('confirm','Confirm password','password','new-password')+'<button class="btn primary wide" '+(busy()?'disabled':'')+'>Create Account</button>';
 }else if(view==='verify'){
  title=done?'Email verified':'Verify your email';
  subtitle=done?'Your Kitchen406 account is now active in this preview. Sign in to continue.':'Enter the 6-digit verification code for '+esc(A.email||'your email address')+'.';
  body=done?'<a class="btn primary wide" href="#/sign-in">Sign In</a>':'<div class="otp-row">'+Array.from({length:6},(_,i)=>'<input aria-label="Code digit '+(i+1)+'" data-digit="'+i+'" inputmode="numeric" autocomplete="'+(i===0?'one-time-code':'off')+'" maxlength="1" value="'+(S.code[i]||'')+'" '+(locked?'disabled':'')+'>').join('')+'</div><p class="center muted">This code expires in <strong id="otp-clock"></strong></p><button id="verify-submit" class="btn primary wide" '+(locked||S.code.length!==6?'disabled':'')+'>'+(S.mode==='verifying'?'Verifying…':'Verify Email')+'</button><p class="center"><button class="text-link" type="button" data-auth-action="resend" '+(busy()?'disabled':'')+'>Resend code</button></p>';
 }else if(view==='forgot'){
  subtitle='Enter your email address to request password reset instructions.';
  body=done?'<p class="muted">Preview the email-link handoff:</p><button class="btn wide" data-auth-action="reset-link" type="button">Open demo reset link</button>':field('email','Email','email','email')+'<button class="btn primary wide" '+(busy()?'disabled':'')+'>Send Reset Link</button>';
 }else if(view==='reset'){
  subtitle=done?'You can now return to sign in.':'Choose a new password for your Kitchen406 account.';
  body=done?'<a class="btn primary wide" href="#/sign-in">Back to Sign In</a>':['invalid','expired'].includes(S.mode)?'<a class="btn primary wide" href="#/forgot">Request a new reset link</a>':field('password','New password','password','new-password')+field('confirm','Confirm password','password','new-password')+'<button class="btn primary wide" '+(busy()?'disabled':'')+'>Reset Password</button>';
 }
 $('auth-card-content').innerHTML=(view==='verify'?'<div class="auth-symbol"><span class="material-symbols-outlined">'+(done?'verified':'mark_email_read')+'</span></div>':'')+'<h2 id="auth-title">'+title+'</h2><p>'+subtitle+'</p>'+alertBox()+'<form id="auth-form" class="auth-form" novalidate>'+body+'</form><div class="auth-links">'+(view==='sign-in'?'New to Kitchen406? '+link('register','Create an account'):view==='register'?'Already have a Kitchen406 account? '+link('sign-in','Sign in'):link('sign-in','Back to Sign In'))+'</div>';
 $('auth-form').addEventListener('submit',submit);
 if(view==='verify')setupCode();
 tick();A.inspector?.();
}
function show(view){
 S.generation++;S.view=view;S.mode=view==='reset'?(S.resetValid?'default':'invalid'):view==='sign-in'&&A.verified?'verified_notice':'default';S.errors={};
 S.values={email:A.email};S.code='';
 if(view==='verify'&&S.deadline<=Date.now()){S.mode='expired';}
 render();A.openModal('auth-modal');
}
function close(){S.generation++;S.values={};A.closeModal();location.hash=A.returnRoute||'#/shop';}
function simulate(mode){
 S.generation++;remember();S.errors={};
 if(S.view==='verify'){
  if(['default','waiting','partial','complete','resend_sent'].includes(mode)){S.deadline=Date.now()+600000;S.attempts=0;}
  if(mode==='partial')S.code='406';
  if(mode==='complete')S.code='406892';
  if(mode==='waiting'||mode==='default')S.code='';
  if(mode==='incorrect'){S.code='999999';S.attempts=Math.max(1,S.attempts);}
  if(mode==='expired')S.deadline=Date.now();
  if(mode==='max_attempts')S.attempts=5;
  if(mode==='verified')mode='success';
  if(mode==='success'){A.verified=true;A.pendingEmail='';}
 }
 if(S.view==='reset'&&mode==='default')S.resetValid=true;
 S.mode=mode;
 if(mode==='validation'){
  S.values={email:'invalid'};validate();
 }
 render();
}
function validate(){
 S.errors={};const v=S.values;
 if(['sign-in','register','forgot'].includes(S.view)&&!/^\S+@\S+\.\S+$/.test((v.email||'').trim()))S.errors.email='Please enter a valid email address.';
 if(['sign-in','register','reset'].includes(S.view)&&!v.password)S.errors.password='Password is required.';
 if(['register','reset'].includes(S.view)&&(!v.confirm||v.confirm!==v.password))S.errors.confirm='Passwords do not match.';
 if(S.view==='register'){
  if(!v.firstName?.trim())S.errors.firstName='First name is required.';
  if(!v.lastName?.trim())S.errors.lastName='Last name is required.';
  if(!/^(?:\+?63|0)?9\d{9}$/.test((v.mobile||'').replace(/[\s()-]/g,'')))S.errors.mobile='Enter a valid Philippine mobile number.';
 }
 return Object.keys(S.errors).length===0;
}
function later(fn){
 const generation=++S.generation;
 setTimeout(()=>{if(generation===S.generation&&A.modal==='auth-modal')fn();},650);
}
function submit(e){
 e.preventDefault();if(busy()||['expired','invalid','max_attempts','success'].includes(S.mode))return;
 remember();
 if(S.view==='verify'){
  if(S.code.length!==6||S.deadline<=Date.now())return;
  const code=S.code;S.mode='verifying';render();
  later(()=>{if(S.deadline<=Date.now()){S.mode='expired';}else if(code==='406892'){S.mode='success';A.verified=true;A.pendingEmail='';}else{S.attempts++;S.mode=S.attempts>=5?'max_attempts':'incorrect';}render();});return;
 }
 if(!validate()){render();$('auth-form').querySelector('[aria-invalid=true]')?.focus();return;}
 if(S.view==='sign-in'&&(S.mode==='unverified'||A.pendingEmail&&A.pendingEmail===A.email&&!A.verified)){S.mode='unverified';render();return;}
 const view=S.view;S.mode='loading';render();
 later(()=>{
  if(view==='sign-in'){A.setAuth('signedin');S.values={};close();A.toast('Signed in for this demo.');}
  if(view==='register'){A.verified=false;A.pendingEmail=A.email;S.deadline=Date.now()+600000;S.attempts=0;S.values={};location.hash='#/verify';}
  if(view==='forgot'||view==='reset'){S.mode='success';S.values={email:A.email};if(view==='reset')S.resetValid=false;render();}
 });
}
function setupCode(){
 const cells=[...document.querySelectorAll('[data-digit]')];
 const sync=()=>{S.code=cells.map(c=>c.value||' ').join('').trimEnd();$('verify-submit').disabled=!/^\d{6}$/.test(S.code)||busy()||S.deadline<=Date.now()||S.attempts>=5;};
 cells.forEach((c,i)=>{
  c.addEventListener('input',()=>{c.value=c.value.replace(/\D/g,'').slice(-1);sync();if(c.value)cells[i+1]?.focus();});
  c.addEventListener('keydown',e=>{if(e.key==='Backspace'&&!c.value&&i){cells[i-1].value='';cells[i-1].focus();sync();}if(e.key==='ArrowLeft')cells[i-1]?.focus();if(e.key==='ArrowRight')cells[i+1]?.focus();});
  c.addEventListener('paste',e=>{e.preventDefault();const digits=e.clipboardData.getData('text').replace(/\D/g,'').slice(0,6);cells.forEach((cell,j)=>cell.value=digits[j]||'');sync();cells[Math.min(digits.length,5)].focus();});
 });
}
function tick(){
 const clock=$('otp-clock');if(!clock)return;
 const seconds=Math.max(0,Math.ceil((S.deadline-Date.now())/1000));clock.textContent=String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
 if(!seconds&&!['expired','success'].includes(S.mode)&&S.view==='verify'){S.generation++;S.mode='expired';render();}
}
setInterval(tick,1000);
$('auth-modal').addEventListener('click',e=>{
 const eye=e.target.closest('[data-eye]');
 if(eye){const input=$('auth-'+eye.dataset.eye);input.type=input.type==='password'?'text':'password';eye.setAttribute('aria-label',(input.type==='password'?'Show ':'Hide ')+eye.dataset.eye);eye.querySelector('span').textContent=input.type==='password'?'visibility':'visibility_off';}
 const action=e.target.closest('[data-auth-action]')?.dataset.authAction;
 if(action==='resend'&&!busy()){S.mode='resending';render();later(()=>{S.attempts=0;S.code='';S.deadline=Date.now()+600000;S.mode='resend_sent';render();});}
 if(action==='reset-link'){S.resetValid=true;location.hash='#/reset';}
 if(e.target===$('auth-modal')||e.target.closest('[data-auth-close]'))close();
});
$('auth-modal').addEventListener('input',e=>{
 if(e.target.name){S.values[e.target.name]=e.target.value;delete S.errors[e.target.name];e.target.removeAttribute('aria-invalid');const error=$('error-'+e.target.name);if(error)error.textContent='';}
});
A.authUI={show,close,simulate,state:S,remember,
 fill(){S.values={firstName:'Elena',lastName:'Ramos',email:'elena@example.com',mobile:'917 123 4567',password:'BakingMetroCebu2025!',confirm:'BakingMetroCebu2025!'};A.email=S.values.email;S.errors={};S.mode='default';if(S.view==='verify'){S.code='406892';S.deadline=Date.now()+600000;S.attempts=0;}render();}
};
})();
