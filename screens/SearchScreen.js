import { useEffect, useState } from "react";
import {
  Image, KeyboardAvoidingView, Pressable, SectionList, StyleSheet, Text, TextInput, View,
} from "react-native";
import { API, COLORS, PLACEHOLDER } from "../config";
import { authFetch } from "../api";
import Texture from "../components/Texture";
import Highlight from "../components/Highlight";

const HIT = { backgroundColor: "#F6D98B", color: "#2B2622" };

function Thumb({ photo, text, color, round }) {
  const shape = round ? styles.round : styles.square;
  if (photo) return <Image source={{ uri: photo }} style={[styles.thumb, shape]} />;
  return (
    <View style={[styles.thumb, shape, styles.letterThumb, { backgroundColor: color }]}>
      <Text style={styles.letter}>{text.charAt(0).toUpperCase()}</Text>
    </View>
  );
}

function CategoryRow({ category, query, onPress }) {
  const n = category.dish_count;
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Thumb
        photo={category.top_photo}
        text={category.name}
        color={COLORS[category.id % COLORS.length]}
        round
      />
      <View style={styles.rowText}>
        <Highlight text={category.name} query={query} style={styles.title} hitStyle={HIT} numberOfLines={1} />
        <Text style={styles.label}>
          {n === 0 ? "No dishes yet" : n === 1 ? "1 dish" : `${n} dishes`}
        </Text>
      </View>
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );
}

function DishRow({ dish, query, onPress }) {
  const label = [dish.name, dish.category_name].filter(Boolean).join(" · ");
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Thumb photo={dish.photo} text={dish.restaurant} color={COLORS[dish.id % COLORS.length]} />
      <View style={styles.rowText}>
        <Highlight text={dish.restaurant} query={query} style={styles.title} hitStyle={HIT} numberOfLines={1} />
        <Highlight text={label} query={query} style={styles.label} hitStyle={HIT} numberOfLines={1} />
        {dish.note_snippet ? (
          <Highlight text={dish.note_snippet} query={query} style={styles.snippet} hitStyle={HIT} numberOfLines={2} />
        ) : null}
      </View>
      <Text style={styles.chev}>›</Text>
    </Pressable>
  );
}

export default function SearchScreen({ navigation }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState({ categories: [], dishes: [] });
  const [state, setState] = useState("idle");

  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults({ categories: [], dishes: [] });
      setState("idle");
      return;
    }
    setState("loading");
    let cancelled = false;
    const timer = setTimeout(() => {
      authFetch(`${API}/search/?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled) { setResults(data); setState("done"); }
        })
        .catch(() => {
          if (!cancelled) setState("error");
        });
    }, 300);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [query]);

  const q = query.trim();
  const sections = [];
  if (results.categories.length) sections.push({ title: "Categories", kind: "category", data: results.categories });
  if (results.dishes.length) sections.push({ title: "Dishes", kind: "dish", data: results.dishes });

  let message = null;
  if (state === "idle") message = "Search restaurants, dishes, notes or categories";
  else if (state === "error") message = "Could not reach the server";
  else if (state === "done" && sections.length === 0) message = `Nothing found for "${q}"`;

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <Texture />
      <View style={styles.top}>
        <Pressable onPress={() => navigation.goBack()}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <View style={styles.inputWrap}>
          <TextInput
            style={styles.input}
            value={query}
            onChangeText={setQuery}
            placeholder="Search"
            placeholderTextColor={PLACEHOLDER}
            autoFocus
            autoCapitalize="none"
            returnKeyType="search"
          />
          {query ? (
            <Pressable style={styles.clear} onPress={() => setQuery("")}>
              <Text style={styles.clearText}>✕</Text>
            </Pressable>
          ) : null}
        </View>
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <SectionList
        sections={sections}
        keyExtractor={(item) => `${item.restaurant === undefined ? "c" : "d"}${item.id}`}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => <Text style={styles.section}>{section.title}</Text>}
        renderItem={({ item, section }) =>
          section.kind === "category" ? (
            <CategoryRow
              category={item}
              query={q}
              onPress={() => navigation.navigate("Category", { category: item })}
            />
          ) : (
            <DishRow
              dish={item}
              query={q}
              onPress={() => navigation.navigate("Detail", { id: item.id, highlight: q })}
            />
          )
        }
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.list}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F0E4" },
  top: { paddingTop: 60, paddingHorizontal: 20 },
  back: { fontSize: 15, color: "#6B6054", marginBottom: 12 },
  inputWrap: { justifyContent: "center" },
  input: {
    backgroundColor: "#FFFBF3", borderWidth: 1, borderColor: "#D6C9B0", borderRadius: 22,
    paddingHorizontal: 18, paddingRight: 44, height: 46, fontSize: 16, color: "#2B2622",
  },
  clear: { position: "absolute", right: 8, width: 30, height: 30, alignItems: "center", justifyContent: "center" },
  clearText: { fontSize: 14, color: "#8C8073" },
  message: { fontSize: 14, color: "#6B6054", textAlign: "center", marginTop: 40, paddingHorizontal: 30 },
  list: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 30 },
  section: { fontSize: 12, color: "#6B6054", marginTop: 8, marginBottom: 8, marginLeft: 4 },
  row: {
    flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#FFFBF3",
    borderRadius: 16, padding: 10, marginBottom: 10,
  },
  thumb: { width: 52, height: 52, backgroundColor: "#E9DFC9" },
  round: { borderRadius: 26 },
  square: { borderRadius: 14 },
  letterThumb: { alignItems: "center", justifyContent: "center" },
  letter: { color: "#fff", fontSize: 20, fontWeight: "500" },
  rowText: { flex: 1 },
  title: { fontSize: 15, fontWeight: "500", color: "#2B2622" },
  label: { fontSize: 12, color: "#6B6054", marginTop: 1 },
  snippet: { fontSize: 12, color: "#5C5249", marginTop: 3, lineHeight: 17 },
  chev: { fontSize: 20, color: "#8C8073" },
});