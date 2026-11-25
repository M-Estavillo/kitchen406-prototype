CREATE TABLE IF NOT EXISTS Account (
  account_id TEXT PRIMARY KEY NOT NULL,
  email TEXT NOT NULL COLLATE NOCASE UNIQUE,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('customer', 'staff', 'admin')),
  status TEXT NOT NULL CHECK (status IN ('pending_verification', 'active', 'inactive', 'suspended')),
  email_verified_at TEXT,
  password_changed_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS AdminProfile (
  admin_id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL UNIQUE REFERENCES Account(account_id),
  is_baking_owner INTEGER NOT NULL DEFAULT 0 CHECK (is_baking_owner IN (0, 1))
) STRICT;

CREATE TABLE IF NOT EXISTS CustomerProfile (
  customer_id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL UNIQUE REFERENCES Account(account_id),
  mobile_number TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS StaffProfile (
  staff_id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL UNIQUE REFERENCES Account(account_id),
  created_by_admin_id TEXT NOT NULL REFERENCES AdminProfile(admin_id),
  is_temp_pass_changed INTEGER NOT NULL DEFAULT 0 CHECK (is_temp_pass_changed IN (0, 1)),
  version INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS StaffStatusHistory (
  staff_id TEXT NOT NULL REFERENCES StaffProfile(staff_id),
  version INTEGER NOT NULL,
  admin_id TEXT NOT NULL REFERENCES AdminProfile(admin_id),
  status TEXT NOT NULL CHECK (status IN ('active', 'inactive')),
  changed_at TEXT NOT NULL,
  PRIMARY KEY (staff_id, version)
) STRICT;

CREATE TABLE IF NOT EXISTS StaffTemporaryPassword (
  staff_id TEXT PRIMARY KEY NOT NULL REFERENCES StaffProfile(staff_id),
  encrypted_password BLOB NOT NULL,
  nonce BLOB NOT NULL,
  auth_tag BLOB NOT NULL
) STRICT;

CREATE TABLE IF NOT EXISTS AccountVerification (
  account_verification_id TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL REFERENCES Account(account_id),
  purpose TEXT NOT NULL CHECK (purpose IN ('email_verification', 'password_reset', 'email_change', 'account_setup')),
  otp_code_hash TEXT NOT NULL,
  target_email TEXT,
  delivery_email TEXT,
  expires_at INTEGER NOT NULL,
  verified_at TEXT,
  attempt_count INTEGER NOT NULL DEFAULT 0 CHECK (attempt_count BETWEEN 0 AND 5),
  created_at INTEGER NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS verification_account_purpose ON AccountVerification(account_id, purpose, created_at DESC);

-- Application sessions are separate from the ERD's account verification records.
CREATE TABLE IF NOT EXISTS AuthSession (
  token_hash TEXT PRIMARY KEY NOT NULL,
  account_id TEXT NOT NULL REFERENCES Account(account_id),
  expires_at INTEGER NOT NULL
) STRICT;

CREATE INDEX IF NOT EXISTS auth_session_account ON AuthSession(account_id);
