const { DatabaseSync } = require('node:sqlite');
const { mkdirSync, readFileSync, rmSync, writeFileSync } = require('node:fs');
const { join } = require('node:path');
const { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, randomInt, randomUUID, scrypt, timingSafeEqual } = require('node:crypto');
const { promisify } = require('node:util');

const derive = promisify(scrypt);
const resendCooldown = 30_000;
const otpLifetime = 10 * 60 * 1000;
const sessionLifetime = 7 * 24 * 60 * 60 * 1000;
const cookie = 'k406_session';
const digest = value => createHash('sha256').update(value).digest('hex');
const normalizeEmail = value => typeof value === 'string' ? value.trim().toLowerCase() : '';
const validEmail = email => email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const validPassword = value => typeof value === 'string' && value.length >= 8 && value.length <= 128 && /[a-z]/i.test(value) && /\d/.test(value);
const text = value => typeof value === 'string' ? value.trim() : '';

class AuthError extends Error {
  constructor(status, code) {
    super(code);
    this.status = status;
    this.code = code;
  }
}

async function hashPassword(password, salt = randomBytes(16).toString('hex')) {
  const hash = await derive(password, salt, 64);
  return salt + ':' + hash.toString('hex');
}

async function matchesPassword(password, stored) {
  const candidate = await hashPassword(password, stored.split(':')[0]);
  return timingSafeEqual(Buffer.from(candidate), Buffer.from(stored));
}

module.exports = function createAuth(dataDir) {
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  const outbox = join(dataDir, 'outbox');
  mkdirSync(outbox, { recursive: true, mode: 0o700 });
  const mailKey = process.env.BREVO_API_KEY?.trim();
  const mailSender = process.env.K406_STAFF_EMAIL_FROM?.trim();
  const keyPath = join(dataDir, 'otp.key');
  try {
    writeFileSync(keyPath, randomBytes(32), { flag: 'wx', mode: 0o600 });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
  const otpKey = readFileSync(keyPath);
  const staffPasswordKey = createHmac('sha256', otpKey).update('k406 staff temporary password encryption').digest();
  const db = new DatabaseSync(join(dataDir, 'kitchen406.sqlite'));
  db.exec('PRAGMA busy_timeout = 5000; PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
  db.exec(readFileSync(join(__dirname, 'database', 'auth.sql'), 'utf8'));
  const hasDeliveryEmail = () => db.prepare("SELECT 1 FROM pragma_table_info('AccountVerification') WHERE name = 'delivery_email'").get();
  if (!hasDeliveryEmail()) transaction(() => {
    if (!hasDeliveryEmail()) db.exec('ALTER TABLE AccountVerification ADD COLUMN delivery_email TEXT');
  });
  const dummyHash = randomBytes(16).toString('hex') + ':' + '0'.repeat(128);
  const otpHash = (id, code, scope = '') => createHmac('sha256', otpKey).update(id + ':' + code + scope).digest('hex');
  const byEmail = db.prepare('SELECT * FROM Account WHERE email = ?');
  const profile = db.prepare(`
    SELECT a.account_id, a.email, a.first_name, a.last_name, a.role, a.status,
           a.email_verified_at, a.password_changed_at, a.created_at, c.customer_id, c.mobile_number,
           p.admin_id, p.is_baking_owner, s.staff_id, s.is_temp_pass_changed
    FROM Account a
    LEFT JOIN CustomerProfile c USING (account_id)
    LEFT JOIN AdminProfile p USING (account_id)
    LEFT JOIN StaffProfile s USING (account_id)
    WHERE a.account_id = ? AND a.status = 'active'
      AND ((a.role = 'customer' AND c.customer_id IS NOT NULL)
        OR (a.role = 'admin' AND p.admin_id IS NOT NULL)
        OR (a.role = 'staff' AND s.staff_id IS NOT NULL))
  `);
  const recentChallenge = db.prepare(`
    SELECT account_verification_id, expires_at, created_at, target_email, delivery_email FROM AccountVerification
    WHERE account_id = ? AND purpose = ? AND verified_at IS NULL
    ORDER BY created_at DESC, rowid DESC LIMIT 1
  `);
  const findSession = db.prepare('SELECT account_id FROM AuthSession WHERE token_hash = ? AND expires_at > ?');
  const endSession = db.prepare('DELETE FROM AuthSession WHERE token_hash = ?');
  const loginAttempts = new Map();
  const undispatchedCodes = new Map();

  function transaction(work) {
    db.exec('BEGIN IMMEDIATE');
    try {
      const result = work();
      db.exec('COMMIT');
      return result;
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  }

  const staffRoster = `
    SELECT s.staff_id AS id, a.email, a.first_name, a.last_name, a.role, a.status,
           s.created_at, s.updated_at, s.version, s.created_by_admin_id, s.is_temp_pass_changed,
           EXISTS (SELECT 1 FROM StaffTemporaryPassword t WHERE t.staff_id = s.staff_id) AS can_reveal_password,
           creator.first_name || ' ' || creator.last_name AS created_by_name
    FROM StaffProfile s
    JOIN Account a ON a.account_id = s.account_id
    JOIN AdminProfile p ON p.admin_id = s.created_by_admin_id
    JOIN Account creator ON creator.account_id = p.account_id
  `;
  const listStaff = db.prepare(staffRoster);
  const findStaff = db.prepare(staffRoster + ' WHERE s.staff_id = ?');
  const staffHistory = db.prepare(`
    SELECT h.status, h.changed_at AS at, h.admin_id, a.first_name || ' ' || a.last_name AS name
    FROM StaffStatusHistory h JOIN AdminProfile p USING (admin_id) JOIN Account a USING (account_id)
    WHERE h.staff_id = ? ORDER BY h.version DESC
  `);
  const withHistory = row => ({
    ...row,
    history: staffHistory.all(row.id).map(({ status, at, admin_id, name }) => ({
      status, at, actor: { id: admin_id, name }
    }))
  });

  function signedInAccount(request) {
    const session = findSession.get(sessionToken(request), Date.now());
    return session ? profile.get(session.account_id) : undefined;
  }

  function requireRole(request, role) {
    const account = signedInAccount(request);
    if (!account) throw new AuthError(401, 'sign-in-required');
    if (account.role !== role) throw new AuthError(403, 'access-denied');
    return account;
  }

  function saveTemporaryPassword(staffId, password) {
    const nonce = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', staffPasswordKey, nonce);
    cipher.setAAD(Buffer.from(staffId));
    const encrypted = Buffer.concat([cipher.update(password, 'utf8'), cipher.final()]);
    db.prepare('INSERT INTO StaffTemporaryPassword VALUES (?, ?, ?, ?)')
      .run(staffId, encrypted, nonce, cipher.getAuthTag());
  }

  function revealTemporaryPassword(input, request) {
    requireRole(request, 'admin');
    const staff = findStaff.get(text(input.id));
    if (!staff) throw new AuthError(404, 'staff-not-found');
    if (staff.is_temp_pass_changed) throw new AuthError(409, 'staff-setup-complete');
    const stored = db.prepare('SELECT * FROM StaffTemporaryPassword WHERE staff_id = ?').get(staff.id);
    if (!stored) throw new AuthError(404, 'temporary-password-unavailable');
    const cipher = createDecipheriv('aes-256-gcm', staffPasswordKey, stored.nonce);
    cipher.setAAD(Buffer.from(staff.id));
    cipher.setAuthTag(stored.auth_tag);
    return { password: Buffer.concat([cipher.update(stored.encrypted_password), cipher.final()]).toString('utf8') };
  }

  function removeStaffWelcome(staffId) {
    try {
      rmSync(join(outbox, 'staff-welcome-' + staffId + '.txt'), { force: true });
    } catch (error) {
      console.error('Staff welcome outbox cleanup failed:', error.code);
    }
  }

  async function replaceLegacyTemporaryPassword(input, request) {
    requireRole(request, 'admin');
    const password = 'K7-' + randomBytes(16).toString('hex');
    const hash = await hashPassword(password);
    const staffId = transaction(() => {
      requireRole(request, 'admin');
      const staff = findStaff.get(text(input.id));
      if (!staff) throw new AuthError(404, 'staff-not-found');
      if (staff.is_temp_pass_changed) throw new AuthError(409, 'staff-setup-complete');
      if (staff.can_reveal_password) throw new AuthError(409, 'staff-changed');
      const { account_id: accountId } = byEmail.get(staff.email);
      const stamp = new Date().toISOString();
      db.prepare('UPDATE Account SET password_hash = ?, updated_at = ? WHERE account_id = ?')
        .run(hash, stamp, accountId);
      db.prepare('DELETE FROM AuthSession WHERE account_id = ?').run(accountId);
      saveTemporaryPassword(staff.id, password);
      return staff.id;
    });
    removeStaffWelcome(staffId);
    return { password };
  }

  async function sendStaffEmail(email, subject, body, filename) {
    try {
      if (!mailKey && !mailSender) {
        writeFileSync(join(outbox, filename), 'To: ' + email + '\nSubject: ' + subject + '\n\n' + body + '\n',
          { flag: 'wx', mode: 0o600 });
        return { status: 'outbox', filename };
      }
      if (!mailKey || !validEmail(mailSender || '')) return { status: 'failed' };
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: { 'api-key': mailKey, 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify({
          sender: { name: 'Kitchen406', email: mailSender },
          to: [{ email }],
          subject,
          textContent: body
        }),
        redirect: 'error',
        signal: AbortSignal.timeout(8000)
      });
      return { status: response.status === 201 ? 'submitted' : 'failed' };
    } catch {
      return { status: 'failed' };
    }
  }

  function sendStaffWelcome(staff, password) {
    const body = [
      'Your Kitchen406 staff account is ready.',
      '',
      'Sign-in email: ' + staff.email,
      'Temporary password: ' + password,
      '',
      'Use these credentials on the Kitchen406 sign-in page. You will be asked to set a new password before entering the staff workspace.'
    ].join('\n');
    return sendStaffEmail(staff.email, 'Your Kitchen406 staff account', body, 'staff-welcome-' + staff.id + '.txt');
  }

  function requireStaffEdit(input, request) {
    requireRole(request, 'admin');
    const staff = findStaff.get(text(input.id));
    if (!staff) throw new AuthError(404, 'staff-not-found');
    if (staff.status !== 'active' || staff.is_temp_pass_changed) throw new AuthError(409, 'staff-not-pending');
    if (staff.version !== input.version) throw new AuthError(409, 'staff-changed');
    return staff;
  }

  function updateStaffVersion(staffId, stamp) {
    db.prepare('UPDATE StaffProfile SET version = version + 1, updated_at = ? WHERE staff_id = ?').run(stamp, staffId);
  }

  function editStaffName(input, request) {
    const first = text(input.first_name), last = text(input.last_name);
    if (!first || !last || first.length > 80 || last.length > 80) throw new AuthError(400, 'invalid-staff-name');
    return transaction(() => {
      const staff = requireStaffEdit(input, request);
      const stamp = new Date().toISOString();
      db.prepare('UPDATE Account SET first_name = ?, last_name = ?, updated_at = ? WHERE email = ?')
        .run(first, last, stamp, staff.email);
      updateStaffVersion(staff.id, stamp);
      return { staff: withHistory(findStaff.get(staff.id)) };
    });
  }

  async function changeStaffEmail(input, request) {
    const staff = requireStaffEdit(input, request);
    const email = normalizeEmail(input.email);
    if (!validEmail(email)) throw new AuthError(400, 'invalid-email');
    if (email === staff.email) throw new AuthError(400, 'same-email');
    const password = 'K7-' + randomBytes(16).toString('hex');
    const hash = await hashPassword(password);
    transaction(() => {
      const current = requireStaffEdit(input, request);
      if (byEmail.get(email)) throw new AuthError(409, 'account-exists');
      const { account_id: accountId } = byEmail.get(current.email);
      const stamp = new Date().toISOString();
      db.prepare('UPDATE Account SET email = ?, email_verified_at = NULL, password_hash = ?, updated_at = ? WHERE account_id = ?')
        .run(email, hash, stamp, accountId);
      db.prepare('DELETE FROM AuthSession WHERE account_id = ?').run(accountId);
      db.prepare('DELETE FROM StaffTemporaryPassword WHERE staff_id = ?').run(current.id);
      saveTemporaryPassword(current.id, password);
      updateStaffVersion(current.id, stamp);
    });
    removeStaffWelcome(staff.id);
    return { emailDelivery: await sendStaffWelcome({ id: staff.id, email }, password) };
  }

  async function createStaff(input, request) {
    requireRole(request, 'admin');
    const email = normalizeEmail(input.email);
    const first = text(input.first_name), last = text(input.last_name);
    if (!validEmail(email) || !validPassword(input.password) || !first || !last || first.length > 80 || last.length > 80) {
      throw new AuthError(400, 'invalid-staff');
    }
    const hash = await hashPassword(input.password);
    const staff = transaction(() => {
      const admin = requireRole(request, 'admin');
      if (byEmail.get(email)) throw new AuthError(409, 'account-exists');
      const accountId = randomUUID(), staffId = randomUUID(), stamp = new Date().toISOString();
      db.prepare(`
        INSERT INTO Account (account_id, email, password_hash, first_name, last_name, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'staff', 'active', ?, ?)
      `).run(accountId, email, hash, first, last, stamp, stamp);
      db.prepare(`
        INSERT INTO StaffProfile (staff_id, account_id, created_by_admin_id, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(staffId, accountId, admin.admin_id, stamp, stamp);
      saveTemporaryPassword(staffId, input.password);
      return withHistory(findStaff.get(staffId));
    });
    const emailDelivery = await sendStaffWelcome(staff, input.password);
    return { staff, emailDelivery };
  }

  function changeStaffStatus(input, request) {
    if (!['active', 'inactive'].includes(input.status)) throw new AuthError(400, 'invalid-status');
    return transaction(() => {
      const admin = requireRole(request, 'admin');
      const staff = findStaff.get(text(input.id));
      if (!staff) throw new AuthError(404, 'staff-not-found');
      if (staff.version !== input.version) throw new AuthError(409, 'staff-changed');
      if (staff.status === input.status) return { staff: withHistory(staff) };
      const stamp = new Date().toISOString();
      const account = byEmail.get(staff.email);
      db.prepare('UPDATE Account SET status = ?, updated_at = ? WHERE account_id = ?')
        .run(input.status, stamp, account.account_id);
      db.prepare('UPDATE StaffProfile SET version = version + 1, updated_at = ? WHERE staff_id = ?').run(stamp, staff.id);
      db.prepare('INSERT INTO StaffStatusHistory VALUES (?, ?, ?, ?, ?)')
        .run(staff.id, staff.version + 1, admin.admin_id, input.status, stamp);
      if (input.status === 'inactive') db.prepare('DELETE FROM AuthSession WHERE account_id = ?').run(account.account_id);
      return { staff: withHistory(findStaff.get(staff.id)) };
    });
  }

  async function completeStaffSetup(input, request) {
    const staff = requireRole(request, 'staff');
    if (staff.is_temp_pass_changed) throw new AuthError(409, 'staff-setup-complete');
    if (!validPassword(input.password)) throw new AuthError(400, 'invalid-password');
    const credentials = byEmail.get(staff.email);
    if (await matchesPassword(input.password, credentials.password_hash)) throw new AuthError(400, 'same-password');
    const hash = await hashPassword(input.password);
    const account = transaction(() => {
      const current = requireRole(request, 'staff');
      if (current.account_id !== staff.account_id || current.is_temp_pass_changed) {
        throw new AuthError(409, 'staff-setup-complete');
      }
      const stamp = new Date().toISOString();
      db.prepare('UPDATE Account SET password_hash = ?, password_changed_at = ?, updated_at = ? WHERE account_id = ?')
        .run(hash, stamp, stamp, staff.account_id);
      db.prepare('UPDATE StaffProfile SET is_temp_pass_changed = 1, updated_at = ? WHERE staff_id = ?').run(stamp, staff.staff_id);
      db.prepare('DELETE FROM StaffTemporaryPassword WHERE staff_id = ?').run(staff.staff_id);
      db.prepare('DELETE FROM AuthSession WHERE account_id = ? AND token_hash <> ?').run(staff.account_id, sessionToken(request));
      return { account: profile.get(staff.account_id) };
    });
    removeStaffWelcome(staff.staff_id);
    return account;
  }

  function issueCode(account, purpose, id = randomUUID(), now = Date.now(), scope = '', deliveryEmail = account.email) {
    const code = String(randomInt(100000, 1000000));
    const expiresAt = now + otpLifetime;
    db.prepare(`
      UPDATE AccountVerification SET expires_at = ?
      WHERE account_id = ? AND purpose = ? AND verified_at IS NULL AND expires_at > ?
    `).run(now, account.account_id, purpose, now);
    db.prepare(`
      INSERT INTO AccountVerification
        (account_verification_id, account_id, purpose, otp_code_hash, target_email, delivery_email, expires_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, account.account_id, purpose, otpHash(id, code, scope), account.email, deliveryEmail, expiresAt, now);
    writeFileSync(join(outbox, id + '.txt'),
      'To: ' + deliveryEmail + '\nPurpose: ' + purpose + '\nCode: ' + code + '\nExpires: ' + new Date(expiresAt).toISOString() + '\n',
      { flag: 'wx', mode: 0o600 });
    notifications.codeOutboxed(account.account_id, id, purpose, now);
    return { challengeId: id, expiresAt, resendAt: now + resendCooldown };
  }

  async function register(input) {
    const email = normalizeEmail(input.email);
    const first = text(input.firstName), last = text(input.lastName);
    const mobile = text(input.mobile).replace(/[\s()-]/g, '');
    if (!validEmail(email) || !validPassword(input.password) || !first || !last ||
        first.length > 80 || last.length > 80 || !/^(?:\+?63|0)?9\d{9}$/.test(mobile)) {
      throw new AuthError(400, 'invalid-registration');
    }
    const hash = await hashPassword(input.password);
    return transaction(() => {
      if (byEmail.get(email)) throw new AuthError(409, 'account-exists');
      const accountId = randomUUID(), stamp = new Date().toISOString();
      db.prepare(`
        INSERT INTO Account (account_id, email, password_hash, first_name, last_name, role, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'customer', 'pending_verification', ?, ?)
      `).run(accountId, email, hash, first, last, stamp, stamp);
      db.prepare(`
        INSERT INTO CustomerProfile (customer_id, account_id, mobile_number, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `).run(randomUUID(), accountId, '+63' + mobile.slice(-10), stamp, stamp);
      return issueCode({ account_id: accountId, email }, 'email_verification');
    });
  }

  function requestCode(input, purpose) {
    const email = normalizeEmail(input.email);
    if (!validEmail(email)) throw new AuthError(400, 'invalid-email');
    return transaction(() => {
      const account = byEmail.get(email), now = Date.now();
      const eligibleStatus = purpose === 'password_reset' ? 'active' : 'pending_verification';
      if (account?.role !== 'customer' || account.status !== eligibleStatus) {
        if (purpose === 'password_reset') throw new AuthError(404, 'recovery-account-not-found');
        for (const [key, entry] of undispatchedCodes) if (entry.until <= now) undispatchedCodes.delete(key);
        const key = purpose + ':' + email;
        const entry = undispatchedCodes.get(key) || {
          challenge: { challengeId: randomUUID(), expiresAt: now + otpLifetime, resendAt: now + resendCooldown },
          until: now + resendCooldown
        };
        undispatchedCodes.set(key, entry);
        return entry.challenge;
      }
      const recent = recentChallenge.get(account.account_id, purpose);
      if (recent && recent.created_at + resendCooldown > now) {
        return { challengeId: recent.account_verification_id, expiresAt: recent.expires_at, resendAt: recent.created_at + resendCooldown };
      }
      return issueCode(account, purpose);
    });
  }

  function requirePersonalAccount(request) {
    const account = signedInAccount(request);
    if (!account || (account.role === 'staff' && !account.is_temp_pass_changed)) {
      throw new AuthError(401, 'sign-in-required');
    }
    return account;
  }

  async function changePassword(input, request, response) {
    const account = requirePersonalAccount(request);
    const { currentPassword, password, confirm } = input;
    if (!validPassword(password)) throw new AuthError(400, 'invalid-password');
    if (password !== confirm) throw new AuthError(400, 'password-mismatch');
    const credentials = byEmail.get(account.email);
    if (!credentials || typeof currentPassword !== 'string' || !currentPassword || currentPassword.length > 128 ||
        !await matchesPassword(currentPassword, credentials.password_hash)) {
      throw new AuthError(403, 'incorrect-password');
    }
    if (currentPassword === password) throw new AuthError(400, 'same-password');
    const hash = await hashPassword(password);
    transaction(() => {
      const current = requirePersonalAccount(request);
      if (current.account_id !== account.account_id ||
          byEmail.get(current.email)?.password_hash !== credentials.password_hash) {
        throw new AuthError(401, 'sign-in-required');
      }
      const stamp = new Date().toISOString();
      db.prepare('UPDATE Account SET password_hash = ?, password_changed_at = ?, updated_at = ? WHERE account_id = ?')
        .run(hash, stamp, stamp, account.account_id);
      db.prepare('DELETE FROM AuthSession WHERE account_id = ?').run(account.account_id);
      expireChallenges(account.account_id, 'email_change');
      expireChallenges(account.account_id, 'password_reset');
      if (current.role === 'customer') notifications.customer({ account: current.account_id,
        key: 'password-change:' + stamp, category: 'account', title: 'Password changed',
        message: 'Your Kitchen406 account password was changed.', sourceAccount: current.account_id, now: Date.parse(stamp) });
    });
    clearSessionCookie(response);
    return { email: account.email };
  }

  async function requestEmailChange(input, request) {
    const account = requirePersonalAccount(request);
    const email = normalizeEmail(input.email), password = input.password;
    if (!validEmail(email)) throw new AuthError(400, 'invalid-email');
    if (email === account.email) throw new AuthError(400, 'same-email');
    const credentials = byEmail.get(account.email);
    if (!credentials || typeof password !== 'string' || !password || password.length > 128 ||
        !await matchesPassword(password, credentials.password_hash)) {
      throw new AuthError(403, 'incorrect-password');
    }
    return transaction(() => {
      const current = requirePersonalAccount(request);
      if (current.account_id !== account.account_id || current.email !== account.email ||
          byEmail.get(current.email).password_hash !== credentials.password_hash) {
        throw new AuthError(401, 'sign-in-required');
      }
      if (byEmail.get(email)) throw new AuthError(409, 'account-exists');
      const customer = current.role === 'customer';
      const verificationEmail = customer ? email : current.email;
      const recent = recentChallenge.get(account.account_id, 'email_change'), now = Date.now();
      if (recent?.expires_at > now && recent.created_at + resendCooldown > now &&
          (customer || recent.delivery_email === verificationEmail)) {
        if (recent.target_email !== email) throw new AuthError(429, 'try-later');
        return { challengeId: recent.account_verification_id, expiresAt: recent.expires_at,
          resendAt: recent.created_at + resendCooldown, verificationEmail };
      }
      return { ...issueCode({ account_id: account.account_id, email }, 'email_change', randomUUID(), now,
        customer ? '' : ':self', verificationEmail), verificationEmail };
    });
  }

  function expireChallenges(accountId, purpose) {
    const now = Date.now();
    db.prepare('UPDATE AccountVerification SET expires_at = ? WHERE account_id = ? AND purpose = ? AND verified_at IS NULL AND expires_at > ?')
      .run(now, accountId, purpose, now);
  }

  function completeChallenge(input, purpose, { passwordHash, request } = {}) {
    const id = text(input.challengeId), code = text(input.code);
    if (!/^[0-9a-f-]{36}$/.test(id) || !/^\d{6}$/.test(code)) return false;
    return transaction(() => {
      const row = db.prepare(`
        SELECT v.*, a.role, a.status, a.email FROM AccountVerification v JOIN Account a USING (account_id)
        WHERE v.account_verification_id = ? AND v.purpose = ?
      `).get(id, purpose);
      const reset = purpose === 'password_reset', change = purpose === 'email_change';
      if (!row || row.status !== (reset || change ? 'active' : 'pending_verification')
          || row.verified_at || row.expires_at <= Date.now() || row.attempt_count >= 5) return false;
      const self = change || (reset && row.role !== 'customer') ? requirePersonalAccount(request) : null;
      if ((self && row.account_id !== self.account_id) ||
          (!self && row.role !== 'customer') || (!change && row.target_email !== row.email)) return false;
      const scope = change && row.role !== 'customer' ? ':self' : '';
      if (scope && row.delivery_email !== self.email) return false;
      if (!timingSafeEqual(Buffer.from(row.otp_code_hash), Buffer.from(otpHash(id, code, scope)))) {
        db.prepare('UPDATE AccountVerification SET attempt_count = attempt_count + 1 WHERE account_verification_id = ?').run(id);
        return false;
      }
      if (change && byEmail.get(row.target_email)) throw new AuthError(409, 'account-exists');
      const stamp = new Date().toISOString();
      db.prepare('UPDATE AccountVerification SET verified_at = ? WHERE account_verification_id = ?').run(stamp, id);
      if (reset) {
        db.prepare('UPDATE Account SET password_hash = ?, password_changed_at = ?, updated_at = ? WHERE account_id = ?')
          .run(passwordHash, stamp, stamp, row.account_id);
        db.prepare('DELETE FROM AuthSession WHERE account_id = ?').run(row.account_id);
        expireChallenges(row.account_id, 'email_change');
        if (row.role === 'customer') notifications.customer({ account: row.account_id, key: 'verified:' + id,
          category: 'account', title: 'Password reset', message: 'Your account password was reset.',
          verification: id, now: Date.now() });
        endSession.run(sessionToken(request));
      } else if (change) {
        if (row.role === 'customer') notifications.customer({ account: row.account_id, key: 'verified:' + id,
          category: 'account', title: 'Email address changed', message: 'Your account email address was updated.',
          verification: id, now: Date.now() });
        db.prepare('UPDATE Account SET email = ?, email_verified_at = ?, updated_at = ? WHERE account_id = ?')
          .run(row.target_email, row.role === 'customer' ? stamp : null, stamp, row.account_id);
        expireChallenges(row.account_id, 'password_reset');
        return profile.get(row.account_id);
      } else {
        db.prepare("UPDATE Account SET status = 'active', email_verified_at = ?, updated_at = ? WHERE account_id = ?")
          .run(stamp, stamp, row.account_id);
        notifications.customer({ account: row.account_id, key: 'verified:' + id, category: 'account',
          title: 'Email verified', message: 'Your Kitchen406 account is ready to use.', verification: id, now: Date.now() });
      }
      return true;
    });
  }

  function clearSessionCookie(response) {
    response.setHeader('Set-Cookie', cookie + '=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');
  }

  function sessionToken(request) {
    const token = request.headers.cookie?.match(/(?:^|;\s*)k406_session=([a-f0-9]{64})(?:;|$)/)?.[1];
    return token ? digest(token) : null;
  }

  async function signIn(input, request, response) {
    const email = normalizeEmail(input.email), password = input.password;
    if (!validEmail(email) || typeof password !== 'string' || !password || password.length > 128) {
      throw new AuthError(401, 'invalid-credentials');
    }
    const now = Date.now();
    for (const [key, entry] of loginAttempts) if (entry.until <= now) loginAttempts.delete(key);
    const attempt = loginAttempts.get(email) || { count: 0, until: now + 60_000 };
    if (attempt.count >= 10) throw new AuthError(429, 'try-later');
    attempt.count++;
    loginAttempts.set(email, attempt);
    const account = byEmail.get(email);
    const matches = await matchesPassword(password, account?.password_hash || dummyHash);
    const latest = byEmail.get(email);
    if (!matches || !latest || latest.password_hash !== account?.password_hash) {
      throw new AuthError(401, 'invalid-credentials');
    }
    if (latest.status === 'pending_verification') throw new AuthError(403, 'verification-required');
    const identity = profile.get(latest.account_id);
    if (!identity) throw new AuthError(401, 'invalid-credentials');
    loginAttempts.delete(email);
    const token = randomBytes(32).toString('hex');
    transaction(() => {
      endSession.run(sessionToken(request));
      db.prepare('DELETE FROM AuthSession WHERE expires_at <= ?').run(now);
      db.prepare('INSERT INTO AuthSession VALUES (?, ?, ?)').run(digest(token), latest.account_id, now + sessionLifetime);
    });
    response.setHeader('Set-Cookie', cookie + '=' + token + '; HttpOnly; SameSite=Strict; Path=/; Max-Age=604800');
    return { account: withAddresses(identity) };
  }

  const inventoryEndpoints = require('./inventory-server.cjs')(db, transaction, signedInAccount, AuthError);
  const notifications = require('./notification-server.cjs')(db, transaction, requirePersonalAccount, AuthError, outbox);
  const addressBook = require('./address-server.cjs').addressBook(db, transaction, requireRole, AuthError);
  const withAddresses = account => account?.role === 'customer'
    ? { ...account, addresses: addressBook.addresses(account.customer_id) }
    : account;
  const endpoints = {
    ...inventoryEndpoints,
    ...notifications.endpoints,
    ...require('./ordering-server.cjs')(db, transaction, requireRole, signedInAccount, AuthError, notifications),
    'GET session': (_input, request) => ({ account: withAddresses(signedInAccount(request)) ?? null }),
    'POST addresses': addressBook.update,
    'GET staff': (_input, request) => {
      requireRole(request, 'admin');
      return { staff: listStaff.all().map(withHistory) };
    },
    'POST staff': createStaff,
    'POST staff/name': editStaffName,
    'POST staff/email': changeStaffEmail,
    'POST staff/temporary-password': revealTemporaryPassword,
    'POST staff/temporary-password/replace': replaceLegacyTemporaryPassword,
    'POST staff/status': changeStaffStatus,
    'POST staff/setup': completeStaffSetup,
    'POST profile': (input, request) => {
      const first = text(input.first_name), last = text(input.last_name);
      const mobile = text(input.mobile_number).replace(/[\s()-]/g, '');
      return transaction(() => {
        const account = requirePersonalAccount(request);
        if (!first || !last || first.length > 80 || last.length > 80 ||
            (account.role === 'customer' && !/^(?:\+?63|0)?9\d{9}$/.test(mobile))) {
          throw new AuthError(400, 'invalid-profile');
        }
        const stamp = new Date().toISOString();
        db.prepare('UPDATE Account SET first_name = ?, last_name = ?, updated_at = ? WHERE account_id = ?')
          .run(first, last, stamp, account.account_id);
        if (account.role === 'customer') {
          db.prepare('UPDATE CustomerProfile SET mobile_number = ?, updated_at = ? WHERE account_id = ?')
            .run('+63' + mobile.slice(-10), stamp, account.account_id);
        }
        return { account: profile.get(account.account_id) };
      });
    },
    'POST change-password': changePassword,
    'POST email-change': requestEmailChange,
    'POST email-change/verify': (input, request) => {
      requirePersonalAccount(request);
      const account = completeChallenge(input, 'email_change', { request });
      if (!account) throw new AuthError(400, 'invalid-code');
      return { account };
    },
    'POST register': register,
    'POST verification-code': input => requestCode(input, 'email_verification'),
    'POST verify': input => {
      if (!completeChallenge(input, 'email_verification')) throw new AuthError(400, 'invalid-code');
      return {};
    },
    'POST sign-in': signIn,
    'POST forgot': input => requestCode(input, 'password_reset'),
    'POST reset': async (input, request, response) => {
      if (!validPassword(input.password)) throw new AuthError(400, 'invalid-password');
      const hash = await hashPassword(input.password);
      if (!completeChallenge(input, 'password_reset', { passwordHash: hash, request })) throw new AuthError(400, 'invalid-code');
      clearSessionCookie(response);
      return {};
    },
    'POST sign-out': (_input, request, response) => {
      endSession.run(sessionToken(request));
      clearSessionCookie(response);
      return {};
    }
  };

  const productCover = db.prepare('SELECT content_type, content FROM ProductCoverAsset WHERE image_id = ?');
  return async (request, response) => {
    const image = /^\/api\/auth\/product-image\/([a-f0-9]{64})$/.exec(request.url);
    if (image && ['GET', 'HEAD'].includes(request.method)) {
      const cover = productCover.get(image[1]);
      if (!cover) return response.writeHead(404).end();
      return response.writeHead(200, {
        'Content-Type': cover.content_type,
        'Content-Length': cover.content.byteLength,
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-Content-Type-Options': 'nosniff'
      }).end(request.method === 'GET' ? cover.content : undefined);
    }
    response.setHeader('Content-Type', 'application/json; charset=utf-8');
    response.setHeader('Cache-Control', 'no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');
    const send = (status, body) => response.writeHead(status).end(JSON.stringify(body));
    const handler = endpoints[request.method + ' ' + request.url.slice('/api/auth/'.length)];
    if (!handler) return send(404, { error: 'not-found' });
    try {
      let data = {};
      if (request.method === 'POST') {
        const origin = request.headers.origin, site = request.headers['sec-fetch-site'];
        if ((origin && origin !== 'http://' + request.headers.host) || (site && site !== 'same-origin')) {
          throw new AuthError(403, 'origin-not-allowed');
        }
        if (request.headers['content-type']?.split(';')[0] !== 'application/json') {
          throw new AuthError(415, 'expected-json');
        }
        let raw = '';
        const limit = ['/api/auth/inventory/recipe/cover','/api/auth/inventory/recipe/schedule'].includes(request.url) ? 4 * Math.ceil(2 * 1024 * 1024 / 3) + 65536
          : request.url === '/api/auth/inventory/recipe' ? 65536
          : request.url === '/api/auth/subscriptions/checkout' ? 8192 : 4096;
        for await (const chunk of request) {
          raw += chunk;
          if (raw.length > limit) {
            send(413, { error: 'request-too-large' });
            return;
          }
        }
        try {
          data = JSON.parse(raw);
          if (!data || typeof data !== 'object' || Array.isArray(data)) throw Error();
        } catch {
          throw new AuthError(400, 'invalid-json');
        }
      }
      send(200, await handler(data, request, response));
    } catch (error) {
      if (error instanceof AuthError) return send(error.status, { error: error.code });
      console.error('Auth request failed:', error.code || error.name);
      send(500, { error: 'server-error' });
    }
  };
};
