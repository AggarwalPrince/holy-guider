import React from "react";
import { motion } from "framer-motion";
import { Wallet, Sparkles, BookOpen, LogIn, PlusCircle, LogOut, UserCheck } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";

export const Navbar = ({
  user,
  walletBalance,
  onOpenWalletModal,
  onOpenJournal,
  onGoogleSuccess,
  onGoogleError,
  onDevLogin,
  onLogout,
}) => {
  const isGoogleConfigured =
    import.meta.env.VITE_GOOGLE_CLIENT_ID &&
    !import.meta.env.VITE_GOOGLE_CLIENT_ID.includes("your-google-client-id");

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-mystic-950/70 border-b border-amber-500/15 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
        {/* Brand Logo */}
        <div className="flex items-center space-x-3 cursor-pointer group">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0], y: [0, -3, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-600/30 to-purple-600/40 border border-amber-500/40 flex items-center justify-center shadow-gold-glow"
          >
            <Sparkles className="w-6 h-6 text-amber-300" />
          </motion.div>
          <div>
            <span className="font-serif text-2xl font-bold tracking-wide text-gold-gradient">
              Mārg AI
            </span>
            <p className="text-xs text-slate-400 font-light hidden sm:block">
              Vedic & Celestial Spiritual Guidance
            </p>
          </div>
        </div>

        {/* Right Nav Controls */}
        <div className="flex items-center space-x-3 sm:space-x-4">
          {user ? (
            <>
              {/* Journal Drawer Button */}
              <button
                onClick={onOpenJournal}
                className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-mystic-800/80 hover:bg-mystic-700 border border-purple-500/20 text-slate-200 text-sm font-medium transition-colors"
                title="View Past Spiritual Journal Entries"
              >
                <BookOpen className="w-4 h-4 text-purple-300" />
                <span className="hidden md:inline">My Journal</span>
              </button>

              {/* Wallet Balance Badge */}
              <div className="flex items-center space-x-1.5 bg-mystic-900 border border-amber-500/30 px-3.5 py-1.5 rounded-xl shadow-gold-glow">
                <Wallet className="w-4 h-4 text-amber-400 animate-pulse" />
                <span className="text-xs text-slate-400 font-medium">Balance:</span>
                <span className="text-sm font-bold text-amber-300 tracking-tight">
                  ₹{walletBalance}
                </span>

                {/* Top-up Trigger */}
                <motion.button
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onOpenWalletModal}
                  className="ml-1.5 p-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 transition-colors"
                  title="Top up wallet (Min ₹9)"
                >
                  <PlusCircle className="w-4 h-4" />
                </motion.button>
              </div>

              {/* User Avatar & Logout */}
              <div className="flex items-center space-x-2 pl-1 sm:pl-2 border-l border-slate-800">
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-9 h-9 rounded-full border border-amber-500/40 object-cover shadow-md"
                />
                <button
                  onClick={onLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center space-x-2">
              {/* Real Google OAuth Login (Rendered if client ID is configured) */}
              {isGoogleConfigured ? (
                <div className="scale-90 sm:scale-100">
                  <GoogleLogin
                    onSuccess={(credentialResponse) => {
                      if (onGoogleSuccess && credentialResponse.credential) {
                        onGoogleSuccess(credentialResponse.credential);
                      }
                    }}
                    onError={() => {
                      if (onGoogleError) onGoogleError();
                    }}
                    theme="filled_black"
                    shape="pill"
                    text="signin_with"
                  />
                </div>
              ) : (
                /* 1-Click Dev / Guest Seeker Login for immediate testing */
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  onClick={onDevLogin}
                  className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 font-semibold text-sm shadow-gold-glow"
                  title="1-Click Login (Works immediately without Google Cloud Console setup)"
                >
                  <UserCheck className="w-4 h-4 text-slate-950" />
                  <span>1-Click Test Login</span>
                </motion.button>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
