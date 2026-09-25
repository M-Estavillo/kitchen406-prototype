(() => {
const A=K406,$=A.$;
const authRoutes=['sign-in','register','verify','forgot','reset'];
const labels={normal:'Default',notfound:'Not found',signedin:'Signed in',guest:'Unauthenticated',noteligible:'Not eligible',reviewed:'Already reviewed',multi:'Multiple variants',single:'Single variant',populated:'Populated',autherror:'Invalid credentials',servererror:'Server error',accountexists:'Account exists',max_attempts:'Maximum attempts',resend_sent:'Resent',resend_error:'Resend error',success:'Success',unverified:'Verification pending',verified:'Verified'};
const label=v=>labels[v]||v[0].toUpperCase()+v.slice(1);
const select=(id,title,values,value)=>'<label for="'+id+'">'+title+'</label><select id="'+id+'">'+values.map(v=>'<option value="'+v+'" '+(String(v)===String(value)?'selected':'')+'>'+label(v)+'</option>').join('')+'</select>';
A.inspector=()=>{
 const auth=authRoutes.includes(A.route),product=A.returnRoute.startsWith('#/product/')||A.route==='product';
 let html='<strong>Kitchen406 · State Inspector</strong><p class="muted">UI simulation only. No real accounts, emails, payments, orders, or uploads are created.</p>';
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
 }else if(A.commerce.routes.includes(A.route))html+=A.commerce.inspector(select);
 else html+=select('mock-catalog','Catalog',['normal','loading','empty','error'],A.catalog.state());
 html+='<div class="mock-actions"><button data-mock="reset">Reset preview</button></div><p class="muted" style="margin-top:12px">Jump to a screen</p><div class="mock-actions">'+['shop','product/1','product/1/reviews','cart','checkout/fulfillment','checkout/address','checkout/review','payment','confirmation','orders',...authRoutes].map(r=>'<a class="text-link" href="#/'+r+'">'+({'product/1':'Product','product/1/reviews':'Reviews'}[r]||label(r))+'</a>').join('')+'</div>';
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
 if(authRoutes.includes(name)){
  if(!authRoutes.includes(A.route)){A.returnRoute=A.currentHash||'#/shop';}
  A.route=name;A.authUI.show(name);document.title=titlesFor(name)+' · Kitchen406';return;
 }
 A.authUI.state.generation++;A.closeModal();A.route=name;A.currentHash=location.hash||'#/shop';
 const commerce=A.commerce.routes.includes(name);
 $('catalog-view').hidden=name!=='shop';$('product-view').hidden=name!=='product';$('commerce-view').hidden=!commerce;$('not-found-view').hidden=['shop','product'].includes(name)||commerce;
 if(name==='product'){
  const id=Number(parts[1]);if(A.activeProduct!==id){A.product.show(id);A.activeProduct=id;}
  A.returnRoute=location.hash;
  document.title=(A.products.find(p=>p.id===id)?.name||'Product not found')+' · Kitchen406';
  requestAnimationFrame(()=>{if(parts[2]==='reviews')$('reviews').scrollIntoView();else window.scrollTo(0,0);});
 }else if(commerce){A.returnRoute=A.currentHash;A.activeProduct=null;A.commerce.show(parts);document.title=({cart:'Your bag',checkout:'Checkout',payment:'QR Ph payment',confirmation:'Order confirmation',orders:'My orders'}[name])+' · Kitchen406';window.scrollTo(0,0);}
 else{A.returnRoute='#/shop';A.activeProduct=null;document.title=name==='shop'?'Shop · Kitchen406':'Page not found · Kitchen406';window.scrollTo(0,0);}
 A.inspector();
}
document.addEventListener('click',e=>{
 const path=e.target.closest('[data-path]')?.dataset.path;
 if(path){
  e.preventDefault();
  if(path==='shop')location.hash='#/shop';
  else if(path==='cart'||path==='orders')location.hash='#/'+path;
  else if(path==='sign-in'){A.context=e.target.closest('#reviews')?'review':'header';A.returnRoute=location.hash;location.hash='#/sign-in';}
  else if(path==='sign-up')location.hash='#/register';
  else if(path==='about')A.notice('About Kitchen406','Home-based bakery in Metro Cebu. Made-to-order breads, pastries, and pantry items.');
  else if(path==='fulfillment')A.notice('Made to order · Scheduled fulfillment','Available fulfillment dates are confirmed during ordering. Same-day fulfillment is not supported.');
  else A.notice(path==='cart'?'Your bag · Preview':path==='subscriptions'?'Subscriptions · Preview':path==='custom-cakes'?'Custom cakes · Preview':'Terms & Policies', 'This destination is a placeholder for a later phase. No request, payment, or order will be submitted.');
 }
 if(e.target.closest('#header-auth-user')){A.setAuth('guest');A.toast('Signed out of the demo. Your bag is preserved in this tab.');}
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
