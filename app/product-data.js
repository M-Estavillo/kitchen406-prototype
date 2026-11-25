/* One numeric price/variant source for both purchase paths. */
(() => {
const A=K406;
A.variant=(id,variant='standard')=>A.products.find(p=>p.id===Number(id))?.variants.find(v=>v.id===variant);
const baseline=A.products.map(p=>({id:p.id,price:p.price,variants:p.variants.map(v=>({...v}))}));
A.resetProductData=()=>baseline.forEach(saved=>{const p=A.products.find(p=>p.id===saved.id);p.price=saved.price;p.variants=saved.variants.map(v=>({...v}));});
})();
