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

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/cases', casesRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/ranking', rankingRoutes);
app.use('/api/history', historyRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/image', imageProxyRoutes);

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
