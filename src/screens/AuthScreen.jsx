import { useState } from "react";
import {
  registerWithEmail,
  loginWithEmail,
  loginWithGoogle,
  ensureUserDoc,
} from "../firebase.js";
import { COLORS, FONT_SERIF } from "../shared.js";

const BODY_TYPES = [
  { id: "feminine", label: "Feminine" },
  { id: "masculine", label: "Masculine" },
  { id: "neutral", label: "Neutral" },
];

export default function AuthScreen() {
  const [mode, setMode] = useState("login"); // "login" | "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [bodyType, setBodyType] = useState("neutral");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "register") {
        const user = await registerWithEmail(email, password, displayName);
        await ensureUserDoc(user, { displayName, bodyType });
      } else {
        const user = await loginWithEmail(email, password);
        await ensureUserDoc(user, {});
      }
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setError("");
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      await ensureUserDoc(user, { bodyType });
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.glow} />
      <div style={styles.content}>
        <div style={styles.brand}>
          <div style={styles.logoMark}>K</div>
          <h1 style={styles.title}>KLOZI</h1>
          <p style={styles.tagline}>Your Closet, Styled</p>
        </div>

        <div style={styles.card}>
          <div style={styles.toggleRow}>
            <button
              type="button"
              onClick={() => setMode("login")}
              style={{ ...styles.toggleBtn, ...(mode === "login" ? styles.toggleBtnActive : {}) }}
            >
              Inloggen
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              style={{ ...styles.toggleBtn, ...(mode === "register" ? styles.toggleBtnActive : {}) }}
            >
              Registreren
            </button>
          </div>

          <form onSubmit={handleSubmit} style={styles.form}>
            {mode === "register" && (
              <input
                type="text"
                placeholder="Naam"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={styles.input}
                required
              />
            )}
            <input
              type="email"
              placeholder="E-mailadres"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={styles.input}
              required
            />
            <input
              type="password"
              placeholder="Wachtwoord"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={styles.input}
              required
              minLength={6}
            />

            {mode === "register" && (
              <div>
                <label style={styles.label}>Lichaamstype</label>
                <div style={styles.bodyTypeRow}>
                  {BODY_TYPES.map((bt) => (
                    <button
                      key={bt.id}
                      type="button"
                      onClick={() => setBodyType(bt.id)}
                      style={{
                        ...styles.bodyTypeBtn,
                        ...(bodyType === bt.id ? styles.bodyTypeBtnActive : {}),
                      }}
                    >
                      {bt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {error && <div style={styles.error}>{error}</div>}

            <button type="submit" disabled={loading} style={styles.primaryBtn}>
              {loading ? "Even geduld..." : mode === "login" ? "Inloggen" : "Account aanmaken"}
            </button>
          </form>

          <div style={styles.dividerRow}>
            <div style={styles.dividerLine} />
            <span style={styles.dividerText}>of</span>
            <div style={styles.dividerLine} />
          </div>

          <button type="button" onClick={handleGoogle} disabled={loading} style={styles.googleBtn}>
            <GoogleIcon />
            Doorgaan met Google
          </button>
        </div>
      </div>
    </div>
  );
}

function friendlyError(err) {
  const code = err?.code || "";
  if (code.includes("email-already-in-use")) return "Dit e-mailadres is al in gebruik.";
  if (code.includes("invalid-credential") || code.includes("wrong-password")) return "Onjuist e-mailadres of wachtwoord.";
  if (code.includes("user-not-found")) return "Geen account gevonden met dit e-mailadres.";
  if (code.includes("weak-password")) return "Wachtwoord moet minstens 6 tekens zijn.";
  if (code.includes("invalid-email")) return "Ongeldig e-mailadres.";
  if (code.includes("popup-closed-by-user")) return "Google-inlogvenster gesloten.";
  return "Er ging iets mis. Probeer het opnieuw.";
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" style={{ marginRight: 8 }}>
      <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84c-.21 1.13-.84 2.09-1.8 2.73v2.27h2.91c1.7-1.57 2.69-3.88 2.69-6.64z" />
      <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.91-2.27c-.81.54-1.84.86-3.05.86-2.35 0-4.34-1.58-5.05-3.71H.96v2.33C2.44 15.98 5.48 18 9 18z" />
      <path fill="#FBBC05" d="M3.95 10.7A5.4 5.4 0 013.68 9c0-.59.1-1.17.27-1.7V4.97H.96A9 9 0 000 9c0 1.45.35 2.83.96 4.03l2.99-2.33z" />
      <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0 5.48 0 2.44 2.02.96 4.97l2.99 2.33C4.66 5.16 6.65 3.58 9 3.58z" />
    </svg>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: COLORS.cream,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
    padding: 20,
  },
  glow: {
    position: "absolute",
    top: "-20%",
    left: "-10%",
    width: "70%",
    height: "50%",
    background: `radial-gradient(ellipse, ${COLORS.primaryLight} 0%, transparent 70%)`,
    filter: "blur(40px)",
  },
  content: { position: "relative", width: "100%", maxWidth: 400 },
  brand: { textAlign: "center", marginBottom: 28 },
  logoMark: {
    width: 56,
    height: 56,
    margin: "0 auto 12px",
    borderRadius: 18,
    background: `radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.35) 0%, transparent 50%), linear-gradient(155deg, ${COLORS.primaryLight} 0%, ${COLORS.primary} 100%)`,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    color: "#fff",
    fontFamily: FONT_SERIF,
    fontWeight: 700,
    fontSize: 26,
    boxShadow: `0 8px 24px rgba(184,169,201,0.35)`,
  },
  title: { fontFamily: FONT_SERIF, fontSize: 32, fontWeight: 800, margin: 0, letterSpacing: "-0.02em", color: COLORS.textDark },
  tagline: { fontFamily: FONT_SERIF, fontStyle: "italic", color: COLORS.textMuted, margin: "4px 0 0", fontSize: 15 },
  card: {
    background: COLORS.warmWhite,
    borderRadius: 24,
    padding: 24,
    boxShadow: "0 10px 40px rgba(45,42,50,0.06)",
    border: `0.5px solid ${COLORS.border}`,
  },
  toggleRow: {
    display: "flex",
    background: COLORS.surface,
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    border: "none",
    background: "transparent",
    padding: "10px 0",
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.textMuted,
  },
  toggleBtnActive: {
    background: COLORS.warmWhite,
    color: COLORS.textDark,
    boxShadow: "0 2px 8px rgba(45,42,50,0.08)",
  },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  input: {
    padding: "13px 16px",
    borderRadius: 14,
    border: `0.5px solid ${COLORS.border}`,
    background: COLORS.surface,
    fontSize: 14,
    color: COLORS.textDark,
    outline: "none",
  },
  label: { fontSize: 12, fontWeight: 600, color: COLORS.textMuted, marginBottom: 8, display: "block", textTransform: "uppercase", letterSpacing: "0.04em" },
  bodyTypeRow: { display: "flex", gap: 8 },
  bodyTypeBtn: {
    flex: 1,
    padding: "10px 0",
    borderRadius: 12,
    border: `0.5px solid ${COLORS.border}`,
    background: COLORS.surface,
    fontSize: 13,
    fontWeight: 600,
    color: COLORS.textDark,
  },
  bodyTypeBtnActive: {
    background: `linear-gradient(155deg, ${COLORS.primary} 0%, ${COLORS.primaryDark} 100%)`,
    color: "#fff",
    border: "0.5px solid transparent",
  },
  error: {
    fontSize: 13,
    color: "#B4444A",
    background: "rgba(180,68,74,0.08)",
    padding: "10px 12px",
    borderRadius: 10,
  },
  primaryBtn: {
    marginTop: 4,
    padding: "14px 0",
    borderRadius: 50,
    border: "none",
    fontFamily: FONT_SERIF,
    fontWeight: 700,
    fontSize: 15,
    color: "#fff",
    background: `radial-gradient(ellipse at 25% 20%, rgba(255,255,255,0.35) 0%, transparent 50%), linear-gradient(155deg, ${COLORS.primaryLight} 0%, ${COLORS.primary} 100%)`,
    boxShadow: `0 4px 20px rgba(184,169,201,0.30)`,
  },
  dividerRow: { display: "flex", alignItems: "center", gap: 10, margin: "20px 0" },
  dividerLine: { flex: 1, height: 1, background: COLORS.border },
  dividerText: { fontSize: 12, color: COLORS.textMuted },
  googleBtn: {
    width: "100%",
    padding: "12px 0",
    borderRadius: 14,
    border: `0.5px solid ${COLORS.border}`,
    background: "#fff",
    fontSize: 14,
    fontWeight: 600,
    color: COLORS.textDark,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
};
