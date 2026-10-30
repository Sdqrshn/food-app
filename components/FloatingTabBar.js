import { createContext, useContext, useEffect, useMemo } from "react";
import { Pressable, StyleSheet, Text, View, Keyboard, Platform } from "react-native";
import Animated, {
  Easing, Extrapolation, interpolate, useAnimatedScrollHandler, useAnimatedStyle,
  useSharedValue, withSpring, withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../AuthContext";

const SLOT_W = 76;
const SLOT_H = 50;
const PAD = 7;
const BAR_H = SLOT_H + PAD * 2;
const BAR_W = SLOT_W * 3 + PAD * 2;
const BOTTOM_GAP = 16;

const ACTIVE = "#D9774F";
const INACTIVE = "#8C8073";

// EDIT THIS ONE LINE: return the first letter HomeScreen shows in the top-left avatar
   function useProfileInitial() {
     const { user } = useAuth();
     return (user?.display_name || "?").charAt(0).toUpperCase();
   }

/* ---------- show/hide state shared with screens ---------- */

const TabBarContext = createContext(null);

export function TabBarProvider({ children }) {
  const progress = useSharedValue(0); // 0 = visible, 1 = hidden
  const isHidden = useSharedValue(false);
  const value = useMemo(() => ({ progress, isHidden }), [progress, isHidden]);
  return <TabBarContext.Provider value={value}>{children}</TabBarContext.Provider>;
}

function showBar(ctx) {
  "worklet";
  if (!ctx.isHidden.value) return;
  ctx.isHidden.value = false;
  ctx.progress.value = withSpring(0, { damping: 11, stiffness: 170, mass: 0.8 }); // bouncy return
}

function hideBar(ctx) {
  "worklet";
  if (ctx.isHidden.value) return;
  ctx.isHidden.value = true;
  ctx.progress.value = withTiming(1, { duration: 240, easing: Easing.in(Easing.cubic) }); // falls
}

// Use on a Reanimated ScrollView/FlatList: onScroll={useTabBarScroll()}
export function useTabBarScroll() {
  const ctx = useContext(TabBarContext);
  const lastY = useSharedValue(0);
  return useAnimatedScrollHandler({
    onBeginDrag: (e) => {
      lastY.value = e.contentOffset.y;
    },
    onScroll: (e) => {
      if (!ctx) return;
      const y = e.contentOffset.y;
      const dy = y - lastY.value;
      lastY.value = y;
      if (y <= 8) showBar(ctx);
      else if (dy > 4) hideBar(ctx);
      else if (dy < -2) showBar(ctx); // even a small upward scroll
    },
  });
}

/* ---------- the bar ---------- */

const META = {
  ToEat: { label: "To eat", on: "bookmark", off: "bookmark-outline" },
  Rankings: { label: "Rankings", on: "trophy", off: "trophy-outline" },
  Account: { label: "Profile" },
};

function TabItem({ name, focused, onPress, initial }) {
  const meta = META[name] || { label: name, on: "ellipse", off: "ellipse-outline" };
  const scale = useSharedValue(1);

  useEffect(() => {
    scale.value = withSpring(focused ? 1.12 : 1, { damping: 8, stiffness: 220 });
  }, [focused]);

  const iconStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Pressable
      onPress={onPress}
      style={styles.slot}
      accessibilityRole="button"
      accessibilityLabel={meta.label}
      accessibilityState={{ selected: focused }}
    >
      <Animated.View style={iconStyle}>
        {name === "Account" ? (
          <View style={[styles.avatar, !focused && { opacity: 0.8 }]}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
        ) : (
          <Ionicons name={focused ? meta.on : meta.off} size={25} color={focused ? ACTIVE : INACTIVE} />
        )}
      </Animated.View>
    </Pressable>
  );
}

export default function FloatingTabBar({ state, navigation }) {
  const ctx = useContext(TabBarContext);
  const insets = useSafeAreaInsets();
  const initial = useProfileInitial();
  const index = state.index;

  const x = useSharedValue(index * SLOT_W);
  const target = useSharedValue(index * SLOT_W);
  const kb = useSharedValue(0);

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const a = Keyboard.addListener(showEvt, () => { kb.value = withTiming(1, { duration: 200 }); });
    const b = Keyboard.addListener(hideEvt, () => { kb.value = withTiming(0, { duration: 200 }); });
    return () => { a.remove(); b.remove(); };
  }, []);

  useEffect(() => {
    target.value = index * SLOT_W;
    x.value = withSpring(index * SLOT_W, { damping: 12, stiffness: 190, mass: 0.9 });
    if (ctx) showBar(ctx); // switching tabs always brings the bar back
  }, [index]);

  // pill slides with a bounce and stretches a little while travelling
  const pillStyle = useAnimatedStyle(() => {
    const dist = Math.abs(target.value - x.value);
    return {
      transform: [
        { translateX: x.value },
        { scaleX: 1 + Math.min(dist / SLOT_W, 1) * 0.15 },
      ],
    };
  });

  const hideDistance = BAR_H + BOTTOM_GAP + insets.bottom + 24;
  const barStyle = useAnimatedStyle(() => {
    const p0 = ctx ? ctx.progress.value : 0;
    const p = kb.value > 0 ? Math.max(p0, kb.value) : p0;
    return {
      transform: [{ translateY: p * hideDistance }],
      opacity: interpolate(p, [0, 0.8, 1], [1, 0.7, 0], Extrapolation.CLAMP),
    };
  });

  return (
    <Animated.View
      pointerEvents="box-none"
      style={[styles.wrap, { bottom: insets.bottom + BOTTOM_GAP }, barStyle]}
    >
      <View style={styles.bar}>
        <Animated.View style={[styles.pill, pillStyle]} />
        {state.routes.map((route, i) => {
          const focused = index === i;
          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
          };
          return (
            <TabItem key={route.key} name={route.name} focused={focused} onPress={onPress} initial={initial} />
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
  bar: {
    width: BAR_W, height: BAR_H, padding: PAD, flexDirection: "row",
    borderRadius: BAR_H / 2, backgroundColor: "#FFFBF3",
    borderWidth: 1, borderColor: "#EFE5D0",
    shadowColor: "#2B2622", shadowOpacity: 0.18, shadowRadius: 14, shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  pill: {
    position: "absolute", left: PAD, top: PAD, width: SLOT_W, height: SLOT_H,
    borderRadius: SLOT_H / 2, backgroundColor: "#F8DDD0",
  },
  slot: { width: SLOT_W, height: SLOT_H, alignItems: "center", justifyContent: "center" },
  avatar: {
    width: 30, height: 30, borderRadius: 15, backgroundColor: ACTIVE,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 14, fontWeight: "500" },
});