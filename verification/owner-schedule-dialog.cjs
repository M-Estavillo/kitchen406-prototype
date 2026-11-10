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
 await run("location.hash='#/owner/subscriptions/offerings'");await wait();
 await check("location.hash==='#/owner/subscriptions/schedules'&&!document.querySelector('.owner-subscription-tabs a[href$=offerings]')&&document.querySelector('.owner-subscription-tabs [aria-current=page]').textContent==='Offerings'","retired capacity route resolves to Offerings");
 await check("[...document.querySelectorAll('.owner-weekly-schedules th')].map(e=>e.textContent).join('|')==='Product|Preparation|Fulfillment|Status|Action'",'offering column order');
 await check("!document.querySelector('.owner-weekly-schedules td:first-child a')&&document.querySelector('.owner-weekly-schedules').closest('section').querySelector('h2').textContent==='Subscription Offerings'",'plain-text products and table title');
 await check("(()=>{const products=[...document.querySelectorAll('.owner-weekly-schedules tbody tr td:first-child')].map(e=>e.textContent.trim());return products.length===A.products.filter(p=>p.subscription).length&&new Set(products).size===products.length})()",'one sample offering per eligible product');
 await run("document.querySelector('[data-owner=schedule][data-id]').click();window.f=document.querySelector('[data-owner-form=schedule]');window.scheduleId=f.dataset.id");
 await check("document.querySelector('#owner-dialog-title').textContent==='Edit offering'&&!!f.querySelector('[role=switch]')&&f.elements.product_id.tagName==='SELECT'&&f.elements.product_id.required&&!f.elements.label",'edit dialog toggle and simplified copy');
 await check("(()=>{const a=f.querySelector('.owner-settings-actions').children;const x=a[0].getBoundingClientRect(),y=a[1].getBoundingClientRect();return Math.abs(x.top-y.top)<1&&Math.abs(y.left-x.right-8)<1})()",'dialog actions adjacent and aligned');
 await run("f.elements.status.click()");
 await check("document.querySelector('#owner-dialog-title').textContent==='Deactivate subscription?'",'switching off prompts for confirmation');
 await run("document.querySelector('[data-owner=subscription-deactivation-cancel]').click()");
 await check("f.isConnected&&f.elements.status.checked",'cancel restores the active switch');
 await run("f.elements.status.click();O.saveError=true;document.querySelector('[data-owner=subscription-deactivation-confirm]').click()");
 await check("A.modal==='owner-modal'&&document.querySelector('#owner-modal .owner-error').textContent&&A.subscriptions.schedules.find(s=>s.id===scheduleId).status==='active'",'failed deactivation leaves the offering active');
 await run("O.saveError=false;document.querySelector('[data-owner=subscription-deactivation-confirm]').click()");await wait();
 await check("!A.modal&&A.subscriptions.schedules.find(s=>s.id===scheduleId).status==='inactive'",'confirmed deactivation saves immediately');
 await run("document.querySelector('[data-owner=schedule][data-id]').click()");await check("!document.querySelector('[data-owner-form=schedule]').elements.status.checked",'saved toggle restored');await run("A.closeModal(true)");
 await run("document.querySelector('[data-owner=schedule]:not([data-id])').click()");
 await check("document.querySelector('#owner-dialog-title').textContent==='Add offering'&&document.querySelector('[data-owner-form=schedule]').elements.status.checked",'add dialog defaults active');
 await run("A.closeModal(true)");
 for(const isNew of [true,false])for(const close of ['cancel','x']){
 await run(`A.ownerScheduleUI.open(${isNew?"''":"scheduleId"});window.form=document.querySelector('[data-owner-form=schedule]');window.savedDay=form.elements.day.value;form.elements.day.value=String((Number(savedDay)+1)%7);form.elements.day.dispatchEvent(new Event('input',{bubbles:true}));document.querySelector(${JSON.stringify(close==='cancel'?"[data-owner-form=schedule] [data-owner=cancel-cake-modal]":"#owner-modal [data-close-modal]")}).click()`);
 await check("!A.modal&&!document.querySelector('#owner-dismiss-warning')&&!O.drafts.has(O.draftKey(form))",(isNew?'add':'edit')+' '+close+' discards without prompt');
 await run(`A.ownerScheduleUI.open(${isNew?"''":"scheduleId"})`);await check("document.querySelector('[data-owner-form=schedule]').elements.day.value===savedDay",'reopen uses saved values');await run("A.closeModal(true)");
 }
 await run("A.ownerScheduleUI.open('')");
 for(const width of [1440,390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await wait();await check("document.documentElement.scrollWidth<=innerWidth+1&&document.querySelector('#owner-modal .dialog-card').scrollWidth<=document.querySelector('#owner-modal .dialog-card').clientWidth+1",'schedule layout fits '+width);}
 await run("A.closeModal(true);window.product=A.products.find(p=>!p.subscription);location.hash='#/owner/products/'+product.id+'/edit'");await wait();
 await run("window.productForm=document.querySelector('[data-owner-form=product]');productForm.elements.subscription.click()");
 await check("(()=>{const setup=document.querySelector('[data-owner-form=schedule]');return setup.elements.product_id.type==='hidden'&&Number(setup.elements.product_id.value)===product.id&&setup.textContent.includes(product.name)})()",'product setup fixes the product');
 await check("(()=>{const setup=document.querySelector('[data-owner-form=schedule]'),name=setup.querySelector('.owner-schedule-product p'),fulfillment=setup.elements.day,preparation=setup.elements.preparation_day;const x=fulfillment.getBoundingClientRect(),y=preparation.getBoundingClientRect();const nameStyle=getComputedStyle(name),dayStyle=getComputedStyle(fulfillment);return name.getBoundingClientRect().bottom<x.top&&Math.abs(x.top-y.top)<1&&x.right<y.left&&nameStyle.fontSize===dayStyle.fontSize&&nameStyle.color===dayStyle.color})()",'setup aligns both days below the product and matches the day text');
 await run("document.querySelector('[data-owner-form=schedule]').requestSubmit()");
 await check("!A.modal&&productForm.elements.subscription.checked&&!product.subscription",'schedule setup stays in the product draft');
 await run("productForm.requestSubmit()");await wait();
 await check("product.subscription&&A.subscriptions.availableSchedules(product.id).length===1",'saving the product activates its configured offering');
 await run("location.hash='#/owner/products/'+product.id+'/edit'");await wait();
 await run("window.productForm=document.querySelector('[data-owner-form=product]');productForm.elements.subscription.click()");
 await check("document.querySelector('#owner-dialog-title').textContent==='Deactivate subscription?'",'product edit uses the same deactivation confirmation');
 await run("document.querySelector('[data-owner=subscription-deactivation-confirm]').click();productForm.requestSubmit()");await wait();
 await check("!product.subscription&&!A.subscriptions.availableSchedules(product.id).length",'saving the confirmed product change deactivates its offerings');
 await run("location.hash='#/owner/subscriptions/schedules'");await wait();
 await run("document.querySelector('[data-owner=schedule]:not([data-id])').click();window.addForm=document.querySelector('[data-owner-form=schedule]');window.existing=A.subscriptions.schedules.find(s=>s.status==='active');addForm.elements.product_id.value=String(existing.product_id);addForm.elements.preparation_day.value='5';addForm.elements.day.value='6';addForm.requestSubmit()");await wait();
 await check("!A.modal&&A.subscriptions.availableSchedules(existing.product_id).some(s=>s.day===5)&&A.subscriptions.availableSchedules(existing.product_id).some(s=>s.day===6)",'an owner can still add a second schedule for a product');
 }finally{ws.close();await fetch('http://127.0.0.1:9222/json/close/'+target.id);}
})().catch(e=>{console.error(e);process.exit(1)});
