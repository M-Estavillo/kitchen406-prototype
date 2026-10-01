(() => {
const A=K406,C=A.commerce,U=C.ui,E=A.escape;
const V=A.phase4={routes:['custom-cakes','cake-requests','account'],parts:[],dialog:null};
V.active=()=>V.routes.includes(A.route);
V.button=(action,label,disabled=false,extra='',primary=false)=>`<button type="button" class="btn${primary?' primary':''}" data-p4="${action}" ${disabled?'disabled':''} ${extra}>${E(label)}</button>`;
V.badge=text=>`<span class="order-badge">${E(text)}</span>`;
V.field=(name,label,value='',type='text',extra='')=>`<div class="field"><label for="p4-${name}">${E(label)}</label><input id="p4-${name}" name="${name}" type="${type}" value="${E(value)}" ${extra}></div>`;
V.links=[['account/profile','person','My Profile'],['orders','receipt_long','My Orders'],['my-subscriptions','calendar_month','My Subscriptions'],['cake-requests','cake','Custom Cake Requests'],['account/addresses','location_on','Saved Addresses'],['account/notifications','notifications','Notifications']];
V.accountSection=()=>A.route==='orders'?'orders':A.route==='my-subscriptions'||A.route==='subscriptions'&&A.subscriptions.parts[1]?'my-subscriptions':A.route==='cake-requests'?'cake-requests':A.route==='account'?'account/'+(V.parts[1]||'profile'):'';
V.nav=()=>`<aside class="account-nav"><div class="account-identity"><span class="account-avatar">${E((A.account.current.first_name[0]||'')+(A.account.current.last_name[0]||''))}</span><strong>${E(A.account.name())}</strong><small>${E(A.account.current.email)}</small></div><nav aria-label="My account">${V.links.map(([path,icon,label])=>`<a href="#/${path}" ${V.accountSection()===path?'aria-current="page"':''}><span class="material-symbols-outlined" aria-hidden="true">${icon}</span>${label}</a>`).join('')}${V.button('sign-out','Sign Out')}</nav></aside>`;
V.accountLayout=body=>`<div class="account-layout">${V.nav()}<div class="account-main">${body}</div></div>`;
V.accountPage=(title,subtitle,body)=>V.accountLayout(U.page(title,subtitle,body));
V.open=(title,body,kind)=>{
 A.closeModal();V.dialog=kind;
 A.$('phase4-dialog-title').textContent=title;A.$('phase4-dialog-body').innerHTML=body;A.openModal('phase4-modal');
};
V.error=text=>{const el=A.$('phase4-form-error');if(el){el.textContent=text;el.focus();}else A.toast(text);};
V.formError=()=>'<p id="phase4-form-error" class="field-error" role="alert" tabindex="-1"></p>';
V.show=parts=>{V.parts=parts;A.cakes.message='';V.render();};
V.render=()=>{
 if(!V.active())return;
 const root=A.$('phase4-view'),P=A.account,K=A.cakes,publicPage=A.route==='custom-cakes'&&!V.parts[1];let html;
 const focused=document.activeElement,restore=root.contains(focused)?{id:focused.id,name:focused.name,value:focused.value,data:{...focused.dataset}}:null;
 if(publicPage)html=K.builder.landing();
 else if(!P.allowed())html=U.page('Sign in to continue','Your custom cake selections will remain in this tab.',U.empty('Your Kitchen406 account',A.auth==='signedin'?'This account is not active. Sign out to use another account.':'Sign in to manage your requests, profile, addresses, and notifications.',A.auth==='signedin'?V.button('sign-out','Sign Out'):U.link('sign-in','Sign in',true)+U.link('register','Create account')));
 else if((A.route==='account'?P.mock.page:K.mock.page)==='loading')html=U.page('Loading…','Retrieving your details.',`<div class="commerce-skeleton" role="status">Loading…</div>${V.button('retry-page','Return to normal preview')}`);
 else if((A.route==='account'?P.mock.page:K.mock.page)==='error')html=U.empty('Unable to load this page','Your saved details are still available.',V.button('retry-page','Try again'));
 else if(A.route==='account')html=V.parts[1]==='addresses'?P.addressesView():V.parts[1]==='notifications'?A.notifications.view():!V.parts[1]||V.parts[1]==='profile'?P.profile():U.empty('Page not found','Choose a page from your account.',U.link('account/profile','My profile'));
 else if(A.route==='cake-requests')html=K.requestsView();
 else html=K.builder.view(V.parts[2]||'details');
 root.innerHTML=html;C.addressMap.mount();
 if(restore){const target=restore.id?A.$(restore.id):[...root.querySelectorAll('button,input,select,a')].find(el=>restore.data.p4?Object.entries(restore.data).every(([key,value])=>el.dataset[key]===value):restore.name&&el.name===restore.name&&el.value===restore.value);target?.focus({preventScroll:true});}
 };
A.account.render=V.render;
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-p4]');if(!el||el.disabled)return;const action=el.dataset.p4;
 if(action==='sign-out'){A.closeModal();A.account.verification=null;A.setAuth('guest');A.toast('Signed out. Your demo records remain in this tab.');}
 if(action==='retry-page'){A.account.mock.page='normal';A.cakes.mock.page='normal';V.render();A.inspector();}
 if(action==='close'){A.closeModal();}
});
})();
