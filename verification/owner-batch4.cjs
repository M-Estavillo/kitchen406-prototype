const assert=require('node:assert/strict'),path=require('node:path'),fs=require('node:fs');
(async()=>{
 const tabs=await(await fetch('http://127.0.0.1:9222/json')).json(),ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);const pending=new Map(),errors=[];let seq=0,checks=0;
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.exception?.description||m.params.exceptionDetails.text);};
 const send=(method,params={})=>new Promise(r=>{const id=++seq;pending.set(id,r);ws.send(JSON.stringify({id,method,params}));});
 const run=async expression=>{const m=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(m.result?.exceptionDetails)throw Error(m.result.exceptionDetails.exception?.description);return m.result.result.value;};
 const check=async(expr,label)=>{assert(await run(expr),label);console.log('PASS '+label);checks++;},wait=()=>new Promise(r=>setTimeout(r,150)),go=async p=>{await run(`location.hash=${JSON.stringify('#/'+p)}`);await wait();};
 await send('Runtime.enable');await send('Page.enable');await send('Page.navigate',{url:require('node:url').pathToFileURL(path.resolve('index.html')).href});await new Promise(r=>setTimeout(r,1500));

 await run('window.A=K406;window.O=A.owner;window.Q=A.capacity;A.session.enter();O.seed();O.date=A.operations.find("OWNER-DEMO-PICKUP").fulfillment.date');
 await go('owner/capacity');
 await check('A.$("owner-view").textContent.includes("Production Calendar")&&!document.querySelector(".staff-nav a[href=\\"#/owner/scheduling\\"]")','single Production Calendar navigation');
 await check('A.$("owner-view").textContent.includes("OWNER-DEMO-PICKUP")&&A.$("owner-view").textContent.includes("temporary hold")','confirmed commitments and temporary holds separated');
 for(const mode of ['day','month','week']){await run(`document.querySelector('[data-owner="calendar-mode"][data-mode="${mode}"]').click()`);await check(`O.calendarMode==="${mode}"`,'switch '+mode);}
 await run('window.before=O.date;document.querySelector("[data-owner=calendar-next]").click();document.querySelector("[data-owner=calendar-prev]").click()');
 await check('O.date===before','period navigation returns selected date');
 await go('owner/scheduling');
 await check('location.hash==="#/owner/capacity/settings"&&!document.querySelector("#owner-subscriptionUnits")&&!document.querySelector("[data-owner=schedule]")','legacy general settings route consolidated without subscription controls');
 await run('window.original=A.schedule.config.standardUnits;A.$("owner-standardUnits").value="99";document.querySelector("[data-owner=discard]").click()');
 await check('A.$("owner-standardUnits").value===String(original)','discard capacity edit');
 await run('window.orders=A.operations.orders().length;window.subLimit=A.schedule.config.subscriptionUnits;A.$("owner-standardUnits").value="1";document.querySelector("[data-owner-form=settings]").requestSubmit()');
 await check('A.schedule.config.standardUnits===1&&A.schedule.config.subscriptionUnits===subLimit&&A.operations.orders().length===orders','lower limit preserves orders and subscription configuration');
 await run('A.$("owner-reason").value="Maintenance";document.querySelector("[data-owner-form=block]").requestSubmit()');
 await check('A.schedule.config.blocked.includes(O.date)&&Q.blocks.get(O.date).reason==="Maintenance"','block selected occupied date');
 await go('owner/capacity');
 await check('A.$("owner-view").textContent.includes("Blocked for new bookings")&&A.$("owner-view").textContent.includes("Over limit by")&&A.$("owner-view").textContent.includes("OWNER-DEMO-PICKUP")','blocked over-limit date retains commitments');
 await go('owner/capacity/settings');
 await run('A.$("owner-reason").value="Updated reason";document.querySelector("[data-owner-form=block]").requestSubmit()');
 await check('Q.blocks.get(O.date).reason==="Updated reason"&&A.schedule.config.blocked.filter(d=>d===O.date).length===1','editing block does not duplicate');
 await run('document.querySelector("[data-owner=unblock]").click()');
 await check('A.schedule.config.blocked.includes(O.date)&&A.modal==="owner-modal"','block removal requires confirmation');
 await run('document.querySelector("[data-owner=confirm-unblock]").click()');
 await check('!A.schedule.config.blocked.includes(O.date)&&!A.modal&&A.operations.orders().length===orders','confirmed removal preserves commitments');
 await go('owner/capacity');
 await run('A.$("owner-calendar-type").value="cake";A.$("owner-calendar-type").dispatchEvent(new Event("change",{bubbles:true}))');
 await check('O.calendarType==="cake"','calendar type filter works');
 for(const width of [1440,390,320]){await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});await check('document.documentElement.scrollWidth<=innerWidth+1','calendar fits '+width);}
 assert.equal(errors.length,0,errors.join('\n'));console.log(`COMPLETE ${checks} batch 4 checks; no browser exceptions.`);ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
