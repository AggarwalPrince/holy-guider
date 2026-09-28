import { useNavigate } from "react-router-dom";
import { useReligion } from "../context/ReligionContext";
import { useAuth } from "../context/AuthContext";
import Motif from "./Motif";
import BottomNav from "./BottomNav";

import { useState } from "react";

export default function Settings() {
  const { religion } = useReligion();
  const { user, logout, loginAdmin, isAdmin } = useAuth();
  const navigate = useNavigate();

  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPasscode, setAdminPasscode] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminSuccess, setAdminSuccess] = useState("");
  const [adminLoading, setAdminLoading] = useState(false);

  const handleAdminSubmit = async (e) => {
    e.preventDefault();
    setAdminError("");
    setAdminSuccess("");
    setAdminLoading(true);

    const result = await loginAdmin(adminPasscode);
    setAdminLoading(false);

    if (result.success) {
      setAdminSuccess("👑 Admin authorization confirmed! Admin access unlocked.");
      setTimeout(() => {
        setIsAdminModalOpen(false);
        setAdminPasscode("");
      }, 1200);
    } else {
      setAdminError(result.error || "Invalid administrator passcode.");
    }
  };

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

        {/* Free access card */}
        <section
          style={{
            padding: "18px 20px",
            borderRadius: "var(--radius)",
            background: isAdmin ? "#FFF8E7" : "#fff",
            border: isAdmin ? "1.5px solid var(--brass)" : "none",
            boxShadow: "var(--shadow)",
          }}
        >
          <p style={{ margin: 0, fontSize: 12, color: "var(--ink-soft)" }}>
            {isAdmin ? "Administrator Privileges" : "Your plan"}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 18, fontWeight: 700, color: isAdmin ? "var(--brass)" : "var(--accent)" }}>
            {isAdmin ? "👑 Unlimited Guidance" : "Free guidance"}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: 11, color: "var(--ink-soft)" }}>
            No payment needed — just sign in with Google.
          </p>
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
              {isAdmin ? "👑 Holy Guider Administrator" : user?.name || user?.email}
            </p>
            {user?.email && (
              <p style={{ margin: 0, fontSize: 11, color: "var(--ink-soft)" }}>{user.email}</p>
            )}
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {!isAdmin && (
              <button
                onClick={() => setIsAdminModalOpen(true)}
                style={{
                  padding: "7px 12px",
                  borderRadius: 999,
                  border: "1px solid var(--stone-deep)",
                  background: "transparent",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "var(--ink-soft)",
                  cursor: "pointer",
                }}
              >
                Admin Login
              </button>
            )}
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
          </div>
        </section>

        {/* Policies & Assurance Section */}
        <section style={{ padding: "18px 20px", borderRadius: "var(--radius)", background: "#fff", boxShadow: "var(--shadow)" }}>
          <p style={{ margin: "0 0 12px", fontSize: 13, fontWeight: 700 }}>Policies & Support</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            <button
              onClick={() => navigate("/terms")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "var(--stone)",
                borderRadius: "10px",
                border: "none",
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--ink)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span>📄 Terms of Use</span>
              <span>→</span>
            </button>
            <button
              onClick={() => navigate("/privacy")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "10px 14px",
                background: "var(--stone)",
                borderRadius: "10px",
                border: "none",
                fontSize: 13.5,
                fontWeight: 600,
                color: "var(--ink)",
                cursor: "pointer",
                textAlign: "left",
              }}
            >
              <span>🔒 Privacy Policy</span>
              <span>→</span>
            </button>
          </div>
          <p style={{ margin: "14px 0 0", fontSize: 12, color: "var(--ink-soft)", lineHeight: 1.5 }}>
            Need help? Email <strong>support@holyguider.com</strong>.
          </p>
        </section>

        {/* Tradition Remembered */}
        <section style={{ padding: "18px 20px", borderRadius: "var(--radius)", background: "#fff", boxShadow: "var(--shadow)" }}>
          <p style={{ margin: "0 0 8px", fontSize: 13, fontWeight: 700 }}>Your tradition, remembered</p>
          <p style={{ margin: 0, fontSize: 13.5, color: "var(--ink-soft)", lineHeight: 1.6 }}>
            Your chosen tradition is saved securely on this device for 24 hours. You can switch traditions anytime from the picker above.
          </p>
        </section>
      </main>

      {/* Admin Passcode Modal */}
      {isAdminModalOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 110,
            background: "rgba(13, 16, 19, 0.6)",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            style={{
              background: "#fff",
              borderRadius: "20px",
              padding: "28px 24px",
              maxWidth: 400,
              width: "100%",
              boxShadow: "0 20px 50px rgba(0,0,0,0.25)",
            }}
          >
            <h3 style={{ margin: "0 0 6px", fontSize: 18, color: "var(--ink)" }}>👑 Admin Access Login</h3>
            <p style={{ margin: "0 0 18px", fontSize: 13, color: "var(--ink-soft)" }}>
              Enter your administrator secret key to unlock admin access (no daily limit).
            </p>

            {adminError && (
              <div style={{ background: "#FDE8E8", color: "#9B1C1C", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
                {adminError}
              </div>
            )}
            {adminSuccess && (
              <div style={{ background: "#EDFDF2", color: "#1E7E34", padding: "10px 14px", borderRadius: 8, fontSize: 13, marginBottom: 14 }}>
                {adminSuccess}
              </div>
            )}

            <form onSubmit={handleAdminSubmit}>
              <div style={{ marginBottom: 18 }}>
                <label style={{ display: "block", fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Admin Passcode / Key</label>
                <input
                  type="password"
                  value={adminPasscode}
                  onChange={(e) => setAdminPasscode(e.target.value)}
                  placeholder="Enter ADMIN_SECRET_KEY"
                  required
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    borderRadius: 10,
                    border: "1.5px solid var(--stone-deep)",
                    fontSize: 14,
                    outline: "none",
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminModalOpen(false);
                    setAdminError("");
                  }}
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: 999,
                    border: "1px solid var(--stone-deep)",
                    background: "transparent",
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminLoading}
                  style={{
                    flex: 1,
                    padding: "11px",
                    borderRadius: 999,
                    border: "none",
                    background: "var(--brass)",
                    color: "#fff",
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: "pointer",
                  }}
                >
                  {adminLoading ? "Verifying..." : "Authorize"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
