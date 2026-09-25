const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
(async()=>{
 const requests=[];let response={routes:[{distanceMeters:9999}]},deferred=null;
 const context={window:{K406_MAPS_CONFIG:{bakeryOrigin:'Liloan, Cebu, Philippines'}},K406:{},setTimeout,clearTimeout,
  google:{maps:{importLibrary:async()=>({Route:{computeRoutes:request=>{requests.push(request);return deferred?new Promise(resolve=>deferred.push(resolve)):Promise.resolve(response);}}})}}};
 vm.createContext(context);
 for(const name of ['commerce-state','delivery-route'])vm.runInContext(fs.readFileSync('app/'+name+'.js','utf8'),context);
 const C=context.K406.commerce,S=C.state,R=C.deliveryRoute;
 C.addressMap={load:async()=>{}};
 S.cart=[{quantity:1,max:12,available:true,price:100}];S.draft.method='delivery';S.draft.date='2026-10-16';
 assert(!C.ready());await R.check();assert(C.ready());assert.equal(requests[0].origin,'Liloan, Cebu, Philippines');assert.equal(requests[0].travelMode,'DRIVING');
 response={routes:[{distanceMeters:10000}]};await R.check(true);assert(C.ready());
 response={routes:[{distanceMeters:10001}]};await R.check(true);assert(!C.ready());assert.equal(R.status(),'outside');assert.equal(C.createOrder(),null);assert.equal(C.fee(),null);
 response={routes:[]};await R.check(true);assert.equal(R.status(),'unreachable');assert(!C.ready());
 for(const distance of [undefined,NaN,-1,'9000']){response={routes:[{distanceMeters:distance}]};await R.check(true);assert.equal(R.status(),'error');assert(!C.ready());}
 C.addressMap.load=async()=>{throw Error('missing key');};await R.check(true);assert.equal(R.status(),'error');assert(!C.ready());C.addressMap.load=async()=>{};
 response={routes:[{distanceMeters:9000}]};await R.check(true);assert(C.ready());
 S.draft.addressId='work';assert(!C.ready());await R.check();assert(C.ready());
 C.address().latitude+=0.001;assert(!C.ready());await R.check();assert(C.ready());
 context.window.K406_MAPS_CONFIG.bakeryOrigin={lat:10.4,lng:124};assert(!C.ready());await R.check();assert(C.ready());
 deferred=[];const old=R.check(true);await new Promise(r=>setImmediate(r));assert(!C.ready());
 S.draft.addressId='home';const latest=R.check();await new Promise(r=>setImmediate(r));
  deferred[1]({routes:[{distanceMeters:12000}]});await latest;deferred[0]({routes:[{distanceMeters:1000}]});await old;assert.equal(R.status(),'outside');assert(!C.ready());
  const interrupted=R.check(true);await new Promise(r=>setImmediate(r));S.draft.method='pickup';deferred.at(-1)({routes:[{distanceMeters:1000}]});await interrupted;
  S.draft.method='delivery';deferred=null;response={routes:[{distanceMeters:9000}]};await R.check();assert(C.ready());
 context.window.K406_MAPS_CONFIG.bakeryOrigin=null;await R.check();assert.equal(R.status(),'unconfigured');assert(!C.ready());
 S.draft.method='pickup';assert(C.ready());assert.equal(C.fee(),0);
 console.log('PASS distance boundaries, route request, missing/invalid routes, API failure, retry, changed address/pin/origin, stale responses, order guard, and pickup bypass.');
})().catch(error=>{console.error(error);process.exitCode=1;});
