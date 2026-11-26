(() => {
const A=K406,P=A.pricing,I=A.inventory,V=A.ownerUI,E=A.escape;
const categories=['shape','size','tier','flavor','color','icing'];
const labels={shape:'Shape',size:'Size',tier:'Tier count',flavor:'Flavor',color:'Color',icing:'Icing'};
const fields={markup:'Standard product markup (%)',cakeMarkup:'Custom cake markup (%)',
 labor:'Hourly labor rate (₱/hr)',power:'Oven power rating (W)',electricity:'Shared electricity rate (₱/kWh)'};
const number=(name,label,value,extra='')=>V.field(name,label,value??'','number',`required min="0" max="100000" step="any" ${extra}`);
const options=(type,optional=false)=>[...(optional?[['','Any']]:[['','Choose '+labels[type].toLowerCase()]]),
 ...P.settings.options.filter(o=>o.type===type).map(o=>[o.id,o.name])];
const open=(title,kind,body,data='')=>{
 A.owner.discardModalDraft();
 A.owner.open(title,`<form class="staff-form" data-owner-form="${kind}" data-version="${P.settings.version}" ${data}>
  ${body}${V.error()}<div class="owner-costing-actions">${V.button('discard-modal','Cancel')}
  <button class="btn primary" type="submit">Save changes</button></div></form>`);
};
A.ownerPages.cakeOptions=()=>{
 const name=id=>P.settings.options.find(o=>o.id===id)?.name||'—';
 const optionRows=P.settings.options.map(o=>`<tr><td>${labels[o.type]}</td><td>${E(o.name)}</td><td>${o.available?'Active':'Inactive'}</td>
  <td>${V.button('cake-price-option','Edit',`data-id="${E(o.id)}" aria-label="Edit ${E(o.name)}"`)}</td></tr>`);
 const timeRows=P.settings.timings.map((t,i)=>`<tr><td>${E([t.size,t.tier,t.shape,t.icing].filter(Boolean).map(name).join(' · '))}</td>
  <td>${t.preparation} min</td><td>${t.shape||t.icing?'—':t.oven+' min'}</td><td>${V.button('cake-price-time','Edit',`data-id="${i}"`)}</td></tr>`);
 return V.intro('Cake Options','Manage cake options and recipe times.',`<div class="owner-cake-tools">${V.link('cake-requests','Back to requests')}</div>`)+
  `<div class="staff-stack owner-cake-options-page">${V.panel('Options',optionRows.length?
   V.table(['Category','Option','Status','Actions'],optionRows):'<p class="muted">No cake options yet.</p>',V.button('cake-price-option','Add option'))}
  ${V.panel('Recipe times',timeRows.length?V.table(['Cake configuration','Preparation','Oven run','Actions'],timeRows):
   '<p class="muted">No recipe times yet.</p>',V.button('cake-price-time','Add times'))}</div>`;
};
function optionEditor(record){
 const type=record?.type||'shape';
 open(record?'Edit cake option':'Add cake option','cake-price-option',
  (record?`<input type="hidden" name="type" value="${type}">`:V.select('type','Category',categories.map(type=>[type,labels[type]]),type))+
  V.field('name','Name',record?.name||'','text','required maxlength="100"')+
  number('price','Preliminary price (₱)',record?record.price/100:0)+
  `<div data-cake-measurement>${number('measurement','Size or tier count',record?.measurement)}</div>`+
  V.select('available','Status',[[true,'Active'],[false,'Inactive']],String(record?.available??true))+
  '<div data-cake-materials></div>'+V.button('cake-price-material','Add material'),
  `data-id="${E(record?.id||'')}"`);
 const form=A.$('owner-dialog-body').querySelector('form');
 for(const [id,quantity] of Object.entries(record?.ingredients||{}))appendMaterial(form,id,quantity);
 syncMeasurement(form);
}
function syncMeasurement(form){
 const type=form.elements.type.value,field=form.elements.measurement,container=field.closest('[data-cake-measurement]');
 container.hidden=field.disabled=!['size','tier'].includes(type);
 container.querySelector('label').textContent=type==='size'?'Size (inches)':'Tier count';
}
function appendMaterial(form,id='',quantity=''){
 const key=crypto.randomUUID();
 const choices=[['','Choose material'],...I.items.filter(i=>!i.archivedAt||i.id===id).map(i=>[i.id,i.name+' · '+i.unit])];
 const row=document.createElement('div');
 row.className='owner-costing-material';
 row.dataset.cakeMaterial='';
 row.innerHTML=V.select('material-'+key,'Material',choices,id,'required')+
  number('quantity-'+key,'Quantity',quantity)+V.button('cake-price-remove-material','Remove');
 form.querySelector('[data-cake-materials]').append(row);
}
function timeEditor(t){
 open(t?'Edit recipe times':'Add recipe times','cake-price-time',
  V.select('size','Bottom-tier size',options('size'),t?.size||'','required')+V.select('tier','Tier count',options('tier'),t?.tier||'','required')+
  V.select('shape','Shape override',options('shape',true),t?.shape||'')+V.select('icing','Icing override',options('icing',true),t?.icing||'')+
  P.timingFields(t));
 const form=A.$('owner-dialog-body').querySelector('form');
 form.elements['preparation-time'].required=true;
 syncOven(form);
}
function syncOven(form){
 const field=form.elements['oven-time'];
 const override=!!(form.elements.shape.value||form.elements.icing.value);
 field.closest('.field').hidden=field.disabled=override;
 field.required=!override;
}
A.ownerPricing={
 openRates(){
  open('Costing settings','pricing-settings',Object.entries(fields).map(([key,label])=>number(key,label,P.settings.rates[key])).join(''));
 },
 async save(form){
  const data=new FormData(form),get=name=>data.get(name),n=name=>get(name)===''||get(name)===null?NaN:Number(get(name));
  const kind=form.dataset.ownerForm;
  let section,value;
  if(kind==='pricing-settings'){
   section='rates';
   value=Object.fromEntries(Object.keys(fields).map(key=>[key,n(key)]));
  }else if(kind==='cake-price-option'){
   section='option';
   value={id:form.dataset.id||'cake-'+form.dataset.operation,type:get('type'),name:get('name'),price:Math.round(n('price')*100),
    measurement:n('measurement'),available:get('available')==='true',
    ingredients:[...form.querySelectorAll('[data-cake-material]')].map(row=>({
     id:row.querySelector('select').value,quantity:row.querySelector('input').valueAsNumber
    }))};
  }else{
   section='timing';
   const {preparation,oven}=P.readTiming(form);
   value={size:get('size'),tier:get('tier'),shape:get('shape'),icing:get('icing'),preparation,oven:form.elements['oven-time'].disabled?0:oven};
  }
  if(!I.databaseAccount)return 'Open the local server and sign in to save costing settings.';
  return I.save('pricing',{key:form.dataset.operation,version:Number(form.dataset.version),section,value});
 }
};
document.addEventListener('click',e=>{
 const el=e.target.closest('[data-owner]');
 if(!el||!A.session.ownerAllowed())return;
 const action=el.dataset.owner;
 if(action==='cake-price-option')optionEditor(P.settings.options.find(o=>o.id===el.dataset.id));
 if(action==='cake-price-time')timeEditor(P.settings.timings[el.dataset.id]);
 if(action==='cake-price-material')appendMaterial(el.form);
 if(action==='cake-price-remove-material')el.closest('[data-cake-material]').remove();
});
document.addEventListener('change',e=>{
 const form=e.target.form;
 if(form?.dataset.ownerForm==='cake-price-option'&&e.target.name==='type')syncMeasurement(form);
 if(form?.dataset.ownerForm==='cake-price-time'&&['shape','icing'].includes(e.target.name))syncOven(form);
});
})();
