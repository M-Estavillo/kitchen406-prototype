const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
const tabs=await(await fetch('http://127.0.0.1:9222/json')).json(),ws=new WebSocket(tabs.find(t=>t.type==='page'&&t.url==='about:blank')?.webSocketDebuggerUrl||tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const pending=new Map(),errors=[];ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};const send=(method,params={})=>new Promise(r=>{pending.set(++id,r);ws.send(JSON.stringify({id,method,params}));});const run=async expression=>{const m=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(m.result.exceptionDetails)throw Error(JSON.stringify(m.result.exceptionDetails));return m.result.result.value;};const wait=()=>new Promise(r=>setTimeout(r,300));const go=async p=>{await run(`location.hash='#/owner/${p}'`);await wait();};let n=0;const check=async(s,l)=>{assert(await run(s),l);console.log('PASS '+l);n++;};
await send('Runtime.enable');await send('Page.navigate',{url:'file:///D:/kitchen406-prototype/index.html'});await new Promise(r=>setTimeout(r,1800));await run('window.A=K406;A.session.enter();A.owner.seed()');





await go('subscriptions/requests');
await check('document.querySelector("#owner-view").textContent.includes("Deferment history")&&A.subscriptions.requests[0].status==="applied"','history with applied fixture');
await run('document.querySelector("[data-owner=defer-details]").click()');
await check('!document.querySelector(".owner-defer-details button")&&!document.querySelector("[data-owner=defer-confirm-review]")&&document.querySelector(".owner-defer-details").textContent.includes("Original fulfillment")','read-only details without actions');
await run('A.closeModal(true);window.B=A.subscriptions;window.r=B.allRecords().find(r=>r.deferments.length);window.change=r.deferments[0];window.d=r.deliveries.find(d=>d.id===change.deliveryId);window.order=A.operations.orders().find(o=>o.id===d.orderId);window.allocation=A.schedule.allocations.find(a=>a.owner===r.purchaseId&&a.cycle===d.cycle);Object.assign(allocation,change.originalAllocation);d.date=change.originalDate;order.fulfillment.date=d.date;r.deferments=[];B.requests=[];window.original=d.date;A.session.leave();A.email=A.account.records.find(c=>c.customer_id===r.customer_id).email;A.setAuth("signedin")');await wait();
await check('B.defer(r,d,change.option,"Away that day")===""&&d.date!==original&&order.fulfillment.date===d.date&&B.requests.at(-1).status==="applied"','customer deferment immediately updates schedule and history');
await check('r.deferments.length===1&&!!B.defer(r,d,change.option)&&B.requests.length===1','one-deferment limit and duplicate guard');
await check('!!B.reviewRequest(B.requests[0].id,true)','owner review command disabled');
await run('A.session.enter()');await wait();await go('subscriptions/requests');
for(const width of [1440,390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await run('document.querySelector("[data-owner=defer-details]").click()');await check('document.querySelector("#owner-modal .dialog-card").getBoundingClientRect().width<=innerWidth','details fit '+width);await run('A.closeModal(true)');}
await send('Emulation.clearDeviceMetricsOverride');assert.deepEqual(errors,[]);console.log(n+' checks passed');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
