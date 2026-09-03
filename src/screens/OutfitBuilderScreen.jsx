import { useEffect, useMemo, useState } from "react";
import { watchItems, addOutfit } from "../firebase.js";
import { COLORS, FONT_SERIF, CATEGORIES, CATEGORY_LABELS, DEFAULT_LAYER, haptic } from "../shared.js";
import BodySilhouette, { mergeBodyShape } from "../components/BodySilhouette.jsx";

// Where each category's photo lands on top of the silhouette (percentages of
// the preview box), and in what stacking order.
const ANCHOR_BOXES = {
  accessories: { top: "1%", left: "30%", width: "40%", height: "16%" },
  outerwear: { top: "15%", left: "11%", width: "78%", height: "34%" },
  tops: { top: "16%", left: "16%", width: "68%", height: "30%" },
  dresses: { top: "16%", left: "18%", width: "64%", height: "62%" },
  activewear: { top: "16%", left: "18%", width: "64%", height: "62%" },
  swimwear: { top: "16%", left: "18%", width: "64%", height: "62%" },
  bottoms: { top: "36%", left: "20%", width: "60%", height: "48%" },
  shoes: { top: "88%", left: "22%", width: "56%", height: "12%" },
  bags: { top: "48%", left: "66%", width: "26%", height: "22%" },
};

// Categories offered as quick tabs, in a sensible outfit-building order.
const BUILD_TABS = ["dresses", "tops", "bottoms", "outerwear", "shoes", "bags", "accessories"];

const FULL_BODY_CATEGORIES = new Set(["dresses", "activewear", "swimwear"]);
const TOP_CATEGORIES = new Set(["tops"]);
const BOTTOM_CATEGORIES = new Set(["bottoms"]);

export default function OutfitBuilderScreen({ uid, userDoc, onGoToProfile }) {
  const [items, setItems] = useState(null);
  const [activeTab, setActiveTab] = useState("tops");
  const [outfitItems, setOutfitItems] = useState({});
  const [outfitName, setOutfitName] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    const unsub = watchItems(uid, setItems);
    return unsub;
  }, [uid]);

  const shape = useMemo(() => mergeBodyShape(userDoc?.bodyShape), [userDoc]);

  const itemsForTab = useMemo(() => {
    if (!items) return [];
    return items.filter((it) => it.category === activeTab);
  }, [items, activeTab]);

  const layers = useMemo(() => {
    return Object.entries(outfitItems)
      .filter(([, item]) => item)
      .sort(([a], [b]) => (DEFAULT_LAYER[a] ?? 2) - (DEFAULT_LAYER[b] ?? 2));
  }, [outfitItems]);

  function toggleItem(category, item) {
    haptic(10);
    setOutfitItems((prev) => {
      const isSame = prev[category]?.id === item.id;
      const next = { ...prev };

      if (isSame) {
        delete next[category];
        return next;
      }

      next[category] = item;
      // A dress replaces separate tops/bottoms, and vice versa, so the
      // preview doesn't show clashing layers.
      if (FULL_BODY_CATEGORIES.has(category)) {
        delete next.tops;
        delete next.bottoms;
      } else if (TOP_CATEGORIES.has(category) || BOTTOM_CATEGORIES.has(category)) {
        for (const fb of FULL_BODY_CATEGORIES) delete next[fb];
      }
      return next;
    });
  }

  async function handleSave() {
    if (layers.length === 0) return;
    setSaving(true);
    try {
      const snapshot = layers.map(([category, item]) => ({
        id: item.id,
        category,
        subcategory: item.subcategory || "",
        photoUrl: item.photoUrl || "",
      }));
      await addOutfit(uid, {
        name: outfitName.trim() || `Outfit ${new Date().toLocaleDateString("nl-NL")}`,
        items: snapshot,
      });
      setSavedFlash(true);
      setOutfitItems({});
      setOutfitName("");
      setTimeout(() => setSavedFlash(false), 2200);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Outfit maken</h1>
        <button onClick={onGoToProfile} style={styles.shapeLink}>Lichaamsvorm aanpassen</button>
      </div>

      <div style={styles.previewCard}>
        <div style={styles.previewInner}>
          <BodySilhouette shape={shape} style={{ height: "100%" }} />
          {layers.map(([category, item]) => (
            <div
              key={category}
              style={{
                position: "absolute",
                zIndex: DEFAULT_LAYER[category] ?? 2,
                ...ANCHOR_BOXES[category],
              }}
            >
              {item.photoUrl ? (
                <img src={item.photoUrl} alt="" style={styles.layerImg} />
              ) : null}
            </div>
          ))}
        </div>

        {layers.length === 0 && (
          <p style={styles.emptyHint}>Tik hieronder op kledingstukken om je outfit samen te stellen.</p>
        )}
      </div>

      <div style={styles.tabRow}>
        {BUILD_TABS.map((c) => (
          <button
            key={c}
            onClick={() => setActiveTab(c)}
            style={{
              ...styles.tab,
              ...(activeTab === c ? styles.tabActive : {}),
            }}
          >
            {CATEGORY_LABELS[c]}
            {outfitItems[c] && <span style={styles.tabDot} />}
          </button>
        ))}
      </div>

      {items === null && <div style={styles.emptyState}>Kledingkast laden...</div>}

      {items !== null && itemsForTab.length === 0 && (
        <div style={styles.emptyState}>
          Nog geen {CATEGORY_LABELS[activeTab].toLowerCase()} in je kast.
        </div>
      )}

      {items !== null && itemsForTab.length > 0 && (
        <div style={styles.pickerGrid}>
          {itemsForTab.map((item) => {
            const selected = outfitItems[activeTab]?.id === item.id;
            return (
              <button
                key={item.id}
                onClick={() => toggleItem(activeTab, item)}
                style={{
                  ...styles.pickerCard,
                  ...(selected ? styles.pickerCardSelected : {}),
                }}
              >
                {item.photoUrl ? (
                  <img src={item.photoUrl} alt="" style={styles.pickerImg} />
                ) : (
                  <div style={styles.pickerNoImg} />
                )}
              </button>
            );
          })}
        </div>
      )}

      <div style={styles.saveSection}>
        <input
          type="text"
          placeholder="Naam voor deze outfit (optioneel)"
          value={outfitName}
          onChange={(e) => setOutfitName(e.target.value)}
          style={styles.nameInput}
        />
        <button
          onClick={handleSave}
          disabled={layers.length === 0 || saving}
          style={styles.saveBtn}
        >
          {saving ? "Opslaan..." : savedFlash ? "Opgeslagen ✓" : "Outfit opslaan"}
        </button>
      </div>
    </div>
  );
}

const styles = {
  page: { padding: "24px 20px 100px" },
  headerRow: { display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 14, flexWrap: "wrap", gap: 4 },
  title: { fontFamily: FONT_SERIF, fontSize: 26, margin: 0, color: COLORS.textDark },
  shapeLink: { background: "none", border: "none", color: COLORS.primaryDark, fontSize: 12.5, fontWeight: 600, padding: 0 },
  previewCard: {
    background: COLORS.surface, borderRadius: 20, padding: "12px 12px 16px",
    marginBottom: 16,
  },
  previewInner: { position: "relative", height: 340, margin: "0 auto" },
  layerImg: { width: "100%", height: "100%", objectFit: "contain" },
  emptyHint: { textAlign: "center", fontSize: 12.5, color: COLORS.textMuted, margin: "8px 0 0" },
  tabRow: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 14 },
  tab: {
    padding: "8px 14px", borderRadius: 999, border: `0.5px solid ${COLORS.border}`,
    background: COLORS.surface, color: COLORS.textDark, fontSize: 13, fontWeight: 600,
    whiteSpace: "nowrap", flexShrink: 0, position: "relative",
  },
  tabActive: {
    background: `linear-gradient(155deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    color: "#fff", border: "0.5px solid transparent",
  },
  tabDot: {
    position: "absolute", top: -2, right: -2, width: 8, height: 8, borderRadius: "50%",
    background: COLORS.blush, border: `1.5px solid ${COLORS.cream}`,
  },
  emptyState: { textAlign: "center", padding: "30px 0", color: COLORS.textMuted, fontSize: 13.5 },
  pickerGrid: { display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8, marginBottom: 20 },
  pickerCard: {
    aspectRatio: "3/4", borderRadius: 12, overflow: "hidden", border: `1.5px solid transparent`,
    background: COLORS.surface, padding: 0,
  },
  pickerCardSelected: { border: `1.5px solid ${COLORS.primary}` },
  pickerImg: { width: "100%", height: "100%", objectFit: "cover" },
  pickerNoImg: { width: "100%", height: "100%", background: COLORS.surface },
  saveSection: { display: "flex", flexDirection: "column", gap: 10 },
  nameInput: {
    padding: "13px 16px", borderRadius: 14, border: `0.5px solid ${COLORS.border}`,
    background: COLORS.surface, fontSize: 14, color: COLORS.textDark, outline: "none", fontFamily: "inherit",
  },
  saveBtn: {
    padding: "14px 0", borderRadius: 50, border: "none", fontFamily: FONT_SERIF,
    fontWeight: 700, fontSize: 15, color: "#fff",
    background: `radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.35) 0%, transparent 50%), linear-gradient(155deg, ${COLORS.primaryLight} 0%, ${COLORS.primary} 100%)`,
    boxShadow: `0 4px 20px rgba(184,169,201,0.30)`,
  },
};
