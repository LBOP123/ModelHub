const router = require('express').Router();
const db = require('../../db');

// GET /api/admin/feedbacks - list all feedbacks
router.get('/', async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { status } = req.query;

    let where = '';
    const params = [];
    if (status) {
      where = 'WHERE f.status = ?';
      params.push(status);
    }

    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM feedbacks f ${where}`, params
    );

    const [rows] = await db.query(
      `SELECT f.*, u.username
       FROM feedbacks f
       JOIN users u ON u.id = f.user_id
       ${where}
       ORDER BY f.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    res.json({ code: 200, data: { list: rows, total, page, limit } });
  } catch (e) { next(e); }
});

// PUT /api/admin/feedbacks/:id/status - accept or reject
router.put('/:id/status', async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!['accepted', 'rejected'].includes(status)) {
      return res.status(400).json({ code: 400, msg: '状态值无效，只能是 accepted 或 rejected' });
    }
    const [result] = await db.query(
      'UPDATE feedbacks SET status = ? WHERE id = ?', [status, req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ code: 404, msg: '反馈不存在' });
    res.json({ code: 200, msg: '状态更新成功' });
  } catch (e) { next(e); }
});

// POST /api/admin/feedbacks/:id/reply - reply to feedback
router.post('/:id/reply', async (req, res, next) => {
  try {
    const { reply } = req.body;
    if (!reply || !reply.trim()) {
      return res.status(400).json({ code: 400, msg: '回复内容不能为空' });
    }
    const [result] = await db.query(
      'UPDATE feedbacks SET admin_reply = ?, replied_at = NOW(), status = \'replied\' WHERE id = ?',
      [reply.trim(), req.params.id]
    );
    if (!result.affectedRows) return res.status(404).json({ code: 404, msg: '反馈不存在' });
    res.json({ code: 200, msg: '回复成功' });
  } catch (e) { next(e); }
});

module.exports = router;
