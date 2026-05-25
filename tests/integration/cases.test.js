/**
 * Testes de Integração — Abertura de Caixas
 *
 * CT-01 | Positivo | Abertura bem-sucedida com saldo suficiente
 * CT-02 | Negativo | Tentativa de abertura com saldo insuficiente
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../backend/config/db', () => ({
  query:   jest.fn(),
  connect: jest.fn(),
}));

// Isola o serviço de abertura de caixa para testar apenas a camada HTTP
jest.mock('../../backend/services/caseOpeningService', () => ({
  openCase:      jest.fn(),
  openCaseBatch: jest.fn(),
}));

// Impede que o serviço de preços inicie loops reais
jest.mock('../../backend/services/priceService', () => ({
  startPriceUpdateLoop: jest.fn(),
}));

process.env.JWT_SECRET     = 'test-secret';
process.env.JWT_EXPIRES_IN = '7d';

// ── Imports ──────────────────────────────────────────────────────────────────

const request            = require('supertest');
const jwt                = require('jsonwebtoken');
const app                = require('../helpers/app');
const pool               = require('../../backend/config/db');
const caseOpeningService = require('../../backend/services/caseOpeningService');

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Gera JWT de teste sem precisar de banco */
function makeToken(userId) {
  return jwt.sign({ id: userId }, 'test-secret');
}

/** Mock padrão do middleware de autenticação (usuário ativo, não banido) */
function mockAuthPass() {
  pool.query.mockResolvedValue({ rows: [{ is_banned: false }] });
}

// ─────────────────────────────────────────────────────────────────────────────
// CT-01 — Abertura bem-sucedida com saldo suficiente (Integração / Positivo)
//
// Dado: usuário com saldo R$50,00 | caixa custa R$29,98
// Esperado: 200 com item sorteado e saldo debitado
// ─────────────────────────────────────────────────────────────────────────────

describe('CT-01 | Abertura bem-sucedida com saldo suficiente', () => {
  beforeEach(() => jest.clearAllMocks());

  test('retorna 200 com o item sorteado e novo saldo', async () => {
    const userId = 1;
    mockAuthPass();

    caseOpeningService.openCase.mockResolvedValue({
      skin: {
        name:         'AK-47 | Redline',
        weapon:       'AK-47',
        rarity:       'classified',
        image_url:    'https://example.com/ak47.png',
        market_price: 3500,
      },
      new_balance: 2002, // 5000 - 2998 centavos
    });

    const res = await request(app)
      .post('/api/cases/1/open')
      .set('Authorization', `Bearer ${makeToken(userId)}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('skin');
    expect(res.body).toHaveProperty('new_balance');
    expect(caseOpeningService.openCase).toHaveBeenCalledWith(userId, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CT-02 — Tentativa de abertura com saldo insuficiente (Integração / Negativo)
//
// Dado: usuário com saldo R$5,00 | caixa custa R$29,98
// Esperado: 400 "Saldo insuficiente", saldo e inventário intactos
// ─────────────────────────────────────────────────────────────────────────────

describe('CT-02 | Tentativa de abertura com saldo insuficiente', () => {
  beforeEach(() => jest.clearAllMocks());

  test('retorna 400 com mensagem "Saldo insuficiente"', async () => {
    const userId = 2;
    mockAuthPass();

    // Serviço lança erro de negócio (saldo < preço da caixa)
    caseOpeningService.openCase.mockRejectedValue({
      status:  400,
      message: 'Saldo insuficiente',
    });

    const res = await request(app)
      .post('/api/cases/1/open')
      .set('Authorization', `Bearer ${makeToken(userId)}`);

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Saldo insuficiente');
  });

  test('não retorna item ou token quando saldo é insuficiente', async () => {
    mockAuthPass();

    caseOpeningService.openCase.mockRejectedValue({
      status:  400,
      message: 'Saldo insuficiente',
    });

    const res = await request(app)
      .post('/api/cases/1/open')
      .set('Authorization', `Bearer ${makeToken(3)}`);

    expect(res.body).not.toHaveProperty('skin');
    expect(res.body).not.toHaveProperty('token');
  });

  test('retorna 401 sem token de autenticação', async () => {
    const res = await request(app)
      .post('/api/cases/1/open');

    expect(res.status).toBe(401);
  });
});
