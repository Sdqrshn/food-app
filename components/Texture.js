import { useMemo } from "react";
import { StyleSheet, useWindowDimensions } from "react-native";
import Svg, { Path } from "react-native-svg";

const GAP = 3;
const COLOR = "#A89877";
const LEVELS = [0.05, 0.09, 0.14]; // thread strengths

function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function build(w, h) {
  const rand = rng(11);
  const thin = LEVELS.map(() => "");
  let slub = "";
  const add = (p, vertical) => {
    const d = vertical ? `M${p} 0V${h}` : `M0 ${p}H${w}`;
    if (rand() > 0.9) slub += d;
    else thin[Math.floor(rand() * LEVELS.length)] += d;
  };
  for (let x = 1.5; x < w; x += GAP) add(x, true);
  for (let y = 1.5; y < h; y += GAP) add(y, false);
  return { thin, slub };
}

export default function Texture() {
  const { width, height } = useWindowDimensions();
  const { thin, slub } = useMemo(() => build(width, height + 120), [width, height]);
  return (
    <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
      {thin.map((d, i) => (
        <Path key={i} d={d} stroke={COLOR} strokeWidth={0.8} opacity={LEVELS[i]} />
      ))}
      <Path d={slub} stroke={COLOR} strokeWidth={1.6} opacity={0.08} />
    </Svg>
  );
}