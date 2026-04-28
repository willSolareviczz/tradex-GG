/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const pool = require('../config/db');
const { openCase, openCaseBatch } = require('../services/caseOpeningService');

exports.createCase = async (req, res) => {
  const client = await pool.connect();

  try {
    const { name, price, image_url, skins } = req.body;

    if (!name || !price || !image_url || !skins || !Array.isArray(skins) || skins.length === 0) {
      return res.status(400).json({ error: 'Campos obrigatórios: name, price, image_url, skins[]' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

    await client.query('BEGIN');

    const caseResult = await client.query(
      'INSERT INTO cases (name, slug, image_url, price) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, slug, image_url, Math.round(Number(price))]
    );

    const caseId = caseResult.rows[0].id;

    for (const skin of skins) {
      let skinId = skin.skin_id;

      if (!skinId && skin.name) {
        const skinResult = await client.query(
          `INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price)
           VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id`,
          [skin.name, skin.weapon || '', skin.skin_name || skin.name, skin.rarity || 'consumer',
           skin.rarity_color || '#b0c3d9', skin.image_url || '', Math.round(Number(skin.market_price || 0))]
        );
        skinId = skinResult.rows[0].id;
      }

      if (skinId) {
        await client.query(
          'INSERT INTO case_skins (case_id, skin_id, weight) VALUES ($1, $2, $3)',
          [caseId, skinId, skin.weight || 100]
        );
      }
    }

    await client.query('COMMIT');

    res.status(201).json({ message: 'Caixa criada com sucesso', case_id: caseId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Erro ao criar caixa:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  } finally {
    client.release();
  }
};

exports.listCases = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.id, c.name, c.slug, c.image_url, c.price, c.category,
             top_skin.skin_image_url AS best_skin_image,
             top_skin.skin_name AS best_skin_name,
             top_skin.skin_rarity AS best_skin_rarity,
             top_skin.skin_rarity_color AS best_skin_rarity_color,
             top_skin.skin_price AS best_skin_price
      FROM cases c
      LEFT JOIN LATERAL (
        SELECT s.image_url AS skin_image_url,
               s.name AS skin_name,
               s.rarity AS skin_rarity,
               s.rarity_color AS skin_rarity_color,
               COALESCE(s.site_price, s.market_price) AS skin_price
        FROM case_skins cs
        JOIN skins s ON cs.skin_id = s.id
        WHERE cs.case_id = c.id
        ORDER BY COALESCE(s.site_price, s.market_price) DESC
        LIMIT 1
      ) top_skin ON true
      WHERE c.is_active = true
      ORDER BY c.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao listar caixas:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.getCaseDetail = async (req, res) => {
  try {
    const { id } = req.params;

    const caseResult = await pool.query(
      'SELECT id, name, slug, image_url, price FROM cases WHERE id = $1 AND is_active = true',
      [id]
    );

    if (caseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Caixa não encontrada' });
    }

    const skinsResult = await pool.query(
      `SELECT s.id, s.name, s.weapon, s.skin_name, s.wear, s.rarity, s.rarity_color,
              s.image_url, s.market_price,
              COALESCE(s.site_price, s.market_price) AS site_price,
              cs.weight
       FROM case_skins cs
       JOIN skins s ON cs.skin_id = s.id
       WHERE cs.case_id = $1
       ORDER BY s.market_price DESC`,
      [id]
    );

    res.json({
      ...caseResult.rows[0],
      skins: skinsResult.rows,
    });
  } catch (err) {
    console.error('Erro ao buscar caixa:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.searchSkins = async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    if (q.length < 2) return res.json([]);

    const terms = q.split(/\s+/).filter(Boolean);
    const conditions = terms.map((_, i) =>
      `(s.name ILIKE $${i + 1} OR s.weapon ILIKE $${i + 1})`
    );
    const params = terms.map(t => `%${t}%`);

    const result = await pool.query(
      `SELECT
         s.id AS skin_id,
         s.name AS skin_name,
         s.weapon,
         s.wear,
         s.rarity,
         s.rarity_color,
         s.image_url AS skin_image,
         COALESCE(s.site_price, s.market_price) AS price,
         c.id   AS case_id,
         c.name AS case_name,
         c.image_url AS case_image
       FROM skins s
       JOIN case_skins cs ON cs.skin_id = s.id
       JOIN cases c ON c.id = cs.case_id AND c.is_active = true
       WHERE ${conditions.join(' AND ')}
       ORDER BY COALESCE(s.site_price, s.market_price) DESC
       LIMIT 10`,
      params
    );

    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar skins:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.openCase = async (req, res) => {
  try {
    const result = await openCase(req.userId, parseInt(req.params.id));
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('Erro ao abrir caixa:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

exports.openBatch = async (req, res) => {
  try {
    const quantity = parseInt(req.body.quantity) || 1;
    const result = await openCaseBatch(req.userId, parseInt(req.params.id), quantity);
    res.json(result);
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({ error: err.message });
    }
    console.error('Erro ao abrir caixas em lote:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};

// GET /api/cases/recent-drops - ultimos drops da comunidade para o feed ao vivo
exports.recentDrops = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        o.id,
        u.username,
        s.name AS skin_name,
        s.weapon,
        s.skin_name AS skin_skin_name,
        s.rarity,
        s.rarity_color,
        s.image_url,
        COALESCE(s.site_price, s.market_price) AS price,
        c.name AS case_name,
        o.created_at
      FROM openings o
      JOIN users u ON o.user_id = u.id
      JOIN skins s ON o.skin_id = s.id
      JOIN cases c ON o.case_id = c.id
      ORDER BY o.created_at DESC
      LIMIT 30
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Erro ao buscar drops recentes:', err);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
};
