import { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Modal, StyleSheet, Text, View } from "react-native";
import { BRAND } from "../brand";
import Texture from "./Texture";

export default function WakeScreen({ visible }) {
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });

  return (
    <Modal
      visible={visible}
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={() => {}}
    >
      <View style={styles.wrap}>
        <Texture />
        <Animated.Image
          source={require("../assets/logo.png")}
          style={[styles.logo, { transform: [{ scale }] }]}
        />
        <Text style={styles.name}>{BRAND.name}</Text>
        <Text style={styles.motto}>{BRAND.motto}</Text>
        <ActivityIndicator color="#D9774F" style={styles.spinner} />
        <Text style={styles.msg}>Waking up the server. This can take a minute.</Text>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#F6F0E4", alignItems: "center", justifyContent: "center" },
  logo: { width: 96, height: 96, borderRadius: 24, marginBottom: 14 },
  name: { fontSize: 30, fontWeight: "500", color: "#2B2622" },
  motto: { fontSize: 14, color: "#6B6054", marginTop: 3 },
  spinner: { marginTop: 36 },
  msg: { fontSize: 13, color: "#8C8073", marginTop: 12, paddingHorizontal: 40, textAlign: "center" },
});