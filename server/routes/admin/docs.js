const router = require('express').Router();
const db = require('../../db');

const ALLOWED_FIELDS = [
  'title', 'section_order', 'endpoint_url', 'http_method',
  'headers_json', 'params_json', 'request_example', 'response_example', 'notes_html'
];

// GET /api/admin/docs - list all doc sections (for copy reference)
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      `SELECT d.id, d.model_id, d.title, d.endpoint_url, d.http_method,
              m.name AS model_name
       FROM api_docs d
       JOIN models m ON m.id = d.model_id
       ORDER BY m.sort_order, d.section_order`
    );
    res.json({ code: 200, data: rows });
  } catch (e) { next(e); }
});

// GET /api/admin/docs/:modelId - list doc sections for a model
router.get('/:modelId', async (req, res, next) => {
  // If modelId is numeric, treat as doc section ID for copy
  if (/^\d+$/.test(req.params.modelId)) {
    try {
      const [[section]] = await db.query('SELECT * FROM api_docs WHERE id = ?', [req.params.modelId]);
      if (!section) return res.status(404).json({ code: 404, msg: '文档段不存在' });
      if (typeof section.headers_json === 'string') section.headers_json = JSON.parse(section.headers_json);
      if (typeof section.params_json === 'string') section.params_json = JSON.parse(section.params_json);
      return res.json({ code: 200, data: section });
    } catch (e) { return next(e); }
  }
  try {
    const [[model]] = await db.query(
      'SELECT id, name, category FROM models WHERE id = ?', [req.params.modelId]
    );
    if (!model) return res.status(404).json({ code: 404, msg: '模型不存在' });

    const [sections] = await db.query(
      'SELECT * FROM api_docs WHERE model_id = ? ORDER BY section_order',
      [req.params.modelId]
    );
    sections.forEach(s => {
      if (typeof s.headers_json === 'string') s.headers_json = JSON.parse(s.headers_json);
      if (typeof s.params_json === 'string') s.params_json = JSON.parse(s.params_json);
    });
    res.json({ code: 200, data: { model, sections } });
  } catch (e) { next(e); }
});

// POST /api/admin/docs - create doc section
router.post('/', async (req, res, next) => {
  try {
    const { model_id, title } = req.body;
    if (!model_id || !title) {
      return res.status(400).json({ code: 400, msg: 'model_id 和 title 为必填项' });
    }
    const [[model]] = await db.query('SELECT id FROM models WHERE id = ?', [model_id]);
    if (!model) return res.status(404).json({ code: 404, msg: '模型不存在' });

    const fields = { model_id, title };
    ALLOWED_FIELDS.forEach(f => {
      if (req.body[f] !== undefined) {
        fields[f] = (f.endsWith('_json') && typeof req.body[f] !== 'string')
          ? JSON.stringify(req.body[f]) : req.body[f];
      }
    });
    const cols = Object.keys(fields);
    const vals = Object.values(fields);
    const [result] = await db.query(
      `INSERT INTO api_docs (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
      vals
    );
    res.json({ code: 200, msg: '文档段创建成功', data: { id: result.insertId } });
  } catch (e) { next(e); }
});

// PUT /api/admin/docs/:id - update doc section
router.put('/:id', async (req, res, next) => {
  try {
    const sets = [];
    const params = [];
    ALLOWED_FIELDS.forEach(f => {
      if (req.body[f] !== undefined) {
        sets.push(`${f} = ?`);
        params.push((f.endsWith('_json') && typeof req.body[f] !== 'string')
          ? JSON.stringify(req.body[f]) : req.body[f]);
      }
    });
    if (!sets.length) return res.status(400).json({ code: 400, msg: '没有可更新的字段' });
    params.push(req.params.id);
    const [result] = await db.query(
      `UPDATE api_docs SET ${sets.join(',')} WHERE id = ?`, params
    );
    if (!result.affectedRows) return res.status(404).json({ code: 404, msg: '文档段不存在' });
    res.json({ code: 200, msg: '更新成功' });
  } catch (e) { next(e); }
});

// DELETE /api/admin/docs/:id - delete doc section
router.delete('/:id', async (req, res, next) => {
  try {
    const [result] = await db.query('DELETE FROM api_docs WHERE id = ?', [req.params.id]);
    if (!result.affectedRows) return res.status(404).json({ code: 404, msg: '文档段不存在' });
    res.json({ code: 200, msg: '删除成功' });
  } catch (e) { next(e); }
});

module.exports = router;
