const router = require('express').Router();
const db = require('../../db');

// GET /api/admin/users - list all users with call stats
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const search = req.query.search || '';

    let where = '';
    const params = [];
    if (search) {
      where = 'WHERE u.username LIKE ? OR u.email LIKE ?';
      params.push(`%${search}%`, `%${search}%`);
    }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM users u ${where}`, params
    );

    const [rows] = await db.query(
      `SELECT u.id, u.username, u.email, u.display_name, u.created_at,
              COUNT(cr.id) AS total_calls,
              SUM(cr.status = 'success') AS success_calls,
              MAX(cr.created_at) AS last_call_at
       FROM users u
       LEFT JOIN call_records cr ON cr.user_id = u.id
       ${where}
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ code: 200, data: { list: rows, total, page, limit } });
  } catch (e) { next(e); }
});

// GET /api/admin/users/:id - user detail with per-model call breakdown
router.get('/:id', async (req, res, next) => {
  try {
    const [[user]] = await db.query(
      'SELECT id, username, email, display_name, created_at FROM users WHERE id = ?',
      [req.params.id]
    );
    if (!user) return res.status(404).json({ code: 404, msg: '用户不存在' });

    const [modelStats] = await db.query(
      `SELECT cr.model_id, m.name AS model_name, m.category,
              COUNT(*) AS call_count,
              SUM(cr.status = 'success') AS success_count
       FROM call_records cr
       JOIN models m ON m.id = cr.model_id
       WHERE cr.user_id = ?
       GROUP BY cr.model_id, m.name, m.category
       ORDER BY call_count DESC`,
      [req.params.id]
    );

    res.json({ code: 200, data: { user, model_stats: modelStats } });
  } catch (e) { next(e); }
});

module.exports = router;
