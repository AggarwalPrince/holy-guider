import React from "react";
import { motion } from "framer-motion";
import { Sparkles, Moon, Sun, Orbit, Star } from "lucide-react";

/**
 * Ambient Celestial Background with Floating Motifs & Anti-Gravity Stars
 */
export const CosmicBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Deep purple & midnight blue aura blobs */}
      <div className="celestial-aura -top-24 left-1/4 w-96 h-96 bg-purple-900/30" />
      <div className="celestial-aura top-1/3 -right-24 w-[500px] h-[500px] bg-indigo-950/40" />
      <div className="celestial-aura -bottom-32 left-1/3 w-[600px] h-[600px] bg-amber-950/20" />

      {/* Floating Crescent Moon Motif */}
      <motion.div
        animate={{ y: [0, -14, 0], rotate: [0, 5, 0] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-20 right-12 text-amber-300/25 hidden md:block"
      >
        <Moon className="w-20 h-20 stroke-[1.2]" />
      </motion.div>

      {/* Floating Sacred Sun / Mandala Motif */}
      <motion.div
        animate={{ y: [0, -12, 0], rotate: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-28 left-8 text-indigo-400/20 hidden md:block"
      >
        <Sun className="w-24 h-24 stroke-[1]" />
      </motion.div>

      {/* Floating Orbit Motif */}
      <motion.div
        animate={{ y: [0, -8, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        className="absolute top-1/2 left-6 text-purple-400/15"
      >
        <Orbit className="w-16 h-16 stroke-[1.2]" />
      </motion.div>

      {/* Scattered Ambient Anti-Gravity Star Particles */}
      {[
        { top: "15%", left: "10%", size: "w-3 h-3", delay: 0.5, dur: 4 },
        { top: "25%", left: "80%", size: "w-4 h-4", delay: 1.2, dur: 5 },
        { top: "65%", left: "15%", size: "w-3 h-3", delay: 2.1, dur: 4.5 },
        { top: "75%", left: "85%", size: "w-5 h-5", delay: 0.8, dur: 6 },
        { top: "40%", left: "92%", size: "w-3 h-3", delay: 1.5, dur: 3.5 },
        { top: "85%", left: "45%", size: "w-4 h-4", delay: 2.5, dur: 5.5 },
      ].map((star, idx) => (
        <motion.div
          key={idx}
          style={{ top: star.top, left: star.left }}
          animate={{ y: [0, -10, 0], opacity: [0.2, 0.7, 0.2] }}
          transition={{
            duration: star.dur,
            repeat: Infinity,
            ease: "easeInOut",
            delay: star.delay,
          }}
          className={`absolute text-amber-200/40 ${star.size}`}
        >
          <Sparkles className="w-full h-full" />
        </motion.div>
      ))}

      {/* Subtle Starry Dot Matrix */}
      <div
        className="absolute inset-0 opacity-[0.03] bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:24px_24px]"
      />
    </div>
  );
};

export default CosmicBackground;
