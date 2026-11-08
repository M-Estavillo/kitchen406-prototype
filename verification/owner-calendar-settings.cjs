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
 await run("window.A=K406;window.O=A.owner;A.session.enter();O.seed();O.date=A.operations.find('OWNER-DEMO-PICKUP').fulfillment.date;location.hash='#/owner/capacity/settings'");await wait();
 await check("document.querySelector('#owner-view h1').textContent==='Calendar Settings'&&!document.querySelector('#owner-block-warning,.owner-calendar-settings-page table')",'compact settings without old form and table');
 await check("document.querySelectorAll('[data-owner-form=settings] button[type=submit]').length===1&&!!document.querySelector('[data-owner-form=settings] .owner-settings-actions [data-owner=discard]')",'settings actions share footer');
 for(const mode of ['month','week']){await run(`document.querySelector('[data-owner=calendar-mode][data-mode=${mode}]').click()`);await check(`document.querySelectorAll('.owner-block-days button').length===${mode==='month'?42:7}`,'blocked calendar '+mode);}
 await run("document.querySelector('[data-owner=block-date]').click()");
 await check("A.modal==='owner-modal'&&!!document.querySelector('[name=category]')",'block confirmation includes category');
 await run("window.f=document.querySelector('[data-owner-form=block]');f.elements.category.value='Maintenance';f.elements.reason.value='Oven servicing';f.elements.reason.dispatchEvent(new Event('input',{bubbles:true}));O.saveError=true;f.requestSubmit()");
 await check("!A.schedule.config.blocked.includes(O.date)&&f.elements.reason.value==='Oven servicing'",'failed block retains input');
 await run("O.saveError=false;f.requestSubmit()");await wait();
 await check("!A.modal&&A.schedule.config.blocked.includes(O.date)&&A.capacity.blocks.get(O.date).reason==='Maintenance: Oven servicing'&&!!document.querySelector('.owner-block-days .is-blocked[aria-pressed=true]')",'block saved and marked red');
 await check("A.operations.find('OWNER-DEMO-PICKUP').fulfillment.date===O.date",'existing commitment preserved');
 await run("document.querySelector('[data-owner=unblock]').click();document.querySelector('[data-owner=confirm-unblock]').click()");await wait();
 await check("!A.schedule.config.blocked.includes(O.date)&&!document.querySelector('.owner-block-days .is-blocked[aria-pressed=true]')",'unblock selected date');
 await run("window.original=A.schedule.config.standardUnits;A.$('owner-standardUnits').value='99';A.$('owner-standardUnits').dispatchEvent(new Event('input',{bubbles:true}));document.querySelector('[data-owner=discard]').click()");
 await check("A.$('owner-standardUnits').value===String(original)",'discard settings restores values');
 for(const width of [1440,768,390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await wait();await check("document.documentElement.scrollWidth<=innerWidth+1",'settings fits '+width);}
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});await run("A.$('toast').hidden=true");await wait();
 const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});require('node:fs').writeFileSync('verification/owner-calendar-settings.png',Buffer.from(shot.result.data,'base64'));
 }finally{ws.close();await fetch('http://127.0.0.1:9222/json/close/'+target.id);}
})().catch(e=>{console.error(e);process.exit(1)});
