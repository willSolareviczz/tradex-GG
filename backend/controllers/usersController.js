/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const pool = require('../config/db');

const STREAK_BONUSES = [500, 600, 800, 1000, 1200, 1500, 2000]; // centavos, day 1-7+

exports.getMe = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, email, balance, avatar_url, created_at,
              COALESCE(xp, 0) AS xp, COALESCE(level, 1) AS level,
              email_verified, daily_claimed_at,
              COALESCE(daily_streak, 0) AS daily_streak,
              client_seed
       FROM users WHERE id = $1`,
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const user = result.rows[0];
    const now   = new Date();
    const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    user.daily_available = !user.daily_claimed_at || new Date(user.daily_claimed_at) < todayUtc;
    const streak = user.daily_streak || 0;
    const nextStreakDay = Math.min(streak + 1, STREAK_BONUSES.length);
    user.daily_next_bonus = STREAK_BONUSES[nextStreakDay - 1];
    delete user.daily_claimed_at;

    res.json(user);
  } catch (err) {
    console.error('Erro ao buscar usuário:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.claimDaily = async (req, res) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const result = await client.query(
      'SELECT daily_claimed_at, COALESCE(daily_streak, 0) AS daily_streak FROM users WHERE id = $1 FOR UPDATE',
      [req.userId]
    );

    const row       = result.rows[0];
    const claimedAt = row?.daily_claimed_at;
    const now       = new Date();
    const todayUtc  = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const yesterdayUtc = new Date(todayUtc); yesterdayUtc.setUTCDate(yesterdayUtc.getUTCDate() - 1);

    if (claimedAt && new Date(claimedAt) >= todayUtc) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Bônus diário já coletado hoje. Volte amanhã!' });
    }

    // Streak: consecutive if last claim was yesterday, else reset
    const wasYesterday = claimedAt && new Date(claimedAt) >= yesterdayUtc && new Date(claimedAt) < todayUtc;
    const newStreak    = wasYesterday ? row.daily_streak + 1 : 1;
    const bonusIdx     = Math.min(newStreak, STREAK_BONUSES.length) - 1;
    const amount       = STREAK_BONUSES[bonusIdx];

    await client.query(
      'UPDATE users SET balance = balance + $1, daily_claimed_at = NOW(), daily_streak = $2 WHERE id = $3',
      [amount, newStreak, req.userId]
    );

    await client.query(
      `INSERT INTO transactions (user_id, type, amount, description)
       VALUES ($1, 'deposit', $2, $3)`,
      [req.userId, amount, `Bônus diário (dia ${newStreak} de sequência)`]
    );

    const updated = await client.query(
      'SELECT balance FROM users WHERE id = $1',
      [req.userId]
    );

    await client.query('COMMIT');

    const nextStreakDay    = Math.min(newStreak + 1, STREAK_BONUSES.length);
    const next_bonus      = STREAK_BONUSES[nextStreakDay - 1];

    res.json({
      message: `Bônus diário coletado! Sequência: ${newStreak} dia(s)`,
      amount,
      streak: newStreak,
      next_bonus,
      new_balance: updated.rows[0].balance,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao coletar bônus diário:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
};

exports.deleteAccount = async (req, res) => {
  const bcrypt = require('bcryptjs');
  try {
    const { password } = req.body;
    if (!password) return res.status(400).json({ error: 'Informe sua senha para confirmar' });

    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1', [req.userId]
    );
    if (!result.rows[0]) return res.status(404).json({ error: 'Usuário não encontrado' });

    const valid = await bcrypt.compare(password, result.rows[0].password_hash);
    if (!valid) return res.status(401).json({ error: 'Senha incorreta' });

    // Anonymise instead of hard-delete to preserve transaction integrity
    const anonEmail = `deleted_${req.userId}_${Date.now()}@deleted.invalid`;
    await pool.query(
      `UPDATE users SET
         username          = $1,
         email             = $2,
         password_hash     = '',
         avatar_url        = NULL,
         email_verified    = FALSE,
         email_verify_token = NULL,
         referral_code     = NULL,
         is_banned         = TRUE,
         banned_reason     = 'Conta excluída pelo usuário'
       WHERE id = $3`,
      [`deleted_${req.userId}`, anonEmail, req.userId]
    );

    res.json({ message: 'Conta excluída. Seus dados pessoais foram anonimizados.' });
  } catch (err) {
    console.error('deleteAccount:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.updateClientSeed = async (req, res) => {
  try {
    const { seed } = req.body;
    if (!seed || typeof seed !== 'string') {
      return res.status(400).json({ error: 'Seed inválido' });
    }
    const trimmed = seed.trim();
    if (trimmed.length < 8 || trimmed.length > 64) {
      return res.status(400).json({ error: 'Seed deve ter entre 8 e 64 caracteres' });
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
      return res.status(400).json({ error: 'Seed deve conter apenas letras, números, _ e -' });
    }
    await pool.query(
      'UPDATE users SET client_seed = $1, opening_nonce = 0 WHERE id = $2',
      [trimmed, req.userId]
    );
    res.json({ message: 'Seed atualizado com sucesso', client_seed: trimmed });
  } catch (err) {
    console.error('updateClientSeed:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.getProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const userResult = await pool.query(
      `SELECT id, username, avatar_url, created_at,
              COALESCE(xp, 0) AS xp, COALESCE(level, 1) AS level
       FROM users WHERE id = $1`,
      [id]
    );
    if (userResult.rows.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    const user = userResult.rows[0];

    // XP progress helpers
    const xpForLevel = (l) => Math.pow(l - 1, 2) * 50;
    const lvl = user.level;
    const xp_this_level = Math.max(0, user.xp - xpForLevel(lvl));
    const xp_for_next   = xpForLevel(lvl + 1) - xpForLevel(lvl);

    const [statsRes, spentRes, earnedRes, rarityRes, showcaseRes, recentRes, roiRes, bestDropRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(*) AS total_openings,
                COUNT(CASE WHEN sold = true THEN 1 END) AS total_sold,
                COUNT(CASE WHEN sold = false THEN 1 END) AS in_inventory
         FROM openings WHERE user_id = $1`, [id]
      ),
      pool.query(
        `SELECT COALESCE(SUM(amount), 0) AS total_spent
         FROM transactions WHERE user_id = $1 AND type = 'case_open'`, [id]
      ),
      pool.query(
        `SELECT COALESCE(SUM(COALESCE(s.site_price, s.market_price)), 0) AS total_earned
         FROM openings o JOIN skins s ON o.skin_id = s.id
         WHERE o.user_id = $1`, [id]
      ),
      pool.query(
        `SELECT MAX(CASE WHEN s.rarity IN ('covert','extraordinary') THEN 1 ELSE 0 END) AS has_covert,
                MAX(CASE WHEN s.rarity = 'extraordinary' THEN 1 ELSE 0 END) AS has_extraordinary
         FROM openings o JOIN skins s ON o.skin_id = s.id
         WHERE o.user_id = $1`, [id]
      ),
      pool.query(
        `SELECT s.name, s.weapon, s.skin_name, s.wear, s.rarity, s.rarity_color, s.image_url,
                COALESCE(s.site_price, s.market_price) AS value
         FROM openings o JOIN skins s ON o.skin_id = s.id
         WHERE o.user_id = $1 AND o.sold = false
         ORDER BY COALESCE(s.site_price, s.market_price) DESC
         LIMIT 6`, [id]
      ),
      pool.query(
        `SELECT o.created_at, s.name, s.weapon, s.skin_name, s.wear,
                s.rarity, s.rarity_color, s.image_url, c.name AS case_name
         FROM openings o
         JOIN skins s ON o.skin_id = s.id
         LEFT JOIN cases c ON o.case_id = c.id
         WHERE o.user_id = $1
         ORDER BY o.created_at DESC LIMIT 12`, [id]
      ),
      pool.query(
        `SELECT TO_CHAR(day, 'DD/MM') AS date,
                COALESCE(spent, 0)  AS spent,
                COALESCE(earned, 0) AS earned
         FROM generate_series(
           (CURRENT_DATE - INTERVAL '13 days')::date,
           CURRENT_DATE::date,
           '1 day'::interval
         ) AS day
         LEFT JOIN LATERAL (
           SELECT COALESCE(SUM(amount), 0) AS spent
           FROM transactions t
           WHERE t.user_id = $1 AND t.type = 'case_open'
             AND t.created_at::date = day::date
         ) tx ON true
         LEFT JOIN LATERAL (
           SELECT COALESCE(SUM(COALESCE(s.site_price, s.market_price)), 0) AS earned
           FROM openings o JOIN skins s ON o.skin_id = s.id
           WHERE o.user_id = $1 AND o.created_at::date = day::date
         ) op ON true
         ORDER BY day`, [id]
      ),
      pool.query(
        `SELECT s.name, s.weapon, s.skin_name, s.rarity, s.rarity_color, s.image_url,
                COALESCE(s.site_price, s.market_price) AS site_price
         FROM openings o JOIN skins s ON o.skin_id = s.id
         WHERE o.user_id = $1
         ORDER BY COALESCE(s.site_price, s.market_price) DESC LIMIT 1`, [id]
      ),
    ]);

    const total_spent  = parseInt(spentRes.rows[0].total_spent);
    const total_earned = parseInt(earnedRes.rows[0].total_earned);
    const roi = total_spent > 0
      ? ((total_earned - total_spent) / total_spent * 100).toFixed(1)
      : '0.0';

    const s = statsRes.rows[0];
    const totalOpenings  = parseInt(s.total_openings);
    const totalSold      = parseInt(s.total_sold);
    const inventoryCount = parseInt(s.in_inventory);
    const hasCovert        = parseInt(rarityRes.rows[0].has_covert) === 1;
    const hasExtraordinary = parseInt(rarityRes.rows[0].has_extraordinary) === 1;

    const achievementDefs = [
      { id: 'first_open',  name: 'Primeiro Drop',   desc: 'Abriu a primeira caixa',          icon: '📦', cond: totalOpenings >= 1 },
      { id: 'veteran',     name: 'Veterano',         desc: '100 aberturas realizadas',        icon: '🎖️',  cond: totalOpenings >= 100 },
      { id: 'high_roller', name: 'High Roller',      desc: '500 aberturas realizadas',        icon: '🎰', cond: totalOpenings >= 500 },
      { id: 'trader',      name: 'Trader',           desc: 'Vendeu 50 skins',                 icon: '💸', cond: totalSold >= 50 },
      { id: 'rich',        name: 'Caixa Forte',      desc: 'Acumulou R$1000+ em drops',       icon: '💰', cond: total_earned >= 100000 },
      { id: 'lucky_star',  name: 'Estrela da Sorte', desc: 'Tirou um drop Covert ou melhor',  icon: '⭐', cond: hasCovert },
      { id: 'jackpot',     name: 'Jackpot',          desc: 'Tirou uma faca ou luva',          icon: '🔪', cond: hasExtraordinary },
      { id: 'collector',   name: 'Colecionador',     desc: '20+ skins no inventário',         icon: '🗂️',  cond: inventoryCount >= 20 },
      { id: 'level_5',     name: 'Subindo de Nível', desc: 'Atingiu o nível 5',               icon: '🥈', cond: lvl >= 5 },
      { id: 'level_10',    name: 'Elite',            desc: 'Atingiu o nível 10',              icon: '🥇', cond: lvl >= 10 },
    ];

    res.json({
      user,
      xp_progress: {
        xp: user.xp, level: lvl,
        xp_this_level, xp_for_next,
        percent: Math.min(100, xp_for_next > 0 ? Math.round((xp_this_level / xp_for_next) * 100) : 100),
      },
      stats: { total_openings: totalOpenings, total_sold: totalSold, in_inventory: inventoryCount, total_spent, total_earned, roi },
      best_drop:       bestDropRes.rows[0] || null,
      achievements:    achievementDefs.map(({ cond, ...a }) => ({ ...a, unlocked: cond })),
      showcase:        showcaseRes.rows,
      roi_chart:       roiRes.rows,
      recent_openings: recentRes.rows,
    });
  } catch (err) {
    console.error('Erro ao buscar perfil:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
