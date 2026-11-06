import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, AppState, Pressable, StyleSheet, Text, View, Keyboard, Platform } from "react-native";

const ToastContext = createContext(null);
export const useToast = () => useContext(ToastContext);

const DURATION = 5000;
const BOTTOM = 96;

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const [hidden, setHidden] = useState({ dish: [], category: [], toEat: []  });
  const timer = useRef(null);
  const pending = useRef(null);
  const anim = useRef(new Animated.Value(0)).current;
  const expired = useRef(false);
  const [kb, setKb] = useState(false);

  const commitNow = useCallback(() => {
    clearTimeout(timer.current);
    const run = pending.current;
    pending.current = null;
    if (run) {
      expired.current = true;
      run();
    }
  }, []);

  const dismiss = useCallback(() => {
    Animated.timing(anim, { toValue: 0, duration: 220, useNativeDriver: true }).start(({ finished }) => {
      if (finished) setToast(null);
    });
  }, [anim]);

  const present = useCallback(
    (message, onUndo) => {
      expired.current = false;
      clearTimeout(timer.current);
      setToast({ message, onUndo });
      anim.setValue(0);
      Animated.spring(anim, { toValue: 1, friction: 7, tension: 70, useNativeDriver: true }).start();
      timer.current = setTimeout(() => {
        expired.current = true;
        commitNow();
        dismiss();
      }, DURATION);
    },
    [anim, commitNow, dismiss]
  );

  const showUndo = useCallback(
    ({ message, onUndo }) => {
      commitNow();
      present(message, onUndo);
    },
    [commitNow, present]
  );

  const deleteWithUndo = useCallback(
    ({ kind, id, label, commit, onUndo }) => {
      commitNow();
      setHidden((h) => ({ ...h, [kind]: [...h[kind], id] }));
      pending.current = commit;
      present(`Deleted ${label}`, () => {
        pending.current = null;
        setHidden((h) => ({ ...h, [kind]: h[kind].filter((x) => x !== id) }));
        if (onUndo) onUndo();
      });
    },
    [commitNow, present]
  );

  useEffect(() => {
    const showEvt = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvt = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";
    const a = Keyboard.addListener(showEvt, () => setKb(true));
    const b = Keyboard.addListener(hideEvt, () => setKb(false));
    return () => { a.remove(); b.remove(); };
  }, []);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (state) => {
      if (state !== "active") commitNow();
    });
    return () => sub.remove();
  }, [commitNow]);

  function onUndoPress() {
    if (expired.current) return;
    clearTimeout(timer.current);
    if (toast && toast.onUndo) toast.onUndo();
    dismiss();
  }

  const value = useMemo(
    () => ({ hidden, deleteWithUndo, showUndo, commitNow }),
    [hidden, deleteWithUndo, showUndo, commitNow]
  );

  return (
    <ToastContext.Provider value={value}>
      <View style={{ flex: 1 }}>
        {children}
        {toast ? (
          <Animated.View
            style={[
              styles.toast,
              { bottom: kb ? 12 : BOTTOM },
              {
                opacity: anim,
                transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [30, 0] }) }],
              },
            ]}
          >
            <Text style={styles.message} numberOfLines={2}>{toast.message}</Text>
            <Pressable onPress={onUndoPress} hitSlop={10}>
              <Text style={styles.undo}>Undo</Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: "absolute", left: 16, right: 16, bottom: BOTTOM, flexDirection: "row",
    alignItems: "center", justifyContent: "space-between", gap: 16, backgroundColor: "#2B2622",
    borderRadius: 16, paddingHorizontal: 16, paddingVertical: 12, elevation: 8, zIndex: 50,
  },
  message: { flex: 1, color: "#FFFBF3", fontSize: 14 },
  undo: { color: "#F6D98B", fontSize: 14, fontWeight: "500" },
});