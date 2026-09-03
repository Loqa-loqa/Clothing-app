import { COLORS } from "../shared.js";

const TABS = [
  { id: "home", label: "Today", icon: SunIcon },
  { id: "closet", label: "Closet", icon: HangerIcon },
  { id: "builder", label: "Create", icon: PlusIcon },
  { id: "calendar", label: "Calendar", icon: CalendarIcon },
  { id: "profile", label: "Profile", icon: UserIcon },
];

export default function BottomNav({ active, onChange }) {
  return (
    <nav style={styles.nav}>
      {TABS.map((tab) => {
        const isActive = active === tab.id;
        const Icon = tab.icon;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            style={styles.tabBtn}
            aria-label={tab.label}
          >
            <div style={styles.iconWrap}>
              <Icon color={isActive ? COLORS.primary : COLORS.textMuted} />
              {isActive && <div style={styles.dot} />}
            </div>
            <span style={{ ...styles.label, color: isActive ? COLORS.primary : COLORS.textMuted }}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

function SunIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="4.5" stroke={color} strokeWidth="1.6" />
      <g stroke={color} strokeWidth="1.6" strokeLinecap="round">
        <line x1="12" y1="1.5" x2="12" y2="4" />
        <line x1="12" y1="20" x2="12" y2="22.5" />
        <line x1="1.5" y1="12" x2="4" y2="12" />
        <line x1="20" y1="12" x2="22.5" y2="12" />
        <line x1="4.5" y1="4.5" x2="6.2" y2="6.2" />
        <line x1="17.8" y1="17.8" x2="19.5" y2="19.5" />
        <line x1="4.5" y1="19.5" x2="6.2" y2="17.8" />
        <line x1="17.8" y1="6.2" x2="19.5" y2="4.5" />
      </g>
    </svg>
  );
}

function HangerIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M12 5.5a1.8 1.8 0 113 1.4" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <path d="M12 7l9 6.5c.8.6.3 1.8-.7 1.8H3.7c-1 0-1.5-1.2-.7-1.8L12 7z" stroke={color} strokeWidth="1.6" strokeLinejoin="round" />
      <line x1="4" y1="18.5" x2="20" y2="18.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function PlusIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="1.6" />
      <line x1="12" y1="7.5" x2="12" y2="16.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <line x1="7.5" y1="12" x2="16.5" y2="12" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CalendarIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <rect x="3.5" y="5" width="17" height="16" rx="3" stroke={color} strokeWidth="1.6" />
      <line x1="3.5" y1="9.5" x2="20.5" y2="9.5" stroke={color} strokeWidth="1.6" />
      <line x1="8" y1="3" x2="8" y2="6.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
      <line x1="16" y1="3" x2="16" y2="6.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function UserIcon({ color }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="8" r="3.5" stroke={color} strokeWidth="1.6" />
      <path d="M4.5 20c1.4-3.6 4.3-5.5 7.5-5.5s6.1 1.9 7.5 5.5" stroke={color} strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

const styles = {
  nav: {
    position: "fixed",
    bottom: 0,
    left: 0,
    right: 0,
    display: "flex",
    background: "rgba(254,252,250,0.88)",
    backdropFilter: "blur(24px)",
    WebkitBackdropFilter: "blur(24px)",
    borderTop: `0.5px solid ${COLORS.border}`,
    paddingBottom: "env(safe-area-inset-bottom, 8px)",
    paddingTop: 8,
    zIndex: 50,
  },
  tabBtn: {
    flex: 1,
    background: "transparent",
    border: "none",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: 3,
    padding: "4px 0 6px",
  },
  iconWrap: { position: "relative" },
  dot: {
    position: "absolute",
    bottom: -6,
    left: "50%",
    transform: "translateX(-50%)",
    width: 4,
    height: 4,
    borderRadius: "50%",
    background: COLORS.primary,
  },
  label: { fontSize: 10.5, fontWeight: 600 },
};
