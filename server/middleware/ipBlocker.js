// IP 封禁中间件 - 支持手动封禁 + 自动封禁（多次触发限流后自动拉黑）

const fs = require('fs');
const path = require('path');

const BLOCKLIST_FILE = path.join(__dirname, '..', '..', 'logs', 'blocked_ips.json');

// 被封禁的IP { ip: { reason, blockedAt, expiresAt? } }
let blockedIPs = {};

// 每个IP的违规计数 { ip: { count, firstViolation, lastViolation } }
const violations = new Map();

// 自动封禁配置
const AUTO_BAN_THRESHOLD = 10;    // 累计10次违规触发自动封禁
const AUTO_BAN_DURATION = 30 * 60 * 1000; // 自动封禁30分钟
const VIOLATION_WINDOW = 10 * 60 * 1000;  // 10分钟内的违规累计

// 加载已保存的封禁列表
function loadBlocklist() {
  try {
    if (fs.existsSync(BLOCKLIST_FILE)) {
      const data = JSON.parse(fs.readFileSync(BLOCKLIST_FILE, 'utf-8'));
      blockedIPs = data;
      console.log(`[IPBlocker] Loaded ${Object.keys(blockedIPs).length} blocked IPs`);
    }
  } catch (e) {
    console.error('[IPBlocker] Failed to load blocklist:', e.message);
  }
}

// 保存封禁列表到文件
function saveBlocklist() {
  try {
    const dir = path.dirname(BLOCKLIST_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(BLOCKLIST_FILE, JSON.stringify(blockedIPs, null, 2));
  } catch (e) {
    console.error('[IPBlocker] Failed to save blocklist:', e.message);
  }
}

loadBlocklist();

// 检查IP是否被封禁
function isBlocked(ip) {
  const entry = blockedIPs[ip];
  if (!entry) return false;

  // 检查是否过期
  if (entry.expiresAt && Date.now() > entry.expiresAt) {
    delete blockedIPs[ip];
    saveBlocklist();
    return false;
  }
  return true;
}

// 手动封禁IP
function blockIP(ip, reason = 'manual', durationMs = null) {
  blockedIPs[ip] = {
    reason,
    blockedAt: new Date().toISOString(),
    expiresAt: durationMs ? Date.now() + durationMs : null,
    expiresAtReadable: durationMs ? new Date(Date.now() + durationMs).toISOString() : 'permanent',
  };
  saveBlocklist();
  console.log(`[IPBlocker] Blocked ${ip}: ${reason}`);
  return blockedIPs[ip];
}

// 解封IP
function unblockIP(ip) {
  if (blockedIPs[ip]) {
    delete blockedIPs[ip];
    saveBlocklist();
    console.log(`[IPBlocker] Unblocked ${ip}`);
    return true;
  }
  return false;
}

// 记录一次违规，检查是否需要自动封禁
function recordViolation(ip) {
  const now = Date.now();
  if (!violations.has(ip)) {
    violations.set(ip, { count: 0, firstViolation: now, lastViolation: now });
  }

  const v = violations.get(ip);

  // 如果在窗口外，重置计数
  if (now - v.firstViolation > VIOLATION_WINDOW) {
    v.count = 0;
    v.firstViolation = now;
  }

  v.count++;
  v.lastViolation = now;

  // 超过阈值，自动封禁
  if (v.count >= AUTO_BAN_THRESHOLD) {
    blockIP(ip, `auto_ban: ${v.count} violations in ${Math.round((now - v.firstViolation) / 1000)}s`, AUTO_BAN_DURATION);
    violations.delete(ip);
    return true; // 已封禁
  }
  return false;
}

// 获取封禁列表
function getBlockedIPs() {
  // 清理过期的
  const now = Date.now();
  for (const [ip, entry] of Object.entries(blockedIPs)) {
    if (entry.expiresAt && now > entry.expiresAt) {
      delete blockedIPs[ip];
    }
  }
  return blockedIPs;
}

// 获取违规统计
function getViolationStats() {
  const stats = {};
  for (const [ip, v] of violations) {
    stats[ip] = v;
  }
  return stats;
}

// Express 中间件
function ipBlockerMiddleware(req, res, next) {
  if (isBlocked(req.ip)) {
    return res.status(403).json({
      code: 403,
      msg: '你的IP已被封禁，如有疑问请联系管理员',
    });
  }
  next();
}

module.exports = {
  ipBlockerMiddleware,
  blockIP,
  unblockIP,
  isBlocked,
  recordViolation,
  getBlockedIPs,
  getViolationStats,
};
