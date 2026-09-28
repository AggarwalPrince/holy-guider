import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Sparkles,
  BookOpen,
  Compass,
  CheckCircle2,
  Copy,
  Check,
  Share2,
  Stars,
} from "lucide-react";
import FloatingCard from "./FloatingCard";

export const ResultCard = ({ result, question, onNewQuestion }) => {
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const verse = result.verse || {};
  const application = result.application || {};
  const actionSteps = application.action_steps || [];

  const handleCopy = () => {
    const fullText = `*Mārg AI Guidance*\nQuestion: ${question}\n\nCitation: ${verse.reference || ""}\n${verse.original_script || ""}\n\nTranslation: ${verse.english_translation || ""}\n\nReframe: ${application.reframe || ""}`;
    navigator.clipboard.writeText(fullText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto my-8">
      <FloatingCard
        floatY={-10}
        duration={5}
        glow={true}
        className="p-6 sm:p-9 text-slate-100 border-amber-500/40"
      >
        {/* Header Badges */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-5 border-b border-amber-500/20">
          <div className="flex items-center space-x-2.5">
            <span className="p-2 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-400/40">
              <Sparkles className="w-5 h-5" />
            </span>
            <div>
              <span className="text-xs uppercase tracking-widest text-amber-400 font-bold block">
                {result.tradition || "Sacred Guidance"}
              </span>
              <h3 className="font-serif text-lg sm:text-xl font-bold text-slate-100">
                {verse.reference || "Celestial Wisdom"}
              </h3>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopy}
              className="p-2 rounded-xl bg-mystic-800/80 hover:bg-mystic-700 border border-purple-500/20 text-slate-300 hover:text-amber-300 text-xs flex items-center space-x-1.5 transition-colors"
              title="Copy Guidance to Clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* User's Original Question Inquiry */}
        <div className="my-5 p-3.5 rounded-xl bg-mystic-850/70 border border-purple-500/20 text-slate-300 text-xs sm:text-sm italic">
          <span className="text-amber-400 not-italic font-semibold">Your Inquiry: </span>
          "{question}"
        </div>

        {/* Original Script (Devanagari / Sacred Text) */}
        {verse.original_script && (
          <div className="my-6 p-5 sm:p-6 rounded-2xl bg-gradient-to-r from-amber-500/10 via-purple-600/10 to-transparent border-l-4 border-amber-400">
            <p className="font-serif text-lg sm:text-2xl text-amber-200 leading-relaxed tracking-wide text-center sm:text-left">
              {verse.original_script}
            </p>
            {verse.transliteration && (
              <p className="text-xs sm:text-sm text-slate-400 italic mt-2.5 font-sans">
                {verse.transliteration}
              </p>
            )}
          </div>
        )}

        {/* Translations */}
        <div className="space-y-4 my-6">
          {verse.english_translation && (
            <div className="p-4 rounded-xl bg-mystic-800/60 border border-purple-500/15">
              <h4 className="text-xs uppercase tracking-wider text-amber-400 font-semibold mb-1">
                English Translation
              </h4>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed">
                "{verse.english_translation}"
              </p>
            </div>
          )}

          {verse.hindi_translation && (
            <div className="p-4 rounded-xl bg-mystic-800/60 border border-purple-500/15">
              <h4 className="text-xs uppercase tracking-wider text-amber-400 font-semibold mb-1">
                हिंदी भावार्थ
              </h4>
              <p className="text-sm sm:text-base text-slate-200 leading-relaxed font-sans">
                "{verse.hindi_translation}"
              </p>
            </div>
          )}
        </div>

        {/* Contextual Meaning & Mindset Reframe */}
        {application.reframe && (
          <div className="my-6 p-5 rounded-2xl bg-gradient-to-br from-indigo-950/60 to-mystic-900 border border-indigo-500/30">
            <div className="flex items-center space-x-2 text-amber-300 mb-2">
              <Compass className="w-4 h-4" />
              <h4 className="text-xs uppercase tracking-wider font-bold">
                Spiritual Mindset Reframe
              </h4>
            </div>
            <p className="text-sm sm:text-base text-slate-100 font-medium leading-relaxed">
              {application.reframe}
            </p>
            {result.context && (
              <p className="text-xs text-slate-400 mt-2 italic">
                Context: {result.context}
              </p>
            )}
          </div>
        )}

        {/* Concrete Action Steps */}
        {actionSteps.length > 0 && (
          <div className="my-6">
            <h4 className="text-xs uppercase tracking-wider text-amber-400 font-semibold mb-3 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-amber-400" />
              <span>Recommended Sadhana & Action Steps</span>
            </h4>
            <div className="space-y-2.5">
              {actionSteps.map((step, idx) => (
                <div
                  key={idx}
                  className="flex items-start space-x-3 p-3 rounded-xl bg-mystic-800/50 border border-purple-500/15"
                >
                  <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    {idx + 1}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed">
                    {step}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Astrological Resonance */}
        {result.astrological_aspect && (
          <div className="my-4 p-3.5 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center space-x-2.5 text-xs text-purple-200">
            <Stars className="w-4 h-4 text-purple-400 shrink-0" />
            <span>
              <strong className="text-purple-300 font-medium">Cosmic Resonance: </strong>
              {result.astrological_aspect}
            </span>
          </div>
        )}

        {/* Footer & Disclaimer */}
        <div className="pt-5 mt-6 border-t border-purple-500/20 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
          <p className="italic text-center sm:text-left text-[11px]">
            {result.disclaimer || "Sacred AI spiritual reflection. Please verify with scriptures or trusted teachers."}
          </p>
          <button
            onClick={onNewQuestion}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 font-medium transition-colors shrink-0"
          >
            Ask Another Question
          </button>
        </div>
      </FloatingCard>
    </div>
  );
};

export default ResultCard;
