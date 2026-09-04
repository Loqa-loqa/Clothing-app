import { useEffect, useMemo, useState } from "react";
import { watchItems, addOutfit } from "../firebase.js";
import { COLORS, FONT_SERIF, CATEGORIES, CATEGORY_LABELS, DEFAULT_LAYER, haptic } from "../shared.js";
import BodySilhouette, { mergeBodyShape, getPoseMetrics } from "../components/BodySilhouette.jsx";

// Builds where each category's photo lands on top of the silhouette, driven
// by the person's actual body-shape metrics (shoulder/waist/hip width,
// height scale) instead of fixed percentages — so a wider hips slider
// actually widens the bottoms overlay, a taller height stretches things
// down, etc. Everything is expressed in the same 240x560 viewBox space the
// silhouette itself uses, then converted to percentages of the preview box.
function buildAnchorBoxes(metrics) {
  const { cx, yHeadTop, yShoulder, yWaist, yHip, yFeet, shoulderW, chestW, hipW } = metrics;
  const xPct = (x) => `${(x / 240) * 100}%`;
  const yPct = (y) => `${(y / 560) * 100}%`;
  const wPct = (w) => `${(w / 240) * 100}%`;
  const hPct = (h) => `${(h / 560) * 100}%`;

  const topsWidth = shoulderW * 1.4;
  const topsTop = yShoulder - 16;
  const topsHeight = yWaist - topsTop + 18;

  const outerWidth = shoulderW * 1.55;
  const outerTop = yShoulder - 20;
  const outerHeight = yWaist - outerTop + 44;

  const bottomsWidth = hipW * 1.3;
  const bottomsTop = yWaist - 8;
  const bottomsHeight = (yFeet - bottomsTop) * 0.6;

  const dressWidth = Math.max(shoulderW, hipW) * 1.35;
  const dressTop = yShoulder - 16;
  const dressHeight = yFeet * 0.86 - dressTop;

  const accessoriesWidth = chestW * 1.15;

  return {
    accessories: { top: yPct(yHeadTop - 4), left: xPct(cx - accessoriesWidth / 2), width: wPct(accessoriesWidth), height: hPct(60) },
    outerwear: { top: yPct(outerTop), left: xPct(cx - outerWidth / 2), width: wPct(outerWidth), height: hPct(outerHeight) },
    tops: { top: yPct(topsTop), left: xPct(cx - topsWidth / 2), width: wPct(topsWidth), height: hPct(topsHeight) },
    dresses: { top: yPct(dressTop), left: xPct(cx - dressWidth / 2), width: wPct(dressWidth), height: hPct(dressHeight) },
    activewear: { top: yPct(dressTop), left: xPct(cx - dressWidth / 2), width: wPct(dressWidth), height: hPct(dressHeight) },
    swimwear: { top: yPct(dressTop), left: xPct(cx - dressWidth / 2), width: wPct(dressWidth), height: hPct(dressHeight) },
    bottoms: { top: yPct(bottomsTop), left: xPct(cx - bottomsWidth / 2), width: wPct(bottomsWidth), height: hPct(bottomsHeight) },
    shoes: { top: yPct(yFeet - 42), left: xPct(cx - hipW * 0.95), width: wPct(hipW * 1.9), height: hPct(52) },
    bags: { top: yPct(yHip + 10), left: xPct(cx + hipW * 0.55), width: wPct(hipW * 0.75), height: hPct(92) },
  };
}

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
  const poseMetrics = useMemo(() => getPoseMetrics(shape), [shape]);
  const anchorBoxes = useMemo(() => buildAnchorBoxes(poseMetrics), [poseMetrics]);

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
                ...anchorBoxes[category],
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
  layerImg: {
    width: "100%", height: "100%", objectFit: "contain",
    filter: "drop-shadow(0 6px 10px rgba(45,42,50,0.14))",
  },
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
