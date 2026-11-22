/* Shared, in-memory prototype data. Never submits payments or personal details. */
(() => {
const A=K406;
// Sample coordinates are preview fixtures, not verified delivery destinations.
const addresses=()=>[
 {address_id:'home',customer_id:'preview-customer',label:'Home',add_line_1:'A.S. Fortuna St., Banilad',add_line_2:'Unit 402, Oakridge Residences',city:'Mandaue City',postal_code:'6014',landmark:'Please leave with condo lobby reception if not answering.',latitude:10.3408,longitude:123.9224,is_default:true,created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z',status:'active'},
 {address_id:'work',customer_id:'preview-customer',label:'Work',add_line_1:'Cebu IT Park, Lahug',add_line_2:'Room 3B, The Company CEBU',city:'Cebu City',postal_code:'6000',landmark:'Front desk accepts food parcels 9am to 6pm.',latitude:10.3297,longitude:123.9063,is_default:false,created_at:'2026-10-01T00:00:00Z',updated_at:'2026-10-01T00:00:00Z',status:'active'}
];
const draft=()=>({method:'',date:'',addressId:'home',service:'ok',quote:'ok'});
const S={cart:[],addresses:addresses(),draft:draft(),orders:[],activeId:null,revision:0,serial:1000,removed:null};
const M={page:'normal',stock:'normal',calendar:'normal',dates:'normal',validation:'normal',review:'normal',price:'normal',payment:'waiting',courier:'prebooking',dataset:'all'};
const C=A.commerce={paymentSessionMs:30*60*1000,state:S,mock:M,routes:['cart','checkout','payment','confirmation','orders'],step:'',orderId:null};
C.checkoutHoldMs=32*60*1000;
C.beginAttempt=(purchase,at=Date.now())=>{
 purchase.deadline=at+C.paymentSessionMs;
 purchase.holdDeadline=at+C.checkoutHoldMs;
 purchase.attempts.push({state:'waiting',at:new Date(at).toLocaleString(),
  reference:purchase.id+'-PAY-'+(purchase.attempts.length+1),amount:purchase.total??purchase.snapshot?.total});
};
C.holdUntil=purchase=>purchase.holdDeadline??purchase.deadline;
C.qrOpen=purchase=>purchase.payment==='waiting'&&Date.now()<purchase.deadline;
C.confirmationWindow=purchase=>purchase.payment==='waiting'&&!C.qrOpen(purchase)&&Date.now()<C.holdUntil(purchase);
C.paymentViewState=purchase=>C.confirmationWindow(purchase)?'grace':purchase.payment;
C.money=n=>new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(n);
C.copy=o=>JSON.parse(JSON.stringify(o));
C.paymentTime=deadline=>{
 const seconds=Math.max(0,Math.ceil((deadline-Date.now())/1000));
 return String(Math.floor(seconds/60)).padStart(2,'0')+':'+String(seconds%60).padStart(2,'0');
};
C.setPricePreview=value=>{
 if(!C.change())return;
 S.cart.forEach(item=>{if(item.previewOriginalPrice!==undefined){item.price=item.previewOriginalPrice;delete item.previewOriginalPrice;}});
 if(value==='updated'&&S.cart[0]){const item=S.cart[0];item.previewOriginalPrice=item.price;item.price+=20;}
 M.price=value;
};
C.priceNotice=()=>{
 const changed=S.cart.filter(item=>item.previewOriginalPrice!==undefined);
 if(!changed.length)return '';
 const difference=changed.reduce((total,item)=>total+(item.price-item.previewOriginalPrice)*item.quantity,0);
 return 'Prices updated. '+changed.map(item=>item.name+': '+C.money(item.previewOriginalPrice)+' to '+C.money(item.price)+' per unit.').join(' ')+' Your order subtotal '+(difference<0?'decreased':'increased')+' by '+C.money(Math.abs(difference))+'. The updated amount is included in your total.';
};
C.refreshCheckoutPrices=()=>{
 if(C.locked()||M.price==='updated')return false;
 const changes=S.cart.flatMap(item=>{
  const price=A.variant(item.productId,item.key.split(':')[1])?.price;
  return Number.isFinite(price)&&price!==item.price?[{item,price,previous:item.price}]:[];
 });
 if(!changes.length||!C.change())return false;
 changes.forEach(({item,price})=>{item.price=price;});
 S.draft.priceMessage='Prices updated. '+changes.map(({item,price,previous})=>item.name+': '+C.money(previous)+' to '+C.money(price)+' per unit.').join(' ')+' Review the updated total before proceeding.';
 return true;
};
C.address=()=>S.addresses.find(a=>a.address_id===S.draft.addressId&&a.status==='active');
C.currentOrder=()=>S.orders.find(o=>o.id===(C.orderId||S.activeId));
C.count=(items=S.cart)=>items.reduce((n,i)=>n+i.quantity,0);
C.subtotal=(items=S.cart)=>items.reduce((n,i)=>n+(i.productAmount??i.price*i.quantity),0);
C.fee=()=>S.draft.method==='pickup'?0:C.address()&&C.deliveryRoute?.eligible()&&S.draft.quote==='ok'?A.quoteFee():null;
C.sync=()=>{A.bag=new Set(S.cart.map(item=>item.productId)).size;const b=A.$('header-cart-badge');b.textContent=A.bag;b.classList.toggle('hidden',!A.bag||A.auth!=='signedin');};
C.locked=()=>S.orders.some(o=>['detected','delayed'].includes(o.payment)||C.confirmationWindow(o));
C.change=()=>{if(C.locked()){A.toast('Payment verification is pending. Check its status before changing checkout.');return false;}S.revision++;return true;};
C.line=(id,variant='standard',quantity=1)=>{const p=A.products.find(p=>p.id===id);return {key:id+':'+variant,productId:id,name:p.name,image:p.image,variant:A.variant(id,variant)?.label||p.variant,price:A.variant(id,variant)?.price||0,quantity,max:10,available:p.available};};
C.lineIssue=(item,quantity=item.quantity,exclude=S.activeId)=>{
 const variant=item.key.split(':')[1],product=A.products.find(p=>p.id===item.productId);
 if(item.previewUnavailable||!A.variant(item.productId,variant)||!(A.inventory?.productAvailable?.(item.productId,variant,exclude)??product?.available))return 'Currently unavailable. Remove this item to continue.';
 if(!Number.isInteger(quantity)||quantity<1)return 'Choose a positive whole quantity or remove this item.';
 if(quantity>item.max)return 'Reduce quantity to '+item.max+' or fewer in this demo.';
 return '';
};
C.materialIssue=items=>{
 const inventory=A.inventory;
 return inventory?.materials?inventory.reason(inventory.materials({type:'standard',items}),S.activeId):'';
};
C.saveCartLine=(line,quantity,index=S.cart.length,replace=false)=>{
 const error=C.lineIssue(line,quantity);
 if(error){A.toast(error);return false;}
 const items=S.cart.slice();
 items.splice(index,replace?1:0,{...line,quantity});
 if(!replace||quantity>S.cart[index].quantity){
  const shortage=C.materialIssue(items);
  if(shortage){A.toast(shortage);return false;}
 }
 if(!C.change())return false;
 S.cart=items;
 return true;
};
C.add=(id,variant,quantity)=>{
 if(!A.variant(id,variant)){A.toast('Choose an available product option.');return;}
 if(!Number.isInteger(quantity)||quantity<1){A.toast('Choose a positive whole quantity.');return;}
 const line=C.line(id,variant,quantity),index=S.cart.findIndex(item=>item.key===line.key);
 const old=S.cart[index];
 if(!C.saveCartLine(old||line,(old?.quantity??0)+quantity,old?index:S.cart.length,!!old))return;
 C.sync();A.toast('Added to your bag.');
};
C.cartIssue=()=>{
 if(!S.cart.length)return 'Add an item to continue.';
 if(S.cart.some(item=>C.lineIssue(item)))return 'Review the highlighted items before continuing.';
 return C.materialIssue(S.cart);
};
C.cartValid=()=>!C.cartIssue();
C.dateValid=()=>A.schedule.valid(S.draft.date)&&C.dateReason(S.draft.date)==='';
C.dateReason=value=>A.schedule.standard(value,S.cart.map(item=>({...item,available:!C.lineIssue(item)})),M.dates);
C.fulfillmentReady=()=>C.cartValid()&&['pickup','delivery'].includes(S.draft.method)&&C.dateValid()&&M.calendar==='normal'&&M.validation==='normal';
C.coordinatesValid=a=>!!a&&Number.isFinite(a.latitude)&&Math.abs(a.latitude)<=90&&Number.isFinite(a.longitude)&&Math.abs(a.longitude)<=180;
C.addressValid=a=>!!a&&['label','add_line_1','city','postal_code'].every(k=>typeof a[k]==='string'&&!!a[k].trim());
C.ready=()=>C.fulfillmentReady()&&(S.draft.method==='pickup'||C.addressValid(C.address())&&C.deliveryRoute?.eligible()&&S.draft.quote==='ok');
C.unpaid=o=>o&&!o.paid&&!o.reconciliationRequired&&(['pending-payment','payment-failed'].includes(o.status)||o.checkoutClosed&&['failed','expired'].includes(o.payment))&&!['detected','delayed'].includes(o.payment);
C.setStatus=(o,status)=>{if(!o)return;o.status=status;o.activity.unshift({text:status.replaceAll('-',' '),at:new Date().toLocaleString()});};
C.createOrder=()=>{
 if(C.locked()||!C.ready()||M.review!=='normal')return null;
 let o=S.orders.find(o=>o.id===S.activeId);
 if(o?.reconciliationRequired){C.checkout.message=o.paymentCheckMessage;return null;}
 if(o&&o.revision===S.revision&&o.fee===C.fee()&&o.payment==='waiting'&&!o.paid&&o.status!=='cancelled'&&C.holdUntil(o)>Date.now())return o;
 const previous=C.unpaid(o)?o:null;
 const id='K406-'+(++S.serial);
 o={id,type:'standard',items:C.copy(S.cart),fulfillment:C.copy(S.draft),address:C.copy(C.address()||{}),fee:C.fee(),total:C.subtotal()+C.fee(),status:'pending-payment',payment:'waiting',deadline:Date.now()+C.paymentSessionMs,created:Date.now(),revision:S.revision,reference:'DEMO-QR-'+S.serial,attempts:[],activity:[{text:'Demo order placed',at:new Date().toLocaleString()}]};
 C.beginAttempt(o,o.created);
 const failure=C.reserveStandard?.(o,previous?.id);
 if(failure){C.checkout.message=failure;return null;}
 if(previous)C.setStatus(previous,'cancelled');
 S.orders.unshift(o);S.activeId=id;return o;
};
C.setPayment=(o,value)=>{
 if(o?.quotationId){A.cakes.pay(o,value);return;}
 if(!o||o.status==='cancelled'&&value!=='confirmed')return;
 if(o.paid)return;
 o.payment=value;M.payment=value;
 if(o.attempts.length)o.attempts.at(-1).state=value;
 if(value==='confirmed'){
  C.setStatus(o,'confirmed');
  o.paid=true;o.paidAt=new Date().toLocaleString();
  const cartState=o.customer_id&&A.account?.id()!==o.customer_id?A.account?.buckets.get(o.customer_id)?.commerce:S;
  if(cartState&&!o.fixture&&!o.cartSettled){
   o.items.forEach(item=>{const live=cartState.cart.find(i=>i.key===item.key);if(live)live.quantity=Math.max(0,live.quantity-item.quantity);});
   cartState.cart=cartState.cart.filter(i=>i.quantity>0);o.cartSettled=true;cartState.revision++;
   if(cartState===S)C.sync();
  }
 }else if(['failed','expired'].includes(value))C.setStatus(o,'payment-failed');
 else if(value==='revalidation')C.setStatus(o,'payment-failed');
 else C.setStatus(o,'pending-payment');
};
C.reset=()=>{A.subscriptions?.reset();C.deliveryRoute?.reset();S.cart=[];S.addresses=addresses();S.draft=draft();S.orders=[];S.activeId=null;S.removed=null;S.revision++;C.orderId=null;Object.keys(M).forEach(k=>M[k]=k==='payment'?'waiting':k==='courier'?'prebooking':k==='dataset'?'all':'normal');C.sync();};
C.sampleCart=()=>{if(!C.change())return;S.cart=[C.line(1,'standard',2),C.line(2,'standard',1)];M.page='normal';M.stock='normal';C.sync();};
C.sampleOrders=()=>{
 const role=A.staff.role;
 try{A.staff.role='admin';A.owner.seed();}finally{A.staff.role=role;}

};
})();
