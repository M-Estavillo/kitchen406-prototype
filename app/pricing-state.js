/* Editable base-material recipes. Existing order requirement snapshots remain unchanged. */
(() => {
const A=K406,I=A.inventory;
const P=A.pricing={recipes:new Map(),overheads:new Map(),markup:30,overhead:25,version:0};
const recipe=I.recipe;
I.recipe=(id,variant='standard')=>{const saved=P.recipes.get(id+':'+variant);return saved?{...saved}:recipe(id,variant);};
P.cost=(id,variant)=>{const bom=I.recipe(id,variant);if(!bom)return null;let materials=0;for(const [key,q] of Object.entries(bom)){const cost=I.item(key)?.cost;if(!Number.isFinite(cost))return null;materials+=q*cost;}const overhead=P.overheads.get(id+':'+variant)??P.overhead,total=materials+overhead,price=A.variant(id,variant)?.price;return {materials,overhead,total,suggested:Math.round(total*(1+P.markup/100)*100)/100,margin:price>0?(price-total)/price*100:null};};
P.save=({id,variant,rows,overhead,version})=>{
 if(!A.session.ownerAllowed())return 'Owner access required.';
 if(version!==P.version)return 'Pricing changed. Reopen the editor.';
 if(!A.variant(id,variant)||!rows.length||overhead!==null&&(!Number.isFinite(overhead)||overhead<0))return 'Select a variant, ingredients, and a nonnegative overhead.';
 const bom={};for(const row of rows){if(!I.item(row.id)||Object.hasOwn(bom,row.id)||!Number.isFinite(row.quantity)||row.quantity<=0)return 'Use each ingredient once with a positive quantity.';bom[row.id]=row.quantity;}
 P.recipes.set(id+':'+variant,bom);if(overhead===null)P.overheads.delete(id+':'+variant);else P.overheads.set(id+':'+variant,overhead);P.version++;return '';
};
P.setPrice=(id,variant,price,version)=>{if(!A.session.ownerAllowed())return 'Owner access required.';if(version!==P.version)return 'Pricing changed. Reopen the editor.';const v=A.variant(id,variant);if(!v||!Number.isFinite(price)||price<=0)return 'Enter a positive selling price.';v.price=Math.round(price*100)/100;P.version++;return '';};
P.reset=()=>{P.recipes.clear();P.overheads.clear();P.markup=30;P.overhead=25;P.version=0;};
})();
