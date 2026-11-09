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
 await run("window.A=K406;window.O=A.owner;A.session.enter();O.seed();O.date=A.operations.find('OWNER-DEMO-PICKUP').fulfillment.date;location.hash='#/owner/capacity'");await wait();
 await check("!document.querySelector('[data-mode=day],#owner-calendar-date,[data-owner=calendar-today]')&&!!document.querySelector('.staff-calendar-filters .owner-calendar-settings')",'simplified controls and settings with filters');
 await check("document.querySelectorAll('.staff-calendar-weekdays span').length===7&&document.querySelectorAll('.owner-capacity-pools>section').length===3",'weekday header and independent capacity pools');
 await check("document.querySelector('.staff-calendar-agenda').textContent.includes('OWNER-DEMO-PICKUP')",'selected-day agenda shows commitments');
 for(const mode of ['month','week']){await run(`document.querySelector('[data-owner=calendar-mode][data-mode=${mode}]').click()`);await check(`O.calendarMode==='${mode}'`,'switch '+mode);}
 await check("[...document.querySelectorAll('.staff-day-orders')].every(e=>e.querySelectorAll('a').length<=1)&&!!document.querySelector('.staff-calendar-order-count')",'one order preview and more badge');
 await check("!!document.querySelector('.staff-calendar-agenda + .owner-capacity-summary')&&!document.querySelector('.owner-capacity-allocations')",'capacity summary follows agenda without allocations panel');
 await run("window.before=O.date;document.querySelector('[data-owner=calendar-next]').click();document.querySelector('[data-owner=calendar-prev]').click()");await check("O.date===before",'date navigation');
 await run("document.querySelector('[data-owner=calendar-date]').click()");await check("document.querySelector('.staff-day[aria-current] .staff-day-select').dataset.date===O.date",'select day');
 await run("A.$('owner-calendar-type').value='cake';A.$('owner-calendar-type').dispatchEvent(new Event('change',{bubbles:true}))");await check("O.calendarType==='cake'&&document.querySelectorAll('.owner-capacity-pools>section').length===3",'order filter preserves all capacity pools');
 await run("O.calendarType='all';O.render()");
 for(const width of [1440,768,390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await wait();await check("document.documentElement.scrollWidth<=innerWidth+1",'page fits '+width);}
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});await wait();
 await check("(()=>{const agenda=document.querySelector('.staff-calendar-agenda').getBoundingClientRect(),capacity=document.querySelector('.owner-capacity-summary').getBoundingClientRect(),cards=[...document.querySelectorAll('.owner-capacity-pools>section')].map(e=>e.getBoundingClientRect());return agenda.width===capacity.width&&cards.every(card=>card.top===cards[0].top)})()",'capacity matches agenda width and all three cards sit side by side');
 await run("O.date=A.operations.find('OWNER-DEMO-PICKUP').fulfillment.date;O.render();A.$('toast').hidden=true");await wait();
 const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});require('node:fs').writeFileSync('verification/owner-capacity-desktop.png',Buffer.from(shot.result.data,'base64'));
 }finally{ws.close();await fetch('http://127.0.0.1:9222/json/close/'+target.id);}
})().catch(e=>{console.error(e);process.exit(1)});
