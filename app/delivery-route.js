(() => {
const A=K406,C=A.commerce;
C.createDeliveryRoute=context=>{
 const address=()=>context?context.address():C.address();
 const draft=()=>context?context.draft():C.state.draft;
 const status=()=>{
  if(!C.addressValid(address()))return 'missing';
  const scenario=draft().service||'ok';
  if(['outside','unreachable','error','loading'].includes(scenario))return scenario;
  return ['cebu city','mandaue city','lapu-lapu city','liloan','consolacion','talisay city'].includes(address().city.trim().toLowerCase())?'ok':'outside';
 };
 return {
  status,
  eligible:()=>status()==='ok',
  reset(){},
  message:()=>({
   ok:'Delivery available. Sample delivery fee: '+C.money(A.quoteFee())+'.',
   outside:'This address is outside the sample delivery area. Choose another address.',
   missing:'Add or select a complete delivery address.',
   loading:'Checking delivery availability...',
   unreachable:'Delivery is unavailable for this address. Choose another address.',
   error:'Delivery availability could not be checked. Please try again.'
  })[status()],
  async check(force=false){
   if(force&&['error','loading','unreachable'].includes(draft().service)){draft().service='ok';if(context)context.refresh();else C.render();}
  }
 };
};
C.deliveryRoute=C.createDeliveryRoute();
})();
