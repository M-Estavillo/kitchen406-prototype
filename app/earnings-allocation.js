/* Preparing owners are independent of the account advancing fulfillment. */
(() => {
const A=K406,E=A.escape,V=A.ownerUI,N=A.earnings={};
N.assigned=o=>o.ownerAllocation?.length===o.items.length && o.items.every((item,index)=>{
 const share=o.ownerAllocation[index];
 return share?.choice==='a'&&share.a===100||share?.choice==='b'&&share.a===0||share?.choice==='both'&&Number.isInteger(share.a)&&share.a>=1&&share.a<=99;
});
N.readyEditor=o=>o&&!N.assigned(o)?N.editor(o):'';
N.editor=o=>`<fieldset data-allocation-order="${E(o.id)}"><legend>${E(o.id)} · Prepared by</legend><p class="muted">Select the baking owner per product. Staff actions do not receive an earnings share.</p><label>Apply to all products <select data-allocation-all><option value="">Choose owners</option><option value="a">Owner A</option><option value="b">Owner B</option><option value="both">Both owners</option></select></label>${o.items.map((item,index)=>{const share=o.ownerAllocation?.[index];return `<div class="field" data-allocation-item="${index}"><label for="allocation-${E(o.id)}-${index}">${E(item.name)} · ${E(item.variant||'')} × ${item.quantity}</label><select id="allocation-${E(o.id)}-${index}" data-allocation-choice><option value="">Choose owners</option>${[['a','Owner A'],['b','Owner B'],['both','Both owners']].map(([value,label])=>`<option value="${value}" ${share?.choice===value?'selected':''}>${label}</option>`).join('')}</select><label>Owner A share (%) <input data-allocation-percent type="number" min="1" max="99" step="1" value="${share?.a>0&&share.a<100?share.a:50}" ${share?.choice==='both'?'':'disabled'}></label><small>Both owners: Owner B receives the remaining percentage.</small></div>`;}).join('')}</fieldset>`;
N.read=o=>{
 const field=[...document.querySelectorAll('[data-allocation-order]')].find(el=>el.dataset.allocationOrder===o.id);
 if(!field)return {error:'Choose preparing owners before marking the order ready.'};
 const values=[...field.querySelectorAll('[data-allocation-item]')].map(row=>{const choice=row.querySelector('select').value,a=choice==='a'?100:choice==='b'?0:Number(row.querySelector('input').value);return {choice,a};});
 if(values.length!==o.items.length||values.some(v=>!['a','b','both'].includes(v.choice)||!Number.isInteger(v.a)||v.choice==='both'&&(v.a<1||v.a>99)))return {error:'Choose preparing owners for every product and a whole-number split from 1% to 99% when both owners bake.'};
 return {values};
};
N.panel=o=>!o||o.type==='subscription_purchase'?'':V.panel('Preparing owners',`${o.items.map((item,index)=>{const share=o.ownerAllocation?.[index];return `<p><strong>${E(item.name)}</strong> · ${share?share.choice==='a'?'Owner A · 100%':share.choice==='b'?'Owner B · 100%':`Owner A ${share.a}% / Owner B ${100-share.a}%`:'Unallocated'}</p>`;}).join('')}`);
document.addEventListener('change',event=>{
 const field=event.target.closest('[data-allocation-order]');
 if(field){
  if(event.target.matches('[data-allocation-all]'))field.querySelectorAll('[data-allocation-choice]').forEach(select=>{select.value=event.target.value;select.dispatchEvent(new Event('change',{bubbles:true}));});
  if(event.target.matches('[data-allocation-choice]'))event.target.closest('[data-allocation-item]').querySelector('input').disabled=event.target.value!=='both';
 }
 if(event.target.id==='owner-earnings-type'){A.analytics.orderType=event.target.value;A.owner.render();}
 if(event.target.id==='owner-earnings-owner'||event.target.id==='owner-earnings-basis'){A.analytics[event.target.id.endsWith('owner')?'owner':'basis']=event.target.value;A.owner.render();}
});
const recorded=A.analytics.transactions;
N.transactions=()=>{
 if(!A.session.ownerAllowed())return [];
 return A.operations.orders().filter(o=>o.paid&&A.operations.status(o)==='completed').map(o=>{
  let amount=o.items.reduce((sum,i)=>sum+Math.round(i.price*100)*i.quantity,0);
  if(o.type==='subscription'){
   const record=A.subscriptions.allRecords().find(r=>r.id===o.subscriptionId),purchase=A.operations.purchases().find(p=>p.id===record?.purchaseId);
   if(purchase){const siblings=A.operations.orders().filter(row=>row.subscriptionId===record.id),base=siblings.reduce((sum,row)=>sum+row.items.reduce((n,i)=>n+Math.round(i.price*100)*i.quantity,0),0);const total=Math.round((purchase.snapshot.products??purchase.snapshot.total-purchase.snapshot.delivery)*100),before=siblings.slice(0,siblings.findIndex(row=>row.id===o.id)).reduce((sum,row)=>sum+row.items.reduce((n,i)=>n+Math.round(i.price*100)*i.quantity,0),0);amount=base?Math.round(total*(before+amount)/base)-Math.round(total*before/base):0;}
  }
  const base=o.items.reduce((sum,i)=>sum+Math.round(i.price*100)*i.quantity,0);let used=0,estimatedProfit=0,unknown=false;
  const items=o.items.map((item,index)=>{
   const cents=index===o.items.length-1?amount-used:base?Math.round(amount*Math.round(item.price*100)*item.quantity/base):0;used+=cents;
   const share=o.ownerAllocation?.[index],a=share?Math.round(cents*share.a/100):0,owner=A.analytics.owner;
   const allocated=owner==='all'?cents:owner==='unallocated'?share?0:cents:!share?0:owner==='owner-a'?a:cents-a;
   const weight=owner==='all'?1:owner==='unallocated'?share?0:1:!share?0:owner==='owner-a'?share.a/100:1-share.a/100;
   const materials=A.inventory.materials(o.type==='cake'?o:{...o,items:[item]}),cost=A.pricing.breakdown(materials,A.pricing.overhead*item.quantity,0);
   if(weight&&cost===null)unknown=true;else if(cost)estimatedProfit+=allocated/100-cost.total*weight;
   return {...item,quantity:item.quantity*weight,price:weight&&item.quantity?allocated/100/(item.quantity*weight):0};
  }).filter(i=>i.quantity>0&&(!A.analytics.productIds.length||A.analytics.productIds.includes(String(i.productId))));
  // Cost totals follow the same product filter as revenue.
  if(A.analytics.productIds.length){estimatedProfit=0;unknown=false;for(const item of items){const original=o.items.find(i=>i.productId===item.productId&&i.variant===item.variant),weight=item.quantity/original.quantity,cost=A.pricing.breakdown(A.inventory.materials(o.type==='cake'?o:{...o,items:[original]}),A.pricing.overhead*original.quantity,0);if(!cost)unknown=true;else estimatedProfit+=item.price*item.quantity-cost.total*weight;}}
  return {order:o,date:V.businessDate(o.completedAt||o.delivery?.delivered_at),items,total:items.reduce((sum,i)=>sum+i.price*i.quantity,0),estimatedProfit:unknown?null:estimatedProfit};
 }).filter(t=>t.items.length);
};
A.analytics.transactions=()=>A.analytics.basis==='payments'?recorded():N.transactions();
})();
