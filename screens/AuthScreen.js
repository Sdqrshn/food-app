import { useState } from "react";
import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BRAND } from "../brand";
import Texture from "../components/Texture";
import { useAuth } from "../AuthContext";

export default function AuthScreen() {
  const { signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function go() {
    setBusy(true);
    setError("");
    const result = await signInWithGoogle();
    if (!result.ok) {
      if (!result.cancelled) setError(result.error);
      setBusy(false);
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
        <Pressable style={styles.button} onPress={go} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#2B2622" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#2B2622" />
              <Text style={styles.buttonText}>Continue with Google</Text>
            </>
          )}
        </Pressable>
        <Text style={styles.note}>Your rankings are tied to your Google account.</Text>
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
  note: { fontSize: 12, color: "#8C8073", textAlign: "center", marginTop: 12 },
});