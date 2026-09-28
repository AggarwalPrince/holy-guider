/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        mystic: {
          950: "#06040f",
          900: "#0b091a",
          850: "#100d27",
          800: "#161136",
          700: "#241d57",
          600: "#3d328c",
        },
        astral: {
          950: "#040714",
          900: "#080e22",
          800: "#0f1738",
          700: "#182352",
        },
        sacred: {
          gold: "#f59e0b",
          light: "#fbbf24",
          amber: "#d97706",
          shimmer: "#fef3c7",
        },
      },
      fontFamily: {
        serif: ["Cinzel", "Georgia", "serif"],
        sans: ["Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        "gold-glow": "0 0 25px -5px rgba(245, 158, 11, 0.35)",
        "gold-intense": "0 0 35px 2px rgba(251, 191, 36, 0.45)",
        "purple-glow": "0 0 35px -5px rgba(126, 34, 206, 0.35)",
        "card-floating": "0 20px 40px -15px rgba(0, 0, 0, 0.6)",
      },
      animation: {
        "pulse-slow": "pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "spin-slow": "spin 25s linear infinite",
      },
    },
  },
  plugins: [],
};
