import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useReligion } from "../context/ReligionContext";
import { useWallet } from "../context/WalletContext";
import Motif from "./Motif";
import BottomNav from "./BottomNav";
import WalletModal from "./WalletModal";

// Small rotating set so the home screen never opens to an empty state.
const DAILY_PROMPTS = [
  "What does contentment mean to you today?",
  "Where in your life are you resisting change?",
  "Who do you owe forgiveness, including yourself?",
  "What would it feel like to let go of one worry today?"
];

export default function Home() {
  const { religion } = useReligion();
  const { walletBalance, openWalletModal } = useWallet();
  const navigate = useNavigate();
  const [input, setInput] = useState("");

  const dayIndex = new Date().getDate() % DAILY_PROMPTS.length;

  function handleSubmit(e) {
    e.preventDefault();
    if (!input.trim()) return;

    if (walletBalance < 9) {
      openWalletModal();
      return;
    }

    navigate("/result", { state: { problem: input.trim() } });
  }

  if (!religion) return null;

  return (
    <div className="fade-screen" style={{ minHeight: "100vh", paddingBottom: 90 }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "24px 20px 8px",
          maxWidth: 560,
          margin: "0 auto"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="glow-halo" style={{ color: "var(--accent)" }}>
            <Motif type={religion.motif} size={26} />
          </div>
          <span style={{ fontWeight: 700, fontSize: 16, color: "var(--ink)" }}>{religion.name}</span>
          <button
            onClick={() => navigate("/select-religion")}
            style={{
              background: "none",
              border: "none",
              color: "var(--ink-soft)",
              fontSize: 13,
              fontWeight: 600,
              textDecoration: "underline",
              cursor: "pointer",
              marginLeft: 4
            }}
          >
            Change
          </button>
        </div>

        {/* Minimal Wallet Badge matching stone & brass aesthetic */}
        <button
          onClick={openWalletModal}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: "#fff",
            border: "1.5px solid var(--stone-deep)",
            borderRadius: 999,
            padding: "6px 14px",
            fontSize: 13,
            color: "var(--ink)",
            cursor: "pointer",
            boxShadow: "0 2px 8px rgba(13, 16, 19, 0.05)",
            transition: "transform 150ms ease"
          }}
          title="Click to top up sacred wallet"
        >
          <span style={{ color: "var(--ink-soft)", fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>Balance</span>
          <strong style={{ color: "var(--accent)", fontSize: 14 }}>₹{walletBalance}</strong>
          <span style={{ color: "var(--accent)", fontWeight: 800, fontSize: 15, marginLeft: 2 }}>+</span>
        </button>
      </header>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "24px 20px" }}>
        <h1 style={{ fontSize: "2.1rem", fontWeight: 700, textAlign: "center", marginBottom: 28, color: "var(--ink)" }}>
          What's on your mind today?
        </h1>

        <form onSubmit={handleSubmit} style={{ marginBottom: 28 }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe a problem, worry, or feeling..."
            rows={4}
            style={{
              width: "100%",
              padding: "16px 18px",
              borderRadius: "var(--radius)",
              border: "1.5px solid var(--stone-deep)",
              background: "#fff",
              fontSize: 16,
              lineHeight: 1.5,
              fontWeight: 500,
              color: "var(--ink)",
              fontFamily: "inherit",
              resize: "none",
              boxShadow: "var(--shadow)",
              outline: "none"
            }}
          />
          <button
            type="submit"
            disabled={!input.trim()}
            style={{
              marginTop: 14,
              width: "100%",
              padding: "15px",
              borderRadius: 999,
              border: "none",
              background: input.trim() ? "var(--accent)" : "var(--stone-deep)",
              color: "#fff",
              fontWeight: 700,
              fontSize: 16,
              letterSpacing: "0.02em",
              cursor: input.trim() ? "pointer" : "default",
              boxShadow: input.trim() ? "0 4px 14px rgba(158, 116, 24, 0.25)" : "none",
              transition: "all 180ms ease"
            }}
          >
            Seek guidance
          </button>
          <div style={{ textAlign: "center", marginTop: 10 }}>
            <span style={{ fontSize: 13, color: "var(--ink-soft)", fontWeight: 600 }}>
              ₹9 will be deducted per answer
            </span>
          </div>
        </form>

        {/* Today's reflection card - clicking fills in the prompt */}
        <div
          onClick={() => setInput(DAILY_PROMPTS[dayIndex])}
          style={{
            padding: "22px 24px",
            borderRadius: "var(--radius)",
            background: "radial-gradient(circle at 15% 0%, var(--accent-soft), #fff 70%)",
            border: "1.5px solid var(--stone-deep)",
            boxShadow: "var(--shadow)",
            position: "relative",
            overflow: "hidden",
            cursor: "pointer"
          }}
          title="Click to explore this reflection"
        >
          <div style={{ position: "absolute", top: -20, right: -20, color: "var(--accent)", opacity: 0.16 }}>
            <Motif type={religion.motif} size={110} />
          </div>
          <p style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--accent)", fontWeight: 800, margin: "0 0 8px", position: "relative" }}>
            Today's reflection
          </p>
          <p className="display" style={{ fontSize: "1.25rem", fontWeight: 600, fontStyle: "italic", margin: 0, position: "relative", color: "var(--ink)", lineHeight: 1.4 }}>
            "{DAILY_PROMPTS[dayIndex]}"
          </p>
        </div>
      </main>

      <BottomNav />
      <WalletModal />
    </div>
  );
}
