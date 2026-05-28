const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/assets
router.get('/', auth, async (req, res, next) => {
  try {
    const { type, model_id, page = 1, limit = 20, include_deleted } = req.query;
    const offset = (Math.max(1, +page) - 1) * +limit;
    const isAdmin = req.user.is_admin;

    const conditions = [];
    const params = [];

    if (!isAdmin) {
      conditions.push('r.user_id = ?');
      params.push(req.user.id);
    }

    if (!include_deleted) {
      conditions.push('r.is_deleted = 0');
    }

    if (type && type !== 'all') {
      conditions.push('m.category = ?');
      params.push(type);
    }

    if (model_id) {
      conditions.push('r.model_id = ?');
      params.push(model_id);
    }

    const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [countRows] = await db.query(
      `SELECT COUNT(*) AS total FROM call_records r JOIN models m ON r.model_id = m.id ${where}`,
      params
    );

    const selectFields = isAdmin
      ? `r.*, m.name AS model_name, m.category, m.icon, u.username`
      : `r.*, m.name AS model_name, m.category, m.icon`;

    const joinClause = isAdmin
      ? `FROM call_records r JOIN models m ON r.model_id = m.id LEFT JOIN users u ON r.user_id = u.id`
      : `FROM call_records r JOIN models m ON r.model_id = m.id`;

    const [rows] = await db.query(
      `SELECT ${selectFields} ${joinClause} ${where} ORDER BY r.created_at DESC LIMIT ? OFFSET ?`,
      [...params, +limit, offset]
    );

    rows.forEach(r => {
      if (typeof r.request_params === 'string') r.request_params = JSON.parse(r.request_params);
      if (typeof r.response_urls === 'string') r.response_urls = JSON.parse(r.response_urls);
    });

    res.json({
      code: 200,
      data: { list: rows, total: countRows[0].total, page: +page, limit: +limit }
    });
  } catch (e) { next(e); }
});

// GET /api/assets/stats
router.get('/stats', auth, async (req, res, next) => {
  try {
    const isAdmin = req.user.is_admin;
    const { include_deleted } = req.query;

    const conditions = [];
    const params = [];

    if (!isAdmin) {
      conditions.push('r.user_id = ?');
      params.push(req.user.id);
    }

    if (!include_deleted) {
      conditions.push('r.is_deleted = 0');
    }

    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [rows] = await db.query(`
      SELECT m.category, COUNT(*) AS count
      FROM call_records r
      JOIN models m ON r.model_id = m.id
      ${whereClause}
      GROUP BY m.category
    `, params);

    const stats = { total: 0, image: 0, video: 0, audio: 0, text: 0 };
    rows.forEach(r => {
      stats[r.category] = r.count;
      stats.total += r.count;
    });

    res.json({ code: 200, data: stats });
  } catch (e) { next(e); }
});

// GET /api/assets/top-models
router.get('/top-models', auth, async (req, res, next) => {
  try {
    const isAdmin = req.user.is_admin;
    const conditions = [];
    const params = [];

    if (!isAdmin) {
      conditions.push('r.user_id = ?');
      params.push(req.user.id);
    }

    const whereClause = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

    const [rows] = await db.query(`
      SELECT m.id, m.name, m.category, m.icon, COUNT(*) AS call_count
      FROM call_records r
      JOIN models m ON r.model_id = m.id
      ${whereClause}
      GROUP BY m.id, m.name, m.category, m.icon
      ORDER BY call_count DESC
      LIMIT 5
    `, params);

    res.json({ code: 200, data: rows });
  } catch (e) { next(e); }
});

// POST /api/assets
router.post('/', auth, async (req, res, next) => {
  try {
    const { model_id, request_params } = req.body;
    if (!model_id) {
      return res.status(400).json({ code: 400, msg: 'model_id 不能为空' });
    }

    const [result] = await db.query(
      'INSERT INTO call_records (user_id, model_id, request_params, status) VALUES (?, ?, ?, ?)',
      [req.user.id, model_id, JSON.stringify(request_params || {}), 'pending']
    );

    res.json({ code: 200, data: { id: result.insertId } });
  } catch (e) { next(e); }
});

// PUT /api/assets/:id
router.put('/:id', auth, async (req, res, next) => {
  try {
    const { status, response_url, response_urls, task_id, error_message, exec_time_ms } = req.body;
    const isAdmin = req.user.is_admin;

    const whereClause = isAdmin ? 'WHERE id = ?' : 'WHERE id = ? AND user_id = ?';
    const checkParams = isAdmin ? [req.params.id] : [req.params.id, req.user.id];

    const [existing] = await db.query(
      `SELECT id FROM call_records ${whereClause}`,
      checkParams
    );
    if (!existing.length) {
      return res.status(404).json({ code: 404, msg: '记录不存在' });
    }

    const fields = [];
    const params = [];
    if (status) { fields.push('status = ?'); params.push(status); }
    if (response_url !== undefined) { fields.push('response_url = ?'); params.push(response_url); }
    if (response_urls !== undefined) { fields.push('response_urls = ?'); params.push(JSON.stringify(response_urls)); }
    if (task_id !== undefined) { fields.push('task_id = ?'); params.push(task_id); }
    if (error_message !== undefined) { fields.push('error_message = ?'); params.push(error_message); }
    if (exec_time_ms !== undefined) { fields.push('exec_time_ms = ?'); params.push(exec_time_ms); }

    if (fields.length) {
      params.push(req.params.id);
      await db.query(`UPDATE call_records SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    res.json({ code: 200, msg: '更新成功' });
  } catch (e) { next(e); }
});

// DELETE /api/assets/:id (soft delete)
router.delete('/:id', auth, async (req, res, next) => {
  try {
    const isAdmin = req.user.is_admin;

    const whereClause = isAdmin ? 'WHERE id = ?' : 'WHERE id = ? AND user_id = ?';
    const params = isAdmin ? [req.params.id] : [req.params.id, req.user.id];

    const [result] = await db.query(
      `UPDATE call_records SET is_deleted = 1 ${whereClause}`,
      params
    );
    if (!result.affectedRows) {
      return res.status(404).json({ code: 404, msg: '记录不存在' });
    }
    res.json({ code: 200, msg: '删除成功' });
  } catch (e) { next(e); }
});

module.exports = router;
