const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
const tabs=await(await fetch('http://127.0.0.1:9222/json')).json(),ws=new WebSocket(tabs.find(t=>t.type==='page'&&t.url==='about:blank')?.webSocketDebuggerUrl||tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const pending=new Map(),errors=[];ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};const send=(method,params={})=>new Promise(r=>{pending.set(++id,r);ws.send(JSON.stringify({id,method,params}));});const run=async expression=>{const m=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(m.result.exceptionDetails)throw Error(JSON.stringify(m.result.exceptionDetails));return m.result.result.value;};const wait=()=>new Promise(r=>setTimeout(r,300));const go=async p=>{await run(`location.hash='#/owner/${p}'`);await wait();};let n=0;const check=async(s,l)=>{assert(await run(s),l);console.log('PASS '+l);n++;};
await send('Runtime.enable');await send('Page.navigate',{url:'file:///D:/kitchen406-prototype/index.html'});await new Promise(r=>setTimeout(r,1800));await run('window.A=K406;A.session.enter();A.owner.seed()');



await go('reviews');
await run(`A.reviews.records=[1,2,3,4,5].map(n=>({id:'review-'+n,customer:'Customer '+n,product:'Sample bread',variant:'Box of six',rating:n,comment:'Detailed customer feedback.',images:[],created:new Date().toISOString(),hidden:n===1,orderId:'ORDER-1',history:[],version:0}));A.owner.render()`);
await check('!document.querySelector("#owner-order-range")&&!document.querySelector("select[name=type]")','no date or visibility dropdown');
await run('document.querySelectorAll("[data-review-rating]")[0].click();document.querySelectorAll("[data-review-rating]")[1].click()');
await check('document.querySelectorAll(".owner-reviews tbody tr").length===2','multiple rating selections');
await run('document.querySelector("[data-owner=clear-filters]").click();document.querySelector("[data-owner=review-filter][data-value=hidden]").click()');
await check('document.querySelectorAll(".owner-reviews tbody tr").length===1','hidden pill');
await run('document.querySelector("[data-owner=clear-filters]").click()');
for(const width of [1440,768,390,320]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
 await check('document.documentElement.scrollWidth<=innerWidth+1','list fits '+width);
 await run('document.querySelector("[data-owner=review-details][data-id=review-5]").click()');
 await check('!A.$("owner-modal").hidden&&document.querySelector("#owner-modal .dialog-card").getBoundingClientRect().width<=innerWidth','modal fits '+width);
 await run('A.closeModal(true)');
}
await run('document.querySelector("[data-owner=review-details][data-id=review-5]").click();document.querySelector("[name=visible]").click();document.querySelector("[name=reason]").value="Other";document.querySelector("[data-review-form]").requestSubmit()');
await check('!!document.querySelector(".owner-error").textContent','reason validation');
await run('document.querySelector("[name=notes]").value="Off topic";A.owner.saveError=true;document.querySelector("[data-review-form]").requestSubmit()');
await check('!A.reviews.records[4].hidden&&document.querySelector("[name=notes]").value==="Off topic"','failed save preserves inputs');
await run('A.owner.saveError=false;document.querySelector("[data-review-form]").requestSubmit()');
await check('A.reviews.records[4].hidden&&A.reviews.records[4].history.length===1','toggle hides review');
await run('document.querySelector("[data-owner=review-details][data-id=review-5]").click();document.querySelector("[name=visible]").click();document.querySelector("[data-review-form]").requestSubmit()');
await check('!A.reviews.records[4].hidden&&A.reviews.records[4].history.length===2','toggle restores review');
await send('Emulation.clearDeviceMetricsOverride');
await run('document.querySelector("[data-owner=review-details][data-id=review-5]").click()');
const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('verification/owner-reviews-modal.png',Buffer.from(shot.result.data,'base64'));
assert.deepEqual(errors,[]);console.log(n+' checks passed');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});

