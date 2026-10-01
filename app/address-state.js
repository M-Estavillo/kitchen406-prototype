/* One address book shared by account, standard, subscription, and cake screens. */
(() => {
const A=K406,C=A.commerce,P=A.account;
const R=A.addresses={serial:0};
R.active=()=>C.state.addresses.filter(a=>a.status==='active'&&a.customer_id===P.id());
R.find=id=>R.active().find(a=>a.address_id===id);
R.defaults=()=>{const list=R.active();if(list.length&&!list.some(a=>a.is_default))list.sort((a,b)=>a.created_at.localeCompare(b.created_at))[0].is_default=true;};
R.changed=id=>{
 if(C.state.draft.addressId===id){C.state.revision++;C.deliveryRoute?.reset();if(!R.find(id))C.state.draft.addressId='';}
 const B=A.subscriptions;if(B?.state.draft.addressId===id){if(!B.locked())B.change();B.deliveryRoute?.reset();if(!R.find(id))B.state.draft.addressId='';}
 if(A.cakes?.state.draft.addressId===id){A.cakes.state.draft.reviewedPrice=null;if(!R.find(id))A.cakes.state.draft.addressId='';}
};
R.save=(data,id)=>{
 if(!P.allowed())return {error:'Sign in to manage addresses.'};
 if(!C.addressValid(data)||!/^\d{4}$/.test(data.postal_code))return {error:'Select a map location and enter the address, city, and four-digit postal code.'};
 const old=id?R.find(id):null;if(id&&!old)return {error:'Address not found.'};
 const now=new Date().toISOString(),record={...data,address_id:id||'address-'+Date.now()+'-'+(++R.serial),customer_id:P.id(),created_at:old?.created_at||now,updated_at:now,status:'active',is_default:!!data.is_default,add_line_2:data.add_line_2||null,landmark:data.landmark||null,barangay:data.barangay||null};
 if(record.is_default)R.active().forEach(a=>a.is_default=false);
 if(old)C.state.addresses[C.state.addresses.indexOf(old)]=record;else C.state.addresses.push(record);
 R.defaults();R.changed(record.address_id);return {record};
};
R.archive=id=>{const a=R.find(id);if(!P.allowed()||!a)return false;a.status='archived';a.is_default=false;a.updated_at=new Date().toISOString();R.defaults();R.changed(id);return true;};
R.setDefault=id=>{const a=R.find(id);if(!P.allowed()||!a)return false;R.active().forEach(x=>x.is_default=x===a);return true;};
R.context=()=>{
 if(A.route==='account')return {editor:P.editor,draft:P.addressDraft,address:()=>R.find(P.addressDraft.addressId),change:()=>P.allowed(),render:()=>P.render()};
 if(A.route==='custom-cakes')return {editor:A.cakes.addressUI,draft:A.cakes.state.draft,address:A.cakes.address,change:()=>P.allowed(),render:()=>A.phase4.render()};
 if(A.route==='subscription')return {editor:A.subscriptions.addressUI,draft:A.subscriptions.state.draft,address:A.subscriptions.address,change:A.subscriptions.change,render:A.subscriptions.render};
 return {editor:C.checkout,draft:C.state.draft,address:C.address,change:C.change,render:C.render};
};
C.addressContext=R.context;
})();
