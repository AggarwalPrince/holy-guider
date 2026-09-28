import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ReligionProvider, useReligion } from "./context/ReligionContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { loadReligion } from "./utils/storage";
import Welcome from "./components/Welcome";
import ReligionPicker from "./components/ReligionPicker";
import Home from "./components/Home";
import Result from "./components/Result";
import Journal from "./components/Journal";
import Settings from "./components/Settings";
import PrivacyPolicy from "./components/PrivacyPolicy";
import Terms from "./components/Terms";
import SignIn from "./components/SignIn";
import Loader from "./components/Loader";

// Screens that need a religion already selected redirect back to the
// picker if someone lands here directly (e.g. after the 24hr expiry).
function RequireReligion({ children }) {
  const { religionKey } = useReligion();
  const effectiveKey = religionKey || loadReligion();
  if (!effectiveKey) return <Navigate to="/select-religion" replace />;
  return children;
}

// Using the app needs a Google account. While the session is being restored we
// show the loader; a visitor with no (or only a guest) session sees sign-in.
function RequireSignIn({ children }) {
  const { isSignedIn, isBootstrapping } = useAuth();
  if (isBootstrapping) return <Loader />;
  if (!isSignedIn) return <SignIn />;
  return children;
}

function AppRoutes() {
  const { religionKey } = useReligion();

  return (
    <Routes>
      <Route path="/" element={religionKey ? <Navigate to="/home" replace /> : <Welcome />} />
      <Route path="/select-religion" element={<ReligionPicker />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/refund" element={<Terms />} />
      <Route path="/terms" element={<Terms />} />
      <Route
        path="/home"
        element={
          <RequireReligion>
            <RequireSignIn>
              <Home />
            </RequireSignIn>
          </RequireReligion>
        }
      />
      <Route
        path="/result"
        element={
          <RequireReligion>
            <RequireSignIn>
              <Result />
            </RequireSignIn>
          </RequireReligion>
        }
      />
      <Route
        path="/journal"
        element={
          <RequireReligion>
            <RequireSignIn>
              <Journal />
            </RequireSignIn>
          </RequireReligion>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireReligion>
            <RequireSignIn>
              <Settings />
            </RequireSignIn>
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
      <AuthProvider>
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </AuthProvider>
    </ReligionProvider>
  );
}
