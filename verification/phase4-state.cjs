const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let checks=0;
function setup(){
 const ctx={K406:{auth:'signedin',toast(){},$(){return {classList:{toggle(){}}};}},Date,Intl,URL,TextEncoder,crypto:require('node:crypto').webcrypto,setTimeout,clearTimeout};ctx.window=ctx;vm.createContext(ctx);
 for(const file of ['products','product-data','scheduling','commerce-state','subscription-state','account-state','address-state','notification-state','cake-data','cake-state'])vm.runInContext(fs.readFileSync('app/'+file+'.js','utf8'),ctx);
 const A=ctx.K406,K=A.cakes,P=A.account,C=A.commerce,R=A.addresses,N=A.notifications;
 C.checkout={};A.subscriptions.deliveryRoute={reset(){}};
 const fill=(date='2026-10-24')=>Object.assign(K.state.draft,{method:'delivery',date,addressId:'home',selections:{shape:'round',flavor:'chocolate',size:'eight',color:'cream',icing:'buttercream'},addons:{decoration:2},images:[{url:'assets/celebration-cake.jpg',name:'reference.jpg',size:100,type:'image/jpeg',status:'ready'},null,null],notes:'Test design',reviewedPrice:130000});
 const quote=(date,revised=false)=>{K.resetDraft();fill(date);const r=K.submit();assert(r,K.message);return {r,q:K.issue(r,revised)};};
 return {A,K,P,C,R,N,fill,quote,ctx};
}
async function test(label,fn){await fn();checks++;console.log('PASS '+label);}
(async()=>{
await test('empty and partial selections never become a complete estimate',()=>{const {K}=setup();assert.equal(K.estimate().total,0);assert(!K.estimate().complete);K.state.draft.addons.decoration=2;assert.equal(K.estimate().total,20000);assert(K.optionsReason());});
await test('five options and add-ons calculate the exact supplied estimate',()=>{const {K,fill}=setup();fill();assert.equal(K.estimate().total,130000);assert.equal(K.optionsReason(),'');K.state.draft.selections.icing='ganache';assert(K.optionsReason());});
await test('reference images are optional and pending images, oversized notes, and invalid add-ons block',()=>{const {K,fill}=setup();fill();K.state.draft.images[0]=null;assert.equal(K.referencesReason(),'');fill();K.state.draft.images[0].status='loading';assert(K.referencesReason());fill();K.state.draft.notes='a'.repeat(601);assert(K.referencesReason());fill();K.state.draft.addons.decoration=1.5;assert(K.optionsReason());});
await test('submission snapshots data and is idempotent without reserving capacity',()=>{const {K,C,fill}=setup();fill();const r=K.submit();assert.equal(K.submit().id,r.id);assert.equal(K.state.requests.length,1);assert.equal(K.holds.length,0);C.state.addresses[0].city='Changed';K.state.draft.notes='Changed';assert.equal(r.snapshot.address.city,'Mandaue City');assert.equal(r.snapshot.notes,'Test design');});
await test('stale estimate and changed availability require review',()=>{const {K,A,fill}=setup();fill();A.cakeData.options.find(o=>o.id==='round').price+=100;assert.equal(K.submit(),null);assert(K.message.includes('estimate'));K.state.draft.reviewedPrice=K.estimate().total;A.schedule.config.blocked=['2026-10-24'];assert.equal(K.submit(),null);});
await test('quotation history preserves independent totals and updated designs',()=>{const {K,quote}=setup();const {r,q}=quote();const v2=K.issue(r,true);assert.equal(q.total,200000);assert.equal(v2.total,220000);assert.equal(q.status,'superseded');assert.equal(q.snapshot.options.find(o=>o.type==='color').name,'Cream');assert.equal(v2.snapshot.options.find(o=>o.type==='color').name,'Sage green & soft cream');assert.equal(K.accept(q),null);});
await test('acceptance creates one unpaid quotation item and one active hold',()=>{const {K,C,quote}=setup();const {r,q}=quote();const o=K.accept(q);assert(o);assert.equal(r.status,'accepted');assert.equal(o.status,'pending-payment');assert(!o.paid);assert.equal(K.accept(q).id,o.id);assert.equal(C.state.orders.length,1);assert.equal(K.activeHolds().length,1);assert.equal(o.items[0].quotation_id,q.id);assert.equal(o.total,C.subtotal(o.items)+o.fee);});
await test('two weekly cakes on distinct dates use a separate capacity pool',()=>{const {K,A,quote}=setup();A.schedule.reserve('subscription',4,10,['2026-10-23'],true);K.accept(quote('2026-10-24').q);assert(K.dateReason('2026-10-24'));K.accept(quote('2026-10-23').q);assert.equal(K.dateReason('2026-10-25'),'Weekly capacity reached');assert.equal(K.dateReason('2026-10-26'),'');});
await test('seven calendar days applies at submission and timely requests remain eligible at owner review',()=>{
 const {K,A,fill,ctx}=setup();A.schedule.config.clock='2026-10-17T23:59:59+08:00';
 assert.equal(K.requestDateReason('2026-10-24'),'');fill('2026-10-24');K.state.draft.images=[null,null,null];
 const r=K.submit();assert(r,K.message);assert.equal(r.submitted_on,'2026-10-17');
 A.schedule.config.clock='2026-10-18T00:00:00+08:00';
 assert.match(K.requestDateReason('2026-10-24'),/seven calendar days/);
 A.session={ownerAllowed:()=>true,actor:()=>({id:'owner'})};
 vm.runInContext(fs.readFileSync('app/owner-cake-state.js','utf8'),ctx);
 assert.equal(A.ownerCakes.issue(r.id,{date:'2026-10-24',method:'pickup',complexity:0,fee:0,expiry:Date.now()+3600000,notes:''},0,'timely-request'),'');
 assert(K.accept(K.versions(r)[0]),K.message);
 assert(K.dateReason('2026-10-18'));
});
await test('full payment confirms once without settling the standard bag',()=>{const {K,C,N,quote}=setup();C.state.cart=[C.line(1,'standard',2)];const o=K.accept(quote().q);K.pay(o,'confirmed');K.pay(o,'confirmed');assert.equal(o.status,'confirmed');assert.equal(C.state.cart[0].quantity,2);assert.equal(K.holds[0].status,'confirmed');assert.equal(N.events.filter(e=>e.event_key.startsWith('cake-paid')).length,1);});
await test('pending verification prohibits cancellation, retries, and owner revisions',()=>{const {K,quote}=setup();const {q,r}=quote(),o=K.accept(q);K.pay(o,'detected');assert(!K.cancel(o));assert(!K.retry(o));assert.equal(K.issue(r,true),null);});
await test('failed payment releases holds and retry creates a distinct attempt',()=>{const {K,quote}=setup();const o=K.accept(quote().q),old=o.holdId;K.pay(o,'failed');assert.equal(K.activeHolds().length,0);assert(K.retry(o));assert.notEqual(o.holdId,old);assert.equal(o.attempts.length,2);});
await test('accepted agreement survives the offer deadline and uses separate checkout time',()=>{
 const {K,C,quote}=setup();const {q}=quote();q.expires_at=Date.now()+2000;
 assert(K.recordAcceptance(q));q.expires_at=Date.now()-1;assert(!K.expire());
 const o=K.checkout(q);assert(o);assert(o.deadline>Date.now()+C.paymentSessionMs-1000);
 K.pay(o,'expired');assert(K.retry(o));assert.equal(q.status,'accepted');
});
await test('an unanswered offer expires and revisions start a fresh 48-hour timer',()=>{
 const {K,A,fill,ctx}=setup();fill();const r=K.submit();
 A.session={ownerAllowed:()=>true,actor:()=>({id:'owner'})};
 vm.runInContext(fs.readFileSync('app/owner-cake-state.js','utf8'),ctx);
 const input={date:r.snapshot.date,method:'delivery',address:{label:'Agreed',add_line_1:'Main Street',city:'Danao City',postal_code:'6004'},complexity:1000,fee:25000,notes:'Agreed design',
  options:{shape:'heart',flavor:'chocolate',size:'eight',color:'sage',icing:'buttercream'},addonQuantities:{decoration:1}};
 assert.equal(A.ownerCakes.issue(r.id,input,0,'first'),'');const first=K.versions(r)[0];
 assert.equal(first.expires_at-first.issued_at,K.offerValidityMs);
 assert.equal(first.snapshot.address.city,'Danao City');assert.equal(first.delivery_fee,25000);
 assert.equal(first.snapshot.options.find(o=>o.type==='shape').id,'heart');
 assert.notEqual(r.snapshot.options.find(o=>o.type==='shape').id,'heart');
 first.expires_at=Date.now();assert.equal(K.recordAcceptance(first),false);assert(K.expire());
 assert.equal(A.ownerCakes.issue(r.id,{...input,method:'pickup'},r.version,'second'),'');
 const revised=K.versions(r)[0];assert.equal(revised.expires_at-revised.issued_at,K.offerValidityMs);assert.equal(revised.delivery_fee,0);
 assert.equal(first.status,'expired');assert.equal(first.snapshot.address.city,'Danao City');
});
await test('acceptance failure preserves the offer and reservation failure preserves acceptance',()=>{
 const {K,A,quote}=setup(),{r,q}=quote();
 K.mock.accept='error';assert.equal(K.accept(q),null);assert.equal(q.status,'issued');assert.equal(r.accepted_quotation_id,null);
 K.mock.accept='normal';A.schedule.config.blocked=[q.snapshot.date];
 assert.equal(K.accept(q),null);assert.equal(r.accepted_quotation_id,q.id);assert.equal(K.orders.length,0);
 A.schedule.config.blocked=[];const o=K.checkout(q);assert(o);assert.equal(K.checkout(q),o);assert.equal(K.orders.length,1);
});
await test('lost capacity after expiry sends late payment to resolution',()=>{const {K,quote}=setup();const first=K.accept(quote().q);K.pay(first,'expired');K.accept(quote().q);K.pay(first,'confirmed');assert(first.paid);assert.equal(first.status,'payment-resolution');assert(!K.retry(first));});
await test('ingredient holds compete and missing recipes fail closed',()=>{const {K,A,quote}=setup();const {q}=quote();q.materials=null;assert.equal(K.accept(q),null);q.materials={butter:99999};assert.equal(K.accept(q),null);q.materials={butter:A.cakeData.stock.butter};assert(K.accept(q));const next=quote('2026-10-23').q;assert.equal(K.accept(next),null);});
await test('decline records response and permits a revised offer',()=>{const {K,quote}=setup();const {r,q}=quote();assert.equal(K.decline(q,'Smaller cake please'),'');assert.equal(r.status,'pending_review');assert.equal(q.customer_response_note,'Smaller cake please');assert.equal(K.issue(r).version,2);});
await test('an accepted agreement cannot be replaced while checkout is pending',()=>{const {K,quote}=setup();const {r,q}=quote(),o=K.accept(q);assert.equal(K.issue(r,true),null);assert.equal(o.status,'pending-payment');assert.equal(K.activeHolds().length,1);assert(q.accepted_at);assert.equal(q.status,'accepted');});
await test('paid quote cannot be revised or declined',()=>{const {K,quote}=setup();const {r,q}=quote();K.pay(K.accept(q),'confirmed');assert.equal(K.issue(r,true),null);assert(K.decline(q));});
await test('profile validation normalizes mobile without altering transaction contact',()=>{const {P,quote}=setup();const {r}=quote();assert(P.saveProfile({first_name:'',last_name:'Smith',mobile_number:'123'}));assert.equal(P.saveProfile({first_name:'Anna',last_name:'Smith',mobile_number:'09171234567'}),'');assert.equal(P.current.mobile_number,'+639171234567');assert.equal(r.snapshot.contact.name,'Charles Borres');});
await test('email change keeps old address until verified; resend invalidates old code',async()=>{const {P,A}=setup();assert.equal(await P.beginEmail('new@example.com','Kitchen406!'),'');const old=P.verification.code;assert.equal(P.current.email,'charles@example.com');assert(P.resendEmail());P.verification.resend_at=0;assert.equal(P.resendEmail(),'');assert(P.verifyEmail(old));assert.equal(P.verifyEmail(P.verification.code),'');assert.equal(A.email,'new@example.com');assert.equal(P.current.customer_id,'preview-customer');});
await test('email expiry, attempt limit, duplicates, and wrong current password',async()=>{const {P}=setup();assert(await P.beginEmail('charles@example.com','Kitchen406!'));assert(await P.beginEmail('new@example.com','wrong'));await P.beginEmail('new@example.com','Kitchen406!');for(let i=0;i<5;i++)P.verifyEmail('000000');assert(P.verifyEmail(P.verification.code));P.verification.resend_at=0;P.resendEmail();P.verification.expires_at=0;assert(P.verifyEmail(P.verification.code));assert.equal(P.current.email,'charles@example.com');});
await test('password change checks old secret, strength, confirmation and records timestamp',async()=>{const {P}=setup();assert(await P.changePassword('wrong','NewPassword123','NewPassword123'));assert(await P.changePassword('Kitchen406!','short','short'));assert(await P.changePassword('Kitchen406!','NewPassword123','Different123'));assert.equal(await P.changePassword('Kitchen406!','NewPassword123','NewPassword123'),'');assert(P.current.password_changed_at);assert(await P.changePassword('Kitchen406!','AnotherPass123','AnotherPass123'));});
await test('cancelled credential changes cannot finish after their dialog closes',async()=>{const {P}=setup();const email=P.beginEmail('new@example.com','Kitchen406!');P.securityGeneration++;assert(await email);assert.equal(P.verification,null);const password=P.changePassword('Kitchen406!','NewPassword123','NewPassword123');P.securityGeneration++;assert(await password);assert.equal(P.current.password_changed_at,null);});
await test('address archive changes future selection, keeps snapshots and elects default',()=>{const {R,C,quote}=setup();const {r}=quote();assert(R.archive('home'));assert.equal(R.active().length,1);assert(R.find('work').is_default);assert.equal(C.state.draft.addressId,'');assert.equal(r.snapshot.address.address_id,'home');assert.equal(C.state.addresses[0].status,'archived');});
await test('complete addresses outside the courier area are eligible for owner review',()=>{const {R,K}=setup();const result=R.save({label:'Away',add_line_1:'Remote St',city:'Danao City',postal_code:'6004',latitude:10.5,longitude:124,is_default:true});assert(result.record);assert(K.serviceable(result.record));assert.equal(R.active().filter(a=>a.is_default).length,1);});
await test('notification channels group by customer and event, not provider',()=>{const {N}=setup();N.emit('event','cakes','Quote','Ready','cake-requests/x',undefined,{email:'sent'});N.emit('event','cakes','Quote','Ready','cake-requests/x',undefined,{sms:'failed'});assert.equal(N.list().length,1);assert.equal(N.list()[0].channels.sms,'failed');});
await test('account switching hides requests, addresses, notifications and restores ownership',()=>{const {A,P,K,R,N,quote}=setup();P.activate('charles@example.com');const {r,q}=quote();P.activate('other@example.com');assert.equal(K.request(r.id),null);assert.equal(K.accept(q),null);assert.equal(R.active().length,0);assert.equal(N.list().length,0);P.activate('charles@example.com');assert(K.request(r.id));assert.equal(R.active().length,2);A.auth='guest';assert.equal(K.request(r.id),null);assert.equal(K.submit(),null);});
await test('cake fulfillment requires a method and delivery requires a serviceable address',()=>{const {K,fill}=setup();fill();K.state.draft.method='';assert.match(K.fulfillmentReason(),/pickup or delivery/);K.state.draft.method='delivery';K.state.draft.addressId='';assert.match(K.fulfillmentReason(),/address/);K.state.draft.method='pickup';assert.equal(K.fulfillmentReason(),'');});
await test('pickup persists through request, quotation and order without address or delivery charge',()=>{const {K,fill}=setup();fill();K.state.draft.method='pickup';K.state.draft.addressId='';const r=K.submit();assert(r,K.message);assert.equal(r.snapshot.method,'pickup');assert.equal(r.snapshot.address,null);const q=K.issue(r);assert.equal(q.delivery_fee,0);const o=K.accept(q);assert(o,K.message);assert.equal(o.fulfillment.method,'pickup');assert.equal(o.address,null);assert.equal(o.fee,0);});
await test('pickup still respects all cake availability restrictions',()=>{const {K,fill}=setup();fill();K.state.draft.method='pickup';for(const mode of ['loading','error','capacity','blocked']){K.mock.availability=mode;assert(K.fulfillmentReason());assert.equal(K.submit(),null);}K.mock.availability='normal';assert.equal(K.fulfillmentReason(),'');});
await test('owner can issue a cake quotation without a fulfillment window',()=>{const {A,K,fill,ctx}=setup();fill();const r=K.submit();assert(r,K.message);assert(!('window' in r.snapshot));A.session={ownerAllowed:()=>true,actor:()=>({id:'owner-test'})};vm.runInContext(fs.readFileSync('app/owner-cake-state.js','utf8'),ctx);assert.equal(A.ownerCakes.issue(r.id,{date:r.snapshot.date,method:'pickup',complexity:0,fee:0,expiry:Date.now()+86400000,notes:'Test'},0,'no-window'),'');const q=K.versions(r)[0];assert(!('windowLabel' in q.snapshot));const o=K.accept(q);assert(o,K.message);assert(!('window' in o.fulfillment));});
console.log('COMPLETE '+checks+' Phase 4 state checks.');
})().catch(e=>{console.error(e);process.exit(1);});
