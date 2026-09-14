import React, { useState } from "react";
import { motion } from "framer-motion";
import { Send, Sparkles, Compass, AlertCircle, Coins } from "lucide-react";

const TRADITIONS = [
  { id: "gita", label: "Bhagavad Gita", desc: "Karma Yoga, Dharma & Divine Will" },
  { id: "astrology", label: "Vedic Astrology", desc: "Navagraha & Planetary Cosmic Transits" },
  { id: "zen", label: "Zen & Dhammapada", desc: "Mindfulness, Non-attachment & Peace" },
];

const SUGGESTIONS = [
  "How do I overcome anxiety about the future according to the Gita?",
  "I feel stuck in my career crossroads. What is my Dharma?",
  "What does cosmic alignment advise when facing difficult relationships?",
  "How to quiet an overthinking mind during challenging moments?",
];

const DAILY_PROMPTS = [
  "What does contentment mean to you today?",
  "Where in your life are you resisting change?",
  "Who do you owe forgiveness, including yourself?",
  "What would it feel like to let go of one worry today?",
];

export const PromptArea = ({
  onSubmitQuestion,
  walletBalance,
  onPromptInsufficientFunds,
  isLoading,
}) => {
  const [question, setQuestion] = useState("");
  const [tradition, setTradition] = useState("gita");
  const [error, setError] = useState("");
  const dayIndex = new Date().getDate() % DAILY_PROMPTS.length;

  const handleSubmit = (e) => {
    e?.preventDefault();
    setError("");

    if (!question.trim()) {
      setError("Please pour your heart or question into the sacred field above.");
      return;
    }

    if (walletBalance < 9) {
      setError("Your balance is under ₹9. Please top up your wallet to consult the oracle.");
      if (onPromptInsufficientFunds) onPromptInsufficientFunds();
      return;
    }

    onSubmitQuestion(question.trim(), tradition);
  };

  const handleSuggestionClick = (suggestedText) => {
    setQuestion(suggestedText);
    setError("");
  };

  return (
    <div className="w-full max-w-3xl mx-auto mb-12">
      {/* Tradition Selector Bar */}
      <div className="flex flex-wrap gap-2 mb-4 justify-center sm:justify-start">
        {TRADITIONS.map((t) => {
          const isSelected = tradition === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTradition(t.id)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold tracking-wide transition-all ${
                isSelected
                  ? "bg-amber-500/20 text-amber-300 border border-amber-400 shadow-gold-glow"
                  : "bg-mystic-900/60 text-slate-400 border border-purple-500/20 hover:border-amber-500/30 hover:text-slate-200"
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <Compass className="w-3.5 h-3.5" />
                <span>{t.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Main Question Card with Glowing Border */}
      <div className="relative rounded-3xl p-1 bg-gradient-to-b from-amber-500/30 via-purple-500/20 to-transparent shadow-card-floating">
        <div className="relative rounded-[22px] bg-mystic-900/90 backdrop-blur-2xl p-5 sm:p-7 border border-amber-500/20">
          {/* Subtle ambient aura */}
          <div className="absolute top-2 left-4 w-28 h-28 bg-amber-400/5 rounded-full blur-2xl pointer-events-none" />

          {/* Textarea Input */}
          <div className="relative">
            <textarea
              rows={4}
              value={question}
              onChange={(e) => {
                setQuestion(e.target.value);
                if (error) setError("");
              }}
              placeholder="Inquire of the sacred cosmos... E.g., 'I am facing profound doubts regarding my purpose and current journey. What does wisdom reveal?'"
              className="w-full bg-transparent resize-none text-slate-100 placeholder:text-slate-500/80 text-base sm:text-lg focus:outline-none leading-relaxed font-normal"
            />
          </div>

          {/* Error notice */}
          {error && (
            <div className="mt-3 p-2.5 rounded-xl bg-rose-950/60 border border-rose-500/30 flex items-center space-x-2 text-rose-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Bottom Action Bar */}
          <div className="mt-4 pt-4 border-t border-purple-500/15 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            {/* Disclaimer & Pricing Badge */}
            <div className="flex items-center space-x-2">
              <span className="flex items-center space-x-1 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-medium">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>₹9 will be deducted per answer</span>
              </span>
              <span className="text-[11px] text-slate-400 hidden md:inline">
                Instant sacred scripture & astrological reflection
              </span>
            </div>

            {/* Anti-Gravity Submit Button */}
            <motion.button
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              whileHover={{ scale: 1.04, y: -8 }}
              whileTap={{ scale: 0.96 }}
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-6 py-3 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-amber-700 text-slate-950 font-bold text-sm shadow-gold-glow hover:shadow-gold-intense transition-all flex items-center justify-center space-x-2 disabled:opacity-50 self-end sm:self-auto cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Sparkles className="w-4 h-4 animate-spin text-slate-950" />
                  <span>Consulting Wisdom...</span>
                </>
              ) : (
                <>
                  <span>Seek Guidance</span>
                  <Send className="w-4 h-4 text-slate-950" />
                </>
              )}
            </motion.button>
          </div>
        </div>
      </div>

      {/* Suggested Prompt Inspiration */}
      <div className="mt-5">
        <p className="text-[11px] uppercase tracking-wider text-slate-400 font-semibold mb-2">
          Seeking inspiration? Inquire about:
        </p>
        <div className="flex flex-wrap gap-2">
          {SUGGESTIONS.map((item, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSuggestionClick(item)}
              className="text-xs text-slate-300 bg-mystic-900/50 hover:bg-mystic-800/80 border border-purple-500/20 hover:border-amber-400/40 px-3 py-1.5 rounded-xl transition-colors text-left"
            >
              "{item}"
            </button>
          ))}
        </div>
      </div>

      {/* Today's Reflection Card (from reference design, elevated with anti-gravity dark glow) */}
      <motion.div
        animate={{ y: [0, -5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        onClick={() => handleSuggestionClick(DAILY_PROMPTS[dayIndex])}
        className="mt-6 relative p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-mystic-900 to-purple-950/40 border border-amber-500/25 hover:border-amber-400/50 cursor-pointer transition-all shadow-card-floating overflow-hidden group"
      >
        {/* Sacred Om / Cosmic Watermark */}
        <div className="absolute -top-4 -right-4 text-amber-400/10 group-hover:text-amber-400/20 transition-colors pointer-events-none select-none text-7xl font-serif">
          🕉️
        </div>

        <p className="text-[11px] uppercase tracking-widest text-amber-400 font-bold mb-1.5 flex items-center space-x-1.5">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Today's Reflection</span>
        </p>
        <p className="font-serif italic text-base sm:text-lg text-slate-200 group-hover:text-amber-200 transition-colors">
          "{DAILY_PROMPTS[dayIndex]}"
        </p>
        <p className="text-[10px] text-slate-400 mt-2">
          Click to populate this sacred inquiry · ₹9 / answer
        </p>
      </motion.div>
    </div>
  );
};

export default PromptArea;
