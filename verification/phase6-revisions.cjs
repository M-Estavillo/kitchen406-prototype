const path=require('node:path'),assert=require('node:assert/strict');
(async()=>{
 const target=await(await fetch('http://127.0.0.1:9222/json/new?about:blank',{method:'PUT'})).json();
 const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let seq=0;const pending=new Map(),errors=[];
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
 const send=(method,params={})=>new Promise(r=>{const id=++seq;pending.set(id,r);ws.send(JSON.stringify({id,method,params}));});
 const run=async expression=>{const m=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(m.result?.exceptionDetails)throw Error(m.result.exceptionDetails.exception?.description);return m.result.result.value;};
 const pause=()=>new Promise(r=>setTimeout(r,150));const go=async route=>{await run(`location.hash=${JSON.stringify('#/'+route)}`);await pause();};
 let checks=0;const check=async(expression,label)=>{assert(await run(expression),label);checks++;console.log('PASS '+label);};
 const reset=()=>run('A.commerce.reset();A.setAuth("signedin");A.closeModal(true)');
 try{
 await send('Runtime.enable');await send('Page.navigate',{url:require('node:url').pathToFileURL(path.resolve('index.html')).href});await new Promise(r=>setTimeout(r,1500));
 await run('window.A=K406;window.C=A.commerce;window.D=A.schedule;window.I=A.inventory;window.B=A.subscriptions;window.K=A.cakes;window.O=A.owner');
 await reset();await run('C.sampleCart();Object.assign(C.state.draft,{method:"pickup",date:"2026-10-24"});window.order=C.createOrder();window.originalHold=order.attempts[0].hold_id;C.setPayment(order,"expired");D.config.standardUnits=2;window.competitor={...C.copy(order),id:"REVIEW-COMPETITOR",paid:true,payment:"confirmed",status:"confirmed",attempts:[]};C.state.orders.push(competitor);I.reserve(competitor,true);C.setPayment(order,"confirmed")');
 await check('order.paid&&order.status==="payment-resolution"&&A.capacity.summary(order.fulfillment.date).standard.get(1)===2','F1 late payment over capacity');
 await check('order.attempts[0].hold_id===originalHold&&order.attempts.length===1&&A.checkoutHolds.get(order.attempts[0]).status==="expired"','F2 late receipt preserves attempt hold');
 await reset();await run('C.sampleCart();Object.assign(C.state.draft,{method:"pickup",date:"2026-10-24"});window.order=C.createOrder();C.setPayment(order,"expired");A.session.enter();A.capacity.block(order.fulfillment.date,"Closed");A.session.leave();C.setPayment(order,"confirmed")');
 await check('order.paid&&order.status==="payment-resolution"','F1 late payment blocked date');
 await reset();await run('B.deliveryRoute.eligible=()=>true;B.begin(1);window.purchase=B.createPurchase();window.sub=B.pay(purchase,"confirmed");A.session.enter()');await pause();await go('owner/payments/'+await run('purchase.id'));
 await check('A.checkoutHolds.get(purchase.attempts[0]).status==="confirmed"&&I.reservations.get(purchase.id).status==="released"&&!A.$("owner-view").textContent.includes("released")','F2 paid subscription checkout hold');
 await reset();await run('B.deliveryRoute.eligible=()=>true;B.begin(1);window.purchase=B.createPurchase();B.cancel(purchase)');
 await check('purchase.payment==="cancelled"&&purchase.attempts[0].state==="cancelled"&&A.operations.payments().find(p=>p.order.id===purchase.id).status==="cancelled"','F3 cancelled subscription payment');
 await reset();await run('K.sampleDraft();window.request=K.submit();A.session.enter();window.input={date:request.snapshot.date,window:request.snapshot.window,method:"pickup",complexity:65000,fee:0,expiry:Date.now()+86400000,notes:"Cream finish"};window.issueError=A.ownerCakes.issue(request.id,input,0,"paper-quote");window.quote=K.versions(request)[0];A.session.leave()');await pause();await go(await run('K.quotePath(quote)'));
 await check('!issueError&&quote.snapshot.method==="pickup"&&quote.delivery_fee===0&&A.$("phase4-view").textContent.includes("Bakery pickup")&&!A.$("phase4-view").textContent.includes("Select a delivery address.")&&!A.$("phase4-view").textContent.includes("Owner-managed delivery")','F4 pickup customer quotation');
 await reset();await run('C.sampleCart();Object.assign(C.state.draft,{method:"pickup",date:"2026-10-24"});window.order=C.createOrder();order.attempts[0].created_at=Date.parse("2026-10-14T00:30:00+08:00");A.session.enter()');await pause();await go('owner/payments');await run('Object.assign(O.filters,{from:"2026-10-14",to:"2026-10-14",type:"all",query:""});O.render()');
 await check('!A.$("owner-view").textContent.includes("0 results")&&A.ownerUI.businessDate(order.attempts[0].created_at)==="2026-10-14"','F5 Manila date filter');
 await reset();await run('A.session.enter();I.items.forEach(i=>i.cost=0.01);window.rows=Object.entries(I.recipe(1)).map(([id,quantity])=>({id,quantity}));window.error=A.pricing.save({id:1,variant:"standard",rows,overhead:null,version:A.pricing.version});A.pricing.overhead=50');
 await check('!error&&A.pricing.cost(1,"standard").overhead===50&&!A.pricing.overheads.has("1:standard")','F6 saved recipe inherits default overhead');
 await reset();await run('A.session.enter();window.config={standardUnits:10,standardVarieties:4,subscriptionUnits:10,maxPerDay:2,maxPerWeek:2,standard:{value:2,unit:"days",cutoff:"16:00"},subscription:{value:2,unit:"days",cutoff:"16:00"},cake:{value:5,unit:"days",cutoff:"16:00"}};window.error=A.capacity.save(config,A.capacity.version);K.holds.push({id:"review-hold",orderId:"review-cake",date:"2026-10-24",status:"confirmed",materials:{}})');
 await check('!error&&!K.dateReason("2026-10-24")','D3 configurable same-date cakes');
 await reset();await run('K.sampleDraft();window.request=K.submit();A.session.enter();A.ownerCakes.notificationOutcome="failure";A.ownerCakes.issue(request.id,{date:request.snapshot.date,window:request.snapshot.window,method:"pickup",complexity:0,fee:0,expiry:Date.now()+86400000,notes:"Review"},0,"notification-review")');await pause();await go('owner');
 await run('O.render()');await check('K.versions(request)[0].notification_status==="failed"&&A.ownerCakes.alerts.size===1&&A.$("owner-view").textContent.includes("Quotation notification failed")','F7 failed notification alert');

 await run('window.q=K.versions(request)[0];A.ownerCakes.notify(q);A.ownerCakes.notificationOutcome="success";A.ownerCakes.notify(q);O.render()');
 await check('A.ownerCakes.alerts.size===1&&!!A.ownerCakes.alerts.get(q.id).resolved_at&&A.ownerCakes.notificationAttempts.length===3&&A.ownerCakes.notificationAttempts[0].status==="failed"&&!A.$("owner-view").textContent.includes("Quotation notification failed")','notification retries retain history and resolve one owner alert');
 await go(await run('"owner/cake-requests/"+q.requestId+"/quotation/"+q.id'));
 await check('A.$("owner-view").textContent.includes("QUOTE-NOTIFY-1")&&A.$("owner-view").textContent.includes("failed")&&A.$("owner-view").textContent.includes("sent")','quotation detail displays failed and successful notification attempts');
 await run('A.staff.enter();location.hash="#/staff/notifications"');await pause();
 await check('!A.$("staff-view").textContent.includes("Quotation notification failed")','owner notification failure is not exposed to staff');
 for(const scenario of ['cutoff','stock','valid','active']){
  await reset();await run('C.sampleCart();Object.assign(C.state.draft,{method:"pickup",date:"2026-10-24"});window.order=C.createOrder();window.hold=order.attempts[0].hold_id');
  if(scenario!=='active')await run('C.setPayment(order,"expired")');
  if(scenario==='cutoff')await run('D.config.clock="2026-10-24T12:00:00+08:00"');
  if(scenario==='stock')await run('I.item("flour").stock=0');
  if(scenario==='active')await run('D.config.blocked.push(order.fulfillment.date);D.config.standardUnits=1');
  await run('C.setPayment(order,"confirmed");C.setPayment(order,"confirmed")');
  await check(scenario==='cutoff'||scenario==='stock'?'order.paid&&order.status==="payment-resolution"':'order.paid&&order.status==="confirmed"&&I.movements.length===0&&order.attempts.length===1&&order.attempts[0].hold_id===hold','standard receipt '+scenario+' respects resource and audit rules');
 }
 await reset();await run('C.sampleCart();Object.assign(C.state.draft,{method:"pickup",date:"2026-10-24"});window.order=C.createOrder();C.setStatus(order,"cancelled")');
 await check('order.attempts[0].state==="cancelled"&&A.checkoutHolds.get(order.attempts[0]).status==="released"','standard cancellation closes active payment and hold');
 await reset();await run('K.sampleDraft();window.request=K.submit();A.session.enter();A.ownerCakes.issue(request.id,{date:request.snapshot.date,window:request.snapshot.window,method:"pickup",complexity:0,fee:0,expiry:Date.now()+86400000,notes:"Review"},0,"cancel-cake");window.q=K.versions(request)[0];A.session.leave();window.order=K.accept(q);K.cancel(order)');
 await check('order.attempts[0].state==="cancelled"&&A.checkoutHolds.get(order.attempts[0]).status==="released"','cake cancellation closes active payment and hold');
 await reset();await run('A.session.enter()');await pause();await run('I.items.forEach(i=>i.cost=0.01);A.ownerInventory.openRecipe(1,"standard")');
 await check('document.querySelector("#owner-overhead-mode").value==="default"&&document.querySelector("#owner-overhead").disabled','recipe form defaults to explicit inheritance');
 await run('document.querySelector("[data-owner-form=recipe]").requestSubmit();A.pricing.overhead=50');
 await check('!A.pricing.overheads.has("1:standard")&&A.pricing.cost(1,"standard").overhead===50','saving recipe form retains default inheritance');
 await run('A.ownerInventory.openRecipe(1,"standard");window.mode=document.querySelector("#owner-overhead-mode");mode.value="custom";mode.dispatchEvent(new Event("change",{bubbles:true}));document.querySelector("#owner-overhead").value="0";document.querySelector("[data-owner-form=recipe]").requestSubmit()');
 await check('A.pricing.overheads.get("1:standard")===0&&A.pricing.cost(1,"standard").overhead===0','explicit zero overhead is retained');
 await run('A.ownerInventory.openRecipe(1,"standard");window.mode=document.querySelector("#owner-overhead-mode");mode.value="default";mode.dispatchEvent(new Event("change",{bubbles:true}));document.querySelector("[data-owner-form=recipe]").requestSubmit()');
 await check('!A.pricing.overheads.has("1:standard")&&A.pricing.cost(1,"standard").overhead===50','custom overhead can return to default');
 assert.deepEqual(errors,[],'No browser exceptions');console.log('COMPLETE '+checks+' paper revision checks');

 }finally{await fetch('http://127.0.0.1:9222/json/close/'+target.id);ws.close();}
})().catch(e=>{console.error(e);process.exit(1)});