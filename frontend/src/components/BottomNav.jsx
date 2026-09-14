import { NavLink } from "react-router-dom";

const items = [
  { to: "/home", label: "Home", icon: "home" },
  { to: "/journal", label: "Journal", icon: "journal" },
  { to: "/settings", label: "Settings", icon: "settings" }
];

function Icon({ type, active }) {
  const color = active ? "var(--accent)" : "var(--ink-soft)";
  const common = { width: 22, height: 22, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round" };
  if (type === "home") {
    return (
      <svg {...common}>
        <path d="M4 11l8-7 8 7" />
        <path d="M6 10v9h12v-9" />
      </svg>
    );
  }
  if (type === "journal") {
    return (
      <svg {...common}>
        <rect x="5" y="4" width="14" height="17" rx="1.5" />
        <line x1="8" y1="9" x2="16" y2="9" />
        <line x1="8" y1="13" x2="16" y2="13" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="3" />
      <path d="M19 12a7 7 0 0 0-.1-1.2l2-1.5-2-3.4-2.3.9a7 7 0 0 0-2.1-1.2L14 3h-4l-.5 2.6a7 7 0 0 0-2.1 1.2l-2.3-.9-2 3.4 2 1.5A7 7 0 0 0 5 12c0 .4 0 .8.1 1.2l-2 1.5 2 3.4 2.3-.9c.6.5 1.3.9 2.1 1.2L10 21h4l.5-2.6c.8-.3 1.5-.7 2.1-1.2l2.3.9 2-3.4-2-1.5c.1-.4.1-.8.1-1.2z" />
    </svg>
  );
}

export default function BottomNav() {
  return (
    <nav
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        display: "flex",
        justifyContent: "space-around",
        background: "rgba(237,238,234,0.92)",
        backdropFilter: "blur(10px)",
        borderTop: "1px solid var(--stone-deep)",
        padding: "10px 0 calc(10px + env(safe-area-inset-bottom))",
        zIndex: 50
      }}
    >
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          style={{ textDecoration: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, minWidth: 64 }}
        >
          {({ isActive }) => (
            <>
              <Icon type={item.icon} active={isActive} />
              <span style={{ fontSize: 11, color: isActive ? "var(--accent)" : "var(--ink-soft)", fontWeight: isActive ? 600 : 500 }}>
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
