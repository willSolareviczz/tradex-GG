-- tradexGG Database Schema
-- Todos os valores monetários em centavos (BRL)

CREATE TABLE IF NOT EXISTS users (
    id            SERIAL PRIMARY KEY,
    username      VARCHAR(32) UNIQUE NOT NULL,
    email         VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    balance       INTEGER NOT NULL DEFAULT 0,
    avatar_url    VARCHAR(512),
    steam_id      VARCHAR(20),
    trade_url     VARCHAR(512),
    created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cases (
    id          SERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) UNIQUE NOT NULL,
    image_url   VARCHAR(512) NOT NULL,
    price       INTEGER NOT NULL,
    is_active   BOOLEAN DEFAULT TRUE,
    created_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS skins (
    id            SERIAL PRIMARY KEY,
    name          VARCHAR(200) NOT NULL,
    weapon        VARCHAR(50) NOT NULL,
    skin_name     VARCHAR(100) NOT NULL,
    rarity        VARCHAR(30) NOT NULL,
    rarity_color  VARCHAR(7) NOT NULL,
    image_url     VARCHAR(512) NOT NULL,
    market_price  INTEGER NOT NULL,
    created_at    TIMESTAMP DEFAULT NOW()
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

CREATE TABLE IF NOT EXISTS payments (
    id                    SERIAL PRIMARY KEY,
    user_id               INTEGER REFERENCES users(id) ON DELETE CASCADE,
    amount                INTEGER NOT NULL,
    status                VARCHAR(20) NOT NULL DEFAULT 'pending',
    mp_payment_id         VARCHAR(100),
    mp_qr_code            TEXT,
    mp_qr_code_base64     TEXT,
    created_at            TIMESTAMP DEFAULT NOW(),
    updated_at            TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS steam_trades (
    id         SERIAL PRIMARY KEY,
    user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
    offer_id   VARCHAR(20) NOT NULL,
    type       VARCHAR(10) NOT NULL,
    asset_ids  JSONB NOT NULL,
    amount     INTEGER,
    status     VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_openings_user ON openings(user_id);
CREATE INDEX IF NOT EXISTS idx_openings_created ON openings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_user ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_mp_id ON payments(mp_payment_id);
CREATE INDEX IF NOT EXISTS idx_case_skins_case ON case_skins(case_id);
CREATE INDEX IF NOT EXISTS idx_steam_trades_user ON steam_trades(user_id);
CREATE INDEX IF NOT EXISTS idx_steam_trades_offer ON steam_trades(offer_id);
