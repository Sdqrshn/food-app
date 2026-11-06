import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import {
  Alert, Image, Linking, Modal, Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { API, COLORS } from "../config";
import Texture from "../components/Texture";
import ConfirmModal from "../components/ConfirmModal";
import { authFetch } from "../api";
import FadingHighlight from "../components/FadingHighlight";
import { useToast } from "../ToastContext";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function shortDate(iso) {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

function triedDate(ymd) {
  const [y, m, d] = ymd.split("-");
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

function describe(history, i) {
  const now = history[i].rank;
  if (i === 0) return `placed at #${now}`;
  return now < history[i - 1].rank ? `moved up to #${now}` : `moved down to #${now}`;
}

export default function DetailScreen({ route, navigation }) {
  const { id } = route.params;
  const [dish, setDish] = useState(null);
  const [error, setError] = useState("");
  const [viewing, setViewing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const highlight = route.params?.highlight;
  const toast = useToast();

  useFocusEffect(
    useCallback(() => {
      authFetch(`${API}/dishes/${id}/`)
        .then((res) => {
          if (res.status === 404) {
            navigation.goBack();
            return null;
          }
          return res.json();
        })
        .then((data) => {
          if (data) { setDish(data); setError(""); }
        })
        .catch(() => setError("Could not reach the server"));
    }, [id])
  );


  function openMap() {
    Linking.openURL(dish.map_link).catch(() => Alert.alert("Could not open the link"));
  }

  function remove() {
    toast.deleteWithUndo({
      kind: "dish",
      id,
      label: dish.restaurant,
      commit: () => authFetch(`${API}/dishes/${id}/`, { method: "DELETE" }).catch(() => {}),
    });
    navigation.goBack();
  }

  if (!dish) {
    return (
      <View style={styles.screen}>
        <Texture />
        <View style={styles.page}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={styles.back}>← Back</Text>
          </Pressable>
          <Text style={error ? styles.error : styles.sub}>{error || "Loading..."}</Text>
        </View>
      </View>
    );
  }

  const events = (dish.history || [])
    .map((h, i) => ({ h, text: describe(dish.history, i) }))
    .reverse();

  return (
    <View style={styles.screen}>
      <Texture />
      <ScrollView contentContainerStyle={styles.page}>
        <View style={styles.topRow}>
          <Pressable onPress={() => navigation.goBack()}>
            <Text style={[styles.back, { marginBottom: 0 }]}>← Back</Text>
          </Pressable>
          <Pressable onPress={() => setMenuOpen(true)} hitSlop={14}>
            <Ionicons name="ellipsis-vertical" size={20} color="#6B6054" />
          </Pressable>
        </View>

        <Pressable
          onPress={() => dish.photo && setViewing(true)}
          style={[styles.hero, { backgroundColor: COLORS[dish.id % COLORS.length] }]}
        >
          {dish.photo ? (
            <Image source={{ uri: dish.photo }} style={StyleSheet.absoluteFill} />
          ) : (
            <Text style={styles.placeholder}>{dish.restaurant.charAt(0).toUpperCase()}</Text>
          )}
        </Pressable>

        {dish.map_link ? (
          <Pressable onPress={openMap}>
            <Text style={[styles.name, styles.titleLink]}>{dish.restaurant} ↗</Text>
          </Pressable>
        ) : (
          <Text style={styles.name}>{dish.restaurant}</Text>
        )}
        {dish.name ? <Text style={styles.restaurant}>{dish.name}</Text> : null}

        <View style={styles.chips}>
          {dish.price ? <Text style={styles.chip}>₹{Number(dish.price)}</Text> : null}
          {!dish.is_uncategorized ? (
            <Text style={styles.chip}>#{dish.rank} of {dish.total}</Text>
          ) : null}
          <Text style={styles.chip}>Tried {triedDate(dish.date_tried)}</Text>
        </View>

        <Text style={styles.section}>Note</Text>
        <FadingHighlight
          text={dish.note || "No note yet"}
          query={dish.note ? highlight : ""}
          runKey={dish.id}
          style={styles.note}
        />
        {!dish.is_uncategorized ? (
          <>
          <Text style={styles.section}>Rank history</Text>
          {events.length === 0 ? (
            <Text style={styles.sub}>No history yet</Text>
          ) : (
            <>
              <ScrollView style={styles.historyBox} nestedScrollEnabled>
                <View style={styles.timeline}>
                  {events.map(({ h, text }, i) => (
                    <View key={i} style={styles.event}>
                      <View style={styles.dot} />
                      <Text style={styles.eventText}>{shortDate(h.recorded_at)}: {text}</Text>
                    </View>
                  ))}
                </View>
              </ScrollView>
              {events.length > 3 ? <Text style={styles.moreHint}>Scroll for older entries</Text> : null}
            </>
          )}
          </>
        ) : null}
      </ScrollView>

      {!dish.is_uncategorized ? (
        <View style={styles.bar}>
          <Pressable style={styles.primary} onPress={() => navigation.navigate("Matchup", { dish })}>
            <Text style={styles.primaryText}>Re-rank</Text>
          </Pressable>
        </View>
      ) : null}

      <Modal
        visible={viewing}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setViewing(false)}
      >
        <Pressable style={styles.viewer} onPress={() => setViewing(false)}>
          {dish.photo ? (
            <Image source={{ uri: dish.photo }} style={styles.full} resizeMode="contain" />
          ) : null}
          <Text style={styles.close}>✕</Text>
        </Pressable>
      </Modal>

      <Modal visible={menuOpen} transparent animationType="fade" statusBarTranslucent onRequestClose={() => setMenuOpen(false)}>
        <Pressable style={{ flex: 1 }} onPress={() => setMenuOpen(false)}>
          <View style={styles.menu}>
            <Pressable
              style={styles.menuItem}
              onPress={() => { setMenuOpen(false); navigation.navigate("ChooseCategory", { dish }); }}
            >
              <Ionicons name={dish.is_uncategorized ? "folder-open-outline" : "swap-horizontal-outline"} size={18} color="#2B2622" />
              <Text style={styles.menuText}>{dish.is_uncategorized ? "Sort into a category" : "Move"}</Text>
            </Pressable>
            <Pressable
              style={styles.menuItem}
              onPress={() => { setMenuOpen(false); navigation.navigate("AddDish", { dish }); }}
            >
              <Ionicons name="create-outline" size={18} color="#2B2622" />
              <Text style={styles.menuText}>Edit</Text>
            </Pressable>
            <Pressable style={styles.menuItem} onPress={() => { setMenuOpen(false); setConfirming(true); }}>
              <Ionicons name="trash-outline" size={18} color="#A32D2D" />
              <Text style={[styles.menuText, { color: "#A32D2D" }]}>Delete</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <ConfirmModal
        visible={confirming}
        title="Delete this dish?"
        message={`${dish.restaurant} will be removed from the ranking.`}
        confirmText="Delete"
        danger
        onConfirm={() => { setConfirming(false); remove(); }}
        onCancel={() => setConfirming(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F0E4" },
  page: { paddingTop: 60, paddingHorizontal: 20, paddingBottom: 24 },
  back: { fontSize: 15, color: "#6B6054", marginBottom: 12 },
  sub: { fontSize: 13, color: "#6B6054" },
  error: { color: "#A32D2D" },
  hero: { height: 200, borderRadius: 18, overflow: "hidden", marginBottom: 14 },
  placeholder: {
    position: "absolute", top: 0, left: 0, right: 0, bottom: 0, textAlign: "center",
    textAlignVertical: "center", fontSize: 64, color: "rgba(255,251,243,0.5)",
  },
  name: { fontSize: 24, fontWeight: "500", color: "#2B2622" },
  titleLink: { color: "#A6492F", textDecorationLine: "underline" },
  restaurant: { fontSize: 15, color: "#6B6054", marginTop: 2 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginTop: 12 },
  chip: {
    fontSize: 12, backgroundColor: "#F1E4C8", color: "#6B4A12",
    borderRadius: 10, paddingHorizontal: 9, paddingVertical: 3, overflow: "hidden",
  },
  section: { fontSize: 12, color: "#6B6054", marginTop: 18, marginBottom: 4 },
  note: { fontSize: 15, lineHeight: 22, color: "#2B2622" },
  timeline: { borderLeftWidth: 1.5, borderLeftColor: "#D6C9B0", marginLeft: 4, paddingLeft: 14 },
  event: { marginBottom: 8, justifyContent: "center" },
  dot: {
    position: "absolute", left: -19.5, top: 5, width: 8, height: 8,
    borderRadius: 4, backgroundColor: "#D9774F",
  },
  eventText: { fontSize: 13, lineHeight: 18, color: "#5C5249" },
  historyBox: { maxHeight: 78 },
  moreHint: { fontSize: 12, color: "#8C8073", marginTop: 2 },
  viewer: { flex: 1, backgroundColor: "rgba(20,16,12,0.95)", justifyContent: "center" },
  full: { width: "100%", height: "80%" },
  close: { position: "absolute", top: 50, right: 24, fontSize: 24, color: "#FFFBF3" },
  bar: {
    flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 20, paddingTop: 12,
    paddingBottom: 24, backgroundColor: "rgba(246,240,228,0.96)",
    borderTopWidth: 0.5, borderTopColor: "#D6C9B0",
  },
  primary: {
    flex: 1, backgroundColor: "#D9774F", borderRadius: 22, paddingVertical: 11, alignItems: "center",
  },
  primaryText: { color: "#fff", fontSize: 15 },
  outline: {
    borderWidth: 1, borderColor: "#CDBFA6", borderRadius: 20, paddingHorizontal: 18, paddingVertical: 10,
  },
  outlineText: { color: "#2B2622", fontSize: 14 },
  deleteBtn: {
    borderWidth: 1, borderColor: "#E6B8B1", borderRadius: 20, paddingHorizontal: 14,
    paddingVertical: 10, marginLeft: 8,
  },
  deleteText: { color: "#A32D2D", fontSize: 14 },
  topRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  menu: {
    position: "absolute", top: 96, right: 20, minWidth: 150, backgroundColor: "#FFFBF3", borderRadius: 14,
    borderWidth: 1, borderColor: "#E8DCC4", paddingVertical: 6, elevation: 8,
    shadowColor: "#2B2622", shadowOpacity: 0.15, shadowRadius: 10, shadowOffset: { width: 0, height: 4 },
  },
  menuItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
  menuText: { fontSize: 15, color: "#2B2622" },
});