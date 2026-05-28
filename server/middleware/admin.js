module.exports = function admin(req, res, next) {
  if (!req.user || !req.user.is_admin) {
    return res.status(403).json({ code: 403, msg: '无权限，需要管理员身份' });
  }
  next();
};
