/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
require('dotenv').config({ path: __dirname + '/.env' });
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const authRoutes = require('./routes/auth');
const casesRoutes = require('./routes/cases');
const inventoryRoutes = require('./routes/inventory');
const usersRoutes = require('./routes/users');
const rankingRoutes = require('./routes/ranking');
const historyRoutes = require('./routes/history');
const walletRoutes = require('./routes/wallet');
const adminRoutes = require('./routes/admin');
const imageProxyRoutes = require('./routes/imageProxy');
const upgradeRoutes    = require('./routes/upgrades');
const eventsRoutes     = require('./routes/events');
const battlesRoutes    = require('./routes/battles');
const coinflipsRoutes  = require('./routes/coinflips');
const chatRoutes       = require('./routes/chat');
const promoRoutes      = require('./routes/promo');
const referralRoutes       = require('./routes/referral');
const notificationRoutes   = require('./routes/notifications');
const seedRoutes           = require('./routes/seed');
const { startPriceUpdateLoop } = require('./services/priceService');
const pool = require('./config/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc:  ["'self'"],
      scriptSrc:   ["'self'", "'unsafe-inline'"],
      styleSrc:    ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc:     ["'self'", "https://fonts.gstatic.com"],
      imgSrc:      ["'self'", "data:", "blob:",
                    "https://cdn.akamai.steamstatic.com",
                    "https://steamcommunity.com",
                    "https://community.cloudflare.steamstatic.com",
                    "https://cdn.csgoskins.gg"],
      connectSrc:  ["'self'"],
      objectSrc:   ["'none'"],
      baseUri:     ["'self'"],
      formAction:  ["'self'"],
    },
  },
}));

// Rate limiting — auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Muitas tentativas. Aguarde 15 minutos.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting — wallet/deposit
const walletLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: { error: 'Limite de depósitos atingido. Aguarde 1 hora.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiting — image proxy (CPU-intensive)
const imageLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Muitas requisições de imagem.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes
app.use('/api/auth',      authLimiter, authRoutes);
app.use('/api/cases',     casesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/users',     usersRoutes);
app.use('/api/ranking',   rankingRoutes);
app.use('/api/history',   historyRoutes);
app.use('/api/wallet',    walletLimiter, walletRoutes);
app.use('/api/admin',     adminRoutes);
app.use('/api/image',     imageLimiter, imageProxyRoutes);
app.use('/api/upgrades',  upgradeRoutes);
app.use('/api/events',    eventsRoutes);
app.use('/api/battles',   battlesRoutes);
app.use('/api/coinflips', coinflipsRoutes);
app.use('/api/chat',     chatRoutes);
app.use('/api/promo',    promoRoutes);
app.use('/api/referral',      referralRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/seed',          seedRoutes);

// Stats públicas para a homepage
app.get('/api/stats/public', async (req, res) => {
  try {
    const [users, cases, openings] = await Promise.all([
      pool.query('SELECT COUNT(*)::int AS count FROM users'),
      pool.query('SELECT COUNT(*)::int AS count FROM cases WHERE is_active = true AND is_deleted = false'),
      pool.query('SELECT COUNT(*)::int AS count FROM openings'),
    ]);
    res.json({
      total_users:    users.rows[0].count,
      total_cases:    cases.rows[0].count,
      total_openings: openings.rows[0].count,
    });
  } catch {
    res.json({ total_users: 0, total_cases: 0, total_openings: 0 });
  }
});

// SPA fallback
app.get('/{*splat}', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint não encontrado' });
  }
  // HTML requests that didn't match any static file → 404 page
  if (req.path.endsWith('.html')) {
    return res.status(404).sendFile(path.join(__dirname, '..', 'frontend', '404.html'));
  }
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Expira batalhas e coinflips waiting há mais de 24h — reembolsa o criador
async function expireStaleGames() {
  try {
    const battleRes = await pool.query(
      `UPDATE battles SET status = 'cancelled'
       WHERE status = 'waiting' AND created_at < NOW() - INTERVAL '24 hours'
       RETURNING id, creator_id, price`
    );
    for (const row of battleRes.rows) {
      await pool.query('UPDATE users SET balance = balance + $1 WHERE id = $2', [row.price, row.creator_id]);
      await pool.query(
        `INSERT INTO transactions (user_id, type, amount, description)
         VALUES ($1, 'deposit', $2, 'Batalha expirada — saldo devolvido')`,
        [row.creator_id, row.price]
      );
    }

    const flipRes = await pool.query(
      `UPDATE coinflips SET status = 'cancelled'
       WHERE status = 'waiting' AND created_at < NOW() - INTERVAL '24 hours'
       RETURNING id, creator_id, creator_opening_id`
    );
    for (const row of flipRes.rows) {
      await pool.query(
        'UPDATE openings SET sold = false WHERE id = $1', [row.creator_opening_id]
      );
    }

    if (battleRes.rowCount > 0 || flipRes.rowCount > 0) {
      console.log(`[expire] ${battleRes.rowCount} batalhas e ${flipRes.rowCount} coinflips expirados.`);
    }
  } catch (err) {
    console.error('[expire] Erro ao expirar games:', err.message);
  }
}

app.listen(PORT, () => {
  console.log(`tradexGG rodando na porta ${PORT}`);
  startPriceUpdateLoop();
  // Roda a cada hora
  setInterval(expireStaleGames, 60 * 60 * 1000);
  expireStaleGames();
});
