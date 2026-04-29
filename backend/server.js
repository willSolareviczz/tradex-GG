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
const { startPriceUpdateLoop } = require('./services/priceService');

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

// SPA fallback - serve index.html for non-API routes
app.get('/{*splat}', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
  }
});

app.listen(PORT, () => {
  console.log(`tradexGG rodando na porta ${PORT}`);
  startPriceUpdateLoop();
});
