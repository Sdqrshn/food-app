import { useEffect, useState } from "react";
import {
  ActivityIndicator, FlatList, BackHandler, KeyboardAvoidingView, Pressable, StyleSheet, Text, TextInput, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { API, COLORS, PLACEHOLDER } from "../config";
import { authFetch } from "../api";
import Texture from "../components/Texture";
import ConfirmModal from "../components/ConfirmModal";

const JSON_HEADERS = { "Content-Type": "application/json" };

export default function ChooseCategoryScreen({ route, navigation }) {
  const { dish, afterSave } = route.params;
  const [categories, setCategories] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [confirmTarget, setConfirmTarget] = useState(null);

  function skip() {
    navigation.replace("Saved", { title: "Saved to Uncategorized", subtitle: dish.restaurant });
  }

  useEffect(() => {
    if (!afterSave) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      skip();
      return true;
    });
    return () => sub.remove();
  }, [afterSave]);

  useEffect(() => {
    authFetch(`${API}/categories/`)
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setCategories(data); })
      .catch(() => setError("Could not reach the server"))
      .finally(() => setLoaded(true));
  }, []);

  const q = query.trim().toLowerCase();
  const uncategorized = categories.find((c) => c.is_uncategorized);
  const rows = categories.filter(
    (c) => !c.is_uncategorized && c.id !== dish.category && (!q || c.name.toLowerCase().includes(q))
  );
  const showUncategorized =
    !dish.is_uncategorized && uncategorized && (!q || "uncategorized".includes(q));

  async function moveTo(target) {
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const res = await authFetch(`${API}/dishes/${dish.id}/`, {
        method: "PATCH",
        headers: JSON_HEADERS,
        body: JSON.stringify({ category: target.id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error("bad response");
      if (target.is_uncategorized) {
        navigation.replace("Saved", { title: "Moved to Uncategorized", subtitle: data.restaurant });
      }
      else navigation.replace("Matchup", { dish: data });
    } catch {
      setError("Could not move the dish. Try again.");
      setBusy(false);
    }
  }

  async function createAndMove() {
    const name = newName.trim();
    if (!name) return setError("Enter a category name");
    setBusy(true);
    setError("");
    try {
      const res = await authFetch(`${API}/categories/`, {
        method: "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({ name }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.name?.[0] || "Could not add that category");
        setBusy(false);
        return;
      }
      setBusy(false);
      await moveTo(data);
    } catch {
      setError("Could not reach the server");
      setBusy(false);
    }
  }

  const header = (
    <View>
      <Pressable
        style={styles.row}
        onPress={() => { setCreating(!creating); setNewName(query.trim()); setError(""); }}
      >
        <View style={[styles.icon, { backgroundColor: "#D9774F" }]}>
          <Ionicons name="add" size={18} color="#fff" />
        </View>
        <Text style={styles.newText}>New category</Text>
      </Pressable>
      {creating ? (
        <View style={styles.createBox}>
          <TextInput
            style={styles.input}
            value={newName}
            onChangeText={(t) => { setNewName(t); setError(""); }}
            placeholder="Category name"
            placeholderTextColor={PLACEHOLDER}
            autoCapitalize="words"
            autoFocus
            onSubmitEditing={createAndMove}
          />
          <Pressable style={styles.createBtn} onPress={createAndMove} disabled={busy}>
            {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.createText}>Create and move</Text>}
          </Pressable>
        </View>
      ) : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <Texture />
      <View style={styles.top}>
        <View style={styles.topRow}>
          <Text style={styles.title}>{afterSave ? "Where does it belong?" : "Move to..."}</Text>
          <Pressable onPress={afterSave ? skip : () => navigation.goBack()} hitSlop={10} disabled={busy}>
            <Text style={styles.skip}>{afterSave ? "Skip" : "Cancel"}</Text>
          </Pressable>
        </View>
        <Text style={styles.sub} numberOfLines={1}>
          {dish.restaurant}{dish.name ? ` · ${dish.name}` : ""}
        </Text>
        <TextInput
          style={styles.search}
          value={query}
          onChangeText={setQuery}
          placeholder="Search your categories"
          placeholderTextColor={PLACEHOLDER}
          autoCapitalize="none"
        />
      </View>

      <FlatList
        data={rows}
        keyExtractor={(c) => String(c.id)}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
        ListHeaderComponent={header}
        ListFooterComponent={
          showUncategorized ? (
            <Pressable style={styles.row} onPress={() => setConfirmTarget(uncategorized)}>
              <View style={[styles.icon, { backgroundColor: "#A89F8F" }]}>
                <Ionicons name="file-tray-full-outline" size={17} color="#fff" />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.name}>Uncategorized</Text>
                <Text style={styles.count}>Removes its ranking</Text>
              </View>
            </Pressable>
          ) : null
        }
        ListEmptyComponent={
          loaded ? (
            <Text style={styles.empty}>{q ? "No category matches" : "No other categories yet"}</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable style={styles.row} onPress={() => moveTo(item)} disabled={busy}>
            <View style={[styles.icon, { backgroundColor: COLORS[item.id % COLORS.length] }]}>
              <Ionicons name="folder-outline" size={17} color="#fff" />
            </View>
            <View style={styles.rowText}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.count}>
                {item.dish_count === 1 ? "1 dish" : `${item.dish_count} dishes`}
              </Text>
            </View>
            <Text style={styles.chev}>›</Text>
          </Pressable>
        )}
      />

      <ConfirmModal
        visible={!!confirmTarget}
        title="Move to Uncategorized?"
        message="This removes its ranking and rank history."
        confirmText="Move"
        danger
        onConfirm={() => { const t = confirmTarget; setConfirmTarget(null); moveTo(t); }}
        onCancel={() => setConfirmTarget(null)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F0E4" },
  top: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 6 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 24, fontWeight: "500", color: "#2B2622", flex: 1 },
  skip: { fontSize: 15, color: "#A6492F", paddingLeft: 12 },
  sub: { fontSize: 13, color: "#6B6054", marginTop: 2, marginBottom: 14 },
  search: {
    backgroundColor: "#FFFBF3", borderWidth: 1, borderColor: "#D6C9B0", borderRadius: 22,
    paddingHorizontal: 18, height: 44, fontSize: 15, color: "#2B2622",
  },
  list: { paddingHorizontal: 20, paddingTop: 14, paddingBottom: 40 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFFBF3",
    borderRadius: 16, padding: 12, marginBottom: 10,
  },
  icon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  rowText: { flex: 1 },
  name: { fontSize: 15, fontWeight: "500", color: "#2B2622" },
  newText: { fontSize: 15, fontWeight: "500", color: "#A6492F" },
  count: { fontSize: 12, color: "#6B6054", marginTop: 1 },
  chev: { fontSize: 20, color: "#8C8073" },
  createBox: { backgroundColor: "#FFFBF3", borderRadius: 16, padding: 12, marginBottom: 10, gap: 10 },
  input: {
    backgroundColor: "#F6F0E4", borderWidth: 1, borderColor: "#D6C9B0", borderRadius: 12,
    paddingHorizontal: 12, height: 42, fontSize: 15, color: "#2B2622",
  },
  createBtn: { backgroundColor: "#D9774F", borderRadius: 20, paddingVertical: 10, alignItems: "center" },
  createText: { color: "#fff", fontSize: 14 },
  error: { color: "#A32D2D", fontSize: 12, marginBottom: 10, marginLeft: 4 },
  empty: { fontSize: 14, color: "#6B6054", textAlign: "center", marginTop: 20 },
});