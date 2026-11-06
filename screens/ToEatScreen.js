import { useCallback, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
  Alert, BackHandler, LayoutAnimation, Linking, Pressable, RefreshControl, StyleSheet, Text, View,
} from "react-native";
import ReAnimated, { useAnimatedRef } from "react-native-reanimated";
import Sortable from "react-native-sortables";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { API } from "../config";
import { authFetch } from "../api";
import { useToast } from "../ToastContext";
import { useTabBarScroll } from "../components/FloatingTabBar";
import Texture from "../components/Texture";
import ConfirmModal from "../components/ConfirmModal";

function groupItems(items) {
  const groups = [];
  const byPlace = {};
  const byName = {};
  items.forEach((it) => {
    const nameKey = it.restaurant.trim().toLowerCase();
    let g = (it.place_id && byPlace[it.place_id]) || byName[nameKey];
    if (!g) {
      g = { id: `g${it.id}`, key: `g${it.id}`, restaurant: it.restaurant, map_link: it.map_link, items: [] };
      groups.push(g);
    }
    g.items.push(it);
    if (!g.map_link && it.map_link) g.map_link = it.map_link;
    if (it.place_id) byPlace[it.place_id] = g;
    byName[nameKey] = g;
  });
  return groups;
}

function NameText({ text, link }) {
  function openMaps() {
    Linking.openURL(link).catch(() => Alert.alert("Could not open the link"));
  }
  return link ? (
    <Text style={[styles.name, styles.link]} numberOfLines={1} onPress={openMaps}>{text} ↗</Text>
  ) : (
    <Text style={styles.name} numberOfLines={1}>{text}</Text>
  );
}

function Actions({ onDelete, onEdit, onTried }) {
  return (
    <View style={styles.actions}>
      <Pressable style={[styles.btn, styles.btnDel]} onPress={onDelete}>
        <Text style={styles.btnDelText}>Delete</Text>
      </Pressable>
      <Pressable style={styles.btn} onPress={onEdit}>
        <Text style={styles.btnText}>Edit</Text>
      </Pressable>
      <Pressable style={[styles.btn, styles.btnMain]} onPress={onTried}>
        <Text style={styles.btnMainText}>Tried it</Text>
      </Pressable>
    </View>
  );
}

function Entry({ item, open, onToggle, onDelete, onEdit, onTried }) {
  return (
    <View style={styles.card}>
      <Pressable style={styles.head} onPress={onToggle}>
        <View style={styles.headText}>
          <NameText text={item.restaurant} link={item.map_link} />
          {item.name ? <Text style={styles.label} numberOfLines={1}>{item.name}</Text> : null}
        </View>
        <Text style={[styles.chev, open && styles.chevOpen]}>›</Text>
      </Pressable>
      {open ? (
        <View style={styles.body}>
          {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
          <Actions
            onDelete={() => onDelete(item)}
            onEdit={() => onEdit(item)}
            onTried={() => onTried(item)}
          />
        </View>
      ) : null}
    </View>
  );
}

function SubRow({ item, open, onToggle, onDelete, onEdit, onTried }) {
  return (
    <View style={styles.subRow}>
      <Pressable style={styles.subHead} onPress={onToggle}>
        <Text style={styles.subName} numberOfLines={1}>{item.name || "No dish noted"}</Text>
        <Text style={[styles.chev, open && styles.chevOpen]}>›</Text>
      </Pressable>
      {open ? (
        <View style={styles.subBody}>
          {item.note ? <Text style={styles.note}>{item.note}</Text> : null}
          <Actions
            onDelete={() => onDelete(item)}
            onEdit={() => onEdit(item)}
            onTried={() => onTried(item)}
          />
        </View>
      ) : null}
    </View>
  );
}

function GroupCard({ group, open, onToggle, openItem, onToggleItem, onDelete, onEdit, onTried }) {
  const names = group.items.map((i) => i.name).filter(Boolean).join(", ");
  return (
    <View style={styles.card}>
      <Pressable style={styles.head} onPress={onToggle}>
        <View style={styles.headText}>
          <NameText text={group.restaurant} link={group.map_link} />
          {!open && names ? <Text style={styles.label} numberOfLines={1}>{names}</Text> : null}
        </View>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{group.items.length}</Text>
        </View>
        <Text style={[styles.chev, open && styles.chevOpen]}>›</Text>
      </Pressable>
      {open ? (
        <View style={styles.groupBody}>
          {group.items.map((it) => (
            <SubRow
              key={it.id}
              item={it}
              open={openItem === it.id}
              onToggle={() => onToggleItem(it.id)}
              onDelete={onDelete}
              onEdit={onEdit}
              onTried={onTried}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}

export default function ToEatScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const onScroll = useTabBarScroll();
  const scrollRef = useAnimatedRef();
  const { hidden, deleteWithUndo, commitNow } = useToast();
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState("");
  const [openGroup, setOpenGroup] = useState(null);
  const [openItem, setOpenItem] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [rearranging, setRearranging] = useState(false);
  const [draft, setDraft] = useState([]);
  const [saving, setSaving] = useState(false);

  const visible = items.filter((i) => !hidden.toEat.includes(i.id));
  const groups = groupItems(visible);
  const count = groups.length;
  const flat = (list) => list.flatMap((g) => g.items.map((i) => i.id));

  function load() {
    return authFetch(`${API}/to-eat/`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) { setItems(data); setError(""); }
      })
      .catch(() => setError("Could not reach the server"))
      .finally(() => setLoaded(true));
  }

  useFocusEffect(useCallback(() => { load(); }, []));

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener("hardwareBackPress", () => {
        if (rearranging) {
          setRearranging(false);
          return true;
        }
        return false;
      });
      return () => sub.remove();
    }, [rearranging])
  );

  useFocusEffect(
    useCallback(() => {
      return () => {
        setOpenGroup(null);
        setOpenItem(null);
        setRearranging(false);
      };
    }, [])
  );

  function animate() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  }

  function collapse() {
    animate();
    setOpenGroup(null);
    setOpenItem(null);
  }

  function toggleSingle(id) {
    animate();
    setOpenGroup(null);
    setOpenItem(openItem === id ? null : id);
  }

  function toggleGroup(key) {
    animate();
    setOpenItem(null);
    setOpenGroup(openGroup === key ? null : key);
  }

  function toggleSub(id) {
    animate();
    setOpenItem(openItem === id ? null : id);
  }

  function edit(item) {
    collapse();
    navigation.navigate("ToEatForm", { item });
  }

  function tried(item) {
    collapse();
    navigation.navigate("AddDish", { toEat: item });
  }

  function remove(item) {
    collapse();
    deleteWithUndo({
      kind: "toEat",
      id: item.id,
      label: item.restaurant,
      commit: () => authFetch(`${API}/to-eat/${item.id}/`, { method: "DELETE" }).catch(() => {}),
    });
  }

  function startRearrange() {
    commitNow();
    collapse();
    setDraft(groups);
    setRearranging(true);
  }

  async function postOrder(ids) {
    return authFetch(`${API}/to-eat/order/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order: ids }),
    });
  }

  async function saveOrder() {
    const before = groups;
    if (draft.every((d, i) => d.id === before[i].id)) {
      setRearranging(false);
      return;
    }
    setSaving(true);
    try {
      const res = await postOrder(flat(draft));
      if (!res.ok) throw new Error("bad response");
      setRearranging(false);
      await load();
    } catch {
      setError("Could not save the new order");
    }
    setSaving(false);
  }

  return (
    <View style={styles.screen}>
      <Texture />
      <ReAnimated.ScrollView
        ref={scrollRef}
        onScroll={onScroll}
        scrollEventThrottle={16}
        contentContainerStyle={[styles.page, { paddingBottom: insets.bottom + 130 }]}
        refreshControl={
          rearranging ? undefined : (
            <RefreshControl
              refreshing={refreshing}
              tintColor="#D9774F"
              colors={["#D9774F"]}
              onRefresh={() => { setRefreshing(true); load().finally(() => setRefreshing(false)); }}
            />
          )
        }
      >
        <View style={styles.headRow}>
          <View>
            <Text style={styles.title}>To eat</Text>
            <Text style={styles.sub}>
              {!loaded ? "Loading..." : `${count} ${count === 1 ? "place" : "places"} to try`}
            </Text>
          </View>
          <View style={styles.headActions}>
            {rearranging ? (
              <>
                <Pressable style={styles.pillOutline} onPress={() => setRearranging(false)} disabled={saving}>
                  <Text style={styles.pillOutlineText}>Cancel</Text>
                </Pressable>
                <Pressable style={styles.pillFill} onPress={saveOrder} disabled={saving}>
                  <Text style={styles.pillFillText}>{saving ? "Saving..." : "Done"}</Text>
                </Pressable>
              </>
            ) : (
              <>
                {count > 1 ? (
                  <Pressable style={styles.pillOutline} onPress={startRearrange}>
                    <Text style={styles.pillOutlineText}>Rearrange</Text>
                  </Pressable>
                ) : null}
                <Pressable style={styles.pillFill} onPress={() => navigation.navigate("ToEatForm")}>
                  <Text style={styles.pillFillText}>+ Add</Text>
                </Pressable>
              </>
            )}
          </View>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        {loaded && count === 0 && !error ? (
          <Text style={styles.empty}>Nothing queued yet. Add places you want to try.</Text>
        ) : null}

        {rearranging ? (
          <>
            <Text style={styles.hint}>Hold a place, then drag it to a new spot</Text>
            <Sortable.Grid
              columns={1}
              data={draft}
              rowGap={8}
              enableActiveItemSnap={false}
              activeItemScale={1.02}
              keyExtractor={(d) => d.id}
              scrollableRef={scrollRef}
              onDragEnd={({ data }) => setDraft(data)}
              renderItem={({ item }) => (
                <View style={styles.rankRow}>
                  <Text style={styles.rankNum}>{draft.findIndex((d) => d.id === item.id) + 1}</Text>
                  <View style={styles.headText}>
                    <Text style={styles.name} numberOfLines={1}>{item.restaurant}</Text>
                    {item.items.length > 1 ? (
                      <Text style={styles.label}>{item.items.length} dishes</Text>
                    ) : item.items[0].name ? (
                      <Text style={styles.label} numberOfLines={1}>{item.items[0].name}</Text>
                    ) : null}
                  </View>
                  <Text style={styles.handle}>≡</Text>
                </View>
              )}
            />
          </>
        ) : (
          groups.map((g) =>
            g.items.length === 1 ? (
              <Entry
                key={g.key}
                item={g.items[0]}
                open={openGroup === null && openItem === g.items[0].id}
                onToggle={() => toggleSingle(g.items[0].id)}
                onDelete={setPendingDelete}
                onEdit={edit}
                onTried={tried}
              />
            ) : (
              <GroupCard
                key={g.key}
                group={g}
                open={openGroup === g.key}
                onToggle={() => toggleGroup(g.key)}
                openItem={openItem}
                onToggleItem={toggleSub}
                onDelete={setPendingDelete}
                onEdit={edit}
                onTried={tried}
              />
            )
          )
        )}
      </ReAnimated.ScrollView>

      <ConfirmModal
        visible={!!pendingDelete}
        title="Delete this place?"
        message={
          pendingDelete
            ? `${pendingDelete.restaurant}${pendingDelete.name ? ` (${pendingDelete.name})` : ""} will be removed from your list.`
            : ""
        }
        confirmText="Delete"
        danger
        onConfirm={() => { const it = pendingDelete; setPendingDelete(null); remove(it); }}
        onCancel={() => setPendingDelete(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F6F0E4" },
  page: { paddingHorizontal: 20, paddingTop: 60 },
  headRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 18 },
  title: { fontSize: 28, fontWeight: "500", color: "#2B2622" },
  sub: { fontSize: 13, color: "#6B6054", marginTop: 2 },
  headActions: { flexDirection: "row", alignItems: "center", gap: 8, paddingTop: 4 },
  pillOutline: {
    backgroundColor: "#FFFBF3", borderWidth: 1, borderColor: "#D6C9B0", borderRadius: 18,
    paddingHorizontal: 14, paddingVertical: 7,
  },
  pillOutlineText: { fontSize: 13, color: "#2B2622" },
  pillFill: { backgroundColor: "#D9774F", borderRadius: 18, paddingHorizontal: 16, paddingVertical: 8 },
  pillFillText: { fontSize: 13, color: "#fff" },
  error: { color: "#A32D2D", marginBottom: 10 },
  empty: { fontSize: 14, color: "#6B6054", textAlign: "center", marginTop: 80, paddingHorizontal: 30 },
  hint: { fontSize: 12, color: "#6B6054", marginBottom: 10 },
  card: { backgroundColor: "#FFFBF3", borderRadius: 16, marginBottom: 10, overflow: "hidden" },
  head: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14 },
  headText: { flex: 1 },
  name: { fontSize: 15, fontWeight: "500", color: "#2B2622" },
  link: { color: "#A6492F", textDecorationLine: "underline", alignSelf: "flex-start", maxWidth: "100%" },
  label: { fontSize: 12, color: "#6B6054", marginTop: 1 },
  countBadge: {
    minWidth: 22, height: 22, borderRadius: 11, backgroundColor: "#F4E3B8",
    alignItems: "center", justifyContent: "center", paddingHorizontal: 6,
  },
  countText: { fontSize: 12, fontWeight: "500", color: "#6B4A12" },
  chev: { fontSize: 20, color: "#8C8073" },
  chevOpen: { transform: [{ rotate: "90deg" }] },
  body: { paddingHorizontal: 14, paddingBottom: 14 },
  groupBody: { paddingHorizontal: 10, paddingBottom: 10 },
  subRow: { backgroundColor: "#F8F1E1", borderRadius: 12, marginTop: 6, overflow: "hidden" },
  subHead: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 11 },
  subName: { flex: 1, fontSize: 14, color: "#2B2622" },
  subBody: { paddingHorizontal: 12, paddingBottom: 12 },
  note: { fontSize: 14, lineHeight: 20, color: "#5C5249", marginBottom: 12 },
  actions: { flexDirection: "row", gap: 8, alignItems: "center" },
  btn: { borderWidth: 1, borderColor: "#CDBFA6", borderRadius: 18, paddingHorizontal: 16, paddingVertical: 8 },
  btnText: { fontSize: 13, color: "#2B2622" },
  btnDel: { borderColor: "#E6B8B1" },
  btnDelText: { fontSize: 13, color: "#A32D2D" },
  btnMain: { backgroundColor: "#D9774F", borderColor: "#D9774F", marginLeft: "auto", paddingHorizontal: 20 },
  btnMainText: { fontSize: 13, color: "#fff" },
  rankRow: {
    flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: "#FFFBF3",
    borderRadius: 16, padding: 14,
  },
  rankNum: { width: 20, textAlign: "center", fontSize: 15, fontWeight: "500", color: "#6B6054" },
  handle: { fontSize: 22, color: "#8C8073", paddingHorizontal: 4 },
});