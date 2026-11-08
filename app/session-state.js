/* Prototype actor context. Server authorization is required in production. */
(() => {
const A=K406,S=A.staff;
const X=A.session={generation:0,owner:{id:'owner-preview',first_name:'Kitchen406',last_name:'Owner',email:'owner@kitchen406.example',status:'active',setup:true}};
X.ownerAllowed=()=>A.auth==='signedin'&&S.role==='admin'&&X.owner.status==='active'&&X.owner.setup;
X.operational=()=>X.ownerAllowed()||S.allowed();
X.actor=()=>X.ownerAllowed()?{id:X.owner.id,name:X.owner.first_name+' '+X.owner.last_name,role:'admin'}:S.allowed()?{id:S.account.id,name:S.name(),role:'staff'}:null;
X.invalidate=()=>{X.generation++;S.generation++;A.account.securityGeneration++;A.account.verification=null;A.owner?.drafts?.clear();A.closeModal(true);};
X.enter=()=>{X.invalidate();S.role='admin';A.auth='signedin';location.hash='#/owner';window.dispatchEvent(new HashChangeEvent('hashchange'));};
X.leave=()=>{X.invalidate();S.role='customer';A.email=A.account.current.email;location.hash='#/shop';window.dispatchEvent(new HashChangeEvent('hashchange'));};
X.signout=()=>{X.invalidate();A.setAuth('guest');location.hash='#/owner';window.dispatchEvent(new HashChangeEvent('hashchange'));};
})();
