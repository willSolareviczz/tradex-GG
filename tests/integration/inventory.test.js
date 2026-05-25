/**
 * Testes de Integração — Inventário e Venda de Skins
 *
 * CT-06 | Negativo | Tentativa de vender skin de outro usuário → 403
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock('../../backend/config/db', () => ({
  query:   jest.fn(),
  connect: jest.fn(),
}));

jest.mock('../../backend/services/priceService', () => ({
  startPriceUpdateLoop: jest.fn(),
}));

process.env.JWT_SECRET     = 'test-secret';
process.env.JWT_EXPIRES_IN = '7d';

// ── Imports ──────────────────────────────────────────────────────────────────

const request = require('supertest');
const jwt     = require('jsonwebtoken');
const app     = require('../helpers/app');
const pool    = require('../../backend/config/db');

// ── Helpers ──────────────────────────────────────────────────────────────────

function makeToken(userId) {
  return jwt.sign({ id: userId }, 'test-secret');
}

/**
 * Configura o mock do pool para simular a transação do sellSkin.
 * @param {number} ownerUserId  - ID do dono real do item no banco
 * @param {number} itemId       - ID do opening
 */
function mockSellTransaction(ownerUserId, itemId) {
  const mockClient = {
    query: jest.fn()
      .mockResolvedValueOnce(undefined)                         // BEGIN
      .mockResolvedValueOnce({ rows: [{ id: itemId, user_id: ownerUserId }] }) // SELECT ownership
      .mockResolvedValueOnce(undefined),                        // ROLLBACK (erro)
    release: jest.fn(),
  };
  pool.connect.mockResolvedValue(mockClient);
}

// ─────────────────────────────────────────────────────────────────────────────
// CT-06 — Tentativa de vender skin de outro usuário (Integração / Negativo)
//
// Dado: item ID=42 pertence ao usuário 1
//       atacante (usuário 99) tenta vender o item via POST /api/inventory/42/sell
// Esperado: 403 "Acesso negado", item permanece no banco
// ─────────────────────────────────────────────────────────────────────────────

describe('CT-06 | Tentativa de vender skin de outro usuário', () => {
  const ITEM_ID   = 42;
  const OWNER_ID  = 1;
  const ATTACKER_ID = 99;

  beforeEach(() => jest.clearAllMocks());

  test('retorna 403 quando o item pertence a outro usuário', async () => {
    // Auth middleware: atacante está autenticado e não banido
    pool.query.mockResolvedValue({ rows: [{ is_banned: false }] });

    // Transação: item existe mas pertence ao OWNER, não ao ATTACKER
    mockSellTransaction(OWNER_ID, ITEM_ID);

    const res = await request(app)
      .post(`/api/inventory/${ITEM_ID}/sell`)
      .set('Authorization', `Bearer ${makeToken(ATTACKER_ID)}`);

    expect(res.status).toBe(403);
    expect(res.body.error).toBe('Acesso negado');
  });

  test('item não é removido do banco após tentativa negada', async () => {
    pool.query.mockResolvedValue({ rows: [{ is_banned: false }] });

    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ id: ITEM_ID, user_id: OWNER_ID }] })
        .mockResolvedValueOnce(undefined),
      release: jest.fn(),
    };
    pool.connect.mockResolvedValue(mockClient);

    await request(app)
      .post(`/api/inventory/${ITEM_ID}/sell`)
      .set('Authorization', `Bearer ${makeToken(ATTACKER_ID)}`);

    // Nenhuma query UPDATE deve ter sido chamada no client
    const updateCalled = mockClient.query.mock.calls.some(
      ([sql]) => typeof sql === 'string' && sql.toUpperCase().includes('UPDATE')
    );
    expect(updateCalled).toBe(false);
  });

  test('usuário legítimo consegue vender seu próprio item (200)', async () => {
    pool.query.mockResolvedValue({ rows: [{ is_banned: false }] });

    const mockClient = {
      query: jest.fn()
        .mockResolvedValueOnce(undefined)                                      // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: ITEM_ID, user_id: OWNER_ID }] }) // ownership OK
        .mockResolvedValueOnce({ rows: [{ id: ITEM_ID, sold: false, sell_price: 3500 }] }) // lock
        .mockResolvedValueOnce(undefined)                                      // UPDATE sold
        .mockResolvedValueOnce(undefined)                                      // UPDATE balance
        .mockResolvedValueOnce(undefined)                                      // INSERT transaction
        .mockResolvedValueOnce({ rows: [{ balance: 8500 }] })                  // SELECT balance
        .mockResolvedValueOnce(undefined),                                     // COMMIT
      release: jest.fn(),
    };
    pool.connect.mockResolvedValue(mockClient);

    const res = await request(app)
      .post(`/api/inventory/${ITEM_ID}/sell`)
      .set('Authorization', `Bearer ${makeToken(OWNER_ID)}`);

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('message', 'Item vendido com sucesso');
    expect(res.body).toHaveProperty('new_balance');
  });
});
