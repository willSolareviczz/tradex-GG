const pool = require('../config/db');
const { openCase } = require('../services/caseOpeningService');

exports.listCases = async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, name, slug, image_url, price FROM cases WHERE is_active = true ORDER BY id'
    );
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
      `SELECT s.id, s.name, s.weapon, s.skin_name, s.rarity, s.rarity_color,
              s.image_url, s.market_price, cs.weight
       FROM case_skins cs
       JOIN skins s ON cs.skin_id = s.id
       WHERE cs.case_id = $1
       ORDER BY cs.weight ASC`,
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
