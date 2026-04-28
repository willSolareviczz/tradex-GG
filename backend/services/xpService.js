/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const pool = require('../config/db');

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
  const useExternalClient = !!client;
  const db = client || pool;

  const result = await db.query(
    `UPDATE users
     SET xp = COALESCE(xp, 0) + $1,
         level = floor(sqrt((COALESCE(xp, 0) + $1) / 50.0))::int + 1
     WHERE id = $2
     RETURNING xp, level`,
    [amount, userId]
  );

  return result.rows[0] || null;
}

module.exports = { awardXP, calcLevel, xpForLevel };
