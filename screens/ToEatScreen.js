import { StyleSheet, Text, View } from "react-native";
import Texture from "../components/Texture";

export default function ToEatScreen() {
  return (
    <View style={styles.screen}>
      <Texture />
      <View style={styles.center}>
        <Text style={styles.title}>To eat</Text>
        <Text style={styles.sub}>Coming soon</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F0E4" },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  title: { fontSize: 28, fontWeight: "500", color: "#2B2622" },
  sub: { fontSize: 14, color: "#6B6054", marginTop: 4 },
});