/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}",
    "./hooks/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // Morning
        "morning-canvas-from": "#F1F5F9",
        "morning-canvas-to": "#F0FDF4",
        "morning-text": "#1E293B",
        "morning-accent": "#D1FAE5",
        "morning-accent-deep": "#A7F3D0",
        // Afternoon
        "afternoon-canvas-from": "#F5F5F4",
        "afternoon-canvas-to": "#FAF9F6",
        "afternoon-text": "#1C1917",
        "afternoon-accent": "#E4E4E7",
        "afternoon-accent-deep": "#D4D4D8",
        // Evening
        "evening-canvas-from": "#1C1917",
        "evening-canvas-to": "#0F172A",
        "evening-text": "#E7E5E4",
        "evening-accent": "#7C2D12",
        "evening-border": "#FED7AA",
        // Night
        "night-canvas-from": "#020617",
        "night-canvas-to": "#09090B",
        "night-text": "#CBD5E1",
        "night-panel": "#0F172A",
        "night-accent": "#1E1B4B",
      },
      fontFamily: {
        sans: ["System"],
      },
    },
  },
  plugins: [],
};
