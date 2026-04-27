/**
 * tradex-GG
 * @author willSolareviczz
 * @github https://github.com/willSolareviczz/tradex-GG
 * @section backend
 */
const pool = require('../config/db');
const { updateSkinPrices } = require('../services/priceService');

// =====================================================
// CASES CRUD
// =====================================================

exports.listAllCases = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT c.*,
        (SELECT COUNT(*) FROM case_skins WHERE case_id = c.id) as skin_count,
        (SELECT COUNT(*) FROM openings WHERE case_id = c.id) as total_openings
      FROM cases c ORDER BY c.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Admin listCases:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};

exports.createCase = async (req, res) => {
  try {
    const { name, description, image_url, price, category } = req.body;

    if (!name || !price || !image_url) {
      return res.status(400).json({ error: 'Campos obrigatórios: name, price, image_url' });
    }

    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const priceCents = Math.round(Number(price));

    const result = await pool.query(
      `INSERT INTO cases (name, slug, description, image_url, price, category)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [name, slug, description || null, image_url, priceCents, category || 'rifles']
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Admin createCase:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};

exports.updateCase = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image_url, price, is_active } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { fields.push(`name = $${idx}`); values.push(name); idx++; fields.push(`slug = $${idx}`); values.push(name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')); idx++; }
    if (description !== undefined) { fields.push(`description = $${idx}`); values.push(description); idx++; }
    if (image_url !== undefined) { fields.push(`image_url = $${idx}`); values.push(image_url); idx++; }
    if (price !== undefined) { fields.push(`price = $${idx}`); values.push(Math.round(Number(price))); idx++; }
    if (req.body.category !== undefined) { fields.push(`category = $${idx}`); values.push(req.body.category); idx++; }
    if (is_active !== undefined) { fields.push(`is_active = $${idx}`); values.push(is_active); idx++; }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE cases SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Caixa não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Admin updateCase:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};

exports.deleteCase = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM cases WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Caixa não encontrada' });
    }

    res.json({ message: 'Caixa deletada' });
  } catch (err) {
    console.error('Admin deleteCase:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// =====================================================
// SKINS CRUD
// =====================================================

exports.listAllSkins = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.*,
        (SELECT COUNT(*) FROM case_skins WHERE skin_id = s.id) as case_count
      FROM skins s ORDER BY s.id DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Admin listSkins:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};

exports.createSkin = async (req, res) => {
  try {
    const { name, weapon, skin_name, rarity, rarity_color, image_url, market_price } = req.body;

    if (!name || !rarity || !image_url) {
      return res.status(400).json({ error: 'Campos obrigatórios: name, rarity, image_url' });
    }

    const rarityColors = {
      consumer: '#b0c3d9', industrial: '#5e98d9', mil_spec: '#4b69ff',
      restricted: '#8847ff', classified: '#d32ce6', covert: '#eb4b4b',
      extraordinary: '#e4ae39'
    };

    const result = await pool.query(
      `INSERT INTO skins (name, weapon, skin_name, rarity, rarity_color, image_url, market_price)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [name, weapon || '', skin_name || name, rarity,
       rarity_color || rarityColors[rarity] || '#b0c3d9',
       image_url, Math.round(Number(market_price || 0))]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Admin createSkin:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};

exports.updateSkin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, weapon, skin_name, rarity, rarity_color, image_url, market_price } = req.body;

    const fields = [];
    const values = [];
    let idx = 1;

    if (name !== undefined) { fields.push(`name = $${idx}`); values.push(name); idx++; }
    if (weapon !== undefined) { fields.push(`weapon = $${idx}`); values.push(weapon); idx++; }
    if (skin_name !== undefined) { fields.push(`skin_name = $${idx}`); values.push(skin_name); idx++; }
    if (rarity !== undefined) { fields.push(`rarity = $${idx}`); values.push(rarity); idx++; }
    if (rarity_color !== undefined) { fields.push(`rarity_color = $${idx}`); values.push(rarity_color); idx++; }
    if (image_url !== undefined) { fields.push(`image_url = $${idx}`); values.push(image_url); idx++; }
    if (market_price !== undefined) { fields.push(`market_price = $${idx}`); values.push(Math.round(Number(market_price))); idx++; }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'Nenhum campo para atualizar' });
    }

    values.push(id);
    const result = await pool.query(
      `UPDATE skins SET ${fields.join(', ')} WHERE id = $${idx} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Skin não encontrada' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Admin updateSkin:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};

exports.deleteSkin = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM skins WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Skin não encontrada' });
    }

    res.json({ message: 'Skin deletada' });
  } catch (err) {
    console.error('Admin deleteSkin:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// =====================================================
// CASE-SKINS (vincular skins a cases com peso/chance)
// =====================================================

exports.getCaseSkins = async (req, res) => {
  try {
    const { caseId } = req.params;

    const caseResult = await pool.query('SELECT * FROM cases WHERE id = $1', [caseId]);
    if (caseResult.rows.length === 0) {
      return res.status(404).json({ error: 'Caixa não encontrada' });
    }

    const skinsResult = await pool.query(`
      SELECT cs.id as link_id, cs.weight, s.*
      FROM case_skins cs
      JOIN skins s ON cs.skin_id = s.id
      WHERE cs.case_id = $1
      ORDER BY cs.weight DESC
    `, [caseId]);

    // Calcular porcentagem real de cada skin
    const totalWeight = skinsResult.rows.reduce((sum, s) => sum + s.weight, 0);
    const skinsWithChance = skinsResult.rows.map(s => ({
      ...s,
      chance_percent: totalWeight > 0 ? ((s.weight / totalWeight) * 100).toFixed(4) : '0'
    }));

    res.json({
      case: caseResult.rows[0],
      skins: skinsWithChance,
      total_weight: totalWeight
    });
  } catch (err) {
    console.error('Admin getCaseSkins:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};

exports.addSkinToCase = async (req, res) => {
  try {
    const { caseId } = req.params;
    const { skin_id, weight } = req.body;

    if (!skin_id || !weight) {
      return res.status(400).json({ error: 'Campos obrigatórios: skin_id, weight' });
    }

    const result = await pool.query(
      `INSERT INTO case_skins (case_id, skin_id, weight)
       VALUES ($1, $2, $3)
       ON CONFLICT (case_id, skin_id) DO UPDATE SET weight = $3
       RETURNING *`,
      [caseId, skin_id, Math.round(Number(weight))]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Admin addSkinToCase:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};

exports.updateCaseSkinWeight = async (req, res) => {
  try {
    const { linkId } = req.params;
    const { weight } = req.body;

    if (!weight || weight < 1) {
      return res.status(400).json({ error: 'Peso deve ser >= 1' });
    }

    const result = await pool.query(
      'UPDATE case_skins SET weight = $1 WHERE id = $2 RETURNING *',
      [Math.round(Number(weight)), linkId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vínculo não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Admin updateWeight:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};

exports.removeSkinFromCase = async (req, res) => {
  try {
    const { linkId } = req.params;
    const result = await pool.query(
      'DELETE FROM case_skins WHERE id = $1 RETURNING id', [linkId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Vínculo não encontrado' });
    }

    res.json({ message: 'Skin removida da caixa' });
  } catch (err) {
    console.error('Admin removeSkin:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// =====================================================
// PRICE UPDATE
// =====================================================

exports.triggerPriceUpdate = async (req, res) => {
  const force = req.query.force === 'true';
  // Responde imediatamente e roda em background
  res.json({ message: `Atualizacao de precos iniciada (force=${force}). Acompanhe os logs do servidor.` });
  try {
    await updateSkinPrices({ force });
  } catch (err) {
    console.error('Admin triggerPriceUpdate:', err);
  }
};

exports.getPricempireStatus = (req, res) => {
  res.json({ message: 'Pricempire removido. Fonte de precos: Skinport API.' });
};

exports.getPriceStatus = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) FILTER (WHERE market_hash_name IS NOT NULL) as with_hash_name,
        COUNT(*) FILTER (WHERE site_price IS NOT NULL) as with_site_price,
        COUNT(*) FILTER (WHERE price_updated_at IS NOT NULL) as with_price_update,
        COUNT(*) FILTER (WHERE price_updated_at > NOW() - INTERVAL '6 hours') as recently_updated,
        MIN(price_updated_at) as oldest_update,
        MAX(price_updated_at) as newest_update
      FROM skins
    `);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Admin getPriceStatus:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// =====================================================
// RECALCULAR PRECOS DAS CASES
// POST /api/admin/recalculate-cases
// Query param: edge=0.10 (house edge, padrão 10%)
// =====================================================

exports.recalculateCasePrices = async (req, res) => {
  try {
    const houseEdge = Math.min(0.50, Math.max(0.01,
      parseFloat(req.query.edge ?? req.body.edge ?? process.env.HOUSE_EDGE ?? '0.10')
    ));

    const { rows: cases } = await pool.query(
      'SELECT id, name, price FROM cases WHERE is_active = true ORDER BY id'
    );

    const report = [];

    for (const c of cases) {
      const { rows: skins } = await pool.query(`
        SELECT cs.weight,
               COALESCE(s.site_price, s.market_price) AS price
        FROM case_skins cs
        JOIN skins s ON cs.skin_id = s.id
        WHERE cs.case_id = $1
      `, [c.id]);

      if (skins.length === 0) {
        report.push({ id: c.id, name: c.name, skipped: true, reason: 'Sem skins' });
        continue;
      }

      const totalWeight = skins.reduce((sum, s) => sum + Number(s.weight), 0);
      const ev = skins.reduce((sum, s) => sum + (Number(s.weight) / totalWeight) * Number(s.price), 0);

      // Preço = EV / (1 - house_edge), múltiplo de 10 centavos, mínimo R$1,00
      const newPrice = Math.max(100, Math.round((ev / (1 - houseEdge)) / 10) * 10);
      const oldPrice = Number(c.price);
      const realEdge = ((newPrice - ev) / newPrice * 100);

      await pool.query('UPDATE cases SET price = $1 WHERE id = $2', [newPrice, c.id]);

      report.push({
        id: c.id,
        name: c.name,
        ev_brl: parseFloat((ev / 100).toFixed(2)),
        old_price_brl: parseFloat((oldPrice / 100).toFixed(2)),
        new_price_brl: parseFloat((newPrice / 100).toFixed(2)),
        house_edge_pct: parseFloat(realEdge.toFixed(2)),
        changed: newPrice !== oldPrice,
      });
    }

    res.json({
      message: `${report.length} cases processadas com house edge de ${(houseEdge * 100).toFixed(0)}%`,
      house_edge: houseEdge,
      cases: report,
    });
  } catch (err) {
    console.error('Admin recalculateCasePrices:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};

// =====================================================
// STATS / DASHBOARD
// =====================================================

exports.getStats = async (req, res) => {
  try {
    const [users, cases, skins, openings, revenue] = await Promise.all([
      pool.query('SELECT COUNT(*) as count FROM users'),
      pool.query('SELECT COUNT(*) as count FROM cases WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as count FROM skins'),
      pool.query('SELECT COUNT(*) as count FROM openings'),
      pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM transactions WHERE type = 'case_open'"),
    ]);

    const recentOpenings = await pool.query(`
      SELECT o.created_at, u.username, s.name as skin_name, s.rarity, s.rarity_color,
             s.market_price, c.name as case_name
      FROM openings o
      JOIN users u ON o.user_id = u.id
      JOIN skins s ON o.skin_id = s.id
      JOIN cases c ON o.case_id = c.id
      ORDER BY o.created_at DESC LIMIT 20
    `);

    res.json({
      total_users: parseInt(users.rows[0].count),
      total_cases: parseInt(cases.rows[0].count),
      total_skins: parseInt(skins.rows[0].count),
      total_openings: parseInt(openings.rows[0].count),
      total_revenue: parseInt(revenue.rows[0].total),
      recent_openings: recentOpenings.rows,
    });
  } catch (err) {
    console.error('Admin getStats:', err);
    res.status(500).json({ error: 'Erro interno' });
  }
};
