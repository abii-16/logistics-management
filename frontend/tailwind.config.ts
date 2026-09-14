import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        field: "#4f7d5a",
        harvest: "#f6b44b",
        soil: "#312a24",
        river: "#2f7f8f",
        chilli: "#d44d3d"
      },
      boxShadow: {
        panel: "0 18px 55px rgba(49, 42, 36, 0.10)"
      }
    }
  },
  plugins: []
};

export default config;

