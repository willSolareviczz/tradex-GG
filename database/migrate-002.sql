-- tradex-GG
-- @section database
-- Migration 002 — melhorias de produção
-- Seguro rodar múltiplas vezes (IF NOT EXISTS / IF NOT EXISTS em indexes)

-- Status de transações (especialmente saques: pending → completed | rejected)
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'completed';
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS pix_key VARCHAR(100);

-- Marcar saques existentes sem status como completed
UPDATE transactions SET status = 'completed' WHERE type = 'withdrawal' AND status = 'completed';

-- Tabela de upgrades
CREATE TABLE IF NOT EXISTS upgrades (
    id               SERIAL PRIMARY KEY,
    user_id          INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    from_opening_id  INTEGER REFERENCES openings(id) ON DELETE SET NULL,
    to_skin_id       INTEGER REFERENCES skins(id) ON DELETE SET NULL,
    from_value       INTEGER NOT NULL,
    to_value         INTEGER NOT NULL,
    win_chance       INTEGER NOT NULL,
    won              BOOLEAN NOT NULL,
    created_at       TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_upgrades_user    ON upgrades(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_upgrades_created ON upgrades(created_at DESC);

-- Índice na coluna status de transactions para queries de admin
CREATE INDEX IF NOT EXISTS idx_transactions_status ON transactions(type, status) WHERE type = 'withdrawal';

-- Índice de performance para ranking XP
CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC NULLS LAST);

-- URL de notificação pode ser longa
ALTER TABLE notifications ALTER COLUMN url TYPE VARCHAR(500);

-- Battles: coluna price para reembolso ao expirar
ALTER TABLE battles ADD COLUMN IF NOT EXISTS price INTEGER NOT NULL DEFAULT 0;
