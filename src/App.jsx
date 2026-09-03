import { useEffect, useState } from "react";
import { watchAuth, getUserDoc, logout } from "./firebase.js";
import { COLORS, FONT_SERIF } from "./shared.js";
import AuthScreen from "./screens/AuthScreen.jsx";
import ClosetScreen from "./screens/ClosetScreen.jsx";
import BottomNav from "./components/BottomNav.jsx";

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [screen, setScreen] = useState("home");

  useEffect(() => {
    const unsub = watchAuth(async (user) => {
      setFirebaseUser(user);
      if (user) {
        const doc = await getUserDoc(user.uid);
        setUserDoc(doc);
      } else {
        setUserDoc(null);
      }
      setAuthLoading(false);
    });
    return unsub;
  }, []);

  if (authLoading) {
    return <SplashScreen />;
  }

  if (!firebaseUser) {
    return <AuthScreen />;
  }

  return (
    <div style={{ minHeight: "100vh", background: COLORS.cream, paddingBottom: 76 }}>
      {screen === "home" && <PlaceholderScreen title="Today" subtitle="Je dashboard komt hier — weer, outfit van vandaag, statistieken." />}
      {screen === "closet" && <ClosetScreen uid={firebaseUser.uid} />}
      {screen === "builder" && <PlaceholderScreen title="Create" subtitle="De outfit builder (met tuck & layer systeem) volgt in de volgende fase." />}
      {screen === "calendar" && <PlaceholderScreen title="Calendar" subtitle="Outfit planner met weersvoorspelling volgt later." />}
      {screen === "profile" && <ProfileScreen userDoc={userDoc} firebaseUser={firebaseUser} />}

      <BottomNav active={screen} onChange={setScreen} />
    </div>
  );
}

function SplashScreen() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: COLORS.cream,
      }}
    >
      <div style={{ fontFamily: FONT_SERIF, fontSize: 28, fontWeight: 800, color: COLORS.textDark, letterSpacing: "-0.02em" }}>
        KLOZI
      </div>
    </div>
  );
}

function PlaceholderScreen({ title, subtitle }) {
  return (
    <div style={{ padding: "60px 24px", textAlign: "center" }}>
      <h1 style={{ fontFamily: FONT_SERIF, fontSize: 26, color: COLORS.textDark, margin: "0 0 8px" }}>{title}</h1>
      <p style={{ color: COLORS.textMuted, fontSize: 14, lineHeight: 1.5 }}>{subtitle}</p>
    </div>
  );
}

function ProfileScreen({ userDoc, firebaseUser }) {
  return (
    <div style={{ padding: "40px 24px" }}>
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            margin: "0 auto 12px",
            background: `linear-gradient(155deg, ${COLORS.primaryLight} 0%, ${COLORS.primary} 100%)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#fff",
            fontFamily: FONT_SERIF,
            fontSize: 26,
            fontWeight: 700,
            overflow: "hidden",
          }}
        >
          {firebaseUser.photoURL ? (
            <img src={firebaseUser.photoURL} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          ) : (
            (userDoc?.displayName || firebaseUser.email || "?").charAt(0).toUpperCase()
          )}
        </div>
        <h2 style={{ fontFamily: FONT_SERIF, fontSize: 20, margin: 0, color: COLORS.textDark }}>
          {userDoc?.displayName || firebaseUser.displayName || "Style lover"}
        </h2>
        <p style={{ color: COLORS.textMuted, fontSize: 13, margin: "2px 0 0" }}>{firebaseUser.email}</p>
      </div>

      <button
        onClick={() => logout()}
        style={{
          width: "100%",
          padding: "13px 0",
          borderRadius: 14,
          border: `0.5px solid ${COLORS.border}`,
          background: COLORS.surface,
          color: COLORS.textDark,
          fontSize: 14,
          fontWeight: 600,
        }}
      >
        Uitloggen
      </button>
    </div>
  );
}
