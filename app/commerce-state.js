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
const C=A.commerce={state:S,mock:M,routes:['cart','checkout','payment','confirmation','orders'],step:'',orderId:null};
C.money=n=>new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(n);
C.copy=o=>JSON.parse(JSON.stringify(o));
C.address=()=>S.addresses.find(a=>a.address_id===S.draft.addressId&&a.status==='active');
C.currentOrder=()=>S.orders.find(o=>o.id===(C.orderId||S.activeId));
C.count=(items=S.cart)=>items.reduce((n,i)=>n+i.quantity,0);
C.subtotal=(items=S.cart)=>items.reduce((n,i)=>n+i.price*i.quantity,0);
C.fee=()=>S.draft.method==='pickup'?0:C.address()&&C.deliveryRoute?.eligible()&&S.draft.quote==='ok'?95:null;
C.sync=()=>{A.bag=C.count();const b=A.$('header-cart-badge');b.textContent=A.bag;b.classList.toggle('hidden',!A.bag||A.auth!=='signedin');};
C.locked=()=>S.orders.some(o=>['detected','delayed'].includes(o.payment));
C.change=()=>{if(C.locked()){A.toast('Payment verification is pending. Check its status before changing checkout.');return false;}S.revision++;return true;};
C.line=(id,variant='standard',quantity=1)=>{const p=A.products.find(p=>p.id===id);return {key:id+':'+variant,productId:id,name:p.name,image:p.image,variant:id===1?(variant==='large'?'950g Large':'650g Standard'):p.variant,price:id===1&&variant==='large'?480:Number(p.price.replace(/[^\d.]/g,'')),quantity,max:12,available:p.available};};
C.add=(id,variant,quantity)=>{if(!C.change())return;const line=C.line(id,variant,quantity),old=S.cart.find(i=>i.key===line.key);if(!line.available)return;if(old){if(old.quantity+quantity>old.max){A.toast('Maximum 12 of this item per demo order.');return;}old.quantity+=quantity;}else S.cart.push(line);C.sync();A.toast('Added to your bag.');};
C.cartValid=()=>S.cart.length>0&&S.cart.every(i=>i.available&&i.quantity>0&&i.quantity<=i.max)&&M.stock==='normal';
C.dateValid=()=>/^2026-(10|11|12)-\d{2}$/.test(S.draft.date)&&S.draft.date>'2026-10-14'&&C.dateReason(S.draft.date)==='';
C.dateReason=value=>{const d=new Date(value+'T12:00:00');if(value<='2026-10-14')return 'Passed';if(M.dates==='no-dates')return 'No dates';if(M.dates==='stock')return 'No stock';if(M.dates==='cutoff')return 'Cutoff';if(M.dates==='blocked'&&d.getDate()===16)return 'Blocked';if(d.getDay()===0||(M.dates==='fully-booked'&&d.getDay()===6))return 'Booked';return '';};
C.fulfillmentReady=()=>C.cartValid()&&['pickup','delivery'].includes(S.draft.method)&&C.dateValid()&&M.calendar==='normal'&&M.validation==='normal';
C.coordinatesValid=a=>!!a&&Number.isFinite(a.latitude)&&Math.abs(a.latitude)<=90&&Number.isFinite(a.longitude)&&Math.abs(a.longitude)<=180;
C.addressValid=a=>!!a&&['label','add_line_1','city','postal_code'].every(k=>typeof a[k]==='string'&&!!a[k].trim())&&C.coordinatesValid(a);
C.ready=()=>C.fulfillmentReady()&&(S.draft.method==='pickup'||C.addressValid(C.address())&&C.deliveryRoute?.eligible()&&S.draft.quote==='ok');
C.unpaid=o=>o&&['pending-payment','payment-failed'].includes(o.status)&&!['detected','delayed'].includes(o.payment);
C.setStatus=(o,status)=>{if(!o)return;o.status=status;o.activity.unshift({text:status.replaceAll('-',' '),at:new Date().toLocaleString()});};
C.createOrder=()=>{
 if(C.locked()||!C.ready()||M.review!=='normal'||M.price==='updated')return null;
 let o=S.orders.find(o=>o.id===S.activeId);
 if(o&&o.revision===S.revision&&C.unpaid(o)&&o.payment!=='revalidation')return o;
 if(o&&C.unpaid(o))C.setStatus(o,'cancelled');
 const id='K406-'+(++S.serial);
 o={id,type:'standard',items:C.copy(S.cart),fulfillment:C.copy(S.draft),address:C.copy(C.address()||{}),fee:C.fee(),total:C.subtotal()+C.fee(),status:'pending-payment',payment:'waiting',deadline:Date.now()+600000,created:Date.now(),revision:S.revision,reference:'DEMO-QR-'+S.serial,attempts:[],activity:[{text:'Demo order placed',at:new Date().toLocaleString()}]};
 o.attempts.push({state:'waiting',at:new Date().toLocaleString()});S.orders.unshift(o);S.activeId=id;return o;
};
C.setPayment=(o,value)=>{
 if(!o||o.status==='cancelled')return;
 if(o.paid)return;
 o.payment=value;M.payment=value;
 if(o.attempts.length)o.attempts.at(-1).state=value;
 if(value==='confirmed'){
  C.setStatus(o,'confirmed');
  if(!o.paid){o.paid=true;o.paidAt=new Date().toLocaleString();if(!o.fixture&&!o.cartSettled){o.items.forEach(item=>{const live=S.cart.find(i=>i.key===item.key);if(live)live.quantity=Math.max(0,live.quantity-item.quantity);});S.cart=S.cart.filter(i=>i.quantity>0);o.cartSettled=true;S.revision++;C.sync();}}
 }else if(['failed','expired'].includes(value))C.setStatus(o,'payment-failed');
 else if(value==='revalidation')C.setStatus(o,'payment-failed');
 else C.setStatus(o,'pending-payment');
};
C.reset=()=>{C.deliveryRoute?.reset();S.cart=[];S.addresses=addresses();S.draft=draft();S.orders=[];S.activeId=null;S.removed=null;S.revision++;C.orderId=null;Object.keys(M).forEach(k=>M[k]=k==='payment'?'waiting':k==='courier'?'prebooking':k==='dataset'?'all':'normal');C.sync();};
C.sampleCart=()=>{if(!C.change())return;S.cart=[C.line(1,'standard',2),C.line(2,'standard',1)];M.page='normal';M.stock='normal';C.sync();};
C.sampleOrders=()=>{
 if(S.orders.some(o=>o.fixture))return;
 ['preparing','pending-payment','completed','payment-resolution','confirmed','completed','ready-pickup'].forEach((status,i)=>{
 const items=[C.line(i===6?2:i%2?2:1,'standard',i%2?1:2)],pickup=i===1||i===6;
 if(i===4)items[0]={key:'cake:demo',productId:0,name:'Minimalist celebration cake',variant:'6-inch Earl Grey · Sample custom order',price:2450,quantity:1,image:'assets/celebration-cake.jpg',available:true};
 S.orders.push({id:'K406-DEMO-'+(28+i),fixture:true,type:i===4?'cake':i===6?'subscription':'standard',items,fulfillment:{method:pickup?'pickup':'delivery',date:'2026-10-16'},address:C.copy(S.addresses[0]||addresses()[0]),fee:pickup?0:95,total:C.subtotal(items)+(pickup?0:95),status,payment:status==='pending-payment'?'waiting':'confirmed',paid:status!=='pending-payment',created:new Date(2026,9,10-i).getTime(),deadline:Date.now()+600000,reference:'DEMO-QR-'+i,attempts:[{state:status==='pending-payment'?'waiting':'confirmed',at:'Demo history'}],activity:[{text:'Sample order '+status,at:'October 2026 fixture'}]});
 });
};
})();
