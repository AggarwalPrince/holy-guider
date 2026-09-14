import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useReligion } from "../context/ReligionContext";
import { useWallet } from "../context/WalletContext";
import { saveJournalEntry } from "../utils/storage";
import Loader from "./Loader";
import Motif from "./Motif";
import WalletModal from "./WalletModal";

const API_BASE = import.meta.env.VITE_API_BASE || "";

export default function Result() {
  const location = useLocation();
  const navigate = useNavigate();
  const { religion, religionKey } = useReligion();
  const { user, walletBalance, updateBalance, openWalletModal } = useWallet();

  const problem = location.state?.problem;
  const religionOverride = location.state?.religionOverride;
  const preloaded = location.state?.preloaded;

  const [status, setStatus] = useState(preloaded ? "done" : "loading");
  const [data, setData] = useState(preloaded || null);
  const [saved, setSaved] = useState(Boolean(preloaded));

  const activeReligionKey = religionOverride || religionKey;

  useEffect(() => {
    if (!problem) {
      navigate("/home", { replace: true });
      return;
    }
    if (preloaded) return;

    let cancelled = false;
    setStatus("loading");
    setSaved(false);

    // Call /api/ask with userId and tradition
    fetch(`${API_BASE}/api/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: user?.id || user?._id || "dev_seeker",
        question: problem,
        tradition: activeReligionKey,
      }),
    })
      .then(async (res) => {
        const body = await res.json().catch(() => ({}));
        return { ok: res.ok, status: res.status, body };
      })
      .then(({ ok, status: statusCode, body }) => {
        if (cancelled) return;
        if (statusCode === 402) {
          setStatus("insufficient_funds");
          return;
        }
        if (!ok) {
          setStatus("error");
          return;
        }
        if (typeof body.walletBalance === "number") {
          updateBalance(body.walletBalance);
        }
        const answer = body.answer || body;
        setData(answer);
        setStatus("done");
        saveJournalEntry({
          problem,
          religionKey: activeReligionKey,
          religionName: answer.religion || activeReligionKey,
          result: answer,
          date: new Date().toISOString(),
        });
      })
      .catch(() => {
        if (!cancelled) setStatus("error");
      });

    return () => {
      cancelled = true;
    };
  }, [problem, activeReligionKey, preloaded, user?.id]);

  function handleSave() {
    if (!data) return;
    saveJournalEntry({
      problem,
      religionKey: activeReligionKey,
      religionName: data.religion,
      result: data,
      date: new Date().toISOString(),
    });
    setSaved(true);
  }

  function handleNewQuestion() {
    navigate("/home");
  }

  function handleOtherReligion() {
    navigate("/select-religion", { state: { rerouteQuestion: problem } });
  }

  if (!problem) return null;

  return (
    <div className="fade-screen" style={{ minHeight: "100vh", paddingBottom: 60 }}>
      <header
        style={{
          maxWidth: 560,
          margin: "0 auto",
          padding: "22px 20px 0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <button
          onClick={() => navigate(-1)}
          style={{ background: "none", border: "none", color: "var(--ink)", fontWeight: 600, fontSize: 14, cursor: "pointer" }}
        >
          ← Back
        </button>

        {/* Minimal Wallet Balance Badge */}
        <button
          onClick={openWalletModal}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#fff",
            border: "1.5px solid var(--stone-deep)",
            borderRadius: 999,
            padding: "5px 14px",
            fontSize: 13,
            color: "var(--ink)",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(13, 16, 19, 0.05)",
          }}
          title="Top up wallet"
        >
          <span style={{ color: "var(--ink-soft)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Balance</span>
          <strong style={{ color: "var(--accent)", fontSize: 14 }}>₹{walletBalance}</strong>
          <span style={{ color: "var(--accent)", fontWeight: 800, fontSize: 15 }}>+</span>
        </button>
      </header>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "12px 20px" }}>
        {status === "loading" && <Loader motif={religion?.motif} />}

        {status === "insufficient_funds" && (
          <div
            style={{
              textAlign: "center",
              padding: "48px 24px",
              background: "#fff",
              borderRadius: "var(--radius)",
              border: "1.5px solid var(--stone-deep)",
              boxShadow: "var(--shadow)",
              marginTop: 20,
            }}
          >
            <div className="glow-halo" style={{ display: "inline-block", color: "var(--accent)", marginBottom: 12 }}>
              <Motif type={religion?.motif} size={32} />
            </div>
            <h3 style={{ fontSize: "1.6rem", fontWeight: 700, margin: "0 0 8px", color: "var(--ink)" }}>Sacred Offering Required</h3>
            <p style={{ color: "var(--ink-soft)", fontSize: 15, fontWeight: 500, marginBottom: 22, lineHeight: 1.5 }}>
              Your current balance is <strong style={{ color: "var(--accent)" }}>₹{walletBalance}</strong>. An offering of ₹9 is required to consult the sacred scripture.
            </p>
            <button
              onClick={openWalletModal}
              style={{
                padding: "14px 34px",
                borderRadius: 999,
                border: "none",
                background: "var(--accent)",
                color: "#fff",
                fontWeight: 700,
                fontSize: 15,
                cursor: "pointer",
                boxShadow: "0 4px 14px rgba(158, 116, 24, 0.25)",
              }}
            >
              Add ₹9 to Wallet
            </button>
          </div>
        )}

        {status === "error" && (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ color: "var(--ink-soft)", marginBottom: 18, fontSize: 15, fontWeight: 500 }}>
              Something went wrong reaching for guidance. Please try again.
            </p>
            <button
              onClick={handleNewQuestion}
              style={{
                padding: "13px 30px",
                borderRadius: 999,
                border: "none",
                background: "var(--ink)",
                color: "#fff",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          </div>
        )}

        {status === "done" && data && (
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--accent)" }}>
              <div className="glow-halo">
                <Motif type={religion?.motif} size={24} />
              </div>
              <span style={{ fontSize: 14, fontWeight: 700, color: "var(--ink)" }}>{data.religion}</span>
            </div>

            {/* User's Original Question Inquiry */}
            <div
              style={{
                padding: "20px 22px",
                borderRadius: "var(--radius)",
                background: "#fff",
                border: "1.5px solid var(--stone-deep)",
                boxShadow: "var(--shadow)",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--accent)",
                  fontWeight: 800,
                  margin: "0 0 6px",
                }}
              >
                Your Inquiry
              </p>
              <p
                className="display"
                style={{
                  margin: 0,
                  fontSize: "1.25rem",
                  fontWeight: 600,
                  fontStyle: "italic",
                  lineHeight: 1.5,
                  color: "var(--ink)",
                }}
              >
                "{problem}"
              </p>
            </div>

            {/* Original verse block */}
            <section
              style={{
                padding: "28px 28px",
                borderRadius: "var(--radius)",
                background: "radial-gradient(circle at 90% 0%, var(--accent-soft), #fff 65%)",
                border: "1.5px solid var(--stone-deep)",
                boxShadow: "var(--shadow)",
                position: "relative",
                overflow: "hidden",
              }}
            >
              <div style={{ position: "absolute", bottom: -24, left: -24, color: "var(--accent)", opacity: 0.12 }}>
                <Motif type={religion?.motif} size={130} />
              </div>
              <p className="scripture-original" style={{ margin: "0 0 16px", position: "relative", color: "var(--ink)" }}>
                {data.verse?.original_script}
              </p>
              {data.verse?.transliteration && (
                <p style={{ fontStyle: "italic", color: "var(--ink-soft)", fontSize: 15, fontWeight: 500, margin: "0 0 16px", lineHeight: 1.5 }}>
                  {data.verse.transliteration}
                </p>
              )}
              <div
                style={{
                  borderTop: "1px solid rgba(0,0,0,0.10)",
                  paddingTop: 16,
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {data.verse?.hindi_translation && (
                  <div>
                    <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--accent)", fontWeight: 800, margin: "0 0 4px" }}>
                      Hindi
                    </p>
                    <p style={{ margin: 0, fontSize: 16, color: "var(--ink)", fontWeight: 500, lineHeight: 1.6 }}>{data.verse?.hindi_translation}</p>
                  </div>
                )}
                {data.verse?.english_translation && (
                  <div>
                    <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--accent)", fontWeight: 800, margin: "0 0 4px" }}>
                      English
                    </p>
                    <p style={{ margin: 0, fontSize: 16, color: "var(--ink)", fontWeight: 500, lineHeight: 1.6 }}>{data.verse?.english_translation}</p>
                  </div>
                )}
              </div>
              <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                {data.verse?.chapter && data.verse?.verse_number && (
                  <span
                    style={{
                      fontSize: 12.5,
                      fontWeight: 700,
                      color: "var(--accent)",
                      background: "var(--accent-soft)",
                      padding: "4px 12px",
                      borderRadius: 999,
                    }}
                  >
                    Ch {data.verse.chapter} · Verse {data.verse.verse_number}
                  </span>
                )}
                <p style={{ margin: 0, fontSize: 13.5, fontWeight: 700, color: "var(--ink)" }}>{data.verse?.reference}</p>
              </div>
            </section>

            {/* Context */}
            {data.context && (
              <p style={{ fontSize: 15, color: "var(--ink-soft)", fontWeight: 500, lineHeight: 1.6, margin: 0 }}>{data.context}</p>
            )}

            {/* Application */}
            <section
              style={{
                padding: "22px 24px",
                borderRadius: "var(--radius)",
                background: "#fff",
                border: "1.5px solid var(--stone-deep)",
                boxShadow: "var(--shadow)",
              }}
            >
              <p
                style={{
                  fontSize: 12,
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  color: "var(--accent)",
                  fontWeight: 800,
                  margin: "0 0 10px",
                }}
              >
                Applying this to your life
              </p>
              {data.application?.reframe && (
                <p className="display" style={{ fontStyle: "italic", fontSize: "1.2rem", fontWeight: 600, color: "var(--ink)", margin: "0 0 14px", lineHeight: 1.4 }}>
                  {data.application.reframe}
                </p>
              )}
              {Array.isArray(data.application?.action_steps) && (
                <ul style={{ margin: 0, paddingLeft: 22, display: "flex", flexDirection: "column", gap: 10 }}>
                  {data.application.action_steps.map((step, i) => (
                    <li key={i} style={{ fontSize: 15, color: "var(--ink)", fontWeight: 500, lineHeight: 1.6 }}>
                      {step}
                    </li>
                  ))}
                </ul>
              )}
            </section>

            {data.disclaimer && (
              <p style={{ fontSize: 12.5, color: "var(--ink-soft)", fontWeight: 500, fontStyle: "italic", textAlign: "center" }}>
                {data.disclaimer}
              </p>
            )}

            {/* Actions */}
            <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 6 }}>
              <button
                onClick={handleSave}
                disabled={saved}
                style={{
                  padding: "14px",
                  borderRadius: 999,
                  border: "1.5px solid var(--accent)",
                  background: saved ? "var(--accent-soft)" : "#fff",
                  color: "var(--accent)",
                  fontWeight: 700,
                  fontSize: 15,
                  cursor: "pointer",
                }}
              >
                {saved ? "Saved to journal" : "Save to journal"}
              </button>
              <div style={{ display: "flex", gap: 10 }}>
                <button
                  onClick={handleOtherReligion}
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: 999,
                    border: "1.5px solid var(--stone-deep)",
                    background: "#fff",
                    color: "var(--ink)",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  Ask in another religion
                </button>
                <button
                  onClick={handleNewQuestion}
                  style={{
                    flex: 1,
                    padding: "14px",
                    borderRadius: 999,
                    border: "none",
                    background: "var(--ink)",
                    color: "#fff",
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: "pointer",
                  }}
                >
                  New question
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
      <WalletModal />
    </div>
  );
}
