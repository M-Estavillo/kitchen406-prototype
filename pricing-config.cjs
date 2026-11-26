module.exports = function pricingConfig(db, fail) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS PricingConfiguration (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      version INTEGER NOT NULL,
      data TEXT NOT NULL
    ) STRICT;
    CREATE TABLE IF NOT EXISTS ProductTiming (
      product_id INTEGER PRIMARY KEY REFERENCES Product(product_id),
      preparation REAL NOT NULL,
      oven REAL NOT NULL
    ) STRICT;
  `);
  const get = db.prepare('SELECT version, data FROM PricingConfiguration WHERE id = 1');
  const save = db.prepare(`INSERT INTO PricingConfiguration VALUES (1, ?, ?)
    ON CONFLICT(id) DO UPDATE SET version = excluded.version, data = excluded.data`);
  const saveTiming = db.prepare(`INSERT INTO ProductTiming VALUES (?, ?, ?)
    ON CONFLICT(product_id) DO UPDATE SET preparation = excluded.preparation, oven = excluded.oven`);
  const material = db.prepare('SELECT 1 FROM Inventory WHERE inventory_id = ? AND archived_at IS NULL');
  const categories = ['shape', 'size', 'tier', 'flavor', 'color', 'icing'];
  const numeric = (n, max) => Number.isFinite(n) && n >= 0 && n <= max;
  const validTiming = t => numeric(t?.preparation, 10080) && numeric(t?.oven, 10080);
  const read = () => {
    const row = get.get();
    return row ? {version: row.version, ...JSON.parse(row.data)} :
      {version: 0, rates: {markup: 30, cakeMarkup: 30, labor: null, power: null, electricity: null}, timings: [], options: []};
  };
  return {
    read,
    products: () => db.prepare('SELECT * FROM ProductTiming').all(),
    saveProduct(id, timing) {
      if (!validTiming(timing)) fail('Enter valid preparation and oven times.');
      saveTiming.run(id, timing.preparation, timing.oven);
    },
    update(input) {
      const {version, ...config} = read();
      if (input.version !== version) fail('Costing settings changed. Reopen the form.', 409);
      if (input.section === 'rates') {
        const r = input.value;
        if (!['markup', 'cakeMarkup', 'labor', 'power', 'electricity'].every(key => numeric(r?.[key], 100000))) {
          fail('Enter valid rates and oven wattage.');
        }
        config.rates = Object.fromEntries(['markup', 'cakeMarkup', 'labor', 'power', 'electricity'].map(key => [key, r[key]]));
      } else if (input.section === 'option') {
        const {id, type, name, price, measurement, ingredients, available} = input.value || {};
        const previous = config.options.find(o => o.id === id);
        if (!/^[a-z0-9-]{1,80}$/.test(id || '') || !categories.includes(type) || (previous && previous.type !== type) ||
            typeof name !== 'string' || !name.trim() || name.length > 100 || !Number.isSafeInteger(price) || !numeric(price, 10000000) ||
            typeof available !== 'boolean' || (type === 'size' && (!numeric(measurement, 100) || !measurement)) ||
            (type === 'tier' && (!Number.isInteger(measurement) || measurement < 1 || measurement > 20)) ||
            !Array.isArray(ingredients) || ingredients.length > 60 || new Set(ingredients.map(row => row?.id)).size !== ingredients.length ||
            ingredients.some(row => !row || typeof row.id !== 'string' || !material.get(row.id) ||
              !numeric(row.quantity, 100000) || !row.quantity)) {
          fail('Enter valid cake option details and materials.');
        }
        if (config.options.some(o => o.id !== id && o.type === type && (o.name.toLowerCase() === name.trim().toLowerCase() ||
            (['size', 'tier'].includes(type) && o.measurement === measurement)))) fail('This cake option already exists.', 409);
        config.options = config.options.filter(o => o.id !== id);
        config.options.push({id, type, name: name.trim(), price, measurement, available,
          ingredients: Object.fromEntries(ingredients.map(row => [row.id, row.quantity]))});
      } else if (input.section === 'timing') {
        const {size, tier, shape, icing, preparation, oven} = input.value || {};
        if (!validTiming({preparation, oven}) || ![['size',size],['tier',tier],['shape',shape],['icing',icing]].every(([type,id]) =>
          ((type === 'shape' || type === 'icing') && id === '') || config.options.some(o => o.type === type && o.id === id))) {
          fail('Select valid cake options and enter the times.');
        }
        const sameBase = t => t.size === size && t.tier === tier;
        if ((shape || icing) && !config.timings.some(t => sameBase(t) && !t.shape && !t.icing)) fail('Save the size and tier times first.');
        config.timings = config.timings.filter(t => !(sameBase(t) && t.shape === shape && t.icing === icing));
        config.timings.push({size, tier, shape, icing, preparation, oven});
      } else fail('Unknown costing setting.');
      save.run(version + 1, JSON.stringify(config));
    }
  };
};
