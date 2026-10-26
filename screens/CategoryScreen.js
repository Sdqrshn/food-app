import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Alert, Animated, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { API, COLORS } from "../config";
import Texture from "../components/Texture";
import { authFetch } from "../api";

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
        {dish.name || (hero && price) ? (
          <Text style={styles.restaurant} numberOfLines={1}>
            {[dish.name, hero ? price : ""].filter(Boolean).join(" · ")}
          </Text>
        ) : null}
      </View>
      <Animated.View
        pointerEvents={open ? "auto" : "none"}
        style={[styles.pop, { transform: [{ translateY: slide }] }]}
      >
        <Text style={styles.note} numberOfLines={2}>{dish.note || "No note yet"}</Text>
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

export default function CategoryScreen({ route, navigation }) {
  const { category } = route.params;
  const [name, setName] = useState(category.name);
  const [dishes, setDishes] = useState([]);
  const [error, setError] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState(category.name);
  const [nameError, setNameError] = useState("");

  useFocusEffect(
    useCallback(() => {
      authFetch(`${API}/dishes/?category=${category.id}`)
        .then((res) => res.json())
        .then((data) => { setDishes(data); setError(""); })
        .catch(() => setError("Could not reach the server"));
    }, [])
  );

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

  const letter = name.charAt(0).toUpperCase();

  return (
    <View style={styles.screen}>
      <Texture />
      <ScrollView contentContainerStyle={styles.page}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>

        {renaming ? (
          <View style={styles.renameBox}>
            <TextInput
              style={styles.input}
              value={draft}
              onChangeText={(t) => { setDraft(t); setNameError(""); }}
              autoFocus
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
        <Text style={styles.sub}>
          {dishes.length} {dishes.length === 1 ? "dish" : "dishes"}
        </Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}

        {dishes.length === 0 && !error ? (
          <Text style={styles.empty}>No dishes yet. Tap + Add dish to add your first.</Text>
        ) : null}

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
      </ScrollView>

      <Pressable
        style={styles.addPill}
        onPress={() => navigation.navigate("AddDish", { category: { id : category.id, name} })}
      >
        <Text style={styles.addText}>+ Add dish</Text>
      </Pressable>
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
  sub: { fontSize: 13, color: "#6B6054", marginTop: 2, marginBottom: 16 },
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
  addPill: {
    position: "absolute", bottom: 28, alignSelf: "center", backgroundColor: "#D9774F",
    borderRadius: 22, paddingHorizontal: 22, paddingVertical: 11,
  },
  addText: { color: "#fff", fontSize: 15 },
});