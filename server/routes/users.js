const router = require('express').Router();
const db = require('../db');
const auth = require('../middleware/auth');

// GET /api/users/me
router.get('/me', auth, async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, email, display_name, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (!rows.length) {
      return res.status(404).json({ code: 404, msg: '用户不存在' });
    }
    res.json({ code: 200, data: rows[0] });
  } catch (e) { next(e); }
});

// PUT /api/users/me
router.put('/me', auth, async (req, res, next) => {
  try {
    const { display_name } = req.body;
    if (!display_name) {
      return res.status(400).json({ code: 400, msg: 'display_name 不能为空' });
    }
    await db.query('UPDATE users SET display_name = ? WHERE id = ?', [display_name, req.user.id]);
    res.json({ code: 200, msg: '更新成功' });
  } catch (e) { next(e); }
});

module.exports = router;
