import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";

function Row({ icon, label, onPress, danger }) {
  return (
    <Pressable style={styles.row} onPress={onPress}>
      <Ionicons name={icon} size={20} color={danger ? "#A32D2D" : "#2B2622"} />
      <Text style={[styles.label, danger && { color: "#A32D2D" }]}>{label}</Text>
    </Pressable>
  );
}

export default function PhotoSheet({ visible, hasPhoto, onCamera, onGallery, onRemove, onClose }) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.sheet}>
          <Text style={styles.title}>Profile photo</Text>
          <Row icon="camera-outline" label="Take a photo" onPress={onCamera} />
          <Row icon="images-outline" label="Choose from gallery" onPress={onGallery} />
          {hasPhoto ? <Row icon="trash-outline" label="Remove photo" danger onPress={onRemove} /> : null}
          <Pressable style={styles.cancel} onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(43,38,34,0.4)", justifyContent: "flex-end" },
  sheet: { backgroundColor: "#FFFBF3", borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  title: { fontSize: 16, fontWeight: "500", color: "#2B2622", marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
  label: { fontSize: 16, color: "#2B2622" },
  cancel: { alignItems: "center", paddingVertical: 14, marginTop: 6 },
  cancelText: { fontSize: 15, color: "#6B6054" },
});