// ========== Auth State ==========
function getAuthState() {
  const token = localStorage.getItem('modelhub_token');
  if (!token) return { isLoggedIn: false, user: null, isAdmin: false };

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    if (payload.exp * 1000 < Date.now()) {
      localStorage.removeItem('modelhub_token');
      return { isLoggedIn: false, user: null, isAdmin: false };
    }
    return { isLoggedIn: true, user: payload, isAdmin: !!payload.is_admin };
  } catch {
    localStorage.removeItem('modelhub_token');
    return { isLoggedIn: false, user: null, isAdmin: false };
  }
}

function logout() {
  localStorage.removeItem('modelhub_token');
  localStorage.removeItem('modelhub_admin_key');
  window.location.href = '/login.html';
}

// Redirect to login if not authenticated — call at top of every protected page
function checkAuth() {
  if (!getAuthState().isLoggedIn) {
    window.location.href = '/login.html?redirect=' + encodeURIComponent(window.location.pathname + window.location.search);
    return false;
  }
  return true;
}

// ========== SVG Icons ==========
const ICONS = {
  cube: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>`,
  zap: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>`,
  doc: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  chevDown: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`,
  arrow: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>`,
  image: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>`,
  video: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>`,
  audio: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg>`,
  text: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>`,
  copy: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  trash: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>`,
  key: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/></svg>`,
};

// ========== Navbar ==========
const NAV_HTML = `
<a class="nav-brand" href="/">
  <div class="nav-brand-icon">${ICONS.cube}</div>
  <span class="nav-brand-text">ModelHub</span>
</a>
<div class="nav-center">
  <a href="/" data-nav="home">模型广场</a>
  <a href="/pages/dashboard.html" data-nav="dashboard">仪表盘</a>
  <a href="/pages/docs.html" data-nav="docs">接口文档</a>
  <a href="/pages/assets.html" data-nav="assets">资产</a>
</div>
<div class="nav-right" id="navRight"></div>
`;

function renderNavbar(activePage) {
  const nav = document.getElementById('navbar');
  if (!nav) return;
  nav.innerHTML = NAV_HTML;

  const { isLoggedIn, user, isAdmin } = getAuthState();
  const navCenter = nav.querySelector('.nav-center');

  if (isLoggedIn && !isAdmin) {
    const fbLink = document.createElement('a');
    fbLink.href = '/pages/feedback.html';
    fbLink.dataset.nav = 'feedback';
    fbLink.textContent = '反馈';
    navCenter.appendChild(fbLink);
  }

  if (isAdmin) {
    const adminLink = document.createElement('a');
    adminLink.href = '/pages/admin.html';
    adminLink.dataset.nav = 'admin';
    adminLink.textContent = '管理后台';
    navCenter.appendChild(adminLink);
  }

  const link = nav.querySelector(`[data-nav="${activePage}"]`);
  if (link) link.classList.add('active');

  const right = document.getElementById('navRight');

  if (isLoggedIn) {
    right.innerHTML = `
      ${isAdmin ? '<span style="font-size:11px;background:var(--orange-light);color:var(--orange);padding:2px 8px;border-radius:999px;font-weight:600">管理员</span>' : ''}
      <span class="nav-user">${user.username}</span>
      <button class="nav-btn ghost" onclick="logout()">退出</button>
    `;
  } else {
    right.innerHTML = `
      <a class="nav-btn ghost" href="/login.html">登录</a>
      <a class="nav-btn primary" href="/login.html?tab=register">注册</a>
    `;
  }
}

// ========== Toast ==========
function showToast(msg, type) {
  let t = document.getElementById('toast');
  if (!t) {
    t = document.createElement('div');
    t.id = 'toast';
    t.className = 'toast';
    document.body.appendChild(t);
  }
  t.textContent = msg;
  t.className = `toast ${type || ''} show`;
  clearTimeout(t._t);
  t._t = setTimeout(() => t.classList.remove('show'), 2500);
}

// ========== Time Format ==========
function formatTime(dateStr) {
  const d = new Date(dateStr);
  const pad = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

// ========== Escape HTML ==========
function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
