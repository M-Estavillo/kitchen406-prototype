const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const tabs=await(await fetch('http://127.0.0.1:9222/json')).json(),ws=new WebSocket(tabs.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
 let serial=0,count=0;const pending=new Map(),errors=[];
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
 const send=(method,params={})=>new Promise(r=>{pending.set(++serial,r);ws.send(JSON.stringify({id:serial,method,params}));});
 const run=async expression=>{const m=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(m.result.exceptionDetails)throw Error(JSON.stringify(m.result.exceptionDetails));return m.result.result.value;};
 const check=async(expr,label)=>{assert(await run(expr),label);count++;console.log('PASS '+label);};
 const go=async route=>{await run(`location.hash=${JSON.stringify('#/'+route)}`);await new Promise(r=>setTimeout(r,120));};
 await send('Runtime.enable');await send('Page.navigate',{url:require('node:url').pathToFileURL(path.resolve('index.html')).href});await new Promise(r=>setTimeout(r,1800));
 await run('window.A=K406;window.O=A.owner;A.session.enter();O.seed()');await go('owner');
 await check(`document.querySelectorAll('.owner-fulfillment-order').length===2&&document.querySelectorAll('.owner-summary-link').length===4`,'compact fulfillment cards and clickable summary cards');
 await check(`!['Payments received','Attention needed','Cake inquiries'].some(t=>A.$('owner-view').textContent.includes(t))`,'removed dashboard panels');
 await check(`document.querySelector('.owner-calendar-link').textContent==='View Calendar' && document.querySelector('.owner-calendar-link').getAttribute('href')==='#/owner/capacity'`,'compact calendar destination');
 await check(`!A.$('owner-header-notifications').hidden && A.$('staff-header-notifications').hidden && document.querySelector('header nav').classList.contains('staff-hidden')`,'owner header and notification bell');
 await check(`!document.querySelector('#owner-view a[href^="#/staff"]') && !!document.querySelector('#owner-view a[href="#/owner/notifications"]')`,'owner navigation keeps owner routes');
 await go('owner/notifications');await check(`document.querySelectorAll('#owner-view .staff-notification').length>0`,'notifications populated from owner records');
 await run('window.staffReads=JSON.stringify(A.staff.events);O.saveError=true;document.querySelector("[data-owner=read-all]").click()');
 await check('O.notifications().some(n=>!n.read)','failed read keeps unread state');
 await run('O.saveError=false;document.querySelector("[data-owner=read-all]").click()');
 await check('O.notifications().every(n=>n.read)&&JSON.stringify(A.staff.events)===staffReads','read all isolated from staff');
 await check('A.$("owner-header-notifications").querySelector(".staff-header-unread").hidden','header unread badge clears');
 await run('A.$("owner-notificationFilter").value="unread";A.$("owner-notificationFilter").dispatchEvent(new Event("change",{bubbles:true}))');
 await check('A.$("owner-view").textContent.includes("No matching updates.")','unread filter empty state');
 await run('O.notificationFilter="all";O.notificationReads.clear();O.render();window.expected=O.notifications()[0].path;document.querySelector("[data-owner=notification-view]").click()');await new Promise(r=>setTimeout(r,120));
 await check('location.hash==="#/owner/"+expected&&O.notificationReads.size===1','view details marks only selected notification');
 for(const width of [1440,768,390,320]){
  await send('Emulation.setDeviceMetricsOverride',{width,height:1000,deviceScaleFactor:1,mobile:false});
  for(const route of ['owner','owner/notifications']){await go(route);await check('document.documentElement.scrollWidth<=innerWidth+1',route+' fits '+width);}
 }
 await send('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await go('owner');
 const shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(process.env.TEMP,'k406-owner-dashboard.png'),Buffer.from(shot.result.data,'base64'));
 await go('owner/notifications');const inbox=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync(path.join(process.env.TEMP,'k406-owner-notifications.png'),Buffer.from(inbox.result.data,'base64'));
 await run('O.mode="loading";O.render()');await check('!!document.querySelector("#owner-view .owner-skeleton")','notification loading skeleton');await run('O.mode="normal"');
 await run('A.staff.enter()');await go('staff');await check('A.$("owner-header-notifications").hidden&&!A.$("staff-header-notifications").hidden','staff header preserved');
 await run('A.staff.leave()');await go('shop');await check('A.$("owner-header-notifications").hidden&&A.$("staff-header-notifications").hidden&&!document.querySelector("header nav").classList.contains("staff-hidden")','customer header preserved');
 assert.equal(errors.length,0,errors.join('\n'));console.log('COMPLETE '+count+' checks');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
