/* Reporting reconciliation uses explicit receipt fixtures independent of the UI. */
const vm=require('node:vm'),fs=require('node:fs'),assert=require('node:assert/strict');
let allowed=true;const receipts=[],A={session:{ownerAllowed:()=>allowed},ownerUI:{businessDate:n=>new Intl.DateTimeFormat('en-CA',{timeZone:'Asia/Manila'}).format(new Date(n))},escape:String,operations:{list:()=>receipts,status:o=>o.status},pricing:{cost:id=>id===1?{total:30}:null}};
const ctx=vm.createContext({K406:A});vm.runInContext(fs.readFileSync('app/owner-reporting.js','utf8'),ctx);
const row=(id,extra={})=>({id,type:'standard',paid:true,paidAt:'2026-10-08T17:00:00Z',status:'completed',fee:10,items:[{productId:1,name:'Loaf',price:100,quantity:2,key:'1:standard'}],...extra});
receipts.push(row('paid'),row('unpaid',{paid:false}),row('cancelled',{status:'cancelled'}),row('resolution',{status:'payment-resolution'}),row('cake',{type:'cake',items:[{productId:0,name:'Cake',price:500,quantity:1}]}),row('subscription',{type:'subscription_purchase',snapshot:{productId:1,delivery:40},items:[{name:'Loaf',price:100,quantity:4}]}));
for(let i=0;i<4;i++)receipts.push(row('weekly-'+i,{type:'subscription'}));
let r=A.reporting.build('2026-10-09','2026-10-09');assert.equal(r.receipts.length,3);assert.equal(r.revenue,110000);assert.equal(r.fees,6000);assert.equal(r.covered,20000);assert.equal(r.cost,6000);assert.equal(r.resolution.length,1);assert.equal(r.covered-r.cost,14000);assert.equal(r.revenue-r.covered,90000);console.log('PASS receipt totals, fees, subscription parent, incomplete costs and resolution reconcile');
assert.equal(A.reporting.build('2026-10-08','2026-10-08').receipts.length,0);console.log('PASS one Manila payment-date basis');
receipts[0].attempts=[{state:'confirmed',at:receipts[0].paidAt},{state:'confirmed',at:receipts[0].paidAt}];assert.equal(A.reporting.build().revenue,110000);console.log('PASS repeated successful attempts do not duplicate a sale');
receipts.push(row('unknown',{paidAt:null}));assert.deepEqual(Array.from(A.reporting.build().unknown),['unknown']);console.log('PASS unknown payment time is disclosed rather than invented');
receipts.push(row('midnight',{paidAt:null,attempts:[{state:'failed',at:'2026-10-07T00:00:00Z'},{state:'confirmed',at:'2026-10-08T15:59:00Z',paid_at:'2026-10-08T16:01:00Z'}]}));
assert(A.reporting.build('2026-10-09','2026-10-09').receipts.some(r=>r.id==='midnight'));assert(!A.reporting.build('2026-10-08','2026-10-08').receipts.some(r=>r.id==='midnight'));console.log('PASS cross-midnight reports use successful payment timestamp');
receipts.push(row('attempt-only',{paidAt:null,attempts:[{state:'confirmed',at:'2026-10-08T15:59:00Z'}]}));assert(A.reporting.build().unknown.includes('attempt-only'));console.log('PASS attempt creation time never substitutes for payment success');
const weekdays=A.reporting.weekdays(A.reporting.build().receipts,'1','units');assert.equal(weekdays.reduce((n,r)=>n+r.value,0),8);assert.equal(weekdays.find(r=>r.name==='Friday').value,8);console.log('PASS weekday units reconcile with selected product receipts');
allowed=false;assert.equal(A.reporting.build(),null);console.log('PASS owner reporting guard');
console.log('COMPLETE 8 Phase 7 reporting state checks.');
