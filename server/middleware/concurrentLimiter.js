// 并发连接限制器 - 防止单IP多线程并发攻击
// 使用内存计数器，适合单实例部署场景

const connectionCounts = new Map(); // IP -> { count, lastSeen }
const CLEANUP_INTERVAL = 30 * 1000; // 30秒清理一次过期记录

// 配置
const MAX_CONCURRENT = 10; // 每个IP最多10个并发连接
const ENTRY_EXPIRY = 60 * 1000; // 60秒无活动则清除记录

function concurrentLimiter(options = {}) {
  const maxConcurrent = options.maxConcurrent || MAX_CONCURRENT;

  // 定期清理过期的IP记录
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of connectionCounts) {
      if (now - data.lastSeen > ENTRY_EXPIRY) {
        connectionCounts.delete(ip);
      }
    }
  }, CLEANUP_INTERVAL);

  return (req, res, next) => {
    const ip = req.ip;
    const now = Date.now();

    if (!connectionCounts.has(ip)) {
      connectionCounts.set(ip, { count: 0, lastSeen: now });
    }

    const record = connectionCounts.get(ip);
    record.lastSeen = now;

    if (record.count >= maxConcurrent) {
      return res.status(429).json({
        code: 429,
        msg: `并发连接数过多（最多${maxConcurrent}个），请等待现有请求完成`,
      });
    }

    record.count++;

    // 请求结束时减少计数
    const cleanup = () => {
      const rec = connectionCounts.get(ip);
      if (rec) {
        rec.count = Math.max(0, rec.count - 1);
      }
    };

    res.on('finish', cleanup);
    res.on('close', cleanup);

    next();
  };
}

// 获取当前连接统计（用于监控）
function getStats() {
  const stats = {};
  for (const [ip, data] of connectionCounts) {
    if (data.count > 0) {
      stats[ip] = { count: data.count, lastSeen: new Date(data.lastSeen).toISOString() };
    }
  }
  return {
    activeIPs: Object.keys(stats).length,
    connections: stats,
  };
}

module.exports = { concurrentLimiter, getStats };
