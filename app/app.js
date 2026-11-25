(() => {
const A=K406,$=A.$;
const authRoutes=['sign-in','register','verify','forgot','reset','staff-setup','change-password'];
function titlesFor(view){return {verify:'Verification state',register:'Registration state','sign-in':'Sign-in state',forgot:'Forgot password state',reset:'Reset password state','staff-setup':'Set your staff password','change-password':'Change password'}[view];}
function route(){
 const workspace=A.session.workspace(),hash=location.hash;
 if(hash&&!hash.startsWith('#/')&&(!workspace||A.route===workspace)){
  document.getElementById(hash.slice(1))?.scrollIntoView();
  return;
 }
 if(workspace&&hash.slice(2).split('/')[0]!==workspace){
  history.replaceState(history.state,'','#/'+workspace);
 }
 const parts=(location.hash||'#/shop').slice(2).split('/'),name=parts[0];
 if(A.route==='owner'&&name!=='owner')A.owner.generation++;
 if(A.route==='staff'&&name!=='staff')A.staff.generation++;
 const passwordChange=name===(workspace||'account')&&parts[1]==='change-password'&&(parts.length===2||parts.length===3&&parts[2]==='verify');
 if(passwordChange||authRoutes.includes(name)&&name!=='change-password'){
  const canChangePassword=passwordChange&&!!A.account.profileAccount();
  const view=passwordChange?(canChangePassword?'change-password':'sign-in'):
   name==='staff-setup'&&!A.authUI.state.staffSetup?'sign-in':name;
  if(name==='staff-setup'&&view==='sign-in')history.replaceState(history.state,'','#/sign-in');
  if(passwordChange){
   A.returnRoute=A.account.profileRoute();
   if(!canChangePassword)history.replaceState(history.state,'','#/sign-in');
   else if(parts[2]==='verify')history.replaceState(history.state,'',A.account.passwordRoute());
  }else if(!authRoutes.includes(A.route))A.returnRoute=A.currentHash||'#/shop';
  A.route=view;
  A.authUI.show(view);
  document.title=titlesFor(view)+' · Kitchen406';
  return;
 }
 A.authUI.state.generation++;A.closeModal(true);A.route=name;A.currentHash=location.hash||'#/shop';
 const terms=name==='terms-and-policies';$('terms-view').hidden=!terms;if(!terms)$('terms-view').replaceChildren();
 const owner=name==='owner';$('owner-view').hidden=!owner;if(!owner)$('owner-view').replaceChildren();
 const staff=name==='staff';$('staff-view').hidden=!staff;if(!staff)$('staff-view').replaceChildren();
 const commerce=A.commerce.routes.includes(name),subscription=A.subscriptions.routes.includes(name),phase4=A.phase4.routes.includes(name);
 if(!phase4)$('phase4-view').replaceChildren();
 $('phase4-view').hidden=!phase4;
 if(!commerce)$('commerce-view').replaceChildren();
 if(!subscription)$('subscription-view').replaceChildren();
 $('subscription-view').hidden=!subscription;
 $('catalog-view').hidden=name!=='shop';$('product-view').hidden=name!=='product';$('commerce-view').hidden=!commerce;$('not-found-view').hidden=['shop','product'].includes(name)||commerce||subscription||phase4||staff||owner||terms;
 A.notifications.refresh();
 if(owner){A.owner.show(parts);A.returnRoute=A.currentHash;document.title='Owner workspace ? Kitchen406';A.shell.sync();window.scrollTo(0,0);requestAnimationFrame(()=>{const root=$('owner-view'),target=root.querySelector('[data-variant-target]');if(target){target.focus({preventScroll:true});target.scrollIntoView({block:'center'});}else root.querySelector('h1')?.focus({preventScroll:true});});return;}
 if(staff){A.staff.show(parts);A.returnRoute=A.currentHash;document.title='Staff workspace — Kitchen406';A.shell.sync();window.scrollTo(0,0);requestAnimationFrame(()=>$('staff-view').querySelector('h1')?.focus({preventScroll:true}));return;}
 A.shell.sync();
 if(terms){$('terms-view').innerHTML=A.termsHTML;A.returnRoute=A.currentHash;A.activeProduct=null;document.title='Terms and Policies · Kitchen406';requestAnimationFrame(()=>{const target=parts[1]&&document.getElementById(parts[1]);if(target&&$('terms-view').contains(target)){target.open=true;target.scrollIntoView();target.querySelector('summary')?.focus({preventScroll:true});}else{window.scrollTo(0,0);$('terms-view').querySelector('h1').focus({preventScroll:true});}});}
 else if(name==='product'){
  const id=Number(parts[1]);if(A.activeProduct!==id){A.product.show(id);A.activeProduct=id;}
  A.returnRoute=location.hash;
  document.title=(A.products.find(p=>p.id===id)?.name||'Product not found')+' · Kitchen406';
  requestAnimationFrame(()=>{if(parts[2]==='reviews'&&!$('reviews').hidden)$('reviews').scrollIntoView();else window.scrollTo(0,0);});
 }else if(phase4){A.returnRoute=A.currentHash;A.activeProduct=null;A.phase4.show(parts);document.title=(name==='account'?'My account':'Custom cakes')+' · Kitchen406';window.scrollTo(0,0);}
 else if(subscription){A.returnRoute=A.currentHash;A.activeProduct=null;A.subscriptions.show(parts);document.title='Subscriptions · Kitchen406';window.scrollTo(0,0);}
 else if(commerce){A.returnRoute=A.currentHash;A.activeProduct=null;A.commerce.show(parts);document.title=({cart:'Your bag',checkout:'Checkout',payment:'QR Ph payment',confirmation:'Order confirmation',orders:'My orders'}[name])+' · Kitchen406';window.scrollTo(0,0);}
 else{A.returnRoute='#/shop';A.activeProduct=null;document.title=name==='shop'?'Shop · Kitchen406':'Page not found · Kitchen406';window.scrollTo(0,0);}
 document.querySelectorAll('#app-shell>header nav a').forEach(link=>{const active=link.getAttribute('href')==='#/my-subscriptions'?name==='my-subscriptions':link.dataset.path==='subscriptions'?subscription&&name!=='my-subscriptions':(link.dataset.path==='shop'&&['shop','product'].includes(name)||link.dataset.path==='custom-cakes'&&['custom-cakes','cake-requests'].includes(name));link.classList.toggle('text-primary',active);link.classList.toggle('font-semibold',active);link.classList.toggle('border-b-2',active);link.classList.toggle('border-primary',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});

}
document.addEventListener('click',e=>{
 const path=e.target.closest('[data-path]')?.dataset.path;
 if(path){
  e.preventDefault();
  if(A.session.workspace())return;
  if(path==='shop')location.hash='#/shop';
  else if(path==='subscriptions'){location.hash='#/subscriptions';}
  else if(path==='custom-cakes')location.hash='#/custom-cakes';
  else if(path==='terms-and-policies')location.hash='#/terms-and-policies';
  else if(path==='cart'||path==='orders')location.hash='#/'+path;
  else if(path==='sign-in'){A.context=e.target.closest('#reviews')?'review':'header';A.returnRoute=location.hash;location.hash='#/sign-in';}
  else if(path==='sign-up')location.hash='#/register';
  else if(path==='about')A.notice('About Kitchen406','Home-based bakery in Metro Cebu. Made-to-order breads, pastries, and pantry items.');
  else if(path==='fulfillment')A.notice('Made to order · Scheduled fulfillment','Available fulfillment dates are confirmed during ordering. Same-day fulfillment is not supported.');
  else A.notice(path==='cart'?'Your bag · Preview':path==='subscriptions'?'Subscriptions · Preview':path==='custom-cakes'?'Custom cakes · Preview':'Terms & Policies', 'This destination is a placeholder for a later phase. No request, payment, or order will be submitted.');
 }
 if(e.target.closest('#account-menu-toggle')){const menu=$('account-menu');menu.hidden=!menu.hidden;$('account-menu-toggle').setAttribute('aria-expanded',String(!menu.hidden));}
 else if(!e.target.closest('#account-menu')){$('account-menu').hidden=true;$('account-menu-toggle').setAttribute('aria-expanded','false');}
 if(e.target.closest('[data-close-modal]'))A.closeModal();
 if(e.target.classList.contains('overlay')&&e.target.id!=='auth-modal')A.closeModal();
 const anchor=e.target.closest('a[href^="#/"]');
 if(anchor&&authRoutes.includes(A.route))A.authUI.remember();
});
$('nav-search-input').addEventListener('input',()=>{if(!A.session.workspace()&&A.route!=='shop')location.hash='#/shop';});
document.addEventListener('error',e=>{if(e.target.tagName==='IMG'){e.target.style.objectFit='contain';e.target.setAttribute('title','Image unavailable');}},true);
A.productAdmin.loadCatalog().catch(()=>{}).then(()=>A.authUI.restore()).catch(()=>{}).finally(()=>{
 window.addEventListener('hashchange',route);
 window.addEventListener('focus',()=>{
  A.notifications.refresh();
  if(['shop','product','subscriptions'].includes(A.route)&&!A.session.workspace()){
   A.productAdmin.loadCatalog().catch(()=>{});
  }
 });
 route();
 setInterval(()=>{if(!document.hidden)A.notifications.refresh();},20000);
 $('app-shell').hidden=false;
});
})();
