/* Route integration and the shared Phase 2 inspector. */
(() => {
const A=K406,C=A.commerce,S=C.state,M=C.mock,U=C.ui;
C.show=parts=>{
 C.step=parts[1]||'fulfillment';C.orderId=['payment','confirmation','orders'].includes(parts[0])?parts[1]||null:null;
 const o=C.currentOrder();
 if(parts[0]==='payment'&&o){S.activeId=o.id;if(!o.fixture&&C.unpaid(o)&&o.revision!==S.revision)C.setPayment(o,'revalidation');}
 C.render();
};
C.render=()=>{
 if(!C.routes.includes(A.route))return;
 const mount=A.$('commerce-view');if(!mount)return;
 if(A.auth==='signedin'&&A.route==='checkout'&&C.step!=='fulfillment'&&S.draft.method==='delivery'&&!C.checkout.form)void C.deliveryRoute.check();
 let html='';
 if(A.auth!=='signedin')html=U.page('Sign in to continue','Your bag and checkout selections will remain here.',U.empty('Your Kitchen406 account','Sign in to access your bag, checkout, and order history.',U.link('sign-in','Sign in',true)+U.link('register','Create account')));
 else if(M.page==='loading')html=U.page('Loading…','Retrieving your demo details.',`<div class="commerce-skeleton" role="status">Loading…</div>${U.button('page-retry','Return to normal preview')}`);
 else if(M.page==='error'||M.page==='notfound')html=U.empty(M.page==='notfound'?'Order not found':'We could not load this page','Your selections are still saved.',U.button('page-retry','Try again')+U.link('orders','View orders'));
 else if(A.route==='cart')html=C.checkout.cart();
 else if(A.route==='orders')html=C.orderId?C.orders.details():C.orders.list();
 else if(A.route==='payment')html=C.orders.payment();
 else if(A.route==='confirmation')html=C.orders.details(true);
 else if(!C.cartValid())html=U.empty('Review your bag','Add products or resolve unavailable items and quantity limits before checkout.',U.link('cart','Back to bag'));
 else if(C.step!=='fulfillment'&&(!S.draft.method||!C.dateValid()))html=U.empty('Choose fulfillment first','Select your fulfillment method and an available date.',U.link('checkout/fulfillment','Choose fulfillment'));
 else if(C.step==='review'&&!C.ready())html=U.empty('Complete delivery details','Select a serviceable address and delivery quotation before review.',U.link('checkout/address','Delivery details'));
 else html=C.step==='fulfillment'?C.checkout.fulfillment():C.step==='address'?C.checkout.address():C.step==='review'?C.checkout.review():U.empty('Checkout step not found','Return to your bag.',U.link('cart','View bag'));
 const verifying=S.orders.find(o=>['detected','delayed'].includes(o.payment));
 if(verifying&&A.auth==='signedin'&&['cart','checkout'].includes(A.route))html=U.alert('Payment verification is pending. Checkout changes are temporarily locked.')+U.link('payment/'+verifying.id,'Check payment status')+html;
 mount.innerHTML=html;C.sync();C.addressMap?.mount();
};
C.inspector=select=>{
 let h=select('mock-commerce-page','Page state',['normal','loading','error',...(['cart','orders'].includes(A.route)&&!C.orderId?['empty']:[]),...(['orders','confirmation'].includes(A.route)&&C.orderId?['notfound']:[])],M.page);
 if(A.route==='cart')h+=select('mock-commerce-stock','Cart scenario',['normal','unavailable','quantity'],M.stock);
 if(A.route==='checkout'){
  h+=select('mock-commerce-method','Fulfillment method',['unselected','pickup','delivery'],S.draft.method||'unselected');
  if(C.step==='fulfillment')h+=select('mock-commerce-calendar','Calendar',['normal','loading','error'],M.calendar)+select('mock-commerce-dates','Date availability',['normal','fully-booked','blocked','cutoff','stock','no-dates'],M.dates)+select('mock-commerce-validation','Revalidation',['normal','checking','conflict','error'],M.validation)+'<div class="mock-actions"><button data-commerce="missing-method">Missing method</button><button data-commerce="missing-date">Missing date</button></div>';
  if(C.step==='address')h+=select('mock-commerce-quote','Courier quote',['ok','loading','failed','fleet_unavailable'],S.draft.quote)+'<div class="mock-actions"><button data-commerce="empty-addresses">No addresses</button><button data-commerce="address-add">Add form</button><button data-commerce="session-expired">Session expired</button></div>';
  if(C.step==='review')h+=select('mock-commerce-review','Stock / schedule verification',['normal','stock','capacity','checking','error'],M.review)+select('mock-commerce-price','Pricing',['normal','updated'],M.price);
 }
 if(A.route==='payment')h+=select('mock-commerce-payment','Payment simulation',['waiting','detected','delayed','confirmed','failed','expired','revalidation'],C.currentOrder()?.payment||'waiting')+'<div class="mock-actions"><button data-commerce="payment-preview">Fresh payment preview</button></div>';
 if(A.route==='orders'&&!C.orderId)h+=select('mock-commerce-dataset','Order dataset',['all','standard','subscription','cake'],M.dataset);
 if((A.route==='orders'&&C.orderId)||A.route==='confirmation')h+=select('mock-commerce-status','Order lifecycle',['pending-payment','confirmed','preparing','ready-delivery','ready-pickup','in-transit','completed','payment-failed','payment-resolution','cancelled'],C.currentOrder()?.status||'confirmed')+select('mock-commerce-courier','Courier preview',['prebooking','booked','transit','delivered','failed'],M.courier);
 h+='<div class="mock-actions"><button data-commerce="sample-cart">Load sample bag</button><button data-commerce="sample-orders">Load sample orders</button><button data-commerce="reset-states">Reset screen states</button></div><p class="muted">Calendar clock: Oct 14, 2026. Demo data stays in this tab until reload or Reset preview.</p>';
 return h;
};
document.addEventListener('click',e=>{
 const date=e.target.closest('[data-date]'),method=e.target.closest('[data-method]'),el=e.target.closest('[data-commerce]');
 if((date||method)&&C.change()){if(date)S.draft.date=date.dataset.date;if(method)S.draft.method=method.dataset.method;C.checkout.message='';C.render();A.inspector();}
 if(!el||el.disabled)return;const action=el.dataset.commerce;
 if(action==='page-retry')M.page='normal';
 if(action==='sample-cart')C.sampleCart();
 if(action==='sample-orders'){C.sampleOrders();M.page='normal';A.toast('Sample order history loaded.');}
 if(action==='payment-preview'){
  const source=C.currentOrder();if(source){const o=C.copy(source);o.id='K406-PREVIEW-'+(++S.serial);o.fixture=true;o.status='pending-payment';o.payment='waiting';o.paid=false;delete o.paidAt;o.deadline=Date.now()+600000;o.reference='DEMO-QR-'+S.serial;o.attempts=[{state:'waiting',at:'Fresh preview'}];o.activity=[{text:'Payment preview created',at:new Date().toLocaleString()}];S.orders.unshift(o);location.hash='#/payment/'+o.id;}
 }
 if(action==='empty-addresses'&&C.change()){S.addresses=[];S.draft.addressId='';}
 if(action==='missing-method'){S.draft.method='';C.checkout.message='Please select a fulfillment method.';}
 if(action==='missing-date'){S.draft.date='';C.checkout.message='Please select an available fulfillment date.';}
 if(action==='session-expired'){A.setAuth('guest');A.toast('Demo session expired. Sign in to resume.');}
 if(action==='reset-states'){Object.keys(M).forEach(k=>M[k]=k==='payment'?'waiting':k==='courier'?'prebooking':k==='dataset'?'all':'normal');S.draft.service='ok';S.draft.quote='ok';C.checkout.message='';}
 C.checkout.action(action,el);C.orders.action(action,el);
});
document.addEventListener('change',e=>{
 if(!e.target.id.startsWith('mock-commerce-'))return;
 const key=e.target.id.replace('mock-commerce-',''),value=e.target.value;
 if(key==='method'){if(!C.change())return;S.draft.method=value==='unselected'?'':value;}
 else if(key==='service'||key==='quote')S.draft[key]=value;
 else if(key==='payment')C.setPayment(C.currentOrder(),value);
 else if(key==='status'){
  const o=C.currentOrder();if(o){C.setStatus(o,value);o.payment=['pending-payment'].includes(value)?'waiting':value==='payment-failed'?'failed':value==='cancelled'?'cancelled':'confirmed';o.paid=!['pending-payment','payment-failed','cancelled'].includes(value);if(value==='ready-pickup')o.fulfillment.method='pickup';if(['ready-delivery','in-transit'].includes(value))o.fulfillment.method='delivery';o.fee=o.fulfillment.method==='pickup'?0:95;o.total=C.subtotal(o.items)+o.fee;}
 }else{
  M[key]=value;
  if(key==='stock'){S.cart.forEach(i=>{i.available=true;i.quantity=Math.min(i.quantity,i.max);});if(S.cart[0]){if(value==='unavailable')S.cart[0].available=false;if(value==='quantity')S.cart[0].quantity=13;}}
  if(key==='validation'&&value==='conflict')S.draft.date='';
 }
 C.render();A.inspector();
});
document.addEventListener('click',e=>{
 if(e.target.closest('#confirm-order-cancel')){const o=S.orders.find(o=>o.id===e.target.closest('button').dataset.id);if(C.unpaid(o)){C.setStatus(o,'cancelled');o.payment='cancelled';}A.closeModal();C.render();A.inspector();}
});
})();
