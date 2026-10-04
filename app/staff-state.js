/* Staff session and projections. This preview has no server security boundary. */
(() => {
const A=K406,C=A.commerce,I=A.inventory;
const S=A.staff={parts:[],role:'customer',account:{id:'staff-elena',first_name:'Elena',last_name:'Lim',email:'elena@kitchen406.example',status:'active',setup:true},events:[],history:new Map(),versions:new Map(),results:new Map(),query:'',type:'all',status:'active',range:'all',page:1,ingredient:'',movementType:'all',source:'all',from:'',to:'',calendarDate:A.schedule.today(),calendarView:'week',includeCompleted:false,notificationFilter:'all',recipeId:1,variant:'standard',mode:'normal',saveError:false,generation:0};
S.allowed=()=>A.auth==='signedin'&&S.role==='staff'&&S.account.status==='active'&&S.account.setup;
S.name=()=>S.account.first_name+' '+S.account.last_name;
S.orderStatus=o=>['ready-pickup','ready-delivery','in-transit'].includes(o.status)?'ready':o.status;
S.emit=(key,type,message,path)=>{if(!S.events.some(e=>e.key===key)){const notification_type=key.startsWith('low:')||key.startsWith('shortage:')?'low_stock_alert':key.startsWith('defer:')?'subscription_deferment_completed':key.startsWith('new:')?'new_order':null;if(!notification_type)return;const entity=path.startsWith('staff/inventory')?'inventory':'order',entityId=entity==='inventory'?key.split(':')[1]:path.split('/').at(-1);S.events.unshift({id:'SN-'+(S.events.length+1),key,type,notification_type,message,path,read:false,is_read:false,read_at:null,at:Date.now(),role:'staff',recipient_role:'all',related_entity_type:entity,related_entity_id:entityId});}};
S.stockWarnings=new Map();S.stockEpisodes=new Map();
S.checkStockAlerts=()=>{for(const i of I.items){const low=I.available(i.id)<=i.threshold;if(low&&!S.stockWarnings.get(i.id)){const episode=(S.stockEpisodes.get(i.id)||0)+1;S.stockEpisodes.set(i.id,episode);S.emit('low:'+i.id+':'+episode,'inventory',i.name+' needs stock attention.','staff/inventory');}S.stockWarnings.set(i.id,low);}};
S.orders=()=>I.allOrders().filter(o=>o.paid&&!['payment-resolution','cancelled','pending-payment','payment-failed'].includes(o.status));
S.project=o=>({id:o.id,type:o.type,status:S.orderStatus(o),version:S.versions.get(o.id)||0,date:o.fulfillment.date,preparationDate:A.subscriptions.preparationDate?.(o)||null,method:o.fulfillment.method,items:o.items.map(i=>({name:i.name,variant:i.variant,quantity:i.quantity})),cycle:o.deliveryId?Number(o.deliveryId.match(/(\d+)$/)?.[1])||null:null,subscriptionId:o.subscriptionId||null,courier:o.delivery?.status?.replaceAll('_',' ')||'Booking pending',materialIssue:o.materialIssue||'',reservationStatus:I.reservations.get(o.id)?.status||'projected',requirements:I.requirements.get(o.id)||I.materials(o),history:S.history.get(o.id)||[]});
S.list=()=>S.allowed()?S.orders().map(S.project):[];
S.changed=()=>{S.checkStockAlerts();S.render?.();A.shell?.sync();};
S.transition=(id,target,version,key)=>{
 if(!S.allowed())return 'Staff access required.';if(!key)return 'An operation identifier is required.';if(S.saveError)return 'The update could not be saved. Retry.';
 if(S.results.has(key))return S.results.get(key).id===id&&S.results.get(key).target===target?'':'This operation belongs to another update.';
 const o=S.orders().find(o=>o.id===id);if(!o)return 'Order not found.';
 if((S.versions.get(id)||0)!==version)return 'This order changed. Review its current status.';
 const status=S.orderStatus(o);if(!(status==='confirmed'&&target==='preparing'||status==='preparing'&&target==='ready'||status==='ready'&&target==='completed'&&o.fulfillment.method==='pickup'))return 'This transition is not allowed.';
 if(target==='preparing'){const error=I.consume(o,S.name());if(error)return error;}
 const actual=target==='ready'?(o.fulfillment.method==='pickup'?'ready-pickup':'ready-delivery'):target;
 C.setStatus(o,actual);S.versions.set(id,version+1);S.results.set(key,{id,target});
 if(target==='completed')o.completedAt=Date.now();
 for(const record of [...A.subscriptions.state.records,...[...A.account.buckets.values()].flatMap(b=>b.subscription?.records||[])]){const d=record.deliveries.find(d=>d.orderId===id);if(d){d.status=target==='completed'?'fulfilled':target;record.status=record.deliveries.every(d=>d.status==='fulfilled')?'completed':'active';}}
 S.emit('order:'+id+':'+target,'orders',id+' is '+target+'.','staff/production/'+id);S.changed();return '';
};
S.enter=()=>{A.closeModal();S.generation++;S.role='staff';A.auth='signedin';A.account.securityGeneration++;A.account.verification=null;location.hash='#/staff';window.dispatchEvent(new HashChangeEvent('hashchange'));};
S.leave=()=>{A.closeModal();S.generation++;S.role='customer';A.email=A.account.current.email;location.hash='#/shop';window.dispatchEvent(new HashChangeEvent('hashchange'));};
S.seed=()=>{
 if(!S.allowed())return;const date=A.schedule.today();
 for(let n=0;n<4;n++){const id='STAFF-DEMO-'+(n+1);if(I.allOrders().some(o=>o.id===id))continue;const o={id,customer_id:A.account.id(),fixture:true,type:'standard',paid:true,payment:'confirmed',status:'confirmed',items:[C.line(n%2?4:1,'standard',n%2+1)],fulfillment:{date:A.schedule.add(date,n),method:n%2?'delivery':'pickup'},created:Date.now(),attempts:[],activity:[],fee:0,total:0};o.total=C.subtotal(o.items);C.state.orders.push(o);I.reserve(o,true);S.emit('new:'+id,'orders',id+' is ready for preparation.','staff/production/'+id);}
 S.changed();
};
S.password=async(current,next,confirm)=>{if(!S.allowed())return 'Staff access required.';const generation=S.generation;
 if(await A.account.hash(current)!==(S.account.hash||await A.account.hash('Kitchen406!')))return 'Incorrect current password.';
 if(!A.account.passwordValid(next))return 'Use at least 8 characters with letters and numbers.';if(next!==confirm)return 'Passwords do not match.';
 const hash=await A.account.hash(next);if(generation!==S.generation||!S.allowed())return 'This change was cancelled.';if(S.saveError)return 'Your password could not be saved.';S.account.hash=hash;S.account.password_changed_at=Date.now();return '';
};
const allowed=A.account.allowed;A.account.allowed=()=>S.role==='customer'&&allowed();
})();
