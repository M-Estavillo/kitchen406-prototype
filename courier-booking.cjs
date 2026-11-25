const { randomUUID } = require('node:crypto');

module.exports = function advanceCourier(db, fail, history, { input, account, now, id, booking, ready, complete, onProgress }) {
    const {action,outcome,key} = input;
    if (action === 'book') {
      if (account.role !== 'admin') fail('access-denied',403);
      if (typeof key !== 'string' || !/^[\w:-]{1,200}$/.test(key) ||
          !['success','failure','error','cancelled','unavailable','unknown'].includes(outcome)) fail('Invalid booking.',400);
      const existing = db.prepare('SELECT order_id FROM CourierBooking WHERE operation_key = ?').get(key);
      if (existing?.order_id === id) return;
      if (existing || !ready || booking && !['failed','cancelled'].includes(booking.status)) fail('Booking is unavailable.');
      const status = ({failure:'failed',error:'failed',unavailable:'failed',cancelled:'cancelled',unknown:'pending'})[outcome] || 'booked';
      const bookingId = randomUUID();
      db.prepare('INSERT INTO CourierBooking VALUES (?,?,?,?,?,?,?)').run(bookingId,id,key,status,outcome,now,now);
      history.run(id,'courier_' + status,account.account_id,now);
      if (status === 'booked') onProgress(status, bookingId);
      return;
    }
    if (!booking) fail('Booking not found.',404);
    let next;
    if (action === 'reconcile') {
      if (account.role !== 'admin') fail('access-denied',403);
      if (booking.status !== 'pending') return;
      if (outcome === 'error' || outcome === 'unknown') fail('The booking is still unresolved. Check it again later.');
      if (!['success','cancelled','unavailable'].includes(outcome)) fail('Invalid booking result.',400);
      next = ({cancelled:'cancelled',unavailable:'failed'})[outcome] || 'booked';
    } else if (action === 'track') {
      if (outcome === 'failure' || outcome === 'unknown') fail('Could not update the courier status. Try again.');
      next = ({booked:'in_transit',in_transit:'delivered'})[input.expectedStatus];
      if (!next || booking.status !== input.expectedStatus) return;
    } else fail('Invalid courier action.',400);
    db.prepare('UPDATE CourierBooking SET status = ?, updated_at = ? WHERE booking_id = ?')
      .run(next,now,booking.booking_id);
    history.run(id,'courier_' + next,account.account_id,now);
    if (['booked','in_transit','delivered'].includes(next)) onProgress(next, booking.booking_id);
    if (next === 'delivered') complete();
  }
