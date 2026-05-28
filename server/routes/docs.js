const router = require('express').Router();
const db = require('../db');

// GET /api/docs - category summary
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(`
      SELECT m.category, COUNT(DISTINCT m.id) AS model_count, COUNT(d.id) AS doc_count
      FROM models m
      LEFT JOIN api_docs d ON d.model_id = m.id
      WHERE m.is_active = 1
      GROUP BY m.category
      ORDER BY m.category
    `);
    res.json({ code: 200, data: rows });
  } catch (e) { next(e); }
});

// GET /api/docs/:modelId - doc sections for a model
router.get('/:modelId', async (req, res, next) => {
  try {
    const [model] = await db.query('SELECT id, name, category FROM models WHERE id = ?', [req.params.modelId]);
    if (!model.length) {
      return res.status(404).json({ code: 404, msg: '模型不存在' });
    }

    const [docs] = await db.query(
      'SELECT * FROM api_docs WHERE model_id = ? ORDER BY section_order ASC',
      [req.params.modelId]
    );

    docs.forEach(d => {
      if (typeof d.headers_json === 'string') d.headers_json = JSON.parse(d.headers_json);
      if (typeof d.params_json === 'string') d.params_json = JSON.parse(d.params_json);
    });

    res.json({ code: 200, data: { model: model[0], docs } });
  } catch (e) { next(e); }
});

module.exports = router;
