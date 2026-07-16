/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#0b1326",
        surface: "#131b2e",
        "surface-low": "#060e20",
        "slate-border": "#334155",
        primary: "#adc6ff",
        accent: "#3B82F6",
        "text-muted": "#94A3B8",
        "on-surface": "#dae2fd",
        growth: "#10B981",
        risk: "#EF4444",
        warning: "#F59E0B",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      spacing: {
        "margin-desktop": "48px",
        "margin-mobile": "16px",
      },
    },
  },
  plugins: [],
};