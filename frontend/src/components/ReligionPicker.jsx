import { useNavigate, useLocation } from "react-router-dom";
import { RELIGIONS } from "../theme";
import { useReligion } from "../context/ReligionContext";
import Motif from "./Motif";

export default function ReligionPicker() {
  const navigate = useNavigate();
  const location = useLocation();
  const { selectReligion } = useReligion();

  // If we arrived here from a "compare in another tradition" action on the
  // Result screen, we re-run the same question once a religion is chosen.
  const rerouteQuestion = location.state?.rerouteQuestion || null;

  function handlePick(key) {
    selectReligion(key);
    if (rerouteQuestion) {
      navigate("/result", { state: { problem: rerouteQuestion, religionOverride: key }, replace: true });
    } else {
      navigate("/home");
    }
  }

  return (
    <div className="fade-screen" style={{ minHeight: "100vh", padding: "48px 20px 40px", maxWidth: 560, margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", fontSize: "1.7rem", marginBottom: 6 }}>
        {rerouteQuestion ? "See this through another lens" : "Choose your tradition"}
      </h2>
      <p style={{ textAlign: "center", color: "var(--ink-soft)", marginBottom: 32, fontSize: 14 }}>
        You can change this anytime from Settings.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
          gap: 14
        }}
      >
        {RELIGIONS.map((r) => (
          <button
            key={r.key}
            onClick={() => handlePick(r.key)}
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 10,
              padding: "22px 12px",
              borderRadius: "var(--radius)",
              border: "1px solid var(--stone-deep)",
              background: `radial-gradient(circle at 50% 0%, ${r.accentSoft}, #fff 65%)`,
              boxShadow: "var(--shadow)",
              transition: "transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = r.accent;
              e.currentTarget.style.boxShadow = `0 10px 28px ${r.accent}33`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "var(--stone-deep)";
              e.currentTarget.style.boxShadow = "var(--shadow)";
            }}
          >
            <div className="glow-halo" style={{ color: r.accent, "--accent-soft": r.accentSoft }}>
              <Motif type={r.motif} size={34} />
            </div>
            <span style={{ fontSize: 13.5, fontWeight: 600, textAlign: "center" }}>{r.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
