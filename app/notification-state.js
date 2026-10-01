(() => {
const A=K406,N=A.notifications={events:[],filter:'all',serial:0};
N.emit=(key,category,title,message,path,customer=A.account.id(),channels={email:'sent',sms:'sent'})=>{
 let event=N.events.find(e=>e.customer_id===customer&&e.event_key===key);
 if(event){Object.assign(event.channels,channels);return event;}
 event={id:'event-'+(++N.serial),customer_id:customer,event_key:key,category,title,message,path,channels:{...channels},created_at:Date.now()};N.events.unshift(event);return event;
};
N.list=()=>A.account.allowed()?N.events.filter(e=>e.customer_id===A.account.id()).sort((a,b)=>b.created_at-a.created_at):[];
N.reset=()=>{N.events=[];N.filter='all';};
})();
