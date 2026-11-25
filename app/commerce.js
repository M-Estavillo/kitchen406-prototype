/* Route integration and the shared Phase 2 inspector. */
(() => {
const A=K406,C=A.commerce,S=C.state,M=C.mock,U=C.ui;
C.show=parts=>{
 C.step=parts[1]||'fulfillment';C.orderId=['payment','confirmation','orders'].includes(parts[0])?parts[1]||null:null;
 const o=C.currentOrder();
 if(parts[0]==='payment'&&o&&A.account.owns(o)){
  S.activeId=o.id;
  const advanced=A.checkoutHolds?.advance(o,C.setPayment);
  if(!advanced&&(o.reconciliationRequired||['detected','delayed'].includes(o.payment)))A.checkoutHolds?.check(o);
 }
 C.render();
};
C.render=()=>{
 if(!C.routes.includes(A.route))return;
 const mount=A.$('commerce-view');if(!mount)return;
 if(A.auth==='signedin'&&A.route==='checkout'&&C.step!=='fulfillment'&&S.draft.method==='delivery'&&!C.checkout.form)void C.deliveryRoute.check();
 let html='';
 if(A.account?!A.account.allowed():A.auth!=='signedin')html=U.page('Sign in to continue','Your bag and checkout selections will remain here.',U.empty('Your Kitchen406 account','Sign in to access your bag, checkout, and order history.',U.link('sign-in','Sign in',true)+U.link('register','Create account')));
 else if(M.page==='loading'&&A.route==='cart')html=C.checkout.cartLoading();
 else if(M.page==='loading'&&(A.route==='confirmation'||A.route==='orders'&&C.orderId))html=C.orders.detailsLoading();
 else if(M.page==='loading'&&A.route==='orders'&&!C.orderId)html=C.orders.listLoading();
 else if(M.page==='loading'&&A.route==='payment')html=C.orders.paymentLoading();
 else if(M.page==='loading')html=U.page('Loading…','Retrieving your demo details.',`<div class="commerce-skeleton" role="status">Loading…</div>${U.button('page-retry','Return to normal preview')}`);
 else if(M.page==='error'&&A.route==='cart')html=U.empty('We could not load your bag','Your selections are still saved.',U.button('page-retry','Try again')+U.link('shop','Continue shopping'));
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
 const accountPage=A.route==='orders'&&A.account?.allowed();
 mount.classList.toggle('account-view',!!accountPage);
 mount.innerHTML=accountPage?A.phase4.accountLayout(html):html;C.sync();C.addressMap?.mount();
};
document.addEventListener('click',e=>{
 const date=e.target.closest('[data-date]'),method=e.target.closest('[data-method]'),el=e.target.closest('[data-commerce]');
 if((date||method)&&C.change()){C.deliveryRoute.reset();if(date)S.draft.date=date.dataset.date;if(method)S.draft.method=method.dataset.method;C.checkout.message='';C.render();}
 if(!el||el.disabled)return;const action=el.dataset.commerce;
 if(action==='page-retry')M.page='normal';
 C.checkout.action(action,el);C.orders.action(action,el);
});
document.addEventListener('click',async e=>{
 const confirm=e.target.closest('#confirm-order-cancel');if(!confirm)return;
 const o=S.orders.find(o=>o.id===confirm.dataset.id);
 if(A.account.owns(o)){
  if(o.persistedPickup){if(!await A.pickup.payment('cancel',o,confirm))return;}
  else A.checkoutHolds.check(o,'cancel');
 }
 A.closeModal();C.render();
});
})();
