import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cream: "#F6F1E7",
        beige: "#EAE0CF",
        ink: "#2B2620",
        gold: "#B8965A",
        "gold-light": "#CBAE77",
        sage: "#7C8B76",
        "sage-dark": "#4E5B49",
        line: "#DCCFB4",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      maxWidth: { content: "72rem" },
    },
  },
  plugins: [],
};
export default config;
