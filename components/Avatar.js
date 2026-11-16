import { ActivityIndicator, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

export default function Avatar({ user, size = 40, pencil = false, busy = false, onPress }) {
  const initial = (user?.display_name || "?").charAt(0).toUpperCase();
  const badge = Math.round(size * 0.32);

  const body = (
    <View style={{ width: size, height: size }}>
      <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2 }]}>
        {user?.photo ? (
          <Image source={{ uri: user.photo }} style={{ width: size, height: size }} />
        ) : (
          <Text style={[styles.letter, { fontSize: size * 0.42 }]}>{initial}</Text>
        )}
        {busy ? (
          <View style={styles.busy}>
            <ActivityIndicator color="#fff" />
          </View>
        ) : null}
      </View>
      {pencil ? (
        <View style={[styles.pencil, { width: badge, height: badge, borderRadius: badge / 2 }]}>
          <Ionicons name="pencil" size={Math.max(11, Math.round(badge * 0.5))} color="#2B2622" />
        </View>
      ) : null}
    </View>
  );

  return onPress ? <Pressable onPress={onPress}>{body}</Pressable> : body;
}

const styles = StyleSheet.create({
  circle: { backgroundColor: "#D9774F", alignItems: "center", justifyContent: "center", overflow: "hidden" },
  letter: { color: "#fff", fontWeight: "500" },
  busy: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(43,38,34,0.45)", alignItems: "center", justifyContent: "center" },
  pencil: {
    position: "absolute", right: -2, bottom: -2, backgroundColor: "#FFFBF3",
    borderWidth: 1.5, borderColor: "#D6C9B0", alignItems: "center", justifyContent: "center",
  },
});