const fs=require('node:fs');
(async()=>{
const targets=await (await fetch('http://127.0.0.1:9222/json')).json();
const ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
let seq=0;const pending=new Map(),errors=[];ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text+': '+m.params.exceptionDetails.exception?.description);};
const send=(method,params={})=>new Promise((r,j)=>{const id=++seq;pending.set(id,r);ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.has(id)){pending.delete(id);j(Error('CDP timeout: '+method));}},15000).unref();});
const evaluate=async(expression)=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.result.exceptionDetails)throw Error(r.result.exceptionDetails.exception?.description);return r.result.result.value;};
const wait=(ms=120)=>new Promise(r=>setTimeout(r,ms));
const go=async route=>{await evaluate('location.hash='+JSON.stringify('#/'+route));await wait();};
let checks=0;const assert=async(expr,name)=>{if(!await evaluate(expr))throw Error('FAIL: '+name);console.log('PASS '+name);checks++;};

await send('Runtime.enable');await send('Page.enable');
await send('Page.navigate',{url:require('node:url').pathToFileURL(require('node:path').resolve(__dirname,'../index.html')).href});await wait(2000);
await evaluate("location.hash='#custom-celebrations'");await wait();
await assert("!document.getElementById('catalog-view').hidden&&K406.route==='shop'",'in-page anchors do not become routes');
await go('product/1/reviews');await go('sign-in');
await assert("K406.returnRoute==='#/product/1/reviews'",'review return destination preserved');
await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape'});await wait();
await assert("location.hash==='#/product/1/reviews'&&!K406.modal&&!document.getElementById('app-shell').inert",'Escape closes and restores background');
await go('sign-in');
await assert("document.getElementById('app-shell').inert",'dialog background inert');
await evaluate("document.getElementById('mock-toggle').focus()");
await send('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab'});await wait();
await assert("document.activeElement.matches('[data-auth-close]')",'dialog focus trap includes inspector');
await go('register');
await evaluate("history.back()");await wait();
await assert("K406.authUI.state.view==='sign-in'",'browser Back across authentication');
await go('verify');
await evaluate("K406.authUI.simulate('waiting');const data=new DataTransfer();data.setData('text','406892');document.querySelector('[data-digit]').dispatchEvent(new ClipboardEvent('paste',{clipboardData:data,bubbles:true,cancelable:true}))");
await assert("K406.authUI.state.code==='406892'&&!document.getElementById('verify-submit').disabled",'OTP full code paste');
await evaluate("K406.authUI.state.deadline=Date.now()+50");await wait(1200);
await assert("K406.authUI.state.mode==='expired'&&document.getElementById('verify-submit').disabled",'OTP real countdown expiry');
for(const view of ['sign-in','register','verify','forgot','reset']){
 await go(view);await evaluate("document.getElementById('mock-panel').hidden=false");
 const options=await evaluate("[...document.getElementById('mock-form').options].map(o=>o.value)");
 for(const option of options)await evaluate("K406.authUI.simulate("+JSON.stringify(option)+")");
 console.log('PASS every mock state renders for '+view);checks++;
}
await go('shop');
await assert("(()=>{const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);return ids.length===new Set(ids).size})()",'no duplicate element IDs');
await go('product/1');await wait(600);
await assert("[...document.querySelectorAll('#product-view img')].every(img=>img.complete&&img.naturalWidth>0)",'all product images load locally');
await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:false});
await go('verify');await evaluate("K406.authUI.simulate('waiting');document.getElementById('mock-panel').hidden=true");await wait(100);
let shot=await send('Page.captureScreenshot',{format:'png'});fs.writeFileSync('verification/mobile-verification.png',Buffer.from(shot.result.data,'base64'));
await go('product/1');await wait(100);shot=await send('Page.captureScreenshot',{format:'png',captureBeyondViewport:true});fs.writeFileSync('verification/mobile-product.png',Buffer.from(shot.result.data,'base64'));
if(errors.length)throw Error(errors.join('\n'));
console.log('COMPLETE '+checks+' edge checks; no uncaught browser exceptions.');ws.close();
})().catch(e=>{console.error(e);process.exit(1)});
