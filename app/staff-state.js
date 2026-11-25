/* Staff session and projections. This preview has no server security boundary. */
(() => {
const A=K406,C=A.commerce,I=A.inventory;
const S=A.staff={parts:[],role:'customer',account:null,events:[],history:new Map(),versions:new Map(),results:new Map(),query:'',type:'all',status:'active',range:'all',page:1,ingredient:'',movementType:'all',source:'all',from:'',to:'',calendarDate:A.schedule.today(),calendarView:'week',includeCompleted:false,notificationFilter:'all',recipeId:1,variant:'standard',mode:'normal',saveError:false,generation:0};
S.allowed=()=>A.auth==='signedin'&&S.role==='staff'&&S.account?.status==='active'&&S.account.setup;
S.name=()=>S.account.first_name+' '+S.account.last_name;
S.orderStatus=o=>['ready-pickup','ready-delivery','in-transit'].includes(o.status)?'ready':o.status;
S.emit=(key,type,message,path)=>{if(!S.events.some(e=>e.key===key)){const notification_type=key.startsWith('low:')||key.startsWith('shortage:')?'low_stock_alert':key.startsWith('defer:')?'subscription_deferment_completed':key.startsWith('new:')?'new_order':key.startsWith('payment-lookup:')?'payment_reconciliation_required':null;if(!notification_type)return;const entity=path.startsWith('staff/inventory')?'inventory':'order',entityId=entity==='inventory'||notification_type==='payment_reconciliation_required'?key.split(':')[1]:path.split('/').at(-1);S.events.unshift({id:'SN-'+(S.events.length+1),key,type,notification_type,message,path,read:false,is_read:false,read_at:null,at:Date.now(),role:'staff',recipient_role:notification_type==='payment_reconciliation_required'?'admin':'all',related_entity_type:entity,related_entity_id:entityId});}};
S.notifications=()=>A.notifications.account?.role==='staff'
 ?[...A.notifications.saved,...S.events.filter(e=>A.operations.find(e.related_entity_id)?.type==='cake')]
 :S.events;
S.stockWarnings=new Map();S.stockEpisodes=new Map();
S.checkStockAlerts=()=>{for(const i of I.items){const low=!i.archivedAt&&I.available(i.id)<=i.threshold;if(low&&!S.stockWarnings.get(i.id)){const episode=(S.stockEpisodes.get(i.id)||0)+1;S.stockEpisodes.set(i.id,episode);S.emit('low:'+i.id+':'+episode,'inventory',i.name+' needs stock attention.','staff/inventory');}S.stockWarnings.set(i.id,low);}};
S.orders=()=>[...I.allOrders(),...(A.pickup?.operationalOrders()||[]),...(A.subscriptions.persistence?.orders()||[])].filter(o=>o.paid&&!['payment-resolution','cancelled','pending-payment','payment-failed'].includes(o.status));
S.project=o=>({id:o.id,type:o.type,status:S.orderStatus(o),version:S.versions.get(o.id)||0,date:o.fulfillment.date,preparationDate:A.subscriptions.preparationDate?.(o)||null,method:o.fulfillment.method,items:o.items.map(i=>({name:i.name,variant:i.variant,quantity:i.quantity})),cycle:o.deliveryId?Number(o.deliveryId.match(/(\d+)$/)?.[1])||null:null,subscriptionId:o.subscriptionId||null,courier:o.delivery?.status?.replaceAll('_',' ')||'Booking pending',materialIssue:o.materialIssue||'',reservationStatus:o.reservationStatus||I.reservations.get(o.id)?.status||'projected',requirements:o.materialRequirements||I.requirements.get(o.id)||I.materials(o),history:o.statusHistory||S.history.get(o.id)||[]});
S.list=()=>S.allowed()?S.orders().map(S.project):[];
S.changed=()=>{S.checkStockAlerts();S.render?.();A.shell?.sync();};
S.transition=(...args)=>S.allowed()?A.fulfillment.transition(...args):'Staff access required.';
S.enter=()=>{if(!S.account?.setup||S.account.status!=='active')return;if(A.session){A.session.generation++;A.owner?.drafts.clear();}A.closeModal(true);S.generation++;S.role='staff';A.auth='signedin';A.account.securityGeneration++;A.account.verification=null;location.hash='#/staff';window.dispatchEvent(new HashChangeEvent('hashchange'));};
const allowed=A.account.allowed;A.account.allowed=()=>S.role==='customer'&&allowed();
})();
