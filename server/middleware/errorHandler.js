module.exports = function errorHandler(err, req, res, _next) {
  console.error('[Error]', err.message);
  const status = err.status || 500;
  res.status(status).json({
    code: status,
    msg: err.message || '服务器内部错误'
  });
};
