/**
 * Testes Unitários — Autenticação de Usuário
 *
 * CT-03 | Positivo | Registro com dados válidos
 * CT-04 | Negativo | Login com credenciais inválidas
 */

// ── Mocks devem vir ANTES de qualquer require do módulo testado ──────────────

jest.mock('../../backend/config/db', () => ({
  query:   jest.fn(),
  connect: jest.fn(),
}));

jest.mock('../../backend/services/emailService', () => ({
  isConfigured:          jest.fn().mockReturnValue(false),
  sendEmailVerification: jest.fn().mockResolvedValue(undefined),
}));

process.env.JWT_SECRET    = 'test-secret';
process.env.JWT_EXPIRES_IN = '7d';

// ── Imports ──────────────────────────────────────────────────────────────────

const authController = require('../../backend/controllers/authController');
const pool           = require('../../backend/config/db');

// ── Helpers ──────────────────────────────────────────────────────────────────

/** Cria objetos req/res simulados */
function mockReqRes(body = {}) {
  const res = {
    status: jest.fn().mockReturnThis(),
    json:   jest.fn(),
  };
  return { req: { body }, res };
}

// ─────────────────────────────────────────────────────────────────────────────
// CT-03 — Registro com dados válidos (Unitário / Positivo)
// ─────────────────────────────────────────────────────────────────────────────

describe('CT-03 | Registro com dados válidos', () => {
  beforeEach(() => jest.clearAllMocks());

  test('retorna status 201 e gera token JWT', async () => {
    // Sem usuário duplicado no banco
    pool.query.mockResolvedValueOnce({ rows: [] });

    const createdUser = {
      id: 1,
      username: 'joaosilva',
      email: 'joao@email.com',
      balance: 0,
      email_verified: false,
    };

    // Simula transação: BEGIN → INSERT → COMMIT
    const mockClient = {
      query:   jest.fn()
        .mockResolvedValueOnce(undefined)             // BEGIN
        .mockResolvedValueOnce({ rows: [createdUser] }) // INSERT
        .mockResolvedValueOnce(undefined),            // COMMIT
      release: jest.fn(),
    };
    pool.connect.mockResolvedValue(mockClient);

    const { req, res } = mockReqRes({
      username: 'joaosilva',
      email:    'joao@email.com',
      password: 'senha123',
    });

    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        user:  expect.objectContaining({ email: 'joao@email.com' }),
        token: expect.any(String),
      })
    );
  });

  test('senha é armazenada com hash bcrypt (não em texto puro)', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    let senhaGravada = null;
    const mockClient = {
      query: jest.fn().mockImplementation(async (sql, params) => {
        if (sql.includes('INSERT INTO users')) {
          senhaGravada = params[2]; // 3º parâmetro = password_hash
          return { rows: [{ id: 1, username: 'joao', email: 'joao@email.com', balance: 0, email_verified: false }] };
        }
        return { rows: [] };
      }),
      release: jest.fn(),
    };
    pool.connect.mockResolvedValue(mockClient);

    const { req, res } = mockReqRes({
      username: 'joaosilva',
      email:    'joao@email.com',
      password: 'senha123',
    });

    await authController.register(req, res);

    expect(senhaGravada).not.toBeNull();
    expect(senhaGravada).not.toBe('senha123');        // nunca texto puro
    expect(senhaGravada).toMatch(/^\$2[aby]\$\d+\$/); // prefixo bcrypt
  });

  test('retorna 400 quando senha tem menos de 6 caracteres', async () => {
    const { req, res } = mockReqRes({
      username: 'joaosilva',
      email:    'joao@email.com',
      password: '123',
    });

    await authController.register(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: expect.stringContaining('6') })
    );
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// CT-04 — Login com credenciais inválidas (Unitário / Negativo)
// ─────────────────────────────────────────────────────────────────────────────

describe('CT-04 | Login com credenciais inválidas', () => {
  beforeEach(() => jest.clearAllMocks());

  test('retorna 401 e nenhum JWT é emitido', async () => {
    const bcrypt   = require('bcryptjs');
    const realHash = await bcrypt.hash('senhaCorreta', 10);

    // Usuário existe no banco mas com outra senha
    pool.query.mockResolvedValueOnce({
      rows: [{
        id:            1,
        username:      'joaosilva',
        email:         'joao@email.com',
        password_hash: realHash,
        balance:       5000,
      }],
    });

    const { req, res } = mockReqRes({
      email:    'joao@email.com',
      password: 'senhaErrada',
    });

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);

    // Resposta não deve conter token
    const body = res.json.mock.calls[0][0];
    expect(body).not.toHaveProperty('token');
    expect(body).toHaveProperty('error');
  });

  test('retorna 401 quando usuário não existe no banco', async () => {
    pool.query.mockResolvedValueOnce({ rows: [] });

    const { req, res } = mockReqRes({
      email:    'naoexiste@email.com',
      password: 'qualquerSenha',
    });

    await authController.login(req, res);

    expect(res.status).toHaveBeenCalledWith(401);
  });
});
