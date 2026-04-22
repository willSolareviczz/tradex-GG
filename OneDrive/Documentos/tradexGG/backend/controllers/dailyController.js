/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const crypto = require('crypto');
const pool = require('../config/db');
const { awardXP } = require('../services/xpService');

exports.getStatus = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT daily_claimed_at FROM users WHERE id = $1',
      [req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado' });
    }

    const lastClaim = result.rows[0].daily_claimed_at;

    if (!lastClaim) {
      return res.json({ can_claim: true, next_claim_at: null, time_left_seconds: 0 });
    }

    const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
    const now = new Date();
    const timeLeftMs = nextClaim - now;

    if (timeLeftMs <= 0) {
      return res.json({ can_claim: true, next_claim_at: nextClaim.toISOString(), time_left_seconds: 0 });
    }

    return res.json({
      can_claim: false,
      next_claim_at: nextClaim.toISOString(),
      time_left_seconds: Math.ceil(timeLeftMs / 1000),
    });
  } catch (err) {
    console.error('Erro ao checar status daily:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.claim = async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Lock the user row
    const userResult = await client.query(
      'SELECT id, daily_claimed_at FROM users WHERE id = $1 FOR UPDATE',
      [req.userId]
    );

    if (userResult.rows.length === 0) {
      throw { status: 404, message: 'Usuário não encontrado' };
    }

    const lastClaim = userResult.rows[0].daily_claimed_at;

    if (lastClaim) {
      const nextClaim = new Date(lastClaim.getTime() + 24 * 60 * 60 * 1000);
      if (new Date() < nextClaim) {
        const timeLeftMs = nextClaim - new Date();
        throw {
          status: 429,
          message: `Você já resgatou hoje. Próximo resgate em ${Math.ceil(timeLeftMs / 1000)} segundos.`,
        };
      }
    }

    // Pool de skins baratas: COALESCE(site_price, market_price) < 3000
    // Selecao weighted: weight = 1.0 / price (skins mais baratas tem mais chance)
    const skinsResult = await client.query(
      `SELECT id, name, weapon, skin_name, wear, rarity, rarity_color, image_url,
              market_price, COALESCE(site_price, market_price) AS site_price,
              COALESCE(site_price, market_price) AS price_val
       FROM skins
       WHERE COALESCE(site_price, market_price) < 3000
         AND COALESCE(site_price, market_price) > 0`
    );

    if (skinsResult.rows.length === 0) {
      throw { status: 500, message: 'Nenhuma skin disponível no pool diário' };
    }

    const skins = skinsResult.rows;

    // Weighted random por 1.0 / price (usando integers com precisao ampliada)
    // Multiplica por 10000 para trabalhar com integers
    const weights = skins.map(s => Math.round(10000 / s.price_val));
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);

    const rand = crypto.randomInt(0, totalWeight);
    let accumulated = 0;
    let wonSkin = null;

    for (let i = 0; i < skins.length; i++) {
      accumulated += weights[i];
      if (rand < accumulated) {
        wonSkin = skins[i];
        break;
      }
    }

    if (!wonSkin) wonSkin = skins[skins.length - 1];

    // Criar opening (case_id = NULL para daily)
    const openingResult = await client.query(
      `INSERT INTO openings (user_id, case_id, skin_id)
       VALUES ($1, NULL, $2)
       RETURNING id`,
      [req.userId, wonSkin.id]
    );

    // Atualizar daily_claimed_at
    await client.query(
      'UPDATE users SET daily_claimed_at = NOW() WHERE id = $1',
      [req.userId]
    );

    // Conceder +20 XP
    await awardXP(req.userId, 20, client);

    await client.query('COMMIT');

    return res.json({
      message: 'Case diário resgatado!',
      opening_id: openingResult.rows[0].id,
      won_skin: {
        id: wonSkin.id,
        name: wonSkin.name,
        weapon: wonSkin.weapon,
        skin_name: wonSkin.skin_name,
        wear: wonSkin.wear,
        rarity: wonSkin.rarity,
        rarity_color: wonSkin.rarity_color,
        image_url: wonSkin.image_url,
        market_price: wonSkin.market_price,
        site_price: wonSkin.site_price,
      },
    });
  } catch (err) {
    await client.query('ROLLBACK');
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('Erro ao resgatar daily:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
};
