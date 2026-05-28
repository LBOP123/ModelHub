const BASE = '/api';

async function apiRequest(method, path, body) {
  const token = localStorage.getItem('modelhub_token');
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (token) opts.headers['Authorization'] = `Bearer ${token}`;
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);

  if (res.status === 401) {
    localStorage.removeItem('modelhub_token');
    window.location.href = '/login.html';
    return null;
  }

  const data = await res.json();
  if (data.code && data.code !== 200) {
    throw new Error(data.msg || '请求失败');
  }
  return data;
}

const api = {
  get:    (path) => apiRequest('GET', path),
  post:   (path, body) => apiRequest('POST', path, body),
  put:    (path, body) => apiRequest('PUT', path, body),
  delete: (path) => apiRequest('DELETE', path),
};
