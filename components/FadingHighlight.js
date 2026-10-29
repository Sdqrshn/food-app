import { useEffect, useState } from "react";
import { Animated, Easing, Text } from "react-native";

export default function FadingHighlight({
  text, query, style, numberOfLines, runKey, color = "246, 217, 139", textColor = "#2B2622",
}) {
  const [alpha, setAlpha] = useState(0);
  const needle = (query || "").trim().toLowerCase();

  useEffect(() => {
    if (!needle) return;
    setAlpha(0);
    const fade = new Animated.Value(0);
    // round to 2% steps so it doesn't re-render more often than needed
    const id = fade.addListener(({ value }) => setAlpha(Math.round(value * 50) / 50));
    Animated.sequence([
      Animated.delay(100),
      Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: false }),
      Animated.delay(700),
      Animated.timing(fade, {
        toValue: 0, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: false,
      }),
    ]).start();
    return () => {
      fade.removeListener(id);
      fade.stopAnimation();
    };
  }, [needle, runKey]);

  if (!needle || !text) {
    return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;
  }

  const hitStyle = { backgroundColor: `rgba(${color}, ${alpha})`, color: textColor };
  
  const lower = text.toLowerCase();
  const parts = [];
  let i = 0;
  while (i < text.length) {
    const at = lower.indexOf(needle, i);
    if (at === -1) {
      parts.push({ t: text.slice(i), hit: false });
      break;
    }
    if (at > i) parts.push({ t: text.slice(i, at), hit: false });
    parts.push({ t: text.slice(at, at + needle.length), hit: true });
    i = at + needle.length;
  }

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((p, k) => (p.hit ? <Text key={k} style={hitStyle}>{p.t}</Text> : p.t))}
    </Text>
  );
}