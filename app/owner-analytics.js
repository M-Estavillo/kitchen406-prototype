/* Recorded-payment reporting. Fulfillment children never create a second sale. */
(() => {
const A=K406,V=A.ownerUI,E=A.escape,D=A.schedule;
const defaults={period:'month',from:'',to:'',sort:'sales',selection:'current',productIds:[]};
const R=A.analytics={...defaults};
const periods=[['day','Day'],['week','Week'],['month','Month'],['quarter','Quarter'],['year','Year'],['custom','Custom range']];
const dateString=date=>date.toISOString().slice(0,10);
R.options=(period=R.period)=>{
 const today=V.businessDate(Date.now()),year=Number(today.slice(0,4)),month=Number(today.slice(5,7))-1;
 const span=(monthIndex,count=1)=>({from:dateString(new Date(Date.UTC(year,monthIndex,1))),to:dateString(new Date(Date.UTC(year,monthIndex+count,0)))});
 const weekStart=D.add(today,-((D.day(today)+6)%7));
 let current,choices=[];
 if(period==='day'){
  current={from:today,to:today};
  choices=['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'].map((label,index)=>({label,from:D.add(weekStart,index),to:D.add(weekStart,index)}));
 }else if(period==='week'){
  current={from:weekStart,to:today};
  const bounds=span(month);
  for(let from=D.add(bounds.from,-((D.day(bounds.from)+6)%7));from<=bounds.to;from=D.add(from,7)){
   choices.push({label:'Week of '+shortDate(from),from,to:D.add(from,6)});
  }
 }else if(period==='month'){
  current={from:span(month).from,to:today};
  choices=Array.from({length:12},(_,index)=>({...span(index),label:new Date(Date.UTC(year,index,1)).toLocaleDateString('en-PH',{month:'long',timeZone:'UTC'})}));
 }else if(period==='quarter'){
  current={from:span(Math.floor(month/3)*3,3).from,to:today};
  choices=Array.from({length:4},(_,index)=>({...span(index*3,3),label:'Quarter '+(index+1)}));
 }else if(period==='year'){
  current={from:year+'-01-01',to:today};
  choices=Array.from({length:5},(_,index)=>({label:String(year-index),from:(year-index)+'-01-01',to:(year-index)+'-12-31'}));
 }else return [];
 return [{value:'current',label:'This '+period,...current},...choices.map(choice=>({...choice,value:choice.from}))];
};
R.range=(period=R.period,from=R.from,to=R.to)=>{
 if(period==='custom')return {from,to};
 const options=R.options(period),selected=options.find(option=>option.value===R.selection)||options[0];
 return {from:selected.from,to:selected.to};
};
R.valid=({from,to})=>D.valid(from)&&D.valid(to)&&from<=to;
R.transactions=()=>{
 if(!A.session.ownerAllowed())return [];
 return A.operations.list().filter(o=>o.paid&&o.type!=='subscription').map(o=>{
  const paidAttempt=o.attempts?.find(a=>a.paid_at),date=V.businessDate(paidAttempt?.paid_at||o.paidAt);
  const s=o.snapshot,items=o.type==='subscription_purchase'?[{productId:s.productId,key:s.productId+':'+s.variantId,name:s.name,variant:s.variant,quantity:s.quantity*4,price:s.unit}]:o.items;
  return {order:o,date,items,total:o.total};
 });
};
R.report=(range=R.range())=>{
 const all=R.transactions(),transactions=all.filter(t=>t.date&&t.date>=range.from&&t.date<=range.to).map(t=>{
  if(!R.productIds.length)return t;
  const items=t.items.filter(item=>R.productIds.includes(String(item.productId)));
  const total=items.reduce((sum,item)=>sum+Math.round(item.price*100)*item.quantity,0)/100;
  return {...t,items,total};
 }).filter(t=>t.items.length),products=new Map();
 const days=Math.round((Date.parse(range.to)-Date.parse(range.from))/86400000)+1,group=days<=31?'day':days<=120?'week':'month';
 const key=date=>group==='month'?date.slice(0,7)+'-01':group==='week'?D.add(date,-((D.day(date)+6)%7)):date;
 const buckets=new Map();
 // Iterate groups, rather than days, so even a long custom range stays bounded by its displayed periods.
 for(let date=key(range.from);date<=range.to;){buckets.set(date,{date,total:0,count:0});if(group==='month'){if(date.slice(0,7)===range.to.slice(0,7))break;const next=new Date(date+'T00:00:00Z');next.setUTCMonth(next.getUTCMonth()+1);date=next.toISOString().slice(0,10);}else date=D.add(date,group==='week'?7:1);}
 let itemTotal=0;
 for(const t of transactions){const bucket=buckets.get(key(t.date));bucket.total+=Math.round(t.total*100);bucket.count++;
  for(const i of t.items){const id=i.key||i.productId+':'+i.variant,row=products.get(id)||{id,productId:i.productId,name:i.name,variant:i.variant,quantity:0,sales:0};row.quantity+=i.quantity;row.sales+=Math.round(i.price*100)*i.quantity;itemTotal+=Math.round(i.price*100)*i.quantity;products.set(id,row);}
 }
 const total=transactions.reduce((sum,t)=>sum+Math.round(t.total*100),0);
 return {transactions,total:total/100,count:transactions.length,itemTotal:itemTotal/100,other:(total-itemTotal)/100,products:[...products.values()].map(p=>({...p,sales:p.sales/100})),buckets:[...buckets.values()].map(b=>({...b,total:b.total/100})),group,undated:all.filter(t=>!t.date).length};
};
const shortDate=date=>new Date(date+'T00:00:00Z').toLocaleDateString('en-PH',{month:'short',day:'numeric',timeZone:'UTC'});
function chart(report){
 const buckets=report.buckets,max=Math.max(...buckets.map(b=>b.total),1),width=720,height=220,left=60,right=16,top=18,bottom=32,w=width-left-right,h=height-top-bottom;
 const x=i=>left+(buckets.length===1?w/2:i*w/(buckets.length-1)),y=n=>top+h-n/max*h;
 const points=buckets.map((b,i)=>`${x(i)},${y(b.total)}`).join(' '),area=`${left},${top+h} ${points} ${x(buckets.length-1)},${top+h}`;
 const ticks=Array.from({length:4},(_,i)=>{const amount=max*i/3,yy=y(amount);return `<line x1="${left}" y1="${yy}" x2="${width-right}" y2="${yy}" stroke="var(--line)"/><text x="${left-8}" y="${yy+4}" text-anchor="end">${amount>=1000?'₱'+(amount/1000).toFixed(1)+'k':'₱'+Math.round(amount)}</text>`;}).join('');
 const labels=[...new Set([0,Math.floor((buckets.length-1)/2),buckets.length-1])].map(i=>`<text x="${x(i)}" y="${height-8}" text-anchor="${i===0?'start':i===buckets.length-1?'end':'middle'}">${E(shortDate(buckets[i].date))}</text>`).join('');
 return `<div class="owner-analytics-trend"><svg viewBox="0 0 ${width} ${height}" role="img" aria-label="${report.group} sales trend in Philippine pesos"><title>Recorded payments by ${report.group}</title>${ticks}<polygon points="${area}" fill="var(--accent)" opacity=".08"/><polyline points="${points}" fill="none" stroke="var(--accent)" stroke-width="2.5" stroke-linejoin="round"/>${buckets.map((b,i)=>`<circle cx="${x(i)}" cy="${y(b.total)}" r="3.5" fill="var(--accent)" tabindex="0"><title>${E(V.date(b.date))}: ${V.money(b.total)} · ${b.count} purchases</title></circle>`).join('')}${labels}</svg></div>`;
}
function mix(report){
 const types=[['standard','Standard','#8d4a14'],['subscription_purchase','Subscriptions','#c68c4c'],['cake','Custom cakes','#697a64']].map(([type,label,color])=>({label,color,total:report.transactions.filter(t=>t.order.type===type).reduce((n,t)=>n+t.total,0)}));
 let angle=0;const segments=types.map(t=>{const start=angle;angle+=report.total?t.total/report.total*100:0;return `${t.color} ${start}% ${angle}%`;});
 return `<div class="owner-analytics-mix"><div class="owner-sales-donut" style="background:conic-gradient(${report.total?segments.join(','):'var(--line) 0% 100%'})" role="img" aria-label="Sales by order type"><div><strong>${report.count}</strong><span>purchases</span></div></div><div class="owner-sales-legend">${types.map(t=>`<div><span><i style="background:${t.color}"></i>${t.label}</span><strong>${V.money(t.total)}</strong><small>${report.total?Math.round(t.total/report.total*100):0}%</small></div>`).join('')}</div></div>`;
}
function periodControl(range){
 if(R.period==='custom')return `<div class="field owner-order-range"><label id="owner-order-range-label">Date Range</label><details id="owner-order-range"><summary aria-labelledby="owner-order-range-label owner-order-range-value"><span id="owner-order-range-value">${E(shortDate(range.from))} – ${E(shortDate(range.to))}</span><span aria-hidden="true">⌄</span></summary><div class="owner-range-popover" role="group" aria-label="Choose date range"></div></details></div>`;
 return V.select('analytics-selection','Selection',R.options().map(option=>[option.value,option.label]),R.selection);
}
function productControl(){
 const products=new Map(A.products.map(p=>[String(p.id),p.name]));
 for(const transaction of R.transactions())for(const item of transaction.items)products.set(String(item.productId),item.productId===0?'Custom cakes':item.name);
 return `<div class="field owner-analytics-products"><label id="analytics-product-label">Product</label><details id="analytics-products"><summary aria-labelledby="analytics-product-label analytics-product-value"><span id="analytics-product-value">${R.productIds.length?R.productIds.length+' selected':'All products'}</span><span aria-hidden="true">⌄</span></summary><div class="owner-product-popover" role="group" aria-label="Products"><button type="button" class="text-link" data-owner="analytics-products-all">All products</button>${[...products].map(([id,name])=>`<label><input type="checkbox" data-analytics-product value="${E(id)}" ${R.productIds.includes(id)?'checked':''}><span>${E(name)}</span></label>`).join('')}</div></details></div>`;
}
A.ownerPages.analytics=()=>{
 if(!A.session.ownerAllowed())return V.panel('Owner access required','');
 const range=R.range(),report=R.report(range),products=report.products.sort((a,b)=>R.sort==='quantity'?b.quantity-a.quantity||b.sales-a.sales:R.sort==='name'?a.name.localeCompare(b.name)||a.variant.localeCompare(b.variant):b.sales-a.sales||b.quantity-a.quantity);
 const top=[...report.products].sort((a,b)=>b.sales-a.sales).slice(0,5),max=Math.max(...top.map(p=>p.sales),1),units=report.products.reduce((n,p)=>n+p.quantity,0);
 Object.assign(A.owner.filters,{from:range.from,to:range.to});
 const filters=`<div class="owner-order-filters owner-analytics-filters">${V.select('period','View by',periods,R.period)}${periodControl(range)}${productControl()}${V.button('analytics-clear','Clear filters')}</div>`;

 const leaders=top.length?`<div class="owner-analytics-leaders">${top.map((p,i)=>`<div><span class="owner-analytics-rank">${i+1}</span><div><div class="owner-leader-label"><span>${E(p.name)}<small>${E(p.variant)}</small></span><strong>${V.money(p.sales)}</strong></div><div class="owner-leader-track"><span style="width:${p.sales/max*100}%"></span></div></div></div>`).join('')}</div>`:'<p class="owner-analytics-empty">No product sales this period.</p>';
 return V.intro('Analytics','Sales and product performance at a glance.')+`<div class="owner-analytics">${filters}${R.productIds.length?'<p class="owner-analytics-caption">Selected product sales exclude delivery fees.</p>':''}<div class="owner-analytics-stats">${A.ui.stat({label:'Recorded sales',value:V.money(report.total)})}${A.ui.stat({label:'Paid purchases',value:report.count})}${A.ui.stat({label:'Average purchase',value:V.money(report.count?report.total/report.count:0)})}${A.ui.stat({label:'Units sold',value:units})}</div><div class="owner-analytics-chart-grid">${V.panel('Sales trend',report.count?chart(report):'<div class="owner-analytics-empty">No recorded payments this period.<br><span>Choose another period to view sales.</span></div>',`<span class="owner-analytics-caption">${report.group==='day'?'Daily':report.group==='week'?'Weekly':'Monthly'}</span>`)}${V.panel('Sales by order type',mix(report))}</div>${V.panel('Top products',leaders,`<span class="owner-analytics-caption">By product sales</span>`)}</div>`;
};

document.addEventListener('change',e=>{
 if(!A.session.ownerAllowed())return;
 if(e.target.matches('[data-analytics-product]')){
  const id=e.target.value;
  R.productIds=e.target.checked?[...R.productIds,id]:R.productIds.filter(value=>value!==id);
  A.owner.render();
  document.querySelector('#analytics-products').open=true;
  [...document.querySelectorAll('[data-analytics-product]')].find(input=>input.value===id)?.focus();
 }
 if(e.target.id==='owner-period'){
  R.period=e.target.value;
  R.selection='current';
  if(R.period==='custom'&&!R.valid(R))Object.assign(R,R.range('month'));
  A.owner.render();
  document.querySelector('#owner-period')?.focus();
 }
 if(e.target.id==='owner-analytics-selection'){R.selection=e.target.value;A.owner.render();document.querySelector('#owner-analytics-selection')?.focus();}
 if(e.target.id==='owner-performance-sort'){R.sort=e.target.value;A.owner.render();}
});
document.addEventListener('click',e=>{
 if(e.target.closest('[data-owner=analytics-products-all]')&&A.session.ownerAllowed()){
  R.productIds=[];A.owner.render();
 }
 const dropdown=document.querySelector('#analytics-products');
 if(dropdown&&!dropdown.contains(e.target))dropdown.open=false;
 if(e.target.closest('[data-owner=analytics-clear]')&&A.session.ownerAllowed()){
  Object.assign(R,defaults);
  A.owner.render();
 }
});
document.addEventListener('keydown',e=>{
 if(e.key==='Escape'){const dropdown=document.querySelector('#analytics-products');if(dropdown?.open){dropdown.open=false;dropdown.querySelector('summary').focus();}}
});
const reset=A.commerce.reset;A.commerce.reset=()=>{reset();Object.assign(R,defaults);};
})();
