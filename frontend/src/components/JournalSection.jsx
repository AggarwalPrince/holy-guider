import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  BookOpen,
  Calendar,
  Sparkles,
  Trash2,
  ChevronRight,
  Search,
} from "lucide-react";
import FloatingCard from "./FloatingCard";

export const JournalSection = ({
  isOpen,
  onClose,
  entries = [],
  onSelectEntry,
  onDeleteEntry,
}) => {
  const [searchTerm, setSearchTerm] = useState("");

  if (!isOpen) return null;

  const filteredEntries = entries.filter((entry) => {
    const q = (entry.question || "").toLowerCase();
    const t = (entry.tradition || "").toLowerCase();
    const search = searchTerm.toLowerCase();
    return q.includes(search) || t.includes(search);
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-mystic-950/80 backdrop-blur-sm">
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full max-w-lg h-full bg-mystic-900 border-l border-amber-500/20 shadow-2xl flex flex-col overflow-hidden text-slate-100"
      >
        {/* Header */}
        <div className="p-6 border-b border-purple-500/15 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-serif text-lg font-bold text-slate-100">
                Spiritual Journal
              </h3>
              <p className="text-xs text-slate-400">
                {entries.length} Inquiries Preserved in Eternity
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Field */}
        <div className="p-4 border-b border-purple-500/10 bg-mystic-950/40">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search past questions or traditions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-mystic-800/80 border border-purple-500/20 text-slate-200 focus:outline-none focus:border-amber-400"
            />
          </div>
        </div>

        {/* Entries List / Masonry Cards */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {filteredEntries.length === 0 ? (
            <div className="py-20 text-center text-slate-400">
              <Sparkles className="w-8 h-8 text-amber-400/40 mx-auto mb-3" />
              <p className="text-sm font-medium">No spiritual inquiries found</p>
              <p className="text-xs text-slate-500 mt-1">
                Ask your first question to begin your sacred chronicle.
              </p>
            </div>
          ) : (
            filteredEntries.map((entry, idx) => {
              const date = new Date(entry.timestamp).toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              });
              const verseRef = entry.aiResponse?.verse?.reference || "Sacred Guidance";

              return (
                <FloatingCard
                  key={entry._id || idx}
                  floatY={-4}
                  duration={4 + (idx % 3)}
                  delay={idx * 0.15}
                  className="p-4 bg-mystic-850/80 border-purple-500/20 hover:border-amber-500/40 group cursor-pointer transition-all"
                  onClick={() => {
                    onSelectEntry(entry);
                    onClose();
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-300 font-semibold uppercase tracking-wider">
                      {entry.tradition || "Spiritual Wisdom"}
                    </span>
                    <div className="flex items-center space-x-2 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3 text-slate-500" />
                      <span>{date}</span>
                      {onDeleteEntry && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteEntry(entry._id);
                          }}
                          className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                          title="Delete entry"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <p className="mt-2.5 text-xs sm:text-sm font-medium text-slate-200 line-clamp-2">
                    "{entry.question}"
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-purple-500/15 flex items-center justify-between text-xs">
                    <span className="text-amber-400 font-serif font-semibold">
                      {verseRef}
                    </span>
                    <span className="text-slate-400 group-hover:text-amber-300 flex items-center text-[11px] font-medium transition-colors">
                      Review <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </span>
                  </div>
                </FloatingCard>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default JournalSection;
