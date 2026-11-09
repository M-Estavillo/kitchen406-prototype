const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
const tabs=await(await fetch('http://127.0.0.1:9222/json')).json(),ws=new WebSocket(tabs.find(t=>t.type==='page'&&t.url==='about:blank')?.webSocketDebuggerUrl||tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const pending=new Map(),errors=[];ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};const send=(method,params={})=>new Promise(r=>{pending.set(++id,r);ws.send(JSON.stringify({id,method,params}));});const run=async expression=>{const m=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(m.result.exceptionDetails)throw Error(JSON.stringify(m.result.exceptionDetails));return m.result.result.value;};const wait=()=>new Promise(r=>setTimeout(r,300));const go=async p=>{await run(`location.hash='#/owner/${p}'`);await wait();};let n=0;const check=async(s,l)=>{assert(await run(s),l);console.log('PASS '+l);n++;};
await send('Runtime.enable');await send('Page.navigate',{url:'file:///D:/kitchen406-prototype/index.html'});await new Promise(r=>setTimeout(r,1800));await run('window.A=K406;A.session.enter();A.owner.seed()');





await go('marketing');await check('A.owner.filters.type==="pending"&&[...document.querySelectorAll(".owner-marketing-status")].every(e=>e.classList.contains("pending"))','marketing defaults pending');
await go('products');await run('document.querySelector("[data-owner=pricing-settings]").click()');await check('document.querySelector("select[name=markup]").options.length===8','markup dropdown 30 to 100');await run('A.closeModal(true)');
await go('inventory');await run('A.ownerInventory.openStock(A.inventory.items[0].id,"adjustment")');await check('document.querySelector(".owner-stock-dialog-actions button[type=submit]").textContent==="Adjust"&&getComputedStyle(document.querySelector(".owner-stock-dialog-actions")).justifySelf==="end"','owner adjust compact footer');await run('A.closeModal(true)');
await go('accounts');await check('!document.querySelector("[data-owner=account-edit][data-id]")&&!!document.querySelector("[data-owner=account-status][role=switch]")','staff account toggle without edit');
const rid=await run('A.cakes.state.requests.find(r=>r.status==="pending_review").id');await go('cake-requests/'+rid);await run('document.querySelector("[data-owner=create-quotation]").click();window.qf=document.querySelector("[data-owner-form=quotation]");qf.elements.addons.value="123.45";qf.elements.addons.dispatchEvent(new Event("input",{bubbles:true}))');await check('document.querySelector("#owner-quote-breakdown").textContent.includes(A.cakes.money(12345))','add-ons live quote');
await run('qf.requestSubmit()');await check('A.cakes.state.quotations[0].addons_total===12345&&A.cakes.state.quotations[0].total===A.cakes.state.quotations[0].options_total+12345','add-ons saved in quote total');await run('A.closeModal(true)');
await run('window.o=A.staff.orders().find(o=>o.status==="confirmed"&&o.type==="standard"&&o.fulfillment.method==="pickup");window.before=Object.fromEntries(A.inventory.items.map(i=>[i.id,i.stock]));window.version=A.staff.versions.get(o.id)||0;window.startError=A.fulfillment.transition(o.id,"preparing",version,crypto.randomUUID())');
await check('!window.startError&&o.status==="preparing"','start preparation');
await go('orders/'+await run('o.id'));await check('!!document.querySelector("[data-owner=revert-status]")','revert button beside forward action');
await run('window.key=crypto.randomUUID();window.error=A.fulfillment.revert(o.id,version+1,key)');await check('!window.error&&o.status==="confirmed"&&A.inventory.items.every(i=>i.stock===before[i.id])','revert restores consumed stock');
await check('A.fulfillment.revert(o.id,version+1,key)===""&&A.inventory.items.every(i=>i.stock===before[i.id])','revert duplicate does not restore twice');
await check('A.fulfillment.transition(o.id,"preparing",version+2,crypto.randomUUID())===""&&o.status==="preparing"','preparation can resume');
await check('A.fulfillment.transition(o.id,"ready",version+3,crypto.randomUUID())===""&&A.fulfillment.revert(o.id,version+4,crypto.randomUUID())===""&&o.status==="preparing"','ready reverts to preparing');
await run('o.delivery={status:"booked"}');await check('!A.fulfillment.previous(o)&&!!A.fulfillment.revert(o.id,version+5,crypto.randomUUID())','active courier blocks reversal');await run('delete o.delivery');
await run('A.staff.enter()');await wait();await run('location.hash="#/staff/recipes"');await wait();await check('!document.querySelector("[data-staff^=recipe-]")&&A.pricing.saveStaffRecipe({}).includes("read-only")','staff recipes read-only controls and command');
await run('location.hash="#/staff/inventory"');await wait();await run('document.querySelector("[data-staff=adjust]").click()');await check('document.querySelector(".staff-stock-actions .primary").textContent==="Adjust"&&!!document.querySelector(".staff-stock-actions [data-close-modal]")','staff adjust actions');await run('A.closeModal(true)');
for(const width of [1440,390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await run('document.querySelector("[data-staff=adjust]").click()');await check('document.querySelector("#staff-modal .dialog-card").getBoundingClientRect().width<=innerWidth','staff adjust fits '+width);await run('A.closeModal(true)');}
await run('A.session.enter()');await wait();await go('inventory');
for(const width of [1440,390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await run('A.ownerInventory.openStock(A.inventory.items[0].id,"adjustment")');await check('document.querySelector("#owner-modal .dialog-card").getBoundingClientRect().width<=innerWidth','owner adjust fits '+width);await run('A.closeModal(true)');}

await check('getComputedStyle(document.querySelector(".staff-nav")).scrollbarWidth==="none"','sidebar scrollbar hidden');
await run('window.ver=A.staff.versions.get(o.id);A.fulfillment.transition(o.id,"ready",ver,crypto.randomUUID());A.fulfillment.transition(o.id,"completed",ver+1,crypto.randomUUID())');
await check('o.status==="completed"&&A.fulfillment.revert(o.id,ver+2,crypto.randomUUID())===""&&o.status==="ready"&&!o.completedAt','completed pickup reverts to ready');
await go('cake-requests/'+rid);await run('document.querySelector("[data-owner=create-quotation]").click()');
for(const width of [1440,390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await check('document.querySelector("#owner-modal .dialog-card").getBoundingClientRect().width<=innerWidth&&document.querySelector("[name=addons]")','quotation fits '+width);}
await run('A.closeModal(true);A.session.leave();window.payOrder=A.commerce.state.orders.find(x=>!x.quotationId&&!x.prepaid);payOrder.customer_id=A.account.id();payOrder.paid=false;payOrder.payment="expired";payOrder.status="payment-failed";location.hash="#/payment/"+payOrder.id');await wait();
await check('document.body.textContent.includes("product is now unavailable")&&!document.querySelector("[data-commerce=retry-payment]")','expired standard payment explains lost reservation without retry');
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
await run('A.session.enter()');await wait();await go('inventory');await run('A.ownerInventory.openStock(A.inventory.items[0].id,"adjustment")');
const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('verification/demo-adjust-modal.png',Buffer.from(shot.result.data,'base64'));
await run('A.closeModal(true)');await go('cake-requests/'+rid);await run('document.querySelector("[data-owner=create-quotation]").click()');
const quoteShot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('verification/demo-quotation-modal.png',Buffer.from(quoteShot.result.data,'base64'));
await send('Emulation.clearDeviceMetricsOverride');assert.deepEqual(errors,[]);console.log(n+' checks passed');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
