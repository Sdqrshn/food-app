import { useState } from "react";
import {
  ActivityIndicator, KeyboardAvoidingView, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { BRAND } from "../brand";
import { PLACEHOLDER } from "../config";
import Texture from "../components/Texture";
import { useAuth } from "../AuthContext";

const first = (v) => (Array.isArray(v) ? v.join(" ") : v);

function Field({ label, error, children }) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      {children}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState("login");
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const signingUp = mode === "signup";

  function switchMode() {
    setMode(signingUp ? "login" : "signup");
    setErrors({});
  }

  async function submit() {
    const found = {};
    if (signingUp && !displayName.trim()) found.display_name = "Enter a display name";
    if (!email.trim()) found.email = "Enter your email";
    if (!password) found.password = "Enter your password";
    if (Object.keys(found).length) return setErrors(found);

    setBusy(true);
    const result = signingUp
      ? await signUp(email.trim(), password, displayName.trim())
      : await signIn(email.trim(), password);
    if (!result.ok) {
      const e = result.errors || {};
      setErrors({
        display_name: first(e.display_name),
        email: first(e.email),
        password: first(e.password),
        form: first(e.error),
      });
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.screen} behavior="padding">
      <Texture />
      <ScrollView contentContainerStyle={styles.page} keyboardShouldPersistTaps="handled">
        <View style={styles.brand}>
          <Image source={require("../assets/icon.png")} style={styles.logo} />
          <Text style={styles.brandName}>{BRAND.name}</Text>
          <Text style={styles.motto}>{BRAND.motto}</Text>
        </View>
        <Text style={styles.heading}>{signingUp ? "Create your account" : "Welcome"}</Text>

        {signingUp ? (
          <Field label="Display name" error={errors.display_name}>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={(t) => { setDisplayName(t); setErrors({}); }}
              placeholder="Roshan"
              placeholderTextColor={PLACEHOLDER}
              autoCapitalize="words"
            />
          </Field>
        ) : null}

        <Field label="Email" error={errors.email}>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={(t) => { setEmail(t); setErrors({}); }}
            placeholder="you@example.com"
            placeholderTextColor={PLACEHOLDER}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </Field>

        <Field label="Password" error={errors.password}>
          <View>
            <TextInput
              style={[styles.input, styles.passwordInput]}
              value={password}
              onChangeText={(t) => { setPassword(t); setErrors({}); }}
              placeholder="At least 8 characters"
              placeholderTextColor={PLACEHOLDER}
              secureTextEntry={!show}
              autoCapitalize="none"
              onSubmitEditing={submit}
            />
            <Pressable style={styles.showBtn} onPress={() => setShow(!show)}>
              <Text style={styles.showText}>{show ? "Hide" : "Show"}</Text>
            </Pressable>
          </View>
        </Field>

        {errors.form ? <Text style={styles.error}>{errors.form}</Text> : null}

        <Pressable style={styles.submit} onPress={submit} disabled={busy}>
          {busy ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.submitText}>{signingUp ? "Sign up" : "Log in"}</Text>
          )}
        </Pressable>

        <Pressable onPress={switchMode}>
          <Text style={styles.switch}>
            {signingUp ? "Already have an account? Log in" : "New here? Create an account"}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F0E4" },
  page: { flexGrow: 1, justifyContent: "center", padding: 24 },
  title: { fontSize: 28, fontWeight: "500", color: "#2B2622" },
  sub: { fontSize: 14, color: "#6B6054", marginTop: 4, marginBottom: 24 },
  field: { marginBottom: 14 },
  label: { fontSize: 12, color: "#6B6054", marginBottom: 3, marginLeft: 2 },
  input: {
    backgroundColor: "#FFFBF3", borderWidth: 1, borderColor: "#D6C9B0", borderRadius: 12,
    paddingHorizontal: 12, height: 44, fontSize: 15, color: "#2B2622",
  },
  passwordInput: { paddingRight: 60 },
  showBtn: { position: "absolute", right: 12, top: 0, bottom: 0, justifyContent: "center" },
  showText: { fontSize: 13, color: "#A6492F" },
  error: { color: "#A32D2D", fontSize: 12, marginTop: 3, marginLeft: 2 },
  submit: {
    backgroundColor: "#D9774F", borderRadius: 22, paddingVertical: 13,
    alignItems: "center", marginTop: 8,
  },
  brand: { alignItems: "center", marginBottom: 26 },
  logo: { width: 84, height: 84, borderRadius: 22, marginBottom: 12 },
  brandName: { fontSize: 30, fontWeight: "500", color: "#2B2622" },
  motto: { fontSize: 14, color: "#6B6054", marginTop: 3 },
  heading: { fontSize: 18, fontWeight: "500", color: "#2B2622", marginBottom: 14 },
  submitText: { color: "#fff", fontSize: 16 },
  switch: { textAlign: "center", color: "#A6492F", fontSize: 14, marginTop: 18 },
});