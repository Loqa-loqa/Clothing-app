import { useEffect, useState } from "react";
import { watchAuth, getUserDoc } from "./firebase.js";
import { COLORS, FONT_SERIF } from "./shared.js";
import AuthScreen from "./screens/AuthScreen.jsx";
import ClosetScreen from "./screens/ClosetScreen.jsx";
import ProfileScreen from "./screens/ProfileScreen.jsx";
import OutfitBuilderScreen from "./screens/OutfitBuilderScreen.jsx";
import BottomNav from "./components/BottomNav.jsx";

export default function App() {
  const [authLoading, setAuthLoading] = useState(true);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);
  const [screen, setScreen] = useState("home");

  useEffect(() => {
    const unsub = watchAuth(async (user) => {
      setFirebaseUser(user);
      try {
        if (user) {
          const doc = await getUserDoc(user.uid);
          setUserDoc(doc);
        } else {
          setUserDoc(null);
        }
      } catch (err) {
        console.error("Kon gebruikersdocument niet laden:", err);
        setUserDoc(null);
      } finally {
        setAuthLoading(false);
      }
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
      {screen === "builder" && (
        <OutfitBuilderScreen
          uid={firebaseUser.uid}
          userDoc={userDoc}
          onGoToProfile={() => setScreen("profile")}
        />
      )}
      {screen === "calendar" && <PlaceholderScreen title="Calendar" subtitle="Outfit planner met weersvoorspelling volgt later." />}
      {screen === "profile" && (
        <ProfileScreen
          uid={firebaseUser.uid}
          userDoc={userDoc}
          firebaseUser={firebaseUser}
          onUserDocChange={setUserDoc}
        />
      )}

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
