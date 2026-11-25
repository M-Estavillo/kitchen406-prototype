/* Product layout and review content are retained from Phase 1.3. */
(() => {
const A=K406,$=A.$,hide=(id,value)=>$(id).classList.toggle('hidden',value);
const S={id:1,variant:'standard',quantity:1,available:true,type:'multi',page:'normal',feed:'empty',elig:'noteligible',error:false,rating:0,submitted:new Set()};
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
 const pack=$('productWeightBadge');
 pack.textContent=A.variant(S.id,S.variant)?.label||'';
 pack.hidden=!pack.textContent||current()?.variants.filter(variant=>variant.active!==false).length!==1;
 document.querySelector('[onclick="adjustQty(-1)"]').disabled=S.quantity<=1;
 document.querySelector('[onclick="adjustQty(1)"]').disabled=S.quantity>=10;
 let available=S.available;
 if(available&&A.inventory){
  const ingredients=A.inventory.recipe(S.id,S.variant);
  const required=ingredients&&Object.fromEntries(Object.entries(ingredients).map(([id,quantity])=>[id,quantity*S.quantity]));
  available=A.inventory.productAvailable(S.id,S.variant)&&!A.inventory.reason(required);
 }
 $('productBadgeAvailability').textContent=available?'Available':'Not available';
 const addButton=$('addToCartBtn');
 addButton.disabled=!available;
 addButton.innerHTML=available?'<span class="material-symbols-outlined">shopping_bag</span><span>Add to Cart</span>':'Not available';
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
 S.available=value;
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
 $('reviews').hidden=mode!=='normal';$('related-section').hidden=mode!=='normal';
}
function setReviewState(mode){
 if(mode==='populated'&&A.reviews&&!A.reviews.public())mode='empty';
 $('product-rating-link').hidden=mode!=='populated';
 S.feed=mode;['Populated','Loading','Error','Empty'].forEach((v,i)=>hide('reviews'+v+'State',['populated','loading','error','empty'][i]!==mode));
 $('review-summary').hidden=mode!=='populated';
}
function eligibility(){
 ['Guest','Eligible','NotEligible','AlreadyReviewed'].forEach(v=>hide('reviewCard'+v,true));
 const mode=S.submitted.has(S.reviewKey??S.id)?'reviewed':S.elig;
 hide('reviewCard'+(A.auth!=='signedin'?'Guest':mode==='eligible'?'Eligible':mode==='reviewed'?'AlreadyReviewed':'NotEligible'),false);
}
function setEligibility(mode){S.elig=mode;if(mode!=='reviewed')S.submitted.delete(S.reviewKey??S.id);eligibility();}
function handleAddToCart(){
 if(!S.available)return;
 if(A.auth!=='signedin'){A.context='protected';A.returnRoute=location.hash;location.hash='#/sign-in';return;}
 A.commerce.add(S.id,S.variant,S.quantity);
}
function openReviewModal(){
 if(A.auth!=='signedin'){A.context='review';A.returnRoute=location.hash;location.hash='#/sign-in';return;}
 if(S.elig!=='eligible'||S.submitted.has(S.reviewKey??S.id)){A.toast('Reviews are available after a completed purchase.');return;}
 S.rating=0;renderModalStars();
 $('reviewCommentInput').value='';hide('modalSubmitError',true);hide('modalSubmitSuccess',true);hide('modalFooterActions',false);
 $('reviewComposerModal').querySelector('h3+p').textContent=S.reviewItem?S.reviewItem.name+' ('+S.reviewItem.variant+')':current().name+' ('+$('productWeightBadge').textContent+')';
 $('modalSubmitBtn').textContent='Submit Review';$('modalSubmitBtn').disabled=true;A.openModal('reviewComposerModal');
}
function closeReviewModal(){pending++;S.reviewItem=null;A.closeModal();A.commerce?.render();if(A.subscriptions?.active())A.subscriptions.render();}
function renderModalStars(){
 document.querySelectorAll('#modalStarRatingRow button').forEach((b,i)=>{b.setAttribute('aria-label',(i+1)+' stars');b.setAttribute('aria-pressed',S.rating===i+1);b.querySelector('span').style.fontVariationSettings=i<S.rating?"'FILL' 1":"'FILL' 0";b.style.color=i<S.rating?'#8d4a14':'#867368';});
 $('modalRatingText').textContent=S.rating?S.rating+' / 5 stars':'Click to rate';
}
function setModalStarRating(n){S.rating=n;renderModalStars();$('modalSubmitBtn').disabled=false;$('modalSubmitBtn').classList.remove('opacity-50','cursor-not-allowed');}
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
  if(!S.error){if(S.reviewItem&&A.reviews?.capture()!==true){hide('modalSubmitError',false);return;}if(!S.reviewItem)A.reviews?.capture();hide('modalSubmitSuccess',false);hide('modalFooterActions',true);S.submitted.add(S.reviewKey??S.id);eligibility();}
 },600);
}
function previewCustomerPhoto(el){const img=el.querySelector('img');if(img){$('photo-preview-image').src=img.src;$('photo-preview-image').alt=img.alt;A.openModal('photo-modal');}}
function show(id){
 const item=A.products.find(p=>p.id===id&&p.active!==false);if(!item){setPageState('notfound');return;}
 pending++;S.reviewItem=null;S.id=id;S.reviewKey=id;S.quantity=1;S.variant='standard';S.type=item.variants.length>1?'multi':'single';S.available=item.available;
 $('mainProductContent').querySelector('h1').textContent=item.name;
 $('product-breadcrumb-name').textContent=item.name;$('product-breadcrumb-category').textContent=item.categoryLabel;
 $('product-category').textContent=item.categoryLabel;
 $('mainProductContent').querySelector('p').textContent=item.description+(item.price.startsWith('From')?' Additional size and price details are not provided in this prototype.':'');
 $('mainProductImg').src=item.image;$('mainProductImg').alt=item.name;
 $('product-rating-link').href='#/product/'+id+'/reviews';
 $('product-subscription-badge').hidden=!item.subscription;
 $('subscribeToProductBtn').hidden=!item.subscription;
 $('subscribeToProductBtn').disabled=A.subscriptions.offering(S.id)!=='available';
 setProductType(S.type);setAvailability(item.available);setPageState('normal');setReviewState('populated');eligibility();
 $('related-products').innerHTML=A.products.filter(p=>p.id!==id&&p.category===item.category).slice(0,3).map(A.catalog.card).join('');
 document.querySelectorAll('#reviewsPopulatedState [onclick]').forEach(el=>{el.tabIndex=0;el.setAttribute('role','button');el.setAttribute('aria-label','Preview customer photo');});
}
Object.assign(window,{updatePricing,selectVariant,adjustQty,switchProductThumb,setAvailability,setProductType,setPageState,setReviewState,setEligibility,handleAddToCart,openReviewModal,closeReviewModal,setModalStarRating,handleReviewSubmit,previewCustomerPhoto});
A.product={show,state:S,eligibility,setPageState,setReviewState,setEligibility,setProductType,setAvailability:simulateAvailability,
 refreshAvailability(){
  const item=current();
  if(!item)return;
  setAvailability(item.available);
  $('subscribeToProductBtn').disabled=A.subscriptions.offering(S.id)!=='available';
 }
};
document.addEventListener('keydown',e=>{if(e.target.matches('#reviewsPopulatedState [role=button]')&&(e.key==='Enter'||e.key===' ')){e.preventDefault();e.target.click();}});
$('subscribeToProductBtn').addEventListener('click',()=>{if(A.subscriptions.begin(S.id,S.variant,S.quantity))location.hash='#/subscription/configure';});
$('reviewCommentInput').addEventListener('input',e=>e.target.setCustomValidity(''));
})();
