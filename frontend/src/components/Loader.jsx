import { useEffect, useState } from "react";
import Motif from "./Motif";

const EARLY_PHRASES = ["Reflecting on your question...", "Seeking guidance..."];
const LATE_PHRASE = "This is taking a moment, thank you for your patience...";

export default function Loader({ motif = "om" }) {
  const [phraseIndex, setPhraseIndex] = useState(0);
  const [showLate, setShowLate] = useState(false);

  useEffect(() => {
    const cycle = setInterval(() => {
      setPhraseIndex((i) => (i + 1) % EARLY_PHRASES.length);
    }, 2400);
    const lateTimer = setTimeout(() => setShowLate(true), 5000);
    return () => {
      clearInterval(cycle);
      clearTimeout(lateTimer);
    };
  }, []);

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "20px", padding: "60px 20px" }}>
      <div className="pulse-glow-wrap">
        <Motif type={motif} size={40} />
      </div>
      <p className="loader-phrase">{showLate ? LATE_PHRASE : EARLY_PHRASES[phraseIndex]}</p>
    </div>
  );
}
