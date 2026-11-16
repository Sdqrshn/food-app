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

export function getToken() {
  return token;
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

export function uploadForm(method, url, form) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    xhr.timeout = 60000;
    const auth = getAuthHeader();
    if (auth.Authorization) xhr.setRequestHeader("Authorization", auth.Authorization);
    xhr.onload = () => {
      let data = null;
      try { data = JSON.parse(xhr.responseText); } catch {}
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, data });
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.ontimeout = () => reject(new Error("Timed out"));
    xhr.send(form);
  });
}