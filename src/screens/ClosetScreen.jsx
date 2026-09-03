import { useEffect, useMemo, useState } from "react";
import { watchItems } from "../firebase.js";
import { COLORS, FONT_SERIF, CATEGORIES, CATEGORY_LABELS, toTitleCase } from "../shared.js";
import AddItemFlow from "./AddItemFlow.jsx";
import ItemDetailScreen from "./ItemDetailScreen.jsx";

const SORTS = [
  { id: "newest", label: "Nieuwste" },
  { id: "most-worn", label: "Meest gedragen" },
  { id: "least-worn", label: "Minst gedragen" },
  { id: "favorites", label: "Favorieten" },
];

export default function ClosetScreen({ uid }) {
  const [items, setItems] = useState(null); // null = loading
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [showAdd, setShowAdd] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const unsub = watchItems(uid, setItems);
    return unsub;
  }, [uid]);

  const filtered = useMemo(() => {
    if (!items) return [];
    let result = items;
    if (activeCategory !== "all") {
      result = result.filter((it) => it.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter((it) =>
        [it.subcategory, it.brand, it.notes, it.color]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q))
      );
    }
    const sorted = [...result];
    if (sort === "most-worn") sorted.sort((a, b) => (b.wearCount || 0) - (a.wearCount || 0));
    else if (sort === "least-worn") sorted.sort((a, b) => (a.wearCount || 0) - (b.wearCount || 0));
    else if (sort === "favorites") sorted.sort((a, b) => (b.favorite ? 1 : 0) - (a.favorite ? 1 : 0));
    // "newest" relies on the Firestore query's createdAt desc order already
    return sorted;
  }, [items, activeCategory, search, sort]);

  const stats = useMemo(() => {
    if (!items) return null;
    const byCategory = {};
    for (const c of CATEGORIES) byCategory[c] = 0;
    for (const it of items) byCategory[it.category] = (byCategory[it.category] || 0) + 1;
    return { total: items.length, byCategory };
  }, [items]);

  const notWornRecently = useMemo(() => {
    if (!items) return [];
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    return items.filter((it) => {
      if (!it.lastWorn) return true;
      const d = it.lastWorn.toDate ? it.lastWorn.toDate() : new Date(it.lastWorn);
      return Date.now() - d.getTime() > THIRTY_DAYS;
    });
  }, [items]);

  return (
    <div style={styles.page}>
      <div style={styles.headerRow}>
        <h1 style={styles.title}>Mijn Kledingkast</h1>
        {stats && (
          <p style={styles.statsLine}>
            {stats.total} items
            {CATEGORIES.filter((c) => stats.byCategory[c] > 0)
              .slice(0, 3)
              .map((c) => ` · ${stats.byCategory[c]} ${CATEGORY_LABELS[c].toLowerCase()}`)
              .join("")}
          </p>
        )}
      </div>

      <div style={styles.searchRow}>
        <input
          type="text"
          placeholder="Zoek op merk, kleur, type..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={styles.searchInput}
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)} style={styles.sortSelect}>
          {SORTS.map((s) => (
            <option key={s.id} value={s.id}>{s.label}</option>
          ))}
        </select>
      </div>

      <div style={styles.tabRow}>
        <CategoryTab active={activeCategory === "all"} onClick={() => setActiveCategory("all")}>Alle</CategoryTab>
        {CATEGORIES.map((c) => (
          <CategoryTab key={c} active={activeCategory === c} onClick={() => setActiveCategory(c)}>
            {CATEGORY_LABELS[c]}
          </CategoryTab>
        ))}
      </div>

      {items === null && (
        <div style={styles.emptyState}>Kledingkast laden...</div>
      )}

      {items !== null && items.length === 0 && (
        <EmptyCloset onAdd={() => setShowAdd(true)} />
      )}

      {items !== null && items.length > 0 && (
        <>
          <div style={styles.grid}>
            {filtered.map((item) => (
              <ItemCard key={item.id} item={item} onClick={() => setSelectedItem(item)} />
            ))}
          </div>
          {filtered.length === 0 && (
            <div style={styles.emptyState}>Geen items gevonden voor deze filters.</div>
          )}

          {activeCategory === "all" && !search && notWornRecently.length > 0 && (
            <div style={styles.rediscoverSection}>
              <h3 style={styles.rediscoverTitle}>Niet gedragen in 30+ dagen</h3>
              <div style={styles.rediscoverScroll}>
                {notWornRecently.slice(0, 10).map((item) => (
                  <div key={item.id} style={styles.rediscoverCard} onClick={() => setSelectedItem(item)}>
                    {item.photoUrl ? (
                      <img src={item.photoUrl} alt="" style={styles.rediscoverImg} />
                    ) : (
                      <div style={{ ...styles.rediscoverImg, background: COLORS.surface }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      <button style={styles.fab} onClick={() => setShowAdd(true)} aria-label="Item toevoegen">
        <PlusIcon />
      </button>

      {showAdd && (
        <AddItemFlow
          uid={uid}
          onClose={() => setShowAdd(false)}
          onSaved={() => setShowAdd(false)}
        />
      )}

      {selectedItem && (
        <ItemDetailScreen
          uid={uid}
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
          onDeleted={() => setSelectedItem(null)}
        />
      )}
    </div>
  );
}

function CategoryTab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: "8px 16px",
        borderRadius: 999,
        border: `0.5px solid ${active ? "transparent" : COLORS.border}`,
        background: active ? `linear-gradient(155deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)` : COLORS.surface,
        color: active ? "#fff" : COLORS.textDark,
        fontSize: 13,
        fontWeight: 600,
        whiteSpace: "nowrap",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}

function ItemCard({ item, onClick }) {
  return (
    <div style={styles.card} onClick={onClick}>
      <div style={styles.cardImgWrap}>
        {item.photoUrl ? (
          <img src={item.photoUrl} alt="" style={styles.cardImg} />
        ) : (
          <div style={styles.cardNoImg}>Geen foto</div>
        )}
        {item.favorite && (
          <div style={styles.favBadge}>
            <HeartIconSmall />
          </div>
        )}
      </div>
      <div style={styles.cardInfo}>
        {item.brand && <div style={styles.cardBrand}>{item.brand}</div>}
        <div style={styles.cardTitle}>{toTitleCase(item.subcategory) || "Item"}</div>
      </div>
    </div>
  );
}

function EmptyCloset({ onAdd }) {
  return (
    <div style={styles.emptyClosetWrap}>
      <div style={styles.emptyIcon}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
          <path d="M12 5.5a1.8 1.8 0 113 1.4" stroke={COLORS.primary} strokeWidth="1.4" strokeLinecap="round" />
          <path d="M12 7l9 6.5c.8.6.3 1.8-.7 1.8H3.7c-1 0-1.5-1.2-.7-1.8L12 7z" stroke={COLORS.primary} strokeWidth="1.4" strokeLinejoin="round" />
          <line x1="4" y1="18.5" x2="20" y2="18.5" stroke={COLORS.primary} strokeWidth="1.4" strokeLinecap="round" />
        </svg>
      </div>
      <h3 style={styles.emptyTitle}>Je kledingkast is nog leeg</h3>
      <p style={styles.emptySubtitle}>Voeg je eerste kledingstuk toe om te beginnen met stylen.</p>
      <button onClick={onAdd} style={styles.emptyBtn}>+ Eerste item toevoegen</button>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      <line x1="12" y1="5" x2="12" y2="19" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="5" y1="12" x2="19" y2="12" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

function HeartIconSmall() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill={COLORS.blush}>
      <path d="M12 20.5s-7.5-4.7-10-9.4C.6 8 2 4.5 5.5 3.6c2.1-.5 4.2.4 5.5 2.2 1.3-1.8 3.4-2.7 5.5-2.2C20 4.5 21.4 8 20 11.1c-2.5 4.7-8 9.4-8 9.4z" />
    </svg>
  );
}

const styles = {
  page: { padding: "24px 20px 100px" },
  headerRow: { marginBottom: 16 },
  title: { fontFamily: FONT_SERIF, fontSize: 26, margin: 0, color: COLORS.textDark },
  statsLine: { fontSize: 12.5, color: COLORS.textMuted, margin: "4px 0 0" },
  searchRow: { display: "flex", gap: 8, marginBottom: 12 },
  searchInput: {
    flex: 1, padding: "10px 14px", borderRadius: 12, border: `0.5px solid ${COLORS.border}`,
    background: COLORS.surface, fontSize: 13.5, color: COLORS.textDark, outline: "none",
  },
  sortSelect: {
    padding: "10px 10px", borderRadius: 12, border: `0.5px solid ${COLORS.border}`,
    background: COLORS.surface, fontSize: 13, color: COLORS.textDark,
  },
  tabRow: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6, marginBottom: 16 },
  grid: {
    display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10,
  },
  card: { display: "flex", flexDirection: "column", gap: 6 },
  cardImgWrap: {
    position: "relative", aspectRatio: "3/4", borderRadius: 14, overflow: "hidden",
    background: COLORS.surface,
  },
  cardImg: { width: "100%", height: "100%", objectFit: "cover" },
  cardNoImg: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, color: COLORS.textMuted, textAlign: "center", padding: 6 },
  favBadge: { position: "absolute", top: 6, right: 6, background: "rgba(255,255,255,0.85)", borderRadius: "50%", width: 20, height: 20, display: "flex", alignItems: "center", justifyContent: "center" },
  cardInfo: { padding: "0 2px" },
  cardBrand: { fontSize: 9.5, textTransform: "uppercase", letterSpacing: "0.04em", color: COLORS.textMuted },
  cardTitle: { fontSize: 12, fontWeight: 600, color: COLORS.textDark, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
  emptyState: { textAlign: "center", padding: "40px 0", color: COLORS.textMuted, fontSize: 13.5 },
  emptyClosetWrap: { textAlign: "center", padding: "50px 20px" },
  emptyIcon: {
    width: 96, height: 96, borderRadius: "50%", background: COLORS.primaryLight,
    display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px",
  },
  emptyTitle: { fontFamily: FONT_SERIF, fontSize: 19, color: COLORS.textDark, margin: "0 0 6px" },
  emptySubtitle: { fontSize: 13.5, color: COLORS.textMuted, margin: "0 0 20px" },
  emptyBtn: {
    padding: "12px 24px", borderRadius: 50, border: "none", fontFamily: FONT_SERIF,
    fontWeight: 700, fontSize: 14, color: "#fff",
    background: `linear-gradient(155deg, ${COLORS.primaryLight} 0%, ${COLORS.primary} 100%)`,
    boxShadow: `0 4px 20px rgba(184,169,201,0.30)`,
  },
  rediscoverSection: { marginTop: 32 },
  rediscoverTitle: { fontFamily: FONT_SERIF, fontSize: 16, color: COLORS.textDark, margin: "0 0 10px" },
  rediscoverScroll: { display: "flex", gap: 10, overflowX: "auto" },
  rediscoverCard: { width: 80, height: 100, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: COLORS.surface },
  rediscoverImg: { width: "100%", height: "100%", objectFit: "cover" },
  fab: {
    position: "fixed", bottom: 92, right: 20, width: 56, height: 56, borderRadius: "50%",
    border: "none", display: "flex", alignItems: "center", justifyContent: "center",
    background: `radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.35) 0%, transparent 50%), linear-gradient(155deg, ${COLORS.primaryLight} 0%, ${COLORS.primary} 100%)`,
    boxShadow: `0 6px 24px rgba(184,169,201,0.45)`, zIndex: 40,
  },
};
