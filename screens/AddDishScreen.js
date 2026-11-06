import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator, Alert, Image, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { ImageManipulator, SaveFormat } from "expo-image-manipulator";
import { API, PLACEHOLDER } from "../config";
import { authFetch, getAuthHeader } from "../api";
import { pickHints } from "../placeholders";
import Texture from "../components/Texture";
import SuggestionList from "../components/SuggestionList";


function today() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function upload(method, url, form) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open(method, url);
    const auth = getAuthHeader();
    if (auth.Authorization) xhr.setRequestHeader("Authorization", auth.Authorization);
    xhr.onload = () => {
      let data = null;
      try { data = JSON.parse(xhr.responseText); } catch {}
      resolve({ ok: xhr.status >= 200 && xhr.status < 300, data });
    };
    xhr.onerror = () => reject(new Error("Network error"));
    xhr.send(form);
  });
}

async function shrink(asset) {
  try {
    const resize =
      asset.width >= asset.height
        ? { width: Math.min(asset.width, 1200) }
        : { height: Math.min(asset.height, 1200) };
    const context = ImageManipulator.manipulate(asset.uri);
    context.resize(resize);
    const image = await context.renderAsync();
    const result = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.7 });
    return { uri: result.uri, mimeType: "image/jpeg" };
  } catch {
    return asset;
  }
}

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

export default function AddDishScreen({ route, navigation }) {
  const { category, dish, toEat } = route.params;
  const editing = !!dish;
  const fromToEat = !!toEat;

  const [photo, setPhoto] = useState(dish?.photo ? { uri: dish.photo, existing: true } : null);
  const [name, setName] = useState(dish?.name ?? toEat?.name ?? "");
  const [restaurant, setRestaurant] = useState(dish?.restaurant ?? toEat?.restaurant ?? "");
  const [price, setPrice] = useState(dish?.price ? String(Number(dish.price)) : "");
  const [date, setDate] = useState(dish?.date_tried ?? today());
  const [note, setNote] = useState(dish?.note ?? toEat?.note ?? "");
  const [placeId, setPlaceId] = useState(dish?.place_id ?? toEat?.place_id ?? "");
  const [mapLink, setMapLink] = useState(dish?.map_link ?? toEat?.map_link ?? "");
  const [mapFocused, setMapFocused] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [hints] = useState(() => pickHints(category && !category.is_uncategorized ? category.name : ""));
  const skipLookup = useRef(false);
  const focusedRef = useRef(false);

  useEffect(() => {
    if (skipLookup.current) {
      skipLookup.current = false;
      return;
    }
    const q = restaurant.trim();
    if (q.length < 3 || placeId || (editing && q === dish?.restaurant)) {
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
    setMapLink(s.map_link || "");
    setSuggestions([]);
  }

  function searchGoogle() {
    authFetch(`${API}/places/autocomplete/?q=${encodeURIComponent(restaurant.trim())}&source=google`)
      .then((res) => res.json())
      .then((data) => { if (Array.isArray(data)) setSuggestions(data); })
      .catch(() => {});
  }

  async function fromCamera() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return setErrors({ photo: "Camera permission is needed" });
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled) { setPhoto(await shrink(result.assets[0])); setErrors({}); }
  }

  async function fromGallery() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.7 });
    if (!result.canceled) { setPhoto(await shrink(result.assets[0])); setErrors({}); }
  }

  function changePhoto() {
    Alert.alert("Change photo", undefined, [
      { text: "Camera", onPress: fromCamera },
      { text: "Gallery", onPress: fromGallery },
      { text: "Cancel", style: "cancel" },
    ]);
  }

  async function getTarget() {
    if (category) return category;
    if (editing) return null;
    const res = await authFetch(`${API}/categories/uncategorized/`, { method: "POST" });
    return await res.json();
  }

  async function save() {
    if (!restaurant.trim()) return setErrors({ restaurant: "Enter the restaurant" });
    setSaving(true);

    let target = null;
    try {
      target = await getTarget();
    } catch {
      setErrors({ form: "Couldn't reach the server. It may still be waking up, so try again in a moment." });
      setSaving(false);
      return;
    }

    const form = new FormData();
    if (target) form.append("category", String(target.id));
    form.append("name", name.trim());
    form.append("restaurant", restaurant.trim());
    form.append("price", price.replace("₹", "").trim());
    if (date.trim()) form.append("date_tried", date.trim());
    form.append("note", note.trim());
    form.append("place_id", placeId);
    form.append("map_link", mapLink.trim());
    if (fromToEat) form.append("to_eat", String(toEat.id));
    if (photo && !photo.existing) {
      form.append("photo", { uri: photo.uri, name: "dish.jpg", type: photo.mimeType || "image/jpeg" });
    } else if (!photo && dish?.photo) {
      form.append("photo", "");
    }

    try {
      const { ok, data } = editing
        ? await upload("PATCH", `${API}/dishes/${dish.id}/`, form)
        : await upload("POST", `${API}/dishes/`, form);
      if (ok) {
        if (editing) return navigation.goBack();
        if (target.is_uncategorized) {
          return fromToEat
            ? navigation.replace("ChooseCategory", { dish: data, afterSave: true })
            : navigation.replace("Saved", { title: "Saved to Uncategorized", subtitle: data.restaurant });
        }
        return navigation.replace("Matchup", { dish: data });
      }
      setErrors({
        restaurant: data?.restaurant?.[0],
        price: data?.price?.[0],
        date: data?.date_tried?.[0],
        mapLink: data?.map_link?.[0],
      });
    } catch {
      setErrors({ form: "Couldn't reach the server. It may still be waking up, so try again in a moment." });
    }
    setSaving(false);
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <Texture />
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Pressable onPress={() => navigation.goBack()} style={{ alignSelf: "flex-start"}}>
          <Text style={styles.back}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>{editing ? "Edit dish" : "Add a dish"}</Text>
        {fromToEat ? (
          <Text style={styles.fromList}>From your To-eat list</Text>
        ) : (
          <View style={{ height: 16 }} />
        )}

        {photo ? (
          <View style={styles.photoBox}>
            <Image source={{ uri: photo.uri }} style={styles.preview} />
            <View style={styles.row}>
              <Pressable style={styles.smallBtn} onPress={changePhoto}>
                <Text style={styles.smallText}>Change</Text>
              </Pressable>
              <Pressable style={styles.smallBtn} onPress={() => setPhoto(null)}>
                <Text style={styles.smallText}>Remove</Text>
              </Pressable>
            </View>
          </View>
        ) : (
          <View style={[styles.photoBox, styles.photoEmpty]}>
            <Text style={styles.addPhoto}>Add photo</Text>
            <View style={styles.row}>
              <Pressable style={styles.smallBtn} onPress={fromCamera}>
                <Text style={styles.smallText}>Camera</Text>
              </Pressable>
              <Pressable style={styles.smallBtn} onPress={fromGallery}>
                <Text style={styles.smallText}>Gallery</Text>
              </Pressable>
            </View>
          </View>
        )}
        {errors.photo ? <Text style={styles.error}>{errors.photo}</Text> : null}

        <Field
          label="Restaurant"
          value={restaurant}
          onChangeText={(t) => {
            setRestaurant(t);
            setErrors({});
            if (!t.trim()) { setPlaceId(""); setSuggestions([]); }
          }}
          onFocus={() => { focusedRef.current = true; }}
          onBlur={() => { focusedRef.current = false; setTimeout(() => setSuggestions([]), 200); }}
          placeholder={hints.restaurant}
          autoCapitalize="words"
          autoFocus={!editing && !fromToEat}
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
          onFocus={() => setMapFocused(true)}
          onBlur={() => setMapFocused(false)}
          selection={mapFocused ? undefined : { start: 0, end: 0 }}
          onChangeText={(t) => {
            setMapLink(t);
            setErrors({});
            if (!t.trim()) setPlaceId("");
          }}
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

        <View style={styles.twoCol}>
          <View style={styles.half}>
            <Field
              label="Price"
              optional
              value={price}
              onChangeText={setPrice}
              placeholder="249"
              keyboardType="decimal-pad"
              error={errors.price}
            />
          </View>
          <View style={styles.half}>
            <Field
              label="Date tried"
              value={date}
              onChangeText={setDate}
              placeholder="YYYY-MM-DD"
              error={errors.date}
            />
          </View>
        </View>

        <Field label="Note" optional value={note} onChangeText={setNote} placeholder={hints.note} multiline />

        {errors.form ? <Text style={styles.error}>{errors.form}</Text> : null}
        <Pressable style={styles.save} onPress={save} disabled={saving}>
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.saveText}>{editing ? "Save changes" : "Next: place it"}</Text>
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
  fromList: {
    alignSelf: "flex-start", fontSize: 12, color: "#6B4A12", backgroundColor: "#F4E3B8",
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 3, marginTop: 4, marginBottom: 14, overflow: "hidden",
  },
  photoBox: { marginBottom: 14 },
  photoEmpty: {
    height: 120, borderRadius: 16, backgroundColor: "#E9DFC9",
    alignItems: "center", justifyContent: "center", gap: 8,
  },
  addPhoto: { fontSize: 14, color: "#6B6054" },
  preview: { height: 170, borderRadius: 16, marginBottom: 8, backgroundColor: "#E9DFC9" },
  row: { flexDirection: "row", gap: 8 },
  smallBtn: {
    backgroundColor: "#FFFBF3", borderWidth: 1, borderColor: "#D6C9B0",
    borderRadius: 16, paddingHorizontal: 14, paddingVertical: 5,
  },
  smallText: { fontSize: 13, color: "#2B2622" },
  field: { marginBottom: 12 },
  label: { fontSize: 12, color: "#6B6054", marginBottom: 3, marginLeft: 2 },
  optional: { color: "#8C8073" },
  input: {
    backgroundColor: "#FFFBF3", borderWidth: 1, borderColor: "#D6C9B0", borderRadius: 12,
    paddingHorizontal: 12, height: 42, fontSize: 15, color: "#2B2622",
  },
  multiline: { height: 84, paddingTop: 10, textAlignVertical: "top" },
  hint: { fontSize: 11, color: "#8C8073", marginTop: 3, marginLeft: 2 },
  twoCol: { flexDirection: "row", gap: 10 },
  half: { flex: 1 },
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