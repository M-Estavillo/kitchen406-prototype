(() => {
const A=K406,N=A.notifications,V=A.phase4,C=A.commerce,U=C.ui,E=A.escape;
N.categories=[['all','All'],['orders','Orders'],['subscriptions','Subscriptions'],['cakes','Custom Cakes'],['account','Account & Security']];
N.view=()=>{
 const all=A.account.mock.page==='empty'?[]:N.list(),list=all.filter(e=>N.filter==='all'||e.category===N.filter);
 return V.accountPage('Notifications','Updates on your orders, subscriptions, custom cake requests, and account.',`<div class="commerce-actions notification-filters">${N.categories.map(([key,label])=>V.button('notification-filter',label+' ('+(key==='all'?all.length:all.filter(e=>e.category===key).length)+')',false,`data-value="${key}" aria-pressed="${N.filter===key}"`)).join('')}</div>`+
 (list.length?list.map(e=>U.panel(E(e.title),`<p class="muted">${E(N.categories.find(c=>c[0]===e.category)?.[1]||e.category)} · ${new Date(e.created_at).toLocaleString('en-PH',{timeZone:'Asia/Manila'})}</p><p>${E(e.message)}</p><p class="muted">${Object.entries(e.channels).map(([provider,status])=>E(provider==='email'?'Email':'SMS')+' '+E(status)).join(' · ')} (demo)</p>${Object.values(e.channels).some(s=>s!=='sent')?U.alert('A notification channel is delayed or unavailable. Your saved transaction is unaffected.'):''}<div class="commerce-actions">${U.link(e.path,e.category==='cakes'?'View cake request / quotation':e.category==='account'?'View profile':e.category==='subscriptions'?'View subscription':'View order')}</div>`)).join(''):U.empty('No notifications','There are no updates in this category.',V.button('notification-filter','View all notifications',false,'data-value="all"'))));
};
document.addEventListener('click',e=>{const el=e.target.closest('[data-p4="notification-filter"]');if(el){N.filter=el.dataset.value;V.render();}});
})();
