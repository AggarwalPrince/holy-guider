import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../utils/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // No session data is read from localStorage: the session lives in an
  // HttpOnly cookie the server set, which page JavaScript can't see or tamper
  // with. On load we simply ask the server who (if anyone) we are.
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  const isAdmin = Boolean(user?.isAdmin || user?.role === "admin");
  // Using the site requires a real Google account (guest sessions can't ask).
  const isSignedIn = Boolean(user && !user.isGuest);

  useEffect(() => {
    api.auth
      .me()
      .then((res) => setUser(res?.user || null))
      .catch(() => setUser(null))
      .finally(() => setIsBootstrapping(false));
  }, []);

  const loginAdmin = async (passcode) => {
    try {
      const res = await api.auth.adminLogin(passcode);
      if (res.user) {
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, error: res.error || "Admin authentication failed" };
    } catch (e) {
      console.error("Admin login failed:", e);
      return { success: false, error: e.message || "Admin authorization error" };
    }
  };

  const loginGoogle = async (googleIdToken) => {
    try {
      const res = await api.auth.googleLogin(googleIdToken);
      if (res.user) {
        setUser(res.user);
        return { success: true, user: res.user };
      }
      return { success: false, error: res.error || "Google sign-in failed" };
    } catch (e) {
      console.error("Google login failed:", e);
      return { success: false, error: e.message || "Google sign-in error" };
    }
  };

  const logout = async () => {
    try {
      await api.auth.logout();
    } catch (e) {
      console.error("Logout request failed (clearing local state anyway):", e);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, isAdmin, isSignedIn, isBootstrapping, loginAdmin, loginGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
