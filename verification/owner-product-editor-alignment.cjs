const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
const tabs=await(await fetch('http://127.0.0.1:9222/json')).json(),ws=new WebSocket(tabs.find(t=>t.type==='page'&&t.url==='about:blank')?.webSocketDebuggerUrl||tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const pending=new Map(),errors=[];ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};const send=(method,params={})=>new Promise(r=>{pending.set(++id,r);ws.send(JSON.stringify({id,method,params}));});const run=async expression=>{const m=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(m.result.exceptionDetails)throw Error(JSON.stringify(m.result.exceptionDetails));return m.result.result.value;};const wait=()=>new Promise(r=>setTimeout(r,300));const go=async p=>{await run(`location.hash='#/owner/${p}'`);await wait();};let n=0;const check=async(s,l)=>{assert(await run(s),l);console.log('PASS '+l);n++;};
await send('Runtime.enable');await send('Page.navigate',{url:'file:///D:/kitchen406-prototype/index.html'});await new Promise(r=>setTimeout(r,1800));await run('window.A=K406;A.session.enter();A.owner.seed()');





await go('products/19/edit');
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});
await check('(()=>{const a=document.querySelector("select[name=category]").getBoundingClientRect(),b=document.querySelector(".owner-variant-picker summary").getBoundingClientRect();return Math.abs(a.top-b.top)<2&&Math.abs(a.height-b.height)<2})()','category and variants aligned');
await check('getComputedStyle(document.querySelector(".owner-variant-picker")).borderTopWidth==="0px"','no variant separator');
await check('(()=>{const a=document.querySelector("select[name=category]").getBoundingClientRect(),b=document.querySelector(".owner-product-prices input:not(:disabled)").getBoundingClientRect();return Math.abs(a.width-b.width)<2})()','price matches category width');
await check('(()=>{const a=document.querySelector(".owner-product-prices input:not(:disabled)").getBoundingClientRect(),b=document.querySelector(".owner-product-switch input").getBoundingClientRect();return Math.abs(a.top+a.height/2-b.top-b.height/2)<3})()','switch aligns with price');
await check('document.querySelector(".owner-product-editor").textContent.includes("Recipe")&&!document.querySelector(".owner-product-editor").textContent.includes("Bill of Materials")','Recipe title');
await run('document.querySelector(".owner-variant-picker").open=true;document.querySelectorAll("[name=variants]")[1].click()');
await check('document.querySelectorAll("[name=variants]:checked").length===2','multi-select retained');
await check('document.querySelector("[name=variants]").getBoundingClientRect().height===15','checkbox sizing');
const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('verification/owner-product-editor-alignment.png',Buffer.from(shot.result.data,'base64'));
for(const width of [768,390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await check('document.documentElement.scrollWidth<=innerWidth+1','editor fits '+width);}
await send('Emulation.clearDeviceMetricsOverride');assert.deepEqual(errors,[]);console.log(n+' checks passed');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
