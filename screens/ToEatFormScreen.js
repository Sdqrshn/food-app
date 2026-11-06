import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { API, PLACEHOLDER } from "../config";
import { authFetch } from "../api";
import { pickHints } from "../placeholders";
import Texture from "../components/Texture";
import SuggestionList from "../components/SuggestionList";

const JSON_HEADERS = { "Content-Type": "application/json" };

function Field({ label, optional, error, hint, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label}
        {optional ? <Text style={styles.optional}> (optional)</Text> : null}
      </Text>
      <TextInput
        style={[styles.input, props.multiline && styles.multiline]}
        placeholderTextColor={PLACEHOLDER}
        {...props}
      />
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export default function ToEatFormScreen({ route, navigation }) {
  const item = route.params?.item;
  const editing = !!item;
  const [restaurant, setRestaurant] = useState(item?.restaurant ?? "");
  const [name, setName] = useState(item?.name ?? "");
  const [note, setNote] = useState(item?.note ?? "");
  const [placeId, setPlaceId] = useState(item?.place_id ?? "");
  const [mapLink, setMapLink] = useState(item?.map_link ?? "");
  const [catText, setCatText] = useState(item?.category_name ?? "");
  const [catId, setCatId] = useState(item?.category ?? null);
  const [categories, setCategories] = useState([]);
  const [catFocused, setCatFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [hints] = useState(() => pickHints(""));
  const skipLookup = useRef(false);
  const focusedRef = useRef(false);

  useEffect(() => {
    authFetch(`${API}/categories/?all=1`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setCategories(data.filter((c) => !c.is_uncategorized));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (skipLookup.current) {
      skipLookup.current = false;
      return;
    }
    const q = restaurant.trim();
    if (q.length < 3 || placeId || (editing && q === item?.restaurant)) {
      setSuggestions([]);
      return;
    }
    let cancelled = false;
    const timer = setTimeout(() => {
      authFetch(`${API}/places/autocomplete/?q=${encodeURIComponent(q)}`)
        .then((res) => res.json())
        .then((data) => {
          if (!cancelled && focusedRef.current && Array.isArray(data)) setSuggestions(data);
        })
        .catch(() => {});
    }, 450);
    return () => { cancelled = true; clearTimeout(timer); };
  }, [restaurant]);

  function pickSuggestion(s) {
    if (s.name !== restaurant) skipLookup.current = true;
    setRestaurant(s.name);
    setPlaceId(s.place_id || "");
    setMapLink(s.map_link || "")
    setSuggestions([]);
  }

  function searchGoogle() {
    authFetch(`${API}/places/autocomplete/?q=${encodeURIComponent(restaurant.trim())}&source=google`)
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setSuggestions(data); })
      .catch(() => {});
  }

  const q = catText.trim().toLowerCase();
  const matches = categories.filter((c) => !q || c.name.toLowerCase().includes(q)).slice(0, 6);
  const exact = categories.some((c) => c.name.toLowerCase() === q);
  const showNew = q && !exact && q !== "uncategorized";

  function pickCategory(c) {
    setCatText(c.name);
    setCatId(c.id);
    setCatFocused(false);
  }

  async function save() {
    if (!restaurant.trim()) return setErrors({ restaurant: "Enter the restaurant" });
    setSaving(true);
    try {
      let categoryId = catId;
      const typed = catText.trim();
      if (typed && typed.toLowerCase() !== "uncategorized" && !categoryId) {
        const existing = categories.find((c) => c.name.toLowerCase() === typed.toLowerCase());
        if (existing) {
          categoryId = existing.id;
        } else {
          const res = await authFetch(`${API}/categories/`, {
            method: "POST",
            headers: JSON_HEADERS,
            body: JSON.stringify({ name: typed }),
          });
          const data = await res.json();
          if (!res.ok) {
            setErrors({ category: data.name?.[0] || "Could not add that category" });
            setSaving(false);
            return;
          }
          categoryId = data.id;
        }
      }
      if (typed.toLowerCase() === "uncategorized") categoryId = null;

      const res = await authFetch(editing ? `${API}/to-eat/${item.id}/` : `${API}/to-eat/`, {
        method: editing ? "PATCH" : "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          restaurant: restaurant.trim(),
          name: name.trim(),
          note: note.trim(),
          place_id: placeId,
          category: categoryId,
          map_link: mapLink.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrors({ restaurant: data.restaurant?.[0], category: data.category?.[0], mapLink: data.map_link?.[0], form: data.error });
        setSaving(false);
        return;
      }
      navigation.goBack();
    } catch {
      setErrors({ form: "Could not reach the server. It may still be waking up, so try again." });
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <Texture />
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigation.goBack()} style={{ alignSelf: "flex-start" }}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>{editing ? "Edit place" : "Add a place"}</Text>
        <Text style={styles.sub}>Somewhere you want to try</Text>

        <Field
          label="Restaurant"
          value={restaurant}
          onChangeText={(t) => {
            setRestaurant(t);
            setErrors({});
            if (!t.trim()) { setPlaceId(""); setSuggestions([]); }
          }}
          onFocus={() => { focusedRef.current = true; }}
          autoFocus={!editing}
          onBlur={() => { focusedRef.current = false; setTimeout(() => setSuggestions([]), 200); }}
          placeholder={hints.restaurant}
          autoCapitalize="words"
          error={errors.restaurant}
        />
        {suggestions.length > 0 ? (
          <SuggestionList
            query={restaurant}
            items={suggestions.map((s) => ({
              key: `${s.name}-${s.place_id}`,
              title: s.name,
              subtitle: s.saved ? "Already in your list" : s.address,
              icon: s.saved ? "bookmark-outline" : "location-outline",
              badge: s.saved ? "Saved" : "",
              raw: s,
            }))}
            onPick={(it) => pickSuggestion(it.raw)}
            footer={
              suggestions.some((s) => s.saved)
                ? { label: "Not here? Search Google Maps", onPress: searchGoogle }
                : null
            }
          />
        ) : null}

        <Field
          label="Google Maps link"
          optional
          value={mapLink}
          onChangeText={(t) => {
            setMapLink(t);
            setErrors({});
            if (!t.trim()) setPlaceId("");
          }}
          placeholder="Filled in when you pick a place"
          hint="Paste your own if a place isn't in the list"
          keyboardType="url"
          autoCapitalize="none"
          autoCorrect={false}
          error={errors.mapLink}
        />

        <Field
          label="Dish name"
          optional
          value={name}
          onChangeText={setName}
          placeholder={hints.dish}
          autoCapitalize="words"
        />

        <Field
          label="Note"
          optional
          value={note}
          onChangeText={setNote}
          placeholder={hints.note}
          multiline
        />

        {errors.form ? <Text style={styles.error}>{errors.form}</Text> : null}
        <Pressable style={styles.save} onPress={save} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>{editing ? "Save changes" : "Add to To eat"}</Text>
          )}
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F0E4" },
  page: { flexGrow: 1, padding: 20, paddingTop: 60, paddingBottom: 60 },
  back: { fontSize: 15, color: "#6B6054", marginBottom: 12 },
  title: { fontSize: 24, fontWeight: "500", color: "#2B2622" },
  sub: { fontSize: 13, color: "#6B6054", marginBottom: 16 },
  field: { marginBottom: 12 },
  label: { fontSize: 12, color: "#6B6054", marginBottom: 3, marginLeft: 2 },
  optional: { color: "#8C8073" },
  input: {
    backgroundColor: "#FFFBF3", borderWidth: 1, borderColor: "#D6C9B0", borderRadius: 12,
    paddingHorizontal: 12, height: 42, fontSize: 15, color: "#2B2622",
  },
  multiline: { height: 84, paddingTop: 10, textAlignVertical: "top" },
  hint: { fontSize: 11, color: "#8C8073", marginTop: 3, marginLeft: 2 },
  error: { color: "#A32D2D", fontSize: 12, marginTop: 3, marginLeft: 2 },
  suggestions: {
    backgroundColor: "#FFFBF3", borderRadius: 14, borderWidth: 1, borderColor: "#D6C9B0",
    marginTop: -4, marginBottom: 12, overflow: "hidden",
  },
  suggestion: { paddingHorizontal: 12, paddingVertical: 9, borderBottomWidth: 0.5, borderBottomColor: "#EFE6D3" },
  sugName: { fontSize: 14, fontWeight: "500", color: "#2B2622" },
  sugAddr: { fontSize: 12, color: "#6B6054" },
  sugGoogle: { fontSize: 13, color: "#A6492F" },
  linked: {
    flexDirection: "row", alignItems: "center", alignSelf: "flex-start", gap: 10,
    backgroundColor: "#E6EFDD", borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4,
    marginTop: -4, marginBottom: 12,
  },
  linkedText: { fontSize: 12, color: "#27500A" },
  save: { backgroundColor: "#D9774F", borderRadius: 22, paddingVertical: 12, alignItems: "center", marginTop: 8 },
  saveText: { color: "#fff", fontSize: 15 },
});