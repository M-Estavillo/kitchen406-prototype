(() => {
const A=K406,C=A.commerce;
C.createDeliveryRoute=context=>{
 const address=()=>context?context.address():C.address();
 const draft=()=>context?context.draft():C.state.draft;
 const provider=()=>globalThis.K406_MAPS_CONFIG?.courierProvider===true;
 const refresh=()=>context?context.refresh():C.render();
 let current;
 function payload(){
  const a=address(),d=draft();
  if(d.method!=='delivery'||!C.addressValid(a))return null;
  const dates=context?context.dates():[d.date];
  if(!dates?.length||dates.some(date=>!date))return null;
  return {
   address:[a.add_line_1,a.barangay,a.city,a.postal_code,'Philippines'].filter(Boolean).join(', '),
   dates,
   addressId:a.address_id
  };
 }
 const selected=()=>current&&current.key===JSON.stringify(payload())?current:null;
 const status=()=>{
  if(!C.addressValid(address()))return 'missing';
  if(provider()){
   const result=selected();
   if(!result)return 'unchecked';
   if(result.status==='ok'&&result.quotations.some(quote=>Date.parse(quote.expiresAt)<=Date.now()))return 'expired';
   return result.status;
  }
  return 'unconfigured';
 };
 return {
  status,
  eligible:()=>status()==='ok',
  provider,
  quotations:()=>provider()&&status()==='ok'?selected().quotations:[],
  checkoutQuote:()=>status()==='ok'?selected().checkoutQuote:undefined,
  destination:()=>provider()&&status()==='ok'?selected().destination:null,
  reset(){current=null;},
  message:()=>({
   ok:'Delivery is available for this address.',
   outside:'This address is outside the bakery delivery area. Choose another address.',
   missing:'Add or select a complete delivery address.',
   invalid:'The delivery address could not be located. Edit it or select another.',
   unchecked:'Select a delivery address and fulfillment dates to check availability.',
   loading:'Checking delivery availability...',
   unreachable:'Delivery is unavailable for this address. Choose another address.',
   unconfigured:'Courier checks are unavailable. Choose pickup or try again later.',
   'schedule-unavailable':'A scheduled courier quote is unavailable for one or more of these dates. Choose a different schedule or pickup.',
   'quote-unavailable':'The courier fee is unavailable. Retry the check or choose pickup.',
   expired:'The courier quotation has expired. Check delivery availability again.',
   error:'Delivery availability could not be checked. Please try again.'
  })[status()],
  async check(force=false){
   if(provider()){
    const input=payload();
    if(!input||(!force&&selected()))return;
    const result=current={key:JSON.stringify(input),status:'loading'};
    queueMicrotask(()=>{if(selected()===result)refresh();});
    try{
     const response=await fetch('/api/courier-quotation',{
      method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(input)
     });
     if(!response.ok)throw Error('Delivery check failed');
     Object.assign(result,await response.json());
    }catch{result.status='error';}
    if(selected()===result)refresh();
    return;
   }
  }
 };
};
C.deliveryRoute=C.createDeliveryRoute();
})();
