import { useNavigate } from "react-router-dom";

export default function PrivacyPolicy() {
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
          gap: 6
        }}
      >
        ← Back
      </button>

      <header style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: "2.2rem", margin: "0 0 8px", color: "var(--ink)" }}>Privacy Policy</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 14, margin: 0 }}>
          Last updated: September 16, 2026 · Holy Guider (holyguider.com)
        </p>
      </header>

      <div style={{ display: "flex", flexDirection: "column", gap: 20, color: "var(--ink)", lineHeight: 1.7, fontSize: 15 }}>
        <section style={{ background: "#fff", padding: "24px", borderRadius: "var(--radius)", boxShadow: "var(--shadow)" }}>
          <h2 style={{ fontSize: "1.2rem", marginTop: 0, color: "var(--ink)" }}>1. Sacred Confidentiality</h2>
          <p style={{ margin: 0, color: "var(--ink-soft)" }}>
            At <strong>Holy Guider</strong>, we treat your personal struggles, spiritual inquiries, and moral dilemmas with absolute reverence and strict confidentiality. We do not sell, rent, or trade your personal spiritual reflections to any advertisers or third-party brokers.
          </p>
        </section>

        <section style={{ background: "#fff", padding: "24px", borderRadius: "var(--radius)", boxShadow: "var(--shadow)" }}>
          <h2 style={{ fontSize: "1.2rem", marginTop: 0, color: "var(--ink)" }}>2. Information We Collect</h2>
          <ul style={{ margin: 0, paddingLeft: 20, color: "var(--ink-soft)" }}>
            <li><strong>Account Details:</strong> Basic profile info (name, email) provided through Google sign-in (required to use the site).</li>
            <li><strong>Inquiries & Guidance:</strong> The text of questions you submit to seek scripture reflection.</li>
            <li><strong>Journal Data:</strong> Reflections saved to your personal journal are stored securely in your database account and your browser's private local storage.</li>
          </ul>
        </section>

        <section style={{ background: "#fff", padding: "24px", borderRadius: "var(--radius)", boxShadow: "var(--shadow)" }}>
          <h2 style={{ fontSize: "1.2rem", marginTop: 0, color: "var(--ink)" }}>3. How AI Guidance Operates</h2>
          <p style={{ margin: 0, color: "var(--ink-soft)" }}>
            When you submit a question, it is processed via secure HTTPS API to generate authentic scripture quotes, translations, and mindfulness practices. Inquiries are processed transiently and are not used to train public LLMs.
          </p>
        </section>

        <section style={{ background: "#fff", padding: "24px", borderRadius: "var(--radius)", boxShadow: "var(--shadow)" }}>
          <h2 style={{ fontSize: "1.2rem", marginTop: 0, color: "var(--ink)" }}>4. Data Rights & Contact</h2>
          <p style={{ margin: 0, color: "var(--ink-soft)" }}>
            You may request complete deletion of your account and inquiry history at any time. If you have any privacy questions or requests, please contact our support team at{" "}
            <a href="mailto:support@holyguider.com" style={{ color: "var(--accent)", fontWeight: 600 }}>support@holyguider.com</a>.
          </p>
        </section>
      </div>
    </div>
  );
}
