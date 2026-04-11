require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./routes/auth');
const casesRoutes = require('./routes/cases');
const inventoryRoutes = require('./routes/inventory');
const paymentsRoutes = require('./routes/payments');
const usersRoutes = require('./routes/users');
const rankingRoutes = require('./routes/ranking');
const steamRoutes = require('./routes/steam');
const { loginBot, onTradeAccepted } = require('./services/steamBot');
const pool = require('./config/db');
const { getSkinPrice } = require('./services/steamPriceService');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/steam', steamRoutes);

// SPA fallback - serve index.html for non-API routes
app.get('/{*splat}', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
  }
});

// Start Steam Bot
loginBot();

// Handle accepted deposit trades - credit user balance
onTradeAccepted(async (offer) => {
  try {
    const tradeResult = await pool.query(
      "SELECT * FROM steam_trades WHERE offer_id = $1 AND type = 'deposit' AND status = 'pending'",
      [String(offer.id)]
    );

    if (tradeResult.rows.length === 0) return;

    const trade = tradeResult.rows[0];
    const items = offer.itemsToReceive || [];
    let totalValue = 0;

    for (const item of items) {
      const price = await getSkinPrice(item.market_hash_name || item.name);
      if (price) totalValue += price;
    }

    if (totalValue > 0) {
      const client = await pool.connect();
      try {
        await client.query('BEGIN');
        await client.query(
          'UPDATE users SET balance = balance + $1 WHERE id = $2',
          [totalValue, trade.user_id]
        );
        await client.query(
          "UPDATE steam_trades SET status = 'completed', amount = $1, updated_at = NOW() WHERE id = $2",
          [totalValue, trade.id]
        );
        await client.query('COMMIT');
        console.log(`[Trade] Depósito de ${totalValue} centavos creditado ao user ${trade.user_id}`);
      } catch (err) {
        await client.query('ROLLBACK');
        throw err;
      } finally {
        client.release();
      }
    }
  } catch (err) {
    console.error('[Trade] Erro ao processar depósito:', err);
  }
});

app.listen(PORT, () => {
  console.log(`tradexGG rodando na porta ${PORT}`);
});
