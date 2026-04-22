/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const pool = require('../config/db');
const steamBot = require('../services/steamBot');
const { getSkinPrice } = require('../services/steamPriceService');

// Get user's Steam inventory
exports.getUserInventory = async (req, res) => {
  try {
    const { steamId } = req.params;

    if (!steamBot.isBotReady()) {
      return res.status(503).json({ error: 'Bot Steam está offline' });
    }

    const inventory = await steamBot.getUserInventory(steamId);
    const tradableItems = inventory.filter(item => item.tradable);

    res.json(tradableItems);
  } catch (err) {
    console.error('Erro ao buscar inventário Steam:', err);
    res.status(500).json({ error: 'Erro ao buscar inventário' });
  }
};

// Get bot's inventory (items available for withdrawal)
exports.getBotInventory = async (req, res) => {
  try {
    if (!steamBot.isBotReady()) {
      return res.status(503).json({ error: 'Bot Steam está offline' });
    }

    const inventory = await steamBot.getBotInventory();
    const tradableItems = inventory.filter(item => item.tradable);

    // Add prices
    const itemsWithPrices = await Promise.all(
      tradableItems.map(async (item) => {
        const price = await getSkinPrice(item.name);
        return { ...item, price };
      })
    );

    res.json(itemsWithPrices);
  } catch (err) {
    console.error('Erro ao buscar inventário do bot:', err);
    res.status(500).json({ error: 'Erro ao buscar inventário' });
  }
};

// Deposit skins (user sends skins to bot, gets balance)
exports.depositSkins = async (req, res) => {
  const client = await pool.connect();

  try {
    const { assetIds, tradeUrl } = req.body;

    if (!assetIds || !Array.isArray(assetIds) || assetIds.length === 0) {
      return res.status(400).json({ error: 'Selecione ao menos um item' });
    }

    if (!tradeUrl) {
      return res.status(400).json({ error: 'Trade URL é obrigatória' });
    }

    if (!steamBot.isBotReady()) {
      return res.status(503).json({ error: 'Bot Steam está offline' });
    }

    // Get user's steam ID
    const userResult = await pool.query(
      'SELECT steam_id FROM users WHERE id = $1',
      [req.userId]
    );

    if (!userResult.rows[0]?.steam_id) {
      return res.status(400).json({ error: 'Conecte sua conta Steam primeiro' });
    }

    // Create trade offer
    const offer = await steamBot.createDepositOffer(
      userResult.rows[0].steam_id,
      assetIds,
      tradeUrl
    );

    // Save trade record
    await pool.query(
      `INSERT INTO steam_trades (user_id, offer_id, type, asset_ids, status)
       VALUES ($1, $2, 'deposit', $3, 'pending')`,
      [req.userId, offer.offerId, JSON.stringify(assetIds)]
    );

    res.json({
      message: 'Oferta de troca enviada! Aceite no Steam.',
      offer_id: offer.offerId,
    });
  } catch (err) {
    console.error('Erro ao criar depósito:', err);
    res.status(500).json({ error: 'Erro ao enviar oferta de troca' });
  } finally {
    client.release();
  }
};

// Withdraw skin (user spends balance, bot sends skin)
exports.withdrawSkin = async (req, res) => {
  const client = await pool.connect();

  try {
    const { assetId, tradeUrl } = req.body;

    if (!assetId || !tradeUrl) {
      return res.status(400).json({ error: 'AssetId e Trade URL são obrigatórios' });
    }

    if (!steamBot.isBotReady()) {
      return res.status(503).json({ error: 'Bot Steam está offline' });
    }

    // Get item info and price
    const botInventory = await steamBot.getBotInventory();
    const item = botInventory.find(i => i.assetid === assetId);

    if (!item) {
      return res.status(404).json({ error: 'Item não encontrado no inventário' });
    }

    const price = await getSkinPrice(item.name);
    if (!price) {
      return res.status(500).json({ error: 'Não foi possível obter o preço do item' });
    }

    await client.query('BEGIN');

    // Check and deduct balance
    const userResult = await client.query(
      'SELECT balance FROM users WHERE id = $1 FOR UPDATE',
      [req.userId]
    );

    if (userResult.rows[0].balance < price) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Saldo insuficiente' });
    }

    await client.query(
      'UPDATE users SET balance = balance - $1 WHERE id = $2',
      [price, req.userId]
    );

    // Create trade offer
    const offer = await steamBot.createWithdrawOffer(
      userResult.rows[0].steam_id,
      [assetId],
      tradeUrl
    );

    // Save trade record
    await client.query(
      `INSERT INTO steam_trades (user_id, offer_id, type, asset_ids, amount, status)
       VALUES ($1, $2, 'withdraw', $3, $4, 'pending')`,
      [req.userId, offer.offerId, JSON.stringify([assetId]), price]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Skin enviada! Aceite a troca no Steam.',
      offer_id: offer.offerId,
      price,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar retirada:', err);
    res.status(500).json({ error: 'Erro ao enviar oferta de troca' });
  } finally {
    client.release();
  }
};

// Save user's trade URL
exports.saveTradeUrl = async (req, res) => {
  try {
    const { tradeUrl } = req.body;

    if (!tradeUrl || !tradeUrl.includes('steamcommunity.com/tradeoffer')) {
      return res.status(400).json({ error: 'Trade URL inválida' });
    }

    await pool.query(
      'UPDATE users SET trade_url = $1 WHERE id = $2',
      [tradeUrl, req.userId]
    );

    res.json({ message: 'Trade URL salva com sucesso' });
  } catch (err) {
    console.error('Erro ao salvar trade URL:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Check trade status
exports.getTradeStatus = async (req, res) => {
  try {
    const { offerId } = req.params;

    const result = await pool.query(
      'SELECT * FROM steam_trades WHERE offer_id = $1 AND user_id = $2',
      [offerId, req.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trade não encontrado' });
    }

    // Get real-time status from Steam
    if (steamBot.isBotReady()) {
      try {
        const steamStatus = await steamBot.getOfferStatus(offerId);
        return res.json({ ...result.rows[0], steam_status: steamStatus.stateName });
      } catch {
        // Fall back to DB status
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Erro ao verificar trade:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// Get skin price
exports.getSkinPrice = async (req, res) => {
  try {
    const { name } = req.query;
    if (!name) {
      return res.status(400).json({ error: 'Nome do item é obrigatório' });
    }

    const price = await getSkinPrice(name);
    res.json({ name, price });
  } catch (err) {
    console.error('Erro ao buscar preço:', err);
    res.status(500).json({ error: 'Erro ao buscar preço' });
  }
};

// Bot status
exports.getBotStatus = async (req, res) => {
  res.json({
    online: steamBot.isBotReady(),
    steam_id: steamBot.getBotSteamId(),
  });
};
