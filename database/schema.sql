-- tradex-GG — Complete Database Schema
-- Inclui todas as migrações (001, 002) inline.
-- Para bancos existentes: execute migrate-001.sql e migrate-002.sql.
-- Todos os valores monetários em centavos (BRL × 100).

CREATE TABLE IF NOT EXISTS users (
    id                   SERIAL PRIMARY KEY,
    username             VARCHAR(32)  UNIQUE NOT NULL,
    email                VARCHAR(255) UNIQUE NOT NULL,
    password_hash        VARCHAR(255) NOT NULL,
    balance              INTEGER      NOT NULL DEFAULT 0,
    avatar_url           VARCHAR(512),
    role                 VARCHAR(20)  NOT NULL DEFAULT 'user',
    reset_token          VARCHAR(64),
    reset_token_expires  TIMESTAMP,
    email_verified       BOOLEAN      NOT NULL DEFAULT FALSE,
    email_verify_token   VARCHAR(64),
    email_verify_expires TIMESTAMP,
    xp                   INTEGER      NOT NULL DEFAULT 0,
    level                INTEGER      NOT NULL DEFAULT 1,
    daily_claimed_at     TIMESTAMP,
    daily_streak         INTEGER      NOT NULL DEFAULT 0,
    client_seed          VARCHAR(64)  NOT NULL DEFAULT 'tradexGG',
    opening_nonce        INTEGER      NOT NULL DEFAULT 0,
    referral_code        VARCHAR(12)  UNIQUE,
    referred_by          INTEGER      REFERENCES users(id) ON DELETE SET NULL,
    referral_bonus_paid  BOOLEAN      NOT NULL DEFAULT FALSE,
    is_banned            BOOLEAN      NOT NULL DEFAULT FALSE,
    banned_reason        VARCHAR(200),
    chat_muted_until     TIMESTAMP,
    created_at           TIMESTAMP    DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cases (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) UNIQUE NOT NULL,
    description VARCHAR(500),
    image_url   VARCHAR(512) NOT NULL,
    price       INTEGER NOT NULL,
    category    VARCHAR(30) NOT NULL DEFAULT 'rifles',
    is_active   BOOLEAN DEFAULT TRUE,
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skins (
    id                SERIAL PRIMARY KEY,
    name              VARCHAR(200) NOT NULL,
    weapon            VARCHAR(50)  NOT NULL,
    skin_name         VARCHAR(100) NOT NULL,
    wear              VARCHAR(5)   NOT NULL DEFAULT 'FT' CHECK (wear IN ('FN','MW','FT','WW','BS')),
    rarity            VARCHAR(30)  NOT NULL,
    rarity_color      VARCHAR(7)   NOT NULL,
    image_url         VARCHAR(512) NOT NULL,
    market_price      INTEGER      NOT NULL,
    market_hash_name  VARCHAR(300),
    site_price        INTEGER,
    price_updated_at  TIMESTAMP,
    created_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_skins (
    id       SERIAL PRIMARY KEY,
    case_id  INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    skin_id  INTEGER REFERENCES skins(id) ON DELETE CASCADE,
    weight   INTEGER NOT NULL DEFAULT 1,
    UNIQUE(case_id, skin_id)
);

CREATE TABLE IF NOT EXISTS openings (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER REFERENCES users(id) ON DELETE CASCADE,
    case_id          INTEGER REFERENCES cases(id),
    skin_id          INTEGER REFERENCES skins(id),
    sold             BOOLEAN DEFAULT FALSE,
    sell_price       INTEGER,
    server_seed      VARCHAR(64),
    server_seed_hash VARCHAR(64),
    client_seed      VARCHAR(64) DEFAULT 'tradexGG',
    nonce            INTEGER     DEFAULT 1,
    created_at       TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(20) NOT NULL,
    amount      INTEGER NOT NULL,
    description VARCHAR(255),
    status      VARCHAR(20) NOT NULL DEFAULT 'completed',
    pix_key     VARCHAR(100),
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS upgrades (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_opening_id INTEGER REFERENCES openings(id) ON DELETE SET NULL,
    to_skin_id      INTEGER REFERENCES skins(id) ON DELETE SET NULL,
    from_value      INTEGER NOT NULL,
    to_value        INTEGER NOT NULL,
    win_chance      INTEGER NOT NULL,
    won             BOOLEAN NOT NULL,
    created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS battles (
    id                  SERIAL PRIMARY KEY,
    case_id             INTEGER REFERENCES cases(id),
    creator_id          INTEGER REFERENCES users(id) ON DELETE CASCADE,
    joiner_id           INTEGER REFERENCES users(id) ON DELETE SET NULL,
    creator_opening_id  INTEGER REFERENCES openings(id) ON DELETE SET NULL,
    joiner_opening_id   INTEGER REFERENCES openings(id) ON DELETE SET NULL,
    winner_id           INTEGER REFERENCES users(id) ON DELETE SET NULL,
    price               INTEGER NOT NULL DEFAULT 0,
    status              VARCHAR(20) NOT NULL DEFAULT 'waiting',
    created_at          TIMESTAMP DEFAULT NOW(),
    completed_at        TIMESTAMP
);

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

CREATE TABLE IF NOT EXISTS notifications (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       VARCHAR(30) NOT NULL,
    title      VARCHAR(80) NOT NULL,
    body       VARCHAR(200),
    url        VARCHAR(500),
    is_read    BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS chat_messages (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
    username   VARCHAR(50) NOT NULL,
    message    TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_logs (
    id         SERIAL PRIMARY KEY,
    admin_id   INTEGER REFERENCES users(id) ON DELETE SET NULL,
    action     VARCHAR(50) NOT NULL,
    entity     VARCHAR(30) NOT NULL,
    entity_id  INTEGER,
    detail     TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_users_email          ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_xp             ON users(xp DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_skins_market_hash    ON skins(market_hash_name);
CREATE INDEX IF NOT EXISTS idx_openings_user        ON openings(user_id);
CREATE INDEX IF NOT EXISTS idx_openings_created     ON openings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_skins_case      ON case_skins(case_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user    ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_status  ON transactions(type, status) WHERE type = 'withdrawal';
CREATE INDEX IF NOT EXISTS idx_upgrades_user        ON upgrades(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_upgrades_created     ON upgrades(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_battles_status       ON battles(status);
CREATE INDEX IF NOT EXISTS idx_battles_creator      ON battles(creator_id);
CREATE INDEX IF NOT EXISTS idx_battles_completed    ON battles(completed_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_coinflips_status     ON coinflips(status);
CREATE INDEX IF NOT EXISTS idx_coinflips_creator    ON coinflips(creator_id);
CREATE INDEX IF NOT EXISTS idx_coinflips_completed  ON coinflips(completed_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE is_read = FALSE;
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON chat_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_logs_created   ON admin_logs(created_at DESC);
