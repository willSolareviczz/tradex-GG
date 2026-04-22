/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
// =====================================================
// tradexGG Bot Service
// Gerencia bots para: Crash, Coinflip, Roulette, Battle
// =====================================================
const pool = require('../config/db');
const crypto = require('crypto');

const GROWTH_MS        = 5000;   // crash doubles every 5s
const CRASH_WAIT_MS    = 12000;  // betting phase duration
const CRASH_RESULT_MS  = 4000;   // result display duration
const ROULETTE_BET_MS  = 20000;  // betting phase
const ROULETTE_ROLL_MS = 8000;   // result display
const COINFLIP_BOT_MS  = 4000;   // delay before bot joins coinflip
const BATTLE_BOT_MS    = 8000;   // delay before bots fill battle

const BOT_NAMES = [
  'xX_Alex99', 'cs2_maria', 'rapid_br', 'skinmaster_gg',
  'joao_plays', 'quickwin_br', 'rafinha_cs', 'nitro_player',
  'pro_br_99',  'flashbang_k', 'awper_br',   'knife_only',
];

function randomBotName() {
  return BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
}

// ============================================================
// CRASH HELPERS
// ============================================================
function generateCrashPoint() {
  const r = Math.random();
  if (r < 0.01) return 1.00; // 1% instant crash
  const point = 0.99 / (1 - r);
  return Math.min(Math.round(point * 100) / 100, 1000.00);
}

function crashTimeMs(cp) {
  return Math.round(Math.log2(Math.max(cp, 1.005)) * GROWTH_MS);
}

function currentMultiplier(startedAt) {
  const elapsed = Date.now() - new Date(startedAt).getTime();
  return Math.max(1.00, Math.pow(2, elapsed / GROWTH_MS));
}

// Track which crash games already have bots betting
const crashBotsPlaced = new Set();

async function manageCrash() {
  const { rows } = await pool.query(
    `SELECT * FROM crash_games ORDER BY id DESC LIMIT 1`
  );
  const game = rows[0];

  if (!game) {
    await createNewCrashGame();
    return;
  }

  if (game.status === 'waiting') {
    const age = Date.now() - new Date(game.created_at).getTime();

    // Place bot bets once between 4s–10s into waiting phase
    if (age > 4000 && age < 10000 && !crashBotsPlaced.has(game.id)) {
      crashBotsPlaced.add(game.id);
      await placeBotCrashBets(game.id);
    }

    // Start game after CRASH_WAIT_MS
    if (age >= CRASH_WAIT_MS) {
      await pool.query(
        `UPDATE crash_games SET status = 'running', started_at = NOW() WHERE id = $1`,
        [game.id]
      );
    }

  } else if (game.status === 'running') {
    const startedAt = game.started_at;
    const elapsed   = Date.now() - new Date(startedAt).getTime();
    const mult      = Math.pow(2, elapsed / GROWTH_MS);

    // Auto-cashout bots at their target
    await pool.query(
      `UPDATE crash_bets
       SET cashout_at = cashout_target,
           profit     = ROUND(amount * cashout_target)::int - amount
       WHERE game_id = $1
         AND is_bot = true
         AND cashout_at IS NULL
         AND cashout_target IS NOT NULL
         AND cashout_target <= $2`,
      [game.id, mult]
    );

    // Crash if time reached
    if (elapsed >= game.crash_time_ms) {
      // Mark remaining uncashed bets as lost
      await pool.query(
        `UPDATE crash_bets SET profit = -amount WHERE game_id = $1 AND cashout_at IS NULL`,
        [game.id]
      );
      await pool.query(
        `UPDATE crash_games SET status = 'crashed', crashed_at = NOW() WHERE id = $1`,
        [game.id]
      );
      console.log(`[crash] Game ${game.id} crashed at ${game.crash_point}x`);
    }

  } else if (game.status === 'crashed') {
    const age = Date.now() - new Date(game.crashed_at).getTime();
    if (age >= CRASH_RESULT_MS) {
      await createNewCrashGame();
    }
  }
}

async function createNewCrashGame() {
  const cp   = generateCrashPoint();
  const ctms = crashTimeMs(cp);
  await pool.query(
    `INSERT INTO crash_games (crash_point, crash_time_ms, status) VALUES ($1, $2, 'waiting')`,
    [cp, ctms]
  );
}

async function placeBotCrashBets(gameId) {
  const numBots = 3 + Math.floor(Math.random() * 4); // 3–6 bots
  for (let i = 0; i < numBots; i++) {
    const amount        = Math.round(500 + Math.random() * 9500); // R$5–R$100
    const cashoutTarget = Math.round((1.20 + Math.random() * 3.80) * 100) / 100; // 1.2x–5x
    await pool.query(
      `INSERT INTO crash_bets (game_id, amount, is_bot, bot_name, cashout_target)
       VALUES ($1, $2, true, $3, $4)`,
      [gameId, amount, randomBotName(), cashoutTarget]
    );
  }
}

// ============================================================
// ROULETTE HELPERS
// ============================================================
let rouletteBotsBet = {};

async function manageRoulette() {
  const { rows } = await pool.query(
    `SELECT * FROM roulette_rounds ORDER BY id DESC LIMIT 1`
  );
  const round = rows[0];

  if (!round) {
    await createNewRouletteRound();
    return;
  }

  if (round.status === 'betting') {
    const now         = Date.now();
    const endsAt      = new Date(round.betting_ends_at).getTime();
    const age         = now - new Date(round.created_at).getTime();
    const timeLeft    = endsAt - now;

    // Bots place bets once between 5s–15s into betting
    if (age > 5000 && age < 15000 && !rouletteBotsBet[round.id]) {
      rouletteBotsBet[round.id] = true;
      await placeBotRouletteBets(round.id);
    }

    if (now >= endsAt) {
      // Roll
      const rollValue = crypto.randomInt(0, 15); // 0-14
      const color     = rollValue === 0 ? 'green' : rollValue <= 7 ? 'red' : 'black';

      // Settle bets
      const { rows: bets } = await pool.query(
        `SELECT * FROM roulette_bets WHERE round_id = $1`,
        [round.id]
      );

      const client = await pool.connect();
      try {
        await client.query('BEGIN');

        await client.query(
          `UPDATE roulette_rounds SET status='rolling', roll_value=$1, color=$2, rolled_at=NOW() WHERE id=$3`,
          [rollValue, color, round.id]
        );

        for (const bet of bets) {
          let won    = false;
          let payout = 0;

          if (bet.bet_on === color) {
            won    = true;
            payout = color === 'green' ? bet.amount * 14 : bet.amount * 2;
          }

          const profit = won ? payout - bet.amount : -bet.amount;

          await client.query(
            `UPDATE roulette_bets SET won=$1, profit=$2 WHERE id=$3`,
            [won, profit, bet.id]
          );

          // Credit real player winnings
          if (won && !bet.is_bot && bet.user_id) {
            await client.query(
              `UPDATE users SET balance = balance + $1 WHERE id = $2`,
              [payout, bet.user_id]
            );
            await client.query(
              `INSERT INTO transactions (user_id, type, amount, description)
               VALUES ($1, 'game_win', $2, 'Roulette ganho')`,
              [bet.user_id, payout]
            );
          }
        }

        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }

      console.log(`[roulette] Round ${round.id} rolled ${color} (${rollValue})`);
    }

  } else if (round.status === 'rolling') {
    const age = Date.now() - new Date(round.rolled_at).getTime();
    if (age >= ROULETTE_ROLL_MS) {
      await pool.query(
        `UPDATE roulette_rounds SET status='completed' WHERE id=$1`,
        [round.id]
      );
      delete rouletteBotsBet[round.id];
      await createNewRouletteRound();
    }
  }
}

async function createNewRouletteRound() {
  const bettingEndsAt = new Date(Date.now() + ROULETTE_BET_MS);
  await pool.query(
    `INSERT INTO roulette_rounds (status, betting_ends_at) VALUES ('betting', $1)`,
    [bettingEndsAt]
  );
}

async function placeBotRouletteBets(roundId) {
  const numBots = 3 + Math.floor(Math.random() * 5); // 3–7 bots
  const colors  = ['red', 'red', 'red', 'black', 'black', 'black', 'green'];
  for (let i = 0; i < numBots; i++) {
    const amount = Math.round(200 + Math.random() * 4800); // R$2–R$50
    const betOn  = colors[Math.floor(Math.random() * colors.length)];
    await pool.query(
      `INSERT INTO roulette_bets (round_id, amount, bet_on, is_bot, bot_name)
       VALUES ($1, $2, $3, true, $4)`,
      [roundId, amount, betOn, randomBotName()]
    );
  }
}

// ============================================================
// COINFLIP BOT
// ============================================================
async function manageCoinflip() {
  const { rows } = await pool.query(
    `SELECT * FROM coinflips
     WHERE status = 'waiting' AND creator_is_bot = false AND joiner_id IS NULL
       AND created_at < NOW() - INTERVAL '${COINFLIP_BOT_MS / 1000} seconds'
     LIMIT 5`
  );

  for (const flip of rows) {
    const side = flip.creator_side === 'T' ? 'CT' : 'T';
    // Bot joins
    const winSide = Math.random() < 0.5 ? 'T' : 'CT';
    const winnerId = winSide === flip.creator_side ? flip.creator_id : null;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      await client.query(
        `UPDATE coinflips
         SET status='completed', joiner_is_bot=true, bot_joiner_name=$1,
             winner_side=$2, winner_id=$3, completed_at=NOW()
         WHERE id=$4`,
        [randomBotName(), winSide, winnerId, flip.id]
      );

      // Credit real winner if human won
      if (winnerId === flip.creator_id) {
        const prize = Math.round(flip.amount * 2 * 0.95);
        await client.query(
          `UPDATE users SET balance = balance + $1 WHERE id = $2`,
          [prize, flip.creator_id]
        );
        await client.query(
          `INSERT INTO transactions (user_id, type, amount, description)
           VALUES ($1, 'game_win', $2, 'Coinflip ganho')`,
          [flip.creator_id, prize]
        );
      }
      // If bot won: human's bet stays deducted (house keeps it)

      await client.query('COMMIT');
      console.log(`[coinflip] Bot joined flip ${flip.id}, winner: ${winSide}`);
    } catch (e) {
      await client.query('ROLLBACK');
    } finally {
      client.release();
    }
  }
}

// ============================================================
// BATTLE BOT
// ============================================================
async function manageBattle() {
  const { rows } = await pool.query(
    `SELECT b.*, c.price as case_price
     FROM battles b
     JOIN cases c ON c.id = b.case_id
     WHERE b.status = 'waiting'
       AND b.created_at < NOW() - INTERVAL '${BATTLE_BOT_MS / 1000} seconds'`
  );

  for (const battle of rows) {
    const { rows: players } = await pool.query(
      `SELECT * FROM battle_players WHERE battle_id = $1`,
      [battle.id]
    );
    const filledSlots = players.map(p => p.slot);
    const neededSlots = [];
    for (let i = 1; i <= battle.max_players; i++) {
      if (!filledSlots.includes(i)) neededSlots.push(i);
    }
    if (neededSlots.length === 0) continue;

    // Fill empty slots with bots
    for (const slot of neededSlots) {
      await pool.query(
        `INSERT INTO battle_players (battle_id, user_id, is_bot, bot_name, slot)
         VALUES ($1, NULL, true, $2, $3)`,
        [battle.id, randomBotName(), slot]
      );
    }

    // Now run the battle
    await runBattle(battle);
  }
}

async function runBattle(battle) {
  const { rows: allPlayers } = await pool.query(
    `SELECT * FROM battle_players WHERE battle_id = $1 ORDER BY slot`,
    [battle.id]
  );

  // Get case skins for weighted random
  const { rows: caseSkins } = await pool.query(
    `SELECT cs.skin_id, cs.weight, COALESCE(s.site_price, s.market_price) AS price
     FROM case_skins cs
     JOIN skins s ON s.id = cs.skin_id
     WHERE cs.case_id = $1`,
    [battle.case_id]
  );

  if (caseSkins.length === 0) return;

  const totalWeight = caseSkins.reduce((s, r) => s + r.weight, 0);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let maxValue = -1;
    let winnerSlot = 1;

    for (const player of allPlayers) {
      // Open case for this player
      const rand = crypto.randomInt(0, totalWeight);
      let acc = 0;
      let wonSkin = caseSkins[caseSkins.length - 1];
      for (const sk of caseSkins) {
        acc += sk.weight;
        if (rand < acc) { wonSkin = sk; break; }
      }

      await client.query(
        `INSERT INTO battle_openings (battle_id, player_slot, skin_id, value) VALUES ($1,$2,$3,$4)`,
        [battle.id, player.slot, wonSkin.skin_id, wonSkin.price]
      );
      await client.query(
        `UPDATE battle_players SET total_value = $1 WHERE id = $2`,
        [wonSkin.price, player.id]
      );

      if (wonSkin.price > maxValue) {
        maxValue   = wonSkin.price;
        winnerSlot = player.slot;
      }
    }

    // Prize pool = entry_fee * max_players * 0.95
    const prizePool = Math.round(battle.entry_fee * battle.max_players * 0.95);
    const winner    = allPlayers.find(p => p.slot === winnerSlot);

    await client.query(
      `UPDATE battles SET status='completed', winner_slot=$1, prize_pool=$2, started_at=NOW(), completed_at=NOW() WHERE id=$3`,
      [winnerSlot, prizePool, battle.id]
    );

    // Credit prize to real player winner
    if (winner && !winner.is_bot && winner.user_id) {
      await client.query(
        `UPDATE users SET balance = balance + $1 WHERE id = $2`,
        [prizePool, winner.user_id]
      );
      await client.query(
        `INSERT INTO transactions (user_id, type, amount, description)
         VALUES ($1, 'game_win', $2, 'Case Battle ganho')`,
        [winner.user_id, prizePool]
      );
    }

    await client.query('COMMIT');
    console.log(`[battle] Battle ${battle.id} done. Winner: slot ${winnerSlot}`);
  } catch (e) {
    await client.query('ROLLBACK');
    console.error('[battle] Error:', e.message);
  } finally {
    client.release();
  }
}

// ============================================================
// MAIN LOOP
// ============================================================
let running = false;

async function tick() {
  if (running) return;
  running = true;
  try {
    await Promise.all([
      manageCrash(),
      manageRoulette(),
      manageCoinflip(),
      manageBattle(),
    ]);
  } catch (e) {
    console.error('[botService] tick error:', e.message);
  } finally {
    running = false;
  }
}

function startBotService() {
  console.log('[botService] Iniciando servico de bots...');
  // Init crash game and roulette round immediately
  createNewCrashGame().catch(() => {});
  createNewRouletteRound().catch(() => {});
  // Run every 500ms
  setInterval(tick, 500);
}

module.exports = { startBotService, currentMultiplier, GROWTH_MS };
