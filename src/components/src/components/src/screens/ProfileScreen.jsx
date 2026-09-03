import { useState } from "react";
import { logout, updateUserDoc } from "../firebase.js";
import { COLORS, FONT_SERIF } from "../shared.js";
import BodySilhouette, { mergeBodyShape } from "../components/BodySilhouette.jsx";

const PART_SLIDERS = [
  { key: "shoulders", label: "Schouders" },
  { key: "chest", label: "Borst / buste" },
  { key: "waist", label: "Taille" },
  { key: "hips", label: "Heupen" },
  { key: "arms", label: "Armen" },
  { key: "legs", label: "Benen" },
];

export default function ProfileScreen({ uid, userDoc, firebaseUser, onUserDocChange }) {
  const [shape, setShape] = useState(() => mergeBodyShape(userDoc?.bodyShape));
  const [saving, setSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);

  function setField(key, value) {
    setShape((s) => ({ ...s, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await updateUserDoc(uid, { bodyShape: shape });
      onUserDocChange?.({ ...(userDoc || {}), bodyShape: shape });
      setSavedFlash(true);
      setTimeout(() => setSavedFlash(false), 1800);
    } catch (err) {
      // Keep it low-key — this is a non-critical save.
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.avatarSection}>
        <div style={styles.avatar}>
          {firebaseUser.photoURL ? (
            <img src={firebaseUser.photoURL} alt="" style={styles.avatarImg} />
          ) : (
            (userDoc?.displayName || firebaseUser.email || "?").charAt(0).toUpperCase()
          )}
        </div>
        <h2 style={styles.name}>{userDoc?.displayName || firebaseUser.displayName || "Style lover"}</h2>
        <p style={styles.email}>{firebaseUser.email}</p>
      </div>

      <div style={styles.silhouetteCard}>
        <BodySilhouette shape={shape} style={{ height: 240 }} />
      </div>

      <div style={styles.sectionHeader}>
        <h3 style={styles.sectionTitle}>Lichaamsvorm</h3>
        <p style={styles.sectionSubtitle}>
          Pas het silhouet aan naar jouw lichaam — dit gebruiken we in de Outfit Builder.
        </p>
      </div>

      <SliderRow
        label="Lengte"
        value={shape.heightCm}
        display={`${shape.heightCm} cm`}
        min={140}
        max={200}
        step={1}
        onChange={(v) => setField("heightCm", v)}
      />

      <SliderRow
        label="Gewicht / bouw"
        value={shape.build}
        display={buildLabel(shape.build)}
        min={-1}
        max={1}
        step={0.05}
        onChange={(v) => setField("build", v)}
      />

      <div style={styles.divider} />

      {PART_SLIDERS.map(({ key, label }) => (
        <SliderRow
          key={key}
          label={label}
          value={shape[key]}
          display={percentLabel(shape[key])}
          min={-0.3}
          max={0.3}
          step={0.02}
          onChange={(v) => setField(key, v)}
        />
      ))}

      <button onClick={handleSave} disabled={saving} style={styles.saveBtn}>
        {saving ? "Opslaan..." : savedFlash ? "Opgeslagen ✓" : "Lichaamsvorm opslaan"}
      </button>

      <button onClick={() => logout()} style={styles.logoutBtn}>
        Uitloggen
      </button>
    </div>
  );
}

function buildLabel(v) {
  if (v < -0.5) return "Zeer slank";
  if (v < -0.15) return "Slank";
  if (v <= 0.15) return "Gemiddeld";
  if (v <= 0.5) return "Stevig";
  return "Zeer stevig";
}

function percentLabel(v) {
  const pct = Math.round(v * 100);
  return `${pct > 0 ? "+" : ""}${pct}%`;
}

function SliderRow({ label, value, display, min, max, step, onChange }) {
  return (
    <div style={styles.sliderRow}>
      <div style={styles.sliderLabelRow}>
        <span style={styles.sliderLabel}>{label}</span>
        <span style={styles.sliderValue}>{display}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={styles.slider}
      />
    </div>
  );
}

const styles = {
  page: { padding: "40px 24px 100px" },
  avatarSection: { textAlign: "center", marginBottom: 20 },
  avatar: {
    width: 72, height: 72, borderRadius: "50%", margin: "0 auto 12px",
    background: `linear-gradient(155deg, ${COLORS.primaryLight} 0%, ${COLORS.primary} 100%)`,
    display: "flex", alignItems: "center", justifyContent: "center",
    color: "#fff", fontFamily: FONT_SERIF, fontSize: 26, fontWeight: 700, overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%", objectFit: "cover" },
  name: { fontFamily: FONT_SERIF, fontSize: 20, margin: 0, color: COLORS.textDark },
  email: { color: COLORS.textMuted, fontSize: 13, margin: "2px 0 0" },
  silhouetteCard: {
    background: COLORS.surface, borderRadius: 20, padding: "16px 0 8px",
    display: "flex", justifyContent: "center", marginBottom: 24,
  },
  sectionHeader: { marginBottom: 6 },
  sectionTitle: { fontFamily: FONT_SERIF, fontSize: 18, margin: 0, color: COLORS.textDark },
  sectionSubtitle: { fontSize: 12.5, color: COLORS.textMuted, margin: "4px 0 16px", lineHeight: 1.5 },
  divider: { height: 1, background: COLORS.border, margin: "8px 0 16px" },
  sliderRow: { marginBottom: 16 },
  sliderLabelRow: { display: "flex", justifyContent: "space-between", marginBottom: 6 },
  sliderLabel: { fontSize: 13.5, fontWeight: 600, color: COLORS.textDark },
  sliderValue: { fontSize: 12.5, color: COLORS.primaryDark, fontWeight: 600 },
  slider: { width: "100%", accentColor: COLORS.primary },
  saveBtn: {
    width: "100%", padding: "14px 0", borderRadius: 50, border: "none", fontFamily: FONT_SERIF,
    fontWeight: 700, fontSize: 15, color: "#fff", marginTop: 8,
    background: `radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.35) 0%, transparent 50%), linear-gradient(155deg, ${COLORS.primaryLight} 0%, ${COLORS.primary} 100%)`,
    boxShadow: `0 4px 20px rgba(184,169,201,0.30)`,
  },
  logoutBtn: {
    width: "100%", padding: "13px 0", borderRadius: 14, border: `0.5px solid ${COLORS.border}`,
    background: COLORS.surface, color: COLORS.textDark, fontSize: 14, fontWeight: 600, marginTop: 12,
  },
};
