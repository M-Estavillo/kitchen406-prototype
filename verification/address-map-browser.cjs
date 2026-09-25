// Uses the existing local Chrome debugging session. Google responses are stubbed;
// live Google API verification requires a configured key and map ID.
const assert=require('node:assert/strict');
(async()=>{
 const targets=await(await fetch('http://127.0.0.1:9222/json')).json();
 const ws=new WebSocket(targets.find(t=>t.type==='page').webSocketDebuggerUrl);
 await new Promise(r=>ws.onopen=r);
 let serial=0;const pending=new Map(),errors=[];
 ws.onmessage=e=>{const m=JSON.parse(e.data);if(m.id){pending.get(m.id)?.(m);pending.delete(m.id);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);};
 const send=(method,params={})=>new Promise((resolve,reject)=>{const id=++serial;pending.set(id,resolve);ws.send(JSON.stringify({id,method,params}));setTimeout(()=>{if(pending.delete(id))reject(Error('Timeout '+method));},10000).unref();});
 const run=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.result.exceptionDetails)throw Error(r.result.exceptionDetails.exception?.description);return r.result.result.value;};
 const wait=()=>new Promise(r=>setTimeout(r,120));
 const check=async(expression,label)=>{assert.equal(await run(expression),true,label);console.log('PASS '+label);};
 try{
  await send('Runtime.enable');await send('Page.enable');
  await send('Page.navigate',{url:require('node:url').pathToFileURL(require('node:path').resolve(__dirname,'../index.html')).href});
  await new Promise(r=>setTimeout(r,1800));
  await run(`K406_MAPS_CONFIG.apiKey='';window.C=K406.commerce;window.S=C.state;K406.setAuth('signedin');C.sampleCart();S.draft.method='delivery';S.draft.date='2026-10-16';location.hash='#/checkout/address'`);await wait();
  await run(`document.querySelector('[data-commerce="address-add"]').click()`);await wait();
  await check(`document.getElementById('address-map-status').textContent.includes('unavailable')&&document.querySelector('#delivery-address-form [type=submit]').disabled`,'missing configuration fails safely');
  await check(`!document.querySelector('[name=phone]')&&!document.querySelector('[name=add_line_2]').required&&document.querySelector('[name=postal_code]').required`,'ERD fields and optional details');
  await run(`
   window.lookups=[];
   class MockMap{constructor(){window.testMap=this;this.events={};}addListener(n,f){this.events[n]=f;}panTo(){}setZoom(){}fitBounds(bounds){this.bounds=bounds;}}
   class Marker{constructor(options){Object.assign(this,options);this.events={};if(options.gmpDraggable)window.testMarker=this;else window.testBakeryMarker=this;}addEventListener(n,f){this.events[n]=f;}append(label){this.label=label;}}
   class Geocoder{geocode(request){if(request.address)return Promise.resolve({results:[{geometry:{location:{lat:10.4,lng:123.98}}}]});return new Promise((resolve,reject)=>lookups.push({resolve,reject}));}}
   class Places extends HTMLElement{constructor(){super();window.testSearch=this;}}
   customElements.define('test-google-places',Places);
   window.google={maps:{importLibrary:async name=>({maps:{Map:MockMap},marker:{AdvancedMarkerElement:Marker},geocoding:{Geocoder},places:{PlaceAutocompleteElement:Places},routes:{Route:{computeRoutes:async()=>({routes:[{distanceMeters:window.testDistance??9000}]})}}}[name])}};
   K406_MAPS_CONFIG.apiKey='test-stub';K406_MAPS_CONFIG.mapId='test-stub';C.render();
  `);await wait();
  await check(`testBakeryMarker.label.textContent.includes('Kitchen406 bakery')&&!testBakeryMarker.gmpDraggable&&!!testMap.bounds`,'bakery marker is labeled, fixed and visible');
  await run(`testMap.events.click({latLng:{lat:10.3,lng:123.9}});testMap.events.click({latLng:{lat:10.4,lng:123.8}})`);
  await check(`C.checkout.mapBusy&&document.querySelector('#delivery-address-form [type=submit]').disabled`,'pending lookup blocks saving');
  await run(`window.parts=(street)=>[{types:['route'],long_name:street},{types:['locality'],long_name:'Mandaue City'},{types:['postal_code'],long_name:'6014'}];lookups[1].resolve({results:[{address_components:parts('Latest Street')}]})`);await wait();
  await run(`lookups[0].resolve({results:[{address_components:parts('Old Street')}]})`);await wait();
  await check(`testMap.bounds.north>10.4&&testMap.bounds.west<123.8&&testMap.bounds.east>123.98`,'map frames bakery and delivery pins');
  await check(`C.checkout.form.latitude===10.4&&document.querySelector('[name=add_line_1]').value==='Latest Street'`,'latest pin wins out-of-order lookups');
  await run(`const label=document.querySelector('[name=label]');label.value='My studio';label.dispatchEvent(new Event('input',{bubbles:true}));const def=document.querySelector('[name=is_default]');def.click()`);
  await check(`!document.querySelector('#delivery-address-form [type=submit]').disabled`,'complete address enables save');
  await run(`document.getElementById('delivery-address-form').requestSubmit()`);await wait();
  await check(`S.addresses.length===3&&C.address().label==='My studio'&&C.address().latitude===10.4&&C.address().add_line_2===null&&C.address().landmark===null&&S.addresses.filter(a=>a.is_default).length===1&&C.address().is_default`,'coordinates, optional nulls, custom label and unique default saved');
  await check(`!!C.address().created_at&&!!C.address().updated_at&&C.address().customer_id==='preview-customer'&&C.address().status==='active'`,'address metadata retained');
  await run(`C.checkout.action('address-edit',{dataset:{id:C.address().address_id}})`);await wait();
  await check(`document.querySelector('[name=label]').value==='My studio'&&testMarker.gmpDraggable`,'editing restores address and draggable pin');
  await run(`testMarker.events['gmp-dragstart']();testMarker.position={lat:10.5,lng:123.7};testMarker.events['gmp-dragend']();lookups.at(-1).reject(Error('offline'))`);await wait();
  await check(`C.checkout.form.latitude===10.5&&!C.checkout.form.add_line_1&&document.querySelector('#delivery-address-form [type=submit]').disabled`,'geocoding failure keeps pin and requires manual address');
  await run(`testSearch.dispatchEvent(Object.assign(new Event('gmp-select'),{placePrediction:{toPlace:()=>({location:{lat:()=>10.33,lng:()=>123.91},addressComponents:[{types:['route'],longText:'Search Street'},{types:['locality'],longText:'Cebu City'},{types:['postal_code'],longText:'6000'}],fetchFields:async()=>{}})}}))`);await wait();
  await check(`C.checkout.form.add_line_1==='Search Street'&&C.checkout.form.latitude===10.33&&!document.querySelector('#delivery-address-form [type=submit]').disabled`,'Places result populates address and coordinates');
  await run(`testMap.events.click({latLng:{lat:10.6,lng:123.6}});document.querySelector('[data-commerce="address-cancel"]').click()`);await wait();
  await run(`lookups.at(-1).resolve({results:[{address_components:parts('Cancelled Street')}]})`);await wait();
  await check(`C.checkout.form===null&&C.address().add_line_1==='Latest Street'`,'cancel ignores late lookup and preserves saved address');
  await run(`window.testDistance=10001;C.deliveryRoute.check(true)`);await wait();
  await check(`document.querySelector('[data-commerce="address-next"]').disabled&&document.getElementById('commerce-view').textContent.includes('10.001 km')`,'over 10 km blocks delivery');
  await run(`window.testDistance=10000;C.deliveryRoute.check(true)`);await wait();
  await check(`!document.querySelector('[data-commerce="address-next"]').disabled`,'exactly 10 km allows delivery');
  await run(`document.querySelector('[data-commerce="address-next"]').click()`);await wait();
  await check(`location.hash==='#/checkout/review'&&!document.querySelector('[data-commerce="pay"]').disabled`,'saved ERD address reaches order review');
  assert.deepEqual(errors,[]);console.log('No browser exceptions.');
 }finally{
  // Remove test-only Maps stubs and restore the regular, unconfigured application.
  await send('Page.reload');ws.close();
 }
})().catch(error=>{console.error(error);process.exitCode=1;});
