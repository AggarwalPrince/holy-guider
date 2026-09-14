import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ReligionProvider, useReligion } from "./context/ReligionContext";
import { WalletProvider } from "./context/WalletContext";
import { loadReligion } from "./utils/storage";
import Welcome from "./components/Welcome";
import ReligionPicker from "./components/ReligionPicker";
import Home from "./components/Home";
import Result from "./components/Result";
import Journal from "./components/Journal";
import Settings from "./components/Settings";

// Screens that need a religion already selected redirect back to the
// picker if someone lands here directly (e.g. after the 24hr expiry).
function RequireReligion({ children }) {
  const { religionKey } = useReligion();
  const effectiveKey = religionKey || loadReligion();
  if (!effectiveKey) return <Navigate to="/select-religion" replace />;
  return children;
}

function AppRoutes() {
  const { religionKey } = useReligion();

  return (
    <Routes>
      <Route path="/" element={religionKey ? <Navigate to="/home" replace /> : <Welcome />} />
      <Route path="/select-religion" element={<ReligionPicker />} />
      <Route
        path="/home"
        element={
          <RequireReligion>
            <Home />
          </RequireReligion>
        }
      />
      <Route
        path="/result"
        element={
          <RequireReligion>
            <Result />
          </RequireReligion>
        }
      />
      <Route
        path="/journal"
        element={
          <RequireReligion>
            <Journal />
          </RequireReligion>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireReligion>
            <Settings />
          </RequireReligion>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ReligionProvider>
      <WalletProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </WalletProvider>
    </ReligionProvider>
  );
}
