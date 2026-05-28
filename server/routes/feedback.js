const router = require('express').Router();
const db = require('../db');

// GET /api/feedbacks - list current user's feedbacks
router.get('/', async (req, res, next) => {
  try {
    const [rows] = await db.query(
      'SELECT id, title, content, status, admin_reply, replied_at, created_at FROM feedbacks WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.json({ code: 200, data: { list: rows, total: rows.length } });
  } catch (e) { next(e); }
});

// POST /api/feedbacks - submit new feedback
router.post('/', async (req, res, next) => {
  try {
    const { title, content } = req.body;
    if (!title || !title.trim()) return res.status(400).json({ code: 400, msg: '标题不能为空' });
    if (!content || !content.trim()) return res.status(400).json({ code: 400, msg: '内容不能为空' });
    if (title.length > 200) return res.status(400).json({ code: 400, msg: '标题不能超过 200 字' });

    const [result] = await db.query(
      'INSERT INTO feedbacks (user_id, title, content) VALUES (?, ?, ?)',
      [req.user.id, title.trim(), content.trim()]
    );
    res.json({ code: 200, msg: '反馈提交成功', data: { id: result.insertId } });
  } catch (e) { next(e); }
});

// GET /api/feedbacks/:id - get single feedback (own only)
router.get('/:id', async (req, res, next) => {
  try {
    const [[row]] = await db.query(
      'SELECT id, title, content, status, admin_reply, replied_at, created_at FROM feedbacks WHERE id = ? AND user_id = ?',
      [req.params.id, req.user.id]
    );
    if (!row) return res.status(404).json({ code: 404, msg: '反馈不存在' });
    res.json({ code: 200, data: row });
  } catch (e) { next(e); }
});

module.exports = router;
