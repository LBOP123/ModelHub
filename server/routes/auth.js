const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const auth = require('../middleware/auth');

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) {
      return res.status(400).json({ code: 400, msg: '用户名、邮箱和密码不能为空' });
    }
    if (password.length < 6) {
      return res.status(400).json({ code: 400, msg: '密码至少 6 位' });
    }

    const [existing] = await db.query(
      'SELECT id FROM users WHERE username = ? OR email = ?',
      [username, email]
    );
    if (existing.length) {
      return res.status(400).json({ code: 400, msg: '用户名或邮箱已被注册' });
    }

    const hash = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      'INSERT INTO users (username, email, password_hash, display_name) VALUES (?, ?, ?, ?)',
      [username, email, hash, username]
    );

    const token = jwt.sign(
      { id: result.insertId, username, email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ code: 200, msg: '注册成功', data: { token, user: { id: result.insertId, username, email, display_name: username } } });
  } catch (e) { next(e); }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ code: 400, msg: '邮箱和密码不能为空' });
    }

    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    if (!rows.length) {
      return res.status(401).json({ code: 401, msg: '邮箱或密码错误' });
    }

    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password_hash);
    if (!ok) {
      return res.status(401).json({ code: 401, msg: '邮箱或密码错误' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ code: 200, msg: '登录成功', data: { token, user: { id: user.id, username: user.username, email: user.email, display_name: user.display_name } } });
  } catch (e) { next(e); }
});

// GET /api/auth/me
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

// POST /api/auth/admin-login
router.post('/admin-login', async (req, res, next) => {
  try {
    const { key } = req.body;
    if (!key) {
      return res.status(400).json({ code: 400, msg: '请输入管理员密钥' });
    }

    const adminKey = process.env.ADMIN_KEY;
    if (!adminKey || key !== adminKey) {
      return res.status(401).json({ code: 401, msg: '管理员密钥错误' });
    }

    const token = jwt.sign(
      { id: 0, username: 'admin', email: 'admin@modelhub.local', is_admin: true },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({ code: 200, msg: '管理员登录成功', data: { token, user: { id: 0, username: 'admin', email: 'admin@modelhub.local', display_name: '管理员', is_admin: true } } });
  } catch (e) { next(e); }
});

module.exports = router;
