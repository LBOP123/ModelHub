// 攻击日志记录器 - 记录所有可疑请求，方便你分析同学的攻击手法
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'attacks.log');

// 确保日志目录存在
if (!fs.existsSync(LOG_DIR)) {
  fs.mkdirSync(LOG_DIR, { recursive: true });
}

function writeLog(entry) {
  const line = JSON.stringify(entry) + '\n';
  fs.appendFile(LOG_FILE, line, (err) => {
    if (err) console.error('Attack log write failed:', err.message);
  });
}

// 内存中保存最近1000条攻击记录，供管理员查看
const recentAttacks = [];
const MAX_RECENT = 1000;

function addRecent(entry) {
  recentAttacks.unshift(entry);
  if (recentAttacks.length > MAX_RECENT) recentAttacks.pop();
}

// 标记请求为可疑的原因
function detectSuspicious(req) {
  const reasons = [];

  // 1. 常见攻击工具 User-Agent
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  const attackTools = ['sqlmap', 'nikto', 'nmap', 'masscan', 'dirbuster', 'gobuster', 'hydra', 'medusa', 'burpsuite', 'owasp', 'zap', 'w3af', 'havij'];
  if (attackTools.some(t => ua.includes(t))) {
    reasons.push('attack_tool_ua');
  }

  // 2. 无 User-Agent（脚本/工具默认行为）
  if (!req.headers['user-agent']) {
    reasons.push('no_user_agent');
  }

  // 3. 可疑路径遍历
  if (req.path.includes('..') || req.path.includes('%2e%2e')) {
    reasons.push('path_traversal');
  }

  // 4. 可疑查询参数（SQL注入探测）
  const fullUrl = req.originalUrl || req.url;
  const sqlPatterns = /(\bunion\b.*\bselect\b|\bselect\b.*\bfrom\b|\binsert\b.*\binto\b|\bdrop\b.*\btable\b|'?\s*or\s+'?1'?='?1|--\s*$|;\s*drop\b)/i;
  if (sqlPatterns.test(fullUrl)) {
    reasons.push('sql_injection_attempt');
  }

  // 5. XSS 探测
  if (/<script|javascript:|onerror=|onload=/i.test(fullUrl)) {
    reasons.push('xss_attempt');
  }

  // 6. 尝试访问敏感文件
  const sensitiveFiles = ['.env', '.git', 'wp-admin', 'phpmyadmin', '.htaccess', 'config.json', 'package.json'];
  if (sensitiveFiles.some(f => req.path.includes(f))) {
    reasons.push('sensitive_file_access');
  }

  // 7. 请求体过大（超过500KB就记录）
  const contentLength = parseInt(req.headers['content-length'] || '0');
  if (contentLength > 512000) {
    reasons.push('large_payload');
  }

  return reasons;
}

// 记录被限流的请求
function logRateLimited(req, res, next) {
  // 在 429 响应时记录
  const originalSend = res.send;
  res.send = function (body) {
    if (res.statusCode === 429) {
      const entry = {
        time: new Date().toISOString(),
        type: 'rate_limited',
        ip: req.ip,
        method: req.method,
        path: req.originalUrl,
        ua: req.headers['user-agent'] || '',
        reasons: ['rate_limit_exceeded'],
      };
      writeLog(entry);
      addRecent(entry);
    }
    return originalSend.call(this, body);
  };
  next();
}

// 记录所有可疑请求
function logSuspicious(req, res, next) {
  const reasons = detectSuspicious(req);
  if (reasons.length > 0) {
    const entry = {
      time: new Date().toISOString(),
      type: 'suspicious',
      ip: req.ip,
      method: req.method,
      path: req.originalUrl,
      ua: req.headers['user-agent'] || '',
      body: req.method === 'POST' ? JSON.stringify(req.body).substring(0, 500) : undefined,
      reasons,
    };
    writeLog(entry);
    addRecent(entry);
  }
  next();
}

// 记录登录失败
function logLoginFailed(req, ip, email) {
  const entry = {
    time: new Date().toISOString(),
    type: 'login_failed',
    ip,
    email,
    method: req.method,
    path: req.originalUrl,
  };
  writeLog(entry);
  addRecent(entry);
}

// 获取最近攻击记录
function getRecentAttacks(limit = 100) {
  return recentAttacks.slice(0, limit);
}

module.exports = { logRateLimited, logSuspicious, logLoginFailed, getRecentAttacks };
