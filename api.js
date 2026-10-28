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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export async function authFetch(url, options = {}, retry = true) {
  const method = (options.method || "GET").toUpperCase();
  try {
    const res = await fetch(url, {
      ...options,
      headers: { ...(options.headers || {}), ...getAuthHeader() },
    });
    if (res.status === 401 && onUnauthorized) onUnauthorized();
    if (retry && method === "GET" && [502, 503, 504].includes(res.status)) {
      await sleep(3000);
      return authFetch(url, options, false);
    }
    return res;
  } catch (error) {
    if (retry && method === "GET") {
      await sleep(2000);
      return authFetch(url, options, false);
    }
    throw error;
  }
}