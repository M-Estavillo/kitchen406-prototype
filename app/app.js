(() => {
const A=K406,$=A.$;
const authRoutes=['sign-in','register','verify','forgot','reset'];
const labels={normal:'Default',notfound:'Not found',signedin:'Signed in',guest:'Unauthenticated',noteligible:'Not eligible',reviewed:'Already reviewed',multi:'Multiple variants',single:'Single variant',populated:'Populated',autherror:'Invalid credentials',servererror:'Server error',accountexists:'Account exists',max_attempts:'Maximum attempts',resend_sent:'Resent',resend_error:'Resend error',success:'Success',unverified:'Verification pending',verified:'Verified'};
const label=v=>labels[v]||v[0].toUpperCase()+v.slice(1);
const select=(id,title,values,value)=>'<label for="'+id+'">'+title+'</label><select id="'+id+'">'+values.map(v=>'<option value="'+v+'" '+(String(v)===String(value)?'selected':'')+'>'+label(v)+'</option>').join('')+'</select>';
A.inspector=()=>{
 const auth=authRoutes.includes(A.route),product=A.returnRoute.startsWith('#/product/')||A.route==='product';
 let html='<strong>Kitchen406 · State Inspector</strong><p class="muted">UI simulation only. No real accounts, emails, payments, orders, or uploads are created.</p>';
 html+='<div class="mock-actions"><button data-owner="enter">Enter owner preview</button><button data-staff="enter">Enter staff preview</button><button data-staff="customer">Return to customer</button></div><p class="muted">Owner/staff preview password: Kitchen406! ? Recipes are sample quantities.</p>';
 if(A.route==='owner')html+=select('mock-owner-mode','Owner page state',['normal','loading','empty','error'],A.owner.mode)+select('mock-owner-save','Owner save result',['normal','error'],A.owner.saveError?'error':'normal')+select('mock-owner-courier','Simulated courier response',['success','failure','unknown'],A.deliveries.outcome)+select('mock-owner-notification','Simulated notification delivery',['success','failure'],A.ownerCakes.notificationOutcome)+'<div class="mock-actions"><button data-owner="seed">Load owner examples</button></div>';
 if(A.route==='staff'){html+=select('mock-staff-mode','Staff page state',['normal','loading','empty','error'],A.staff.mode)+select('mock-staff-save','Staff save result',['normal','error'],A.staff.saveError?'error':'normal')+'<div class="mock-actions"><button data-staff="seed">Load staff orders</button></div>';}
 html+=select('mock-auth','Authentication',['guest','signedin'],A.auth);
 if(auth){
  const view=A.authUI.state.view,options=view==='verify'?['waiting','partial','complete','verifying','incorrect','expired','max_attempts','resending','resend_sent','resend_error','verified']:view==='sign-in'?['default','validation','loading','autherror','servererror','unverified','disabled']:view==='register'?['default','validation','loading','accountexists','servererror','disabled']:view==='reset'?['default','validation','loading','expired','invalid','error','success','disabled']:['default','validation','loading','error','success','disabled'];
  html+=select('mock-form',titlesFor(view),options,A.authUI.state.mode==='success'&&view==='verify'?'verified':A.authUI.state.mode);
  html+=select('mock-context','Entry context',['header','protected','review'],A.context);
  html+='<div class="mock-actions"><button data-mock="fill">'+(view==='verify'?'Fill Valid (406892)':'Fill demo details')+'</button><button data-mock="modal">'+(A.modal==='auth-modal'?'Hide':'Show')+' Modal</button></div>';
 }else if(A.route==='product'){
  const s=A.product.state;
  html+=select('mock-page','Product page',['normal','loading','error','notfound'],s.page);
  if(s.id===1)html+=select('mock-type','Variant model',['multi','single'],s.type);
  html+=select('mock-availability','Availability',['available','unavailable'],s.available?'available':'unavailable');
  html+=select('mock-reviews','Review feed',['populated','loading','error','empty'],s.feed);
  html+=select('mock-eligibility','Review eligibility (signed in)',['noteligible','eligible','reviewed'],s.elig);
  html+=select('mock-submit','Review submission',['success','error'],s.error?'error':'success');
 }else if(A.phase4.active())html+=A.phase4.inspector(select);
 else if(A.subscriptions.active())html+=A.subscriptions.inspector(select);
 else if(A.commerce.routes.includes(A.route))html+=A.commerce.inspector(select);
 else html+=select('mock-catalog','Catalog',['normal','loading','empty','error'],A.catalog.state());
 html+='<div class="mock-actions"><button data-mock="reset">Reset preview</button></div><p class="muted" style="margin-top:12px">Jump to a screen</p><div class="mock-actions">'+['shop','product/1','product/1/reviews','cart','checkout/fulfillment','checkout/address','checkout/review','payment','confirmation','orders','subscriptions','my-subscriptions','custom-cakes','cake-requests','account/profile','account/addresses','account/notifications',...authRoutes].map(r=>'<a class="text-link" href="#/'+r+'">'+({'product/1':'Product','product/1/reviews':'Reviews'}[r]||label(r))+'</a>').join('')+'</div>';
 $('mock-panel').innerHTML=html;
};
function titlesFor(view){return {verify:'Verification state',register:'Registration state','sign-in':'Sign-in state',forgot:'Forgot password state',reset:'Reset password state'}[view];}
$('mock-toggle').addEventListener('click',()=>{
 const panel=$('mock-panel');panel.hidden=!panel.hidden;$('mock-toggle').setAttribute('aria-expanded',!panel.hidden);document.body.classList.toggle('inspector-open',!panel.hidden);
});
$('mock-panel').addEventListener('change',e=>{
 const id=e.target.id,v=e.target.value;
 if(id==='mock-auth')A.setAuth(v);
 if(id==='mock-form')A.authUI.simulate(v);
 if(id==='mock-context'){A.context=v;A.authUI.remember();A.authUI.simulate(A.authUI.state.mode);}
 if(id==='mock-catalog')A.catalog.setState(v);
 if(id==='mock-page')A.product.setPageState(v);
 if(id==='mock-type')A.product.setProductType(v);
 if(id==='mock-availability')A.product.setAvailability(v==='available');
 if(id==='mock-reviews')A.product.setReviewState(v);
 if(id==='mock-eligibility')A.product.setEligibility(v);
 if(id==='mock-submit')A.product.state.error=v==='error';
});
$('mock-panel').addEventListener('click',e=>{
 const action=e.target.closest('[data-mock]')?.dataset.mock;
 if(action==='reset')A.commerce.reset();
 if(action==='fill')A.authUI.fill();
 if(action==='modal'){if(A.modal==='auth-modal')A.closeModal();else A.openModal('auth-modal');A.inspector();}
 if(action==='reset'){A.authUI.state.generation++;A.closeModal();A.email='';A.pendingEmail='';A.verified=false;A.bag=0;A.context='header';A.returnRoute='#/shop';A.authUI.state.resetValid=false;A.authUI.state.deadline=Date.now()+600000;A.authUI.state.attempts=0;A.product.state.submitted.clear();A.product.state.elig='noteligible';A.product.state.error=false;A.setAuth('guest');$('header-cart-badge').classList.add('hidden');A.catalog.reset();location.hash='#/shop';route();}
});
function route(){ if(location.hash && !location.hash.startsWith('#/')){document.getElementById(location.hash.slice(1))?.scrollIntoView();return;}
 const parts=(location.hash||'#/shop').slice(2).split('/'),name=parts[0];
 if(A.route==='owner'&&name!=='owner')A.owner.generation++;
 if(A.route==='staff'&&name!=='staff')A.staff.generation++;
 if(authRoutes.includes(name)){
  if(!authRoutes.includes(A.route)){A.returnRoute=A.currentHash||'#/shop';}
  A.route=name;A.authUI.show(name);document.title=titlesFor(name)+' · Kitchen406';return;
 }
 A.authUI.state.generation++;A.closeModal(true);A.route=name;A.currentHash=location.hash||'#/shop';
 const owner=name==='owner';$('owner-view').hidden=!owner;if(!owner)$('owner-view').replaceChildren();
 const staff=name==='staff';$('staff-view').hidden=!staff;if(!staff)$('staff-view').replaceChildren();
 const commerce=A.commerce.routes.includes(name),subscription=A.subscriptions.routes.includes(name),phase4=A.phase4.routes.includes(name);
 if(!phase4)$('phase4-view').replaceChildren();
 $('phase4-view').hidden=!phase4;
 if(!commerce)$('commerce-view').replaceChildren();
 if(!subscription)$('subscription-view').replaceChildren();
 $('subscription-view').hidden=!subscription;
 $('catalog-view').hidden=name!=='shop';$('product-view').hidden=name!=='product';$('commerce-view').hidden=!commerce;$('not-found-view').hidden=['shop','product'].includes(name)||commerce||subscription||phase4||staff||owner;
 if(owner){A.owner.show(parts);A.returnRoute=A.currentHash;document.title='Owner workspace ? Kitchen406';A.shell.sync();A.inspector();window.scrollTo(0,0);requestAnimationFrame(()=>$('owner-view').querySelector('h1')?.focus({preventScroll:true}));return;}
 if(staff){A.staff.show(parts);A.returnRoute=A.currentHash;document.title='Staff workspace — Kitchen406';A.shell.sync();A.inspector();window.scrollTo(0,0);requestAnimationFrame(()=>$('staff-view').querySelector('h1')?.focus({preventScroll:true}));return;}
 A.shell.sync();
 if(name==='product'){
  const id=Number(parts[1]);if(A.activeProduct!==id){A.product.show(id);A.activeProduct=id;}
  A.returnRoute=location.hash;
  document.title=(A.products.find(p=>p.id===id)?.name||'Product not found')+' · Kitchen406';
  requestAnimationFrame(()=>{if(parts[2]==='reviews')$('reviews').scrollIntoView();else window.scrollTo(0,0);});
 }else if(phase4){A.returnRoute=A.currentHash;A.activeProduct=null;A.phase4.show(parts);document.title=(name==='account'?'My account':'Custom cakes')+' · Kitchen406';window.scrollTo(0,0);}
 else if(subscription){A.returnRoute=A.currentHash;A.activeProduct=null;A.subscriptions.show(parts);document.title='Subscriptions · Kitchen406';window.scrollTo(0,0);}
 else if(commerce){A.returnRoute=A.currentHash;A.activeProduct=null;A.commerce.show(parts);document.title=({cart:'Your bag',checkout:'Checkout',payment:'QR Ph payment',confirmation:'Order confirmation',orders:'My orders'}[name])+' · Kitchen406';window.scrollTo(0,0);}
 else{A.returnRoute='#/shop';A.activeProduct=null;document.title=name==='shop'?'Shop · Kitchen406':'Page not found · Kitchen406';window.scrollTo(0,0);}
 document.querySelectorAll('#app-shell>header nav a').forEach(link=>{const active=link.getAttribute('href')==='#/my-subscriptions'?name==='my-subscriptions':link.dataset.path==='subscriptions'?subscription&&name!=='my-subscriptions':(link.dataset.path==='shop'&&['shop','product'].includes(name)||link.dataset.path==='custom-cakes'&&['custom-cakes','cake-requests'].includes(name));link.classList.toggle('text-primary',active);link.classList.toggle('font-semibold',active);link.classList.toggle('border-b-2',active);link.classList.toggle('border-primary',active);if(active)link.setAttribute('aria-current','page');else link.removeAttribute('aria-current');});
 A.inspector();
}
document.addEventListener('click',e=>{
 const path=e.target.closest('[data-path]')?.dataset.path;
 if(path){
  e.preventDefault();
  if(path==='shop')location.hash='#/shop';
  else if(path==='subscriptions'){location.hash='#/subscriptions';}
  else if(path==='custom-cakes')location.hash='#/custom-cakes';
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
$('nav-search-input').addEventListener('input',()=>{if(A.route!=='shop')location.hash='#/shop';});
document.addEventListener('error',e=>{if(e.target.tagName==='IMG'){e.target.style.objectFit='contain';e.target.setAttribute('title','Image unavailable');}},true);
window.addEventListener('hashchange',route);
A.setAuth('guest');route();
})();
