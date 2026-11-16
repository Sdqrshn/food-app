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
  const [mapFocused, setMapFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [hints] = useState(() => pickHints(""));
  const skipLookup = useRef(false);
  const focusedRef = useRef(false);

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

  async function save() {
    if (!restaurant.trim()) return setErrors({ restaurant: "Enter the restaurant" });
    setSaving(true);
    try {
      const res = await authFetch(editing ? `${API}/to-eat/${item.id}/` : `${API}/to-eat/`, {
        method: editing ? "PATCH" : "POST",
        headers: JSON_HEADERS,
        body: JSON.stringify({
          restaurant: restaurant.trim(),
          name: name.trim(),
          note: note.trim(),
          place_id: placeId,
          map_link: mapLink.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setErrors({ restaurant: data.restaurant?.[0], mapLink: data.map_link?.[0], form: data.error });
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
          onFocus={() => setMapFocused(true)}
          onBlur={() => setMapFocused(false)}
          selection={mapFocused ? undefined : { start: 0, end: 0 }}
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
  save: { backgroundColor: "#D9774F", borderRadius: 22, paddingVertical: 12, alignItems: "center", marginTop: 8 },
  saveText: { color: "#fff", fontSize: 15 },
});