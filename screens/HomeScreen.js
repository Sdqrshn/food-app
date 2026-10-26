import { useCallback, useEffect, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import ReAnimated, { useAnimatedRef } from "react-native-reanimated";
import Sortable from "react-native-sortables";
import {
  Animated, Image, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { API, COLORS, PLACEHOLDER } from "../config";
import Texture from "../components/Texture";
import ConfirmModal from "../components/ConfirmModal";
import { authFetch } from "../api";
import { useAuth } from "../AuthContext";

function CategoryCard({ category, index, editMode, inGrid, onPress, onDelete }) {
  const anim = useRef(new Animated.Value(inGrid ? 1 : 0)).current;

  useEffect(() => {
    if (inGrid) return;
    Animated.timing(anim, {
      toValue: 1,
      duration: 450,
      delay: index * 80,
      useNativeDriver: true,
    }).start();
  }, []);

  const color = COLORS[category.id % COLORS.length];
  const count = category.dish_count;
  const slide = anim.interpolate({ inputRange: [0, 1], outputRange: [16, 0] });

  return (
    <Animated.View
      style={[inGrid ? styles.gridCell : styles.cardWrap, { opacity: anim, transform: [{ translateY: slide }] }]}
    >
      <Pressable
        onPress={editMode ? undefined : onPress}
        style={({ pressed }) => [styles.square, pressed && !editMode && styles.pressed]}
      >
        <View style={[styles.layer, styles.layer1, { backgroundColor: color }]} />
        <View style={[styles.layer, styles.layer2, { backgroundColor: color }]} />
        <View style={styles.front}>
          {category.top_photo ? (
            <View style={[styles.photoCircle, { borderColor: color }]}>
              <Image source={{ uri: category.top_photo }} style={styles.photo} />
            </View>
          ) : (
            <View style={[styles.letterCircle, { backgroundColor: color }]}>
              <Text style={styles.letterText}>{category.name.charAt(0).toUpperCase()}</Text>
            </View>
          )}

          {editMode ? (
            <Pressable style={styles.delete} onPress={onDelete}>
              <Text style={styles.deleteText}>✕</Text>
            </Pressable>
          ) : null}

          <View>
            <Text style={styles.cardName} numberOfLines={1}>{category.name}</Text>
            <Text style={styles.cardSub}>
              {count === 0 ? "No dishes yet" : count === 1 ? "1 dish" : `${count} dishes`}
            </Text>
            {category.top_dish ? (
              <Text style={styles.cardSub} numberOfLines={1}>#1 {category.top_dish}</Text>
            ) : null}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

function NewCategory({ onAdded }) {
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState("");

  async function add() {
    const trimmed = name.trim();
    if (!trimmed) return setError("Enter a category name");
    try {
      const res = await authFetch(`${API}/categories/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) return setError("That category already exists");
      setName("");
      setError("");
      setEditing(false);
      onAdded();
    } catch {
      setError("Could not reach the server");
    }
  }

  if (!editing) {
    return (
      <Pressable style={styles.newTile} onPress={() => setEditing(true)}>
        <Text style={styles.plus}>+</Text>
        <Text style={styles.newText}>New category</Text>
      </Pressable>
    );
  }

  return (
    <View style={styles.newTile}>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={(t) => { setName(t); setError(""); }}
        placeholder="Biryani"
        placeholderTextColor={PLACEHOLDER}
        autoFocus
        onSubmitEditing={add}
      />
      {error ? <Text style={styles.tileError}>{error}</Text> : null}
      <View style={styles.row}>
        <Pressable style={styles.okBtn} onPress={add}>
          <Text style={styles.okText}>Add</Text>
        </Pressable>
        <Pressable
          style={styles.cancelBtn}
          onPress={() => { setEditing(false); setName(""); setError(""); }}
        >
          <Text style={styles.cancelText}>Cancel</Text>
        </Pressable>
      </View>
    </View>
  );
}

export default function HomeScreen({ navigation }) {
  const [categories, setCategories] = useState([]);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const scrollRef = useAnimatedRef();
  const { user } = useAuth();

  function load() {
    authFetch(`${API}/categories/`)
      .then((res) => res.json())
      .then((data) => { setCategories(data); setError(""); })
      .catch(() => setError("Could not reach the server"));
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  async function saveOrder(next) {
    setCategories(next);
    try {
      const res = await authFetch(`${API}/categories/reorder/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ order: next.map((c) => c.id) }),
      });
      if (!res.ok) throw new Error("bad response");
    } catch {
      setError("Could not save the new order");
      load();
    }
  }

  function deleteMessage(c) {
    const n = c.dish_count;
    const extra = n === 0 ? "" : ` This also deletes its ${n} ${n === 1 ? "dish" : "dishes"}.`;
    return `This cannot be undone.${extra}`;
  }

  async function remove(id) {
    try {
      const res = await authFetch(`${API}/categories/${id}/`, { method: "DELETE" });
      if (!res.ok) throw new Error("bad response");
      load();
    } catch {
      setError("Could not delete the category");
    }
  }

  const inEdit = editMode && categories.length > 0;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <ReAnimated.ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.page}
        keyboardShouldPersistTaps="handled"
      >
        <Texture />
        <View style={styles.topRow}>
          <Pressable style={styles.avatar} onPress={() => navigation.navigate("Account")}>
            <Text style={styles.avatarText}>
              {(user?.display_name || "?").charAt(0).toUpperCase()}
            </Text>
          </Pressable>
          <Text style={styles.hi}>Hi, {user?.display_name}</Text>
        </View>
        <View style={styles.headRow}>
          <View>
            <Text style={styles.title}>Your rankings</Text>
            <Text style={styles.sub}>
              {categories.length} {categories.length === 1 ? "category" : "categories"}
            </Text>
          </View>
          {categories.length > 0 ? (
            <Pressable onPress={() => setEditMode(!editMode)}>
              <Text style={styles.editBtn}>{inEdit ? "Done" : "Edit"}</Text>
            </Pressable>
          ) : null}
        </View>
        {error ? <Text style={styles.error}>{error}</Text> : null}
        {inEdit ? <Text style={styles.hint}>Hold a card, then drag to rearrange</Text> : null}
        {inEdit ? (
          <Sortable.Grid
            columns={2}
            data={categories}
            rowGap={12}
            columnGap={12}
            keyExtractor={(c) => String(c.id)}
            scrollableRef={scrollRef}
            onDragEnd={({ data }) => saveOrder(data)}
            renderItem={({ item }) => (
              <CategoryCard
                category={item}
                index={0}
                editMode
                inGrid
                onDelete={() => setPendingDelete(item)}
              />
            )}
          />
        ) : (
          <View style={styles.grid}>
            {categories.map((c, i) => (
              <CategoryCard
                key={c.id}
                category={c}
                index={i}
                onPress={() => navigation.navigate("Category", { category: c })}
              />
            ))}
            <View style={styles.cardWrap}>
              <View style={styles.square}>
                <NewCategory onAdded={load} />
              </View>
            </View>
          </View>
        )}

        <ConfirmModal
          visible={!!pendingDelete}
          title={pendingDelete ? `Delete ${pendingDelete.name}?` : ""}
          message={pendingDelete ? deleteMessage(pendingDelete) : ""}
          confirmText="Delete"
          danger
          onConfirm={() => { const id = pendingDelete.id; setPendingDelete(null); remove(id); }}
          onCancel={() => setPendingDelete(null)}
        />
      </ReAnimated.ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F0E4" },
  page: { padding: 20, paddingTop: 70, paddingBottom: 40, flexGrow: 1 },
  headRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  title: { fontSize: 28, fontWeight: "500", color: "#2B2622" },
  sub: { fontSize: 13, color: "#6B6054", marginTop: 2 },
  editBtn: { fontSize: 16, color: "#A6492F", paddingVertical: 6, paddingLeft: 12 },
  error: { color: "#A32D2D", marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  cardWrap: { width: "48.5%", marginBottom: 12 },
  square: { aspectRatio: 1, marginRight: 8, marginBottom: 8 },
  pressed: { transform: [{ scale: 0.97 }] },
  layer: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, borderRadius: 16 },
  layer1: { opacity: 0.35, transform: [{ translateX: 8 }, { translateY: 8 }] },
  layer2: { opacity: 0.6, transform: [{ translateX: 4 }, { translateY: 4 }] },
  front: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "#FFFBF3",
    borderRadius: 16, padding: 11, justifyContent: "space-between", overflow: "hidden",
  },
  photoCircle: {
    width: 68, height: 68, borderRadius: 34, borderWidth: 3, overflow: "hidden",
    backgroundColor: "#E9DFC9",
  },
  photo: { width: "100%", height: "100%" },
  letterCircle: { width: 54, height: 54, borderRadius: 27, alignItems: "center", justifyContent: "center" },
  letterText: { color: "#fff", fontSize: 19, fontWeight: "500" },
  cardName: { fontSize: 15, fontWeight: "500", color: "#2B2622" },
  cardSub: { fontSize: 11, color: "#5C5249" },
  delete: {
    position: "absolute", top: 8, right: 8, width: 28, height: 28, borderRadius: 14,
    backgroundColor: "#F7E1DD", alignItems: "center", justifyContent: "center",
  },
  topRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 14 },
  avatar: {
    width: 34, height: 34, borderRadius: 17, backgroundColor: "#D9774F",
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { color: "#fff", fontSize: 15, fontWeight: "500" },
  hi: { fontSize: 14, color: "#6B6054" },
  deleteText: { fontSize: 13, color: "#A32D2D" },
  gridCell: { width: "100%" },
  hint: { fontSize: 12, color: "#6B6054", marginBottom: 10 },
  newTile: {
    flex: 1, borderWidth: 1.5, borderStyle: "dashed", borderColor: "#CDBFA6", borderRadius: 16,
    alignItems: "center", justifyContent: "center", padding: 8,
  },
  plus: { fontSize: 24, color: "#6B6054" },
  newText: { fontSize: 13, color: "#6B6054" },
  input: {
    width: "100%", height: 36, backgroundColor: "#FFFBF3", borderWidth: 1, borderColor: "#D6C9B0",
    borderRadius: 12, paddingHorizontal: 10, fontSize: 14, color: "#2B2622",
  },
  tileError: { color: "#A32D2D", fontSize: 12, marginTop: 3, textAlign: "center" },
  row: { flexDirection: "row", gap: 6, marginTop: 6 },
  okBtn: { backgroundColor: "#D9774F", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 5 },
  okText: { color: "#fff", fontSize: 13 },
  cancelBtn: { borderWidth: 1, borderColor: "#CDBFA6", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 5 },
  cancelText: { color: "#2B2622", fontSize: 13 },
});