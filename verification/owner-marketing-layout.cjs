const fs=require('node:fs'),assert=require('node:assert/strict');
(async()=>{
const tabs=await(await fetch('http://127.0.0.1:9222/json')).json(),ws=new WebSocket(tabs.find(t=>t.type==='page'&&t.url==='about:blank')?.webSocketDebuggerUrl||tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);let id=0;const pending=new Map(),errors=[];ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};const send=(method,params={})=>new Promise(r=>{pending.set(++id,r);ws.send(JSON.stringify({id,method,params}));});const run=async expression=>{const m=await send('Runtime.evaluate',{expression,awaitPromise:true,returnByValue:true});if(m.result.exceptionDetails)throw Error(JSON.stringify(m.result.exceptionDetails));return m.result.result.value;};const wait=()=>new Promise(r=>setTimeout(r,300));const go=async p=>{await run(`location.hash='#/owner/${p}'`);await wait();};let n=0;const check=async(s,l)=>{assert(await run(s),l);console.log('PASS '+l);n++;};
await send('Runtime.enable');await send('Page.navigate',{url:'file:///D:/kitchen406-prototype/index.html'});await new Promise(r=>setTimeout(r,1800));await run('window.A=K406;A.session.enter();A.owner.seed()');


await go('marketing');
await check('document.querySelectorAll(".owner-marketing-card").length===2','two posts per page');
await check('!document.querySelector("[data-owner=marketing-details]")','no details action');
await run('document.querySelector("[data-owner=next]").click()');
await check('A.owner.page===2&&document.querySelectorAll(".owner-marketing-card").length<=2','next page');
await run('document.querySelector("[data-owner=previous]").click()');
for(const width of [1440,768,390,320]){
 await send('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:false});
 await check('document.documentElement.scrollWidth<=innerWidth+1','cards fit '+width);
 for(const action of ['edit','approve','reject','occasions']){
  await run('document.querySelector("[data-owner=marketing-'+action+']").click()');
  await check('!A.$("owner-modal").hidden&&document.querySelector("#owner-modal .dialog-card").getBoundingClientRect().width<=innerWidth','dialog '+action+' fits '+width);
  await run('A.closeModal(true)');
 }
}
await run('document.querySelector("[data-owner=marketing-occasions]").click();document.querySelector("[data-owner=marketing-occasion]").click()');
await run('document.querySelector("[name=name]").value="Christmas";document.querySelector("[name=start]").value="2026-12-25";document.querySelector("[name=end]").value="2026-12-24";document.querySelector("[data-marketing-form]").requestSubmit()');
await check('!!document.querySelector(".owner-error").textContent','invalid occasion range');
await run('document.querySelector("[name=end]").value="2026-12-26";document.querySelector("[data-marketing-form]").requestSubmit()');
await check('!!document.querySelector(".owner-marketing-occasion-list article")&&location.hash==="#/owner/marketing"','occasion saves back to modal list');
await run('A.closeModal(true);window.d=A.marketing.drafts.find(d=>d.status==="pending");A.marketing.finalize(d,"approved");A.owner.filters.type="approved";A.owner.render()');
await check('!!document.querySelector("[data-owner=marketing-copy]")&&!!document.querySelector("[data-owner=marketing-download]")','approved direct actions');
await run('window.copied="";Object.defineProperty(navigator,"clipboard",{configurable:true,value:{writeText:async text=>{window.copied=text}}});document.querySelector("[data-owner=marketing-copy]").click()');
await check('!!window.copied&&A.$("owner-modal").hidden','copy acts without modal');
await run('window.downloaded=false;HTMLAnchorElement.prototype.click=function(){window.downloaded=!!this.download};document.querySelector("[data-owner=marketing-download]").click()');
await check('window.downloaded&&A.$("owner-modal").hidden','download acts without modal');
await run('document.querySelector("[data-owner=marketing-occasions]").click();document.querySelector(".owner-marketing-occasion-list [data-owner=marketing-occasion]").click()');
await check('!!document.querySelector("input[name=active][role=switch]")&&!document.querySelector("select[name=active]")','occasion uses switch');
await run('document.querySelector("[name=active]").checked=false;document.querySelector("[data-marketing-form]").requestSubmit()');
await check('A.marketing.occasions[0].active===false&&!!document.querySelector(".owner-marketing-occasion-heading .order-badge")','inactive saves and badge beside name');
await run('document.querySelector(".owner-marketing-occasion-list [data-owner=marketing-occasion]").click();document.querySelector("[name=name]").value="Unsaved";document.querySelector("[name=name]").dispatchEvent(new Event("input",{bubbles:true}));A.closeModal()');
await check('A.$("owner-modal").hidden&&!document.querySelector("#owner-dismiss-warning")&&A.marketing.occasions[0].name==="Christmas"','close discards occasion silently');
await run('document.querySelector("[data-owner=marketing-occasions]").click();document.querySelector(".owner-marketing-occasion-list [data-owner=marketing-occasion]").click();document.querySelector("[name=active]").checked=true;document.querySelector("[data-owner=marketing-occasion-cancel]").click()');
await check('!!document.querySelector(".owner-marketing-occasion-list")&&!A.marketing.occasions[0].active&&!document.querySelector("#owner-dismiss-warning")','cancel discards toggle silently');
await run('A.closeModal(true);A.owner.filters.type="pending";A.owner.render();window.originalCaption=A.marketing.drafts.find(d=>d.id===document.querySelector("[data-owner=marketing-edit]").dataset.id).caption;document.querySelector("[data-owner=marketing-edit]").click();document.querySelector("[name=caption]").value="Unsaved caption";document.querySelector("[name=caption]").dispatchEvent(new Event("input",{bubbles:true}));A.closeModal()');
await check('A.$("owner-modal").hidden&&!document.querySelector("#owner-dismiss-warning")','caption closes without discard prompt');
await run('document.querySelector("[data-owner=marketing-edit]").click()');
await check('document.querySelector("[name=caption]").value===window.originalCaption','unsaved caption discarded');
await run('A.closeModal(true)');
for(const [status,color] of [['pending','rgb(219, 234, 254)'],['approved','rgb(220, 252, 231)'],['rejected','rgb(254, 226, 226)']]){
 await run('A.marketing.drafts[0].status='+JSON.stringify(status)+';A.owner.filters.type='+JSON.stringify(status)+';A.owner.render()');
 await check('getComputedStyle(document.querySelector(".owner-marketing-status")).backgroundColor==='+JSON.stringify(color),'status color '+status);
}
await send('Emulation.clearDeviceMetricsOverride');
assert.deepEqual(errors,[]);console.log(n+' checks passed');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
