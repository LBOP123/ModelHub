const jwt = require('jsonwebtoken');

module.exports = function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ code: 401, msg: '未登录，请先登录' });
  }

  try {
    const token = header.slice(7);
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ code: 401, msg: '登录已过期，请重新登录' });
  }
};
