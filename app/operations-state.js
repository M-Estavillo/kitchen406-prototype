/* Read through existing customer stores; never activate a customer to inspect records. */
(() => {
const A=K406,C=A.commerce,B=A.subscriptions,I=A.inventory;
const R=A.operations={};
R.purchases=()=>[...new Map([...Array.from(A.account.buckets.entries()).flatMap(([customer,b])=>(b.subscription?.purchases||[]).filter(p=>!p.persistedSubscription).map(p=>{p.customer_id||=customer;return p;})),...B.state.purchases.filter(p=>!p.persistedSubscription||A.account.allowed()).map(p=>{p.customer_id||=A.account.id();return p;}),...(B.persistence?.purchases()||[])].map(p=>[p.id,p])).values()];
R.orders=()=>[...new Map([...I.allOrders(),...A.cakes.orders,...(A.pickup?.operationalOrders()||[]),...(B.persistence?.orders()||[])].map(o=>[o.id,o])).values()];
R.find=id=>R.orders().find(o=>o.id===id);
R.status=o=>o.refundEligible?'cancelled':o.type==='subscription_purchase'?(o.paid?(o.payment==='resolution'?'payment-resolution':'confirmed'):o.payment==='cancelled'?'cancelled':'pending-payment'):A.staff.orderStatus(o);
R.customer=id=>A.account.records.find(p=>p.customer_id===id);
R.list=()=>[
 ...R.orders(),
 ...R.purchases().map(p=>({...p,type:'subscription_purchase',total:p.snapshot.total,fulfillment:{date:null,method:null},items:[{name:p.snapshot.name,variant:p.snapshot.variant,quantity:p.snapshot.quantity*4,price:p.snapshot.unit}],status:p.refundEligible||p.status==='cancelled'?'cancelled':p.paid?(p.payment==='resolution'?'payment-resolution':'confirmed'):p.payment==='cancelled'?'cancelled':'pending-payment'}))
];
R.record=id=>R.list().find(o=>o.id===id);
R.money={toCents:pesos=>Math.round(Number(pesos)*100),toPesos:cents=>Number(cents)/100};
R.payments=()=>R.list().filter(o=>o.type!=='subscription').flatMap(o=>(o.attempts?.length?o.attempts:[{state:o.payment,at:o.paidAt||o.created}]).map((attempt,index)=>({id:o.id+':'+index,order:o,attempt,index,status:(index===(o.attempts?.length||1)-1&&o.paid)?'paid':({confirmed:'paid',waiting:'pending',detected:'pending',delayed:'pending',revalidation:'failed',resolution:'paid'})[attempt.state]||attempt.state,holdId:attempt.hold_id||attempt.holdId||null})));
R.changed=()=>{A.staff.changed();A.owner?.render();A.shell.sync();};
})();
