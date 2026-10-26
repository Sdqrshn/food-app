import { createContext, useContext, useEffect, useState } from "react";
import * as SecureStore from "expo-secure-store";
import { API } from "./config";
import { authFetch, setToken, setUnauthorizedHandler } from "./api";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  async function clear() {
    setToken(null);
    setUser(null);
    try { await SecureStore.deleteItemAsync("auth"); } catch {}
  }

  useEffect(() => {
    setUnauthorizedHandler(clear);
    (async () => {
      try {
        const saved = await SecureStore.getItemAsync("auth");
        if (saved) {
          const data = JSON.parse(saved);
          setToken(data.token);
          setUser(data.user);
        }
      } catch {}
      setReady(true);
    })();
  }, []);

  async function authenticate(path, body) {
    try {
      const res = await fetch(`${API}/auth/${path}/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, errors: data };
      setToken(data.token);
      await SecureStore.setItemAsync("auth", JSON.stringify({ token: data.token, user: data.user }));
      setUser(data.user);
      return { ok: true };
    } catch {
      return { ok: false, errors: { error: "Could not reach the server." } };
    }
  }

  const signIn = (email, password) => authenticate("login", { email, password });
  const signUp = (email, password, displayName) =>
    authenticate("signup", { email, password, display_name: displayName });

  async function signOut() {
    try { await authFetch(`${API}/auth/logout/`, { method: "POST" }); } catch {}
    await clear();
  }

  async function persist(patch) {
    try {
      const saved = JSON.parse((await SecureStore.getItemAsync("auth")) || "{}");
      await SecureStore.setItemAsync("auth", JSON.stringify({ ...saved, ...patch }));
    } catch {}
  }

  async function updateName(displayName) {
    try {
      const res = await authFetch(`${API}/auth/me/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: displayName }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, errors: data };
      setUser(data);
      await persist({ user: data });
      return { ok: true };
    } catch {
      return { ok: false, errors: { error: "Could not reach the server." } };
    }
  }

  async function changePassword(current, next) {
    try {
      const res = await authFetch(`${API}/auth/change-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: current, new_password: next }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, errors: data };
      setToken(data.token);
      await persist({ token: data.token });
      return { ok: true };
    } catch {
      return { ok: false, errors: { error: "Could not reach the server." } };
    }
  }

  async function deleteAccount(password) {
    try {
      const res = await authFetch(`${API}/auth/delete-account/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, errors: data };
      await clear();
      return { ok: true };
    } catch {
      return { ok: false, errors: { error: "Could not reach the server." } };
    }
  }

  return (
    <AuthContext.Provider value={{ user, ready, signIn, signUp, signOut, updateName, changePassword, deleteAccount }}>
      {children}
    </AuthContext.Provider>
  );
}