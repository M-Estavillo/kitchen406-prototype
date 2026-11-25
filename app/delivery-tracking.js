/* Local booking, reconciliation and status preview. */
(() => {
const A=K406,E=A.escape,T=A.deliveryTracking={};
const pending=o=>['pending','unknown'].includes(o?.delivery?.status);
const active=o=>['booked','in_transit','delivered'].includes(o?.delivery?.status);
const close='<button class="btn" data-close-modal>Close</button>';
const cancel='<button class="btn" data-close-modal>Cancel</button>';
const button=(action,label,attrs)=>`<button class="btn primary" data-courier-${action} ${attrs}>${label}</button>`;
const orderAttr=id=>`data-id="${E(id)}"`;
const version=id=>A.staff.versions.get(id)||0;
T.button=o=>{
 if(pending(o)&&A.session.ownerAllowed())return button('check','Check booking status',orderAttr(o.id));
 return active(o)?button('track','Track delivery',orderAttr(o.id)):'';
};
T.open=(title,message,actions)=>{
 const body=`<div class="courier-dialog"><p role="status">${E(message)}</p><div class="courier-dialog-actions">${actions}</div></div>`;
 if(A.route==='owner')A.owner.open(title,body);else A.staff.open(title,body,true);
};
T.track=async id=>{
 if(!A.session.operational())return;
 const o=A.operations.find(id);
 if(o?.persistedSubscription&&['booked','in_transit'].includes(o.delivery?.status)){
  const error=await A.deliveries.refresh(id);
  if(error){T.open('Delivery status',error,close);return;}
 }
 const latest=A.operations.find(id);
 if(active(latest))T.open('Delivery status','Latest saved courier status: '+latest.delivery.status.replaceAll('_',' ')+'.',close);
};
T.book=(id,reviewVersion)=>{
 if(!A.session.ownerAllowed())return;
 const o=A.operations.find(id),reason=A.deliveries.reason(o);
 if(reason||reviewVersion!==version(id)||pending(o)||active(o)){
  T.open('Booking unavailable',reason||'Order changed. Review its current state.',close);
  return;
 }
 const destination=[o.address.add_line_1,o.address.add_line_2,o.address.city,o.address.postal_code,o.address.landmark].filter(Boolean).join(', ');
 const attrs=`${orderAttr(id)} data-version="${reviewVersion}" data-key="${crypto.randomUUID()}" data-generation="${A.session.generation}"`;
 T.open('Review courier booking','Saved destination: '+destination+'. Confirm to book this delivery.',cancel+button('confirm','Confirm booking',attrs));
};
T.confirm=async(id,reviewVersion,key)=>{
 if(!A.session.ownerAllowed())return;
 const error=A.owner.saveError?'We could not save your booking. Review the order and try again.':await A.deliveries.book(id,key,reviewVersion);
 A.owner.render();
 if(error){T.open('Booking unsuccessful',error,close);return;}
 showOutcome(id);
};
T.check=async id=>{
 if(!A.session.ownerAllowed())return;
 const error=await A.deliveries.reconcile(id);
 A.owner.render();
 if(error){T.open('Booking status',error,close+(pending(A.operations.find(id))?button('check','Check booking status',orderAttr(id)):''));return;}
 showOutcome(id);
};
function showOutcome(id){
 const order=A.operations.find(id),delivery=order?.delivery;
 if(!delivery)return;
 if(pending(order)){
  T.open('Booking unresolved','Check the existing attempt before booking another courier.',close+button('check','Check booking status',orderAttr(id)));
  return;
 }
 if(active(order)){
  T.open('Booking established','The booking reference is '+delivery.lalamove_id+'.',close);
  return;
 }
 const cancelled=delivery.status==='cancelled';
 const title=cancelled?'Booking cancelled':delivery.outcome==='unavailable'?'No couriers available':'Booking unsuccessful';
 const retry=A.deliveries.reason(order)?'':button('book','Review and rebook',`${orderAttr(id)} data-version="${version(id)}"`);
 T.open(title,'Review the order before starting a new booking. The order remains paid.',close+retry);
}
document.addEventListener('change',e=>{
 if(!A.session.ownerAllowed())return;
 if(e.target.id==='mock-courier-outcome')A.deliveries.outcome=e.target.value;
 if(e.target.id==='mock-courier-lookup')A.deliveries.lookupOutcome=e.target.value;
});
document.addEventListener('click',e=>{
 if(!A.session.operational())return;
 const track=e.target.closest('[data-courier-track]');if(track){T.track(track.dataset.id);return;}
 const check=e.target.closest('[data-courier-check]');if(check&&!check.disabled){T.check(check.dataset.id);return;}
 const confirm=e.target.closest('[data-courier-confirm]');if(confirm&&!confirm.disabled){
  if(confirm.dataset.generation===String(A.session.generation))T.confirm(confirm.dataset.id,Number(confirm.dataset.version),confirm.dataset.key);
  return;
 }
 const book=e.target.closest('[data-courier-book]');if(book&&!book.disabled){T.book(book.dataset.id,Number(book.dataset.version));return;}
 const el=e.target.closest('[data-staff]');if(!el||el.disabled||!A.staff.allowed())return;
 const action=el.dataset.staff,id=el.dataset.id,S=A.staff;
 if(action==='revert-status'){
  const target=A.fulfillment.previous(S.orders().find(o=>o.id===id));if(!target)return;
  S.formKey=crypto.randomUUID();const title='Revert status',message='Return this order to '+target+'?'+(target==='confirmed'?' Consumed ingredients will be restored to reserved stock.':'');
  S.open(title,`<p>${E(message)}</p><p class="field-error staff-error" role="alert"></p><div class="staff-confirm-actions"><button class="btn" data-close-modal>Cancel</button><button class="btn primary" data-staff="confirm-${action}" data-id="${E(id)}" data-version="${el.dataset.version}">Confirm</button></div>`,true);
 }
 if(action==='confirm-revert-status'){
  const error=S.saveError?'The update could not be saved. Retry.':A.fulfillment.revert(id,Number(el.dataset.version),S.formKey);
  if(error){document.querySelector('#staff-modal .staff-error').textContent=error;return;}A.closeModal(true);S.render();A.toast('Order updated.');
 }
});
})();
