(() => {
const A=K406,C=A.commerce;
C.addressMap={mount(){
 const host=A.$('address-map'),status=A.$('address-map-status');
 if(!host)return;
 const context=C.addressContext(),editor=context.editor,address=editor.form||context.address();
 editor.mapBusy=false;
 const editing=!!editor.form,valid=C.addressValid(address);
 const mock=window.K406_MAPS_CONFIG?.courierMock;
 const route=A.route==='subscription'?A.subscriptions.deliveryRoute:C.deliveryRoute;
 const state=editing?'editing':valid?route.status():'missing';
 host.dataset.state=state;
 host.innerHTML='<img src="assets/delivery-area.png" alt="Static Google Maps view of Metro Cebu" class="address-static-image"><div class="address-static-footer"><span class="address-static-caption">'+(editing?'Address preview':valid?'Delivery area preview':'Add a delivery address')+'</span></div>';
 if(status)status.textContent=editing?'Enter your address details below. The map is a static area preview.':route.provider()?'Static area preview. The delivery check validates your selected address.':'Static area preview. Courier checks are unavailable.';
 if(mock&&status)status.textContent=editing?'Choose a demo address and add any unit or delivery details below.':'Demo delivery area and estimated fees.';
 if(mock&&editing){
  const label=document.createElement('label'),picker=document.createElement('select');
  label.textContent='Demo map location ';
  picker.add(new Option('Choose a demo address',''));
  const fixtures=window.K406_DEMO_ADDRESSES;
  fixtures.forEach((fixture,index)=>picker.add(new Option(fixture.add_line_1+', '+fixture.city,index)));
  picker.addEventListener('change',()=>{
   if(picker.value==='')return;
   const fixture=fixtures[Number(picker.value)],fields=host.closest('form').elements;
   editor.form.latitude=fixture.latitude;
   editor.form.longitude=fixture.longitude;
   for(const name of ['add_line_1','barangay','city','postal_code']){
    fields[name].value=fixture[name];
    fields[name].dispatchEvent(new Event('input',{bubbles:true}));
   }
   if(!fields.label.value.trim()){
    fields.label.value='Demo '+fixture.city;
    fields.label.dispatchEvent(new Event('input',{bubbles:true}));
   }
  });
  label.append(picker);
  host.querySelector('.address-static-footer').append(label);
 }
 if(valid&&!mock){
  const link=document.createElement('a');
  link.className='address-map-link';link.textContent='View address in Google Maps';
  link.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent([address.add_line_1,address.city,address.postal_code,'Philippines'].filter(Boolean).join(', '));
  link.target='_blank';link.rel='noopener noreferrer';host.querySelector('.address-static-footer').append(link);
 }
}};
})();
