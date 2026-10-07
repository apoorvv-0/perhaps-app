import React from "react";
import { motion } from "framer-motion";

export default function LoadingScreen() {
  return (
    <div className="min-h-screen bg-brand-wine flex flex-col items-center justify-center relative overflow-hidden">
      {/* Intense Romantic Red Glow from the center */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-brand-burgundy/60 rounded-full blur-[100px] pointer-events-none mix-blend-screen" />
      
      <motion.div
        initial={{ opacity: 0.5, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ repeat: Infinity, duration: 1.5, repeatType: "reverse", ease: "easeInOut" }}
        className="relative z-10"
      >
        <h1 className="text-5xl font-playfair font-bold italic tracking-tight text-transparent bg-clip-text bg-gradient-to-b from-brand-blush to-brand-rose">
          Perhaps
        </h1>
      </motion.div>
    </div>
  );
}
