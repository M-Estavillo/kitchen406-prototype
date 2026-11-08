/* In-memory customer identities. This is a prototype, not an authentication service. */
(() => {
const A=K406,C=A.commerce;
const initial=()=>({account_id:'preview-account',customer_id:'preview-customer',first_name:'Charles',last_name:'Borres',mobile_number:'+639175551234',email:'charles@example.com',status:'active',created_at:'2024-10-01',email_verified_at:'2026-10-01',password_changed_at:null,passwordVersion:0});
const P=A.account={current:initial(),records:[],buckets:new Map(),serial:0,verification:null,securityGeneration:0,codeSerial:406892,mock:{page:'normal',save:'normal',email:'normal'},editor:{form:null,editing:null,mapBusy:false},addressDraft:{},editing:false};
P.records.push(P.current);
P.id=()=>P.current.customer_id;
P.allowed=()=>A.auth==='signedin'&&P.current.status==='active';
P.owns=r=>!!r&&r.customer_id===P.id()&&P.allowed();
P.name=()=>P.current.first_name+' '+P.current.last_name;
P.contact=()=>({name:P.name(),mobile_number:P.current.mobile_number,email:P.current.email});
P.hash=async value=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(value)))).map(v=>v.toString(16).padStart(2,'0')).join('');
P.passwordValid=value=>typeof value==='string'&&value.length>=8&&/[a-z]/i.test(value)&&/\d/.test(value);
P.mobile=value=>{const v=String(value||'').replace(/[\s()-]/g,'');return /^(?:\+?63|0)?9\d{9}$/.test(v)?'+63'+v.slice(-10):null;};
P.saveProfile=data=>{
 if(!P.allowed())return 'Sign in to edit your profile.';
 if(!data.first_name?.trim()||!data.last_name?.trim())return 'First and last name are required.';
 const mobile=P.mobile(data.mobile_number);if(!mobile)return 'Enter a valid Philippine mobile number.';
 if(P.mock.save==='error')return 'Your profile could not be saved. Please retry.';
 Object.assign(P.current,{first_name:data.first_name.trim(),last_name:data.last_name.trim(),mobile_number:mobile});return '';
};
P.beginEmail=async(email,password)=>{
 if(!P.allowed())return 'Sign in to change your email.';
 const owner=P.current,generation=P.securityGeneration;email=email.trim().toLowerCase();
 if(!/^\S+@\S+\.\S+$/.test(email))return 'Enter a valid email address.';
 if(P.records.some(p=>p.email.toLowerCase()===email))return 'This email is already in use.';
 if(await P.hash(password)!==(owner.passwordHash||await P.hash('Kitchen406!')))return 'Incorrect current password.';
 if(P.current!==owner||!P.allowed()||P.securityGeneration!==generation)return 'This change was cancelled. Start again.';
 if(P.mock.email==='error')return 'The verification code could not be sent. Please retry.';
 P.verification={account_id:owner.account_id,target_email:email,purpose:'email_change',expires_at:Date.now()+600000,resend_at:Date.now()+30000,attempt_count:0,code:String(++P.codeSerial),status:'pending'};return '';
};
P.resendEmail=()=>{
 const v=P.verification;if(!P.allowed()||!v||v.account_id!==P.current.account_id)return 'Start the email change again.';
 if(Date.now()<v.resend_at)return 'Please wait before requesting another code.';
 if(P.mock.email==='error')return 'The new code could not be sent. Please retry.';
 Object.assign(v,{code:String(++P.codeSerial),expires_at:Date.now()+600000,resend_at:Date.now()+30000,attempt_count:0,status:'pending'});return '';
};
P.verifyEmail=code=>{
 const v=P.verification;if(!P.allowed()||!v||v.account_id!==P.current.account_id||v.status!=='pending')return 'Start the email change again.';
 if(v.expires_at<=Date.now())return 'This code has expired. Request a new code.';
 if(v.attempt_count>=5)return 'Too many attempts. Request a new code.';
 if(code!==v.code){v.attempt_count++;return 'Incorrect code. '+(5-v.attempt_count)+' attempts remaining.';}
 if(P.records.some(p=>p!==P.current&&p.email.toLowerCase()===v.target_email))return 'This email is already in use.';
 P.current.email=v.target_email;P.current.email_verified_at=new Date().toISOString();A.email=v.target_email;v.status='verified';v.code='';P.current.passwordVersion++;
 A.notifications?.emit('email-'+P.current.passwordVersion,'account','Email address changed','Your account email was updated.','account/profile');P.verification=null;return '';
};
P.changePassword=async(current,next,confirm)=>{
 const owner=P.current,generation=P.securityGeneration;if(!P.allowed())return 'Sign in to change your password.';
 if(await P.hash(current)!==(owner.passwordHash||await P.hash('Kitchen406!')))return 'Incorrect current password.';
 if(!P.passwordValid(next))return 'Use at least 8 characters with letters and numbers.';
 if(next!==confirm)return 'Passwords do not match.';
 const hash=await P.hash(next);if(P.current!==owner||!P.allowed()||P.securityGeneration!==generation)return 'This change was cancelled. Start again.';
 if(P.mock.save==='error')return 'Your password could not be changed. Please retry.';
 owner.passwordHash=hash;owner.password_changed_at=new Date().toISOString();owner.passwordVersion++;
 A.notifications?.emit('password-'+owner.passwordVersion,'account','Password changed','Your account password was changed.','account/profile');return '';
};
P.activate=email=>{
 P.securityGeneration++;
 email=(email||P.current.email).toLowerCase();
 let next=P.records.find(p=>p.email.toLowerCase()===email);
 if(!next&&P.records.length===1&&!P.current.claimed){next=P.current;next.email=email;}
 if(!next){next={...initial(),account_id:'account-'+(++P.serial),customer_id:'customer-'+P.serial,email,first_name:'Customer',last_name:String(P.serial),claimed:true};P.records.push(next);}
 next.claimed=true;
 if(next!==P.current){
  const B=A.subscriptions;
  P.buckets.set(P.id(),{commerce:{...C.state},subscription:B?{...B.state}:null,cakeDraft:A.cakes?.state.draft,reviews:A.product?.state.submitted});
  P.current=next;const b=P.buckets.get(P.id());
  Object.assign(C.state,b?.commerce||{cart:[],addresses:[],orders:[],draft:{method:'',date:'',addressId:'',quote:'ok'},activeId:null,removed:null,revision:0});
  if(B)Object.assign(B.state,b?.subscription||{draft:{productId:null,variant:'standard',quantity:1,scheduleId:'friday',start:'',addressId:'',quote:'ok',revision:0},purchases:[],records:[]});
  if(A.cakes)A.cakes.state.draft=b?.cakeDraft||A.cakes.blank();
  if(A.product)A.product.state.submitted=b?.reviews||new Set();
  C.orderId=null;C.checkout.form=null;B&&(B.addressUI.form=null);C.deliveryRoute?.reset();B?.deliveryRoute?.reset();
 }
 P.verification=null;P.editor.form=null;P.editing=false;A.email=P.current.email;
};
P.reset=()=>{P.current=initial();P.records=[P.current];P.buckets.clear();P.verification=null;P.editor.form=null;P.editing=false;P.mock={page:'normal',save:'normal',email:'normal'};};
})();
