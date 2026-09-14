import { useNavigate } from "react-router-dom";

export default function Welcome() {
  const navigate = useNavigate();

  return (
    <div
      className="fade-screen spiritual-backdrop"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "32px",
        gap: "18px",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Ambient rings — slow concentric rotation behind the mark, the one
          "signature" flourish this screen is allowed. */}
      <div className="ambient-rings" aria-hidden="true">
        <span className="ring ring-1" />
        <span className="ring ring-2" />
        <span className="ring ring-3" />
      </div>

      <div className="welcome-mark">
        <svg width="30" height="30" viewBox="0 0 48 48" fill="none" stroke="var(--brass)" strokeWidth="1.3">
          <circle cx="24" cy="24" r="15" />
          <circle cx="24" cy="24" r="8" opacity="0.5" />
          <path d="M24 9v6M24 33v6M9 24h6M33 24h6" opacity="0.4" />
        </svg>
      </div>

      <h1 style={{ fontSize: "2.3rem", margin: 0, position: "relative" }}>Holy Guider</h1>
      <p className="display" style={{ fontSize: "1.3rem", fontStyle: "italic", color: "var(--ink-soft)", maxWidth: 340, margin: 0, position: "relative" }}>
        Find guidance through spiritual wisdom
      </p>

      <button
        onClick={() => navigate("/select-religion")}
        style={{
          marginTop: 24,
          padding: "14px 40px",
          borderRadius: 999,
          border: "none",
          background: "var(--ink)",
          color: "var(--stone)",
          fontSize: "1rem",
          fontWeight: 600,
          letterSpacing: "0.02em",
          position: "relative",
          boxShadow: "0 10px 30px rgba(176,141,63,0.25)"
        }}
      >
        Begin
      </button>
    </div>
  );
}
