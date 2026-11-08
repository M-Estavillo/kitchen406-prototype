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
 await run("window.A=K406;window.O=A.owner;A.session.enter();O.seed();location.hash='#/owner/subscriptions/offerings'");await wait();
 await check("document.querySelector('#owner-view h1').textContent==='Capacity & Offerings'&&!document.querySelector('#owner-subscription-week,[data-owner-form=subscription-timing]')",'offering title and removed inline controls');
 await check("[...document.querySelectorAll('.owner-offerings-table th')].map(e=>e.textContent).join('|')==='Product / enrollment|Weekly capacity|Confirmed|Remaining|Action'",'capacity columns');
 await run("document.querySelector('[data-owner=subscription-timing]').click();window.f=document.querySelector('[data-owner-form=subscription-timing]');f.elements.value.value='3';f.elements.value.dispatchEvent(new Event('input',{bubbles:true}));O.saveError=true;f.requestSubmit()");
 await check("A.modal==='owner-modal'&&f.elements.value.value==='3'",'lead time failed save retains draft');
 await run("O.saveError=false;f.requestSubmit()");await wait();await check("!A.modal&&A.schedule.config.timing.subscription.value===3",'lead time saved');
 await run("location.hash='#/owner/subscriptions/requests'");await wait();
 await check("A.subscriptions.requests.filter(r=>r.fixture).length===1&&!!document.querySelector('.owner-defer-card-actions a')&&!document.querySelector('.staff-pager').textContent.includes('results')",'sample deferment with order link and clean pagination');
 await check("!document.querySelector('.owner-defer-card-copy a,[data-owner=defer-confirm-review]')&&!document.querySelector('.owner-defer-card').textContent.includes('Please move')",'cards omit clickable reference and detailed content');
 await run("O.seed()");await check("A.subscriptions.requests.filter(r=>r.fixture).length===1",'sample reload does not duplicate deferment');
 await run("document.querySelector('[data-owner=defer-details]').click()");await check("A.modal==='owner-modal'&&!!document.querySelector('.owner-defer-details [data-owner=cancel-cake-modal]')",'sample approval dialog');await check("document.querySelector('.owner-defer-details').textContent.includes('Please move')&&document.querySelectorAll('.owner-defer-dates dd').length===2",'details include dates and customer notes');await run("document.querySelector('[data-owner=defer-confirm-review][data-approve=true]').click()");await wait();await check("A.subscriptions.requests.find(r=>r.fixture).status==='approved'",'sample request can be approved');
 await run("location.hash='#/owner/subscriptions/offerings'");await wait();
 for(const close of ['cancel','x']){
 await run(`document.querySelector('[data-owner=subscription-timing]').click();window.form=document.querySelector('[data-owner-form=subscription-timing]');window.savedValue=form.elements.value.value;form.elements.value.value='9';form.elements.value.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector(${JSON.stringify(close==='cancel'?"[data-owner-form=subscription-timing] [data-owner=cancel-cake-modal]":"#owner-modal [data-close-modal]")}).click()`);
 await check("!A.modal&&!document.querySelector('#owner-dismiss-warning')&&!O.drafts.has(O.draftKey(form))",'lead time '+close+' discards without prompt');
 await run("document.querySelector('[data-owner=subscription-timing]').click()");await check("document.querySelector('[data-owner-form=subscription-timing]').elements.value.value===savedValue",'lead time reopens saved value');await run("A.closeModal(true)");
 }
 for(const width of [1440,390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});for(const route of ['offerings','requests']){await run(`location.hash='#/owner/subscriptions/${route}'`);await wait();await check("document.documentElement.scrollWidth<=innerWidth+1",route+' fits '+width);}await run("location.hash='#/owner/subscriptions/offerings'");await wait();await run("document.querySelector('[data-owner=subscription-timing]').click()");await check("document.querySelector('#owner-modal .dialog-card').scrollWidth<=document.querySelector('#owner-modal .dialog-card').clientWidth+1",'lead time modal fits '+width);await run("A.closeModal(true)");}
 }finally{ws.close();await fetch('http://127.0.0.1:9222/json/close/'+target.id);}
})().catch(e=>{console.error(e);process.exit(1)});
