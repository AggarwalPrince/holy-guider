import { useNavigate } from "react-router-dom";
import { useReligion } from "../context/ReligionContext";
import { useWallet } from "../context/WalletContext";
import Motif from "./Motif";
import BottomNav from "./BottomNav";
import WalletModal from "./WalletModal";

export default function Settings() {
  const { religion } = useReligion();
  const { user, walletBalance, openWalletModal, logout, loginDevUser } = useWallet();
  const navigate = useNavigate();

  return (
    <div className="fade-screen" style={{ minHeight: "100vh", paddingBottom: 90 }}>
      <header style={{ maxWidth: 560, margin: "0 auto", padding: "28px 20px 4px" }}>
        <h1 style={{ fontSize: "1.8rem", margin: 0 }}>Settings</h1>
      </header>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "20px 20px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Tradition Card */}
        <section
          style={{
            padding: "18px 20px",
            borderRadius: "var(--radius)",
            background: "#fff",
            boxShadow: "var(--shadow)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ color: "var(--accent)" }}>
              <Motif type={religion?.motif || "om"} size={26} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 12, color: "var(--ink-soft)" }}>Current tradition</p>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{religion?.name || "Not set"}</p>
            </div>
          </div>
          <button
            onClick={() => navigate("/select-religion")}
            style={{
              padding: "8px 16px",
              borderRadius: 999,
              border: "1px solid var(--stone-deep)",
              background: "transparent",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Change
          </button>
        </section>

        {/* Sacred Wallet Card */}
        <section
          style={{
            padding: "18px 20px",
            borderRadius: "var(--radius)",
            background: "#fff",
            boxShadow: "var(--shadow)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-soft)" }}>Sacred Consultation Wallet</p>
            <p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 700, color: "var(--accent)" }}>
              ₹{walletBalance}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-soft)" }}>₹9 deducted per inquiry</p>
          </div>
          <button
            onClick={openWalletModal}
            style={{
              padding: "9px 18px",
              borderRadius: 999,
              border: "none",
              background: "var(--accent)",
              color: "#fff",
              fontSize: 13,
              fontWeight: 600,
              cursor: "pointer",
              boxShadow: "0 2px 8px rgba(176, 141, 63, 0.2)",
            }}
          >
            + Top Up
          </button>
        </section>

        {/* Account Profile / Auth */}
        <section
          style={{
            padding: "18px 20px",
            borderRadius: "var(--radius)",
            background: "#fff",
            boxShadow: "var(--shadow)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div>
            <p style={{ margin: 0, fontSize: 12, color: "var(--ink-soft)" }}>Account</p>
            <p style={{ margin: "2px 0 0", fontSize: 14, fontWeight: 600 }}>
              {user ? user.name || user.email : "Guest Seeker"}
            </p>
            {user?.email && <p style={{ margin: 0, fontSize: 11, color: "var(--ink-soft)" }}>{user.email}</p>}
          </div>
          {user ? (
            <button
              onClick={logout}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid var(--stone-deep)",
                background: "transparent",
                fontSize: 12,
                color: "#9B1C1C",
                cursor: "pointer",
              }}
            >
              Sign Out
            </button>
          ) : (
            <button
              onClick={loginDevUser}
              style={{
                padding: "8px 14px",
                borderRadius: 999,
                border: "1px solid var(--stone-deep)",
                background: "transparent",
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              Log In
            </button>
          )}
        </section>

        <section style={{ padding: "18px 20px", borderRadius: "var(--radius)", background: "#fff", boxShadow: "var(--shadow)" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700 }}>About the guidance</p>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.6 }}>
            Verses, translations, and reflections are generated by AI and are meant as a starting
            point for reflection, not a substitute for original scripture or guidance from a
            trusted teacher. Please verify anything that matters to you against the source text.
          </p>
        </section>

        <section style={{ padding: "18px 20px", borderRadius: "var(--radius)", background: "#fff", boxShadow: "var(--shadow)" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700 }}>Your tradition, remembered</p>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.6 }}>
            Your chosen tradition is kept on this device for 24 hours, then you'll be asked again
            in case you'd like a fresh start. You can also change it here anytime.
          </p>
        </section>
      </main>

      <BottomNav />
      <WalletModal />
    </div>
  );
}
