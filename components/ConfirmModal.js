import { useEffect, useRef } from "react";
import { Animated, KeyboardAvoidingView, Modal, Pressable, StyleSheet, Text, View } from "react-native";

export default function ConfirmModal({
  visible, title, message, confirmText = "Confirm", danger = false, onConfirm, onCancel, children,
}) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      anim.setValue(0);
      Animated.timing(anim, { toValue: 1, duration: 220, useNativeDriver: true }).start();
    }
  }, [visible]);

  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [0.92, 1] });

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onCancel}>
      <KeyboardAvoidingView style={styles.backdrop} behavior="padding">
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <Animated.View style={[styles.card, { opacity: anim, transform: [{ scale }] }]}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
          {children}
          <View style={styles.row}>
            <Pressable style={styles.cancel} onPress={onCancel}>
              <Text style={styles.cancelText}>Cancel</Text>
            </Pressable>
            <Pressable
              style={[styles.confirm, { backgroundColor: danger ? "#A32D2D" : "#D9774F" }]}
              onPress={onConfirm}
            >
              <Text style={styles.confirmText}>{confirmText}</Text>
            </Pressable>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1, backgroundColor: "rgba(43,38,34,0.5)", alignItems: "center", justifyContent: "center",
  },
  card: { width: "82%", backgroundColor: "#FFFBF3", borderRadius: 22, padding: 22 },
  title: { fontSize: 18, fontWeight: "500", color: "#2B2622" },
  message: { fontSize: 14, lineHeight: 20, color: "#6B6054", marginTop: 6 },
  row: { flexDirection: "row", justifyContent: "flex-end", gap: 8, marginTop: 20 },
  cancel: { borderWidth: 1, borderColor: "#CDBFA6", borderRadius: 20, paddingHorizontal: 18, paddingVertical: 9 },
  cancelText: { fontSize: 14, color: "#2B2622" },
  confirm: { borderRadius: 20, paddingHorizontal: 20, paddingVertical: 9 },
  confirmText: { fontSize: 14, color: "#fff" },
});