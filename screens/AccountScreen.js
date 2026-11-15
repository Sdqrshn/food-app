import { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, LayoutAnimation, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../AuthContext";
import { PLACEHOLDER } from "../config";
import Texture from "../components/Texture";
import ConfirmModal from "../components/ConfirmModal";

export default function AccountScreen({ navigation }) {
  const { user, signOut, updateName } = useAuth();
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [nameDraft, setNameDraft] = useState(user?.display_name ?? "");
  const [loggingOut, setLoggingOut] = useState(false);
  const insets = useSafeAreaInsets();

  const initial = (user?.display_name || "?").charAt(0).toUpperCase();

  function toggle() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(!open);
    setError("");
    setNameDraft(user?.display_name ?? "");
  }

  async function saveName() {
    const trimmed = nameDraft.trim();
    if (!trimmed) return setError("Enter a name");
    setBusy(true);
    const result = await updateName(trimmed);
    setBusy(false);
    if (!result.ok) {
      const e = result.errors || {};
      return setError((Array.isArray(e.display_name) ? e.display_name.join(" ") : e.display_name) || e.error || "Could not save");
    }
    setSaved(true);
    setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setOpen(false);
      setSaved(false);
    }, 900);
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <Texture />
      <ScrollView 
        contentContainerStyle={[styles.page, { paddingBottom: insets.bottom + 130}]} 
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.main}>
          <Pressable onPress={() => navigation.goBack()} style={styles.backWrap}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>

          <View style={styles.profile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initial}</Text>
            </View>
            <Text style={styles.name}>{user?.display_name}</Text>
            <Text style={styles.email}>{user?.email}</Text>
          </View>

          <View style={styles.card}>
            <Pressable style={styles.rowHead} onPress={toggle}>
              <Text style={styles.rowLabel}>Name</Text>
              <View style={styles.rowRight}>
                <Text style={styles.rowValue} numberOfLines={1}>{user?.display_name}</Text>
                <Text style={[styles.chev, open && styles.chevOpen]}>›</Text>
              </View>
            </Pressable>
            {open ? (
              <View style={styles.body}>
                <Text style={styles.label}>New name</Text>
                <TextInput
                  style={styles.input}
                  value={nameDraft}
                  onChangeText={(t) => { setNameDraft(t); setError(""); }}
                  placeholderTextColor={PLACEHOLDER}
                  autoCapitalize="words"
                />
                {error ? <Text style={styles.error}>{error}</Text> : null}
                <Pressable style={styles.save} onPress={saveName} disabled={busy}>
                  {busy ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.saveText}>{saved ? "Saved ✓" : "Save name"}</Text>
                  )}
                </Pressable>
              </View>
            ) : null}
          </View>

          <View style={[styles.card, styles.cardGap]}>
            <Pressable style={styles.rowHead} onPress={() => setLoggingOut(true)}>
              <Text style={styles.rowLabel}>Log out</Text>
            </Pressable>
          </View>
        </View>

        <Pressable style={styles.deleteLink} onPress={() => navigation.navigate("DeleteAccount")}>
          <Text style={styles.deleteLinkText}>Delete account</Text>
        </Pressable>
      </ScrollView>

      <ConfirmModal
        visible={loggingOut}
        title="Log out?"
        message="You'll sign in with Google again to see your rankings."
        confirmText="Log out"
        onConfirm={() => { setLoggingOut(false); signOut(); }}
        onCancel={() => setLoggingOut(false)}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F0E4" },
  page: { flexGrow: 1, paddingTop: 60, paddingHorizontal: 20, paddingBottom: 40 },
  main: { flex: 1 },
  backWrap: { alignSelf: "flex-start", marginBottom: 12 },
  back: { fontSize: 15, color: "#6B6054" },
  profile: { alignItems: "center", marginTop: 12, marginBottom: 28 },
  avatar: {
    width: 84, height: 84, borderRadius: 42, backgroundColor: "#D9774F",
    alignItems: "center", justifyContent: "center", marginBottom: 12,
  },
  avatarText: { color: "#fff", fontSize: 36, fontWeight: "500" },
  name: { fontSize: 22, fontWeight: "500", color: "#2B2622" },
  email: { fontSize: 13, color: "#6B6054", marginTop: 2 },
  card: { backgroundColor: "#FFFBF3", borderRadius: 16, overflow: "hidden" },
  cardGap: { marginTop: 14 },
  rowHead: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 15,
  },
  rowLabel: { fontSize: 15, color: "#2B2622" },
  rowRight: { flexDirection: "row", alignItems: "center", gap: 8, maxWidth: "60%" },
  rowValue: { fontSize: 14, color: "#8C8073", flexShrink: 1 },
  chev: { fontSize: 20, color: "#8C8073" },
  chevOpen: { transform: [{ rotate: "90deg" }] },
  body: { paddingHorizontal: 16, paddingBottom: 16 },
  label: { fontSize: 12, color: "#6B6054", marginBottom: 3, marginLeft: 2 },
  input: {
    backgroundColor: "#F6F0E4", borderWidth: 1, borderColor: "#D6C9B0", borderRadius: 12,
    paddingHorizontal: 12, height: 42, fontSize: 15, color: "#2B2622",
  },
  error: { color: "#A32D2D", fontSize: 12, marginTop: 3, marginLeft: 2 },
  save: { backgroundColor: "#D9774F", borderRadius: 20, paddingVertical: 10, alignItems: "center", marginTop: 10 },
  saveText: { color: "#fff", fontSize: 14 },
  deleteLink: { alignSelf: "center", paddingVertical: 14, paddingHorizontal: 20, marginTop: 40 },
  deleteLinkText: { fontSize: 13, color: "#A32D2D" },
});