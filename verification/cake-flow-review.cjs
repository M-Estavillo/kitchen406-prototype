const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const listeners={},root={innerHTML:'',contains:()=>false};
const ctx={K406:{auth:'signedin',escape:v=>String(v??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;'),toast(){},$(){return root;},inspector(){}},Date,Intl,URL,setTimeout,clearTimeout,location:{hash:''},document:{activeElement:null,addEventListener(type,fn){(listeners[type]||=[]).push(fn);}}};ctx.window=ctx;vm.createContext(ctx);
for(const file of ['products','product-data','scheduling','commerce-state','subscription-state','account-state','address-state','notification-state','cake-data','cake-state','ui','commerce-ui','phase4-ui','cake-builder'])vm.runInContext(fs.readFileSync('app/'+file+'.js','utf8'),ctx);
const A=ctx.K406,K=A.cakes,B=K.builder,V=A.phase4,d=K.state.draft;
A.commerce.addressMap={mount(){}};A.route='custom-cakes';V.parts=['custom-cakes','request','options'];
let checks=0;function test(label,fn){fn();checks++;console.log('PASS '+label);}
function click(action,extra={}){const el={dataset:{p4:action,...extra},disabled:false};for(const fn of listeners.click)fn({target:{closest:()=>el}});}
test('start opens fulfillment and blocks options until a date and method are chosen',()=>{click('cake-start');assert.equal(ctx.location.hash,'#/custom-cakes/request/details');assert.match(B.view('details'),/Requested date/);assert.doesNotMatch(B.view('details'),/Complete the earlier step/);assert.match(B.view('options'),/Complete the earlier step/);});
Object.assign(d,{selections:{shape:'round',flavor:'chocolate',size:'eight',color:'cream',icing:'buttercream'}});
test('navigation follows fulfillment, options, references and review',()=>{assert.match(B.details(),/data-step="options"/);assert.match(B.options(),/data-step="references"/);assert.match(B.options(),/Back to fulfillment/);assert.match(B.references(),/Back to cake options/);assert.match(B.view('references'),/Complete the earlier step/);});
test('fulfillment screen omits summary, contact and owner delivery panels',()=>{const html=B.details();for(const title of ['Your cake request','Contact for this request','Owner-managed delivery','Selecting a date'])assert(!html.includes(title));assert.doesNotMatch(html,/cake-window|Preferred fulfillment window/);assert(html.indexOf('Dates respect')<html.indexOf('calendar-heading'));});
test('method selection changes address requirements while preserving selections',()=>{V.parts[2]='details';click('cake-method',{value:'delivery'});assert.match(root.innerHTML,/Delivery address/);click('cake-method',{value:'pickup'});assert.doesNotMatch(root.innerHTML,/name="cake-address"/);assert.match(root.innerHTML,/Bakery pickup/);assert.equal(d.selections.shape,'round');});
Object.assign(d,{date:'2026-10-24'});
test('valid fulfillment unlocks options and unavailable dates block customization',()=>{assert.match(B.view('options'),/Cake shape/);K.mock.availability='capacity';assert.match(B.view('options'),/Complete the earlier step/);K.mock.availability='normal';});
test('availability feedback stays inside Requested date and blocks continuation',()=>{for(const mode of ['error','capacity','blocked']){K.mock.availability=mode;const html=B.details(),start=html.indexOf('Requested date'),end=html.indexOf('</section>',start);assert(html.slice(start,end).includes(K.availabilityReason()));assert.match(html,/data-p4="cake-next" disabled/);}K.mock.availability='normal';assert.doesNotMatch(B.details(),/data-p4="cake-next" disabled/);});
test('availability loading uses a skeleton instead of an interactive calendar',()=>{K.mock.availability='loading';const html=B.details();assert.match(html,/aria-label="Checking cake availability"/);assert.match(html,/cart-loading-block/);assert.doesNotMatch(html,/data-p4="cake-date"/);K.mock.availability='normal';});
test('page empty hides form without discarding the draft',()=>{K.mock.page='empty';V.render();assert.match(root.innerHTML,/No cake request to display/);assert.doesNotMatch(root.innerHTML,/cake-window|cake-date|cake-option/);assert.equal(d.date,'2026-10-24');click('retry-page');assert.match(root.innerHTML,/Requested date/);});
test('page loading shows skeletons and no editable fields',()=>{K.mock.page='loading';V.render();assert.match(root.innerHTML,/cart-loading-block/);assert.doesNotMatch(root.innerHTML,/<select|data-p4="cake-date"/);K.mock.page='normal';});
test('pickup review preserves selected fulfillment and omits delivery address',()=>{d.images[0]={url:'assets/custom-cake.png',name:'Cake',status:'ready',size:100};assert.match(B.view('review'),/Bakery pickup/);assert.doesNotMatch(B.view('review'),/A.S. Fortuna/);});
test('capacity disables the selected week and rejects stale clicks while another week stays available',()=>{
 d.date='2026-10-24';K.mock.availability='capacity';
 const html=B.calendar();
 for(const day of ['19','20','21','22','23','24','25'])assert.match(html,new RegExp('data-value="2026-10-'+day+'" disabled'));
 assert.match(html,/data-value="2026-10-26"  aria-pressed/);
 click('cake-date',{value:'2026-10-23'});assert.equal(d.date,'2026-10-24');
 click('cake-date',{value:'2026-10-26'});assert.equal(d.date,'2026-10-26');assert.equal(K.fulfillmentReason(),'');
 assert.equal(K.requestDateReason('2026-10-24'),'Weekly capacity reached');
 K.mock.availability='normal';B.calendar();
});
test('blocked disables its date and permits a different available date',()=>{
 d.date='2026-10-24';K.mock.availability='blocked';const html=B.calendar();
 assert.match(html,/data-value="2026-10-24" disabled/);assert.match(html,/data-value="2026-10-25"  aria-pressed/);
 d.date='2026-10-25';click('cake-date',{value:'2026-10-24'});assert.equal(d.date,'2026-10-25');assert.equal(K.fulfillmentReason(),'');
 K.mock.availability='normal';assert.equal(K.requestDateReason('2026-10-24'),'');
});
test('capacity without a selection disables the next eligible week consistently across months',()=>{
 d.date='';K.mock.availability='capacity';const target=K.availabilityTarget();assert.equal(K.requestDateReason(target),'Weekly capacity reached');
 const originalMonth=K.month;K.month++;B.calendar();assert.equal(K.availabilityTarget(),target);K.month=originalMonth;
 K.mock.availability='normal';K.availabilityTarget();
});
test('fulfillment information sits under method while delivery addresses stay under date',()=>{
 d.method='pickup';let html=B.details(),aside=html.indexOf('<aside');assert(html.indexOf('Bakery pickup')>aside);assert(html.indexOf('Bakery pickup')>html.indexOf('Fulfillment method'));assert.doesNotMatch(html,/cake-address-choice/);
 d.method='delivery';html=B.details();aside=html.indexOf('<aside');assert(html.indexOf('Delivery address')<aside);assert(html.indexOf('Delivery address')>html.indexOf('Requested date'));assert(html.indexOf('Delivery area')>aside);assert(html.indexOf('Delivery area')>html.indexOf('Fulfillment method'));assert.match(html,/Metro Cebu/);for(const city of A.cakeData.config.cities)assert(html.includes(city));
});
test('reference validation mock immediately blocks review and renders plain error below summary',()=>{
 K.mock.upload='error';const html=B.references();assert.match(html,/<p class="cake-reference-error" role="alert">This image could not be read/);assert(html.indexOf('cake-reference-error')>html.indexOf('Your cake request'));assert.match(html,/data-p4="cake-next" disabled/);K.mock.upload='normal';assert.equal(K.referencesReason(),'');
});
test('one upload area accepts three references and removing the first keeps remaining photos valid',()=>{
 const photo={url:'assets/custom-cake.png',name:'Cake',status:'ready',size:100};d.images=[photo,{...photo}, {...photo}];
 let html=B.references();assert.equal((html.match(/class="cake-reference-upload/g)||[]).length,1);assert.match(html,/data-image-slot="-1" disabled/);assert.equal((html.match(/data-p4="cake-image-remove"/g)||[]).length,3);assert.doesNotMatch(html,/One primary photo|of 3 added/);
 click('cake-image-remove',{slot:'0'});assert.equal(K.referencesReason(),'');assert.match(B.references(),/data-image-slot="0"/);
 d.images=[null,null,null];assert.equal(K.referencesReason(),'Upload a reference image.');assert.match(B.references(),/<p class="cake-reference-error" role="alert">Upload a reference image./);
});
test('checking images block review and navigation preserves images and long notes',()=>{
 d.images[0]={url:'assets/custom-cake.png',name:'Cake',status:'loading',size:100};assert.match(B.references(),/Checking image/);assert.match(K.referencesReason(),/Wait for image validation/);d.images[0].status='ready';d.notes='x'.repeat(600);click('cake-next',{step:'review'});assert.equal(d.notes.length,600);assert.equal(d.images[0].status,'ready');assert.match(B.references(),/rows="7"/);assert.equal(K.referencesReason(),'');
});
vm.runInContext(fs.readFileSync('app/cake-requests.js','utf8'),ctx);
test('request loading retains the account sidebar beside skeleton content',()=>{
 A.route='cake-requests';V.parts=['cake-requests'];K.mock.page='loading';V.render();assert.match(root.innerHTML,/class="account-nav"/);assert.match(root.innerHTML,/Loading request details/);K.mock.page='normal';
});
test('request detail places an icon back link above plain selected options with prices',()=>{
 const snapshot={options:K.selected(),addons:[],images:[],notes:'',method:'pickup',date:d.date,contact:{name:'Customer',mobile_number:'09123456789'}};
 const r={id:'test-request',status:'pending_review',created_at:Date.now(),snapshot,estimated_price:100000};const html=K.requestDetail(r);
 assert.match(html,/Selected Cake Options/);assert.match(html,/cake-selected-options/);assert.doesNotMatch(html,/cake-specifications|Your submitted configuration|order-badge/);assert(html.indexOf('cake-back-link')<html.indexOf('Selected Cake Options'));assert.match(html,/<small>/);
 assert.match(K.requestDetail(null),/Request not found/);
});
test('quotation places validity in final pricing and actions below adjustments for every status',()=>{
 const snapshot={options:K.selected(),addons:[],images:[],notes:'',method:'pickup',date:d.date,contact:{name:'Customer',mobile_number:'09123456789'}};
 const r={id:'test-request',estimated_price:100000},q={id:'test-quote',requestId:r.id,version:1,snapshot,expires_at:Date.now()+86400000,options_total:100000,addons_total:0,complexity_charge:0,delivery_fee:0,total:100000};
 const original=K.quoteReason;K.quoteReason=quote=>quote.status==='issued'?'':'Unavailable';
 for(const status of ['issued','accepted','superseded','rejected','expired']){q.status=status;const html=K.quotationView(r,q);assert.doesNotMatch(html,/Validity &amp; confirmation|Validity & confirmation|Bakery review|cake-specifications/);assert(html.indexOf('Total payable')<html.indexOf('Valid until'));assert(html.indexOf('Valid until')<html.indexOf('Need adjustments?'));assert(html.indexOf('Need adjustments?')<html.indexOf('cake-quotation-actions'));if(status==='issued')assert(html.indexOf('Need adjustments?')<html.indexOf('data-p4="quote-accept"'));}
 K.quoteReason=original;assert.match(K.quotationView(r,null),/Quotation not found/);
});
ctx.setInterval=()=>0;
vm.runInContext(fs.readFileSync('app/orders.js','utf8'),ctx);
test('cake order header uses icon controls and confirmation omits accepted quotation link',()=>{
 const C=A.commerce,previous=C.currentOrder;
 const order={id:'CAKE-TEST',quotationId:'QUOTE-TEST',requestId:'REQUEST-TEST',type:'cake',paid:true,payment:'confirmed',status:'confirmed',created:Date.now(),fulfillment:{method:'pickup',date:d.date},items:[],activity:[],attempts:[],reference:'REF-TEST',subtotal:100000,total:100000,fee:0};
 C.currentOrder=()=>order;
 const html=C.orders.details();assert.match(html,/cake-order-meta/);assert.match(html,/data-commerce="copy-order" aria-label="Copy reference"/);assert.match(html,/content_copy/);assert.match(html,/cake-order-quotation/);assert.doesNotMatch(html.split('Order progress')[0],/Paid|class="btn account-back"/);
 assert.doesNotMatch(C.orders.details(true),/View accepted quotation/);C.currentOrder=previous;
});
for(const name of ['account','notifications'])vm.runInContext(fs.readFileSync('app/'+name+'.js','utf8'),ctx);
test('profile and notification loading preserve navigation and render skeletons',()=>{
 A.route='account';A.account.mock.page='loading';for(const page of ['profile','notifications']){V.parts=['account',page];V.render();assert.match(root.innerHTML,/account-nav/);assert.match(root.innerHTML,/cart-loading-block/);assert.match(root.innerHTML,/role="status"/);}A.account.mock.page='normal';
});
test('notifications render compact rows with delivery feedback and destination links',()=>{
 const N=A.notifications,original=N.list;N.filter='all';N.list=()=>[{title:'Cake update',message:'Your quote is ready',category:'cakes',created_at:Date.now(),channels:{email:'failed'},path:'cake-requests/test'}];
 const html=N.view();assert.match(html,/notification-row/);assert.match(html,/notification-delivery-warning/);assert.match(html,/href="#\/cake-requests\/test"/);assert.doesNotMatch(html,/commerce-card-heading/);N.list=original;
});
console.log('COMPLETE '+checks+' cake flow rendering checks.');
