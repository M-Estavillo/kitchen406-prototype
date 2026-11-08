const assert=require('node:assert/strict'),path=require('node:path');
(async()=>{
 const tabs=await(await fetch('http://127.0.0.1:9223/json')).json();const ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let serial=0;const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)(m);pending.delete(m.id);}};
 const send=(method,params={})=>new Promise(r=>{pending.set(++serial,r);ws.send(JSON.stringify({id:serial,method,params}));});
 const run=async expression=>{const m=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(m.result.exceptionDetails)throw Error(JSON.stringify(m.result.exceptionDetails));return m.result.result.value;};
 const check=async(expr,label)=>{assert(await run(expr),label);console.log('PASS '+label);};
 await send('Page.navigate',{url:require('node:url').pathToFileURL(path.resolve('index.html')).href});await new Promise(r=>setTimeout(r,2000));
 await run('window.A=K406;window.O=A.owner;A.session.enter();O.seed();location.hash="#/owner/orders"');await new Promise(r=>setTimeout(r,200));
 await check('!!document.querySelector(".owner-order-filters")&&!document.querySelector("#owner-type,#owner-method,#owner-state,#owner-from,#owner-to")','only compact filters remain');
 await check('!document.querySelector(".owner-order-filters").textContent.includes("Apply")','no apply button');
 await run('O.filters.type="cake";O.filters.method="pickup";O.filters.state="completed";O.filters.query="OWNER-DEMO-COURIER";O.render()');
 await check('document.querySelector(".owner-order-list").textContent.includes("OWNER-DEMO-COURIER")','removed filters cannot hide orders');
 await run('let input=document.querySelector("#owner-query");input.value="OWNER-DEMO-COURIER";input.dispatchEvent(new Event("input",{bubbles:true}))');
 await check('document.querySelectorAll(".owner-order-list article").length===1&&document.activeElement.id==="owner-query"','live search preserves focus');
 await run('document.querySelector("[data-owner=clear-filters]").click();document.querySelector("#owner-order-range summary").click();[...document.querySelectorAll("[data-order-range=day]")].find(b=>b.dataset.date.endsWith("-20")).click();document.querySelector("[data-order-range=prev]").click();[...document.querySelectorAll("[data-order-range=day]")].find(b=>b.dataset.date.endsWith("-10")).click()');
 await check('O.filters.from.endsWith("-10")&&O.filters.to.endsWith("-20")&&O.filters.from<O.filters.to&&!document.querySelector("#owner-order-range").open','cross-month reverse selection normalizes and applies range');
 await run('document.querySelector("[data-owner=clear-filters]").click();document.querySelector("#owner-order-range summary").click();document.querySelector("[data-order-range=day]").click();document.querySelector("[data-order-range=day]").click()');
 await check('O.filters.from===O.filters.to&&!!O.filters.from','same-day range supported');
 await run('document.querySelector("[data-owner=clear-filters]").click();document.querySelector("#owner-sort").value="oldest";document.querySelector("#owner-sort").dispatchEvent(new Event("change",{bubbles:true}))');
 await check('O.filters.sort==="oldest"&&O.page===1','sort applies automatically');
 for(const width of [1440,768,390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await run('document.querySelector("#owner-order-range").open=false;document.querySelector("#owner-order-range summary").click()');await check('document.documentElement.scrollWidth<=innerWidth+1&&document.querySelector(".owner-range-popover").getBoundingClientRect().right<=innerWidth','calendar and page fit '+width);}
 await check('getComputedStyle(document.querySelector("#owner-query")).backgroundColor==="rgb(255, 255, 255)"&&getComputedStyle(document.querySelector(".owner-order-tabs .btn")).borderRadius==="999px"','white filters and pill styling');
 await send('Browser.close');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
