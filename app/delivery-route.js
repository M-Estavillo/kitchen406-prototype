(() => {
const A=K406,C=A.commerce,MAX_METERS=10000;
let current=null;
const origin=()=>window.K406_MAPS_CONFIG?.bakeryOrigin;
const validOrigin=o=>typeof o==='string'?!!o.trim():o&&Number.isFinite(o.lat)&&Math.abs(o.lat)<=90&&Number.isFinite(o.lng)&&Math.abs(o.lng)<=180;
const key=()=>{
 const a=C.address(),o=origin();
 return C.state.draft.method==='delivery'&&C.coordinatesValid(a)&&validOrigin(o)
  ?JSON.stringify([typeof o==='string'?o:[o.lat,o.lng],a.address_id,a.latitude,a.longitude]):null;
};
function refresh(){if(A.auth==='signedin'&&A.route==='checkout'&&!C.checkout.form)C.render();}
const R=C.deliveryRoute={
 eligible:()=>!!key()&&current?.key===key()&&current.status==='ok',
 reset:()=>{current=null;},
 status:()=>!validOrigin(origin())?'unconfigured':!key()?'missing':current?.key===key()?current.status:'pending',
 message:()=>{
  const status=R.status();
  const distance=current?.key===key()&&Number.isFinite(current.distance)?(current.distance/1000).toFixed(3):null;
  if(status==='ok')return `Driving distance: ${distance} km. Within our 10 km delivery area.`;
  if(status==='outside')return `Driving distance: ${distance} km. Delivery is limited to 10 km from the bakery. Choose another address or choose pickup in fulfillment.`;
  return {unconfigured:'Delivery distance checking is currently unavailable. Please try again later or choose pickup.',missing:'Select a delivery address with a map location.',pending:'Checking driving distance from the bakery...',checking:'Checking driving distance from the bakery...',unreachable:'No driving route was found. Choose another delivery location or choose pickup.',error:'We could not check the delivery distance. Please retry.'}[status];
 },
 async check(force=false){
  const routeKey=key();
  if(!routeKey){current=null;return;}
  if(!force&&current?.key===routeKey)return;
  const a=C.address(),o=origin();
  const check=current={key:routeKey,status:'checking',distance:null};
  const stillCurrent=()=>{if(current!==check)return false;if(key()!==routeKey){current=null;return false;}return true;};
  const request={origin:typeof o==='string'?o:{lat:o.lat,lng:o.lng},destination:{lat:a.latitude,lng:a.longitude},travelMode:'DRIVING',routingPreference:'TRAFFIC_UNAWARE',computeAlternativeRoutes:false,fields:['distanceMeters']};
  let timer;
  try{
   const response=await Promise.race([
    (async()=>{await C.addressMap.load();const {Route}=await google.maps.importLibrary('routes');return Route.computeRoutes(request);})(),
    new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('Route timed out')),20000);})
   ]);
   if(!stillCurrent())return;
   const distance=response.routes?.[0]?.distanceMeters;
   if(!response.routes?.length)check.status='unreachable';
   else if(!Number.isFinite(distance)||distance<0)check.status='error';
   else{check.distance=distance;check.status=distance<=MAX_METERS?'ok':'outside';}
  }catch{if(!stillCurrent())return;check.status='error';}
  finally{clearTimeout(timer);}
  refresh();
 }
};
})();
