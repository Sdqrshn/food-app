import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Texture from "../components/Texture";

export default function SavedScreen({ route, navigation }) {
  const { title, subtitle } = route.params;
  const pop = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }).start();
  }, []);

  return (
    <View style={[styles.screen, styles.center]}>
      <Texture />
      <Animated.View style={[styles.badge, { opacity: pop, transform: [{ scale: pop }] }]}>
        <Ionicons name="file-tray-full-outline" size={36} color="#fff" />
      </Animated.View>
      <Text style={styles.big}>{title}</Text>
      {subtitle ? <Text style={styles.sub}>{subtitle}</Text> : null}
      <Text style={styles.note}>No ranking here. Sort it into a category any time.</Text>
      <Pressable style={styles.done} onPress={() => navigation.goBack()}>
        <Text style={styles.doneText}>Done</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F0E4", padding: 24 },
  center: { alignItems: "center", justifyContent: "center" },
  badge: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: "#A89F8F",
    alignItems: "center", justifyContent: "center", marginBottom: 16,
  },
  big: { fontSize: 24, fontWeight: "500", color: "#2B2622", textAlign: "center" },
  sub: { fontSize: 14, color: "#6B6054", marginTop: 4, textAlign: "center" },
  note: { fontSize: 13, color: "#8C8073", marginTop: 14, textAlign: "center" },
  done: { backgroundColor: "#D9774F", borderRadius: 22, paddingHorizontal: 34, paddingVertical: 11, marginTop: 24 },
  doneText: { color: "#fff", fontSize: 15 },
});