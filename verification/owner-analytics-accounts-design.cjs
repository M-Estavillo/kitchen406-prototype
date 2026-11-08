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
 await check("!document.querySelector('[data-analytics-form],#owner-report-from,#owner-report-to')&&!A.$('owner-view').textContent.includes('Product performance')",'simplified analytics controls and content');
 await run("A.$('owner-period').value='week';A.$('owner-period').dispatchEvent(new Event('change',{bubbles:true}))");await check("R.period==='week'",'period applies immediately');
 await run("document.querySelector('#owner-order-range summary').click();window.days=[...document.querySelectorAll('[data-order-range=day]')];days[0].click();document.querySelectorAll('[data-order-range=day]')[3].click()");
 await check("R.period==='custom'&&R.from.endsWith('-01')&&R.to.endsWith('-04')",'shared date picker applies range');
 await run("document.querySelector('[data-owner=analytics-clear]').click()");await check("R.period==='month'",'clear resets period');
 await run("location.hash='#/owner/accounts/staff'");await wait();await check("document.querySelectorAll('.owner-staff-card').length===A.staff.accounts.length",'staff cards show registry');
 await check("!document.querySelector('[aria-label=\"Account categories\"],[data-account-filter] button[type=submit]')&&!A.$('owner-view').textContent.includes('Manage the predefined')",'staff-only simplified controls');
 await run("A.$('owner-account-status').value='inactive';A.$('owner-account-status').dispatchEvent(new Event('change',{bubbles:true}))");await check("document.querySelectorAll('.owner-staff-card').length===A.staff.accounts.filter(r=>r.status==='inactive').length",'status filters immediately');
 await run("document.querySelector('[data-owner=account-clear]').click();A.$('owner-account-query').value='NO MATCH';A.$('owner-account-query').dispatchEvent(new Event('input',{bubbles:true}))");await check("!document.querySelector('.owner-staff-card')",'search filters immediately');await run("document.querySelector('[data-owner=account-clear]').click()");
 await check("A.$('owner-account-query').getBoundingClientRect().height===A.$('owner-account-status').getBoundingClientRect().height",'search height matches dropdowns');
 await run("document.querySelector('[data-owner=account-edit][data-id]').click()");await check("!!document.querySelector('[data-account-form] .owner-settings-actions')&&document.querySelector('#owner-modal .dialog-card').getBoundingClientRect().width<=460",'compact edit staff dialog');await check("!document.querySelector('[data-account-form]').textContent.includes('Role: Staff')",'editor omits role text');await run("A.closeModal(true)");
 await run("document.querySelector('[data-owner=account-status]').click()");await check("!!document.querySelector('.owner-staff-confirm')",'compact status confirmation');await run("document.querySelector('.owner-staff-confirm [data-owner=cancel-stock]').click()");await check("!A.modal",'status cancel closes');
 await run("location.hash='#/owner/accounts/customers'");await wait();await wait();await check("location.hash==='#/owner/accounts/staff'&&!document.querySelector('.owner-customer-accounts')",'customer directory redirects to staff');
 for(const width of [1440,768,390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});for(const route of ['analytics','accounts/staff']){await run(`location.hash='#/owner/${route}'`);await wait();await check("document.documentElement.scrollWidth<=innerWidth+1",route+' fits '+width);}}
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1100,deviceScaleFactor:1,mobile:false});await run("A.$('toast').hidden=true");await wait();const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});require('node:fs').writeFileSync('verification/owner-staff-accounts-design.png',Buffer.from(shot.result.data,'base64'));
 }finally{ws.close();await fetch('http://127.0.0.1:9222/json/close/'+target.id);}
})().catch(e=>{console.error(e);process.exit(1)});
