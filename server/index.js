require('dotenv').config({ path: require('path').join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const path = require('path');
const helmet = require('helmet');

const authRoutes = require('./routes/auth');
const modelRoutes = require('./routes/models');
const assetRoutes = require('./routes/assets');
const docRoutes = require('./routes/docs');
const userRoutes = require('./routes/users');
const feedbackRoutes = require('./routes/feedback');
const adminUserRoutes = require('./routes/admin/users');
const adminModelRoutes = require('./routes/admin/models');
const adminDocRoutes = require('./routes/admin/docs');
const adminFeedbackRoutes = require('./routes/admin/feedback');
const auth = require('./middleware/auth');
const admin = require('./middleware/admin');
const errorHandler = require('./middleware/errorHandler');
const { apiLimiter, authLimiter, modelCallLimiter, adminLimiter, speedLimiter } = require('./middleware/rateLimiter');
const { concurrentLimiter, getStats } = require('./middleware/concurrentLimiter');
const { logRateLimited, logSuspicious, getRecentAttacks } = require('./middleware/attackLogger');
const { ipBlockerMiddleware, blockIP, unblockIP, getBlockedIPs, getViolationStats } = require('./middleware/ipBlocker');
const attackDetector = require('./middleware/attackDetector');

const app = express();

// === 安全防护层 ===

// 1. Helmet 安全头
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// 2. 请求体大小限制 - 防止大 payload 攻击
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));

// 3. IP 封禁检查（最高优先级，被封的IP直接拒绝）
app.use(ipBlockerMiddleware);

// 4. 攻击模式检测（SQL注入、XSS、路径遍历等）
app.use(attackDetector);

// 5. 可疑请求日志记录
app.use(logSuspicious);

// 6. 限流日志记录
app.use(logRateLimited);

// 7. 全局降速
app.use(speedLimiter);

// 8. 并发连接限制（每IP最多10个并发）
app.use(concurrentLimiter({ maxConcurrent: 10 }));

// CORS
app.use(cors({ origin: true, credentials: true }));

// API routes - 应用分级限流
app.use('/api/auth', authLimiter, authRoutes);          // 登录注册：严格限流
app.use('/api/models', apiLimiter, modelRoutes);         // 模型查询：普通限流
app.use('/api/assets', auth, apiLimiter, assetRoutes);
app.use('/api/docs', apiLimiter, docRoutes);
app.use('/api/users', auth, apiLimiter, userRoutes);
app.use('/api/feedbacks', auth, apiLimiter, feedbackRoutes);

// Admin routes - 管理后台限流
app.use('/api/admin/users', auth, admin, adminLimiter, adminUserRoutes);
app.use('/api/admin/models', auth, admin, adminLimiter, adminModelRoutes);
app.use('/api/admin/docs', auth, admin, adminLimiter, adminDocRoutes);
app.use('/api/admin/feedbacks', auth, admin, adminLimiter, adminFeedbackRoutes);

// === 管理员安全监控接口 ===

// 查看当前并发连接统计
app.get('/api/admin/connections', auth, admin, (req, res) => {
  res.json({ code: 200, data: getStats() });
});

// 查看最近攻击日志
app.get('/api/admin/attacks', auth, admin, (req, res) => {
  const limit = parseInt(req.query.limit) || 100;
  res.json({ code: 200, data: getRecentAttacks(limit) });
});

// 查看被封禁的IP列表
app.get('/api/admin/blocked-ips', auth, admin, (req, res) => {
  res.json({ code: 200, data: getBlockedIPs() });
});

// 查看违规统计
app.get('/api/admin/violations', auth, admin, (req, res) => {
  res.json({ code: 200, data: getViolationStats() });
});

// 手动封禁IP
app.post('/api/admin/block-ip', auth, admin, (req, res) => {
  const { ip, durationMinutes, reason } = req.body;
  if (!ip) return res.status(400).json({ code: 400, msg: '请提供IP地址' });
  const duration = durationMinutes ? durationMinutes * 60 * 1000 : null;
  const result = blockIP(ip, reason || 'manual_admin', duration);
  res.json({ code: 200, msg: `已封禁IP: ${ip}`, data: result });
});

// 解封IP
app.post('/api/admin/unblock-ip', auth, admin, (req, res) => {
  const { ip } = req.body;
  if (!ip) return res.status(400).json({ code: 400, msg: '请提供IP地址' });
  const success = unblockIP(ip);
  res.json({ code: success ? 200 : 404, msg: success ? `已解封IP: ${ip}` : '该IP未在封禁列表中' });
});

// Serve static frontend
app.use(express.static(path.join(__dirname, '..', 'public')));

// Fallback: non-API routes serve index.html
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ code: 404, msg: '接口不存在' });
  }
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`ModelHub server running on http://localhost:${PORT}`);
});
