let token = null;
let onUnauthorized = null;

export function setToken(value) {
  token = value;
}

export function setUnauthorizedHandler(fn) {
  onUnauthorized = fn;
}

export function getAuthHeader() {
  return token ? { Authorization: `Token ${token}` } : {};
}

export async function authFetch(url, options = {}) {
  const res = await fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), ...getAuthHeader() },
  });
  if (res.status === 401 && onUnauthorized) onUnauthorized();
  return res;
}