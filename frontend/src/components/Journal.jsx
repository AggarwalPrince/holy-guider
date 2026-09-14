import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getJournal, deleteJournalEntry } from "../utils/storage";
import { getReligion } from "../theme";
import Motif from "./Motif";
import BottomNav from "./BottomNav";

export default function Journal() {
  const [entries, setEntries] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    setEntries(getJournal());
  }, []);

  function handleOpen(entry) {
    navigate("/result", {
      state: { problem: entry.problem, religionOverride: entry.religionKey, preloaded: entry.result }
    });
  }

  function handleDelete(e, id) {
    e.stopPropagation();
    deleteJournalEntry(id);
    setEntries(getJournal());
  }

  return (
    <div className="fade-screen" style={{ minHeight: "100vh", paddingBottom: 90 }}>
      <header style={{ maxWidth: 560, margin: "0 auto", padding: "28px 20px 4px" }}>
        <h1 style={{ fontSize: "1.8rem", margin: 0 }}>Your Journal</h1>
        <p style={{ color: "var(--ink-soft)", fontSize: 13.5, marginTop: 6 }}>
          Reflections you've chosen to keep.
        </p>
      </header>

      <main style={{ maxWidth: 560, margin: "0 auto", padding: "20px 20px" }}>
        {entries.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", color: "var(--ink-soft)" }}>
            <p>Nothing saved yet. When a reflection resonates, tap "Save to journal" to keep it here.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {entries.map((entry) => {
              const rel = getReligion(entry.religionKey);
              return (
                <button
                  key={entry.id}
                  onClick={() => handleOpen(entry)}
                  style={{
                    textAlign: "left",
                    padding: "16px 18px",
                    borderRadius: "var(--radius)",
                    border: "1px solid var(--stone-deep)",
                    background: "#fff",
                    boxShadow: "var(--shadow)",
                    display: "flex",
                    gap: 14,
                    alignItems: "flex-start"
                  }}
                >
                  <div style={{ color: rel?.accent || "var(--accent)", flexShrink: 0, marginTop: 2 }}>
                    <Motif type={rel?.motif || "om"} size={24} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ margin: "0 0 4px", fontSize: 11, color: "var(--ink-soft)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                      {entry.religionName} · {new Date(entry.date).toLocaleDateString()}
                    </p>
                    <p style={{ margin: 0, fontSize: 14.5, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {entry.problem}
                    </p>
                  </div>
                  <span
                    onClick={(e) => handleDelete(e, entry.id)}
                    style={{ color: "var(--ink-soft)", fontSize: 12, flexShrink: 0, padding: 4 }}
                  >
                    Remove
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
