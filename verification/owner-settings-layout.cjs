const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
const tabs=await(await fetch('http://127.0.0.1:9222/json')).json(),ws=new WebSocket(tabs.find(t=>t.type==='page'&&t.url==='about:blank')?.webSocketDebuggerUrl||tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const pending=new Map(),errors=[];ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};const send=(method,params={})=>new Promise(r=>{pending.set(++id,r);ws.send(JSON.stringify({id,method,params}));});const run=async expression=>{const m=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(m.result.exceptionDetails)throw Error(JSON.stringify(m.result.exceptionDetails));return m.result.result.value;};const wait=()=>new Promise(r=>setTimeout(r,300));const go=async p=>{await run(`location.hash='#/owner/${p}'`);await wait();};let n=0;const check=async(s,l)=>{assert(await run(s),l);console.log('PASS '+l);n++;};
await send('Runtime.enable');await send('Page.navigate',{url:'file:///D:/kitchen406-prototype/index.html'});await new Promise(r=>setTimeout(r,1800));await run('window.A=K406;A.session.enter();A.owner.seed()');




await go('settings');
for(const width of [1440,768,390,320]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
 await check('document.documentElement.scrollWidth<=innerWidth+1','settings fits '+width);
 for(const kind of ['profile','password','email']){
  await run('document.querySelector("[data-owner=settings-'+kind+']").click()');
  await check('document.querySelector("#owner-modal .dialog-card").getBoundingClientRect().width<=innerWidth&&getComputedStyle(document.querySelector("[data-settings-form] .staff-actions")).justifyContent==="flex-end"','dialog '+kind+' fits and actions right '+width);
  await run('var input=document.querySelector("[data-settings-form] input");input.value="Unsaved";input.dispatchEvent(new Event("input",{bubbles:true}));document.querySelector("#owner-modal [data-close-modal]").click()');
  await check('A.$("owner-modal").hidden&&!document.querySelector("#owner-dismiss-warning")','close discards '+kind+' '+width);
 }
}
await run('document.querySelector("[data-owner=settings-profile]").click()');
await check('document.querySelector("[name=first_name]").value===A.session.owner.first_name','profile reopens saved values');
await run('document.querySelector("[name=first_name]").value="Unsaved";document.querySelector("[data-owner=discard-modal]").click();document.querySelector("[data-owner=settings-profile]").click()');
await check('document.querySelector("[name=first_name]").value===A.session.owner.first_name','cancel discards');
await run('document.querySelector("[name=first_name]").value="Updated";document.querySelector("[name=mobile_number]").value="09171234567";A.owner.saveError=true;document.querySelector("[data-settings-form]").requestSubmit()');
await check('document.querySelector(".owner-error").textContent.includes("could not")&&A.session.owner.first_name!=="Updated"','save failure preserves original');
await run('A.owner.saveError=false;document.querySelector("[data-settings-form]").requestSubmit()');
await check('A.session.owner.first_name==="Updated"','profile save');
await run('document.querySelector("[data-owner=settings-email]").click();document.querySelector("[name=email]").value="new.owner@example.com";document.querySelector("[name=current]").value="Kitchen406!";document.querySelector("[data-settings-form]").requestSubmit()');await wait();
await check('!!document.querySelector("[data-settings-form=verify]")&&getComputedStyle(document.querySelector("[data-settings-form] .staff-actions")).justifyContent==="flex-end"','verification layout');
await run('document.querySelector("[name=code]").value="unsaved";document.querySelector("#owner-modal [data-close-modal]").click()');
await check('A.$("owner-modal").hidden&&A.session.owner.email!=="new.owner@example.com"','verification close leaves email unchanged');
await send('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
const shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('verification/owner-settings-layout.png',Buffer.from(shot.result.data,'base64'));
await send('Emulation.clearDeviceMetricsOverride');assert.deepEqual(errors,[]);console.log(n+' checks passed');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});

