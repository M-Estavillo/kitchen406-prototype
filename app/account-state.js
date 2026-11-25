/* Browser account projection and per-customer workspace state. */
(() => {
const A=K406,C=A.commerce;
const P=A.account={current:null,records:[],buckets:new Map(),serial:0,verification:null,securityGeneration:0,mock:{page:'normal',save:'normal',email:'normal'},editor:{form:null,editing:null,mapBusy:false},addressDraft:{},editing:false};
P.id=()=>P.current?.customer_id;
P.allowed=()=>A.auth==='signedin'&&P.current?.status==='active';
P.owns=r=>!!r&&r.customer_id===P.id()&&P.allowed();
P.name=()=>P.current.first_name+' '+P.current.last_name;
P.contact=()=>({name:P.name(),mobile_number:P.current.mobile_number,email:P.current.email});
P.passwordValid=value=>typeof value==='string'&&value.length>=8&&/[a-z]/i.test(value)&&/\d/.test(value);
P.mobile=value=>{const v=String(value||'').replace(/[\s()-]/g,'');return /^(?:\+?63|0)?9\d{9}$/.test(v)?'+63'+v.slice(-10):null;};
P.saveProfile=async data=>{
 if(!P.allowed())return 'Sign in to edit your profile.';
 if(!data.first_name?.trim()||!data.last_name?.trim())return 'First and last name are required.';
 const mobile=P.mobile(data.mobile_number);if(!mobile)return 'Enter a valid Philippine mobile number.';
 if(P.mock.save==='error')return 'Your profile could not be saved. Please retry.';
 const current=P.current;
 const saved=await A.authUI.saveProfile({...data,mobile_number:mobile});
 if(P.current===current)Object.assign(current,saved);
 return '';
};
P.activate=email=>{
 P.securityGeneration++;
 email=email?.trim().toLowerCase();
 const next=P.records.find(p=>p.email.toLowerCase()===email);
 if(!next)return false;
 if(next!==P.current){
  const B=A.subscriptions;
  if(P.current)P.buckets.set(P.id(),{commerce:{...C.state},subscription:B?{...B.state}:null,cakeDraft:A.cakes?.state.draft,reviews:A.product?.state.submitted});
  P.current=next;const b=P.buckets.get(P.id());
  Object.assign(C.state,b?.commerce||{cart:[],addresses:[],orders:[],draft:{method:'',date:'',addressId:'',quote:'ok'},activeId:null,removed:null,revision:0});
  if(B)Object.assign(B.state,b?.subscription||{draft:{productId:null,variant:'standard',quantity:1,scheduleId:'friday',start:'',addressId:'',quote:'ok',revision:0},purchases:[],records:[]});
  if(A.cakes)A.cakes.state.draft=b?.cakeDraft||A.cakes.blank();
  if(A.product)A.product.state.submitted=b?.reviews||new Set();
  C.orderId=null;C.checkout.form=null;B&&(B.addressUI.form=null);C.deliveryRoute?.reset();B?.deliveryRoute?.reset();
 }
 if(Array.isArray(next.addresses)){
  C.state.addresses=next.addresses;
  delete next.addresses;
 }
 P.verification=null;P.editor.form=null;P.editing=false;A.email=P.current.email;return true;
};
P.reset=()=>{P.current=null;P.records=[];P.buckets.clear();P.verification=null;P.editor.form=null;P.editing=false;P.mock={page:'normal',save:'normal',email:'normal'};};
})();
