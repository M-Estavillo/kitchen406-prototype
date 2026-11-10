const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
let role='staff';const order={id:'TEST-1',type:'standard',paid:true,status:'ready',fulfillment:{method:'delivery',date:'2026-11-10'},address:{city:'Cebu City',add_line_1:'Demo street'},fee:100};
const A={escape:String,route:'staff',session:{operational:()=>role!=='customer',ownerAllowed:()=>role==='owner',actor:()=>({id:role,name:role})},operations:{find:id=>id===order.id?order:null,status:o=>o.status,changed(){}},staff:{versions:new Map(),results:new Map(),history:new Map(),orders:()=>[order],orderStatus:o=>o.status,changed(){},parts:['staff','production',order.id,'delivery'],allowed:()=>role==='staff'},inventory:{reservations:new Map(),operations:new Map()},commerce:{copy:x=>JSON.parse(JSON.stringify(x)),addressValid:()=>true,setStatus:(o,s)=>o.status=s,reset(){}},subscriptions:{allRecords:()=>[]},notifications:{emit(){}},owner:{parts:['owner','orders',order.id,'delivery']},ownerUI:{panel:(t,b)=>t+b,badge:String,date:String,money:String}};
const ctx=vm.createContext({K406:A,document:{addEventListener(){}},Date,crypto:require('node:crypto')});
for(const f of ['fulfillment-state','delivery-state','delivery-tracking'])vm.runInContext(fs.readFileSync('app/'+f+'.js','utf8'),ctx);
assert.equal(A.deliveries.book(order.id,'book',0),'');assert.equal(order.delivery.status,'booked');assert.equal(A.fulfillment.previous(order),null);assert(A.fulfillment.revert(order.id,1,'revert'));assert(A.deliveries.book(order.id,'duplicate',1));
for(const roleName of ['owner','staff']){
 role=roleName;A.route=roleName;let modal;A[roleName].render=()=>{};A[roleName].open=(title,body)=>modal={title,body};A.closeModal=()=>{};A.toast=()=>{};
 for(const outcome of ['cancelled','unavailable','error','success']){
  delete order.delivery;A.deliveries.outcome=outcome;
  A.deliveryTracking.book(order.id,A.staff.versions.get(order.id)||0);
  if(outcome==='success'){assert(A.deliveryTracking.button(order).includes('Track delivery'));A.deliveryTracking.track(order.id);assert(modal.body.includes('Lalamove'));assert(!modal.body.includes('Book another courier'));}
  else{assert.equal(A.deliveryTracking.button(order),'');assert(modal.body.includes('Cancel'));assert(modal.body.includes('Book another courier'));assert.equal(modal.title,({cancelled:'Booking cancelled',unavailable:'No couriers available',error:'Booking unsuccessful'})[outcome]);}
 }
}
role='staff';delete order.delivery;order.status='preparing';A.staff.versions.set(order.id,0);assert.equal(A.fulfillment.revert(order.id,0,'staff-revert'),'');assert.equal(order.status,'confirmed');assert(A.fulfillment.revert(order.id,0,'stale'));
role='customer';assert(A.deliveries.book(order.id,'blocked',1));assert(A.fulfillment.revert(order.id,1,'blocked'));
console.log('PASS staff courier booking, duplicate prevention, active-booking revert protection, staff revert, role guards, and booking outcomes / tracking placeholder for both roles');
