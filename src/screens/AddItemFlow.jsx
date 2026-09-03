import { useEffect, useRef, useState } from "react";
import { addItem } from "../firebase.js";
import {
  COLORS,
  FONT_SERIF,
  CATEGORIES,
  CATEGORY_LABELS,
  SUBCATEGORIES,
  PATTERNS,
  PATTERN_LABELS,
  SEASONS,
  SEASON_LABELS,
  OCCASIONS,
  OCCASION_LABELS,
  DEFAULT_LAYER,
  uploadToCloudinary,
  bgRemovedUrl,
  cloudinaryConfigured,
  toTitleCase,
  haptic,
} from "../shared.js";

const STEPS = ["capture", "background", "categorize", "details"];

export default function AddItemFlow({ uid, onClose, onSaved }) {
  const [step, setStep] = useState(0);
  const [file, setFile] = useState(null);
  const [originalPreview, setOriginalPreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [publicId, setPublicId] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [bgRemovedReady, setBgRemovedReady] = useState(false);
  const [checkingBg, setCheckingBg] = useState(false);

  const [category, setCategory] = useState("tops");
  const [subcategory, setSubcategory] = useState(SUBCATEGORIES.tops[0]);
  const [colorHex, setColorHex] = useState("#B8A9C9");
  const [colorName, setColorName] = useState("");
  const [pattern, setPattern] = useState("solid");
  const [seasons, setSeasons] = useState([]);
  const [occasions, setOccasions] = useState([]);
  const [brand, setBrand] = useState("");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const cameraInputRef = useRef(null);
  const galleryInputRef = useRef(null);
  const canvasRef = useRef(null);

  function handleFilePick(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setOriginalPreview(URL.createObjectURL(f));
  }

  // Allow pasting a copied image (Cmd+V / Ctrl+V) while on the capture step.
  useEffect(() => {
    if (step !== 0) return;
    function handlePaste(e) {
      const items = e.clipboardData?.items;
      if (!items) return;
      for (const item of items) {
        if (item.type && item.type.startsWith("image/")) {
          const blob = item.getAsFile();
          if (blob) {
            setFile(blob);
            setOriginalPreview(URL.createObjectURL(blob));
          }
          e.preventDefault();
          break;
        }
      }
    }
    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, [step]);

  async function handleUploadAndContinue() {
    if (!file) return;
    setUploadError("");
    setUploading(true);
    try {
      if (cloudinaryConfigured()) {
        const { originalUrl: url, publicId: pid } = await uploadToCloudinary(file);
        setOriginalUrl(url);
        setPublicId(pid);
        setStep(1);
      } else {
        // Cloudinary not configured yet — skip straight through with the local preview.
        setOriginalUrl(originalPreview);
        setPublicId(null);
        setStep(2);
      }
    } catch (err) {
      setUploadError(err.message || "Upload mislukt.");
    } finally {
      setUploading(false);
    }
  }

  // Poll the background-removed Cloudinary URL until it's ready (or times out)
  useEffect(() => {
    if (step !== 1 || !publicId) return;
    let cancelled = false;
    let attempts = 0;
    setCheckingBg(true);
    setBgRemovedReady(false);

    async function poll() {
      attempts += 1;
      try {
        const url = bgRemovedUrl(publicId);
        const res = await fetch(url, { method: "HEAD" });
        if (res.ok && !cancelled) {
          setBgRemovedReady(true);
          setCheckingBg(false);
          return;
        }
      } catch (e) {
        // ignore, retry
      }
      if (attempts < 8 && !cancelled) {
        setTimeout(poll, 1500);
      } else if (!cancelled) {
        setCheckingBg(false); // give up gracefully, original photo is still usable
      }
    }
    poll();
    return () => {
      cancelled = true;
    };
  }, [step, publicId]);

  function toggleFromList(list, setList, value) {
    setList(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const finalImage = publicId && bgRemovedReady ? bgRemovedUrl(publicId) : originalUrl;
      await addItem(uid, {
        photoUrl: finalImage,
        photoUrlOriginal: originalUrl,
        category,
        subcategory,
        color: colorName || toTitleCase(subcategory),
        colorHex,
        pattern,
        season: seasons,
        occasion: occasions,
        brand: brand.trim(),
        notes: notes.trim(),
        layer: DEFAULT_LAYER[category] ?? 2,
      });
      haptic(15);
      onSaved?.();
    } catch (err) {
      setUploadError(err.message || "Opslaan mislukt.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={styles.overlay}>
      <div style={styles.header}>
        <button onClick={onClose} style={styles.closeBtn}>×</button>
        <div style={styles.stepDots}>
          {STEPS.map((s, i) => (
            <div key={s} style={{ ...styles.dot, background: i <= step ? COLORS.primary : COLORS.border }} />
          ))}
        </div>
        <div style={{ width: 32 }} />
      </div>

      <div style={styles.body}>
        {step === 0 && (
          <CaptureStep
            originalPreview={originalPreview}
            onPickCamera={() => cameraInputRef.current?.click()}
            onPickGallery={() => galleryInputRef.current?.click()}
            uploading={uploading}
            uploadError={uploadError}
            onContinue={handleUploadAndContinue}
            hasFile={Boolean(file)}
          />
        )}

        {step === 1 && (
          <BackgroundStep
            originalPreview={originalPreview}
            bgUrl={publicId ? bgRemovedUrl(publicId) : null}
            checking={checkingBg}
            ready={bgRemovedReady}
            onContinue={() => setStep(2)}
          />
        )}

        {step === 2 && (
          <CategorizeStep
            category={category}
            setCategory={(c) => {
              setCategory(c);
              setSubcategory(SUBCATEGORIES[c][0]);
            }}
            subcategory={subcategory}
            setSubcategory={setSubcategory}
            onContinue={() => setStep(3)}
          />
        )}

        {step === 3 && (
          <DetailsStep
            colorHex={colorHex}
            setColorHex={setColorHex}
            colorName={colorName}
            setColorName={setColorName}
            pattern={pattern}
            setPattern={setPattern}
            seasons={seasons}
            toggleSeason={(v) => toggleFromList(seasons, setSeasons, v)}
            occasions={occasions}
            toggleOccasion={(v) => toggleFromList(occasions, setOccasions, v)}
            brand={brand}
            setBrand={setBrand}
            notes={notes}
            setNotes={setNotes}
            onSave={handleSave}
            saving={saving}
            error={uploadError}
          />
        )}
      </div>

      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        onChange={handleFilePick}
        style={{ display: "none" }}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        onChange={handleFilePick}
        style={{ display: "none" }}
      />
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
}

function CaptureStep({ originalPreview, onPickCamera, onPickGallery, uploading, uploadError, onContinue, hasFile }) {
  return (
    <div style={styles.stepWrap}>
      <h2 style={styles.stepTitle}>Foto toevoegen</h2>
      <p style={styles.stepSubtitle}>Maak een foto, kies er een uit je galerij/bestanden, of plak een gekopieerde foto (Cmd+V / Ctrl+V).</p>

      <div style={styles.photoDrop} onClick={onPickGallery}>
        {originalPreview ? (
          <img src={originalPreview} alt="" style={styles.photoPreview} />
        ) : (
          <CameraIcon />
        )}
      </div>

      {uploadError && <div style={styles.errorBox}>{uploadError}</div>}

      <div style={styles.pickRow}>
        <button onClick={onPickCamera} style={styles.secondaryBtn}>Foto maken</button>
        <button onClick={onPickGallery} style={styles.secondaryBtn}>
          {hasFile ? "Andere foto kiezen" : "Uit galerij kiezen"}
        </button>
      </div>
      <button onClick={onContinue} disabled={!hasFile || uploading} style={styles.primaryBtn}>
        {uploading ? "Bezig met uploaden..." : "Doorgaan"}
      </button>
    </div>
  );
}

function BackgroundStep({ originalPreview, bgUrl, checking, ready, onContinue }) {
  return (
    <div style={styles.stepWrap}>
      <h2 style={styles.stepTitle}>Achtergrond verwijderen</h2>
      <p style={styles.stepSubtitle}>
        {checking ? "Bezig met verwerken..." : ready ? "Klaar! Zo ziet het eruit in je kledingkast." : "Kon de achtergrond niet automatisch verwijderen — geen probleem, we gebruiken gewoon de originele foto."}
      </p>

      <div style={styles.compareRow}>
        <div style={styles.compareCol}>
          <span style={styles.compareLabel}>Origineel</span>
          <img src={originalPreview} alt="" style={styles.comparePhoto} />
        </div>
        <div style={styles.compareCol}>
          <span style={styles.compareLabel}>Kledingkast</span>
          <div style={{ ...styles.comparePhoto, ...styles.compareGhostBg, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {checking ? (
              <Spinner />
            ) : ready ? (
              <img src={bgUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
            ) : (
              <img src={originalPreview} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: 12 }} />
            )}
          </div>
        </div>
      </div>

      <button onClick={onContinue} style={styles.primaryBtn}>Doorgaan</button>
    </div>
  );
}

function CategorizeStep({ category, setCategory, subcategory, setSubcategory, onContinue }) {
  return (
    <div style={styles.stepWrap}>
      <h2 style={styles.stepTitle}>Categorie</h2>
      <p style={styles.stepSubtitle}>In welke categorie hoort dit item thuis?</p>

      <div style={styles.chipGrid}>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            style={{ ...styles.chip, ...(category === c ? styles.chipActive : {}) }}
          >
            {CATEGORY_LABELS[c]}
          </button>
        ))}
      </div>

      <label style={styles.label}>Subcategorie</label>
      <div style={styles.chipGridScroll}>
        {SUBCATEGORIES[category].map((s) => (
          <button
            key={s}
            onClick={() => setSubcategory(s)}
            style={{ ...styles.chipSmall, ...(subcategory === s ? styles.chipActive : {}) }}
          >
            {toTitleCase(s)}
          </button>
        ))}
      </div>

      <button onClick={onContinue} style={styles.primaryBtn}>Doorgaan</button>
    </div>
  );
}

function DetailsStep({
  colorHex, setColorHex, colorName, setColorName, pattern, setPattern,
  seasons, toggleSeason, occasions, toggleOccasion, brand, setBrand, notes, setNotes,
  onSave, saving, error,
}) {
  return (
    <div style={styles.stepWrap}>
      <h2 style={styles.stepTitle}>Details</h2>
      <p style={styles.stepSubtitle}>Laatste stap — vul aan wat je weet.</p>

      <div style={styles.colorRow}>
        <input type="color" value={colorHex} onChange={(e) => setColorHex(e.target.value)} style={styles.colorPicker} />
        <input
          type="text"
          placeholder="Kleurnaam (bv. Blush roze)"
          value={colorName}
          onChange={(e) => setColorName(e.target.value)}
          style={{ ...styles.input, flex: 1 }}
        />
      </div>

      <label style={styles.label}>Patroon</label>
      <div style={styles.chipGridScroll}>
        {PATTERNS.map((p) => (
          <button key={p} onClick={() => setPattern(p)} style={{ ...styles.chipSmall, ...(pattern === p ? styles.chipActive : {}) }}>
            {PATTERN_LABELS[p]}
          </button>
        ))}
      </div>

      <label style={styles.label}>Seizoen</label>
      <div style={styles.chipGrid}>
        {SEASONS.map((s) => (
          <button key={s} onClick={() => toggleSeason(s)} style={{ ...styles.chip, ...(seasons.includes(s) ? styles.chipActive : {}) }}>
            {SEASON_LABELS[s]}
          </button>
        ))}
      </div>

      <label style={styles.label}>Gelegenheid</label>
      <div style={styles.chipGrid}>
        {OCCASIONS.map((o) => (
          <button key={o} onClick={() => toggleOccasion(o)} style={{ ...styles.chip, ...(occasions.includes(o) ? styles.chipActive : {}) }}>
            {OCCASION_LABELS[o]}
          </button>
        ))}
      </div>

      <input type="text" placeholder="Merk (optioneel)" value={brand} onChange={(e) => setBrand(e.target.value)} style={styles.input} />
      <textarea placeholder="Notities (optioneel)" value={notes} onChange={(e) => setNotes(e.target.value)} style={{ ...styles.input, minHeight: 70, resize: "vertical" }} />

      {error && <div style={styles.errorBox}>{error}</div>}

      <button onClick={onSave} disabled={saving} style={styles.primaryBtn}>
        {saving ? "Opslaan..." : "Toevoegen aan kledingkast"}
      </button>
    </div>
  );
}

function CameraIcon() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none">
      <path d="M4 8.5A1.5 1.5 0 015.5 7h2l1-1.5h7L16.5 7h2A1.5 1.5 0 0120 8.5v9A1.5 1.5 0 0118.5 19h-13A1.5 1.5 0 014 17.5v-9z" stroke={COLORS.primary} strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="12" cy="13" r="3.3" stroke={COLORS.primary} strokeWidth="1.6" />
    </svg>
  );
}

function Spinner() {
  return (
    <div style={{
      width: 22, height: 22, borderRadius: "50%",
      border: `2.5px solid ${COLORS.border}`, borderTopColor: COLORS.primary,
      animation: "klozi-spin 0.8s linear infinite",
    }}>
      <style>{`@keyframes klozi-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed", inset: 0, background: COLORS.cream, zIndex: 100,
    display: "flex", flexDirection: "column",
  },
  header: {
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "16px 16px 8px",
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: "50%", border: "none",
    background: COLORS.surface, color: COLORS.textDark, fontSize: 20, lineHeight: "32px",
  },
  stepDots: { display: "flex", gap: 6 },
  dot: { width: 6, height: 6, borderRadius: "50%" },
  body: { flex: 1, overflowY: "auto", padding: "8px 20px 40px" },
  stepWrap: { display: "flex", flexDirection: "column", gap: 12, maxWidth: 440, margin: "0 auto" },
  stepTitle: { fontFamily: FONT_SERIF, fontSize: 24, margin: "8px 0 0", color: COLORS.textDark },
  stepSubtitle: { color: COLORS.textMuted, fontSize: 13.5, margin: "0 0 8px", lineHeight: 1.5 },
  photoDrop: {
    aspectRatio: "3/4", borderRadius: 20, border: `1.5px dashed ${COLORS.border}`,
    background: COLORS.surface, display: "flex", alignItems: "center", justifyContent: "center",
    overflow: "hidden", marginBottom: 4,
  },
  photoPreview: { width: "100%", height: "100%", objectFit: "cover" },
  pickRow: { display: "flex", gap: 8 },
  secondaryBtn: {
    flex: 1, padding: "13px 0", borderRadius: 14, border: `0.5px solid ${COLORS.border}`,
    background: COLORS.surface, color: COLORS.textDark, fontSize: 13.5, fontWeight: 600,
  },
  primaryBtn: {
    padding: "14px 0", borderRadius: 50, border: "none", fontFamily: FONT_SERIF,
    fontWeight: 700, fontSize: 15, color: "#fff",
    background: `radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.35) 0%, transparent 50%), linear-gradient(155deg, ${COLORS.primaryLight} 0%, ${COLORS.primary} 100%)`,
    boxShadow: `0 4px 20px rgba(184,169,201,0.30)`, marginTop: 4,
  },
  errorBox: { fontSize: 13, color: "#B4444A", background: "rgba(180,68,74,0.08)", padding: "10px 12px", borderRadius: 10 },
  compareRow: { display: "flex", gap: 12 },
  compareCol: { flex: 1, display: "flex", flexDirection: "column", gap: 6 },
  compareLabel: { fontSize: 11, color: COLORS.textMuted, textAlign: "center", textTransform: "uppercase", letterSpacing: "0.04em" },
  comparePhoto: { aspectRatio: "3/4", borderRadius: 14, objectFit: "cover", width: "100%" },
  compareGhostBg: { background: COLORS.surface },
  chipGrid: { display: "flex", flexWrap: "wrap", gap: 8 },
  chipGridScroll: { display: "flex", gap: 8, overflowX: "auto", paddingBottom: 4 },
  chip: {
    padding: "9px 14px", borderRadius: 999, border: `0.5px solid ${COLORS.border}`,
    background: COLORS.surface, color: COLORS.textDark, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap",
  },
  chipSmall: {
    padding: "8px 12px", borderRadius: 999, border: `0.5px solid ${COLORS.border}`,
    background: COLORS.surface, color: COLORS.textDark, fontSize: 12.5, fontWeight: 600, whiteSpace: "nowrap", flexShrink: 0,
  },
  chipActive: {
    background: `linear-gradient(155deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    color: "#fff", border: "0.5px solid transparent",
  },
  label: { fontSize: 12, fontWeight: 600, color: COLORS.textMuted, textTransform: "uppercase", letterSpacing: "0.04em", marginTop: 4 },
  colorRow: { display: "flex", gap: 10, alignItems: "center" },
  colorPicker: { width: 44, height: 44, borderRadius: 12, border: `0.5px solid ${COLORS.border}`, padding: 2, background: "none" },
  input: {
    padding: "13px 16px", borderRadius: 14, border: `0.5px solid ${COLORS.border}`,
    background: COLORS.surface, fontSize: 14, color: COLORS.textDark, outline: "none", fontFamily: "inherit",
  },
};
