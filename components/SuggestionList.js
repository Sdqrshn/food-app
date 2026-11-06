import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Highlight from "./Highlight";

export default function SuggestionList({ items, query, onPick, footer }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.box,
        { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-6, 0] }) }] },
      ]}
    >
      {items.map((it, i) => (
        <Pressable
          key={it.key}
          style={({ pressed }) => [styles.row, i > 0 && styles.sep, pressed && styles.pressed]}
          onPress={() => onPick(it)}
        >
          <View style={[styles.icon, it.kind === "new" && styles.iconNew]}>
            <Ionicons name={it.icon} size={16} color={it.kind === "new" ? "#fff" : "#A6492F"} />
          </View>
          <View style={styles.text}>
            <Highlight
              text={it.title}
              query={it.kind === "new" ? "" : query}
              style={styles.title}
              hitStyle={styles.hit}
              numberOfLines={1}
            />
            {it.subtitle ? <Text style={styles.sub} numberOfLines={1}>{it.subtitle}</Text> : null}
          </View>

        </Pressable>
      ))}
      {footer ? (
        <Pressable style={[styles.row, styles.sep, styles.footer]} onPress={footer.onPress}>
          <Ionicons name="search-outline" size={15} color="#A6492F" />
          <Text style={styles.footerText}>{footer.label}</Text>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  box: {
    marginTop: -4, marginBottom: 14, backgroundColor: "#FFFBF3", borderRadius: 16, borderWidth: 1,
    borderColor: "#EADFC8", overflow: "hidden", elevation: 4,
    shadowColor: "#2B2622", shadowOpacity: 0.1, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 12, paddingVertical: 10 },
  sep: { borderTopWidth: 0.5, borderTopColor: "#EFE6D3" },
  pressed: { backgroundColor: "#F8F0DF" },
  icon: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: "#F4E3B8",
    alignItems: "center", justifyContent: "center",
  },
  iconNew: { backgroundColor: "#D9774F" },
  text: { flex: 1 },
  title: { fontSize: 14, color: "#2B2622" },
  hit: { fontWeight: "700", color: "#A6492F" },
  sub: { fontSize: 12, color: "#6B6054", marginTop: 1 },
  badge: {
    fontSize: 10, color: "#27500A", backgroundColor: "#E6EFDD", borderRadius: 8,
    paddingHorizontal: 7, paddingVertical: 2, overflow: "hidden",
  },
  footer: { backgroundColor: "#FBF3E2" },
  footerText: { fontSize: 13, color: "#A6492F" },
});