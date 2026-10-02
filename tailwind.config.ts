import type { Config } from "tailwindcss";
const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        burgundy: { DEFAULT: "#5A0D14", dark: "#3d0a0e", light: "#7a1a22" },
        wine: { DEFAULT: "#260609", dark: "#130305" },
        charcoal: "#0D0D0D",
        blush: { DEFAULT: "#F6D7CF", dark: "#e8c4ba", light: "#faeae6" },
        "rose-gold": { DEFAULT: "#EBB4A5", dark: "#d99e8f", light: "#f5cec3" },
        taupe: { DEFAULT: "#6B5A57", light: "#8a7370", dark: "#4d3f3d" },
      },
      fontFamily: {
        playfair: ["Cormorant Garamond", "Playfair Display", "Georgia", "serif"],
        inter: ["Inter", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "perhaps-hero": "radial-gradient(ellipse 80% 60% at 15% 30%, rgba(90,13,20,0.6) 0%, transparent 70%), radial-gradient(ellipse 60% 80% at 85% 70%, rgba(38,6,9,0.8) 0%, transparent 60%)",
        "card-gradient": "linear-gradient(to top, rgba(13,13,13,0.95) 0%, rgba(13,13,13,0.4) 50%, transparent 100%)",
        "rose-shimmer": "linear-gradient(135deg, #EBB4A5 0%, #F6D7CF 40%, #EBB4A5 70%, #d99e8f 100%)",
      },
      boxShadow: {
        "perhaps-soft": "0 8px 24px rgba(0,0,0,0.25)",
        "perhaps-glow": "0 0 40px rgba(90,13,20,0.4)",
        "card-hover": "0 20px 60px rgba(0,0,0,0.5)",
        "rose-glow": "0 0 30px rgba(235,180,165,0.2)",
      },
      animation: {
        "fade-up": "fadeUp 0.6s ease-out forwards",
        "fade-in": "fadeIn 0.4s ease-out forwards",
        shimmer: "shimmer 2.5s linear infinite",
        float: "float 3s ease-in-out infinite",
        "pulse-soft": "pulseSoft 2s ease-in-out infinite",
      },
      keyframes: {
        fadeUp: { "0%": { opacity: "0", transform: "translateY(24px)" }, "100%": { opacity: "1", transform: "translateY(0)" } },
        fadeIn: { "0%": { opacity: "0" }, "100%": { opacity: "1" } },
        shimmer: { "0%": { backgroundPosition: "-200% center" }, "100%": { backgroundPosition: "200% center" } },
        float: { "0%, 100%": { transform: "translateY(0px)" }, "50%": { transform: "translateY(-8px)" } },
        pulseSoft: { "0%, 100%": { opacity: "1" }, "50%": { opacity: "0.6" } },
      },
    },
  },
  plugins: [],
};
export default config;
