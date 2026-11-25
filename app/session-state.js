/* Prototype actor context. Server authorization is required in production. */
(() => {
const A=K406,S=A.staff;
const X=A.session={generation:0,owner:null};
X.ownerAllowed=()=>A.auth==='signedin'&&S.role==='admin'&&X.owner?.status==='active'&&X.owner.setup;
X.workspace=()=>A.auth==='signedin'?({admin:'owner',staff:'staff'}[S.role]||null):null;
X.operational=()=>X.ownerAllowed()||S.allowed();
X.actor=()=>X.ownerAllowed()?{id:X.owner.id,name:X.owner.first_name+' '+X.owner.last_name,role:'admin'}:S.allowed()?{id:S.account.id,name:S.name(),role:'staff'}:null;
X.invalidate=()=>{X.generation++;S.generation++;A.account.securityGeneration++;A.account.verification=null;A.owner?.drafts?.clear();A.closeModal(true);};
X.enter=()=>{if(!X.owner?.setup||X.owner.status!=='active')return;X.invalidate();S.role='admin';A.auth='signedin';location.hash='#/owner';window.dispatchEvent(new HashChangeEvent('hashchange'));};
X.signout=()=>A.authUI.signOut();
})();
