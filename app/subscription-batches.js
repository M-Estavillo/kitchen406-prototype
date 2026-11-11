/* Subscription batch controls for the owner and staff calendars. */
(() => {
const A=K406,V=A.ownerUI,E=A.escape;
const actions={
 preparing:{label:'Start preparation',required:'confirmed',date:'preparation'},
 ready:{label:'Mark ready',required:'preparing',date:'preparation'},
 courier:{label:'Book couriers',required:'ready',date:'fulfillment'}
};
let action='preparing',context='',selected=new Set(),results=new Map(),running=false;
const version=id=>A.staff.versions.get(id)||0;
const units=row=>row.order.items.reduce((total,item)=>total+item.quantity,0);
const count=(n,label)=>n+' '+label+(n===1?'':'s');
const staffCalendar=()=>A.route==='staff';
const workspace=()=>staffCalendar()?A.staff:A.owner;
const calendarDate=()=>staffCalendar()?A.staff.calendarDate:A.owner.date;

function orders(){
 return A.staff.orders().filter(order=>order.type==='subscription'&&order.items.length).map(order=>({
  order,preparation:A.subscriptions.preparationDate(order),fulfillment:order.fulfillment.date
 }));
}
function forDate(rows,date){
 return rows.filter(row=>row.preparation===date||row.fulfillment===date);
}
function blocker(row,date){
 const {order}=row;
 const status=A.operations.status(order),stage=actions[action];
 const actionDate=row[stage.date];
 if(!actionDate)return 'No '+stage.date+' date is recorded.';
 if(actionDate!==date)return 'Use the '+stage.date+' date, '+V.date(actionDate)+'.';
 if(status!==stage.required)return 'Requires '+stage.required+' status.';
 if(action==='preparing'){
  const inventory=A.inventory;
  return inventory.reason(inventory.requirements.get(order.id)??inventory.materials(order),order.id);
 }
 if(action==='courier'){
  if(order.delivery?.status==='pending')return 'Booking pending. Check the order before retrying.';
  if(order.delivery&&!['failed','cancelled'].includes(order.delivery.status))return 'Courier booking already exists.';
  return A.deliveries.reason(order);
 }
 return '';
}
function sync(date){
 const key=[A.session.generation,A.route,date,action].join(':');
 if(context!==key){context=key;selected.clear();results.clear();}
}
function groups(rows){
 const batches=new Map();
 for(const row of rows){
  const item=row.order.items[0],key=JSON.stringify([item.productId,row.fulfillment]);
  if(!batches.has(key))batches.set(key,{name:item.name,fulfillment:row.fulfillment,rows:[]});
  batches.get(key).rows.push(row);
 }
 return [...batches.values()].sort((a,b)=>a.fulfillment.localeCompare(b.fulfillment)||a.name.localeCompare(b.name));
}
function rowHtml(row,reason){
 const {order}=row,id=E(order.id),checked=selected.has(order.id)&&!reason;
 const items=order.items.map(item=>E(item.variant)+' × '+item.quantity).join(', ');
 const details=staffCalendar()?'<a class="btn" href="#/staff/production/'+E(encodeURIComponent(order.id))+'">Details</a>':V.link('orders/'+encodeURIComponent(order.id),'Details');
 return `<li class="owner-batch-order"><label><input type="checkbox" data-batch-order value="${id}" aria-label="Select order ${id}" ${checked?'checked':''} ${reason||running?'disabled':''}><span><strong>${id}</strong><small>${items} · ${order.fulfillment.method==='pickup'?'Pickup':'Delivery'}</small>${reason?`<small class="muted">${E(reason)}</small>`:''}</span></label><div>${V.badge(A.operations.status(order))}${details}</div></li>`;
}
function resultsHtml(rows){
 if(!results.size)return '';
 const eligible=new Set(rows.filter(row=>!row.reason).map(row=>row.order.id));
 return `<div class="owner-batch-results"><h3>Batch results</h3><ul>${[...results].map(([id,result])=>{
  const retry=action==='courier'&&result.status==='failed'&&eligible.has(id)&&!running;
  return `<li><span><strong>${E(id)}</strong> · ${E(result.message)}</span>${retry?`<button type="button" class="owner-batch-retry" data-batch-retry="${E(id)}" aria-label="Book Another Courier for ${E(id)}">Book Another Courier</button>`:''}</li>`;
 }).join('')}</ul></div>`;
}
function panel(date,allRows=orders()){
 sync(date);
 const rows=forDate(allRows,date).map(row=>({...row,reason:blocker(row,date)}));
 const eligible=rows.filter(row=>!row.reason),chosen=eligible.filter(row=>selected.has(row.order.id));
 const stage=actions[action];
 const otherDates=[...new Set(rows.map(row=>row[stage.date]).filter(day=>day&&day!==date))].sort();
 const dateLinks=otherDates.map(day=>A.ui.button({
  action:staffCalendar()?'day':'calendar-date',namespace:staffCalendar()?'staff':'owner',
  label:'Go to '+stage.date+' · '+V.date(day),extra:`data-date="${E(day)}"`
 }));
 return `<section class="commerce-card owner-subscription-batches" aria-labelledby="owner-batches-title">
 <div class="commerce-card-heading"><div><h2 id="owner-batches-title">Subscription batches</h2><p>Selected date · ${E(V.date(date))}</p></div>${V.select('batch-action','Batch action',Object.entries(actions).map(([key,value])=>[key,value.label]),action,running?'disabled':'')}</div>
 <p class="muted">${stage.label} uses each order’s ${stage.date} date.</p>
 ${dateLinks.length?`<div class="owner-batch-date-links">${dateLinks.join('')}</div>`:''}
 ${resultsHtml(rows)}
 ${rows.length?`<div class="owner-batch-toolbar"><label><input type="checkbox" id="owner-batch-all" ${eligible.length&&chosen.length===eligible.length?'checked':''} ${!eligible.length||running?'disabled':''}> Select all eligible</label><span>${count(chosen.length,'order')} selected · ${count(chosen.reduce((n,row)=>n+units(row),0),'unit')}</span>${V.button('batch-review',stage.label,!chosen.length||running?'disabled':'',true)}</div>
 <div class="owner-batch-groups">${groups(rows).map(batch=>`<section><div class="owner-batch-group-heading"><h3>${E(batch.name)}</h3><p>Fulfillment ${E(V.date(batch.fulfillment))} · ${count(batch.rows.length,'order')} · ${count(batch.rows.reduce((n,row)=>n+units(row),0),'unit')}</p></div><ul>${batch.rows.map(row=>rowHtml(row,row.reason)).join('')}</ul></section>`).join('')}</div>`:'<p class="staff-calendar-empty">No subscription orders are scheduled for preparation or fulfillment on this date.</p>'}
 </section>`;
}
A.subscriptionBatches={orders,panel};

function inCalendar(){
 if(staffCalendar())return A.staff.parts[1]==='calendar'&&A.staff.allowed();
 return A.route==='owner'&&A.owner.parts[1]==='capacity'&&!A.owner.parts[2]&&A.session.ownerAllowed();
}
function refresh(focus){
 const node=document.querySelector('.owner-subscription-batches');
 if(!node)return;
 node.outerHTML=panel(calendarDate());
 if(focus?.id)A.$(focus.id)?.focus();
 else if(focus?.hasAttribute('data-batch-order'))document.querySelector(`[data-batch-order][value="${CSS.escape(focus.value)}"]`)?.focus();
}
function execute(picks,date,key,generation,operation,retry){
 if(running||!inCalendar()||calendarDate()!==date||context!==key||A.session.generation!==generation)return;
 const current=new Map(forDate(orders(),date).map(row=>[row.order.id,row]));
 const view=workspace();
 const mixed=A.deliveries.outcome==='one-failure';
 let simulateFailure=mixed&&!retry;
 running=true;
 selected.clear();
 try{
  for(const pick of picks){
   const row=current.get(pick.id);
   const error=!row||version(pick.id)!==pick.version?'Order changed. Review it before trying again.':blocker(row,date);
   let failure=error;
   if(!failure&&action==='courier'){
    const outcome=mixed?(simulateFailure?'failure':'success'):A.deliveries.outcome;
    failure=view.saveError?'The booking could not be saved.':A.deliveries.book(pick.id,operation+':'+pick.id,pick.version,outcome);
    simulateFailure=false;
   }else if(!failure){
    failure=A.fulfillment.transition(pick.id,action,pick.version,operation+':'+pick.id);
   }
   if(failure){results.set(pick.id,{status:'failed',message:failure});continue;}
   const status=action==='courier'?row.order.delivery.status:action;
   const messages={booked:'Courier booked.',pending:'Booking pending. Check the order for updates.',failed:'Courier booking failed.',cancelled:'Courier cancelled the booking.',preparing:'Preparation started.',ready:'Marked ready.'};
   results.set(pick.id,{status:status==='cancelled'?'failed':status,message:messages[status]});
  }
 }finally{
  running=false;
  A.closeModal(true);
  view.render();
  A.$('owner-batches-title')?.scrollIntoView({block:'nearest'});
 }
}
function confirm(rows,date,retry=false){
 const stage=actions[action],key=context,generation=A.session.generation,operation=crypto.randomUUID();
 const picks=rows.map(({order})=>({id:order.id,version:version(order.id)}));
 const note=action==='preparing'?'This records ingredients as used. Orders that fail stock checks stay confirmed.':action==='courier'?'Each delivery gets a separate booking. You can retry failed bookings from the results.':'Confirm that these orders are prepared and staged.';
 const label=retry?'Book another courier':stage.label;
 const summary=retry?`<p>Try another courier for <strong>${E(picks[0].id)}</strong> using the same delivery details?</p>`:`<p>${count(rows.length,'order')} · ${count(rows.reduce((n,row)=>n+units(row),0),'unit')}</p><ul class="owner-batch-confirm-list">${rows.map(({order})=>`<li>${E(order.id)} · ${E(order.items[0].name)}</li>`).join('')}</ul><p>${note}</p>`;
 workspace().open(label+'?',`<div class="owner-order-confirm">${summary}<div class="owner-order-confirm-actions"><button type="button" class="btn" data-close-modal>Cancel</button>${V.button('batch-confirm',label,'',true)}</div></div>`,true);
 A.$(staffCalendar()?'staff-dialog-body':'owner-dialog-body').querySelector('[data-owner=batch-confirm]').addEventListener('click',()=>execute(picks,date,key,generation,operation,retry),{once:true});
}
document.addEventListener('change',event=>{
 const input=event.target;
 if(!input.closest('.owner-subscription-batches')||!inCalendar()||running)return;
 if(input.id==='owner-batch-action'){action=input.value;refresh(input);return;}
 if(input.id==='owner-batch-all'){
  const date=calendarDate();
  selected=new Set(input.checked?forDate(orders(),date).filter(row=>!blocker(row,date)).map(row=>row.order.id):[]);
 }else if(input.hasAttribute('data-batch-order')){
  if(input.checked)selected.add(input.value);else selected.delete(input.value);
 }else return;
 refresh(input);
});
document.addEventListener('click',event=>{
 const button=event.target.closest('[data-owner=batch-review],[data-batch-retry]');
 if(!button||button.disabled||!inCalendar()||running)return;
 const retryId=button.dataset.batchRetry;
 if(retryId&&(action!=='courier'||results.get(retryId)?.status!=='failed'))return;
 const ids=retryId?new Set([retryId]):selected;
 const date=calendarDate();
 const rows=forDate(orders(),date).filter(row=>ids.has(row.order.id)&&!blocker(row,date));
 if(rows.length)confirm(rows,date,!!retryId);
});
})();
