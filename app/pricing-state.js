/* Editable base-material recipes. Existing order requirement snapshots remain unchanged. */
(() => {
const A=K406,I=A.inventory;
const P=A.pricing={recipes:new Map(),overheads:new Map(),markup:30,overhead:25,version:0};
const initialRates={markup:30,cakeMarkup:30,labor:null,power:null,electricity:null};
P.settings={version:0,rates:{...initialRates},timings:[],options:[]};
P.productTimings=new Map();
P.validTiming=t=>[t?.preparation,t?.oven].every(n=>Number.isFinite(n)&&n>=0&&n<=10080);
P.readTiming=form=>{
 const number=name=>form.elements[name]?.valueAsNumber;
 return {preparation:number('preparation-time'),oven:number('oven-time')};
};
P.timingFields=(timing,includeOven=true)=>A.ownerUI.field('preparation-time','Preparation time (min)',timing?.preparation??'','number','min="0" max="10080" step="any"')+
 (includeOven?A.ownerUI.field('oven-time','Oven run time (min)',timing?.oven??'','number','min="0" max="10080" step="any"'):'');
P.applyCakeCatalog=({options,pairs,stock})=>{
 const T=A.cakeData;
 T.categories=['shape','size','tier','flavor','color','icing'];
 T.options=options;
 T.pairs=pairs;
 T.stock=Object.fromEntries(stock.map(row=>[row.inventory_id,row.archived?0:row.stock_on_hand]));
};
P.applySettings=settings=>{
 if(!settings)return;
 P.settings=settings;
 P.markup=settings.rates.markup;
 P.applyCakeCatalog({options:settings.options,pairs:settings.timings.filter(t=>!t.shape&&!t.icing).map(t=>[t.size,t.tier]),
  stock:I.items.map(i=>({inventory_id:i.id,stock_on_hand:i.stock,archived:i.archivedAt}))});
};
const recipe=I.recipe;
I.recipe=(id,variant='standard')=>{
 const key=id+':'+variant;
 const saved=P.recipes.get(key)||(!I.databaseAccount&&I.customerRecipes.get(key));
 return saved?{...saved}:A.variant(id,variant)?.customRecipe?null:recipe(id,variant);
};
P.breakdown=(bom,overhead,price)=>{
 if(!bom||!Object.keys(bom).length)return null;
 let ingredients=0,packaging=0;
 for(const [id,quantity] of Object.entries(bom)){
  const cost=I.item(id)?.cost;
  if(!Number.isFinite(cost)||cost<0||!Number.isFinite(quantity)||quantity<=0)return null;
  if(I.item(id)?.category==='packaging'||id==='box')packaging+=quantity*cost;else ingredients+=quantity*cost;
 }
 const total=ingredients+packaging+overhead;
 return {materials:ingredients+packaging,ingredients,packaging,overhead,total,suggested:Math.round(total*(1+P.markup/100)*100)/100,margin:price>0?(price-total)/price*100:null};
};
P.recommend=(bom,timing,cake=false)=>{
 const {labor:rate,power,electricity,markup,cakeMarkup}=P.settings.rates;
 if(!P.validTiming(timing)||![rate,power,electricity].every(n=>Number.isFinite(n)&&n>=0))return null;
 const utility=power/1000*(timing.oven/60)*electricity;
 const labor=timing.preparation/60*rate;
 const cost=P.breakdown(bom,utility);
 if(!cost)return null;
 const total=cost.total+labor;
 const markupAmount=total*(cake?cakeMarkup:markup)/100;
 return {...cost,labor,total,markupAmount,suggested:Math.round((total+markupAmount)*100)/100};
};
P.cost=(id,variant)=>P.recommend(I.recipe(id,variant),P.productTimings.get(id));
P.cakeTiming=options=>{
 const value=type=>options.find(o=>o.type===type)?.id;
 const rows=P.settings.timings.filter(t=>t.size===value('size')&&t.tier===value('tier'));
 const base=rows.find(t=>!t.shape&&!t.icing);
 if(!base)return null;
 const override=rows.find(t=>t.shape===value('shape')&&t.icing===value('icing'))||
  rows.find(t=>t.shape===value('shape')&&!t.icing)||rows.find(t=>!t.shape&&t.icing===value('icing'));
 return {...base,preparation:override?.preparation??base.preparation};
};
P.save=({id,variant,rows,overhead,version})=>{
 if(!A.session.ownerAllowed())return 'Owner access required.';
 if(version!==P.version)return 'Pricing changed. Reopen the editor.';
 if(!A.variant(id,variant)||!rows.length||overhead!==null&&(!Number.isFinite(overhead)||overhead<0))return 'Select a variant, ingredients, and a nonnegative overhead.';
 const bom={};for(const row of rows){if(!I.item(row.id)||Object.hasOwn(bom,row.id)||!Number.isFinite(row.quantity)||row.quantity<=0)return 'Use each ingredient once with a positive quantity.';bom[row.id]=row.quantity;}
 P.recipes.set(id+':'+variant,bom);if(overhead===null)P.overheads.delete(id+':'+variant);else P.overheads.set(id+':'+variant,overhead);P.version++;return '';
};
P.saveStaffRecipe=()=> 'Recipes are read-only for staff.';
P.setPrice=(id,variant,price,version)=>{if(!A.session.ownerAllowed())return 'Owner access required.';if(version!==P.version)return 'Pricing changed. Reopen the editor.';const v=A.variant(id,variant);if(!v||!Number.isFinite(price)||price<=0)return 'Enter a positive selling price.';v.price=Math.round(price*100)/100;P.version++;return '';};
P.reset=()=>{P.recipes.clear();P.overheads.clear();P.productTimings.clear();P.settings={version:0,rates:{...initialRates},timings:[],options:[]};P.markup=30;P.overhead=25;P.version=0;};
})();
