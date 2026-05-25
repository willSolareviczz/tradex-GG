/**
 * App mínimo para testes — não inicia servidor nem serviços externos.
 * O pool do banco é mockado via jest.mock() nos arquivos de teste.
 */
const express = require('express');

const authRoutes      = require('../../backend/routes/auth');
const casesRoutes     = require('../../backend/routes/cases');
const inventoryRoutes = require('../../backend/routes/inventory');

const app = express();
app.use(express.json());

app.use('/api/auth',      authRoutes);
app.use('/api/cases',     casesRoutes);
app.use('/api/inventory', inventoryRoutes);

module.exports = app;
