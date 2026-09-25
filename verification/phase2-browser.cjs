const fs=require('node:fs');
(async()=>{
 const targets=await(await fetch('http://127.0.0.1:9222/json')).json();
 const ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
 let seq=0,checks=0;const pending=new Map(),errors=[];
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);};
 const send=(method,params={})=>new Promise((r,j)=>{const id=++seq;pending.set(id,r);ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);j(Error('Timeout '+method));}},15000).unref();});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.result.exceptionDetails)throw Error(r.result.exceptionDetails.exception?.description);return r.result.result.value;};
 const wait=(ms=140)=>new Promise(r=>setTimeout(r,ms));
 const go=async path=>{await run('location.hash='+JSON.stringify('#/'+path));await wait();};
 const click=async selector=>{await run(`document.querySelector(${JSON.stringify(selector)}).click()`);await wait();};
 const action=a=>click(`[data-commerce="${a}"]`);
 const assert=async(expr,label)=>{if(!await run(expr))throw Error('FAIL '+label);checks++;console.log('PASS '+label);};
 const mock=async(key,value)=>{await run(`(()=>{const e=document.getElementById('mock-commerce-${key}');e.value=${JSON.stringify(value)};e.dispatchEvent(new Event('change',{bubbles:true}));})()`);await wait();};
 await send('Runtime.enable');await send('Page.enable');
 await send('Page.navigate',{url:require('node:url').pathToFileURL(require('node:path').resolve(__dirname,'../index.html')).href});await wait(2200);
 await run('window.C=K406.commerce;window.S=C.state;K406.setAuth("signedin")');
 await run(`C.addressMap.load=async()=>{};C.addressMap.mount=()=>{};window.routeDistance=9000;window.google={maps:{importLibrary:async()=>({Route:{computeRoutes:async()=>({routes:[{distanceMeters:routeDistance}]})}})}}`);
 await go('product/1');await run("selectVariant('large');adjustQty(1);handleAddToCart()");await go('cart');
 await assert("S.cart.length===1&&S.cart[0].price===480&&S.cart[0].quantity===2&&K406.bag===2",'product variant and quantity reach bag');
 await action('increase');await assert('C.subtotal()===1440&&K406.bag===3','quantity updates totals and badge');
 await action('remove');await assert('S.cart.length===0&&document.getElementById("commerce-view").textContent.includes("empty")','remove final item empty state');
 await action('undo');await assert('S.cart[0].quantity===3','undo restores item');
 await mock('stock','unavailable');await assert('document.querySelector("[data-commerce=checkout]").disabled','unavailable blocks checkout');
 await mock('stock','quantity');await action('decrease');await assert('S.cart[0].quantity===12&&!document.querySelector("[data-commerce=checkout]").disabled','quantity cap resolves by reducing');
 await mock('stock','normal');await action('checkout');await action('fulfillment-next');
 await assert('document.querySelector("[data-commerce=fulfillment-next]").disabled','missing fulfillment validation');
 await click('[data-method="delivery"]');await click('[data-date="2026-10-16"]');await action('fulfillment-next');
 await assert('location.hash==="#/checkout/address"&&C.fee()===95','delivery enters address with quote');
 await action('address-add');
 await run("Object.entries({label:'Test address',add_line_1:'Sample Street, Banilad',add_line_2:'Unit 5',city:'Mandaue City',postal_code:'6014',landmark:'Ring bell'}).forEach(([k,v])=>{let e=document.querySelector('[name='+k+']');e.value=v;e.dispatchEvent(new Event('input',{bubbles:true}))});Object.assign(C.checkout.form,{latitude:10.34,longitude:123.92});document.getElementById('delivery-address-form').requestSubmit()");
 await assert('S.addresses.length===3&&C.address().label==="Test address"','new address saved and selected');
 await action('address-edit'); // first fixture edit
 await run("C.checkout.form.latitude=null;document.getElementById('delivery-address-form').requestSubmit()");
 await assert('document.getElementById("address-error").textContent.includes("Select your location")','address coordinate validation');
 await action('address-cancel');await run('routeDistance=10001;C.deliveryRoute.check(true)');await wait();
 await assert('document.querySelector("[data-commerce=address-next]").disabled','outside service area blocks review');
 await run('routeDistance=9000;C.deliveryRoute.check(true)');await wait();await mock('quote','failed');await assert('document.querySelector("[data-commerce=address-next]").disabled','failed quotation blocks review');await mock('quote','ok');
 await action('address-next');await assert('location.hash==="#/checkout/review"','address reaches review');
 await mock('review','capacity');await assert('document.querySelector("[data-commerce=pay]").disabled','capacity conflict blocks payment');await action('review-retry');
 await mock('price','updated');await assert('document.querySelector("[data-commerce=pay]").disabled','updated price requires acceptance');await action('accept-price');
 await assert('S.cart[0].price===500','accepted price applied consistently');
 await action('pay');await assert('S.orders.length===1&&C.currentOrder().total===6095','payment snapshot has expected delivery total');
 await run('window.firstOrder=C.currentOrder();firstOrder.deadline=Date.now()-1');await wait(1100);
 await assert('firstOrder.payment==="expired"','payment expires on real timer');await action('retry-payment');
 await assert('firstOrder.payment==="waiting"&&firstOrder.attempts.length===2','retry retains order and records attempt');
 await mock('payment','delayed');await go('cart');await action('increase');await assert('S.cart[0].quantity===12','verification locks cart edits');await go('payment/'+await run('firstOrder.id'));
 await action('check-payment');await assert('firstOrder.paid&&S.cart.length===0&&K406.bag===0','confirmed payment clears purchased bag once');
 await run('C.setPayment(firstOrder,"confirmed")');await assert('S.orders.length===1','duplicate confirmation does not create an order');
 await click('a[href^="#/confirmation/"]');await assert('document.querySelector("#commerce-view h1").textContent==="Order confirmed"','confirmation matches paid order');
 await go('orders/'+await run('firstOrder.id'));await mock('status','completed');await action('review-item');await run('setModalStarRating(5);handleReviewSubmit()');await wait(750);await run('closeReviewModal()');
 await assert('K406.product.state.submitted.has(1)&&document.getElementById("commerce-view").textContent.includes("Reviewed")','completed order uses existing review composer');
 await go('product/2');await run('handleAddToCart()');await go('cart');await action('checkout');await click('[data-method="pickup"]');await click('[data-date="2026-10-17"]');await action('fulfillment-next');
 await assert('location.hash==="#/checkout/review"&&C.fee()===0','pickup skips address and removes fee');await action('pay');
 await run('window.secondOrder=C.currentOrder()');await go('orders/'+await run('secondOrder.id'));await action('cancel-order');
 await assert('K406.modal==="order-cancel-modal"&&document.getElementById("app-shell").inert','unpaid cancellation opens accessible dialog');
 await click('#confirm-order-cancel');await assert('secondOrder.status==="cancelled"&&S.cart.length===1','cancellation preserves bag');
 await go('checkout/review');await action('pay');await run('window.thirdOrder=C.currentOrder()');await go('cart');await action('increase');await go('payment/'+await run('thirdOrder.id'));
 await assert('thirdOrder.payment==="revalidation"','edited bag invalidates old payment snapshot');
 await go('checkout/review');await action('pay');await assert('C.currentOrder().id!==thirdOrder.id&&thirdOrder.status==="cancelled"','revalidated checkout replaces stale unpaid order');
 await action('simulate-payment');await wait(1100);await assert('C.currentOrder().paid&&C.currentOrder().fee===0','pickup payment completes');
 await go('orders');await action('sample-orders');await assert('S.orders.filter(o=>o.fixture).length===7','seven mixed sample orders load');
 await run("let e=document.getElementById('orders-search');e.value='no-such-order';e.dispatchEvent(new Event('input',{bubbles:true}))");await assert('document.getElementById("commerce-view").textContent.includes("No matching orders")','order search no-match state');await action('clear-filters');
 await action('orders-next');await assert('C.orders.page===2','order pagination');
 await run('K406.setAuth("guest")');await assert('document.getElementById("commerce-view").textContent.includes("Sign in to continue")','orders guest gate');await run('K406.setAuth("signedin")');
 await go('orders/unknown');await assert('document.getElementById("commerce-view").textContent.includes("Order not found")','unknown reference does not show another order');
 await go('cart');await action('sample-cart');await go('checkout/fulfillment');await click('[data-method="delivery"]');await click('[data-date="2026-10-16"]');
 for(const state of ['fully-booked','blocked','cutoff','stock','no-dates','normal']){await mock('dates',state);await assert('document.querySelector(".calendar-grid")!==null','calendar scenario '+state);}
 for(const state of ['loading','error','normal']){await mock('calendar',state);await assert('document.getElementById("commerce-view").textContent.length>100','calendar view '+state);}
 await go('payment/'+await run('firstOrder.id'));await action('payment-preview');
 for(const state of ['detected','delayed','failed','expired','revalidation','waiting','confirmed']){await mock('payment',state);await assert('C.currentOrder().payment==='+JSON.stringify(state),'payment inspector '+state);}
 await go('orders/'+await run('firstOrder.id'));
 for(const state of ['pending-payment','confirmed','preparing','ready-delivery','ready-pickup','in-transit','completed','payment-failed','payment-resolution','cancelled','completed']){await mock('status',state);await assert('C.currentOrder().status==='+JSON.stringify(state),'order lifecycle '+state);}
 await go('checkout/fulfillment');await click('[data-method="delivery"]');await click('[data-date="2026-10-16"]');
 const routes=['cart','checkout/fulfillment','checkout/address','checkout/review','payment/'+await run('firstOrder.id'),'confirmation/'+await run('firstOrder.id'),'orders','orders/'+await run('firstOrder.id')];
 for(const width of [1440,768,390,320]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:950,deviceScaleFactor:1,mobile:false});
  for(const route of routes){await go(route);await assert('document.documentElement.scrollWidth<=innerWidth+1',route+' fits '+width);}
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await go('checkout/fulfillment');
 let shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync('verification/phase2-fulfillment-desktop.png',Buffer.from(shot.result.data,'base64'));
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});await go('orders/'+await run('firstOrder.id'));
 shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync('verification/phase2-order-mobile.png',Buffer.from(shot.result.data,'base64'));
 await assert('new Set([...document.querySelectorAll("[id]")].map(e=>e.id)).size===document.querySelectorAll("[id]").length','unique DOM IDs');
 if(errors.length)throw Error(errors.join('\n'));console.log('COMPLETE '+checks+' Phase 2 checks; no uncaught browser exceptions.');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
