import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import * as SecureStore from "expo-secure-store";
import { GoogleSignin, isErrorWithCode, statusCodes } from "@react-native-google-signin/google-signin";
import { API, GOOGLE_WEB_CLIENT_ID } from "./config";
import { authFetch, setToken, setUnauthorizedHandler } from "./api";

GoogleSignin.configure({ webClientId: GOOGLE_WEB_CLIENT_ID });

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const JSON_HEADERS = { "Content-Type": "application/json" };

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);
  const [waking, setWaking] = useState(true);
  const [serverEpoch, setServerEpoch] = useState(0);
  const lastCheck = useRef(0);

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

  const checkServer = useCallback((first) => {
    lastCheck.current = Date.now();
    let done = false;
    const timer = first ? null : setTimeout(() => { if (!done) setWaking(true); }, 800);
    const controller = typeof AbortController !== "undefined" ? new AbortController() : null;
    const hardStop = setTimeout(() => controller && controller.abort(), 70000);
    fetch(`${API}/health/`, controller ? { signal: controller.signal } : undefined)
      .catch(() => {})
      .finally(() => {
        done = true;
        if (timer) clearTimeout(timer);
        clearTimeout(hardStop);
        setWaking(false);
        setServerEpoch((n) => n + 1);
      });
  }, []);

  useEffect(() => { checkServer(true); }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active" && Date.now() - lastCheck.current > 5 * 60 * 1000) checkServer(false);
    });
    return () => sub.remove();
  }, [checkServer]);

  async function persist(patch) {
    try {
      const saved = JSON.parse((await SecureStore.getItemAsync("auth")) || "{}");
      await SecureStore.setItemAsync("auth", JSON.stringify({ ...saved, ...patch }));
    } catch {}
  }

  async function signInWithGoogle() {
    try {
      await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
      const response = await GoogleSignin.signIn();
      const idToken = response?.data?.idToken ?? response?.idToken;
      if (!idToken) return { ok: false, cancelled: true };
      const res = await fetch(`${API}/auth/google/`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ id_token: idToken }),
      });
      const data = await res.json();
      if (!res.ok) return { ok: false, error: data.error || "Could not sign you in." };
      setToken(data.token);
      await SecureStore.setItemAsync("auth", JSON.stringify({ token: data.token, user: data.user }));
      setUser(data.user);
      return { ok: true };
    } catch (e) {
      if (isErrorWithCode(e) && e.code === statusCodes.SIGN_IN_CANCELLED) return { ok: false, cancelled: true };
      return { ok: false, error: "Google sign-in failed. Please try again." };
    }
  }

  async function signOut() {
    try { await authFetch(`${API}/auth/logout/`, { method: "POST" }); } catch {}
    try { await GoogleSignin.signOut(); } catch {}
    await clear();
  }

  async function updateName(displayName) {
    try {
      const res = await authFetch(`${API}/auth/me/`, {
        method: "PATCH",
        headers: JSON_HEADERS,
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

  async function deleteMyAccount() {
    try {
      const res = await authFetch(`${API}/auth/delete/`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ confirm: true }),
      });
      if (!res.ok) return { ok: false };
      try { await GoogleSignin.signOut(); } catch {}
      await clear();
      return { ok: true };
    } catch {
      return { ok: false };
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, ready, waking, serverEpoch, signInWithGoogle, signOut, updateName, deleteMyAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}