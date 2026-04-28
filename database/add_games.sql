-- tradex-GG
-- @author willSolareviczz
-- @github https://github.com/willSolareviczz/tradex-GG
-- @section database
-- =====================================================
-- tradexGG Games Migration
-- Crash, Coinflip, Roulette Classica, Case Battle
-- =====================================================

-- === CRASH GAME ===
CREATE TABLE IF NOT EXISTS crash_games (
  id            SERIAL PRIMARY KEY,
  crash_point   NUMERIC(8,2) NOT NULL,
  crash_time_ms INTEGER NOT NULL,
  status        VARCHAR(20) NOT NULL DEFAULT 'waiting',
  started_at    TIMESTAMP,
  crashed_at    TIMESTAMP,
  created_at    TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crash_bets (
  id             SERIAL PRIMARY KEY,
  game_id        INTEGER NOT NULL REFERENCES crash_games(id),
  user_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount         INTEGER NOT NULL,
  cashout_at     NUMERIC(8,2),
  cashout_target NUMERIC(8,2),
  profit         INTEGER,
  is_bot         BOOLEAN DEFAULT FALSE,
  bot_name       VARCHAR(50),
  created_at     TIMESTAMP DEFAULT NOW()
);

-- === COINFLIP ===
CREATE TABLE IF NOT EXISTS coinflips (
  id               SERIAL PRIMARY KEY,
  creator_id       INTEGER REFERENCES users(id) ON DELETE CASCADE,
  joiner_id        INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount           INTEGER NOT NULL,
  creator_side     VARCHAR(2) NOT NULL DEFAULT 'T',
  winner_side      VARCHAR(2),
  winner_id        INTEGER REFERENCES users(id),
  status           VARCHAR(20) NOT NULL DEFAULT 'waiting',
  creator_is_bot   BOOLEAN DEFAULT FALSE,
  joiner_is_bot    BOOLEAN DEFAULT FALSE,
  bot_joiner_name  VARCHAR(50),
  created_at       TIMESTAMP DEFAULT NOW(),
  completed_at     TIMESTAMP
);

-- === ROULETTE CLASSICA ===
CREATE TABLE IF NOT EXISTS roulette_rounds (
  id              SERIAL PRIMARY KEY,
  roll_value      INTEGER,
  color           VARCHAR(10),
  status          VARCHAR(20) NOT NULL DEFAULT 'betting',
  betting_ends_at TIMESTAMP NOT NULL,
  rolled_at       TIMESTAMP,
  created_at      TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS roulette_bets (
  id        SERIAL PRIMARY KEY,
  round_id  INTEGER NOT NULL REFERENCES roulette_rounds(id),
  user_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
  amount    INTEGER NOT NULL,
  bet_on    VARCHAR(10) NOT NULL,
  won       BOOLEAN,
  profit    INTEGER,
  is_bot    BOOLEAN DEFAULT FALSE,
  bot_name  VARCHAR(50),
  created_at TIMESTAMP DEFAULT NOW()
);

-- === CASE BATTLE ===
CREATE TABLE IF NOT EXISTS battles (
  id           SERIAL PRIMARY KEY,
  case_id      INTEGER NOT NULL REFERENCES cases(id),
  creator_id   INTEGER REFERENCES users(id),
  max_players  INTEGER NOT NULL DEFAULT 2,
  entry_fee    INTEGER NOT NULL,
  status       VARCHAR(20) NOT NULL DEFAULT 'waiting',
  winner_slot  INTEGER,
  prize_pool   INTEGER DEFAULT 0,
  created_at   TIMESTAMP DEFAULT NOW(),
  started_at   TIMESTAMP,
  completed_at TIMESTAMP
);

CREATE TABLE IF NOT EXISTS battle_players (
  id         SERIAL PRIMARY KEY,
  battle_id  INTEGER NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  is_bot     BOOLEAN DEFAULT FALSE,
  bot_name   VARCHAR(50),
  total_value INTEGER DEFAULT 0,
  slot       INTEGER NOT NULL,
  joined_at  TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS battle_openings (
  id          SERIAL PRIMARY KEY,
  battle_id   INTEGER NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
  player_slot INTEGER NOT NULL,
  skin_id     INTEGER NOT NULL REFERENCES skins(id),
  value       INTEGER NOT NULL
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_crash_games_status  ON crash_games(status);
CREATE INDEX IF NOT EXISTS idx_crash_bets_game     ON crash_bets(game_id);
CREATE INDEX IF NOT EXISTS idx_coinflips_status    ON coinflips(status);
CREATE INDEX IF NOT EXISTS idx_roulette_rounds_status ON roulette_rounds(status);
CREATE INDEX IF NOT EXISTS idx_roulette_bets_round ON roulette_bets(round_id);
CREATE INDEX IF NOT EXISTS idx_battles_status      ON battles(status);
CREATE INDEX IF NOT EXISTS idx_battle_players_battle ON battle_players(battle_id);
