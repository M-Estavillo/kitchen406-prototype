/* Configurable demo scheduling. Dates and cutoffs use Asia/Manila (UTC+08). */
(() => {
const A=K406;
const D=A.schedule={config:{clock:'2026-10-14T12:00:00+08:00',leadDays:2,cutoffHour:16,standardUnits:10,standardVarieties:4,subscriptionUnits:10,blocked:[],stock:{},productRules:{},batches:[0,2,5,6]},allocations:[]};
D.add=(date,days)=>{const d=new Date(date+'T00:00:00Z');d.setUTCDate(d.getUTCDate()+days);return d.toISOString().slice(0,10);};
D.day=date=>new Date(date+'T00:00:00Z').getUTCDay();
D.today=()=>new Date(new Date(D.config.clock).getTime()+8*3600000).toISOString().slice(0,10);
D.week=date=>D.add(date,-((D.day(date)+6)%7));
D.valid=date=>/^\d{4}-\d{2}-\d{2}$/.test(date)&&!isNaN(Date.parse(date))&&new Date(date+'T00:00:00Z').toISOString().slice(0,10)===date;
D.cutoff=(date,productId)=>{const rule=D.config.productRules[productId]||{};return Date.parse(D.add(date,-(rule.leadDays??D.config.leadDays))+'T'+String(rule.cutoffHour??D.config.cutoffHour).padStart(2,'0')+':00:00+08:00');};
D.base=(date,productId,{replacement=false}={})=>{
 if(!D.valid(date)||date<=D.today())return 'Passed';
 if(D.config.blocked.includes(date))return 'Blocked';
 if(D.config.stock[productId]===false)return 'No stock';
 if(Date.parse(D.config.clock)>=D.cutoff(date,productId))return 'Cutoff';
 if(!replacement&&!(D.config.productRules[productId]?.batches||D.config.batches).includes(D.day(date)))return 'No batch';
 return '';
};
D.standard=(date,items,scenario='normal')=>{
 if(!items.length)return 'Empty bag';
 if(scenario==='no-dates')return 'No dates';
 if(scenario==='stock')return 'No stock';
 const totals=new Map();items.forEach(i=>totals.set(i.productId,(totals.get(i.productId)||0)+i.quantity));
 if(totals.size>D.config.standardVarieties||[...totals.values()].some(q=>q>D.config.standardUnits))return 'Capacity';
 const reserved=A.commerce?.state.orders.filter(o=>o.type==='standard'&&(o.paid||o.id!==A.commerce.state.activeId)&&o.fulfillment.date===date&&o.status!=='cancelled'&&(o.paid||['waiting','detected','delayed'].includes(o.payment)&&o.deadline>Date.now()))||[];
 const capacity=new Map(totals);reserved.forEach(o=>o.items.forEach(i=>capacity.set(i.productId,(capacity.get(i.productId)||0)+i.quantity)));
 if(capacity.size>D.config.standardVarieties||[...capacity.values()].some(q=>q>D.config.standardUnits))return 'Booked';
 for(const i of items){if(!i.available)return 'No stock';const reason=D.base(date,i.productId);if(reason)return reason;}
 if(scenario==='fully-booked'&&D.day(date)===6)return 'Booked';
 if(scenario==='blocked'&&[21,22].includes(Number(date.slice(-2))))return 'Blocked';
 if(['cutoff','after-cutoff'].includes(scenario)&&date<D.add(D.today(),6))return 'Cutoff';
 if(scenario==='mixed-cart'&&date<D.add(D.today(),6))return 'Lead time';
 return '';
};
D.used=(productId,date,exclude)=>D.allocations.filter(a=>a.productId===productId&&D.week(a.date)===D.week(date)&&a.owner!==exclude&&(a.confirmed||a.deadline>Date.now())).reduce((n,a)=>n+a.quantity,0);
D.subscription=(productId,quantity,dates,exclude)=>{
 if(!Number.isInteger(quantity)||quantity<1)return 'Choose a valid quantity.';
 const byWeek=new Map();
 for(const date of dates){const reason=D.base(date,productId,{replacement:true});if(reason)return reason;const week=D.week(date);byWeek.set(week,(byWeek.get(week)||0)+quantity);}
 for(const [week,q] of byWeek)if(D.used(productId,week,exclude)+q>D.config.subscriptionUnits)return 'Subscription capacity reached';
 return '';
};
D.release=owner=>{D.allocations=D.allocations.filter(a=>a.owner!==owner);};
D.reserve=(owner,productId,quantity,dates,confirmed=false,deadline=0)=>{const reason=D.subscription(productId,quantity,dates,owner);if(reason)return reason;D.release(owner);dates.forEach((date,index)=>D.allocations.push({owner,productId,quantity,date,cycle:index+1,confirmed,deadline}));return '';};
D.reset=()=>{D.allocations=[];D.config.clock='2026-10-14T12:00:00+08:00';D.config.blocked=[];D.config.stock={};D.config.productRules={};};
})();
