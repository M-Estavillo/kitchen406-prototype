(() => {
const A=K406,N=A.notifications,V=A.phase4,U=A.commerce.ui,E=A.escape;
const categories=[['all','All'],['unread','Unread'],['orders','Orders'],['payments','Payments'],['subscriptions','Subscriptions'],['cakes','Custom Cakes'],['account','Account & Security']];
const subtitle='Updates on your orders, subscriptions, custom cake requests, and account.';

N.loading=()=>V.accountPage('Notifications',subtitle,'<p role="status">Loading notifications…</p>');
N.view=()=>{
 const all=A.account.mock.page==='empty'?[]:N.list();
 const matches=(item,filter)=>filter==='all'||(filter==='unread'?!item.read_at:item.category===filter);
 const list=all.filter(item=>matches(item,N.filter));
 const feedback=N.feedback(V.button('notification-retry','Retry'));
 const filters=categories.map(([key,label])=>V.button('notification-filter',label+' ('+all.filter(item=>matches(item,key)).length+')',false,
  `data-value="${key}" aria-pressed="${N.filter===key}"`)).join('');
 const toolbar=`<div class="commerce-actions notification-filters" role="group" aria-label="Notification categories">${filters}</div>
  <div class="commerce-actions">${V.button('notification-read-all','Mark all as read',!all.some(item=>!item.read_at))}</div>`;
 const rows=list.map(item=>{
  const label=categories.find(([key])=>key===item.category)?.[1]||item.category;
  const icon={orders:'receipt_long',payments:'payments',subscriptions:'calendar_month',cakes:'cake',account:'person'}[item.category]||'notifications';
  const delivery=item.channels
   ?Object.entries(item.channels).map(([channel,status])=>(channel==='email'?'Email ':'SMS ')+status).join(' · ')+' (demo)'
   :{pending:'Queued for the local outbox',sent:'Saved to the local outbox',failed:'Local outbox delivery failed'}[item.outbox_status];
  const time=new Date(item.created_at);
  return `<li class="notification-row"><span class="material-symbols-outlined notification-icon" aria-hidden="true">${icon}</span>
   <div class="notification-content"><div class="notification-heading"><h2>${E(item.title)}</h2>
   <time datetime="${time.toISOString()}">${time.toLocaleString('en-PH',{timeZone:'Asia/Manila'})}</time></div>
   <p class="notification-message">${E(item.message)}</p>
   <div class="notification-footer"><span>${E(label)} · ${item.read_at?'Read':'Unread'}${delivery?' · '+E(delivery):''}</span>
   <a href="#/${E(item.path)}">${item.category==='cakes'?'View request / quotation':item.category==='account'?'View profile':'View details'}</a></div>
   ${item.read_at?'':V.button('notification-read','Mark as read',false,`data-id="${E(item.id)}"`)}</div></li>`;
 }).join('');
 return V.accountPage('Notifications',subtitle,toolbar+feedback+(rows?`<ul class="notification-list">${rows}</ul>`:feedback?''
  :U.empty('No notifications','There are no updates in this category.',V.button('notification-filter','View all notifications',false,'data-value="all"'))));
};

document.addEventListener('click',async event=>{
 const button=event.target.closest('[data-p4^="notification-"]');
 if(!button||button.disabled||!A.account.allowed())return;
 const action=button.dataset.p4;
 if(action==='notification-filter'){N.filter=button.dataset.value;V.render();return;}
 if(action==='notification-retry'){N.refresh();return;}
 if(action!=='notification-read'&&action!=='notification-read-all')return;
 const all=action==='notification-read-all';
 const target=N.list().find(item=>item.id===button.dataset.id);
 if(!all&&!target)return;
 button.disabled=true;
 const stored=target&&N.saved.includes(target);
 if((all||stored)&&!await N.acknowledge(stored?target.id:undefined)){
  button.disabled=false;
  return;
 }
 const now=Date.now();
 for(const item of N.events){
  if(item.customer_id===A.account.id()&&!item.read_at&&(all||item===target))item.read_at=now;
 }
 N.renderCurrent();
});
})();
