const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
const tabs=await(await fetch('http://127.0.0.1:9222/json')).json(),ws=new WebSocket(tabs.find(t=>t.type==='page'&&t.url==='about:blank')?.webSocketDebuggerUrl||tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const pending=new Map(),errors=[];ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};const send=(method,params={})=>new Promise(r=>{pending.set(++id,r);ws.send(JSON.stringify({id,method,params}));});const run=async expression=>{const m=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(m.result.exceptionDetails)throw Error(JSON.stringify(m.result.exceptionDetails));return m.result.result.value;};const wait=()=>new Promise(r=>setTimeout(r,300));const go=async p=>{await run(`location.hash='#/owner/${p}'`);await wait();};let n=0;const check=async(s,l)=>{assert(await run(s),l);console.log('PASS '+l);n++;};
await send('Runtime.enable');await send('Page.navigate',{url:'file:///D:/kitchen406-prototype/index.html'});await new Promise(r=>setTimeout(r,1800));await run('window.A=K406;A.session.enter();A.owner.seed()');





const candidates=await run('A.operations.list().filter(o=>o.paid&&o.type!=="subscription_purchase").map(o=>o.id)');
const found=new Map();
for(const id of candidates){await go('orders/'+id);const buttons=await run('[...document.querySelectorAll(".owner-order-detail [data-owner=transition],.owner-order-detail [data-owner=book]")].map(b=>({action:b.dataset.owner,target:b.dataset.target||"courier"}))');for(const b of buttons)if(!found.has(b.target))found.set(b.target,{id,...b});}
assert(found.has('preparing'),'start preparation fixture exists');
for(const [target,b] of found){
 await go('orders/'+b.id);
 for(const width of [1440,390,320]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
  await run('document.querySelector(".owner-order-detail [data-owner='+b.action+']").click()');
  await check('!!document.querySelector(".owner-order-confirm [data-owner=discard-modal]")&&getComputedStyle(document.querySelector(".owner-order-confirm-actions")).justifyContent==="flex-end"','cancel and aligned actions '+target+' '+width);
  await check('document.querySelector("#owner-modal .dialog-card").getBoundingClientRect().width<=innerWidth','dialog fits '+target+' '+width);
  await run('document.querySelector(".owner-order-confirm [data-owner=discard-modal]").click()');
  await check('A.$("owner-modal").hidden','cancel closes '+target+' '+width);
 }
}
const first=found.get('preparing');await go('orders/'+first.id);
await run('document.querySelector("[data-owner=transition]").click();A.owner.saveError=true;document.querySelector("[data-owner=confirm-transition]").click()');
await check('!A.$("owner-modal").hidden&&document.querySelector(".owner-order-confirm .owner-error").textContent.includes("could not")','save error retained in compact dialog');
await run('A.owner.saveError=false;A.closeModal(true)');
await send('Emulation.clearDeviceMetricsOverride');assert.deepEqual(errors,[]);console.log(n+' checks passed; dialogs: '+[...found.keys()].join(', '));ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
