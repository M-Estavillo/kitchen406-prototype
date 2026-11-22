/* Shared operational transitions; staff callers retain their stricter entry guard. */
(() => {
const A=K406,S=A.staff,I=A.inventory,C=A.commerce,F=A.fulfillment={};
F.preparationIssue=o=>{
 const subscription=o.type==='subscription';
 const date=o.fulfillment.preparationDate||(subscription?A.subscriptions.preparationDate?.(o):null);
 if((subscription||date)&&!A.schedule.valid(date))return 'The preparation date is missing or invalid. Review the fulfillment schedule.';
 if(date&&date>A.schedule.today())return 'Preparation is scheduled for '+date+' (Manila).';
 return I.preparationIssue(o);
};
const pickupClock=()=>Date.parse(A.schedule.config.clock);
F.scheduledPickup=o=>o?.paid&&o.fulfillment?.method==='pickup'&&['standard','subscription'].includes(o.type);
const cutoff=o=>Date.parse(o.fulfillment.date+'T19:00:00+08:00');
const timelyArrival=o=>Number.isFinite(o.pickupArrivedAt)&&o.pickupArrivedAt<=cutoff(o);
F.canConfirmPickup=o=>!F.scheduledPickup(o)||timelyArrival(o);
F.canRecordArrival=o=>F.scheduledPickup(o)&&S.orderStatus(o)==='ready'&&!timelyArrival(o)&&A.schedule.today()===o.fulfillment.date&&pickupClock()<=cutoff(o);
F.pickupArrivalHint=o=>{
 if(!F.scheduledPickup(o)||timelyArrival(o))return '';
 const status=S.orderStatus(o);
 if(['confirmed','preparing'].includes(status))return 'Mark this pickup Ready before recording arrival.';
 if(status!=='ready')return '';
 if(A.schedule.today()<o.fulfillment.date)return 'Arrival can be recorded on '+o.fulfillment.date+' through 7:00 p.m. Manila time.';
 if(pickupClock()>cutoff(o))return 'The 7:00 p.m. Manila pickup cutoff has passed.';
 return 'Record arrival when the customer reaches the bakery.';
};
F.recordArrival=(id,version)=>{
 if(!A.session.operational())return 'Operational access required.';
 const o=S.orders().find(order=>order.id===id);
 if(!F.scheduledPickup(o))return 'Pickup is unavailable.';
 if(timelyArrival(o))return '';
 if((S.versions.get(id)||0)!==version)return 'This order changed. Review its current status.';
 if(!F.canRecordArrival(o))return 'Arrival can be recorded for a Ready pickup on its scheduled date through 7:00 p.m. Manila time.';
 if(A.session.ownerAllowed()?A.owner?.saveError:S.saveError)return 'The arrival could not be saved. Retry.';
 o.pickupArrivedAt=pickupClock();o.pickupArrivalActor=A.session.actor().id;
 S.versions.set(id,version+1);A.operations.changed();return '';
};
function save(o,target,progress,update,restoreInventory){
 const {id}=o,previous={...o};
 for(const field of ['activity','allocationHistory','allocationLockHistory'])if(o[field])previous[field]=o[field].slice();
 const history=S.history.get(id)?.slice();
 try{
  const error=update?.();if(error)return error;
  C.setStatus(o,target,{deferNotification:true,preserveMaterials:target==='cancelled'});
  if(target==='completed')A.earnings.updateLock(o,o.completedAt);
  progress.commit?.();
 }catch(failure){
  restoreInventory?.();progress.rollback?.();
  for(const field of Object.keys(o))if(!Object.hasOwn(previous,field))delete o[field];
  Object.assign(o,previous);
  if(history)S.history.set(id,history);else S.history.delete(id);
  console.error('Fulfillment update failed',id,failure);
  return 'The update could not be saved. Review the fulfillment and retry.';
 }
 return '';
}
F.checkPickupCutoffs=()=>{
 let changed=false;
 const now=pickupClock();
 for(const o of S.orders()){
  if(!F.scheduledPickup(o)||S.orderStatus(o)!=='ready'||timelyArrival(o)||!(now>cutoff(o)))continue;
  const progress=o.type==='subscription'?A.subscriptions.progressForOrder(o,'cancelled',null):{};
  if(progress.error)continue;
  const error=save(o,'cancelled',progress,()=>{
   o.cancelledAt=now;o.cancellationReason='Failure to pick up';
  });
  if(error)continue;
  S.versions.set(o.id,(S.versions.get(o.id)||0)+1);
  const history=S.history.get(o.id)?.[0];
  if(history)Object.assign(history,{actor:'System',changed_by_account_id:null,at:now,changed_at:now,reason:o.cancellationReason});
  C.notifyStatus?.(o,'cancelled');
  changed=true;
 }
 return changed;
};
F.transition=(id,target,version,key)=>{
 if(!A.session.operational())return 'Operational access required.';if(!key)return 'An operation identifier is required.';
 if(S.results.has(key))return S.results.get(key).id===id&&S.results.get(key).target===target?'':'This operation belongs to another update.';
 if(A.session.ownerAllowed()?A.owner?.saveError:S.saveError)return 'The update could not be saved. Retry.';
 const o=S.orders().find(o=>o.id===id);if(!o)return 'Order not found.';
 if((S.versions.get(id)||0)!==version)return 'This order changed. Review its current status.';
 const status=S.orderStatus(o);if(!(status==='confirmed'&&target==='preparing'||status==='preparing'&&target==='ready'||status==='ready'&&target==='completed'&&(o.fulfillment.method==='pickup'||A.session.ownerAllowed()&&o.type==='cake')))return 'This transition is not allowed.';
 const pickup=target==='completed'&&F.scheduledPickup(o);
 if(pickup&&!F.canConfirmPickup(o))return 'Record the customer?s arrival before confirming pickup.';
 const completedAt=target==='completed'?(pickup?Math.max(pickupClock(),o.pickupArrivedAt):Date.now()):null;
 const progress=o.type==='subscription'?A.subscriptions.progressForOrder(o,target,completedAt):{};if(progress.error)return progress.error;
 let draft;
 if(target==='preparing'&&!A.earnings.assigned(o)){
  if(!A.earnings.editable(o))return 'Preparing-owner allocations are locked.';
  draft=A.earnings.read(o);
  if(draft.error)return draft.error;
 }else{
  const error=A.earnings.required(o);if(error)return error;
 }
 const starting=target==='preparing';
 const error=starting?F.preparationIssue(o):target==='ready'&&!I.consumed(o)?'Preparation consumption is missing. Review the inventory record before marking Ready.':'';
 if(error)return error;
 const restoreInventory=starting?I.consumptionRollback(o):null;
 const saveError=save(o,target,progress,()=>{
  if(starting){const issue=I.consume(o,A.session.actor().name,false);if(issue)return issue;}
  if(draft)A.earnings.save(o,draft.values);
  if(completedAt!==null)o.completedAt=completedAt;
 },restoreInventory);
 if(saveError)return saveError;
 S.versions.set(id,version+1);S.results.set(key,{id,target});
 C.notifyStatus?.(o,target);
 if(target==='preparing')I.notify();
 S.emit('order:'+id+':'+target,'orders',id+' is '+target+'.','staff/production/'+id);S.changed();return '';
};
F.editAllocation=(id,version,key)=>{
 if(!A.session.operational())return 'Operational access required.';
 if(!key)return 'An operation identifier is required.';
 if(S.results.has(key))return S.results.get(key).id===id&&S.results.get(key).target==='allocation'?'':'This operation belongs to another update.';
 const o=S.orders().find(row=>row.id===id);
 if(!o)return 'Order not found.';
 if((S.versions.get(id)||0)!==version)return 'This order changed. Review its current status.';
 if(!A.earnings.editable(o))return 'Preparing-owner allocations cannot be edited in the current state.';
 if(A.session.ownerAllowed()?A.owner?.saveError:S.saveError)return 'The update could not be saved. Retry.';
 const draft=A.earnings.read(o);if(draft.error)return draft.error;
 A.earnings.save(o,draft.values);
 S.versions.set(id,version+1);S.results.set(key,{id,target:'allocation'});S.changed();return '';
};
// Operational corrections reverse one operational step, never courier progress.
F.previous=o=>o?.paid&&!['pending','booked','in_transit','delivered','unknown'].includes(o.delivery?.status)?({preparing:'confirmed',ready:'preparing',completed:'ready'})[S.orderStatus(o)]:null;
F.revert=(id,version,key)=>{
 if(!A.session.operational())return 'Operational access required.';
 if(!key)return 'An operation identifier is required.';
 if(A.session.ownerAllowed()?A.owner.saveError:S.saveError)return 'The update could not be saved. Retry.';
 if(S.results.has(key))return S.results.get(key).id===id&&S.results.get(key).revert?'':'This operation belongs to another update.';
 const o=S.orders().find(o=>o.id===id),target=F.previous(o);
 if(!o||!target)return 'This order cannot be reverted while courier fulfillment is active.';
 if((S.versions.get(id)||0)!==version)return 'This order changed. Review its current status.';
 const progress=o.type==='subscription'?A.subscriptions.progressForOrder(o,target,null):{};if(progress.error)return progress.error;
 const previousCompletedAt=o.completedAt;
 if(target==='confirmed'){
  const reservation=I.reservations.get(id);
  if(reservation?.status==='consumed'){
   for(const [ingredient,quantity] of Object.entries(reservation.materials))I.move(ingredient,quantity,'consumption_reversal',A.session.actor().name,id,'correction','Preparation status reverted',key+':'+ingredient);
   reservation.status='confirmed';reservation.rows.forEach(row=>{row.status='confirmed';delete row.consumed_at;});I.operations.delete('consume:'+id);I.notify();
  }
 }
 C.setStatus(o,target);delete o.completedAt;A.earnings.updateLock(o);S.versions.set(id,version+1);S.results.set(key,{id,target,revert:true});
 const entry=S.history.get(id)?.[0];if(entry){entry.reason=A.session.actor().name+' reverted an accidental status change';if(previousCompletedAt!=null)entry.previous_completed_at=previousCompletedAt;}
 progress.commit?.();
 S.changed();return '';
};
})();
