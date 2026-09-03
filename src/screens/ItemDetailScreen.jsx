import { useState } from "react";
import { deleteItem, updateItem } from "../firebase.js";
import {
  COLORS,
  FONT_SERIF,
  CATEGORY_LABELS,
  OCCASION_LABELS,
  SEASON_LABELS,
  toTitleCase,
  timeAgo,
  haptic,
} from "../shared.js";

export default function ItemDetailScreen({ uid, item, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [favorite, setFavorite] = useState(item.favorite);

  async function toggleFavorite() {
    const next = !favorite;
    setFavorite(next);
    haptic(8);
    try {
      await updateItem(uid, item.id, { favorite: next });
    } catch (e) {
      setFavorite(!next);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    try {
      await deleteItem(uid, item.id);
      onDeleted?.();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.header}>
        <button onClick={onClose} style={styles.iconBtn}>×</button>
        <button onClick={toggleFavorite} style={styles.iconBtn}>
          <HeartIcon filled={favorite} />
        </button>
      </div>

      <div style={styles.body}>
        <div style={styles.photoWrap}>
          {item.photoUrl ? (
            <img src={item.photoUrl} alt="" style={styles.photo} />
          ) : (
            <div style={styles.noPhoto}>Geen foto</div>
          )}
        </div>

        <div style={styles.info}>
          {item.brand && <div style={styles.brand}>{item.brand}</div>}
          <h2 style={styles.title}>{toTitleCase(item.subcategory) || "Item"}</h2>

          <div style={styles.badgeRow}>
            <Badge>{CATEGORY_LABELS[item.category] || item.category}</Badge>
            {item.color && <Badge>{item.color}</Badge>}
            {item.pattern && item.pattern !== "solid" && <Badge>{toTitleCase(item.pattern)}</Badge>}
          </div>

          {item.season?.length > 0 && (
            <div style={styles.badgeRow}>
              {item.season.map((s) => <Badge key={s} muted>{SEASON_LABELS[s] || s}</Badge>)}
            </div>
          )}
          {item.occasion?.length > 0 && (
            <div style={styles.badgeRow}>
              {item.occasion.map((o) => <Badge key={o} muted>{OCCASION_LABELS[o] || o}</Badge>)}
            </div>
          )}

          <div style={styles.statsCard}>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>Aantal keer gedragen</span>
              <span style={styles.statValue}>{item.wearCount ?? 0}</span>
            </div>
            <div style={styles.statRow}>
              <span style={styles.statLabel}>Laatst gedragen</span>
              <span style={styles.statValue}>{timeAgo(item.lastWorn)}</span>
            </div>
          </div>

          {item.notes && (
            <div style={styles.notes}>
              <div style={styles.notesLabel}>Notities</div>
              <div style={styles.notesText}>{item.notes}</div>
            </div>
          )}

          <div style={styles.deleteSection}>
            {!confirmingDelete ? (
              <button onClick={() => setConfirmingDelete(true)} style={styles.deleteBtn}>
                Item verwijderen
              </button>
            ) : (
              <div style={styles.confirmRow}>
                <span style={styles.confirmText}>Zeker weten?</span>
                <button onClick={handleDelete} disabled={deleting} style={styles.confirmDeleteBtn}>
                  {deleting ? "Bezig..." : "Ja, verwijder"}
                </button>
                <button onClick={() => setConfirmingDelete(false)} style={styles.confirmCancelBtn}>
                  Annuleren
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Badge({ children, muted }) {
  return (
    <span
      style={{
        fontSize: 12,
        fontWeight: 600,
        padding: "5px 12px",
        borderRadius: 999,
        background: muted ? COLORS.surface : COLORS.primaryLight,
        color: muted ? COLORS.textMuted : COLORS.primaryDark,
      }}
    >
      {children}
    </span>
  );
}

function HeartIcon({ filled }) {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill={filled ? COLORS.blush : "none"}>
      <path
        d="M12 20.5s-7.5-4.7-10-9.4C.6 8 2 4.5 5.5 3.6c2.1-.5 4.2.4 5.5 2.2 1.3-1.8 3.4-2.7 5.5-2.2C20 4.5 21.4 8 20 11.1c-2.5 4.7-8 9.4-8 9.4z"
        stroke={filled ? COLORS.blush : COLORS.textDark}
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const styles = {
  overlay: { position: "fixed", inset: 0, background: COLORS.cream, zIndex: 100, overflowY: "auto" },
  header: { display: "flex", justifyContent: "space-between", padding: 16, position: "sticky", top: 0 },
  iconBtn: {
    width: 34, height: 34, borderRadius: "50%", border: "none",
    background: "rgba(255,255,255,0.85)", color: COLORS.textDark, fontSize: 18,
    display: "flex", alignItems: "center", justifyContent: "center",
    boxShadow: "0 2px 8px rgba(45,42,50,0.08)",
  },
  body: { padding: "0 20px 60px", maxWidth: 480, margin: "0 auto" },
  photoWrap: { borderRadius: 20, overflow: "hidden", background: COLORS.surface, aspectRatio: "3/4", marginBottom: 20 },
  photo: { width: "100%", height: "100%", objectFit: "cover" },
  noPhoto: { width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: COLORS.textMuted, fontSize: 13 },
  info: { display: "flex", flexDirection: "column", gap: 10 },
  brand: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: COLORS.textMuted, fontWeight: 600 },
  title: { fontFamily: FONT_SERIF, fontSize: 24, margin: 0, color: COLORS.textDark },
  badgeRow: { display: "flex", flexWrap: "wrap", gap: 6, marginTop: 2 },
  statsCard: {
    background: COLORS.warmWhite, border: `0.5px solid ${COLORS.border}`, borderRadius: 16,
    padding: 14, marginTop: 10, display: "flex", flexDirection: "column", gap: 8,
  },
  statRow: { display: "flex", justifyContent: "space-between" },
  statLabel: { fontSize: 13, color: COLORS.textMuted },
  statValue: { fontSize: 13, fontWeight: 700, color: COLORS.textDark },
  notes: { marginTop: 6 },
  notesLabel: { fontSize: 11, textTransform: "uppercase", letterSpacing: "0.05em", color: COLORS.textMuted, fontWeight: 600, marginBottom: 4 },
  notesText: { fontSize: 14, color: COLORS.textDark, lineHeight: 1.5 },
  deleteSection: { marginTop: 24 },
  deleteBtn: {
    width: "100%", padding: "13px 0", borderRadius: 14, border: "0.5px solid rgba(180,68,74,0.25)",
    background: "rgba(180,68,74,0.06)", color: "#B4444A", fontSize: 14, fontWeight: 600,
  },
  confirmRow: { display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" },
  confirmText: { fontSize: 13, color: COLORS.textMuted },
  confirmDeleteBtn: { padding: "9px 14px", borderRadius: 10, border: "none", background: "#B4444A", color: "#fff", fontSize: 13, fontWeight: 600 },
  confirmCancelBtn: { padding: "9px 14px", borderRadius: 10, border: `0.5px solid ${COLORS.border}`, background: "transparent", color: COLORS.textDark, fontSize: 13, fontWeight: 600 },
};
