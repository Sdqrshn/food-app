import { useEffect, useRef, useState } from "react";
import { Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { API, COLORS } from "../config";
import Texture from "../components/Texture";
import { authFetch } from "../api";

function Card({ dish, isNew, anim, onPress, disabled }) {
  return (
    <Animated.View style={{ opacity: anim.opacity, transform: [{ scale: anim.scale }] }}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        style={[styles.card, { backgroundColor: COLORS[dish.id % COLORS.length] }]}
      >
        {dish.photo ? (
          <Image source={{ uri: dish.photo }} style={StyleSheet.absoluteFill} />
        ) : (
          <Text style={styles.placeholder}>{dish.restaurant.charAt(0).toUpperCase()}</Text>
        )}
        {isNew ? (
          <View style={styles.badge}><Text style={styles.badgeText}>New</Text></View>
        ) : null}
        <View style={styles.band}>
          <Text style={styles.name} numberOfLines={1}>{dish.restaurant}</Text>
          {dish.name ? <Text style={styles.rest} numberOfLines={1}>{dish.name}</Text> : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

export default function MatchupScreen({ route, navigation }) {
  const { dish } = route.params;
  const [answers, setAnswers] = useState([]);
  const [opponent, setOpponent] = useState(null);
  const [round, setRound] = useState(1);
  const [result, setResult] = useState(null);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const newAnim = useRef({ scale: new Animated.Value(1), opacity: new Animated.Value(1) }).current;
  const oldAnim = useRef({ scale: new Animated.Value(1), opacity: new Animated.Value(1) }).current;

  async function ask(list) {
    setBusy(true);
    setError("");
    try {
      const res = await authFetch(`${API}/dishes/${dish.id}/place/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answers: list }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("bad response");
      setAnswers(list);
      if (data.done) {
        setResult(data);
      } else {
        setOpponent(data.opponent);
        setRound(data.round);
      }
      [newAnim, oldAnim].forEach((a) => { a.scale.setValue(1); a.opacity.setValue(1); });
    } catch {
      setError("Could not reach the server. Tap here to retry.");
    }
    setBusy(false);
  }

  useEffect(() => { ask([]); }, []);

  function pick(answer) {
    if (busy) return;
    setBusy(true);
    const win = answer === "win";
    const lose = answer === "lose";
    const to = (value, target) =>
      Animated.timing(value, { toValue: target, duration: 350, useNativeDriver: true });
    Animated.parallel([
      to(newAnim.scale, win ? 1.05 : lose ? 0.95 : 0.97),
      to(newAnim.opacity, lose ? 0.25 : 1),
      to(oldAnim.scale, lose ? 1.05 : win ? 0.95 : 0.97),
      to(oldAnim.opacity, win ? 0.25 : 1),
    ]).start(() => ask([...answers, answer]));
  }

  if (result) {
    return (
      <View style={[styles.screen, styles.center]}>
        <Texture />
        <Text style={styles.star}>★</Text>
        <Text style={styles.big}>Placed at #{result.rank} of {result.total}</Text>
        <Text style={styles.sub}>{dish.restaurant} is on the leaderboard</Text>
        <Pressable style={styles.done} onPress={() => navigation.goBack()}>
          <Text style={styles.doneText}>Done</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Texture />
      <Text style={styles.title}>Placing your new dish</Text>
      <Text style={styles.sub}>Round {round}</Text>

      {error ? (
        <Pressable onPress={() => ask(answers)}>
          <Text style={styles.error}>{error}</Text>
        </Pressable>
      ) : null}

      {opponent ? (
        <View style={styles.arena}>
          <Text style={styles.question}>Which did you like more?</Text>
          <Card dish={dish} isNew anim={newAnim} disabled={busy} onPress={() => pick("win")} />
          <View style={styles.vs}><Text style={styles.vsText}>VS</Text></View>
          <Card dish={opponent} anim={oldAnim} disabled={busy} onPress={() => pick("lose")} />
          <Pressable style={styles.tie} disabled={busy} onPress={() => pick("tie")}>
            <Text style={styles.tieText}>Can't decide</Text>
          </Pressable>
        </View>
      ) : !error ? (
        <Text style={styles.sub}>Finding the right spot...</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F0E4", padding: 20, paddingTop: 70 },
  center: { alignItems: "center", justifyContent: "center" },
  title: { fontSize: 22, fontWeight: "500", color: "#2B2622" },
  sub: { fontSize: 13, color: "#6B6054", marginTop: 2, marginBottom: 12 },
  error: { color: "#A32D2D", marginVertical: 12 },
  arena: { marginTop: 8 },
  question: { fontSize: 15, color: "#2B2622", textAlign: "center", marginBottom: 14 },
  card: { height: 150, borderRadius: 18, overflow: "hidden" },
  placeholder: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0, textAlign: "center",
    textAlignVertical: "center", fontSize: 52, color: "rgba(255,251,243,0.5)",
  },
  badge: {
    position: "absolute", top: 8, left: 8, backgroundColor: "#FFFBF3",
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  badgeText: { fontSize: 12, fontWeight: "500", color: "#2B2622" },
  band: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(43,38,34,0.8)", paddingHorizontal: 12, paddingVertical: 8,
  },
  name: { fontSize: 15, fontWeight: "500", color: "#FFFBF3" },
  rest: { fontSize: 12, color: "#E6DCCB" },
  vs: {
    alignSelf: "center", width: 36, height: 36, borderRadius: 18, backgroundColor: "#FFFBF3",
    alignItems: "center", justifyContent: "center", marginVertical: -18, zIndex: 2, elevation: 2,
    borderWidth: 2, borderColor: "#F6F0E4",
  },
  vsText: { fontSize: 12, fontWeight: "500", color: "#2B2622" },
  tie: {
    alignSelf: "center", marginTop: 26, borderWidth: 1, borderColor: "#CDBFA6",
    borderRadius: 20, paddingHorizontal: 20, paddingVertical: 8,
  },
  tieText: { fontSize: 14, color: "#2B2622" },
  star: { fontSize: 44, color: "#D9774F" },
  big: { fontSize: 24, fontWeight: "500", color: "#2B2622", marginTop: 8 },
  done: { backgroundColor: "#D9774F", borderRadius: 22, paddingHorizontal: 34, paddingVertical: 11, marginTop: 22 },
  doneText: { color: "#fff", fontSize: 15 },
});