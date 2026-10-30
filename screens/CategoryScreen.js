import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Animated, Image, Pressable, BackHandler, RefreshControl, StyleSheet, Text, TextInput, View,
} from "react-native";
import ReAnimated, { useAnimatedRef } from "react-native-reanimated";
import Sortable from "react-native-sortables";
import { API, COLORS } from "../config";
import { authFetch } from "../api";
import Texture from "../components/Texture";

function DishTile({ dish, rank, letter, hero, onOpen }) {
  const [open, setOpen] = useState(false);
  const [height, setHeight] = useState(0);
  const anim = useRef(new Animated.Value(0)).current;

  function toggle() {
    const next = !open;
    setOpen(next);
    Animated.timing(anim, { toValue: next ? 1 : 0, duration: 280, useNativeDriver: true }).start();
  }

  const slide = anim.interpolate({ inputRange: [0, 1], outputRange: [height, 0] });
  const price = dish.price ? `₹${Number(dish.price)}` : "";
  const label = [dish.name, hero ? price : ""].filter(Boolean).join(" · ");

  return (
    <Pressable
      onPress={toggle}
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
      style={[styles.tile, hero ? styles.hero : styles.small, { backgroundColor: COLORS[dish.id % COLORS.length] }]}
    >
      {dish.photo ? (
        <Image source={{ uri: dish.photo }} style={StyleSheet.absoluteFill} />
      ) : (
        <Text style={styles.placeholder}>{letter}</Text>
      )}
      <View style={styles.badge}>
        <Text style={styles.badgeText}>#{rank}</Text>
      </View>
      <View style={styles.band}>
        <Text style={styles.dishName} numberOfLines={1}>{dish.restaurant}</Text>
        {label ? <Text style={styles.restaurant} numberOfLines={1}>{label}</Text> : null}
      </View>
      <Animated.View
        pointerEvents={open ? "auto" : "none"}
        style={[styles.pop, { transform: [{ translateY: slide }] }]}
      >
        <Text style={styles.note} numberOfLines={3}>{dish.note || "No note yet"}</Text>
        {!hero && price ? <Text style={styles.popPrice}>{price}</Text> : null}
        <Pressable
          style={styles.arrow}
          onPress={() => { setOpen(false); anim.setValue(0); onOpen(); }}
        >
          <Text style={styles.arrowText}>↗</Text>
        </Pressable>
      </Animated.View>
    </Pressable>
  );
}

function RankRow({ dish, rank, letter }) {
  const label = [dish.name, dish.price ? `₹${Number(dish.price)}` : ""].filter(Boolean).join(" · ");
  return (
    <View style={styles.rankRow}>
      <Text style={styles.rankNum}>{rank}</Text>
      {dish.photo ? (
        <Image source={{ uri: dish.photo }} style={styles.rankThumb} />
      ) : (
        <View style={[styles.rankThumb, styles.rankLetterBox, { backgroundColor: COLORS[dish.id % COLORS.length] }]}>
          <Text style={styles.rankLetter}>{letter}</Text>
        </View>
      )}
      <View style={styles.rankText}>
        <Text style={styles.rankName} numberOfLines={1}>{dish.restaurant}</Text>
        {label ? <Text style={styles.rankLabel} numberOfLines={1}>{label}</Text> : null}
      </View>
      <Text style={styles.handle}>≡</Text>
    </View>
  );
}

export default function CategoryScreen({ route, navigation }) {
  const { category } = route.params;
  const [name, setName] = useState(category.name);
  const [dishes, setDishes] = useState([]);
  const [error, setError] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [nameError, setNameError] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [rearranging, setRearranging] = useState(false);
  const [draft, setDraft] = useState(category.name);
  const [rankDraft, setRankDraft] = useState([]);  const [saving, setSaving] = useState(false);
  const scrollRef = useAnimatedRef();

  function loadDishes() {
    return authFetch(`${API}/dishes/?category=${category.id}`)
      .then((res) => res.json())
      .then((data) => { setDishes(data); setError(""); })
      .catch(() => setError("Could not reach the server"));
  }

  useFocusEffect(useCallback(() => { loadDishes(); }, []));

  async function saveName() {
    const trimmed = draft.trim();
    if (!trimmed) return setNameError("Enter a name");
    try {
      const res = await authFetch(`${API}/categories/${category.id}/`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) return setNameError("That name is taken");
      const data = await res.json();
      setName(data.name);
      setRenaming(false);
      setNameError("");
    } catch {
      setNameError("Could not reach the server");
    }
  }

  function startRearrange() {
    setRankDraft(dishes);
    setRearranging(true);
  }

  async function saveOrder() {
    if (rankDraft.every((d, i) => d.id === dishes[i].id)) {
      setRearranging(false);
      return;
    }
    setSaving(true);
    try {
      const res = await authFetch(`${API}/dishes/order/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: category.id, order: rankDraft.map((d) => d.id) }),
      });
      if (!res.ok) throw new Error("bad response");
      setRearranging(false);
      await loadDishes();
    } catch {
      setError("Could not save the new order");
    }
    setSaving(false);
  }

  function goBack() {
    if (rearranging) setRearranging(false);
    else navigation.goBack();
  }

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (rearranging) {
          setRearranging(false);
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [rearranging])
  );

  const letter = name.charAt(0).toUpperCase();

  return (
    <View style={styles.screen}>
      <Texture />
      <ReAnimated.ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.page}
        refreshControl={
          rearranging ? undefined : (
            <RefreshControl
              refreshing={refreshing}
              tintColor="#D9774F"
              colors={["#D9774F"]}
              onRefresh={() => { setRefreshing(true); loadDishes().finally(() => setRefreshing(false)); }}
            />
          )
        }
      >
        <Pressable onPress = {goBack}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>

        {renaming ? (
          <View style={styles.renameBox}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={(t) => { setDraft(t); setNameError(""); }}
              autoFocus
              autoCapitalize="words"
              onSubmitEditing={saveName}
            />
            {nameError ? <Text style={styles.error}>{nameError}</Text> : null}
            <View style={styles.row}>
              <Pressable style={styles.okBtn} onPress={saveName}><Text style={styles.okText}>Save</Text></Pressable>
              <Pressable
                style={styles.cancelBtn}
                onPress={() => { setRenaming(false); setDraft(name); setNameError(""); }}
              >
                <Text style={styles.cancelText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={styles.titleRow}>
            <Text style={styles.title}>{name}</Text>
            <Pressable onPress={() => { setDraft(name); setRenaming(true); }}>
              <Text style={styles.pencil}>✎</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.subRow}>
          <Text style={styles.sub}>
            {dishes.length} {dishes.length === 1 ? "dish" : "dishes"}
          </Text>
          {dishes.length > 1 ? (
            rearranging ? (
              <View style={styles.rearrangeActions}>
                <Pressable onPress={() => setRearranging(false)} disabled={saving}>
                  <Text style={styles.rearrangeCancel}>Cancel</Text>
                </Pressable>
                <Pressable onPress={saveOrder} disabled={saving}>
                  <Text style={styles.rearrange}>{saving ? "Saving..." : "Done"}</Text>
                </Pressable>
              </View>
            ) : (
              <Pressable
                onPress={startRearrange}
                hitSlop={10}
                android_ripple={{ color: '#00000020' }}
                style={({ pressed }) => ({
                  alignSelf: 'flex-start',
                  paddingVertical: 8,
                  paddingHorizontal: 16,
                  borderRadius: 999,
                  backgroundColor: '#FFFBF3',
                  borderWidth: 1,
                  borderColor: '#00000015',
                  overflow: 'hidden',
                  opacity: pressed ? 0.7 : 1,
                  transform: [{ scale: pressed ? 0.96 : 1 }],
                })}
              >
                <Text style={styles.rearrange}>Rearrange</Text>
              </Pressable>
            )
          ) : null}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {dishes.length === 0 && !error ? (
          <Text style={styles.empty}>No dishes yet. Tap + Add dish to add your first.</Text>
        ) : null}

        {rearranging ? (
          <>
            <Text style={styles.hint}>Hold a dish, then drag it to a new spot</Text>
            <Sortable.Grid
              columns={1}
              data={rankDraft}
              rowGap={8}
              enableActiveItemSnap={false}
              activeItemScale={1.02}
              keyExtractor={(d) => String(d.id)}
              scrollableRef={scrollRef}
              onDragEnd={({ data }) => setRankDraft(data)}
              renderItem={({ item }) => (
                <RankRow
                  dish={item}
                  rank={rankDraft.findIndex((d) => d.id === item.id) + 1}
                  letter={letter}
                />
              )}
            />
          </>
        ) : (
          <>
            {dishes[0] ? (
              <DishTile
                dish={dishes[0]} rank={1} letter={letter} hero
                onOpen={() => navigation.navigate("Detail", { id: dishes[0].id })}
              />
            ) : null}
            <View style={styles.grid}>
              {dishes.slice(1).map((d, i) => (
                <DishTile
                  key={d.id} dish={d} rank={i + 2} letter={letter}
                  onOpen={() => navigation.navigate("Detail", { id: d.id })}
                />
              ))}
            </View>
          </>
        )}
      </ReAnimated.ScrollView>

      {!rearranging ? (
        <Pressable
          style={styles.addPill}
          onPress={() => navigation.navigate("AddDish", { category: { id: category.id, name } })}
        >
          <Text style={styles.addText}>+ Add dish</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F0E4" },
  page: { padding: 20, paddingTop: 60, paddingBottom: 110 },
  back: { fontSize: 15, color: "#6B6054", marginBottom: 12 },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  title: { fontSize: 28, fontWeight: "500", color: "#2B2622" },
  pencil: { fontSize: 20, color: "#6B6054" },
  subRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 2, marginBottom: 16 },
  sub: { fontSize: 13, color: "#6B6054" },
  rearrange: { fontSize: 14, color: "#A6492F" },
  hint: { fontSize: 12, color: "#6B6054", marginBottom: 10 },
  error: { color: "#A32D2D", marginBottom: 8 },
  empty: { fontSize: 14, color: "#6B6054", marginTop: 20 },
  renameBox: { marginBottom: 4 },
  input: {
    height: 40, backgroundColor: "#FFFBF3", borderWidth: 1, borderColor: "#D6C9B0",
    borderRadius: 12, paddingHorizontal: 12, fontSize: 16, color: "#2B2622",
  },
  row: { flexDirection: "row", gap: 6, marginTop: 8 },
  okBtn: { backgroundColor: "#D9774F", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 6 },
  okText: { color: "#fff", fontSize: 14 },
  cancelBtn: { borderWidth: 1, borderColor: "#CDBFA6", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 6 },
  cancelText: { color: "#2B2622", fontSize: 14 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  tile: { borderRadius: 18, overflow: "hidden", marginBottom: 10 },
  hero: { height: 170 },
  small: { height: 150, width: "48.5%" },
  placeholder: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0, textAlign: "center",
    textAlignVertical: "center", fontSize: 48, color: "rgba(255,251,243,0.5)",
  },
  badge: {
    position: "absolute", top: 8, left: 8, backgroundColor: "#FFFBF3",
    borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
  },
  badgeText: { fontSize: 12, fontWeight: "500", color: "#2B2622" },
  band: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(43,38,34,0.8)", paddingHorizontal: 10, paddingVertical: 7,
  },
  dishName: { fontSize: 14, fontWeight: "500", color: "#FFFBF3" },
  restaurant: { fontSize: 12, color: "#E6DCCB" },
  pop: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(43,38,34,0.75)", padding: 12, paddingTop: 42,
    justifyContent: "space-between",
  },
  note: { fontSize: 13, lineHeight: 19, color: "#FFFBF3" },
  popPrice: { fontSize: 12, color: "#E6DCCB" },
  arrow: {
    position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#FFFBF3", alignItems: "center", justifyContent: "center",
  },
  arrowText: { fontSize: 16, color: "#2B2622" },
  rankRow: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFFBF3",
    borderRadius: 16, padding: 10,
  },
  rankNum: { width: 22, textAlign: "center", fontSize: 16, fontWeight: "500", color: "#6B6054" },
  rankThumb: { width: 50, height: 50, borderRadius: 14, backgroundColor: "#E9DFC9" },
  rankLetterBox: { alignItems: "center", justifyContent: "center" },
  rankLetter: { color: "#fff", fontSize: 20, fontWeight: "500" },
  rankText: { flex: 1 },
  rankName: { fontSize: 15, fontWeight: "500", color: "#2B2622" },
  rankLabel: { fontSize: 12, color: "#6B6054", marginTop: 1 },
  handle: { fontSize: 22, color: "#8C8073", paddingHorizontal: 4 },
  addPill: {
    position: "absolute", bottom: 28, alignSelf: "center", backgroundColor: "#D9774F",
    borderRadius: 22, paddingHorizontal: 22, paddingVertical: 11,
  },
  rearrangeActions: { flexDirection: "row", alignItems: "center", gap: 18 },
  rearrangeCancel: { fontSize: 14, color: "#6B6054" },
  addText: { color: "#fff", fontSize: 15 },
});