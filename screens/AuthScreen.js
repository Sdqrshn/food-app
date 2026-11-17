import { useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BRAND } from "../brand";
import Texture from "../components/Texture";
import { useAuth } from "../AuthContext";

export default function AuthScreen() {
  const { signInWithGoogle, signInAsGuest } = useAuth();
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState("");

  async function run(kind, action) {
    setBusy(kind);
    setError("");
    const result = await action();
    if (!result.ok) {
      if (!result.cancelled) setError(result.error);
      setBusy(null);
    }
  }

  return (
    <View style={styles.screen}>
      <Texture />
      <View style={styles.center}>
        <Image source={require("../assets/icon.png")} style={styles.logo} />
        <Text style={styles.name}>{BRAND.name}</Text>
        <Text style={styles.motto}>{BRAND.motto}</Text>
      </View>
      <View style={styles.bottom}>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={styles.button} onPress={() => run("google", signInWithGoogle)} disabled={!!busy}>
          {busy === "google" ? (
            <ActivityIndicator color="#2B2622" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#2B2622" />
              <Text style={styles.buttonText}>Continue with Google</Text>
            </>
          )}
        </Pressable>
        <Pressable style={styles.guest} onPress={() => run("guest", signInAsGuest)} disabled={!!busy}>
          {busy === "guest" ? (
            <ActivityIndicator color="#A6492F" />
          ) : (
            <Text style={styles.guestText}>Continue as guest</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F0E4", padding: 24 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  logo: { width: 96, height: 96, borderRadius: 24, marginBottom: 16 },
  name: { fontSize: 32, fontWeight: "500", color: "#2B2622" },
  motto: { fontSize: 15, color: "#6B6054", marginTop: 4 },
  bottom: { paddingBottom: 40 },
  error: { color: "#A32D2D", textAlign: "center", marginBottom: 12 },
  button: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 52,
    borderRadius: 26, backgroundColor: "#FFFBF3", borderWidth: 1, borderColor: "#D6C9B0",
  },
  buttonText: { fontSize: 16, color: "#2B2622", fontWeight: "500" },
  guest: { alignItems: "center", justifyContent: "center", height: 48, marginTop: 6 },
  guestText: { fontSize: 15, color: "#A6492F" },
});