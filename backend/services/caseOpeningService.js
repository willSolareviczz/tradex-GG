/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const crypto = require('crypto');
const pool = require('../config/db');
const { awardXP } = require('./xpService');
const sseService = require('./sseService');

function fairRoll(serverSeed, clientSeed, nonce, totalWeight) {
  const hmac = crypto.createHmac('sha256', serverSeed);
  hmac.update(`${clientSeed}:${nonce}`);
  const hex   = hmac.digest('hex').slice(0, 8);
  const value = parseInt(hex, 16);
  return value % totalWeight;
}

async function openCase(userId, caseId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Lock user row and get balance + username + seed for SSE broadcast
    const userResult = await client.query(
      'SELECT balance, username, client_seed, opening_nonce FROM users WHERE id = $1 FOR UPDATE',
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
    const username    = userResult.rows[0].username;
    const clientSeed  = userResult.rows[0].client_seed || 'tradexGG';
    const casePrice   = caseResult.rows[0].price;

    if (userBalance < casePrice) {
      throw { status: 400, message: 'Saldo insuficiente' };
    }

    // Deduct balance and increment nonce atomically
    await client.query(
      'UPDATE users SET balance = balance - $1, opening_nonce = opening_nonce + 1 WHERE id = $2',
      [casePrice, userId]
    );
    const nonce = userResult.rows[0].opening_nonce + 1;

    // Get all skins for this case with weights
    // site_price: preco real usado no site (atualizado via API, fallback = market_price)
    const skinsResult = await client.query(
      `SELECT cs.weight, s.id as skin_id, s.name, s.weapon, s.skin_name, s.wear,
              s.rarity, s.rarity_color, s.image_url,
              s.market_price,
              COALESCE(s.site_price, s.market_price) AS site_price
       FROM case_skins cs
       JOIN skins s ON cs.skin_id = s.id
       WHERE cs.case_id = $1`,
      [caseId]
    );

    const skins = skinsResult.rows;

    if (skins.length === 0) {
      throw { status: 500, message: 'Caixa sem itens configurados' };
    }

    // Provably fair selection
    const serverSeed     = crypto.randomBytes(32).toString('hex');
    const serverSeedHash = crypto.createHash('sha256').update(serverSeed).digest('hex');

    const totalWeight = skins.reduce((sum, s) => sum + s.weight, 0);
    const roll = fairRoll(serverSeed, clientSeed, nonce, totalWeight);

    let accumulated = 0;
    let wonSkin = null;

    for (const skin of skins) {
      accumulated += skin.weight;
      if (roll < accumulated) {
        wonSkin = skin;
        break;
      }
    }

    // Record the opening with fair seeds
    const openingRes = await client.query(
      `INSERT INTO openings (user_id, case_id, skin_id, server_seed, server_seed_hash, client_seed, nonce)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
      [userId, caseId, wonSkin.skin_id, serverSeed, serverSeedHash, clientSeed, nonce]
    );

    // Record transaction
    await client.query(
      `INSERT INTO transactions (user_id, type, amount, description)
       VALUES ($1, 'case_open', $2, $3)`,
      [userId, casePrice, `Abertura: ${caseResult.rows[0].name}`]
    );

    // Conceder +10 XP pela abertura
    const xpResult = await awardXP(userId, 10, client);

    await client.query('COMMIT');

    // Broadcast drop to all SSE clients (non-blocking, post-commit)
    setImmediate(() => {
      sseService.broadcast('new-drop', {
        username,
        weapon:      wonSkin.weapon,
        skin_name:   wonSkin.skin_name,
        image_url:   wonSkin.image_url,
        rarity_color: wonSkin.rarity_color,
        price:       wonSkin.site_price,
      });
    });

    // Generate animation strip (cosmetic only)
    const animationItems = generateAnimationStrip(skins, wonSkin);

    return {
      won_skin: {
        id: wonSkin.skin_id,
        opening_id: openingRes.rows[0].id,
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
      animation_items: animationItems,
      new_balance: userBalance - casePrice,
      level_up: xpResult?.level_up || null,
      fair: { server_seed_hash: serverSeedHash, client_seed: clientSeed, nonce, opening_id: openingRes.rows[0].id },
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

async function openCaseBatch(userId, caseId, quantity) {
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10) {
    throw { status: 400, message: 'Quantidade inválida. Use entre 1 e 10.' };
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const userResult = await client.query(
      'SELECT balance, username, client_seed, opening_nonce FROM users WHERE id = $1 FOR UPDATE', [userId]
    );
    if (userResult.rows.length === 0) throw { status: 404, message: 'Usuário não encontrado' };

    const caseResult = await client.query(
      'SELECT id, name, price FROM cases WHERE id = $1 AND is_active = true', [caseId]
    );
    if (caseResult.rows.length === 0) throw { status: 404, message: 'Caixa não encontrada' };

    const userBalance = userResult.rows[0].balance;
    const username    = userResult.rows[0].username;
    const clientSeedB = userResult.rows[0].client_seed || 'tradexGG';
    const baseNonce   = userResult.rows[0].opening_nonce;
    const casePrice   = caseResult.rows[0].price;
    const totalCost   = casePrice * quantity;

    if (userBalance < totalCost) throw { status: 400, message: 'Saldo insuficiente' };

    await client.query(
      'UPDATE users SET balance = balance - $1, opening_nonce = opening_nonce + $2 WHERE id = $3',
      [totalCost, quantity, userId]
    );

    const skinsResult = await client.query(
      `SELECT cs.weight, s.id as skin_id, s.name, s.weapon, s.skin_name, s.wear,
              s.rarity, s.rarity_color, s.image_url, s.market_price,
              COALESCE(s.site_price, s.market_price) AS site_price
       FROM case_skins cs
       JOIN skins s ON cs.skin_id = s.id
       WHERE cs.case_id = $1`, [caseId]
    );
    const skins = skinsResult.rows;
    if (skins.length === 0) throw { status: 500, message: 'Caixa sem itens configurados' };

    const totalWeight = skins.reduce((sum, s) => sum + s.weight, 0);
    const results = [];

    for (let i = 0; i < quantity; i++) {
      const serverSeedB     = crypto.randomBytes(32).toString('hex');
      const serverSeedHashB = crypto.createHash('sha256').update(serverSeedB).digest('hex');
      const nonceB          = baseNonce + i + 1;
      const roll = fairRoll(serverSeedB, clientSeedB, nonceB, totalWeight);

      let accumulated = 0;
      let wonSkin = null;
      for (const skin of skins) {
        accumulated += skin.weight;
        if (roll < accumulated) { wonSkin = skin; break; }
      }

      const openingRes = await client.query(
        `INSERT INTO openings (user_id, case_id, skin_id, server_seed, server_seed_hash, client_seed, nonce)
         VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
        [userId, caseId, wonSkin.skin_id, serverSeedB, serverSeedHashB, clientSeedB, nonceB]
      );


      await client.query(
        `INSERT INTO transactions (user_id, type, amount, description) VALUES ($1, 'case_open', $2, $3)`,
        [userId, casePrice, `Abertura: ${caseResult.rows[0].name}`]
      );

      const xpResult = await awardXP(userId, 10, client);

      results.push({
        opening_id: openingRes.rows[0].id,
        won_skin: {
          id: wonSkin.skin_id,
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
        animation_items: generateAnimationStrip(skins, wonSkin),
        level_up: xpResult?.level_up || null,
        fair: { server_seed_hash: serverSeedHashB, client_seed: clientSeedB, nonce: nonceB, opening_id: openingRes.rows[0].id },
        _broadcastSkin: { username, wonSkin },
      });
    }

    await client.query('COMMIT');

    // Broadcast all drops post-commit (non-blocking)
    setImmediate(() => {
      for (const r of results) {
        const { username: uname, wonSkin: ws } = r._broadcastSkin;
        sseService.broadcast('new-drop', {
          username: uname,
          weapon:      ws.weapon,
          skin_name:   ws.skin_name,
          image_url:   ws.image_url,
          rarity_color: ws.rarity_color,
          price:       ws.site_price,
        });
        delete r._broadcastSkin;
      }
    });

    return { results, new_balance: userBalance - totalCost };
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { openCase, openCaseBatch };
