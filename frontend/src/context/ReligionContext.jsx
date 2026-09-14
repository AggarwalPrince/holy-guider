import { createContext, useContext, useEffect, useState } from "react";
import { applyReligionTheme, getReligion } from "../theme";
import { saveReligion, loadReligion, clearReligion } from "../utils/storage";

const ReligionContext = createContext(null);

export function ReligionProvider({ children }) {
  const [religionKey, setReligionKey] = useState(() => loadReligion());
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    applyReligionTheme(religionKey);
  }, [religionKey]);

  function selectReligion(key) {
    saveReligion(key);
    setReligionKey(key);
    applyReligionTheme(key);
    setIsTransitioning(true);
    window.setTimeout(() => setIsTransitioning(false), 420);
  }

  function forgetReligion() {
    clearReligion();
    setReligionKey(null);
  }

  const religion = getReligion(religionKey);

  return (
    <ReligionContext.Provider
      value={{ religionKey, religion, selectReligion, forgetReligion, isTransitioning }}
    >
      {children}
    </ReligionContext.Provider>
  );
}

export function useReligion() {
  const ctx = useContext(ReligionContext);
  if (!ctx) throw new Error("useReligion must be used inside ReligionProvider");
  return ctx;
}
