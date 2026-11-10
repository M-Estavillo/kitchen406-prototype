/* Local courier booking outcomes and Lalamove handoff placeholder. */
(() => {
const A=K406,E=A.escape,T=A.deliveryTracking={};
T.button=o=>o?.delivery&&['booked','in_transit','delivered'].includes(o.delivery.status)?`<button class="btn" data-courier-track data-id="${E(o.id)}">Track delivery</button>`:'';
T.open=(title,message,actions)=>{const body=`<div class="courier-dialog"><p role="status">${E(message)}</p><div class="courier-dialog-actions">${actions}</div></div>`;if(A.route==='owner')A.owner.open(title,body);else A.staff.open(title,body,true);};
T.track=id=>{if(!T.button(A.operations.find(id)))return;T.open('Track delivery with Lalamove','The next screen will open in Lalamove, where you can view live tracking and delivery details.','<button class="btn primary" data-close-modal>Close</button>');};
T.book=(id,version)=>{
 if(!A.session.operational())return;
 const workspace=A.route==='owner'?A.owner:A.staff;
 const error=workspace.saveError?'We could not save your booking. Please try again.':A.deliveries.book(id,crypto.randomUUID(),version);
 const o=A.operations.find(id),status=o?.delivery?.status;
 workspace.render();
 if(!error&&status==='booked'){A.closeModal(true);A.toast('Booking accepted. Your courier is assigned.');return;}
 const outcome=error?'error':o?.delivery?.outcome;
 const [title,message]=error?['Booking unsuccessful',error]:outcome==='cancelled'?['Booking cancelled','The courier cancelled your booking. You can book another courier.']:outcome==='unavailable'?['No couriers available','No courier accepted your booking. Please try again shortly.']:status==='pending'?['Booking pending','Waiting for a response from the courier.']:['Booking unsuccessful','We could not book a courier. Please try again.'];
 const retry=status!=='pending'&&!T.button(o)?`<button class="btn primary" data-courier-book data-id="${E(id)}" data-version="${A.staff.versions.get(id)||0}">Book another courier</button>`:'';
 T.open(title,message,'<button class="btn" data-close-modal>Cancel</button>'+retry);
};
document.addEventListener('change',e=>{if(e.target.id==='mock-courier-outcome'&&A.session.operational())A.deliveries.outcome=e.target.value;});
document.addEventListener('click',e=>{
 if(!A.session.operational())return;
 const track=e.target.closest('[data-courier-track]');if(track){T.track(track.dataset.id);return;}
 const book=e.target.closest('[data-courier-book],[data-staff="book-courier"]');if(book&&!book.disabled){T.book(book.dataset.id,Number(book.dataset.version));return;}
 const el=e.target.closest('[data-staff]');if(!el||el.disabled||!A.staff.allowed())return;
 const action=el.dataset.staff,id=el.dataset.id,S=A.staff;
 if(action==='revert-status'){
  const target=A.fulfillment.previous(S.orders().find(o=>o.id===id));if(action==='revert-status'&&!target)return;
  S.formKey=crypto.randomUUID();const title=action==='book-courier'?'Book courier':'Revert status',message=action==='book-courier'?'Book a courier using this order’s checkout destination and delivery fee?':'Return this order to '+target+'?'+(target==='confirmed'?' Consumed ingredients will be restored to reserved stock.':'');
  S.open(title,`<p>${E(message)}</p><p class="field-error staff-error" role="alert"></p><div class="staff-confirm-actions"><button class="btn" data-close-modal>Cancel</button><button class="btn primary" data-staff="confirm-${action}" data-id="${E(id)}" data-version="${el.dataset.version}">Confirm</button></div>`,true);
 }
 if(action==='confirm-revert-status'){
  const error=S.saveError?'The update could not be saved. Retry.':action==='confirm-book-courier'?A.deliveries.book(id,S.formKey,Number(el.dataset.version)):A.fulfillment.revert(id,Number(el.dataset.version),S.formKey);
  if(error){document.querySelector('#staff-modal .staff-error').textContent=error;return;}A.closeModal(true);S.render();A.toast('Order updated.');
 }
});
})();
