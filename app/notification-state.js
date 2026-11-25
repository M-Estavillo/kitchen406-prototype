(() => {
const A=K406,N=A.notifications={events:[],filter:'all',serial:0};
N.emit=(key,category,title,message,path,customer=A.account.id(),channels={email:'sent',sms:'sent'})=>{
 let event=N.events.find(e=>e.customer_id===customer&&e.event_key===key);
 if(event){Object.assign(event.channels,channels);return event;}
 event={id:'event-'+(++N.serial),customer_id:customer,event_key:key,category,title,message,path,channels:{...channels},created_at:Date.now()};N.events.unshift(event);return event;
};
N.account=null;
N.saved=[];
N.state='idle';
let revision=0;
let loading=null;
let saving=false;
N.bind=account=>{
 if(N.account?.account_id===account?.account_id)return;
 N.account=account;
 N.saved=[];
 N.state='idle';
 loading=null;
 saving=false;
 revision++;
 A.owner?.notificationReads.clear();
};
N.renderCurrent=()=>{
 A.shell.sync();
 if(A.route==='account'&&A.phase4.parts[1]==='notifications')A.phase4.render();
 if(A.route==='owner'&&A.owner.parts[1]==='notifications')A.owner.render();
 if(A.route==='staff'&&A.staff.parts[1]==='notifications')A.staff.render();
};
N.refresh=()=>{
 if(!N.account||saving)return;
 if(loading)return loading;
 const request=++revision, initial=N.state==='idle';
 if(initial)N.state='loading';
 loading=A.authUI.api('notifications').then(({notifications})=>{
  if(request!==revision)return;
  const changed=N.state!=='ready'||JSON.stringify(N.saved)!==JSON.stringify(notifications);
  N.saved=notifications;
  N.state='ready';
  if(changed)N.renderCurrent();
 }).catch(()=>{
  if(request!==revision)return;
  if(N.state!=='error'){N.state='error';N.renderCurrent();}
 }).finally(()=>{if(request===revision)loading=null;});
 return loading;
};
N.acknowledge=async (id)=>{
 if(!N.account)return true;
 if(saving)return false;
 const request=++revision;
 loading=null;
 saving=true;
 try{
  const {notifications}=await A.authUI.api('notifications/read',id?{id}:{all:true});
  if(request!==revision)return false;
  N.saved=notifications;
  N.state='ready';
  N.renderCurrent();
  return true;
 }catch{
  if(request===revision)A.toast('Read status could not be saved. Please try again.');
  return false;
 }finally{if(request===revision)saving=false;}
};
N.feedback=button=>N.account&&(N.state==='idle'||N.state==='loading')
 ?'<p role="status">Loading notifications…</p>'
 :N.state==='error'?'<p role="status">Notifications could not be loaded. '+button+'</p>':'';
N.list=()=>A.account.allowed()
 ?[...(N.account?.role==='customer'?N.saved:[]),...N.events.filter(e=>e.customer_id===A.account.id())]
  .sort((a,b)=>b.created_at-a.created_at)
 :[];
N.reset=()=>{N.events=[];N.filter='all';};
})();
