import { useNavigate } from "react-router-dom";

const card = { background: "#fff", padding: "24px", borderRadius: "var(--radius)", boxShadow: "var(--shadow)" };
const h2 = { fontSize: "1.2rem", marginTop: 0, color: "var(--ink)" };

export default function Terms() {
  const navigate = useNavigate();

  return (
    <div className="fade-screen" style={{ minHeight: "100vh", padding: "40px 20px 80px", maxWidth: 680, margin: "0 auto" }}>
      <button
        onClick={() => navigate(-1)}
        style={{
          background: "none",
          border: "none",
          color: "var(--ink-soft)",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        ← Back
      </button>

      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "2.2rem", margin: "0 0 8px", color: "var(--ink)" }}>Terms of Use</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: 0 }}>Holy Guider</p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, color: "var(--ink)", lineHeight: 1.7, fontSize: 15 }}>
        <section style={card}>
          <h2 style={h2}>1. Free to use</h2>
          <p style={{ margin: 0, color: "var(--ink-soft)" }}>
            Holy Guider is free. You sign in with your Google account and can seek scripture-based guidance without any payment. To keep the service available for everyone, each account has a daily limit on the number of consultations.
          </p>
        </section>

        <section style={card}>
          <h2 style={h2}>2. Scripture Advice Disclaimer</h2>
          <p style={{ margin: 0, color: "var(--ink-soft)" }}>
            Holy Guider provides AI-generated spiritual reflections rooted in historical world scriptures. It is meant for contemplation and personal peace. Please verify verses with the original scripture or a trusted teacher. It does not constitute certified medical, psychiatric, financial, or legal counsel.
          </p>
        </section>

        <section style={card}>
          <h2 style={h2}>3. Support</h2>
          <p style={{ margin: 0, color: "var(--ink-soft)" }}>
            Questions or problems? Email{" "}
            <a href="mailto:support@holyguider.com" style={{ color: "var(--brass)", fontWeight: 700 }}>
              support@holyguider.com
            </a>
            .
          </p>
        </section>
      </div>
    </div>
  );
}
