-- tradex-GG
-- @section database
-- Migration 001 — aplicar em bancos existentes (criados antes do schema.sql atual)
-- Seguro rodar múltiplas vezes (IF NOT EXISTS / IF NOT EXISTS em indexes)

-- Soft delete em cases
ALTER TABLE cases ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;

-- Email verification (caso banco antigo não tenha)
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verify_token VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verify_expires TIMESTAMP;

-- Daily bonus
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_claimed_at TIMESTAMP;

-- XP / Níveis
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;

-- Admin audit log
CREATE TABLE IF NOT EXISTS admin_logs (
    id          SERIAL PRIMARY KEY,
    admin_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action      VARCHAR(50) NOT NULL,
    entity      VARCHAR(30) NOT NULL,
    entity_id   INTEGER,
    detail      TEXT,
    created_at  TIMESTAMP DEFAULT NOW()
);

-- Battles (Phase 6 — PvP)
CREATE TABLE IF NOT EXISTS battles (
    id                  SERIAL PRIMARY KEY,
    case_id             INTEGER REFERENCES cases(id),
    creator_id          INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joiner_id           INTEGER REFERENCES users(id) ON DELETE SET NULL,
    creator_opening_id  INTEGER REFERENCES openings(id) ON DELETE SET NULL,
    joiner_opening_id   INTEGER REFERENCES openings(id) ON DELETE SET NULL,
    winner_id           INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'waiting',
    created_at          TIMESTAMP DEFAULT NOW(),
    completed_at        TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_battles_status      ON battles(status);
CREATE INDEX IF NOT EXISTS idx_battles_creator     ON battles(creator_id);
CREATE INDEX IF NOT EXISTS idx_battles_completed   ON battles(completed_at DESC NULLS LAST);

-- Provably Fair seeds (Phase 7)
ALTER TABLE openings ADD COLUMN IF NOT EXISTS server_seed      VARCHAR(64);
ALTER TABLE openings ADD COLUMN IF NOT EXISTS server_seed_hash VARCHAR(64);
ALTER TABLE openings ADD COLUMN IF NOT EXISTS client_seed      VARCHAR(64) DEFAULT 'tradexGG';
ALTER TABLE openings ADD COLUMN IF NOT EXISTS nonce            INTEGER     DEFAULT 1;

-- Coinflip (Phase 7)
CREATE TABLE IF NOT EXISTS coinflips (
    id                  SERIAL PRIMARY KEY,
    creator_id          INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joiner_id           INTEGER REFERENCES users(id) ON DELETE SET NULL,
    creator_opening_id  INTEGER REFERENCES openings(id) ON DELETE SET NULL,
    joiner_opening_id   INTEGER REFERENCES openings(id) ON DELETE SET NULL,
    creator_value       INTEGER NOT NULL,
    joiner_value        INTEGER NOT NULL DEFAULT 0,
    winner_id           INTEGER REFERENCES users(id) ON DELETE SET NULL,
    status              VARCHAR(20) NOT NULL DEFAULT 'waiting',
    server_seed         VARCHAR(64),
    created_at          TIMESTAMP DEFAULT NOW(),
    completed_at        TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_coinflips_status    ON coinflips(status);
CREATE INDEX IF NOT EXISTS idx_coinflips_creator   ON coinflips(creator_id);
CREATE INDEX IF NOT EXISTS idx_coinflips_completed ON coinflips(completed_at DESC NULLS LAST);

-- In-App Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       VARCHAR(30) NOT NULL,
    title      VARCHAR(80) NOT NULL,
    body       VARCHAR(200),
    url        VARCHAR(200),
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;

-- Referral System
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_code       VARCHAR(12) UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referred_by         INTEGER REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS referral_bonus_paid BOOLEAN NOT NULL DEFAULT FALSE;

-- Promo Codes
CREATE TABLE IF NOT EXISTS promo_codes (
    id           SERIAL PRIMARY KEY,
    code         VARCHAR(32) UNIQUE NOT NULL,
    description  VARCHAR(100),
    bonus_amount INTEGER NOT NULL,
    max_uses     INTEGER,
    uses_count   INTEGER NOT NULL DEFAULT 0,
    expires_at   TIMESTAMP,
    is_active    BOOLEAN NOT NULL DEFAULT TRUE,
    created_at   TIMESTAMP DEFAULT NOW()
);
CREATE TABLE IF NOT EXISTS promo_code_uses (
    id       SERIAL PRIMARY KEY,
    code_id  INTEGER NOT NULL REFERENCES promo_codes(id) ON DELETE CASCADE,
    user_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    used_at  TIMESTAMP DEFAULT NOW(),
    UNIQUE(code_id, user_id)
);

-- Live Chat
CREATE TABLE IF NOT EXISTS chat_messages (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    username   VARCHAR(50) NOT NULL,
    message    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);

-- Daily bonus streak
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_streak INTEGER NOT NULL DEFAULT 0;

-- Per-user provably fair seed
ALTER TABLE users ADD COLUMN IF NOT EXISTS client_seed   VARCHAR(64) NOT NULL DEFAULT 'tradexGG';
ALTER TABLE users ADD COLUMN IF NOT EXISTS opening_nonce INTEGER     NOT NULL DEFAULT 0;

-- Ban System
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_banned     BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS banned_reason VARCHAR(200);

-- Chat mute
ALTER TABLE users ADD COLUMN IF NOT EXISTS chat_muted_until TIMESTAMP;

-- Indexes de performance
CREATE INDEX IF NOT EXISTS idx_users_email       ON users(email);
CREATE INDEX IF NOT EXISTS idx_skins_market_hash ON skins(market_hash_name);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created ON admin_logs(created_at DESC);
