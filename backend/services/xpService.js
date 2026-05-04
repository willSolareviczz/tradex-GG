/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const pool = require('../config/db');
const { createNotification } = require('./notificationService');

/**
 * Calcula o level com base no XP total.
 * Formula: level = floor(sqrt(xp / 50)) + 1
 * Level 1 = 0 xp, Level 2 = 50 xp, Level 3 = 200 xp, Level 4 = 450 xp, Level 5 = 800 xp...
 */
function calcLevel(xp) {
  return Math.floor(Math.sqrt(xp / 50)) + 1;
}

/**
 * Retorna o XP minimo necessario para atingir o level informado.
 */
function xpForLevel(level) {
  // Inversa: xp = ((level - 1)^2) * 50
  return Math.pow(level - 1, 2) * 50;
}

/**
 * Concede XP ao usuario, recalcula o level e persiste no banco.
 * Pode ser chamado dentro ou fora de uma transacao existente.
 * @param {number} userId
 * @param {number} amount - quantidade de XP a conceder
 * @param {object} [client] - client pg opcional (para reuso de transacao)
 */
async function awardXP(userId, amount, client) {
  const db = client || pool;

  const result = await db.query(
    `WITH prev AS (SELECT COALESCE(level, 1) AS prev_level FROM users WHERE id = $2)
     UPDATE users
     SET xp    = COALESCE(xp, 0) + $1,
         level = floor(sqrt((COALESCE(xp, 0) + $1) / 50.0))::int + 1
     WHERE id = $2
     RETURNING xp, level, (SELECT prev_level FROM prev) AS old_level`,
    [amount, userId]
  );

  if (!result.rows[0]) return null;
  const { xp, level, old_level } = result.rows[0];

  let level_up = null;
  if (level > old_level) {
    const levelUpBonus = level * 100; // R$1,00 por nível (centavos)
    await db.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [levelUpBonus, userId]);
    await db.query(
      `INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, 'deposit', $2, $3)`,
      [userId, levelUpBonus, `Level up! Nível ${level}`]
    );
    level_up = { old_level, new_level: level, bonus: levelUpBonus };
    setImmediate(() => createNotification(
      userId, 'level_up',
      `Nível ${level} desbloqueado! 🎉`,
      `Você subiu para o nível ${level} e ganhou ${formatCents(levelUpBonus)} de bônus.`,
      '/profile.html',
      db
    ));
  }

  return { xp, level, level_up };
}

function formatCents(c) { return `R$${(c / 100).toFixed(2).replace('.', ',')}` }

module.exports = { awardXP, calcLevel, xpForLevel };
