const assert=require('node:assert/strict');
(async()=>{
 const target=await(await fetch('http://127.0.0.1:9222/json/new?about:blank',{method:'PUT'})).json();
 const ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let n=0;const pending=new Map();
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)(m);pending.delete(m.id);}};
 const send=(method,params={})=>new Promise(r=>{const id=++n;pending.set(id,r);ws.send(JSON.stringify({id,method,params}));});
 const run=async expression=>{const m=await send('Runtime.evaluate',{expression,returnByValue:true});if(m.result.exceptionDetails)throw Error(m.result.exceptionDetails.exception.description);return m.result.result.value;};
 const wait=()=>new Promise(r=>setTimeout(r,250));
 const check=async(s,label)=>{assert(await run(s),label);console.log('PASS '+label);};
 try{
 await send('Page.navigate',{url:'file:///D:/kitchen406-prototype/index.html'});await new Promise(r=>setTimeout(r,1700));
 await run("window.A=K406;window.O=A.owner;window.R=A.analytics;A.session.enter();O.seed();location.hash='#/owner/analytics'");await wait();
 await check("document.querySelectorAll('.owner-analytics-stats .staff-stat').length===4&&!!document.querySelector('.owner-analytics-trend svg')&&!!document.querySelector('.owner-sales-donut')",'metrics and charts render');
 await check("!document.querySelector('#owner-view').textContent.includes('Current estimated costs')&&!document.querySelector('#owner-view').textContent.includes('Sales basis:')",'removed verbose sections');
 await check("R.report().buckets.reduce((n,b)=>n+b.total,0)===R.report().total&&R.report().count===A.operations.list().filter(o=>o.paid&&o.type!=='subscription').length",'charts agree with recorded sales and exclude fulfillment children');
 await run("A.$('owner-performance-sort').value='quantity';A.$('owner-performance-sort').dispatchEvent(new Event('change',{bubbles:true}))");await check("R.sort==='quantity'",'product sort works');
 await run("window.f=document.querySelector('[data-analytics-form]');f.elements.period.value='custom';f.elements.period.dispatchEvent(new Event('change',{bubbles:true}));f.elements['report-from'].value='2026-11-08';f.elements['report-to'].value='2026-11-01';f.requestSubmit()");await check("!!f.querySelector('[role=alert]').textContent",'reversed date range validation');
 await run("f.elements['report-from'].value='2000-01-01';f.elements['report-to'].value='2000-01-02';f.requestSubmit()");await check("R.report().count===0&&!!document.querySelector('.owner-analytics-empty')",'empty reporting period');
 await run("R.period='month';O.render()");
 for(const width of [1440,768,390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await wait();await check("document.documentElement.scrollWidth<=innerWidth+1",'analytics fits '+width);}
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});await run("A.$('toast').hidden=true");await wait();const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});require('node:fs').writeFileSync('verification/owner-analytics-design.png',Buffer.from(shot.result.data,'base64'));
 }finally{ws.close();await fetch('http://127.0.0.1:9222/json/close/'+target.id);}
})().catch(e=>{console.error(e);process.exit(1)});
