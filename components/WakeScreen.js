import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, StyleSheet, Text } from "react-native";
import { BRAND } from "../brand";
import Texture from "./Texture";

export default function WakeScreen({ visible }) {
  const [mounted, setMounted] = useState(visible);
  const fade = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
      Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    } else {
      Animated.timing(fade, { toValue: 0, duration: 350, useNativeDriver: true }).start(({ finished }) => {
        if (finished) setMounted(false);
      });
    }
  }, [visible]);

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

  if (!mounted) return null;

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.07] });

  return (
    <Animated.View style={[styles.wrap, { opacity: fade }]}>
      <Texture />
      <Animated.Image
        source={require("../assets/icon.png")}
        style={[styles.logo, { transform: [{ scale }] }]}
      />
      <Text style={styles.name}>{BRAND.name}</Text>
      <Text style={styles.motto}>{BRAND.motto}</Text>
      <ActivityIndicator color="#D9774F" style={styles.spinner} />
      <Text style={styles.msg}>Waking up the server. This can take a minute.</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    ...StyleSheet.absoluteFillObject, backgroundColor: "#F6F0E4", alignItems: "center",
    justifyContent: "center", zIndex: 100, elevation: 100,
  },
  logo: { width: 96, height: 96, borderRadius: 24, marginBottom: 14 },
  name: { fontSize: 30, fontWeight: "500", color: "#2B2622" },
  motto: { fontSize: 14, color: "#6B6054", marginTop: 3 },
  spinner: { marginTop: 36 },
  msg: { fontSize: 13, color: "#8C8073", marginTop: 12, paddingHorizontal: 40, textAlign: "center" },
});