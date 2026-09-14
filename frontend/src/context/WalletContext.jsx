import { createContext, useContext, useState, useEffect } from "react";
import { api } from "../utils/api";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem("spiritual_ai_user");
    return saved ? JSON.parse(saved) : null;
  });

  const [walletBalance, setWalletBalance] = useState(() => {
    return user?.walletBalance ?? 18;
  });

  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem("spiritual_ai_user", JSON.stringify(user));
      // Refresh latest balance from backend
      if (user.id || user._id) {
        api.auth.getUser(user.id || user._id)
          .then((fresh) => {
            if (fresh && typeof fresh.walletBalance === "number") {
              setWalletBalance(fresh.walletBalance);
              setUser((prev) => ({ ...prev, walletBalance: fresh.walletBalance }));
            }
          })
          .catch(() => {});
      }
    } else {
      localStorage.removeItem("spiritual_ai_user");
      // Auto initialize demo user if not logged in
      api.auth.devLogin()
        .then((res) => {
          if (res.user) {
            setUser(res.user);
            setWalletBalance(res.user.walletBalance || 18);
          }
        })
        .catch(() => {});
    }
  }, [user?.id]);

  const updateBalance = (newBalance) => {
    setWalletBalance(newBalance);
    setUser((prev) => (prev ? { ...prev, walletBalance: newBalance } : null));
    if (user) {
      localStorage.setItem("spiritual_ai_user", JSON.stringify({ ...user, walletBalance: newBalance }));
    }
  };

  const loginDevUser = async () => {
    try {
      const res = await api.auth.devLogin();
      if (res.user) {
        setUser(res.user);
        setWalletBalance(res.user.walletBalance || 18);
      }
    } catch (e) {
      console.error("Dev login failed:", e);
    }
  };

  const logout = () => {
    setUser(null);
    setWalletBalance(0);
    localStorage.removeItem("spiritual_ai_user");
  };

  return (
    <WalletContext.Provider
      value={{
        user,
        setUser,
        walletBalance,
        updateBalance,
        isWalletModalOpen,
        openWalletModal: () => setIsWalletModalOpen(true),
        closeWalletModal: () => setIsWalletModalOpen(false),
        loginDevUser,
        logout,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
}
