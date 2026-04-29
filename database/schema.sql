-- tradex-GG
-- @author willSolareviczz
-- @github https://github.com/willSolareviczz/tradex-GG
-- @section database
-- tradexGG Database Schema
-- Sistema de abertura de caixas (virtual, sem Steam)
-- Todos os valores monetários em centavos (BRL)

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(32) UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    balance       INTEGER NOT NULL DEFAULT 0,
    avatar_url    VARCHAR(512),
    role                 VARCHAR(20) NOT NULL DEFAULT 'user',
    reset_token          VARCHAR(64),
    reset_token_expires  TIMESTAMP,
    created_at           TIMESTAMP DEFAULT NOW()
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
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skins (
    id                SERIAL PRIMARY KEY,
    name              VARCHAR(200) NOT NULL,
    weapon            VARCHAR(50) NOT NULL,
    skin_name         VARCHAR(100) NOT NULL,
    wear              VARCHAR(5)  NOT NULL DEFAULT 'FT' CHECK (wear IN ('FN','MW','FT','WW','BS')),
    rarity            VARCHAR(30) NOT NULL,
    rarity_color      VARCHAR(7) NOT NULL,
    image_url         VARCHAR(512) NOT NULL,
    market_price      INTEGER NOT NULL,          -- preco de referencia interno para EV (centavos BRL)
    market_hash_name  VARCHAR(300),              -- nome exato para busca na Steam Market API
    site_price        INTEGER,                   -- preco real Steam atualizado via API (exibido ao usuario)
    price_updated_at  TIMESTAMP,                 -- ultima vez que site_price foi atualizado
    created_at        TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS case_skins (
    id         SERIAL PRIMARY KEY,
    case_id    INTEGER REFERENCES cases(id) ON DELETE CASCADE,
    skin_id    INTEGER REFERENCES skins(id) ON DELETE CASCADE,
    weight     INTEGER NOT NULL DEFAULT 1,
    UNIQUE(case_id, skin_id)
);

CREATE TABLE IF NOT EXISTS openings (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    case_id     INTEGER REFERENCES cases(id),
    skin_id     INTEGER REFERENCES skins(id),
    sold        BOOLEAN DEFAULT FALSE,
    sell_price  INTEGER,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transactions (
    id          SERIAL PRIMARY KEY,
    user_id     INTEGER REFERENCES users(id) ON DELETE CASCADE,
    type        VARCHAR(20) NOT NULL,
    amount      INTEGER NOT NULL,
    description VARCHAR(255),
    created_at  TIMESTAMP DEFAULT NOW()
);

-- ===== FEATURES ADICIONAIS =====

-- XP / Niveis
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS level INTEGER NOT NULL DEFAULT 1;

-- Daily Bonus
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_claimed_at TIMESTAMP;

-- Email Verification
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verify_token VARCHAR(64);
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verify_expires TIMESTAMP;

-- Upgrade System (planejado — tabela criada, sem rotas ainda)
CREATE TABLE IF NOT EXISTS upgrades (
    id              SERIAL PRIMARY KEY,
    user_id         INTEGER REFERENCES users(id) ON DELETE CASCADE,
    from_opening_id INTEGER REFERENCES openings(id),
    to_skin_id      INTEGER REFERENCES skins(id),
    from_value      INTEGER NOT NULL,
    to_value        INTEGER NOT NULL,
    win_chance      INTEGER NOT NULL,  -- chance em basis points (ex: 4500 = 45.00%)
    won             BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_openings_user ON openings(user_id);
CREATE INDEX IF NOT EXISTS idx_openings_created ON openings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_case_skins_case ON case_skins(case_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_upgrades_user ON upgrades(user_id);
CREATE INDEX IF NOT EXISTS idx_upgrades_created ON upgrades(created_at DESC);
