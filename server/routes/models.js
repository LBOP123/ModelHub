const router = require('express').Router();
const db = require('../db');

// GET /api/models
router.get('/', async (req, res, next) => {
  try {
    const { category, search } = req.query;
    let sql = 'SELECT * FROM models WHERE is_active = 1';
    const params = [];

    if (category && category !== 'all') {
      sql += ' AND category = ?';
      params.push(category);
    }
    if (search) {
      sql += ' AND (name LIKE ? OR description LIKE ? OR JSON_CONTAINS(tags, ?))';
      const kw = `%${search}%`;
      params.push(kw, kw, JSON.stringify(search));
    }

    sql += ' ORDER BY sort_order ASC';
    const [rows] = await db.query(sql, params);
    rows.forEach(r => { if (typeof r.tags === 'string') r.tags = JSON.parse(r.tags); });
    res.json({ code: 200, data: rows });
  } catch (e) { next(e); }
});

// GET /api/models/:id
router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.query('SELECT * FROM models WHERE id = ?', [req.params.id]);
    if (!rows.length) {
      return res.status(404).json({ code: 404, msg: '模型不存在' });
    }
    const model = rows[0];
    if (typeof model.tags === 'string') model.tags = JSON.parse(model.tags);
    res.json({ code: 200, data: model });
  } catch (e) { next(e); }
});

module.exports = router;
