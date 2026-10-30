import { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, LayoutAnimation, Pressable, ScrollView,
  StyleSheet, Text, TextInput, View,
} from "react-native";
import { useAuth } from "../AuthContext";
import { PLACEHOLDER } from "../config";
import Texture from "../components/Texture";
import ConfirmModal from "../components/ConfirmModal";
import ReAnimated from "react-native-reanimated";
import { useTabBarScroll } from "../components/FloatingTabBar";

const first = (v) => (Array.isArray(v) ? v.join(" ") : v);

function Input({ label, error, ...props }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} placeholderTextColor={PLACEHOLDER} {...props} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export default function AccountScreen({ navigation }) {
  const { user, signOut, updateName, changePassword, deleteAccount } = useAuth();
  const onScroll = useTabBarScroll();
  const [open, setOpen] = useState(null);
  const [saved, setSaved] = useState(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState({});
  const [nameDraft, setNameDraft] = useState(user?.display_name ?? "");
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [loggingOut, setLoggingOut] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePw, setDeletePw] = useState("");
  const [deleteError, setDeleteError] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);

  const initial = (user?.display_name || "?").charAt(0).toUpperCase();

  function toggle(row) {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpen(open === row ? null : row);
    setErrors({});
    setNameDraft(user?.display_name ?? "");
  }

  function finish(row) {
    setSaved(row);
    setTimeout(() => {
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setOpen(null);
      setSaved(null);
    }, 900);
  }

  async function saveName() {
    const trimmed = nameDraft.trim();
    if (!trimmed) return setErrors({ name: "Enter a name" });
    setBusy(true);
    const result = await updateName(trimmed);
    setBusy(false);
    if (!result.ok) {
      const e = result.errors || {};
      return setErrors({ name: first(e.display_name) || first(e.error) || "Could not save" });
    }
    finish("name");
  }

  async function savePassword() {
    const found = {};
    if (!current) found.current = "Enter your current password";
    if (!next) found.next = "Enter a new password";
    else if (next !== again) found.again = "The passwords don't match";
    if (Object.keys(found).length) return setErrors(found);

    setBusy(true);
    const result = await changePassword(current, next);
    setBusy(false);
    if (!result.ok) {
      const e = result.errors || {};
      return setErrors({
        current: first(e.current_password),
        next: first(e.new_password),
        form: first(e.error) || first(e.detail),
      });
    }
    setCurrent("");
    setNext("");
    setAgain("");
    finish("password");
  }

  async function confirmDelete() {
    if (!deletePw) return setDeleteError("Enter your password");
    if (deleteBusy) return;
    setDeleteBusy(true);
    const result = await deleteAccount(deletePw);
    if (!result.ok) {
      const e = result.errors || {};
      setDeleteError(first(e.password) || first(e.error) || "Could not delete the account");
      setDeleteBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <Texture />
      <ReAnimated.ScrollView
       onScroll={onScroll} 
       scrollEventThrottle={16} 
       contentContainerStyle={styles.page} 
       keyboardShouldPersistTaps="handled"
      >

        <View style={styles.profile}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initial}</Text>
          </View>
          <Text style={styles.name}>{user?.display_name}</Text>
          <Text style={styles.email}>{user?.email}</Text>
        </View>

        <View style={styles.card}>
          <Pressable style={styles.rowHead} onPress={() => toggle("name")}>
            <Text style={styles.rowLabel}>Name</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue} numberOfLines={1}>{user?.display_name}</Text>
              <Text style={[styles.chev, open === "name" && styles.chevOpen]}>›</Text>
            </View>
          </Pressable>
          {open === "name" ? (
            <View style={styles.body}>
              <Input
                label="New name"
                value={nameDraft}
                onChangeText={(t) => { setNameDraft(t); setErrors({}); }}
                error={errors.name}
                autoCapitalize="words"
              />
              <Pressable style={styles.save} onPress={saveName} disabled={busy}>
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveText}>{saved === "name" ? "Saved ✓" : "Save name"}</Text>
                )}
              </Pressable>
            </View>
          ) : null}

          <View style={styles.divider} />

          <Pressable style={styles.rowHead} onPress={() => toggle("password")}>
            <Text style={styles.rowLabel}>Password</Text>
            <View style={styles.rowRight}>
              <Text style={styles.rowValue}>••••••••</Text>
              <Text style={[styles.chev, open === "password" && styles.chevOpen]}>›</Text>
            </View>
          </Pressable>
          {open === "password" ? (
            <View style={styles.body}>
              <Input
                label="Current password"
                value={current}
                onChangeText={(t) => { setCurrent(t); setErrors({}); }}
                error={errors.current}
                secureTextEntry
                autoCapitalize="none"
              />
              <Input
                label="New password"
                value={next}
                onChangeText={(t) => { setNext(t); setErrors({}); }}
                error={errors.next}
                secureTextEntry
                autoCapitalize="none"
                placeholder="At least 8 characters"
              />
              <Input
                label="Confirm new password"
                value={again}
                onChangeText={(t) => { setAgain(t); setErrors({}); }}
                error={errors.again}
                secureTextEntry
                autoCapitalize="none"
              />
              {errors.form ? <Text style={styles.error}>{errors.form}</Text> : null}
              <Pressable style={styles.save} onPress={savePassword} disabled={busy}>
                {busy ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.saveText}>{saved === "password" ? "Saved ✓" : "Update password"}</Text>
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

        <View style={[styles.card, styles.cardGap]}>
          <Pressable
            style={styles.deleteRow}
            onPress={() => { setDeletePw(""); setDeleteError(""); setDeleting(true); }}
          >
            <Text style={styles.deleteLabel}>Delete account</Text>
            <Text style={styles.deleteSub}>Removes all your data for good</Text>
          </Pressable>
        </View>

      </ReAnimated.ScrollView>

      <ConfirmModal
        visible={loggingOut}
        title="Log out?"
        message="You'll need to log in again to see your rankings."
        confirmText="Log out"
        onConfirm={() => { setLoggingOut(false); signOut(); }}
        onCancel={() => setLoggingOut(false)}
      />

      <ConfirmModal
        visible={deleting}
        title="Delete your account?"
        message="All your categories, dishes and photos will be deleted. This cannot be undone. Enter your password to confirm."
        confirmText={deleteBusy ? "Deleting..." : "Delete"}
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleting(false)}
      >
        <View style={styles.pwBox}>
          <TextInput
            style={styles.input}
            value={deletePw}
            onChangeText={(t) => { setDeletePw(t); setDeleteError(""); }}
            secureTextEntry
            autoCapitalize="none"
            placeholder="Password"
            placeholderTextColor={PLACEHOLDER}
          />
          {deleteError ? <Text style={styles.error}>{deleteError}</Text> : null}
        </View>
      </ConfirmModal>

    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F0E4" },
  page: { flexGrow: 1, paddingTop: 60, paddingHorizontal: 20, paddingBottom: 120 },
  back: { fontSize: 15, color: "#6B6054", marginBottom: 12 },
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
  divider: { height: 1, backgroundColor: "#EFE6D3" },
  body: { paddingHorizontal: 16, paddingBottom: 16 },
  field: { marginBottom: 10 },
  label: { fontSize: 12, color: "#6B6054", marginBottom: 3, marginLeft: 2 },
  input: {
    backgroundColor: "#F6F0E4", borderWidth: 1, borderColor: "#D6C9B0", borderRadius: 12,
    paddingHorizontal: 12, height: 42, fontSize: 15, color: "#2B2622",
  },
  deleteRow: { paddingHorizontal: 16, paddingVertical: 14 },
  deleteLabel: { fontSize: 15, color: "#A32D2D" },
  deleteSub: { fontSize: 12, color: "#8C8073", marginTop: 2 },
  pwBox: { marginTop: 14 },
  error: { color: "#A32D2D", fontSize: 12, marginTop: 3, marginLeft: 2 },
  save: {
    backgroundColor: "#D9774F", borderRadius: 20, paddingVertical: 10,
    alignItems: "center", marginTop: 4,
  },
  saveText: { color: "#fff", fontSize: 14 },
});