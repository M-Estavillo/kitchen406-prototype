(() => {
const A=K406,C=A.commerce;
C.addressMap={mount(){
 const host=A.$('address-map'),status=A.$('address-map-status');
 if(!host)return;
 const context=C.addressContext(),editor=context.editor,address=editor.form||context.address();
 editor.mapBusy=false;
 const editing=!!editor.form,valid=C.addressValid(address);
 const route=A.route==='subscription'?A.subscriptions.deliveryRoute:C.deliveryRoute;
 const state=editing?'editing':valid?route.status():'missing';
 host.dataset.state=state;
 host.innerHTML='<img src="assets/delivery-area.png" alt="Static Google Maps view of Metro Cebu" class="address-static-image"><div class="address-static-footer"><span class="address-static-caption">'+(editing?'Address preview':valid?'Delivery area preview':'Add a delivery address')+'</span></div>';
 if(status)status.textContent=editing?'Enter your address details below. The map is a static area preview.':'Static area preview. Delivery availability uses the selected city.';
 if(valid){
  const link=document.createElement('a');
  link.className='address-map-link';link.textContent='View address in Google Maps';
  link.href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent([address.add_line_1,address.city,address.postal_code,'Philippines'].filter(Boolean).join(', '));
  link.target='_blank';link.rel='noopener noreferrer';host.querySelector('.address-static-footer').append(link);
 }
}};
})();
