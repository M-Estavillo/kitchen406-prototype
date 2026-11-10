(() => {

const A=K406,D=A.schedule,Q=A.capacity,B=A.subscriptions,V=A.ownerUI,E=A.escape;

function calendarHeading(){const O=A.owner,start=D.week(O.date),title=O.calendarMode==='month'?new Date(O.date+'T00:00:00Z').toLocaleDateString('en-PH',{month:'long',year:'numeric',timeZone:'UTC'}):O.calendarMode==='week'?V.date(start)+' – '+V.date(D.add(start,6)):V.date(O.date);return `<div class="staff-calendar-head"><div class="staff-calendar-title"><h2>${E(title)}</h2><p>Fulfillment dates · select a day to review capacity</p></div><div class="staff-calendar-views" role="group" aria-label="Calendar view">${['week','month'].map(mode=>V.button('calendar-mode',mode[0].toUpperCase()+mode.slice(1),`data-mode="${mode}" aria-pressed="${O.calendarMode===mode}"`)).join('')}</div></div>`;}

function dateNavigation(){return `<nav class="staff-calendar-navigation" aria-label="Calendar dates">${V.button('calendar-prev','Previous')}${V.button('calendar-next','Next')}</nav>`;}



function commitments(date){return A.operations.orders().filter(o=>o.paid&&o.fulfillment?.date===date&&!['cancelled','payment-resolution','pending-payment','payment-failed'].includes(A.operations.status(o)));}

function visible(list){const O=A.owner;return list.filter(o=>(!O.calendarType||O.calendarType==='all'||o.type===O.calendarType)&&(!O.calendarStatus||O.calendarStatus==='all'||A.operations.status(o)===O.calendarStatus));}

function capacityState(s){const limits=[[s.standard.size,D.config.standardVarieties],[s.cakeDay,A.cakeData.config.maxPerDay],[s.cakeWeek,A.cakeData.config.maxPerWeek],...[...s.standard.values()].map(n=>[n,D.config.standardUnits]),...[...s.subscriptions].map(([id,n])=>[n,D.subscriptionLimit(id)])];return limits.some(([n,max])=>n>max)?'Over configured limit':limits.some(([n,max])=>n>=max)?'One or more capacity limits reached':'Capacity available';}

function grid(){const O=A.owner,start=O.calendarMode==='month'?D.week(O.date.slice(0,7)+'-01'):D.week(O.date),count=O.calendarMode==='month'?42:7;if(O.calendarMode==='day')return '<p class="staff-calendar-day-hint">Review the selected day’s agenda and capacity below.</p>';return `<div class="staff-calendar-scroll" tabindex="0" aria-label="Production calendar"><div class="staff-calendar-weekdays">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(day=>`<span>${day}</span>`).join('')}</div><div class="staff-calendar ${O.calendarMode}">${Array.from({length:count},(_,n)=>{const date=D.add(start,n),summary=Q.summary(date),blocked=D.config.blocked.includes(date),state=capacityState(summary),orders=visible(commitments(date)),holds=summary.daily.filter(a=>a.status!=='confirmed').length;return `<section class="staff-day ${blocked?'blocked':''} ${O.calendarMode==='month'&&date.slice(0,7)!==O.date.slice(0,7)?'staff-day-outside':''}" ${date===O.date?'aria-current="date"':''}><button type="button" class="staff-day-select" data-owner="calendar-date" data-date="${date}" aria-label="${E(V.date(date))}: ${E(blocked?'Blocked':state)}, ${orders.length} orders" aria-pressed="${date===O.date}"></button><div class="staff-day-heading"><span class="staff-day-number">${Number(date.slice(-2))}</span>${date===D.today()?'<span class="staff-calendar-today">Today</span>':''}</div>${blocked?'<p class="staff-day-count">Blocked</p>':''}${orders.length?`<button type="button" class="staff-calendar-order-count" data-owner="calendar-date" data-date="${date}" aria-label="Show all ${orders.length} orders for ${E(V.date(date))}">${orders.length} ${orders.length===1?'Order':'Orders'}</button>`:''}</section>`;}).join('')}</div></div>`;}



function capacityMetric(label,n,max){return `<div class="owner-capacity-metric"><div><span>${E(label)}</span><strong>${n} <small>/ ${max}</small></strong></div><div class="owner-capacity-meter" role="meter" aria-label="${E(label)}" aria-valuemin="0" aria-valuemax="${Math.max(max,n)}" aria-valuenow="${n}" aria-valuetext="${n} of ${max} allocated"><span style="width:${Math.min(100,max?n/max*100:100)}%"></span></div><p>${n>max?`${n-max} over limit`:n===max?'Fully allocated':`${max-n} available`}</p></div>`;}
A.ownerPages.capacity=()=>{
 const O=A.owner;if(O.calendarMode==='day')O.calendarMode='week';
 const date=O.date,s=Q.summary(date),blocked=D.config.blocked.includes(date),orders=visible(commitments(date));
 const standard=capacityMetric('Varieties today',s.standard.size,D.config.standardVarieties)+[...s.standard].map(([id,n])=>capacityMetric(A.products.find(p=>p.id===id)?.name||id,n,D.config.standardUnits)).join('');
 const cakes=capacityMetric('Bookings today',s.cakeDay,A.cakeData.config.maxPerDay)+capacityMetric('Bookings this week',s.cakeWeek,A.cakeData.config.maxPerWeek);
 const subscriptions=[...s.subscriptions].map(([id,n])=>capacityMetric(A.products.find(p=>p.id===id)?.name||id,n,D.subscriptionLimit(id))).join('')||`<p class="owner-capacity-empty">No allocations this week.<br><strong>${D.config.subscriptionUnits} units</strong> per product per week.</p>`;
 return V.intro('Production Calendar','Plan fulfillment and review availability across each capacity pool.')+`<div class="staff-calendar-workspace owner-capacity-workspace"><div class="staff-toolbar staff-calendar-filters">${V.select('calendar-type','Order type',[['all','All types'],['standard','Standard'],['subscription','Subscription fulfillment'],['cake','Custom cake']],O.calendarType||'all')}${V.select('calendar-status','Status',[['all','All statuses'],...['confirmed','preparing','ready','completed'].map(v=>[v,v[0].toUpperCase()+v.slice(1)])],O.calendarStatus||'all')}<a class="btn primary owner-calendar-settings" href="#/owner/capacity/settings">Calendar settings</a></div><section class="commerce-card staff-calendar-panel">${calendarHeading()}${grid()}${dateNavigation()}</section><section class="commerce-card staff-calendar-agenda"><div class="commerce-card-heading"><div><h2>Agenda</h2><p>${V.date(date)}</p></div><span class="staff-agenda-count">${orders.length} ${orders.length===1?'order':'orders'} · ${orders.reduce((n,o)=>n+o.items.reduce((n,i)=>n+i.quantity,0),0)} units</span></div>${orders.length?orders.map(o=>A.ui.productionOrderCard({...o,date:o.fulfillment.date,method:o.fulfillment.method,status:A.operations.status(o)},true,V.link('orders/'+encodeURIComponent(o.id),'Details'))).join(''):'<p class="staff-calendar-empty">No commitments match this date and these filters.</p>'}</section><section class="commerce-card owner-capacity-summary"><div class="commerce-card-heading"><div><h2>Capacity</h2><p>${V.date(date)}</p></div>${V.link('capacity/settings','Manage')}</div>${blocked?`<p class="staff-note">${E(Q.blocks.get(date)?.reason||'No block reason recorded.')}</p>`:''}<div class="owner-capacity-pools"><section><h3>Standard orders <small>Daily</small></h3>${standard}<p class="owner-capacity-footnote">${D.config.standardUnits} units per product per day</p></section><section><h3>Custom cakes</h3>${cakes}</section><section><h3>Subscriptions <small>Weekly</small></h3>${subscriptions}</section></div><p class="staff-calendar-hint">Includes active holds. Stock and booking rules still apply.</p></section></div>`;
};

function rule(type,label){const c=D.config.timing?.[type]||{value:type==='cake'?A.cakeData.config.leadDays:D.config.leadDays,unit:'days',cutoff:String(type==='cake'?A.cakeData.config.cutoffHour:D.config.cutoffHour).padStart(2,'0')+':00'};return `<fieldset><legend>${E(label)}</legend><div class="staff-toolbar">${V.field(type+'-value','Lead time',c.value,'number','min="0" step="0.25" required')}${V.select(type+'-unit','Unit',[['days','Days'],['hours','Hours']],c.unit)}${V.field(type+'-cutoff','Cutoff (Manila)',c.cutoff,'time','required')}</div></fieldset>`;}

function blockedCalendar(){
 const O=A.owner;if(!['week','month'].includes(O.calendarMode))O.calendarMode='week';
 const start=D.week(O.calendarMode==='month'?O.date.slice(0,7)+'-01':O.date),count=O.calendarMode==='month'?42:7,blocked=D.config.blocked.includes(O.date);
 return `<section class="commerce-card owner-blocked-calendar"><h2>Blocked dates</h2>${calendarHeading()}<div class="staff-calendar-controls">${dateNavigation()}</div><div class="owner-block-grid"><div class="owner-block-weekdays">${['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d=>`<span>${d}</span>`).join('')}</div><div class="owner-block-days">${Array.from({length:count},(_,i)=>{const date=D.add(start,i),isBlocked=D.config.blocked.includes(date);return `<button type="button" data-owner="calendar-date" data-date="${date}" class="${isBlocked?'is-blocked':''} ${O.calendarMode==='month'&&date.slice(0,7)!==O.date.slice(0,7)?'outside':''}" aria-pressed="${date===O.date}" aria-label="${E(V.date(date))}, ${isBlocked?'blocked':'open'}">${Number(date.slice(-2))}${isBlocked?'<span>Blocked</span>':''}</button>`;}).join('')}</div></div><div class="owner-block-selection"><span>${V.date(O.date)}</span><span>${blocked?'Blocked':'Open for bookings'}</span></div>${blocked&&Q.blocks.get(O.date)?.reason?`<p class="owner-block-reason">${E(Q.blocks.get(O.date).reason)}</p>`:''}<div class="owner-block-actions">${V.button('block-date','Block date',blocked?'disabled':'',true)}${V.button('unblock','Unblock date',`data-date="${O.date}" ${blocked?'':'disabled'}`)}</div></section>`;
}
A.ownerPages.scheduling=()=>V.intro('Calendar Settings','Manage blocked dates, capacity limits and booking lead times.')+`<div class="owner-calendar-settings-page"><div class="owner-cake-back">${V.link('capacity','Back to calendar')}</div><div class="staff-stack">${blockedCalendar()}${V.panel('General capacity and timing',V.form('settings',`<p>Lower limits preserve existing allocations and prevent additional bookings when full.</p><div class="staff-grid">${V.field('standardUnits','Standard units per product / day',D.config.standardUnits,'number','min="1" step="1" required')}${V.field('standardVarieties','Standard varieties per day',D.config.standardVarieties,'number','min="1" step="1" required')}${V.field('maxPerDay','Cakes per day',A.cakeData.config.maxPerDay,'number','min="1" step="1" required')}${V.field('maxPerWeek','Cakes per week',A.cakeData.config.maxPerWeek,'number','min="1" step="1" required')}${V.field('subscriptionUnits','Subscription units per product / week',D.config.subscriptionUnits,'number','min="1" step="1" required')}</div>${rule('standard','Standard orders')}${rule('cake','Custom cakes')}<div class="owner-settings-actions">${V.button('discard','Discard edits')}<button class="btn primary" type="submit">Save changes</button></div>`,`data-version="${Q.version}"`).replace('<button class="btn primary" type="submit">Save changes</button></form>','</form>'))}${V.panel('Subscriptions','<p>Subscription commitments and capacity remain visible in the calendar. Set the default weekly capacity above. Manage schedules, offerings and product-specific capacity in Subscriptions.</p>',V.link('subscriptions','View subscriptions'))}</div></div>`;


A.ownerScheduleUI={block(){const date=A.owner.date;A.owner.open('Block date',`<div class="owner-block-dialog"><p>Block new bookings for <strong>${V.date(date)}</strong>?</p><form class="staff-form" data-owner-form="block" data-id="${date}"><input type="hidden" name="date" value="${date}">${V.select('category','Reason category',[['','Select a reason'],['Bakery closure','Bakery closure'],['Holiday','Holiday'],['Maintenance','Maintenance'],['Staff availability','Staff availability'],['Other','Other']],'','required')}${V.field('reason','Reason details','','text','required maxlength="300" placeholder="Briefly explain the block"')}${V.error()}<div class="owner-settings-actions">${V.button('cancel-cake-modal','Cancel')}<button type="submit" class="btn primary">Block date</button></div></form></div>`);},
 open(id, productForm){
 const product=productForm&&A.products.find(p=>p.id===Number(productForm.dataset.id));
 const s=id?B.schedules.find(s=>s.id===id):undefined;
 if(id&&!s)return;
 const days=B.weekdays.map((day,index)=>[index,day]);
 const products=A.products.filter(p=>p.subscription).map(p=>[p.id,p.name]);
 const productField=product
  ? `<div class="field owner-schedule-product"><span>Product</span><p>${E(productForm.elements.name.value.trim()||product.name)}</p></div><input type="hidden" name="product_id" value="${product.id}">`
  : V.select('product_id','Product',[['','Select a product'],...products],s?.product_id??'','required');
 const preparationDay=V.select('preparation_day','Preparation day',days,s?.preparation_day??4);
 const fulfillmentDay=V.select('day','Fulfillment day',days,s?.day??5);
 const dayFields=product?fulfillmentDay+preparationDay:preparationDay+fulfillmentDay;
 const status=product?'':`<div class="owner-schedule-status"><span>Status</span><label class="owner-schedule-toggle"><input type="checkbox" role="switch" aria-label="Offering active" name="status" value="active" ${s?.status!=='inactive'?'checked':''}><span class="owner-toggle-track" aria-hidden="true"></span><span class="owner-toggle-label"></span></label></div>`;
 A.owner.open(product?'Set up subscription':id?'Edit offering':'Add offering',`<form data-owner-form="schedule" class="staff-form" data-id="${E(id||'')}" data-version="${Q.version}">${productField}${dayFields}${status}${V.error()}<div class="owner-settings-actions">${V.button('cancel-cake-modal','Cancel')}<button class="btn primary" type="submit">Save changes</button></div></form>`);
 if(product){
  const form=A.$('owner-dialog-body').querySelector('form');
  form.addEventListener('submit',event=>{
   event.preventDefault();event.stopPropagation();
   if(!A.session.ownerAllowed()||!productForm.isConnected||form.dataset.generation!==String(A.session.generation))return;
   productForm.elements['subscription-schedule'].value=JSON.stringify({id:id||'',product_id:product.id,preparation_day:Number(form.elements.preparation_day.value),day:Number(form.elements.day.value),status:'active',version:Number(form.dataset.version)});
   productForm.elements.subscription.checked=true;
   A.owner.capture(productForm);
   A.closeModal(true);
  });
 }
 }
};

function confirmDeactivation(deactivate,cancel){
 A.owner.open('Deactivate subscription?',`<div class="owner-order-confirm"><p>New subscriptions will no longer be accepted. Ongoing subscriptions cannot be cancelled here and must still be fulfilled.</p>${V.error()}<div class="owner-order-confirm-actions">${V.button('subscription-deactivation-cancel','Cancel')}${V.button('subscription-deactivation-confirm','Deactivate','',true)}</div></div>`);
 const body=A.$('owner-dialog-body');
 body.querySelector('[data-owner=subscription-deactivation-cancel]').addEventListener('click',cancel);
 body.querySelector('[data-owner=subscription-deactivation-confirm]').addEventListener('click',()=>{
  if(!A.session.ownerAllowed())return;
  const error=deactivate();
  if(error)body.querySelector('.owner-error').textContent=error;
 });
}

document.addEventListener('input',event=>{
 const toggle=event.target,form=toggle.form;
 if(!form||!A.session.ownerAllowed())return;
 if(form.dataset.ownerForm==='product'&&form.dataset.id&&toggle.name==='subscription'){
  const enabling=toggle.checked;
  toggle.checked=!enabling;
  if(enabling){
   const schedules=B.schedules.filter(s=>s.product_id===Number(form.dataset.id));
   A.ownerScheduleUI.open((schedules.find(s=>s.status!=='inactive')||schedules[0])?.id,form);
  }else{
   confirmDeactivation(()=>{
    if(form.isConnected){
     toggle.checked=false;
     form.elements['subscription-schedule'].value='';
     A.owner.capture(form);
    }
    A.closeModal(true);
   },()=>A.closeModal(true));
  }
 }
 if(form.dataset.ownerForm==='schedule'&&toggle.name==='status'&&!toggle.checked){
  toggle.checked=true;
  const title=A.$('owner-dialog-title').textContent;
  const restore=()=>{
   A.$('owner-dialog-title').textContent=title;
   A.$('owner-dialog-body').replaceChildren(form);
   toggle.focus();
  };
  confirmDeactivation(()=>{
   if(!form.dataset.id){toggle.checked=false;restore();return;}
   if(A.owner.saveError)return 'The change could not be saved. Please retry.';
   const schedule=B.schedules.find(s=>s.id===form.dataset.id);
   if(!schedule)return 'This offering is unavailable. Reopen the list.';
   const error=Q.saveSchedule({...schedule,status:'inactive'},Number(form.dataset.version));
   if(error)return error;
   A.closeModal(true);
   A.operations.changed();
   A.toast('Subscription offering deactivated.');
  },restore);
 }
});
})();
