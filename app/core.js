window.K406 = {
  auth: 'guest', email: '', verified: false, pendingEmail: '', bag: 0,
  returnRoute: '#/shop', context: 'header', route: '', modal: null,
  $: id => document.getElementById(id),
  escape: value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])),
  toast(message) { const el=this.$('toast'); el.textContent=message; el.hidden=false; clearTimeout(this.toastTimer); this.toastTimer=setTimeout(()=>el.hidden=true,4500); },
  setAuth(value) { this.auth=value; this.$('header-auth-signin').classList.toggle('hidden',value==='signedin'); this.$('header-auth-user').classList.toggle('hidden',value!=='signedin'); this.$('header-auth-user').classList.toggle('flex',value==='signedin'); this.product?.eligibility(); this.commerce?.sync(); this.commerce?.render(); this.inspector?.(); },
  openModal(id) {
    if(this.modal && this.modal!==id) this.closeModal();
    if(!this.modal) this.previousFocus=document.activeElement;
    this.modal=id; const root=this.$(id); root.hidden=false; root.classList.remove('hidden');
    this.$('app-shell').inert=true; document.body.classList.add('modal-open');
    requestAnimationFrame(()=>root.querySelector('input:not(:disabled),button:not(:disabled),[tabindex]')?.focus());
  },
  closeModal() {
    if(!this.modal)return;
    const root=this.$(this.modal); root.hidden=true; root.classList.add('hidden'); this.modal=null;
    this.$('app-shell').inert=false; document.body.classList.remove('modal-open'); this.previousFocus?.focus();
  },
  notice(title,message) {
    this.$('notice-title').textContent=title; this.$('notice-message').textContent=message; this.openModal('notice-modal');
  }
};
document.addEventListener('keydown',e=>{
  const A=K406;
  if(!A.modal)return;
  if(e.key==='Escape'){e.preventDefault(); if(A.modal==='auth-modal')A.authUI.close();else A.closeModal();}
  if(e.key==='Tab'){
    const nodes=[...A.$(A.modal).querySelectorAll('a[href],button,input,textarea,select,[tabindex="0"]'),...A.$('mock-controls').querySelectorAll('button,select')].filter(el=>!el.disabled&&el.getClientRects().length);
    const first=nodes[0],last=nodes.at(-1);
    if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
    else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
  }
});
