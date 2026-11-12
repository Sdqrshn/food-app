import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { API } from "../config";
import { authFetch } from "../api";
import { useAuth } from "../AuthContext";
import Texture from "../components/Texture";

export default function DeleteAccountScreen({ navigation }) {
  const { deleteMyAccount } = useAuth();
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const fill = useRef(new Animated.Value(0)).current;
  const running = useRef(null);

  useEffect(() => {
    authFetch(`${API}/auth/delete-summary/`)
      .then((res) => res.json())
      .then((data) => setSummary(data))
      .catch(() => setError("Could not load your account summary."));
  }, []);

  async function confirm() {
    setBusy(true);
    const result = await deleteMyAccount();
    if (!result.ok) {
      setError("Could not delete the account. Try again.");
      setBusy(false);
      fill.setValue(0);
    }
  }

  function start() {
    if (busy || !summary) return;
    running.current = Animated.timing(fill, {
      toValue: 1, duration: 2000, easing: Easing.linear, useNativeDriver: false,
    });
    running.current.start(({ finished }) => { if (finished) confirm(); });
  }

  function cancel() {
    if (busy) return;
    if (running.current) running.current.stop();
    Animated.timing(fill, { toValue: 0, duration: 200, useNativeDriver: false }).start();
  }

  const width = fill.interpolate({ inputRange: [0, 1], outputRange: ["0%", "100%"] });
  const n = (count, one, many) => `${count} ${count === 1 ? one : many}`;

  return (
    <View style={styles.screen}>
      <Texture />
      <Pressable onPress={() => navigation.goBack()} style={styles.backWrap} disabled={busy}>
        <Text style={styles.back}>← Cancel</Text>
      </Pressable>

      <Text style={styles.title}>Delete your account?</Text>
      <Text style={styles.sub}>
        This permanently erases your account and everything in it. It can't be undone.
      </Text>

      <View style={styles.card}>
        {summary ? (
          <>
            <Text style={styles.item}>{n(summary.categories, "category", "categories")}</Text>
            <Text style={styles.item}>{n(summary.dishes, "ranked dish", "ranked dishes")}</Text>
            <Text style={styles.item}>{n(summary.photos, "photo", "photos")}</Text>
            <Text style={styles.item}>{n(summary.to_eat, "To-eat place", "To-eat places")}</Text>
          </>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : (
          <ActivityIndicator color="#D9774F" />
        )}
      </View>
      {summary && error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.bottom}>
        <Text style={styles.hint}>Press and hold for 2 seconds</Text>
        <Pressable onPressIn={start} onPressOut={cancel} disabled={!summary || busy}>
          <View style={[styles.holdBtn, (!summary || busy) && { opacity: 0.5 }]}>
            <Animated.View style={[styles.fill, { width }]} />
            {busy ? (
              <ActivityIndicator color="#A32D2D" />
            ) : (
              <Text style={styles.holdText}>Hold to delete</Text>
            )}
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F0E4", padding: 24, paddingTop: 60 },
  backWrap: { alignSelf: "flex-start", marginBottom: 12 },
  back: { fontSize: 15, color: "#6B6054" },
  title: { fontSize: 26, fontWeight: "500", color: "#2B2622", marginTop: 8 },
  sub: { fontSize: 14, color: "#6B6054", marginTop: 6, lineHeight: 20 },
  card: { backgroundColor: "#FFFBF3", borderRadius: 16, padding: 18, marginTop: 22, gap: 10 },
  item: { fontSize: 16, color: "#2B2622" },
  error: { color: "#A32D2D", fontSize: 13, marginTop: 8 },
  bottom: { flex: 1, justifyContent: "flex-end", paddingBottom: 40 },
  hint: { fontSize: 13, color: "#8C8073", textAlign: "center", marginBottom: 12 },
  holdBtn: {
    height: 58, borderRadius: 29, borderWidth: 1.5, borderColor: "#E6B8B1", backgroundColor: "#FFFBF3",
    alignItems: "center", justifyContent: "center", overflow: "hidden",
  },
  fill: { position: "absolute", left: 0, top: 0, bottom: 0, backgroundColor: "#F0C4BC" },
  holdText: { fontSize: 16, fontWeight: "500", color: "#A32D2D" },
});