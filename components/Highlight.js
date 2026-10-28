import { Text } from "react-native";

export default function Highlight({ text, query, style, hitStyle, numberOfLines }) {
  const needle = (query || "").trim().toLowerCase();
  if (!needle || !text) {
    return <Text style={style} numberOfLines={numberOfLines}>{text}</Text>;
  }
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