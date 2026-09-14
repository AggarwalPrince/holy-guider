import React from "react";
import { motion } from "framer-motion";

/**
 * Reusable Anti-Gravity Floating Card
 * Uses Framer Motion to float gently up and down along the Y-axis.
 */
export const FloatingCard = ({
  children,
  className = "",
  floatY = -10,
  duration = 4,
  delay = 0,
  glow = false,
  ...props
}) => {
  return (
    <motion.div
      animate={{ y: [0, floatY, 0] }}
      transition={{
        duration: duration,
        repeat: Infinity,
        ease: "easeInOut",
        delay: delay,
      }}
      whileHover={{ y: floatY - 4, scale: 1.01 }}
      className={`relative rounded-2xl backdrop-blur-xl border transition-all duration-300 ${
        glow
          ? "bg-mystic-900/80 border-amber-500/30 shadow-gold-glow"
          : "bg-mystic-900/60 border-indigo-500/20 shadow-card-floating"
      } ${className}`}
      {...props}
    >
      {/* Subtle corner aura */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />
      {children}
    </motion.div>
  );
};

export default FloatingCard;
