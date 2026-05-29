// 攻击检测中间件 - 自动检测并拦截常见攻击模式
// 检测到攻击时记录日志 + 递增违规计数，严重攻击直接封禁

const { logSuspicious } = require('./attackLogger');
const { recordViolation, blockIP } = require('./ipBlocker');

// 拦截严重攻击（直接返回403并记录违规）
function attackDetector(req, res, next) {
  const ip = req.ip;
  const url = req.originalUrl || req.url;
  const ua = (req.headers['user-agent'] || '').toLowerCase();
  let blocked = false;
  let reason = '';

  // 1. 路径遍历攻击 - 直接封禁
  if (/\.\.\//.test(url) || /%2e%2e/i.test(url)) {
    reason = 'path_traversal';
    blocked = true;
  }

  // 2. SQL注入探测 - 直接封禁
  const sqlPatterns = /(\bunion\b.*\bselect\b|\bselect\b.*\bfrom\b.*\bwhere\b|\binsert\b.*\binto\b|\bdrop\b.*\btable\b|\bupdate\b.*\bset\b|'\s*or\s+'1'='1|'\s*or\s+1\s*=\s*1|;\s*drop\b|;\s*delete\b|;\s*update\b)/i;
  if (sqlPatterns.test(url)) {
    reason = 'sql_injection';
    blocked = true;
  }

  // 3. XSS 攻击 - 直接封禁
  if (/<script[\s>]/i.test(url) || /javascript\s*:/i.test(url) || /on(error|load|click)\s*=/i.test(url)) {
    reason = 'xss_attempt';
    blocked = true;
  }

  // 4. 命令注入 - 直接封禁
  if (/[;&|`$]\s*(cat|ls|whoami|id|wget|curl|bash|sh|nc|ncat|rm)\b/i.test(url)) {
    reason = 'command_injection';
    blocked = true;
  }

  // 5. 扫描器 UA - 记录违规但不直接封禁
  const scannerTools = ['sqlmap', 'nikto', 'nmap', 'masscan', 'dirbuster', 'gobuster', 'hydra', 'medusa', 'zmeu', 'w3af', 'havij'];
  if (scannerTools.some(t => ua.includes(t))) {
    reason = 'scanner_detected';
    recordViolation(ip);
    // 不直接封禁，记录即可
  }

  // 6. 敏感文件探测
  const sensitivePaths = ['.env', '.git', 'wp-admin', 'wp-login', 'phpmyadmin', 'adminer', '.htaccess', 'web.config', 'config.php', 'config.json', 'backup', '.bak', '.sql', '.dump'];
  if (sensitivePaths.some(p => url.toLowerCase().includes(p))) {
    reason = 'sensitive_file_probe';
    recordViolation(ip);
  }

  if (blocked) {
    // 直接封禁这个IP
    blockIP(ip, reason, 30 * 60 * 1000); // 封30分钟
    console.log(`[AttackDetector] BLOCKED ${ip}: ${reason} - ${req.method} ${url}`);

    return res.status(403).json({
      code: 403,
      msg: '检测到恶意请求，你的IP已被临时封禁',
    });
  }

  next();
}

module.exports = attackDetector;
