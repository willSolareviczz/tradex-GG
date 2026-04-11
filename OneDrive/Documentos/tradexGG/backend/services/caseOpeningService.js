const crypto = require('crypto');
const pool = require('../config/db');

async function openCase(userId, caseId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Lock user row and get balance
    const userResult = await client.query(
      'SELECT balance FROM users WHERE id = $1 FOR UPDATE',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw { status: 404, message: 'Usuário não encontrado' };
    }

    // Get case info
    const caseResult = await client.query(
      'SELECT id, name, price FROM cases WHERE id = $1 AND is_active = true',
      [caseId]
    );

    if (caseResult.rows.length === 0) {
      throw { status: 404, message: 'Caixa não encontrada' };
    }

    const userBalance = userResult.rows[0].balance;
    const casePrice = caseResult.rows[0].price;

    if (userBalance < casePrice) {
      throw { status: 400, message: 'Saldo insuficiente' };
    }

    // Deduct balance
    await client.query(
      'UPDATE users SET balance = balance - $1 WHERE id = $2',
      [casePrice, userId]
    );

    // Get all skins for this case with weights
    const skinsResult = await client.query(
      `SELECT cs.weight, s.id as skin_id, s.name, s.weapon, s.skin_name,
              s.rarity, s.rarity_color, s.image_url, s.market_price
       FROM case_skins cs
       JOIN skins s ON cs.skin_id = s.id
       WHERE cs.case_id = $1`,
      [caseId]
    );

    const skins = skinsResult.rows;

    if (skins.length === 0) {
      throw { status: 500, message: 'Caixa sem itens configurados' };
    }

    // Weighted random selection
    const totalWeight = skins.reduce((sum, s) => sum + s.weight, 0);
    const random = crypto.randomInt(0, totalWeight);

    let accumulated = 0;
    let wonSkin = null;

    for (const skin of skins) {
      accumulated += skin.weight;
      if (random < accumulated) {
        wonSkin = skin;
        break;
      }
    }

    // Record the opening
    await client.query(
      'INSERT INTO openings (user_id, case_id, skin_id) VALUES ($1, $2, $3)',
      [userId, caseId, wonSkin.skin_id]
    );

    await client.query('COMMIT');

    // Generate animation strip (cosmetic only)
    const animationItems = generateAnimationStrip(skins, wonSkin);

    return {
      won_skin: {
        id: wonSkin.skin_id,
        name: wonSkin.name,
        weapon: wonSkin.weapon,
        skin_name: wonSkin.skin_name,
        rarity: wonSkin.rarity,
        rarity_color: wonSkin.rarity_color,
        image_url: wonSkin.image_url,
        market_price: wonSkin.market_price,
      },
      animation_items: animationItems,
      new_balance: userBalance - casePrice,
    };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function generateAnimationStrip(skins, wonSkin) {
  const strip = [];
  const totalItems = 50;
  const winnerIndex = 37;

  // Build weighted pool for random picks
  const weightedPool = [];
  for (const skin of skins) {
    for (let i = 0; i < Math.ceil(skin.weight / 100); i++) {
      weightedPool.push(skin);
    }
  }

  for (let i = 0; i < totalItems; i++) {
    if (i === winnerIndex) {
      strip.push({
        name: wonSkin.name,
        rarity_color: wonSkin.rarity_color,
        image_url: wonSkin.image_url,
      });
    } else {
      const randomSkin = weightedPool[crypto.randomInt(0, weightedPool.length)];
      strip.push({
        name: randomSkin.name,
        rarity_color: randomSkin.rarity_color,
        image_url: randomSkin.image_url,
      });
    }
  }

  return strip;
}

module.exports = { openCase };
