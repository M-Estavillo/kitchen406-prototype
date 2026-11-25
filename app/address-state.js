/* One address book shared by account, standard, subscription, and cake screens. */
(() => {
const A=K406,C=A.commerce,P=A.account;
const R=A.addresses={};
R.active=()=>C.state.addresses.filter(a=>a.status==='active'&&a.customer_id===P.id());
R.find=id=>R.active().find(a=>a.address_id===id);
R.changed=id=>{
 if(C.state.draft.addressId===id){C.state.revision++;C.deliveryRoute?.reset();if(!R.find(id))C.state.draft.addressId='';}
 const B=A.subscriptions;if(B?.state.draft.addressId===id){if(!B.locked())B.change();B.deliveryRoute?.reset();if(!R.find(id))B.state.draft.addressId='';}
 if(A.cakes?.state.draft.addressId===id){A.cakes.state.draft.reviewedPrice=null;if(!R.find(id))A.cakes.state.draft.addressId='';}
};
let saving=false;
R.update=async(action,id,data)=>{
 if(!P.allowed())return {error:'Sign in to manage addresses.'};
 if(saving)return {error:'An address update is already in progress.'};
 const customer=P.id(),generation=A.session.generation;
 saving=true;
 try{
  const response=await fetch('/api/auth/addresses',{
   method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,id,data})
  });
  const result=await response.json();
  if(!response.ok)return {error:result.error};
  if(!P.allowed()||P.id()!==customer||A.session.generation!==generation)return {error:'Your session changed. Please try again.'};
  C.state.addresses=result.addresses;
  if(action!=='default')R.changed(id||result.record.address_id);
  return result;
 }catch{return {error:'The address could not be saved. Please try again.'};}
 finally{saving=false;}
};
R.save=(data,id)=>R.update('save',id,data);
R.archive=id=>R.update('archive',id);
R.setDefault=id=>R.update('default',id);
R.context=()=>{
 if(A.route==='account')return {editor:P.editor,draft:P.addressDraft,address:()=>R.find(P.addressDraft.addressId),change:()=>P.allowed(),render:()=>P.render()};
 if(A.route==='custom-cakes')return {editor:A.cakes.addressUI,draft:A.cakes.state.draft,address:A.cakes.address,change:()=>P.allowed(),render:()=>A.phase4.render()};
 if(A.route==='subscription')return {editor:A.subscriptions.addressUI,draft:A.subscriptions.state.draft,address:A.subscriptions.address,change:A.subscriptions.change,render:A.subscriptions.render};
 return {editor:C.checkout,draft:C.state.draft,address:C.address,change:C.change,render:C.render};
};
C.addressContext=R.context;
})();
