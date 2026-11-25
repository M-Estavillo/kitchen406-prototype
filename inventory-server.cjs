const { createHash, randomUUID } = require('node:crypto');
const { readFileSync } = require('node:fs');
const { join } = require('node:path');

const units = ['g', 'ml', 'pcs'];
const reasons = ['spoilage', 'damage', 'miscount', 'theft', 'correction', 'other'];
const round = value => Math.round(value * 1000) / 1000;
const status = (stock, threshold) => stock === 0 ? 'unavailable' : stock <= threshold ? 'low_stock' : 'available';
const validNumber = (value, scale) => typeof value === 'number' && value >= 0 &&
  Number.isSafeInteger(Math.round(value * scale)) && Math.abs(value * scale - Math.round(value * scale)) < 1e-6;

module.exports = function inventoryEndpoints(db, transaction, signedInAccount, HttpError) {
  db.exec(readFileSync(join(__dirname, 'database', 'inventory.sql'), 'utf8'));
  transaction(() => {
    if (!db.prepare('PRAGMA table_info(Inventory)').all().some(column => column.name === 'archived_at')) {
      db.exec('ALTER TABLE Inventory ADD COLUMN archived_at TEXT');
    }
  });
  const allItems = db.prepare('SELECT * FROM Inventory ORDER BY created_at, inventory_id');
  const find = db.prepare('SELECT * FROM Inventory WHERE inventory_id = ?');
  const nameTaken = db.prepare('SELECT 1 FROM Inventory WHERE name = ? AND inventory_id <> ?');
  const history = db.prepare(`
    SELECT m.*, a.first_name || ' ' || a.last_name AS actor,
      SUM(quantity_change) OVER (PARTITION BY inventory_id ORDER BY m.rowid
        ROWS BETWEEN UNBOUNDED PRECEDING AND CURRENT ROW) AS balance
    FROM InventoryMovement m LEFT JOIN Account a ON a.account_id = m.performed_by_account_id
    ORDER BY m.rowid DESC
  `);
  const hasHistory = db.prepare('SELECT 1 FROM InventoryMovement WHERE inventory_id = ? LIMIT 1');
  const remove = db.prepare('DELETE FROM Inventory WHERE inventory_id = ?');
  const insert = db.prepare(`INSERT INTO Inventory (inventory_id, name, material_type, unit, stock_on_hand,
    reorder_threshold, cost_per_unit, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  const archive = db.prepare('UPDATE Inventory SET archived_at = ?, updated_at = ? WHERE inventory_id = ?');
  const usedInRecipe = db.prepare('SELECT 1 FROM ProductBOM WHERE inventory_id = ? LIMIT 1');
  const listProducts = db.prepare('SELECT * FROM Product ORDER BY product_id');
  const listSchedules = db.prepare('SELECT * FROM SubscriptionSchedule ORDER BY created_at, schedule_id');
  const findSchedule = db.prepare('SELECT * FROM SubscriptionSchedule WHERE schedule_id = ?');
  const lastScheduleUpdate = db.prepare('SELECT max(updated_at) AS updated_at FROM SubscriptionSchedule WHERE product_id = ?');
  const saveSchedule = db.prepare(`INSERT INTO SubscriptionSchedule VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(schedule_id) DO UPDATE SET preparation_day = excluded.preparation_day,
      fulfillment_day = excluded.fulfillment_day, status = excluded.status, updated_at = excluded.updated_at`);
  const deactivateSchedules = db.prepare("UPDATE SubscriptionSchedule SET status = 'inactive', updated_at = ? WHERE product_id = ? AND status = 'active'");
  const findAdmin = db.prepare('SELECT admin_id FROM AdminProfile WHERE account_id = ?');
  const saveCover = db.prepare('INSERT OR IGNORE INTO ProductCoverAsset VALUES (?, ?, ?)');
  const coverExists = db.prepare('SELECT 1 FROM ProductCoverAsset WHERE image_id = ?');
  const findProduct = db.prepare('SELECT updated_at, status, subscription_eligible FROM Product WHERE product_id = ?');
  const listCategories = db.prepare('SELECT * FROM Category ORDER BY category_name');
  const findCategory = db.prepare('SELECT * FROM Category WHERE category_id = ?');
  const categoryHasProducts = db.prepare('SELECT 1 FROM Product WHERE category_id = ? LIMIT 1');
  const deleteCategory = db.prepare('DELETE FROM Category WHERE category_id = ?');
  const conflictingCategory = db.prepare('SELECT 1 FROM Category WHERE category_name = ? AND category_id <> ?');
  const listRecipes = db.prepare(`SELECT v.*, p.name AS product_name, v.size AS variant_name
    FROM ProductVariant v JOIN Product p USING (product_id) ORDER BY product_id, variant_key`);
  const listBOM = db.prepare('SELECT variant_id, inventory_id, quantity_required FROM ProductBOM');
  const catalogStock = db.prepare(`SELECT inventory_id, stock_on_hand, archived_at IS NOT NULL AS archived
    FROM Inventory WHERE EXISTS (SELECT 1 FROM ProductBOM WHERE ProductBOM.inventory_id = Inventory.inventory_id)`);
  const saveCategory = db.prepare(`INSERT INTO Category VALUES (?, ?, ?, ?, ?)
    ON CONFLICT(category_id) DO UPDATE SET category_name = excluded.category_name,
      status = excluded.status, updated_at = excluded.updated_at`);
  const seedCategory = db.prepare('INSERT OR IGNORE INTO Category VALUES (?, ?, ?, ?, ?)');
  transaction(() => {
    if (db.prepare('PRAGMA user_version').get().user_version >= 1) return;
    const stamp = new Date().toISOString();
    for (const [id, name] of [['breads', 'Breads'], ['pastries', 'Pastries'], ['pantry', 'Pantry']]) {
      seedCategory.run(id, name, 'active', stamp, stamp);
    }
    db.exec('PRAGMA user_version = 1');
  });
  transaction(() => {
    if (db.prepare('PRAGMA user_version').get().user_version >= 2) return;
    const legacyPacks = db.prepare(`SELECT v.variant_id, v.product_id, p.updated_at
      FROM ProductVariant v JOIN Product p USING (product_id)
      WHERE lower(trim(v.size)) = 'standard' ORDER BY v.variant_id`).all();
    const existingPack = db.prepare("SELECT 1 FROM ProductVariant WHERE product_id = ? AND lower(trim(size)) = '6-pack' LIMIT 1");
    const renamePack = db.prepare("UPDATE ProductVariant SET size = '6-pack', updated_at = ? WHERE variant_id = ?");
    const retireDuplicate = db.prepare("UPDATE ProductVariant SET status = 'unavailable', updated_at = ? WHERE variant_id = ?");
    const touchProduct = db.prepare('UPDATE Product SET updated_at = ? WHERE product_id = ?');
    for (const { variant_id, product_id, updated_at } of legacyPacks) {
      const stamp = new Date(Math.max(Date.now(), Date.parse(updated_at) + 1)).toISOString();
      const updatePack = existingPack.get(product_id) ? retireDuplicate : renamePack;
      updatePack.run(stamp, variant_id);
      touchProduct.run(stamp, product_id);
    }
    db.exec('PRAGMA user_version = 2');
  });
  transaction(() => {
    const version = db.prepare('PRAGMA user_version').get().user_version;
    for (const [target, file] of [[3, 'ordering-v3.sql'], [4, 'pickup-fulfillment-v4.sql']]) {
      if (version >= target) continue;
      db.exec(readFileSync(join(__dirname, 'database', file), 'utf8'));
      db.exec('PRAGMA user_version = ' + target);
    }
  });
  for (const [target, file] of [[5, 'subscriptions-v5.sql'], [6, 'courier-v6.sql']]) {
    if (db.prepare('PRAGMA user_version').get().user_version >= target) continue;
    db.exec('PRAGMA foreign_keys = OFF');
    try {
      transaction(() => {
        if (db.prepare('PRAGMA user_version').get().user_version >= target) return;
        db.exec(readFileSync(join(__dirname, 'database', file), 'utf8'));
        if (db.prepare('PRAGMA foreign_key_check').get()) throw Error(file + ' violated a foreign key');
        db.exec('PRAGMA user_version = ' + target);
      });
    } finally {
      db.exec('PRAGMA foreign_keys = ON');
    }
  }
  const publicVariants = db.prepare(`SELECT product_id, variant_key, size, final_price, status
    FROM ProductVariant ORDER BY product_id, variant_key`);
  const saveProduct = db.prepare(`INSERT INTO Product VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(product_id) DO UPDATE SET category_id = excluded.category_id, name = excluded.name,
      description = excluded.description, img_url = excluded.img_url, subscription_eligible = excluded.subscription_eligible,
      status = excluded.status, updated_at = excluded.updated_at`);
  const saveVariant = db.prepare(`INSERT INTO ProductVariant VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(variant_id) DO UPDATE SET size = excluded.size, final_price = excluded.final_price,
      utility_overhead = excluded.utility_overhead, status = excluded.status, updated_at = excluded.updated_at`);
  const clearBOM = db.prepare('DELETE FROM ProductBOM WHERE variant_id = ?');
  const findVariant = db.prepare('SELECT size FROM ProductVariant WHERE variant_id = ?');
  const duplicateVariantSize = db.prepare('SELECT 1 FROM ProductVariant WHERE product_id = ? AND lower(size) = ? AND variant_id <> ?');
  const insertBOM = db.prepare('INSERT INTO ProductBOM VALUES (?, ?, ?, ?)');
  const recipeLine = db.prepare('SELECT quantity_required FROM ProductBOM WHERE variant_id = ? AND inventory_id = ?');
  const variantHasRecipe = db.prepare('SELECT 1 FROM ProductBOM WHERE variant_id = ? LIMIT 1');
  const productHasRecipe = db.prepare(`SELECT 1 FROM ProductBOM JOIN ProductVariant USING (variant_id)
    WHERE product_id = ? LIMIT 1`);
  const recipeVersion = db.prepare("SELECT COUNT(*) AS version FROM InventoryOperation WHERE signature LIKE '[\"recipe\",%'");
  const update = db.prepare(`
    UPDATE Inventory SET name = ?, material_type = ?, unit = ?, stock_on_hand = ?,
      reorder_threshold = ?, cost_per_unit = ?, status = ?, updated_at = ? WHERE inventory_id = ?
  `);
  const movement = db.prepare(`
    INSERT INTO InventoryMovement (movement_id, inventory_id, performed_by_account_id,
      movement_type, quantity_change, unit_cost_snapshot, reason, notes, operation_key, occurred_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const operation = db.prepare('SELECT * FROM InventoryOperation WHERE operation_key = ?');
  const record = db.prepare('INSERT INTO InventoryOperation VALUES (?, ?, ?)');
  const fail = (message, code = 400) => { throw new HttpError(code, message); };

  function coverPath(path, upload) {
    if (upload !== undefined) {
      const match = typeof upload === 'string' && /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(upload);
      if (!match || match[2].length > 4 * Math.ceil(2 * 1024 * 1024 / 3)) fail('Choose a JPEG, PNG, or WebP image up to 2 MB.');
      const [, type, encoded] = match;
      const content = Buffer.from(encoded, 'base64');
      const isJpeg = content.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]));
      const isPng = content.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]));
      const isWebp = content.toString('ascii', 0, 4) === 'RIFF' && content.toString('ascii', 8, 12) === 'WEBP';
      if (content.length > 2 * 1024 * 1024 || content.toString('base64') !== encoded ||
          !(type === 'image/jpeg' ? isJpeg : type === 'image/png' ? isPng : isWebp)) {
        fail('Choose a valid JPEG, PNG, or WebP image up to 2 MB.');
      }
      const imageId = createHash('sha256').update(content).digest('hex');
      saveCover.run(imageId, type, content);
      return '/api/auth/product-image/' + imageId;
    }
    if (typeof path === 'string') {
      if (/^assets\/[\w-]+\.(?:png|jpg|jpeg|webp|svg)$/i.test(path)) return path;
      const stored = /^\/api\/auth\/product-image\/([a-f0-9]{64})$/.exec(path);
      if (stored && coverExists.get(stored[1])) return path;
    }
    fail('Choose a valid cover image.');
  }

  function authorize(request, action) {
    const account = signedInAccount(request);
    if (!account) fail('Sign in to access inventory.', 401);
    const allowed = account.role === 'admin' ||
      (['list', 'stock'].includes(action) && account.role === 'staff' && account.is_temp_pass_changed);
    if (account.status !== 'active' || !allowed) fail('You do not have access to this inventory action.', 403);
    return account.account_id;
  }

  function read() {
    return { items: allItems.all(), recipes: listRecipes.all(), bom: listBOM.all(),
      products: listProducts.all(), categories: listCategories.all(), schedules: listSchedules.all(),
      recipeVersion: recipeVersion.get().version, movements: history.all().map(row => ({
      ...row, before: round(row.balance - row.quantity_change), after: round(row.balance)
    })) };
  }

  function writeSubscriptionSchedule(input, productId, actor) {
    const { id, preparation_day, day, inventoryVersion, status = 'active' } = input || {};
    const product = findProduct.get(productId);
    if (!product?.subscription_eligible || typeof id !== 'string' || !/^[\w-]{1,100}$/.test(id) ||
        ![preparation_day, day].every(value => Number.isInteger(value) && value >= 0 && value <= 6) ||
        !['active','inactive'].includes(status)) fail('Choose a subscription product and valid weekdays.');
    const existing = findSchedule.get(id);
    if ((existing?.updated_at ?? null) !== inventoryVersion || (existing && existing.product_id !== productId)) {
      fail('Subscription schedule changed. Reopen the offering.', 409);
    }
    const deactivatingLegacy = status === 'inactive' && existing?.preparation_day === preparation_day &&
      existing.fulfillment_day === day;
    if (preparation_day === day && !deactivatingLegacy) fail('Preparation and fulfillment must fall on different weekdays.');
    const admin = findAdmin.get(actor);
    if (!admin) fail('Owner access required.', 403);
    const lastUpdate = lastScheduleUpdate.get(productId).updated_at;
    const stamp = new Date(Math.max(Date.now(), lastUpdate ? Date.parse(lastUpdate) + 1 : 0)).toISOString();
    if (status === 'active') deactivateSchedules.run(stamp, productId);
    saveSchedule.run(id, productId, preparation_day, day, status, admin.admin_id, stamp, stamp);
  }

  function writeRecipes(input, actor) {
    if (input.recipeVersion !== recipeVersion.get().version) fail('Recipes changed. Close and reopen the editor.', 409);
    const { recipes } = input;
    if (!Array.isArray(recipes) || !recipes.length || recipes.length > 40) fail('Choose at least one valid variant.');
    const product = input.product;
    const category = product?.category;
    const text = (value, max) => typeof value === 'string' && value.trim() && value.length <= max;
    if (!Number.isSafeInteger(product?.id) || product.id < 1 || !text(product.name, 150) ||
        !text(product.description, 1000) ||
        !text(category?.id, 100) || !text(category.name, 80) || !['active', 'inactive'].includes(category.status) ||
        typeof product.subscription !== 'boolean' || typeof product.active !== 'boolean') {
      fail('Enter valid product and category details.');
    }
    const previous = findProduct.get(product.id);
    const deactivating = previous?.status === 'active' && !product.active && recipes.every(recipe => recipe?.rows === null);
    const stamp = new Date(Math.max(Date.now(), previous ? Date.parse(previous.updated_at) + 1 : 0)).toISOString();
    const existingCategory = findCategory.get(category.id);
    if (!existingCategory || existingCategory.status !== category.status) {
      fail('Categories changed. Close and reopen the editor.', 409);
    }
    const image = coverPath(product.image, input.coverUpload);
    saveProduct.run(product.id, category.id, product.name, product.description, image,
      Number(product.subscription), product.active ? 'active' : 'inactive', stamp, stamp);
    if (input.schedule !== undefined) {
      writeSubscriptionSchedule(input.schedule, product.id, actor);
    }
    if (!product.subscription) deactivateSchedules.run(stamp, product.id);
    const keys = new Set();
    for (const recipe of recipes) {
      const { variant, variantName, overhead, rows, price, active } = recipe || {};
      if (typeof variant !== 'string' || !/^[a-zA-Z0-9_-]{1,100}$/.test(variant) ||
          typeof variantName !== 'string' || !variantName.trim() || variantName.length > 100 ||
          !validNumber(price, 100) || !price || typeof active !== 'boolean' ||
          (overhead !== null && !validNumber(overhead, 100)) || (rows!==null&&!Array.isArray(rows))) {
        fail('Choose a valid variant, materials, and overhead.');
      }
      const variantId = product.id + ':' + variant;
      if (keys.has(variantId)) fail('Each variant may be saved once.');
      keys.add(variantId);
      const previousVariant = findVariant.get(variantId);
      const size = variantName.trim().toLowerCase();
      if (previousVariant ? previousVariant.size.trim().toLowerCase() !== size : !['6-pack','12-pack'].includes(size)) {
        fail('New variants must be 6-pack or 12-pack. Existing variant sizes cannot be renamed.');
      }
      if (['6-pack','12-pack'].includes(size) && duplicateVariantSize.get(product.id, size, variantId)) {
        fail('Each pack size can be added only once per product.');
      }
      if (rows?.length === 0 || (active && rows === null && !deactivating && !variantHasRecipe.get(variantId))) {
        fail('Add at least one recipe material for ' + variantName.trim() + ' before saving.');
      }
      const seen = new Set();
      for (const row of rows||[]) {
        const item = typeof row?.id === 'string' ? find.get(row.id) : undefined;
        if (!item || seen.has(row.id) || !validNumber(row.quantity, 1000) || !row.quantity) {
          fail('Use each material once with a positive quantity of at most three decimal places.');
        }
        if (item.archived_at && recipeLine.get(variantId, row.id)?.quantity_required !== row.quantity) {
          fail('Replace the archived material before changing its quantity.');
        }
        seen.add(row.id);
      }
      saveVariant.run(variantId, product.id, variant, variantName, price, overhead,
        active ? 'available' : 'unavailable', stamp, stamp);
      if (rows===null) continue;
      clearBOM.run(variantId);
      for (const row of rows) insertBOM.run(randomUUID(), variantId, row.id, row.quantity);
    }
    if (!deactivating && !productHasRecipe.get(product.id)) fail('Add at least one recipe material before saving the product.');
  }

  function writeCategory(input) {
    const { id, version, status } = input;
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    const previous = typeof id === 'string' ? findCategory.get(id) : undefined;
    if ((!previous && (typeof id !== 'string' || !/^(?:breads|pastries|pantry|category-[a-f0-9-]{36})$/.test(id))) ||
        !name || name.length > 80 || !['active', 'inactive'].includes(status)) {
      fail('Enter a valid category name and status.');
    }
    if ((previous?.updated_at ?? null) !== version) fail('Category changed. Reopen the form.', 409);
    if (conflictingCategory.get(name, id)) fail('Use a unique category name.', 409);
    const stamp = new Date(Math.max(Date.now(), previous ? Date.parse(previous.updated_at) + 1 : 0)).toISOString();
    saveCategory.run(id, name, status, stamp, stamp);
  }

  function details(input, id) {
    const name = typeof input.name === 'string' ? input.name.trim() : '';
    if (!name || name.length > 120 || nameTaken.get(name, id)) fail('Enter a unique material name.');
    if (!units.includes(input.unit)) fail('Select a valid unit.');
    if (!['ingredient', 'packaging'].includes(input.category)) fail('Select Ingredient or Packaging.');
    if (!validNumber(input.threshold, input.unit === 'pcs' ? 1 : 1000)) fail('Enter a valid nonnegative reorder threshold.');
    return name;
  }

  function write(input, request, action) {
    const actor = authorize(request, action);
    const { key, id, unit, threshold, category } = input;
    if (typeof key !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(key)) fail('An operation identifier is required.');
    const { coverUpload } = input;
    const signatureInput = action === 'recipe' && typeof coverUpload === 'string'
      ? { ...input, coverUpload: createHash('sha256').update(coverUpload).digest('hex') }
      : input;
    const signature = JSON.stringify([action, signatureInput]);
    return transaction(() => {
      const prior = operation.get(key);
      if (prior) {
        if (prior.account_id !== actor || prior.signature !== signature) fail('This operation was already used.', 409);
        return read();
      }

      if (action === 'recipe') {
        writeRecipes(input, actor);
      } else if (action === 'schedule') {
        writeSubscriptionSchedule(input, input.product_id, actor);
      } else if (action === 'category') {
        writeCategory(input);
      } else if (action === 'category/remove') {
        const category = typeof id === 'string' ? findCategory.get(id) : undefined;
        if (!category || category.updated_at !== input.version) fail('Category changed. Reopen the form.', 409);
        if (categoryHasProducts.get(id)) fail('Reassign all products in this category before removing it.', 409);
        deleteCategory.run(id);
      } else if (action === 'add') {
        const { stock, totalCost } = input;
        const inventoryId = 'ingredient-' + randomUUID();
        const name = details(input, inventoryId);
        if (!validNumber(stock, unit === 'pcs' ? 1 : 1000) || !validNumber(totalCost, 100) || (!stock && totalCost)) {
          fail('Enter valid opening stock and cost. Zero stock must have zero cost.');
        }
        const stamp = new Date().toISOString();
        const cost = stock ? totalCost / stock : 0;
        insert.run(inventoryId, name, category, unit, stock, threshold, cost, status(stock, threshold), stamp, stamp);
        if (stock) movement.run(randomUUID(), inventoryId, actor, 'restock', stock, cost, null, 'Opening stock', key, stamp);
      } else {
        const item = typeof id === 'string' ? find.get(id) : undefined;
        if (!item) fail('This material no longer exists.', 404);
        if (item.updated_at !== input.version) fail('Inventory changed. Close and reopen the form.', 409);
        const stamp = new Date(Math.max(Date.now(), Date.parse(item.updated_at) + 1)).toISOString();
        if (action === 'archive' || action === 'restore') {
          if (action === 'archive' && item.stock_on_hand) fail('Settle physical stock before archiving this material.', 409);
          if (action === 'archive' && db.prepare(`SELECT 1 FROM OrderMaterialRequirement m
            JOIN InventoryReservation r USING (requirement_id) JOIN CheckoutHold h USING (hold_id)
            WHERE m.inventory_id = ? AND (r.status = 'confirmed' OR (r.status = 'held' AND h.expires_at > ?))
              AND NOT EXISTS (SELECT 1 FROM InventoryMovement movement WHERE movement.reservation_id = r.reservation_id)`).get(id, Date.now())) {
            fail('Release active reservations before archiving this material.', 409);
          }
          archive.run(action === 'archive' ? stamp : null, stamp, id);
        } else if (action === 'remove') {
          const ordered = db.prepare('SELECT 1 FROM OrderMaterialRequirement WHERE inventory_id = ?').get(id);
          if (item.stock_on_hand || hasHistory.get(id) || usedInRecipe.get(id) || ordered) fail('Only unused materials with no stock or movement history can be removed.', 409);
          remove.run(id);
        } else if (action === 'edit') {
          const name = details(input, id);
          if (unit !== item.unit && (hasHistory.get(id) || usedInRecipe.get(id))) fail('The unit is locked because this material is already in use.');
          update.run(name, category, unit, item.stock_on_hand, threshold, item.cost_per_unit,
            status(item.stock_on_hand, threshold), stamp, id);
        } else {
          if (item.archived_at) fail('Restore this material before recording stock.');
          const { type, totalCost, reason, notes } = input;
          const restock = type === 'restock';
          if (!restock && type !== 'adjustment') fail('Select a valid movement type.');
          const alternate = (item.unit === 'g' && unit === 'kg') || (item.unit === 'ml' && unit === 'l');
          if (unit !== item.unit && !alternate) fail('Select a valid material unit.');
          const quantity = typeof input.quantity === 'number' ? input.quantity * (alternate ? 1000 : 1) : NaN;
          const scale = item.unit === 'pcs' ? 1 : 1000;
          if (!validNumber(quantity, scale) || (restock && !quantity)) fail('Enter a valid quantity in the material unit.');
          if (restock && !validNumber(totalCost, 100)) fail('Enter a nonnegative cost with up to two decimal places.');
          if (!restock && !reasons.includes(reason)) fail('Choose an adjustment reason.');
          if (typeof notes !== 'string' || notes.length > 500) fail('Enter notes of up to 500 characters.');
          const stock = round(restock ? item.stock_on_hand + quantity : quantity);
          if (!validNumber(stock, scale)) fail('The resulting stock exceeds the allowed quantity.');
          const delta = round(stock - item.stock_on_hand);
          if (!delta) fail('The physical count matches the recorded stock.');
          const cost = restock ? (item.stock_on_hand * item.cost_per_unit + totalCost) / stock : item.cost_per_unit;
          update.run(item.name, item.material_type, item.unit, stock, item.reorder_threshold, cost,
            status(stock, item.reorder_threshold), stamp, id);
          movement.run(randomUUID(), id, actor, type, delta, cost, restock ? null : reason, notes.trim() || null, key, stamp);
        }
      }
      record.run(key, actor, signature);
      return read();
    });
  }

  return {
    'GET catalog': () => transaction(() => ({
      products: listProducts.all(), categories: listCategories.all(), variants: publicVariants.all(), schedules: listSchedules.all(),
      availability: { stock: catalogStock.all(), requirements: listBOM.all() }
    })),
    'GET inventory': (_input, request) => {
      authorize(request, 'list');
      return transaction(read);
    },
    'POST inventory/add': (input, request) => write(input, request, 'add'),
    'POST inventory/edit': (input, request) => write(input, request, 'edit'),
    'POST inventory/remove': (input, request) => write(input, request, 'remove'),
    'POST inventory/archive': (input, request) => write(input, request, 'archive'),
    'POST inventory/restore': (input, request) => write(input, request, 'restore'),
    'POST inventory/recipe': (input, request) => write(input, request, 'recipe'),
    'POST inventory/recipe/cover': (input, request) => write(input, request, 'recipe'),
    'POST inventory/recipe/schedule': (input, request) => write(input, request, 'recipe'),
    'POST inventory/subscription-schedule': (input, request) => write(input, request, 'schedule'),
    'POST inventory/category': (input, request) => write(input, request, 'category'),
    'POST inventory/category/remove': (input, request) => write(input, request, 'category/remove'),
    'POST inventory/stock': (input, request) => write(input, request, 'stock')
  };
};
