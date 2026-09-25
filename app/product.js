/* Product layout and review content are retained from Phase 1.3. */
(() => {
const A=K406,$=A.$,hide=(id,value)=>$(id).classList.toggle('hidden',value);
const S={id:1,variant:'standard',quantity:1,available:true,type:'multi',page:'normal',feed:'populated',elig:'noteligible',error:false,rating:0,photos:[false,false],submitted:new Set()};
const original={
 image:$('mainProductImg').src,
 description:$('mainProductContent').querySelector('p').textContent,
 gallery:[...document.querySelectorAll('.thumb-btn')].map(b=>b.outerHTML).join(''),
 summary:$('review-summary').innerHTML,
 reviews:$('reviewsPopulatedState').innerHTML
};
let pending=0;
const current=()=>A.products.find(p=>p.id===S.id);
const price=()=>S.id===1&&S.variant==='large'?480:parseInt(current().price.replace(/\D/g,''),10);
function updatePricing(){
 const base=price(),total=base*S.quantity;
 $('productPriceDisplay').textContent=S.id===1?'₱'+base:current().price;$('subtotalDisplay').textContent='₱'+total;
 if($('btnPriceAmount'))$('btnPriceAmount').textContent='₱'+total;
 $('qtyCounter').textContent=S.quantity;
 $('productWeightBadge').textContent=S.id===1?(S.variant==='large'?'950g Large':'650g Standard'):current().variant;
 document.querySelector('[onclick="adjustQty(-1)"]').disabled=S.quantity<=1;
 document.querySelector('[onclick="adjustQty(1)"]').disabled=S.quantity>=12;
}
function selectVariant(type){
 S.variant=type;
 ['Std','Lrg'].forEach((suffix,i)=>{
  const b=$('variantBtn'+suffix),selected=(i===0)===(type==='standard');
  b.style.borderColor=selected?'#8d4a14':'transparent';b.setAttribute('aria-pressed',selected);
  b.querySelector('.material-symbols-outlined').textContent=selected?'check_circle':'radio_button_unchecked';
 });
 updatePricing();
}
function adjustQty(delta){S.quantity=Math.max(1,Math.min(12,S.quantity+delta));updatePricing();}
function switchProductThumb(src,index){
 $('mainProductImg').src=src;
 document.querySelectorAll('.thumb-btn').forEach((b,i)=>{b.style.outline=i===index?'2px solid #8d4a14':'none';b.setAttribute('aria-pressed',i===index);});
}
function setAvailability(value){
 S.available=value;$('addToCartBtn').disabled=!value;
 $('productBadgeAvailability').textContent=value?'Available':'Temporarily unavailable';
 $('addToCartBtn').innerHTML=value?'<span class="material-symbols-outlined">shopping_bag</span><span>Add to Cart • <span id="btnPriceAmount"></span></span>':'Currently Sold Out';
 updatePricing();
}
function setProductType(type){S.type=type;hide('variantSection',type==='single'||S.id!==1);selectVariant('standard');}
function setPageState(mode){
 S.page=mode;
 ['mainProductContent','pageSkeletonState','pageErrorState','pageNotFoundState'].forEach((id,i)=>hide(id,['normal','loading','error','notfound'][i]!==mode));
 $('reviews').hidden=mode!=='normal';$('related-section').hidden=mode!=='normal';A.inspector?.();
}
function setReviewState(mode){
 S.feed=mode;['Populated','Loading','Error','Empty'].forEach((v,i)=>hide('reviews'+v+'State',['populated','loading','error','empty'][i]!==mode));
 $('review-summary').hidden=mode!=='populated'||S.id!==1;A.inspector?.();
}
function eligibility(){
 ['Guest','Eligible','NotEligible','AlreadyReviewed'].forEach(v=>hide('reviewCard'+v,true));
 const mode=S.submitted.has(S.id)?'reviewed':S.elig;
 hide('reviewCard'+(A.auth!=='signedin'?'Guest':mode==='eligible'?'Eligible':mode==='reviewed'?'AlreadyReviewed':'NotEligible'),false);
}
function setEligibility(mode){S.elig=mode;if(mode!=='reviewed')S.submitted.delete(S.id);eligibility();A.inspector?.();}
function handleAddToCart(){
 if(!S.available)return;
 if(A.auth!=='signedin'){A.context='protected';A.returnRoute=location.hash;location.hash='#/sign-in';return;}
 A.commerce.add(S.id,S.variant,S.quantity);
}
function openReviewModal(){
 if(A.auth!=='signedin'){A.context='review';A.returnRoute=location.hash;location.hash='#/sign-in';return;}
 if(S.elig!=='eligible'||S.submitted.has(S.id)){A.toast('Use Mock Controls to preview an eligible completed purchase.');return;}
 S.rating=0;S.photos=[false,false];renderModalStars();renderPhotoSlots();
 $('reviewCommentInput').value='';hide('modalSubmitError',true);hide('modalSubmitSuccess',true);hide('modalFooterActions',false);
 $('reviewComposerModal').querySelector('h3+p').textContent=current().name+' ('+$('productWeightBadge').textContent+')';
 $('modalSubmitBtn').textContent='Submit Review';$('modalSubmitBtn').disabled=true;A.openModal('reviewComposerModal');
}
function closeReviewModal(){pending++;A.closeModal();A.commerce?.render();}
function renderModalStars(){
 document.querySelectorAll('#modalStarRatingRow button').forEach((b,i)=>{b.setAttribute('aria-label',(i+1)+' stars');b.setAttribute('aria-pressed',S.rating===i+1);b.querySelector('span').style.fontVariationSettings=i<S.rating?"'FILL' 1":"'FILL' 0";b.style.color=i<S.rating?'#8d4a14':'#867368';});
 $('modalRatingText').textContent=S.rating?S.rating+' / 5 stars':'Click to rate';
}
function setModalStarRating(n){S.rating=n;renderModalStars();$('modalSubmitBtn').disabled=false;$('modalSubmitBtn').classList.remove('opacity-50','cursor-not-allowed');}
function renderPhotoSlots(){
 S.photos.forEach((selected,i)=>{
  const el=$('slotPhoto'+(i+1));el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-label',(selected?'Remove':'Select')+' demo photo '+(i+1));
  el.innerHTML=selected?'<img alt="Selected demo photo" src="'+current().image+'" class="w-full h-full object-cover">':'<span class="material-symbols-outlined">add_a_photo</span><span>Demo photo</span>';
 });
 $('photoCountLabel').textContent=S.photos.filter(Boolean).length+' / 2 selected';
}
function toggleMockPhoto(n){S.photos[n-1]=!S.photos[n-1];renderPhotoSlots();}
function handleReviewSubmit(){
 if(!S.rating||$('modalSubmitBtn').disabled)return;
 const token=++pending,productId=S.id;$('modalSubmitBtn').disabled=true;$('modalSubmitBtn').textContent='Submitting…';
 setTimeout(()=>{
  if(token!==pending||A.modal!=='reviewComposerModal'||S.id!==productId)return;
  $('modalSubmitBtn').disabled=false;$('modalSubmitBtn').textContent='Submit Review';
  hide('modalSubmitError',!S.error);
  if(!S.error){hide('modalSubmitSuccess',false);hide('modalFooterActions',true);S.submitted.add(S.id);eligibility();}
 },600);
}
function previewCustomerPhoto(el){const img=el.querySelector('img');if(img){$('photo-preview-image').src=img.src;$('photo-preview-image').alt=img.alt;A.openModal('photo-modal');}}
function show(id){
 const item=A.products.find(p=>p.id===id);if(!item){setPageState('notfound');return;}
 pending++;S.id=id;S.quantity=1;S.variant='standard';S.type=id===1?'multi':'single';S.available=item.available;
 $('mainProductContent').querySelector('h1').textContent=item.name;
 $('product-breadcrumb-name').textContent=item.name;$('product-breadcrumb-category').textContent=item.categoryLabel;
 $('product-category').textContent=item.categoryLabel;
 $('mainProductContent').querySelector('p').textContent=id===1?original.description:item.description+(item.price.startsWith('From')?' Additional size and price details are not provided in this prototype.':'');
 $('mainProductImg').src=item.image;$('mainProductImg').alt=item.name;
 $('product-gallery').innerHTML=id===1?original.gallery:'';
 $('product-rating-link').hidden=id!==1;
 $('product-subscription').hidden=!item.subscription;
 $('product-subscription').querySelector('p').textContent=id===1?'Receive a fresh Braided Babka every week with our 4-Week Prepaid Plan. Automatic batch dispatch straight to your table.':'Subscription available for this product. Preview only; subscription plans belong to a later phase.';
 $('product-subscription-badge').hidden=!item.subscription;
 $('reviewsPopulatedState').innerHTML=id===1?original.reviews:'<p class="alert">No review content is provided for this product in the source mockups.</p>';
 $('review-summary').innerHTML=original.summary;
 setProductType(S.type);setAvailability(item.available);setPageState('normal');setReviewState(id===1?'populated':'empty');eligibility();
 $('related-products').innerHTML=A.products.filter(p=>p.id!==id&&p.category===item.category).slice(0,3).map(A.catalog.card).join('');
 document.querySelectorAll('#reviewsPopulatedState [onclick]').forEach(el=>{el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label','Preview customer photo');});
}
Object.assign(window,{updatePricing,selectVariant,adjustQty,switchProductThumb,setAvailability,setProductType,setPageState,setReviewState,setEligibility,handleAddToCart,openReviewModal,closeReviewModal,setModalStarRating,toggleMockPhoto,handleReviewSubmit,previewCustomerPhoto});
A.product={show,state:S,eligibility,setPageState,setReviewState,setEligibility,setProductType,setAvailability};
document.querySelectorAll('#slotPhoto1,#slotPhoto2').forEach(el=>el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}}));
document.addEventListener('keydown',e=>{if(e.target.matches('#reviewsPopulatedState [role=button]')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.target.click();}});
renderPhotoSlots();
})();
