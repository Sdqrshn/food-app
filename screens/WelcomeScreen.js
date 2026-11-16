import { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BRAND } from "../brand";
import { PLACEHOLDER } from "../config";
import Texture from "../components/Texture";
import Avatar from "../components/Avatar";
import PhotoSheet from "../components/PhotoSheet";
import ConfirmModal from "../components/ConfirmModal";
import usePhotoActions from "../components/usePhotoActions";
import { useAuth } from "../AuthContext";

export default function WelcomeScreen() {
  const { user, finishWelcome, signOut } = useAuth();
  const photo = usePhotoActions();
  const [name, setName] = useState(user?.display_name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function go() {
    const trimmed = name.trim();
    if (!trimmed) return setError("Enter a name");
    setBusy(true);
    setError("");
    const result = await finishWelcome(trimmed);
    if (!result.ok) {
      const e = result.errors || {};
      const message = Array.isArray(e.display_name) ? e.display_name.join(" ") : e.display_name;
      setError(message || e.error || "Could not continue. Try again.");
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <Texture />
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <Text style={styles.kicker}>{BRAND.name}</Text>
        <Text style={styles.title}>Welcome!</Text>

        <View style={styles.avatarWrap}>
          <Avatar user={user} size={110} pencil busy={photo.busy} onPress={() => photo.setSheet(true)} />
          {photo.error ? <Text style={styles.error}>{photo.error}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={(t) => { setName(t); setError(""); }}
            placeholderTextColor={PLACEHOLDER}
            autoCapitalize="words"
          />
          <Text style={[styles.label, { marginTop: 14 }]}>Email</Text>
          <View style={styles.readonly}>
            <Text style={styles.readonlyText} numberOfLines={1}>{user?.email}</Text>
            <Ionicons name="lock-closed-outline" size={15} color="#8C8073" />
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable style={styles.button} onPress={go} disabled={busy}>
          {busy ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Continue</Text>}
        </Pressable>

        <Pressable onPress={signOut}>
          <Text style={styles.switch}>Not you? Use a different account</Text>
        </Pressable>
      </ScrollView>

      <PhotoSheet
        visible={photo.sheet}
        hasPhoto={!!user?.photo}
        onCamera={() => photo.pick(true)}
        onGallery={() => photo.pick(false)}
        onRemove={() => { photo.setSheet(false); photo.setRemoving(true); }}
        onClose={() => photo.setSheet(false)}
      />
      <ConfirmModal
        visible={photo.removing}
        title="Remove photo?"
        message="Your profile will show a letter instead."
        confirmText="Remove"
        onConfirm={photo.confirmRemove}
        onCancel={() => photo.setRemoving(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F0E4" },
  page: { flexGrow: 1, padding: 24, paddingTop: 70, paddingBottom: 40 },
  kicker: { fontSize: 13, color: "#A6492F", fontWeight: "500", letterSpacing: 0.5 },
  title: { fontSize: 32, fontWeight: "500", color: "#2B2622", marginTop: 4 },
  sub: { fontSize: 14, color: "#6B6054", marginTop: 6, lineHeight: 20 },
  avatarWrap: { alignItems: "center", marginVertical: 26 },
  card: { backgroundColor: "#FFFBF3", borderRadius: 18, padding: 16 },
  label: { fontSize: 12, color: "#6B6054", marginBottom: 4, marginLeft: 2 },
  input: {
    backgroundColor: "#F6F0E4", borderWidth: 1, borderColor: "#D6C9B0", borderRadius: 12,
    paddingHorizontal: 12, height: 44, fontSize: 15, color: "#2B2622",
  },
  readonly: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8,
    backgroundColor: "#EFE7D6", borderRadius: 12, paddingHorizontal: 12, height: 44,
  },
  readonlyText: { fontSize: 15, color: "#6B6054", flex: 1 },
  hint: { fontSize: 11, color: "#8C8073", marginTop: 6, marginLeft: 2 },
  error: { color: "#A32D2D", fontSize: 12, marginTop: 10, textAlign: "center" },
  button: {
    backgroundColor: "#D9774F", borderRadius: 24, height: 50, alignItems: "center",
    justifyContent: "center", marginTop: 22,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "500" },
  switch: { textAlign: "center", color: "#A6492F", fontSize: 14, marginTop: 18 },
});