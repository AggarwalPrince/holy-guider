import { useState } from "react";
import { GoogleLogin } from "@react-oauth/google";
import { useAuth } from "../context/AuthContext";
import { useReligion } from "../context/ReligionContext";
import Motif from "./Motif";
import Loader from "./Loader";

const isGoogleConfigured =
  import.meta.env.VITE_GOOGLE_CLIENT_ID && !import.meta.env.VITE_GOOGLE_CLIENT_ID.includes("your-google-client-id");

export default function SignIn() {
  const { loginGoogle } = useAuth();
  const { religion } = useReligion();
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleSuccess(credentialResponse) {
    setError("");
    if (!credentialResponse.credential) return;
    setBusy(true);
    const result = await loginGoogle(credentialResponse.credential);
    setBusy(false);
    if (!result.success) setError(result.error || "Google sign-in failed. Please try again.");
  }

  return (
    <div className="fade-screen" style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          textAlign: "center",
          padding: "40px 28px",
          background: "#fff",
          borderRadius: "var(--radius)",
          border: "1.5px solid var(--stone-deep)",
          boxShadow: "var(--shadow)",
        }}
      >
        <div className="glow-halo" style={{ display: "inline-block", color: "var(--accent)", marginBottom: 12 }}>
          <Motif type={religion?.motif || "om"} size={36} />
        </div>
        <h1 style={{ fontSize: "1.7rem", fontWeight: 700, margin: "0 0 8px", color: "var(--ink)" }}>Sign in to continue</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 15, lineHeight: 1.5, margin: "0 0 24px" }}>
          Holy Guider is free. Sign in with Google to seek guidance and keep your journal safe across devices.
        </p>

        {busy ? (
          <Loader motif={religion?.motif} />
        ) : isGoogleConfigured ? (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <GoogleLogin
              onSuccess={handleSuccess}
              onError={() => setError("Google sign-in failed. Please try again.")}
              theme="outline"
              shape="pill"
              text="continue_with"
            />
          </div>
        ) : (
          <p style={{ margin: 0, fontSize: 13, color: "#9B1C1C" }}>Google sign-in isn't configured on this server yet.</p>
        )}

        {error && <p style={{ margin: "14px 0 0", fontSize: 13, color: "#9B1C1C" }}>{error}</p>}
      </div>
    </div>
  );
}
