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
 await run("window.A=K406;window.O=A.owner;A.session.enter();O.seed();location.hash='#/owner/subscriptions'");await wait();
 await check("document.querySelectorAll('.owner-subscription-card').length>0&&!!document.querySelector('.owner-subscription-tabs [aria-current]')",'record cards and active section');
 await run("document.querySelector('.owner-subscription-filters [name=query]').value='NO-MATCH';document.querySelector('.owner-subscription-filters [name=query]').dispatchEvent(new Event('input',{bubbles:true}))");
 await check("!document.querySelector('.owner-subscription-card')",'live search empty results');await run("document.querySelector('[data-owner=clear-filters]').click()");
 await run("location.hash='#/owner/subscriptions/schedules'");await wait();await run("document.querySelector('[data-owner=schedule]').click()");
 await check("A.modal==='owner-modal'&&!!document.querySelector('[data-owner-form=schedule] [data-owner=cancel-cake-modal]')",'schedule dialog has Cancel');
 await run("document.querySelector('[data-owner-form=schedule] [data-owner=cancel-cake-modal]').click()");
 await check("!A.modal",'schedule Cancel closes');
 await run("location.hash='#/owner/subscriptions/offerings'");await wait();await run("document.querySelector('[data-owner=subscription-offering]').click()");
 await check("A.modal==='owner-modal'&&document.querySelector('#owner-modal .dialog-card').getBoundingClientRect().width<=420",'offering modal fits content');
 await run("A.closeModal(true)");
 for(const width of [1440,768,390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});for(const route of ['','schedules','offerings','requests']){await run(`location.hash='#/owner/subscriptions/${route}'`);await wait();await check("document.documentElement.scrollWidth<=innerWidth+1",'subscriptions '+route+' fits '+width);}}
 await run("location.hash='#/owner/capacity/settings';A.capacity.block(O.date,'Test block')");await wait();await run("O.render();document.querySelector('[data-owner=unblock]').click()");
 await check("!!document.querySelector('.owner-unblock-dialog [data-owner=cancel-cake-modal]')",'unblock has Cancel');await run("document.querySelector('.owner-unblock-dialog [data-owner=cancel-cake-modal]').click()");await check("!A.modal&&A.schedule.config.blocked.includes(O.date)",'unblock Cancel preserves block');
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});await run("location.hash='#/owner/subscriptions';A.$('toast').hidden=true");await wait();
 const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});require('node:fs').writeFileSync('verification/owner-subscriptions-design.png',Buffer.from(shot.result.data,'base64'));
 }finally{ws.close();await fetch('http://127.0.0.1:9222/json/close/'+target.id);}
})().catch(e=>{console.error(e);process.exit(1)});
