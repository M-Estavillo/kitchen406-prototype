(() => {
const A=K406,C=A.commerce;
let loading;
const bakeryLocations=new Map();
function bakeryPosition(geocoder,origin){
 if(!origin)return Promise.reject(new Error('Missing bakery location'));
 if(typeof origin!=='string')return Promise.resolve(origin);
 if(!bakeryLocations.has(origin))bakeryLocations.set(origin,geocoder.geocode({address:origin}).then(result=>{
  const location=result.results[0]?.geometry?.location;
  if(!location)throw new Error('Bakery location not found');
  return position(location);
 }).catch(error=>{bakeryLocations.delete(origin);throw error;}));
 return bakeryLocations.get(origin);
}
function load(){
 const config=window.K406_MAPS_CONFIG||{};
 if(!config.apiKey||!config.mapId)return Promise.reject(new Error('Maps are not configured.'));
 if(window.google?.maps?.importLibrary)return Promise.resolve();
 if(!loading)loading=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  const timer=setTimeout(()=>reject(new Error('Map loading timed out.')),20000);
  window.k406MapsReady=()=>{clearTimeout(timer);resolve();};
  script.src='https://maps.googleapis.com/maps/api/js?'+new URLSearchParams({key:config.apiKey,v:'weekly',loading:'async',callback:'k406MapsReady'});
  script.onerror=()=>{clearTimeout(timer);reject(new Error('Map could not load.'));};
  document.head.append(script);
 });
 return loading;
}
function fields(components){
 const get=type=>{const c=components.find(c=>c.types.includes(type));return c?.long_name||c?.longText||'';};
 return {
  add_line_1:[get('street_number'),get('route')].filter(Boolean).join(' ')||get('premise')||get('sublocality_level_1')||get('sublocality'),
  city:get('locality')||get('administrative_area_level_2'),
  postal_code:get('postal_code')
 };
}
function position(p){return {lat:typeof p.lat==='function'?p.lat():p.lat,lng:typeof p.lng==='function'?p.lng():p.lng};}
C.addressMap={load,fields,async mount(){
 const host=A.$('address-map'),status=A.$('address-map-status'),search=A.$('address-place-search');
 if(!host||host.dataset.mounted)return;
 host.dataset.mounted='true';
 const F=C.checkout,editing=!!F.form,address=F.form||C.address();
 const active=()=>host.isConnected&&(!editing||F.form===address);
 const say=text=>{if(active())status.textContent=text;};
 const updateButton=()=>{const button=A.$('delivery-address-form')?.querySelector('[type=submit]');if(button)button.disabled=F.mapBusy||!C.addressValid(F.form);};
 F.mapBusy=false;
 try{
  await load();
  const [{Map},{AdvancedMarkerElement},{Geocoder},{PlaceAutocompleteElement}]=await Promise.all(['maps','marker','geocoding','places'].map(name=>google.maps.importLibrary(name)));
  if(!active())return;
  const selected=C.coordinatesValid(address),center=selected?{lat:address.latitude,lng:address.longitude}:window.K406_MAPS_CONFIG.center;
  const map=new Map(host,{center,zoom:selected?17:12,mapId:window.K406_MAPS_CONFIG.mapId,mapTypeControl:false,streetViewControl:false});
  const marker=new AdvancedMarkerElement({map,position:selected?center:undefined,gmpDraggable:editing,title:editing?'Drag to your delivery location':'Delivery location'});
  const geocoder=new Geocoder();let bakery;
  const frameLocations=()=>{
   if(!bakery)return;
   const delivery=marker.position?position(marker.position):bakery;
   map.fitBounds({north:Math.max(bakery.lat,delivery.lat)+0.001,south:Math.min(bakery.lat,delivery.lat)-0.001,east:Math.max(bakery.lng,delivery.lng)+0.001,west:Math.min(bakery.lng,delivery.lng)-0.001},60);
  };
  void bakeryPosition(geocoder,window.K406_MAPS_CONFIG.bakeryOrigin).then(point=>{
   if(!active())return;
   bakery=point;
   const approximate=window.K406_MAPS_CONFIG.bakeryOrigin==='Liloan, Cebu, Philippines';
   const title='Kitchen406 bakery'+(approximate?' — Liloan (approximate)':'');
   const bakeryMarker=new AdvancedMarkerElement({map,position:point,gmpDraggable:false,title,zIndex:10});
   const label=document.createElement('div');label.className='bakery-map-marker';label.textContent=title;
   bakeryMarker.append(label);
   frameLocations();
  }).catch(()=>{
   if(!active())return;
   const note=document.createElement('p');note.className='muted';note.textContent='The bakery location could not be shown. Please reload to try again.';host.after(note);
  });
  if(!editing){say('Your saved delivery location. Choose Edit to move the pin.');return;}
  let request=0;
  const begin=()=>{F.mapBusy=true;address.latitude=null;address.longitude=null;updateButton();};
  async function choose(p,components){
   const token=++request,point=position(p);
   begin();marker.position=point;if(bakery)frameLocations();else{map.panTo(point);map.setZoom(17);}say('Finding the address for this location…');
   // A moved pin must not retain the previous location's address or postal code.
   for(const name of ['add_line_1','city','postal_code']){address[name]='';const input=A.$('address-'+name);if(input)input.value='';}
   try{
    if(!components){const response=await geocoder.geocode({location:point});components=response.results[0]?.address_components||[];}
    if(!active()||token!==request)return;
    const suggested=fields(components);
    for(const [name,value] of Object.entries(suggested)){
     // Preserve manual edits made while the lookup was pending.
     if(!address[name]){address[name]=value;const input=A.$('address-'+name);if(input)input.value=value;}
    }
    say('Pin selected. Check the address and fill in any missing details.');
   }catch{
    if(!active()||token!==request)return;
    say('Pin selected. We could not find its address. Enter the address details below.');
   }
   if(!active()||token!==request)return;
   address.latitude=point.lat;address.longitude=point.lng;F.mapBusy=false;updateButton();
  }
  map.addListener('click',event=>{if(event.latLng)void choose(event.latLng);});
  marker.addEventListener('gmp-dragstart',()=>{++request;begin();});
  marker.addEventListener('gmp-dragend',()=>void choose(marker.position));
  const autocomplete=new PlaceAutocompleteElement({includedRegionCodes:['ph'],locationBias:{center,radius:30000}});
  autocomplete.setAttribute('aria-label','Search for your delivery address');
  search.append(autocomplete);
  autocomplete.addEventListener('gmp-select',async({placePrediction})=>{
   const token=++request;begin();say('Finding your selected place…');
   try{
    const place=placePrediction.toPlace();await place.fetchFields({fields:['location','addressComponents']});
    if(!active()||token!==request)return;
    if(!place.location)throw new Error('Missing location');
    await choose(place.location,place.addressComponents);
   }catch{
    if(!active()||token!==request)return;
    marker.position=null;F.mapBusy=false;updateButton();say('Could not find that place. Try another search or select a point on the map.');
   }
  });
  autocomplete.addEventListener('gmp-error',()=>say('Address search is unavailable. Select your location on the map.'));
  say(selected?'Drag the pin to adjust your delivery location.':'Search for an address, then drag the pin or select a point on the map.');
 }catch{
  if(!active())return;
  say('The map is unavailable right now. Please try again later.');
  if(editing){F.mapBusy=false;updateButton();}
 }
}};
})();
