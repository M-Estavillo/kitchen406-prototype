const {createHmac,randomBytes,randomUUID,timingSafeEqual}=require('node:crypto');
const demoAddresses=require('./app/courier-demo-addresses.js');

function validInput(address,dates){
 return typeof address==='string'&&!!address.trim()&&address.length<=400&&Array.isArray(dates)&&[1,4].includes(dates.length)&&new Set(dates).size===dates.length&&dates.every(date=>typeof date==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(date)&&Number.isFinite(Date.parse(date))&&new Date(date).toISOString().startsWith(date));
}

function demoQuotation({address,dates}={}){
 if(!validInput(address,dates))return {status:'invalid'};
 const normalize=value=>value.trim().toLowerCase().replace(/\s+/g,' ');
 const fixture=demoAddresses.find(a=>normalize([a.add_line_1,a.barangay,a.city,a.postal_code,'Philippines'].join(', '))===normalize(address));
 if(!fixture)return {status:'invalid'};
 const {distanceMeters,fee,latitude,longitude}=fixture,limit=10000;
 if(distanceMeters>limit)return {status:'outside',distanceMeters,limit};
 const now=Date.now();
 if(dates.some(date=>Date.parse(date+'T23:59:59+08:00')<=now))return {status:'schedule-unavailable',distanceMeters};
 const expiresAt=new Date(now+15*60000).toISOString();
 return {
  status:'ok',distanceMeters,
  destination:{address,coordinates:{lat:String(latitude),lng:String(longitude)}},
  quotations:dates.map(date=>({date,fee,quotationId:'DEMO-'+randomUUID(),expiresAt}))
 };
}

function courierQuotation(env,request=fetch){
 const mapsKey=env.GOOGLE_MAPS_SERVER_KEY;
 const origin=env.K406_BAKERY_ORIGIN;
 const limit=Number(env.K406_COURIER_LIMIT_METERS||10000);
 const pickupTime=env.K406_COURIER_PICKUP_TIME;
 const {LALAMOVE_API_KEY:key,LALAMOVE_API_SECRET:secret,LALAMOVE_SERVICE_TYPE:serviceType}=env;
 const host=env.LALAMOVE_ENV==='production'?'https://rest.lalamove.com':'https://rest.sandbox.lalamove.com';
 const configured=Boolean(mapsKey&&origin&&Number.isFinite(limit)&&limit>0&&/^([01]\d|2[0-3]):[0-5]\d$/.test(pickupTime||'')&&key&&secret&&serviceType);
 const post=async(url,headers,body)=>{
  const response=await request(url,{method:'POST',headers:{'Content-Type':'application/json',...headers},body,signal:AbortSignal.timeout(8000)});
  if(!response.ok){
   const error=new Error('Provider request failed');
   error.retryable=response.status===429||response.status>=500;
   throw error;
  }
  return response.json();
 };
 async function locate(address){
  const url=new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.search=new URLSearchParams({address,key:mapsKey,components:'country:PH'});
  const response=await request(url,{signal:AbortSignal.timeout(8000)});
  if(!response.ok)throw Error('Geocoding failed');
  const data=await response.json();
  if(data.status==='ZERO_RESULTS')return null;
  if(data.status!=='OK')throw Error('Geocoding failed');
  const result=data.results?.[0],location=result?.geometry?.location;
  if(result?.partial_match||!['ROOFTOP','RANGE_INTERPOLATED'].includes(result?.geometry?.location_type)||!Number.isFinite(location?.lat)||!Number.isFinite(location?.lng))return null;
  return {address:result.formatted_address,coordinates:{lat:String(location.lat),lng:String(location.lng)}};
 }
 async function quotation(stops,date){
  const path='/v3/quotations';
  const scheduleAt=new Date(date+'T'+pickupTime+':00+08:00').toISOString();
  const body=JSON.stringify({data:{scheduleAt,serviceType,language:'en_PH',stops}});
  const timestamp=Date.now();
  const signature=createHmac('sha256',secret).update([timestamp,'POST',path,'',body].join('\r\n')).digest('hex');
  const {data}=await post(host+path,{Authorization:'hmac '+[key,timestamp,signature].join(':'),Market:'PH','Request-ID':randomUUID()},body);
  const amount=data?.priceBreakdown?.total;
  if(typeof data?.quotationId!=='string'||!data.quotationId||data.priceBreakdown?.currency!=='PHP'||!/^\d+(\.\d{1,2})?$/.test(amount)||!Number.isFinite(Number(amount))||Date.parse(data.expiresAt)<=Date.now()||!Number.isFinite(Date.parse(data.expiresAt)))throw Error('Unusable quotation');
  return {date,fee:Number(amount),quotationId:data.quotationId,expiresAt:data.expiresAt};
 }
 async function check(input){
  if(!configured)return {status:'unconfigured'};
  const {address,dates}=input||{};
  if(!validInput(address,dates))return {status:'invalid'};
  let originStop,destination,distanceMeters;
  try{
   [originStop,destination]=await Promise.all([locate(origin),locate(address)]);
   if(!originStop)return {status:'unconfigured'};
   if(!destination)return {status:'invalid'};
   const waypoint=stop=>({location:{latLng:{latitude:Number(stop.coordinates.lat),longitude:Number(stop.coordinates.lng)}}});
   const result=await post('https://routes.googleapis.com/directions/v2:computeRoutes',{'X-Goog-Api-Key':mapsKey,'X-Goog-FieldMask':'routes.distanceMeters'},JSON.stringify({origin:waypoint(originStop),destination:waypoint(destination),travelMode:'DRIVE'}));
   if(!result.routes?.length)return {status:'unreachable'};
   distanceMeters=result.routes[0].distanceMeters;
   if(!Number.isFinite(distanceMeters)||distanceMeters<0)return {status:'error'};
   if(distanceMeters>limit)return {status:'outside',distanceMeters,limit};
  }catch{return {status:'error'};}
  const now=Date.now();
  if(dates.some(date=>{const time=Date.parse(date+'T'+pickupTime+':00+08:00');return time<=now||time>now+30*86400000;}))return {status:'schedule-unavailable',distanceMeters};
  const quotes=new Map();
  for(let attempt=0;attempt<3;attempt++){
   const pending=dates.filter(date=>!quotes.has(date)||Date.parse(quotes.get(date).expiresAt)<=Date.now());
   const results=await Promise.allSettled(pending.map(date=>quotation([originStop,destination],date)));
   results.forEach((result,index)=>{if(result.status==='fulfilled')quotes.set(pending[index],result.value);});
   if(dates.every(date=>Date.parse(quotes.get(date)?.expiresAt)>Date.now())){
    return {status:'ok',distanceMeters,destination,quotations:dates.map(date=>quotes.get(date))};
   }
   if(results.some(result=>result.status==='rejected'&&result.reason.retryable===false))break;
  }
  return {status:'quote-unavailable',distanceMeters};
 }
 return {check};
}

const checkoutQuoteKey = randomBytes(32);
const quoteSignature = (address, dates, fees, expires) =>
 createHmac('sha256',checkoutQuoteKey).update(JSON.stringify([address,dates,fees,expires])).digest();

function checkoutQuote(address, quotations) {
 const dates = quotations.map(quote => quote.date);
 const fees = quotations.map(quote => Math.round(quote.fee * 100));
 const expires = Math.min(...quotations.map(quote => Date.parse(quote.expiresAt)));
 return expires + '.' + quoteSignature(address,dates,fees,expires).toString('hex');
}

function validCheckoutQuote(token, address, dates, fees, now) {
 if (typeof token !== 'string' || !/^\d{13}\.[a-f0-9]{64}$/.test(token)) return false;
 const [deadline, signature] = token.split('.');
 const expires = Number(deadline);
 return expires > now && timingSafeEqual(Buffer.from(signature,'hex'),quoteSignature(address,dates,fees,expires));
}

module.exports=courierQuotation;
module.exports.checkoutQuote=checkoutQuote;
module.exports.validCheckoutQuote=validCheckoutQuote;
module.exports.demoQuotation=demoQuotation;
