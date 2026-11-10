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
const price=()=>A.variant(S.id,S.variant)?.price||0;
function updatePricing(){
 const base=price(),total=base*S.quantity;
 $('productPriceDisplay').textContent='₱'+base;$('subtotalDisplay').textContent='₱'+total;
 $('subtotalDisplay').previousElementSibling.textContent='Item Subtotal';
 $('qtyCounter').parentElement.firstElementChild.textContent='Quantity';
 if($('btnPriceAmount'))$('btnPriceAmount').textContent='₱'+total;
 $('qtyCounter').textContent=S.quantity;
 $('productWeightBadge').textContent=A.variant(S.id,S.variant)?.label||current().variant;
 document.querySelector('[onclick="adjustQty(-1)"]').disabled=S.quantity<=1;
 document.querySelector('[onclick="adjustQty(1)"]').disabled=S.quantity>=10;
 if(A.inventory){const ingredients=A.inventory.recipe(S.id,S.variant),required=ingredients&&Object.fromEntries(Object.entries(ingredients).map(([id,q])=>[id,q*S.quantity])),shortage=A.inventory.reason(required);$('addToCartBtn').disabled=!S.available||!A.inventory.productAvailable(S.id,S.variant)||!!shortage;$('productBadgeAvailability').textContent=shortage?'Insufficient ingredients for this quantity':S.available?'Available':'Temporarily unavailable';}
}

function selectVariant(type){
 S.variant=type;
 document.querySelectorAll('#variantSection [data-variant-id]').forEach(b=>{const selected=b.dataset.variantId===type;b.style.borderColor=selected?'#8d4a14':'transparent';b.setAttribute('aria-pressed',selected);b.querySelector('.material-symbols-outlined').textContent=selected?'check_circle':'radio_button_unchecked';});
 updatePricing();
}
function adjustQty(delta){S.quantity=Math.max(1,Math.min(10,S.quantity+delta));updatePricing();}
function switchProductThumb(src,index){
 $('mainProductImg').src=src;
 document.querySelectorAll('.thumb-btn').forEach((b,i)=>{b.style.outline=i===index?'2px solid #8d4a14':'none';b.setAttribute('aria-pressed',i===index);});
}
function setAvailability(value){
 S.available=value;$('addToCartBtn').disabled=!value;
 $('productBadgeAvailability').textContent=value?'Available':'Temporarily unavailable';
 $('addToCartBtn').innerHTML=value?'<span class="material-symbols-outlined">shopping_bag</span><span>Add to Cart</span>':'Currently Sold Out';
 updatePricing();
}
function simulateAvailability(value){
 const item=current();if(!item)return;
 // Update the shared catalog flag used by cart validation as well as this view.
 item.available=value;
 setAvailability(value);
 A.catalog.refresh();
}
function setProductType(type){S.type=type;const variants=current().variants,active=variants.filter(v=>v.active!==false),first=$('variantBtnStd'),container=first.parentElement,classes=first.className;hide('variantSection',type==='single'||active.length<2);container.innerHTML=variants.map((v,i)=>`<button type="button" class="${classes}" id="${i===0?'variantBtnStd':i===1?'variantBtnLrg':'variantBtn'+i}" data-variant-id="${A.escape(v.id)}" ${v.active===false?'hidden disabled':''}><strong>${A.escape(v.label)}</strong><span>₱${v.price}</span><span class="material-symbols-outlined">radio_button_unchecked</span></button>`).join('');container.querySelectorAll('[data-variant-id]').forEach(b=>b.onclick=()=>selectVariant(b.dataset.variantId));selectVariant(active[0]?.id||variants[0].id);}
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
 const mode=S.submitted.has(S.reviewKey??S.id)?'reviewed':S.elig;
 hide('reviewCard'+(A.auth!=='signedin'?'Guest':mode==='eligible'?'Eligible':mode==='reviewed'?'AlreadyReviewed':'NotEligible'),false);
}
function setEligibility(mode){S.elig=mode;if(mode!=='reviewed')S.submitted.delete(S.reviewKey??S.id);eligibility();A.inspector?.();}
function handleAddToCart(){
 if(!S.available)return;
 if(A.auth!=='signedin'){A.context='protected';A.returnRoute=location.hash;location.hash='#/sign-in';return;}
 A.commerce.add(S.id,S.variant,S.quantity);
}
function openReviewModal(){
 if(A.auth!=='signedin'){A.context='review';A.returnRoute=location.hash;location.hash='#/sign-in';return;}
 if(S.elig!=='eligible'||S.submitted.has(S.reviewKey??S.id)){A.toast('Use Mock Controls to preview an eligible completed purchase.');return;}
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
 const comment=$('reviewCommentInput');
 if(comment.value.length>300){comment.setCustomValidity('Keep your review to 300 characters or fewer.');comment.reportValidity();return;}
 comment.setCustomValidity('');
 const token=++pending,productId=S.id;$('modalSubmitBtn').disabled=true;$('modalSubmitBtn').textContent='Submitting…';
 setTimeout(()=>{
  if(token!==pending||A.modal!=='reviewComposerModal'||S.id!==productId)return;
  $('modalSubmitBtn').disabled=false;$('modalSubmitBtn').textContent='Submit Review';
  hide('modalSubmitError',!S.error);
  if(!S.error){A.reviews?.capture();hide('modalSubmitSuccess',false);hide('modalFooterActions',true);S.submitted.add(S.reviewKey??S.id);eligibility();}
 },600);
}
function previewCustomerPhoto(el){const img=el.querySelector('img');if(img){$('photo-preview-image').src=img.src;$('photo-preview-image').alt=img.alt;A.openModal('photo-modal');}}
function show(id){
 const item=A.products.find(p=>p.id===id);if(!item){setPageState('notfound');return;}
 pending++;S.id=id;S.reviewKey=id;S.quantity=1;S.variant='standard';S.type=item.variants.length>1?'multi':'single';S.available=item.available;
 $('mainProductContent').querySelector('h1').textContent=item.name;
 $('product-breadcrumb-name').textContent=item.name;$('product-breadcrumb-category').textContent=item.categoryLabel;
 $('product-category').textContent=item.categoryLabel;
 $('mainProductContent').querySelector('p').textContent=item.description+(item.price.startsWith('From')?' Additional size and price details are not provided in this prototype.':'');
 $('mainProductImg').src=item.image;$('mainProductImg').alt=item.name;
 $('product-gallery').innerHTML=id===1?original.gallery:'';
 $('product-rating-link').hidden=id!==1;
 $('product-subscription-badge').hidden=!item.subscription;
 $('subscribeToProductBtn').hidden=!item.subscription;
 $('subscribeToProductBtn').disabled=A.subscriptions.offering(S.id)!=='available';
 $('reviewsPopulatedState').innerHTML=id===1?original.reviews:'<p class="alert">No review content is provided for this product in the source mockups.</p>';
 $('review-summary').innerHTML=original.summary;
 setProductType(S.type);setAvailability(item.available);setPageState('normal');setReviewState(id===1?'populated':'empty');eligibility();
 $('related-products').innerHTML=A.products.filter(p=>p.id!==id&&p.category===item.category).slice(0,3).map(A.catalog.card).join('');
 document.querySelectorAll('#reviewsPopulatedState [onclick]').forEach(el=>{el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label','Preview customer photo');});
}
Object.assign(window,{updatePricing,selectVariant,adjustQty,switchProductThumb,setAvailability,setProductType,setPageState,setReviewState,setEligibility,handleAddToCart,openReviewModal,closeReviewModal,setModalStarRating,toggleMockPhoto,handleReviewSubmit,previewCustomerPhoto});
A.product={show,state:S,eligibility,setPageState,setReviewState,setEligibility,setProductType,setAvailability:simulateAvailability};
document.querySelectorAll('#slotPhoto1,#slotPhoto2').forEach(el=>el.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();el.click();}}));
document.addEventListener('keydown',e=>{if(e.target.matches('#reviewsPopulatedState [role=button]')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.target.click();}});
$('subscribeToProductBtn').addEventListener('click',()=>{if(A.subscriptions.begin(S.id,S.variant,S.quantity))location.hash='#/subscription/configure';});
$('reviewCommentInput').addEventListener('input',e=>e.target.setCustomValidity(''));
renderPhotoSlots();
})();
