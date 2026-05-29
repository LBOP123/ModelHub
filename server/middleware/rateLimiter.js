const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');

// 通用 API 限流：每IP每分钟最多60次请求
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, msg: '请求过于频繁，请稍后再试' },
});

// 登录/注册限流：每IP每15分钟最多10次尝试
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, msg: '登录/注册尝试次数过多，请15分钟后再试' },
});

// 模型调用限流：每IP每分钟最多20次（防止滥用上游API）
const modelCallLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, msg: '模型调用频率过高，请稍后再试' },
});

// 管理后台限流：每IP每分钟最多30次
const adminLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { code: 429, msg: '管理操作过于频繁，请稍后再试' },
});

// 降速中间件：对频繁请求的IP进行减速
const speedLimiter = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 30,
  delayMs: (hits) => hits * 200,
  maxDelayMs: 5000,
});

module.exports = {
  apiLimiter,
  authLimiter,
  modelCallLimiter,
  adminLimiter,
  speedLimiter,
};
