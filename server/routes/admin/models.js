const router = require('express').Router();
const db = require('../../db');

const ALLOWED_FIELDS = [
  'name', 'category', 'icon', 'description', 'price_label', 'price_cents',
  'badge', 'api_endpoint', 'api_method', 'api_base_url', 'tags',
  'is_active', 'is_async', 'sort_order'
];

// GET /api/admin/models - list all models (including inactive)
router.get('/', async (req, res, next) => {
  try {
    const { category, search } = req.query;
    const conditions = [];
    const params = [];

    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    if (search) {
      conditions.push('(name LIKE ? OR description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
    const [rows] = await db.query(
      `SELECT * FROM models ${where} ORDER BY sort_order, created_at DESC`, params
    );
    rows.forEach(r => { if (typeof r.tags === 'string') r.tags = JSON.parse(r.tags); });
    res.json({ code: 200, data: rows });
  } catch (e) { next(e); }
});

// POST /api/admin/models - create model
router.post('/', async (req, res, next) => {
  try {
    const { id, name, category, description } = req.body;
    if (!id || !name || !category || !description) {
      return res.status(400).json({ code: 400, msg: 'id, name, category, description 为必填项' });
    }
    const fields = { id, name, category, description };
    ALLOWED_FIELDS.forEach(f => {
      if (req.body[f] !== undefined) fields[f] = f === 'tags' ? JSON.stringify(req.body[f]) : req.body[f];
    });
    const cols = Object.keys(fields);
    const vals = Object.values(fields);
    await db.query(
      `INSERT INTO models (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
      vals
    );
    res.json({ code: 200, msg: '模型创建成功', data: { id } });
  } catch (e) { next(e); }
});

// PUT /api/admin/models/:id - update model
router.put('/:id', async (req, res, next) => {
  try {
    const sets = [];
    const params = [];
    ALLOWED_FIELDS.forEach(f => {
      if (req.body[f] !== undefined) {
        sets.push(`${f} = ?`);
        params.push(f === 'tags' ? JSON.stringify(req.body[f]) : req.body[f]);
      }
    });
    if (!sets.length) return res.status(400).json({ code: 400, msg: '没有可更新的字段' });
    params.push(req.params.id);
    const [result] = await db.query(
      `UPDATE models SET ${sets.join(',')} WHERE id = ?`, params
    );
    if (!result.affectedRows) return res.status(404).json({ code: 404, msg: '模型不存在' });
    res.json({ code: 200, msg: '更新成功' });
  } catch (e) { next(e); }
});

// DELETE /api/admin/models/:id - delete model
router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM models WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ code: 404, msg: '模型不存在' });
    res.json({ code: 200, msg: '删除成功' });
  } catch (e) { next(e); }
});

// PATCH /api/admin/models/:id/toggle - toggle is_active
router.patch('/:id/toggle', async (req, res, next) => {
  try {
    const [[row]] = await db.query('SELECT is_active FROM models WHERE id = ?', [req.params.id]);
    if (!row) return res.status(404).json({ code: 404, msg: '模型不存在' });
    const newVal = row.is_active ? 0 : 1;
    await db.query('UPDATE models SET is_active = ? WHERE id = ?', [newVal, req.params.id]);
    res.json({ code: 200, data: { is_active: newVal } });
  } catch (e) { next(e); }
});

module.exports = router;
