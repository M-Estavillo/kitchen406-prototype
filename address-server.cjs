const { randomUUID } = require('node:crypto');

function addressRecord(row) {
  const { data, ...fields } = row;
  return { ...JSON.parse(data), ...fields, is_default: !!fields.is_default, status: 'active' };
}

function addressBook(db, transaction, requireRole, HttpError) {
  const list = db.prepare('SELECT * FROM SavedDeliveryAddress WHERE customer_id = ? ORDER BY created_at, address_id');
  const find = db.prepare('SELECT * FROM SavedDeliveryAddress WHERE customer_id = ? AND address_id = ?');
  const clearDefault = db.prepare('UPDATE SavedDeliveryAddress SET is_default = 0 WHERE customer_id = ? AND is_default = 1');
  const setDefault = db.prepare('UPDATE SavedDeliveryAddress SET is_default = 1 WHERE customer_id = ? AND address_id = ?');
  const addresses = id => list.all(id).map(addressRecord);

  function update(input, request) {
    const { customer_id: customer } = requireRole(request, 'customer');
    return transaction(() => {
      const { action, id, data } = input;
      const existing = typeof id === 'string' ? find.get(customer, id) : null;
      if ((id != null || action !== 'save') && !existing) throw new HttpError(404, 'Address not found.');
      if (action === 'save') {
        const fields = {};
        for (const key of ['label','add_line_1','add_line_2','city','postal_code','barangay','landmark']) {
          fields[key] = typeof data?.[key] === 'string' ? data[key].trim() || null : null;
        }
        if (!fields.label || !fields.add_line_1 || !fields.city || !/^\d{4}$/.test(fields.postal_code || '') ||
            Object.values(fields).some(value => value?.length > 250)) {
          throw new HttpError(400, 'Enter the address, city, and four-digit postal code.');
        }
        for (const [key, limit] of [['latitude',90],['longitude',180]]) {
          fields[key] = Number.isFinite(data[key]) && Math.abs(data[key]) <= limit ? data[key] : null;
        }
        const addressId = existing?.address_id || randomUUID();
        const now = new Date().toISOString();
        if (data.is_default === true) clearDefault.run(customer);
        db.prepare(`INSERT INTO SavedDeliveryAddress VALUES (?,?,?,?,?,?)
          ON CONFLICT(address_id) DO UPDATE SET data = excluded.data, is_default = excluded.is_default, updated_at = excluded.updated_at`)
          .run(addressId, customer, JSON.stringify(fields), Number(data.is_default === true), existing?.created_at || now, now);
        ensureDefault(customer);
        return { addresses: addresses(customer), record: addressRecord(find.get(customer, addressId)) };
      }
      if (action === 'archive') {
        db.prepare('DELETE FROM SavedDeliveryAddress WHERE customer_id = ? AND address_id = ?').run(customer, id);
        ensureDefault(customer);
      } else if (action === 'default') {
        clearDefault.run(customer);
        setDefault.run(customer, id);
      } else {
        throw new HttpError(400, 'Invalid address action.');
      }
      return { addresses: addresses(customer) };
    });
  }

  function ensureDefault(customer) {
    const rows = list.all(customer);
    if (rows.length && !rows.some(row => row.is_default)) setDefault.run(customer, rows[0].address_id);
  }

  return { addresses, update };
}

module.exports = { addressBook, addressRecord };
