/* One numeric price/variant source for both purchase paths. */
(() => {
const A=K406;
A.products.forEach(p=>{p.subscription=[1,2,4,5].includes(p.id);p.variants=[{id:'standard',label:p.variant,price:Number(p.price.replace(/[^\d.]/g,''))}];});
A.products.find(p=>p.id===1).variants=[{id:'standard',label:'650g Standard',price:340},{id:'large',label:'950g Large',price:480}];
Object.assign(A.products.find(p=>p.id===4),{name:'Japanese Shokupan Loaf',variant:'450g · Sliced or whole',price:'₱280',variants:[{id:'standard',label:'Thick Sliced (450g)',price:280},{id:'whole',label:'Whole Pullman (450g)',price:280}]});
A.products.find(p=>p.id===5).subscription=true;
A.variant=(id,variant='standard')=>A.products.find(p=>p.id===Number(id))?.variants.find(v=>v.id===variant);
A.quoteFee=()=>100; // Sample courier quotation, shared by both workflows.
const baseline=A.products.map(p=>({id:p.id,price:p.price,variants:p.variants.map(v=>({...v}))}));
A.resetProductData=()=>baseline.forEach(saved=>{const p=A.products.find(p=>p.id===saved.id);p.price=saved.price;p.variants=saved.variants.map(v=>({...v}));});
})();
