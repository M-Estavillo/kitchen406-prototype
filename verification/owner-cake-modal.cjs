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
 await run("window.A=K406;A.session.enter();A.owner.seed();window.r=A.cakes.state.requests.find(r=>r.status==='pending_review');location.hash='#/owner/cake-requests/'+r.id");await wait();
 await check("!!document.querySelector('.owner-cake-back a')",'back link above detail cards');
 await run("document.querySelector('[data-owner=create-quotation]').click()");
 await check("A.modal==='owner-modal'&&!document.querySelector('#owner-method,#owner-fee,#owner-quote-preview')",'quotation opens as modal without removed controls');
 await check("!document.querySelector('#owner-modal [name=expiry],#owner-modal .owner-cake-back')&&!!document.querySelector('[data-owner-form=quotation] .owner-cake-modal-actions [data-owner=cancel-cake-modal]')",'simplified modal controls and Cancel beside Issue');
 await run("window.quoteForm=document.querySelector('[data-owner-form=quotation]');quoteForm.elements.complexity.value='125.50';quoteForm.elements.complexity.dispatchEvent(new Event('input',{bubbles:true}))");
 await check("document.querySelector('#owner-quote-breakdown').textContent.includes(A.cakes.money(12550))&&document.querySelector('#owner-quote-breakdown div:last-child dd').textContent===A.cakes.money(r.snapshot.options.reduce((n,x)=>n+x.price,0)+r.snapshot.addons.reduce((n,x)=>n+x.price*x.quantity,0)+12550)",'price breakdown recalculates complexity and total');
 for(const width of [1440,768,390,320]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});await wait();
 await check("document.documentElement.scrollWidth<=innerWidth+1&&document.querySelector('#owner-modal .dialog-card').scrollWidth<=document.querySelector('#owner-modal .dialog-card').clientWidth+1",'modal fits '+width);
 await check("(()=>{const a=[...document.querySelectorAll('.owner-cake-review-actions .btn')].map(e=>e.getBoundingClientRect());return a.length===2&&Math.abs(a[0].width-a[1].width)<1&&Math.abs(a[0].top-a[1].top)<1})()",'review actions share row equally '+width);
 }
 await run("window.form=document.querySelector('[data-owner-form=quotation]');form.elements.notes.value='Test design';form.elements.notes.dispatchEvent(new Event('input',{bubbles:true}));A.owner.saveError=true;form.requestSubmit()");await wait();
 await check("A.modal==='owner-modal'&&form.elements.notes.value==='Test design'",'failed save retains draft');
 await run("A.owner.saveError=false;form.requestSubmit()");await wait();
 await check("!A.modal&&A.cakes.versions(r).length===1&&A.cakes.versions(r)[0].snapshot.method===r.snapshot.method&&A.cakes.versions(r)[0].delivery_fee===0",'issue succeeds with original fulfillment and no delivery charge');
 await run("document.querySelector('[data-owner=reject-request]').click()");
 await check("!!document.querySelector('.owner-cake-reject [data-owner=cancel-cake-modal]')",'reject dialog has Cancel');
 await run("document.querySelector('.owner-cake-reject [data-owner=cancel-cake-modal]').click()");
 await check("!A.modal&&r.status==='quoted'",'Cancel preserves request');
 await run("location.hash='#/owner/cake-requests/'+r.id+'/quotation'");await wait();await wait();
 await check("A.modal==='owner-modal'&&location.hash==='#/owner/cake-requests/'+r.id",'legacy quotation route opens modal over request');
 }finally{ws.close();await fetch('http://127.0.0.1:9222/json/close/'+target.id);}
})().catch(e=>{console.error(e);process.exit(1)});
