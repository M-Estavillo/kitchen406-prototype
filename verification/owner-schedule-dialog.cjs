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
 await run("window.A=K406;window.O=A.owner;A.session.enter();O.seed();window.r=A.subscriptions.allRecords()[0];location.hash='#/owner/subscriptions/'+r.id");await wait();
 await check("!document.querySelector('.owner-subscription-tabs')",'details omit section tabs');
 await run("location.hash='#/owner/subscriptions/schedules'");await wait();
 await check("[...document.querySelectorAll('.owner-weekly-schedules th')].map(e=>e.textContent).join('|')==='Schedule / product|Preparation / fulfillment|Existing subscriptions|Status|Action'",'schedule column order');
 await run("document.querySelector('[data-owner=schedule][data-id]').click();window.f=document.querySelector('[data-owner-form=schedule]');window.scheduleId=f.dataset.id");
 await check("document.querySelector('#owner-dialog-title').textContent==='Edit schedule'&&!!f.querySelector('[role=switch]')&&!f.textContent.includes('active subscriptions retain')",'edit dialog toggle and simplified copy');
 await check("(()=>{const a=f.querySelector('.owner-settings-actions').children;const x=a[0].getBoundingClientRect(),y=a[1].getBoundingClientRect();return Math.abs(x.top-y.top)<1&&Math.abs(y.left-x.right-8)<1})()",'dialog actions adjacent and aligned');
 await run("f.elements.status.checked=false;f.elements.status.dispatchEvent(new Event('input',{bubbles:true}));O.saveError=true;f.requestSubmit()");
 await check("A.modal==='owner-modal'&&!f.elements.status.checked",'failed save retains inactive toggle');
 await run("O.saveError=false;f.requestSubmit()");await wait();
 await check("!A.modal&&A.subscriptions.schedules.find(s=>s.id===scheduleId).status==='inactive'",'inactive toggle saved');
 await run("document.querySelector('[data-owner=schedule][data-id]').click()");await check("!document.querySelector('[data-owner-form=schedule]').elements.status.checked",'saved toggle restored');await run("A.closeModal(true)");
 await run("document.querySelector('[data-owner=schedule]:not([data-id])').click()");
 await check("document.querySelector('#owner-dialog-title').textContent==='Add schedule'&&document.querySelector('[data-owner-form=schedule]').elements.status.checked",'add dialog defaults active');
 await run("A.closeModal(true)");
 for(const isNew of [true,false])for(const close of ['cancel','x']){
 await run(`A.ownerScheduleUI.open(${isNew?"''":"scheduleId"});window.form=document.querySelector('[data-owner-form=schedule]');window.savedLabel=form.elements.label.value;form.elements.label.value='Unsaved change';form.elements.label.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector(${JSON.stringify(close==='cancel'?"[data-owner-form=schedule] [data-owner=cancel-cake-modal]":"#owner-modal [data-close-modal]")}).click()`);
 await check("!A.modal&&!document.querySelector('#owner-dismiss-warning')&&!O.drafts.has(O.draftKey(form))",(isNew?'add':'edit')+' '+close+' discards without prompt');
 await run(`A.ownerScheduleUI.open(${isNew?"''":"scheduleId"})`);await check("document.querySelector('[data-owner-form=schedule]').elements.label.value===savedLabel",'reopen uses saved values');await run("A.closeModal(true)");
 }
 await run("A.ownerScheduleUI.open('')");
 for(const width of [1440,390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await wait();await check("document.documentElement.scrollWidth<=innerWidth+1&&document.querySelector('#owner-modal .dialog-card').scrollWidth<=document.querySelector('#owner-modal .dialog-card').clientWidth+1",'schedule layout fits '+width);}
 }finally{ws.close();await fetch('http://127.0.0.1:9222/json/close/'+target.id);}
})().catch(e=>{console.error(e);process.exit(1)});
